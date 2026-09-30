/**
 * Private Alben (F48, FV-63, Issue #23) — Zone 2.
 *
 * PRÜFUNG ERFORDERLICH.
 *  * Bis zu P-ALBEN-MAX Alben je Konto, je Album bis P-ALBUM-MAX Bilder; kein Klassifikator,
 *    kein Mensch ohne Meldung (AK-F48-05).
 *  * Im Gespräch mit einem Tipp teilen — nur, wenn dort Bilder erlaubt sind (F43). Die
 *    empfangende Person öffnet das Album selbst (Ansehen = Annehmen) oder lehnt ab (AK-F48-01).
 *  * Auslieferung mit Wasserzeichen der empfangenden Person (AK-F48-03), nur solange die
 *    Freigabe gilt (AK-F48-04), mit Stufe 2, wenn der Schalter sie verlangt (AK-F48-06).
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

const nameSchema = z.string().trim().min(1).max(40);

async function ownAlbum(id: string, owner: string) {
  const a = await one(`SELECT * FROM albums WHERE id = $1 AND owner_id = $2`, [id, owner]);
  if (!a) throw notFound();
  return a;
}

export async function albumsOf(owner: string, viewerForUrls = owner) {
  const rows = await q(
    `SELECT al.id, al.name, al.position, al.created_at,
            (SELECT count(*)::int FROM private_media pm WHERE pm.album_id = al.id) AS n,
            (SELECT pm.id FROM private_media pm WHERE pm.album_id = al.id ORDER BY pm.position, pm.created_at LIMIT 1) AS cover
       FROM albums al WHERE al.owner_id = $1 ORDER BY al.position, al.created_at`,
    [owner],
  );
  return rows.map((r) => ({ id: r.id, name: r.name, count: r.n, cover: r.cover ? imgUrl('album', r.cover, viewerForUrls) : null }));
}

export default async function albumRoutes(app: FastifyInstance) {
  app.get('/api/albums', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    return { albums: await albumsOf(a.id), max: p('P-ALBEN-MAX'), imagesMax: p('P-ALBUM-MAX') };
  });

  app.post('/api/albums', async (req) => {
    const a = await requireMember(req, { write: true });
    const b = body(req, z.object({ name: nameSchema }));
    const n = await one(`SELECT count(*)::int AS n, coalesce(max(position), -1) + 1 AS next FROM albums WHERE owner_id = $1`, [a.id]);
    if (n!.n >= p('P-ALBEN-MAX')) throw bad('UI-ALBEN-MAX', { max: p('P-ALBEN-MAX') }, 'alben_max');
    const r = await one(`INSERT INTO albums (owner_id, name, position) VALUES ($1, $2, $3) RETURNING id`, [a.id, b.name, n!.next]);
    return { id: r!.id };
  });

  app.patch('/api/albums/:id', async (req) => {
    const a = await requireMember(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ name: nameSchema }));
    await ownAlbum(id, a.id);
    await q(`UPDATE albums SET name = $2 WHERE id = $1`, [id, b.name]);
    return { ok: true };
  });

  /** Album löschen — mit allen Bildern; laufende Freigaben enden damit. */
  app.delete('/api/albums/:id', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    const { id } = params(req, idParam);
    await ownAlbum(id, a.id);
    const viewers = await q(`SELECT viewer_id, conversation_id, id FROM album_shares WHERE album_id = $1 AND state IN ('offered','accepted')`, [id]);
    const files = await q(`SELECT file FROM private_media WHERE album_id = $1`, [id]);
    await tx(async (c) => {
      await c.query(`UPDATE album_shares SET state = 'ended', ended_at = now() WHERE album_id = $1 AND state IN ('offered','accepted')`, [id]);
      await c.query(`DELETE FROM private_media WHERE album_id = $1`, [id]);
      await c.query(`DELETE FROM albums WHERE id = $1`, [id]);
    });
    for (const f of files) await deleteFile('zone2', f.file);
    for (const v of viewers) emit(v.viewer_id, 'album_ende', { shareId: v.id, conversationId: v.conversation_id });
    return { ok: true };
  });

  app.get('/api/albums/:id', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    const { id } = params(req, idParam);
    const al = await ownAlbum(id, a.id);
    const rows = await q(`SELECT id FROM private_media WHERE album_id = $1 ORDER BY position, created_at`, [id]);
    const shares = await q(
      `SELECT s.id, s.viewer_id, s.state, s.created_at, pr.name FROM album_shares s
         LEFT JOIN profiles pr ON pr.account_id = s.viewer_id
        WHERE s.album_id = $1 AND s.state IN ('offered','accepted') ORDER BY s.created_at DESC`,
      [id],
    );
    return {
      album: { id: al.id, name: al.name },
      images: rows.map((r) => ({ id: r.id, url: imgUrl('album', r.id, a.id) })),
      max: p('P-ALBUM-MAX'),
      shares: shares.map((s) => ({ id: s.id, name: s.name, state: s.state })),
    };
  });

  app.post('/api/albums/:id/images', async (req) => {
    const a = await requireMember(req, { write: true });
    const { id } = params(req, idParam);
    await ownAlbum(id, a.id);
    const n = await one(`SELECT count(*)::int AS n FROM private_media WHERE album_id = $1`, [id]);
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
      `INSERT INTO private_media (owner_id, kind, file, width, height, hash_state, position, album_id)
       VALUES ($1, 'album', $2, $3, $4, $5, $6, $7) RETURNING id`,
      [a.id, file, prepared.width, prepared.height, hashState, n!.n, id],
    );
    return { id: r!.id };
  });

  app.delete('/api/albums/:id/images/:imageId', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    const { id, imageId } = params(req, z.object({ id: uuid, imageId: uuid }));
    const r = await one(`DELETE FROM private_media WHERE id = $1 AND owner_id = $2 AND album_id = $3 RETURNING file`, [imageId, a.id, id]);
    if (!r) throw notFound();
    await deleteFile('zone2', r.file);
    return { ok: true };
  });

  /** Album im Gespräch teilen (S31.03, Issue #23) — setzt die Medienfreigabe nach F43 voraus. */
  app.post('/api/album/offer', async (req) => {
    const a = await requireCleared(req);
    const b = body(req, z.object({ conversationId: uuid, albumId: uuid.optional() }));
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
    const album = b.albumId
      ? await one(`SELECT id FROM albums WHERE id = $1 AND owner_id = $2`, [b.albumId, a.id])
      : await one(`SELECT id FROM albums WHERE owner_id = $1 ORDER BY position, created_at LIMIT 1`, [a.id]);
    if (!album) throw bad('UI-ALBUM-LEER', {}, 'album_leer');
    const has = await one(`SELECT 1 FROM private_media WHERE album_id = $1 LIMIT 1`, [album.id]);
    if (!has) throw bad('UI-ALBUM-LEER', {}, 'album_leer');
    const open = await one(`SELECT id FROM album_shares WHERE album_id = $1 AND viewer_id = $2 AND state IN ('offered','accepted')`, [album.id, viewer]);
    if (open) return { shareId: open.id };
    const shareId = await tx(async (cl) => {
      const s = await one(
        `INSERT INTO album_shares (conversation_id, owner_id, viewer_id, state, album_id) VALUES ($1, $2, $3, 'offered', $4) RETURNING id`,
        [c.id, a.id, viewer, album.id],
        cl,
      );
      await cl.query(`INSERT INTO messages (conversation_id, sender_id, kind, ref_id) VALUES ($1, $2, 'album_offer', $3)`, [c.id, a.id, s!.id]);
      await cl.query(`UPDATE conversations SET last_message_at = now() WHERE id = $1`, [c.id]);
      return s!.id as string;
    });
    emit(viewer, 'nachricht', { conversationId: c.id });
    emit(a.id, 'nachricht', { conversationId: c.id });
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
    const s = await one(
      `SELECT s.*, al.name AS album_name FROM album_shares s LEFT JOIN albums al ON al.id = s.album_id WHERE s.id = $1 AND (s.viewer_id = $2 OR s.owner_id = $2)`,
      [id, a.id],
    );
    if (!s) throw notFound();
    const otherId = s.owner_id === a.id ? s.viewer_id : s.owner_id;
    if (await isBlockedEitherWay(a.id, otherId)) throw notFound();
    if (s.owner_id !== a.id) {
      if (s.state !== 'accepted') return { state: s.state, name: s.album_name, images: [] };
      if (stage2Required() && !(await stage2Satisfied(a))) {
        return { state: 'geschlossen', stage2: a.age2 ? 'bestaetigung_noetig' : 'pruefung_noetig', images: [] };
      }
    }
    const rows = await q(`SELECT id FROM private_media WHERE album_id = $1 ORDER BY position, created_at`, [s.album_id]);
    return { state: s.state, name: s.album_name, images: rows.map((r) => ({ id: r.id, url: imgUrl('album', r.id, a.id) })) };
  });
}

export { pair };
