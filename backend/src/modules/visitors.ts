/**
 * Profilbesucher (Issue #27) und Abo-Stand für die Oberfläche.
 *
 * PRÜFUNG ERFORDERLICH.
 *  * Nur das Öffnen eines Profils zählt, je Besucher, Profil und Tag ein Eintrag.
 *  * Nicht gespeichert: eigene Besuche, Besuche mit Blockierung (in beide Richtungen), von
 *    gesperrten Konten und im Modus „Unsichtbar stöbern“ (Premium) — dann gibt es gar keinen Eintrag.
 *  * Kostenlos: nur Anzahl und unkenntliche Vorschau — über die Schnittstelle keine Kennungen,
 *    keine Namen, keine Zeitpunkte. Premium: Liste mit Kachel, Entfernung, grober Zeit.
 *  * Nach P-BESUCHE-TAGE gelöscht (Aufräumauftrag).
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { p } from '../config/params.js';
import { one, q } from '../db/pool.js';
import { requireMember } from '../lib/context.js';
import { AppError } from '../lib/errors.js';
import { body } from '../lib/http.js';
import { localDateString } from '../lib/time.js';
import { hasTier } from '../services/entitlements.js';
import { imgUrl } from '../services/media-tokens.js';
import { CARD_COLUMNS, toTile, viewerFor } from '../services/profiles.js';

/** Premium im Sinne der Profilbesucher (PLUS oder PRO). */
export const isPremium = (accountId: string) => hasTier(accountId, 'plus');

/** Besuch speichern — außer im unsichtbaren Modus (Premium). Blockierungen prüft der Aufrufer (Profil sichtbar). */
export async function recordVisit(visitorId: string, targetId: string) {
  if (visitorId === targetId) return;
  const me = await one(`SELECT invisible_browsing FROM profiles WHERE account_id = $1`, [visitorId]);
  if (me?.invisible_browsing && (await isPremium(visitorId))) return;
  const acc = await one(`SELECT moderation_state FROM accounts WHERE id = $1`, [visitorId]);
  if (acc?.moderation_state === 'suspended') return;
  await q(
    `INSERT INTO profile_visits (visitor_id, target_id, day, visited_at) VALUES ($1, $2, $3, now())
     ON CONFLICT (visitor_id, target_id, day) DO UPDATE SET visited_at = now()`,
    [visitorId, targetId, localDateString(new Date())],
  );
}

const VISIBLE_VISITOR = `
  a.status = 'active' AND a.deletion_requested_at IS NULL AND a.moderation_state <> 'suspended' AND a.minor_locked_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM blocks b WHERE b.revoked_at IS NULL
        AND ((b.blocker_id = $1 AND b.blocked_id = a.id) OR (b.blocker_id = a.id AND b.blocked_id = $1)))`;

function whenBand(at: Date): 'heute' | 'gestern' | 'woche' | 'frueher' {
  const today = localDateString(new Date());
  const d = localDateString(at);
  if (d === today) return 'heute';
  if (d === localDateString(new Date(Date.now() - 86400_000))) return 'gestern';
  if (Date.now() - at.getTime() < 7 * 86400_000) return 'woche';
  return 'frueher';
}

export default async function visitorRoutes(app: FastifyInstance) {
  app.get('/api/visitors', async (req) => {
    const a = await requireMember(req);
    const premium = await isPremium(a.id);
    const rows = await q(
      `SELECT DISTINCT ON (a.id) ${CARD_COLUMNS}, v.visited_at
         FROM profile_visits v
         JOIN accounts a ON a.id = v.visitor_id
         JOIN profiles pr ON pr.account_id = a.id
         LEFT JOIN locations l ON l.account_id = a.id
        WHERE v.target_id = $1 AND v.visited_at > now() - make_interval(days => $2) AND ${VISIBLE_VISITOR}
        ORDER BY a.id, v.visited_at DESC`,
      [a.id, p('P-BESUCHE-TAGE')],
    );
    rows.sort((x, y) => new Date(y.visited_at).getTime() - new Date(x.visited_at).getTime());
    const seen = await one(`SELECT visitors_seen_at FROM profiles WHERE account_id = $1`, [a.id]);
    await q(`UPDATE profiles SET visitors_seen_at = now() WHERE account_id = $1`, [a.id]);
    const fresh = rows.filter((r) => !seen?.visitors_seen_at || new Date(r.visited_at) > new Date(seen.visitors_seen_at)).length;
    if (!premium) {
      // Kostenlos: Anzahl und unkenntliche Vorschau — keine Kennungen, keine Namen, keine Zeiten
      return {
        premium: false,
        count: rows.length,
        fresh,
        previews: rows.slice(0, 6).map((r) => {
          const ph = /^\(([^,]+),/.exec(r.first_photo ?? '')?.[1];
          return { color: r.initial_color, image: r.photo_mode === 'photo' && ph ? imgUrl('teaser', ph, a.id) : null };
        }),
        days: p('P-BESUCHE-TAGE'),
      };
    }
    const viewer = await viewerFor(a.id);
    return {
      premium: true,
      count: rows.length,
      fresh,
      visitors: rows.map((r) => ({ ...toTile(r, viewer), when: whenBand(new Date(r.visited_at)) })),
      days: p('P-BESUCHE-TAGE'),
    };
  });

  /** Zahl neuer Besucher seit dem letzten Blick (Punkt am Reiter „Ich“) — ohne Identitäten. */
  app.get('/api/visitors/new', async (req) => {
    const a = await requireMember(req);
    const r = await one(
      `SELECT count(DISTINCT v.visitor_id)::int AS n FROM profile_visits v JOIN accounts a ON a.id = v.visitor_id
         JOIN profiles me ON me.account_id = $1
        WHERE v.target_id = $1 AND (me.visitors_seen_at IS NULL OR v.visited_at > me.visitors_seen_at) AND ${VISIBLE_VISITOR}`,
      [a.id],
    );
    return { count: r!.n };
  });

  /** Unsichtbar stöbern (Premium). Ohne Premium lässt es sich nicht einschalten. */
  app.put('/api/visitors/invisible', async (req) => {
    const a = await requireMember(req);
    const b = body(req, z.object({ on: z.boolean() }));
    if (b.on && !(await isPremium(a.id))) throw new AppError(403, 'UI-BESUCHER-PREMIUM', {}, 'premium_noetig');
    await q(`UPDATE profiles SET invisible_browsing = $2 WHERE account_id = $1`, [a.id, b.on]);
    return { ok: true };
  });

  /** Abo-Stand für die Oberfläche. */
  app.get('/api/premium', async (req) => {
    const a = await requireMember(req);
    const e = await one(`SELECT tier, valid_until, source FROM entitlements WHERE account_id = $1 AND valid_until > now() ORDER BY valid_until DESC LIMIT 1`, [a.id]);
    return { plus: await isPremium(a.id), pro: await hasTier(a.id, 'pro'), until: e?.valid_until ?? null, source: e?.source ?? null };
  });
}
