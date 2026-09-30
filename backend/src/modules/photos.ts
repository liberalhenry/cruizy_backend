/**
 * Eigene Profilfotos (F10, F11, F72). Hochladen, Status, Reihenfolge, Löschen, Einspruch.
 */
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { ensureAppealTicket } from '../services/postfach.js';
import { p } from '../config/params.js';
import { one, q, tx } from '../db/pool.js';
import { requireMember } from '../lib/context.js';
import { bad, notFound, tooMany } from '../lib/errors.js';
import { deleteFile, putFile } from '../lib/files.js';
import { body, idParam, params } from '../lib/http.js';
import { prepare } from '../lib/images.js';
import { hit } from '../lib/rate.js';
import { runPhotoChain, regeneratePublic } from '../services/photo-chain.js';
import { imgUrl } from '../services/media-tokens.js';
import { nextNumber } from '../lib/numbers.js';
import { encStr } from '../lib/crypto.js';
import { discord } from '../services/discord.js';

export async function readUpload(req: FastifyRequest): Promise<{ buffer: Buffer; fields: Record<string, string> }> {
  const part = await req.file();
  if (!part) throw bad('UI-EINGABE-PRUEFEN', {}, 'datei_fehlt');
  const buffer = await part.toBuffer();
  if (part.file.truncated) throw bad('ST-FEH-10', { mb: p('P-BILD-MAX-MB') }, 'bild_zu_gross');
  const fields: Record<string, string> = {};
  for (const [k, v] of Object.entries(part.fields)) {
    const f = v as { value?: unknown };
    if (f && typeof f.value === 'string') fields[k] = f.value;
  }
  return { buffer, fields };
}

export async function ownPhotos(accountId: string) {
  const rows = await q(
    `SELECT id, position, status, blurred, rejection_reason, rejection_area, hash_state, decided_auto, created_at
       FROM photos WHERE account_id = $1 ORDER BY position, created_at`,
    [accountId],
  );
  return rows.map((r) => ({
    id: r.id,
    position: r.position,
    // Ein Hash-Treffer sieht aus wie „in Prüfung“ — ohne Text, ohne Bild (AK-F10-04, ST-FEH-17)
    status: (r.status === 'blocked' ? 'queued' : r.status) as 'checking' | 'queued' | 'approved' | 'rejected',
    blurred: r.blurred,
    rejection: r.status === 'rejected' ? { reason: r.rejection_reason, area: r.rejection_area, auto: r.decided_auto } : null,
    url: r.status === 'blocked' ? null : imgUrl('own', r.id, accountId),
  }));
}

