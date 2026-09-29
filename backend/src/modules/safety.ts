/**
 * Blockieren (F61) und Treffpunkt vorschlagen (F56).
 *
 * PRÜFUNG ERFORDERLICH (Blockierlisten, Treffpunkt-Berechnung).
 *  * Blockierungen liegen nur auf dem Server und überleben Update, Neuinstallation
 *    und Gerätewechsel (AK-F61-03); sofort beidseitig wirksam; P-BLOCK-RUECKNAHME
 *    rücknehmbar; die zweite Blockierung derselben Person ist endgültig (FV-71).
 *  * Treffpunkte nur aus gerundeten Positionen; die Antwort enthält keinen Wert,
 *    aus dem sich die Position der Gegenseite genauer als ihr Band ergibt (AK-F56-01).
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { p } from '../config/params.js';
import { one, q, tx, type Queryable, db } from '../db/pool.js';
import { requireMember } from '../lib/context.js';
import { AppError, notFound } from '../lib/errors.js';
import { body, idParam, params, uuid } from '../lib/http.js';
import { band, distanceKm, midpoint, type LatLng } from '../lib/geo.js';
import { localParts } from '../lib/time.js';
import { emit } from '../services/hub.js';
import { initialOf } from '../services/profiles.js';
import { deleteHeldImages, pair, purgeConversation } from './chat.js';
import { dropImageCache } from './media.js';

/** Sofortwirkungen einer Blockierung (AK-F61-06, AK-X07-01, AK-F43-13, AK-F21-04). */
export async function applyBlockEffects(a: string, b: string, client: Queryable = db()) {
  await q(
    `UPDATE face_unlocks SET revoked_at = now()
      WHERE revoked_at IS NULL AND ((owner_id = $1 AND viewer_id = $2) OR (owner_id = $2 AND viewer_id = $1))`,
    [a, b],
    client,
  );
  await q(
    `UPDATE album_shares SET state = 'ended', ended_at = now()
      WHERE state IN ('offered','accepted') AND ((owner_id = $1 AND viewer_id = $2) OR (owner_id = $2 AND viewer_id = $1))`,
    [a, b],
    client,
  );
  await q(`DELETE FROM bookmarks WHERE (owner_id = $1 AND target_id = $2) OR (owner_id = $2 AND target_id = $1)`, [a, b], client);
  const [low, high] = pair(a, b);
  const conv = await one(`SELECT id FROM conversations WHERE user_low = $1 AND user_high = $2`, [low, high], client);
  if (conv) {
    await deleteHeldImages(conv.id);
    await q(`DELETE FROM media_grants WHERE conversation_id = $1 AND state = 'pending'`, [conv.id], client);
  }
  dropImageCache('c:');
}

export async function finalizeBlock(blockId: string) {
  const bl = await one(`SELECT blocker_id, blocked_id FROM blocks WHERE id = $1`, [blockId]);
  if (!bl) return;
  const [low, high] = pair(bl.blocker_id, bl.blocked_id);
  const conv = await one(`SELECT id FROM conversations WHERE user_low = $1 AND user_high = $2`, [low, high]);
  // AK-F61-07: endgültig → das Gespräch ist bei beiden gelöscht, außer Fallinhalten (eigene Kopien in report_items)
  if (conv) await purgeConversation(conv.id);
  await q(`UPDATE blocks SET final_at = COALESCE(final_at, now()), finalized_done = true WHERE id = $1`, [blockId]);
}

export async function blockUser(blocker: string, target: string, confirmFinal: boolean) {
  const active = await one(`SELECT id, revocable_until, final_at FROM blocks WHERE blocker_id = $1 AND blocked_id = $2 AND revoked_at IS NULL`, [
    blocker,
    target,
  ]);
  if (active) return { id: active.id as string, revocableUntil: active.final_at ? null : active.revocable_until, final: !!active.final_at };
  const revokedBefore = await one(`SELECT 1 FROM blocks WHERE blocker_id = $1 AND blocked_id = $2 AND revoked_at IS NOT NULL LIMIT 1`, [
    blocker,
    target,
  ]);
  // AK-F61-05: zweite Blockierung → vorher Rückfrage ST-BLO-06, dann sofort endgültig
  if (revokedBefore && !confirmFinal) throw new AppError(409, 'ST-BLO-06', {}, 'zweite_sperre');
  const id = await tx(async (c) => {
    const r = await one(
      `INSERT INTO blocks (blocker_id, blocked_id, revocable_until, final_at)
       VALUES ($1, $2, CASE WHEN $3 THEN NULL ELSE now() + make_interval(secs => $4) END, CASE WHEN $3 THEN now() END)
       RETURNING id, revocable_until`,
      [blocker, target, !!revokedBefore, p('P-BLOCK-RUECKNAHME')],
      c,
    );
    await applyBlockEffects(blocker, target, c);
    return r!;
  });
  if (revokedBefore) await finalizeBlock(id.id);
  // AK-F61-02: die blockierte Person erhält keine Nachricht — ihre Ansichten laden nur neu
  emit(blocker, 'blockierung', {});
  emit(target, 'aktualisieren', {});
  return { id: id.id as string, revocableUntil: revokedBefore ? null : id.revocable_until, final: !!revokedBefore };
}

function openToday(hours: Record<string, [string, string][]> | null): boolean | null {
  if (!hours || !Object.keys(hours).length) return null; // unbekannt
  const keys = ['mo', 'di', 'mi', 'do', 'fr', 'sa', 'so'];
  const day = keys[localParts(new Date()).weekday - 1];
  return (hours[day]?.length ?? 0) > 0;
}

