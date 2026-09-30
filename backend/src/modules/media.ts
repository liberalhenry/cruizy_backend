/**
 * Auslieferung von Bildern über befristete Adressen.
 *
 * PRÜFUNG ERFORDERLICH.
 *
 * Jede Auslieferung prüft die Berechtigung zum Zeitpunkt des Abrufs — nicht
 * nur beim Ausstellen der Adresse. Freie Fassungen unkenntlicher Fotos,
 * Albumbilder und Bilder im Gespräch tragen ein unsichtbares Wasserzeichen mit
 * der Kennung der empfangenden Person (AK-F12-03, AK-F48-03).
 */
import type { FastifyInstance, FastifyReply } from 'fastify';
import { z } from 'zod';
import { p } from '../config/params.js';
import { one } from '../db/pool.js';
import { loadAccount } from '../lib/context.js';
import { getFile } from '../lib/files.js';
import { params } from '../lib/http.js';
import { applyWatermark, clearVersion, guestVersion, privateVersion } from '../lib/images.js';
import { readImgToken } from '../services/media-tokens.js';
import { canSee, isBlockedEitherWay } from '../services/profiles.js';
import { stage2Satisfied } from '../services/stage2.js';

const cache = new Map<string, Buffer>();
let cacheBytes = 0;
const CACHE_MAX = 48 * 1024 * 1024;

function cacheGet(k: string) {
  const v = cache.get(k);
  if (v) {
    cache.delete(k);
    cache.set(k, v);
  }
  return v;
}
function cachePut(k: string, v: Buffer) {
  cache.set(k, v);
  cacheBytes += v.length;
  while (cacheBytes > CACHE_MAX) {
    const first = cache.keys().next().value as string;
    cacheBytes -= cache.get(first)!.length;
    cache.delete(first);
  }
}

export function dropImageCache(prefix: string) {
  for (const k of [...cache.keys()]) {
    if (k.startsWith(prefix)) {
      cacheBytes -= cache.get(k)!.length;
      cache.delete(k);
    }
  }
}

function send(reply: FastifyReply, data: Buffer, expires: number) {
  const maxAge = Math.max(0, Math.floor((expires - Date.now()) / 1000));
  reply.header('content-type', 'image/jpeg');
  reply.header('cache-control', `private, max-age=${Math.min(maxAge, p('P-BILDLINK-GUELTIG'))}`);
  reply.header('content-disposition', 'inline');
  return reply.send(data);
}

const deny = (reply: FastifyReply) => reply.status(404).send({ fehler: 'UI-NICHT-VERFUEGBAR' });

