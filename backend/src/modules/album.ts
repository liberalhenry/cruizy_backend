/**
 * Private Alben (F48, FV-63) — Zone 2.
 *
 * PRÜFUNG ERFORDERLICH.
 *  * Ein Album je Konto, bis P-ALBUM-MAX Bilder; kein Klassifikator, kein Mensch
 *    ohne Meldung (AK-F48-05).
 *  * Beidseitige Freigabe: anbieten, annehmen. Vor der Annahme kein Bild (AK-F48-01).
 *  * Auslieferung mit Wasserzeichen der empfangenden Person (AK-F48-03), nur solange
 *    die Freigabe gilt (AK-F48-04), mit Stufe 2, wenn der Schalter sie verlangt (AK-F48-06).
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { p } from '../config/params.js';
import { one, q, tx } from '../db/pool.js';
import { requireCleared, requireMember } from '../lib/context.js';
import { AppError, bad, notFound } from '../lib/errors.js';
import { deleteFile, putFile } from '../lib/files.js';
import { body, idParam, params, uuid } from '../lib/http.js';
import { prepare } from '../lib/images.js';
import { runHashCheck } from '../providers/checks.js';
import { emit } from '../services/hub.js';
import { imgUrl } from '../services/media-tokens.js';
import { openHashCase } from '../services/photo-chain.js';
import { isBlockedEitherWay } from '../services/profiles.js';
import { stage2Required, stage2Satisfied } from '../services/stage2.js';
import { mediaGate, pair, type ConvRow } from './chat.js';
import { readUpload } from './photos.js';

export default async function albumRoutes(app: FastifyInstance) {
  app.get('/api/album', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    const rows = await q(`SELECT id FROM private_media WHERE owner_id = $1 AND kind = 'album' ORDER BY position, created_at`, [a.id]);
    const shares = await q(
      `SELECT s.id, s.viewer_id, s.state, s.created_at, pr.name FROM album_shares s
         LEFT JOIN profiles pr ON pr.account_id = s.viewer_id
        WHERE s.owner_id = $1 AND s.state IN ('offered','accepted') ORDER BY s.created_at DESC`,
      [a.id],
    );
    return {
      images: rows.map((r) => ({ id: r.id, url: imgUrl('album', r.id, a.id) })),
      max: p('P-ALBUM-MAX'),
      shares: shares.map((s) => ({ id: s.id, name: s.name, state: s.state })),
    };
  });

  app.post('/api/album', async (req) => {
    const a = await requireMember(req, { write: true });
    const n = await one(`SELECT count(*)::int AS n FROM private_media WHERE owner_id = $1 AND kind = 'album'`, [a.id]);
    if (n!.n >= p('P-ALBUM-MAX')) throw bad('UI-ALBUM-MAX', { max: p('P-ALBUM-MAX') }, 'album_max');
    const { buffer } = await readUpload(req);
    const prepared = await prepare(buffer);
    let hashState: 'checked' | 'pending' | 'skipped' = 'skipped';
    if (p('P-ZONE2-ABGLEICH')) {
      const h = await runHashCheck(prepared.data);
      hashState = h.state;
      if (h.hit) {
        const tmp = await putFile('zone2', prepared.data);
        await openHashCase({ zone: 2, accountId: a.id, file: tmp, store: 'zone2', hash: h.hash, list: h.list ?? 'unbekannt' });
        await deleteFile('zone2', tmp);
        throw new AppError(400, 'ST-FEH-33', {}, 'nicht_gespeichert');
      }
    }
    const file = await putFile('zone2', prepared.data);
    const r = await one(
      `INSERT INTO private_media (owner_id, kind, file, width, height, hash_state, position)
       VALUES ($1, 'album', $2, $3, $4, $5, $6) RETURNING id`,
      [a.id, file, prepared.width, prepared.height, hashState, n!.n],
    );
    return { id: r!.id };
  });

  app.delete('/api/album/:id', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    const { id } = params(req, idParam);
    const r = await one(`DELETE FROM private_media WHERE id = $1 AND owner_id = $2 AND kind = 'album' RETURNING file`, [id, a.id]);
    if (!r) throw notFound();
    await deleteFile('zone2', r.file);
    return { ok: true };
  });

  /** Album im Gespräch anbieten (S31.03) — setzt die Medienfreigabe nach F43 voraus. */
  app.post('/api/album/offer', async (req) => {
    const a = await requireCleared(req);
    const b = body(req, z.object({ conversationId: uuid }));
    const c = await one<ConvRow>(`SELECT * FROM conversations WHERE id = $1 AND (user_low = $2 OR user_high = $2) AND state = 'open'`, [
      b.conversationId,
      a.id,
    ]);
    if (!c) throw notFound();
    const viewer = c.user_low === a.id ? c.user_high : c.user_low;
    if (await isBlockedEitherWay(a.id, viewer)) throw notFound();
    const gate = await mediaGate(c, a.id);
    if (gate.kind === 'blocked') throw new AppError(403, 'ST-FEH-30', { name: '' }, 'erstkontakt_nur_text');
    if (gate.kind !== 'allowed') throw new AppError(403, 'UI-ALBUM-NICHT-JETZT', {}, 'noch_nicht');
    if (stage2Required() && !(await stage2Satisfied(a))) throw new AppError(403, 'ST-VER-41', {}, 'stufe2_noetig');
    const has = await one(`SELECT 1 FROM private_media WHERE owner_id = $1 AND kind = 'album' LIMIT 1`, [a.id]);
    if (!has) throw bad('UI-ALBUM-LEER', {}, 'album_leer');
    const open = await one(`SELECT id FROM album_shares WHERE owner_id = $1 AND viewer_id = $2 AND state IN ('offered','accepted')`, [a.id, viewer]);
    if (open) return { shareId: open.id };
    const shareId = await tx(async (cl) => {
      const s = await one(
        `INSERT INTO album_shares (conversation_id, owner_id, viewer_id, state) VALUES ($1, $2, $3, 'offered') RETURNING id`,
        [c.id, a.id, viewer],
        cl,
      );
      await cl.query(`INSERT INTO messages (conversation_id, sender_id, kind, ref_id) VALUES ($1, $2, 'album_offer', $3)`, [c.id, a.id, s!.id]);
      await cl.query(`UPDATE conversations SET last_message_at = now() WHERE id = $1`, [c.id]);
      return s!.id as string;
    });
    emit(viewer, 'nachricht', { conversationId: c.id });
    return { shareId };
  });

  app.post('/api/album/shares/:id/answer', async (req) => {
    const a = await requireMember(req, { write: true });
    const { id } = params(req, idParam);
    const b = body(req, z.object({ accept: z.boolean() }));
    const s = await one(`SELECT * FROM album_shares WHERE id = $1 AND viewer_id = $2 AND state = 'offered'`, [id, a.id]);
    if (!s || (await isBlockedEitherWay(a.id, s.owner_id))) throw notFound();
    await q(`UPDATE album_shares SET state = $2, decided_at = now() WHERE id = $1`, [id, b.accept ? 'accepted' : 'declined']);
    // AK-F48-02: die anbietende Person sieht nur, dass abgelehnt wurde
    emit(s.owner_id, 'nachricht', { conversationId: s.conversation_id });
    return { ok: true };
  });

  /** „Nicht mehr zeigen“ — wirkt nur vorwärts (AK-F48-04). */
  app.post('/api/album/shares/:id/end', async (req) => {
    const a = await requireMember(req);
    const { id } = params(req, idParam);
    const s = await one(
      `UPDATE album_shares SET state = 'ended', ended_at = now() WHERE id = $1 AND owner_id = $2 AND state IN ('offered','accepted') RETURNING viewer_id, conversation_id`,
      [id, a.id],
    );
    if (!s) throw notFound();
    emit(s.viewer_id, 'album_ende', { shareId: id, conversationId: s.conversation_id });
    return { ok: true };
  });

  /** Album ansehen — nur mit angenommener Freigabe. */
  app.get('/api/album/shares/:id', async (req) => {
    const a = await requireMember(req);
    const { id } = params(req, idParam);
    const s = await one(`SELECT * FROM album_shares WHERE id = $1 AND (viewer_id = $2 OR owner_id = $2)`, [id, a.id]);
    if (!s) throw notFound();
    const otherId = s.owner_id === a.id ? s.viewer_id : s.owner_id;
    if (await isBlockedEitherWay(a.id, otherId)) throw notFound();
    if (s.owner_id !== a.id) {
      if (s.state !== 'accepted') return { state: s.state, images: [] };
      if (stage2Required() && !(await stage2Satisfied(a))) {
        return { state: 'geschlossen', stage2: a.age2 ? 'bestaetigung_noetig' : 'pruefung_noetig', images: [] };
      }
    }
    const rows = await q(`SELECT id FROM private_media WHERE owner_id = $1 AND kind = 'album' ORDER BY position, created_at`, [s.owner_id]);
    return { state: s.state, images: rows.map((r) => ({ id: r.id, url: imgUrl('album', r.id, a.id) })) };
  });
}

export { pair };