export default async function safetyRoutes(app: FastifyInstance) {
  app.post('/api/blocks', async (req) => {
    // AK-F61-09: ohne Abo und ohne Obergrenze
    const a = await requireMember(req, { allowDeletionPending: true, allowSuspended: true });
    const b = body(req, z.object({ targetId: uuid, confirmFinal: z.boolean().optional() }));
    if (b.targetId === a.id) throw notFound();
    const exists = await one(`SELECT 1 FROM accounts WHERE id = $1`, [b.targetId]);
    if (!exists) throw notFound();
    const res = await blockUser(a.id, b.targetId, !!b.confirmFinal);
    const name = await one(`SELECT name FROM profiles WHERE account_id = $1`, [b.targetId]);
    return { ...res, name: name?.name ?? null, barSeconds: p('P-BLOCK-LEISTE') };
  });

  app.delete('/api/blocks/:id', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true, allowSuspended: true });
    const { id } = params(req, idParam);
    // AK-F61-04: nur innerhalb von P-BLOCK-RUECKNAHME und nur, solange nicht endgültig
    const r = await one(
      `UPDATE blocks SET revoked_at = now()
        WHERE id = $1 AND blocker_id = $2 AND revoked_at IS NULL AND final_at IS NULL AND revocable_until > now()
        RETURNING blocked_id`,
      [id, a.id],
    );
    if (!r) throw new AppError(409, 'UI-ZU-SPAET', {}, 'nicht_mehr_ruecknehmbar');
    emit(a.id, 'blockierung', {});
    emit(r.blocked_id, 'aktualisieren', {});
    return { ok: true };
  });

  app.get('/api/blocks', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true, allowSuspended: true });
    const rows = await q(
      `SELECT b.id, b.revocable_until, b.final_at, pr.name, pr.initial_color
         FROM blocks b LEFT JOIN profiles pr ON pr.account_id = b.blocked_id
        WHERE b.blocker_id = $1 AND b.revoked_at IS NULL ORDER BY b.created_at DESC`,
      [a.id],
    );
    // AK-F61-08: ohne Fotos
    return {
      blocks: rows.map((r) => ({
        id: r.id,
        name: r.name ?? null,
        initial: r.name ? initialOf(r.name) : '?',
        color: r.initial_color ?? '#3b4cc0',
        revocableUntil: !r.final_at && r.revocable_until && new Date(r.revocable_until) > new Date() ? r.revocable_until : null,
        final: !!r.final_at || !r.revocable_until || new Date(r.revocable_until) <= new Date(),
      })),
    };
  });

  /** Treffpunkt vorschlagen (F56, FV-66). */
  app.get('/api/meeting', async (req) => {
    const a = await requireMember(req);
    const convId = (req.query as { conversation?: string }).conversation;
    const mine = await one(`SELECT cell_lat, cell_lng, level, city_id FROM locations WHERE account_id = $1`, [a.id]);
    let own: LatLng | null = mine?.cell_lat != null ? { lat: mine.cell_lat, lng: mine.cell_lng } : null;
    if (!own && mine?.city_id) {
      const c = await one(`SELECT lat, lng FROM cities WHERE id = $1`, [mine.city_id]);
      if (c) own = { lat: c.lat, lng: c.lng };
    }
    let theirs: LatLng | null = null;
    if (convId && uuid.safeParse(convId).success) {
      const c = await one(
        `SELECT user_low, user_high, low_text_at, high_text_at FROM conversations WHERE id = $1 AND (user_low = $2 OR user_high = $2)`,
        [convId, a.id],
      );
      if (!c) throw notFound();
      if (!c.low_text_at || !c.high_text_at) throw new AppError(403, 'UI-TREFFPUNKT-SPAETER', {}, 'erst_beide');
      const otherId = c.user_low === a.id ? c.user_high : c.user_low;
      // Gegenseite: nur ihr Anzeige-Punkt (gerundet oder Ersatzpunkt); in einer Zone oder bei „Aus“ zählt sie nicht (AK-X12-01, AK-X17-01)
      const l = await one(
        `SELECT display_lat, display_lng FROM locations WHERE account_id = $1 AND level <> 'aus' AND NOT invisible AND NOT in_zone`,
        [otherId],
      );
      if (l?.display_lat != null) theirs = { lat: l.display_lat, lng: l.display_lng };
    }
    const ref = own && theirs ? midpoint(own, theirs) : (own ?? theirs);
    if (!ref) return { places: [], needsLocation: true };
    const candidates = await q(
      `SELECT id, name, kind, district, lat, lng, opening_hours, claimed_at FROM places
        WHERE removed_at IS NULL AND abs(lat - $1) < 0.3 AND abs(lng - $2) < 0.45`,
      [ref.lat, ref.lng],
    );
    const withDist = candidates
      .map((pl) => ({ pl, dMid: distanceKm(ref, { lat: pl.lat, lng: pl.lng }), open: openToday(pl.opening_hours) }))
      .filter((x) => x.open !== false); // AK-F56-04
    let near = withDist.filter((x) => x.dMid <= 5);
    if (!near.length && own) near = withDist.filter((x) => distanceKm(own!, { lat: x.pl.lat, lng: x.pl.lng }) <= 10);
    const out = near
      .map((x) => ({
        id: x.pl.id,
        name: x.pl.name,
        kind: x.pl.kind,
        district: x.pl.district,
        confirmed: !!x.pl.claimed_at,
        // nur das Band zur eigenen Position — nie eine Entfernung zur Gegenseite oder zur Mitte (FV-66)
        band: own ? band(distanceKm(own, { lat: x.pl.lat, lng: x.pl.lng })) : null,
        openToday: x.open,
      }))
      .sort((x, y) => (x.band ?? 9) - (y.band ?? 9) || x.name.localeCompare(y.name, 'de'))
      .slice(0, 20);
    return { places: out };
  });
}