export default async function photoRoutes(app: FastifyInstance) {
  app.get('/api/photos', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    return { photos: await ownPhotos(a.id), max: p('P-FOTOS-MAX'), hours: Math.round(p('P-FRIST-GRAU') / 3600) };
  });

  app.post('/api/photos', async (req) => {
    const a = await requireMember(req, { write: false });
    if (!hit('upload', a.id, 30, 3600_000)) throw tooMany();
    const count = await one(`SELECT count(*)::int AS n FROM photos WHERE account_id = $1 AND status NOT IN ('rejected','blocked')`, [a.id]);
    if (count!.n >= p('P-FOTOS-MAX')) throw bad('UI-FOTOS-MAX', { max: p('P-FOTOS-MAX') }, 'fotos_max'); // Issue #13: bis zu 20
    const { buffer, fields } = await readUpload(req);
    // Stufe 0: Format, Größe, Metadaten — vor jedem anderen Schritt (AK-F72-02)
    const prepared = await prepare(buffer);
    const file = await putFile('zone1-original', prepared.data);
    const pos = await one(`SELECT coalesce(max(position), -1) + 1 AS n FROM photos WHERE account_id = $1`, [a.id]);
    const ph = await one(
      `INSERT INTO photos (account_id, position, blurred, original_file, width, height)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [a.id, pos!.n, fields.blurred === 'true', file, prepared.width, prepared.height],
    );
    await q(`UPDATE profiles SET photo_mode = 'photo' WHERE account_id = $1`, [a.id]);
    const outcome = await runPhotoChain(ph!.id);
    return {
      id: ph!.id,
      // Treffer werden wie „in Prüfung“ angezeigt — kein Text, kein Grund (AK-F10-04)
      status: outcome === 'blocked' ? 'queued' : outcome,
      hours: Math.round(p('P-FRIST-GRAU') / 3600),
    };
  });

  app.patch('/api/photos/:id', async (req) => {
    const a = await requireMember(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ blurred: z.boolean() }));
    const ph = await one(`SELECT id, blurred, status FROM photos WHERE id = $1 AND account_id = $2`, [id, a.id]);
    if (!ph) throw notFound();
    if (ph.blurred !== b.blurred) {
      await q(`UPDATE photos SET blurred = $2 WHERE id = $1`, [id, b.blurred]);
      // wirkt sofort bei freigegebenen Fotos, sonst mit der Freigabe
      if (ph.status === 'approved') await regeneratePublic(id);
    }
    return { ok: true };
  });

  // Reihenfolge ohne Ziehen (AK-F10-07): vollständige Liste der Kennungen
  app.put('/api/photos/order', async (req) => {
    const a = await requireMember(req);
    const b = body(req, z.object({ ids: z.array(z.string().uuid()).max(p('P-FOTOS-MAX')) }));
    await tx(async (c) => {
      for (let i = 0; i < b.ids.length; i++) {
        await c.query(`UPDATE photos SET position = $3 WHERE id = $1 AND account_id = $2`, [b.ids[i], a.id, i]);
      }
    });
    return { ok: true };
  });

  app.delete('/api/photos/:id', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    const { id } = params(req, idParam);
    const ph = await one(`DELETE FROM photos WHERE id = $1 AND account_id = $2 AND status <> 'blocked' RETURNING original_file, public_file`, [id, a.id]);
    if (!ph) throw notFound();
    await deleteFile('zone1-original', ph.original_file);
    await deleteFile('zone1-public', ph.public_file);
    const left = await one(`SELECT count(*)::int AS n FROM photos WHERE account_id = $1 AND status = 'approved'`, [a.id]);
    // letztes Foto gelöscht → Initiale (F13)
    if (!left!.n) await q(`UPDATE profiles SET photo_mode = 'initial' WHERE account_id = $1`, [a.id]);
    return { ok: true };
  });

  app.put('/api/profile/photo-mode', async (req) => {
    const a = await requireMember(req);
    const b = body(req, z.object({ mode: z.enum(['photo', 'initial']), color: z.string().optional() }));
    const colors = p('P-INITIALE-FARBEN') as readonly string[];
    if (b.color && !colors.includes(b.color)) throw bad('UI-EINGABE-PRUEFEN');
    await q(`UPDATE profiles SET photo_mode = $2, initial_color = COALESCE($3, initial_color) WHERE account_id = $1`, [a.id, b.mode, b.color ?? null]);
    return { ok: true };
  });

  // Einspruch gegen die Ablehnung eines Fotos (M-07, 48 h)
  app.post('/api/photos/:id/appeal', async (req) => {
    const a = await requireMember(req, { allowSuspended: true });
    const { id } = params(req, idParam);
    const b = body(req, z.object({ text: z.string().min(1).max(2000) }));
    const ph = await one(`SELECT id, decided_by, decided_auto FROM photos WHERE id = $1 AND account_id = $2 AND status = 'rejected'`, [id, a.id]);
    if (!ph) throw notFound();
    const exists = await one(`SELECT number FROM appeals WHERE photo_id = $1 AND decided_at IS NULL`, [id]);
    if (exists) return { number: exists.number, hours: 48 };
    const number = await nextNumber('E');
    const created = await one(
      `INSERT INTO appeals (number, account_id, kind, photo_id, text_enc, original_decider, original_auto, deadline_at)
       VALUES ($1, $2, 'bild', $3, $4, $5, $6, now() + make_interval(secs => $7)) RETURNING id`,
      [
        number,
        a.id,
        id,
        encStr('tickets', b.text, 'appeal'),
        /^[0-9a-f-]{36}$/.test(ph.decided_by ?? '') ? ph.decided_by : null,
        !!ph.decided_auto,
        p('P-FRIST-EINSPRUCH-BILD'),
      ],
    );
    // Postfach: jeder Einspruch bekommt ein Ticket
    await ensureAppealTicket(created!.id);
    discord('meldungen', { title: `Neuer Einspruch ${number}`, level: 'info', fields: [{ name: 'Art', value: 'abgelehntes Profilfoto' }] });
    return { number, hours: Math.round(p('P-FRIST-EINSPRUCH-BILD') / 3600) };
  });
}