export default async function mediaRoutes(app: FastifyInstance) {
  app.get('/api/img/:token', async (req, reply) => {
    const { token } = params(req, z.object({ token: z.string().max(2000) }));
    const tok = readImgToken(token);
    if (!tok) return deny(reply);
    const acc = await loadAccount(req);

    if (tok.k === 'photo') {
      const ph = await one(
        `SELECT id, account_id, public_file, original_file, blurred, status FROM photos WHERE id = $1`,
        [tok.id],
      );
      if (!ph || ph.status !== 'approved' || !ph.public_file) return deny(reply);
      if (tok.v === 'guest') {
        if (!tok.r.startsWith('gast')) return deny(reply);
        const k = `g:${ph.public_file}`;
        let data = cacheGet(k);
        if (!data) cachePut(k, (data = await guestVersion(await getFile('zone1-public', ph.public_file))));
        return send(reply, data, tok.e);
      }
      // Die Adresse gilt nur für die Person, für die sie ausgestellt wurde
      if (!acc || acc.id !== tok.r) return deny(reply);
      if (!(await canSee(acc.id, ph.account_id))) return deny(reply);
      if (tok.v === 'clear' && ph.blurred) {
        const unlocked = await one(
          `SELECT 1 FROM face_unlocks WHERE owner_id = $1 AND viewer_id = $2 AND revoked_at IS NULL`,
          [ph.account_id, acc.id],
        );
        if (!unlocked) return deny(reply); // AK-F12-02: nach Rücknahme keine freie Fassung mehr
        const k = `c:${ph.id}:${acc.id}`;
        let data = cacheGet(k);
        if (!data) {
          const clear = await clearVersion(await getFile('zone1-original', ph.original_file));
          cachePut(k, (data = await applyWatermark(clear, acc.id)));
        }
        return send(reply, data, tok.e);
      }
      const k = `p:${ph.public_file}`;
      let data = cacheGet(k);
      if (!data) cachePut(k, (data = await getFile('zone1-public', ph.public_file)));
      return send(reply, data, tok.e);
    }

    if (!acc || acc.id !== tok.r) return deny(reply);

    // Issue #27: Vorschau der Profilbesucher ohne Premium — nur die stark verkleinerte, unkenntliche Fassung
    if (tok.k === 'teaser') {
      const ph = await one(`SELECT public_file FROM photos WHERE id = $1 AND status = 'approved'`, [tok.id]);
      if (!ph?.public_file) return deny(reply);
      const k = `g:${ph.public_file}`;
      let data = cacheGet(k);
      if (!data) cachePut(k, (data = await guestVersion(await getFile('zone1-public', ph.public_file))));
      return send(reply, data, tok.e);
    }

    // Issue #16: Bilder einer Veranstaltung — für alle, die die Veranstaltung sehen dürfen
    if (tok.k === 'event') {
      const im = await one(
        `SELECT ei.file, e.status, e.host_id, e.ampel FROM event_images ei JOIN events e ON e.id = ei.event_id WHERE ei.id = $1`,
        [tok.id],
      );
      if (!im) return deny(reply);
      if (im.host_id !== acc.id && (!['approved', 'cancelled'].includes(im.status) || (im.ampel === 'rot' && !acc.age1))) return deny(reply);
      const k = `e:${im.file}`;
      let data = cacheGet(k);
      if (!data) cachePut(k, (data = await getFile('zone1-public', im.file)));
      return send(reply, data, tok.e);
    }

    if (tok.k === 'own') {
      const ph = await one(`SELECT original_file FROM photos WHERE id = $1 AND account_id = $2 AND status <> 'blocked'`, [tok.id, acc.id]);
      if (!ph) return deny(reply);
      const k = `o:${tok.id}`;
      let data = cacheGet(k);
      if (!data) cachePut(k, (data = await clearVersion(await getFile('zone1-original', ph.original_file))));
      return send(reply, data, tok.e);
    }

    if (tok.k === 'album') {
      const m = await one(`SELECT id, owner_id, file, album_id FROM private_media WHERE id = $1 AND kind = 'album'`, [tok.id]);
      if (!m) return deny(reply);
      if (m.owner_id !== acc.id) {
        const share = await one(
          // Issue #23: nur das geteilte Album — nicht alle Alben der Person
          `SELECT 1 FROM album_shares WHERE owner_id = $1 AND viewer_id = $2 AND album_id = $3 AND state = 'accepted'`,
          [m.owner_id, acc.id, m.album_id],
        );
        // AK-F48-04: nach dem Ende der Freigabe keine Albumbilder mehr
        if (!share || (await isBlockedEitherWay(m.owner_id, acc.id))) return deny(reply);
        if (!(await stage2Satisfied(acc))) return deny(reply); // AK-F48-06
        return send(reply, await applyWatermark(await getFile('zone2', m.file), acc.id), tok.e);
      }
      return send(reply, await getFile('zone2', m.file), tok.e);
    }

    if (tok.k === 'once') {
      // Issue #26: genau ein Abruf — danach liefert der Server nichts mehr
      const msg = await one(
        `UPDATE messages m SET once_served_at = now()
           FROM conversations c, private_media pm
          WHERE m.id = $1 AND m.once AND m.once_served_at IS NULL AND m.once_viewed_at IS NOT NULL
            AND m.sender_id <> $2 AND c.id = m.conversation_id AND (c.user_low = $2 OR c.user_high = $2)
            AND pm.id = m.media_id AND pm.file IS NOT NULL
          RETURNING pm.file, m.sender_id`,
        [tok.id, acc.id],
      );
      if (!msg || (await isBlockedEitherWay(acc.id, msg.sender_id))) return deny(reply);
      reply.header('cache-control', 'no-store');
      const data = await applyWatermark(await privateVersion(await getFile('zone2', msg.file)), acc.id);
      reply.header('content-type', 'image/jpeg');
      reply.header('content-disposition', 'inline');
      return reply.send(data);
    }

    if (tok.k === 'chat') {
      const msg = await one(
        `SELECT m.id, m.sender_id, m.delivery, m.expires_at, pm.file, c.user_low, c.user_high
           FROM messages m JOIN private_media pm ON pm.id = m.media_id
           JOIN conversations c ON c.id = m.conversation_id
          WHERE m.id = $1 AND m.kind = 'image' AND NOT m.once`,
        [tok.id],
      );
      if (!msg || (msg.user_low !== acc.id && msg.user_high !== acc.id)) return deny(reply);
      if (msg.expires_at && new Date(msg.expires_at) < new Date()) return deny(reply);
      const other = msg.user_low === acc.id ? msg.user_high : msg.user_low;
      if (await isBlockedEitherWay(acc.id, other)) return deny(reply);
      if (msg.sender_id === acc.id) return send(reply, await privateVersion(await getFile('zone2', msg.file)), tok.e);
      // Empfänger: nur zugestellte Bilder, nur mit Stufe 2, wenn der Schalter sie verlangt (FV-85, AK-F43-07)
      if (msg.delivery !== 'sent' || !(await stage2Satisfied(acc))) return deny(reply);
      return send(reply, await applyWatermark(await privateVersion(await getFile('zone2', msg.file)), acc.id), tok.e);
    }

    return deny(reply);
  });

  /**
   * Sprachnachrichten (Issue #28) — gleiche Prüfung wie Bilder im Gespräch. Mit Range-Anfragen,
   * ohne die Safari (auch iOS) Audio nicht abspielt.
   */
  app.get('/api/audio/:token', async (req, reply) => {
    const { token } = params(req, z.object({ token: z.string().max(2000) }));
    const tok = readImgToken(token);
    const acc = await loadAccount(req);
    if (!tok || !acc || acc.id !== tok.r) return deny(reply);
    let file: string | null = null;
    if (tok.k === 'audio') {
      const msg = await one(
        `SELECT m.sender_id, m.delivery, m.expires_at, pm.file, c.user_low, c.user_high
           FROM messages m JOIN private_media pm ON pm.id = m.media_id JOIN conversations c ON c.id = m.conversation_id
          WHERE m.id = $1 AND m.kind = 'audio'`,
        [tok.id],
      );
      if (!msg || (msg.user_low !== acc.id && msg.user_high !== acc.id)) return deny(reply);
      if (msg.expires_at && new Date(msg.expires_at) < new Date()) return deny(reply);
      const other = msg.user_low === acc.id ? msg.user_high : msg.user_low;
      if (await isBlockedEitherWay(acc.id, other)) return deny(reply);
      file = msg.file;
    }
    if (!file) return deny(reply);
    const data = await getFile('zone2', file);
    reply.header('content-type', 'audio/mp4');
    reply.header('accept-ranges', 'bytes');
    reply.header('cache-control', 'private, max-age=600');
    const range = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range ?? ''));
    if (range) {
      const size = data.length;
      let start = range[1] ? Number(range[1]) : size - Number(range[2] || 0);
      let end = range[1] && range[2] ? Number(range[2]) : size - 1;
      if (!range[1] && range[2]) end = size - 1;
      start = Math.max(0, start);
      end = Math.min(size - 1, end);
      if (start > end || start >= size) {
        reply.header('content-range', `bytes */${size}`);
        return reply.status(416).send();
      }
      reply.header('content-range', `bytes ${start}-${end}/${size}`);
      return reply.status(206).send(data.subarray(start, end + 1));
    }
    return reply.send(data);
  });
}
