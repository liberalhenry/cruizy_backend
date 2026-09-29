/**
 * Gastmodus, 3 Minuten (F01, FV-10 bis FV-12).
 *
 * PRÜFUNG ERFORDERLICH.
 *  * Kein Konto, kein gespeicherter Standort (AK-F01-05): die Position wird nur
 *    für diese Anfrage gerundet und verworfen.
 *  * Nur die unkenntliche Fassung der Fotos, keine Namen, keine Antwortquote,
 *    kein Aktivitätsband (AK-F01-01).
 *  * Nach P-GAST-DAUER keine Rasterdaten mehr (AK-F01-03); neue Sitzung im selben
 *    Browser erst nach P-GAST-PAUSE; Begrenzung je Netzadresse (AK-F01-06), deren
 *    Prüfwert nur P-GAST-PAUSE lang liegt.
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { p } from '../config/params.js';
import { one, q } from '../db/pool.js';
import { cookieOptions } from '../lib/context.js';
import { blindIndex, openToken, sealToken } from '../lib/crypto.js';
import { AppError, bad, tooMany } from '../lib/errors.js';
import { body } from '../lib/http.js';
import { roundForLevel, isValid } from '../lib/geo.js';
import { discover } from '../services/discovery.js';

interface GuestToken {
  g: string;
  s: number;
}

export default async function guestRoutes(app: FastifyInstance) {
  app.post('/api/guest/start', async (req, reply) => {
    const existing = openToken<GuestToken>(req.cookies['gast'] ?? '');
    const durMs = p('P-GAST-DAUER') * 1000;
    if (existing && Date.now() - existing.s < durMs) {
      return { expiresAt: new Date(existing.s + durMs).toISOString() };
    }
    if (req.cookies['gast_pause']) {
      throw new AppError(403, 'UI-GAST-PAUSE', {}, 'gast_pause');
    }
    const ipHash = blindIndex('ip', req.ip ?? '');
    const r = await one(
      `SELECT count(*)::int AS n FROM guest_sessions WHERE ip_hash = $1 AND created_at > now() - make_interval(secs => $2)`,
      [ipHash, p('P-GAST-PAUSE')],
    );
    if (r!.n >= p('P-GAST-JE-NETZ')) throw tooMany('UI-GAST-NETZ', 'gast_netz');
    const g = await one(`INSERT INTO guest_sessions (ip_hash) VALUES ($1) RETURNING id`, [ipHash]);
    const s = Date.now();
    // technisch nötige Sitzungsmarke (§ 25 Abs. 2 Nr. 2 TDDDG, ⚠ W-06)
    reply.setCookie('gast', sealToken({ g: g!.id, s } satisfies GuestToken), cookieOptions(p('P-GAST-DAUER') + 60));
    reply.setCookie('gast_pause', '1', cookieOptions(p('P-GAST-PAUSE')));
    return { expiresAt: new Date(s + durMs).toISOString() };
  });

  app.post('/api/guest/grid', async (req) => {
    const tok = openToken<GuestToken>(req.cookies['gast'] ?? '');
    if (!tok) throw new AppError(401, 'ST-KON-03', {}, 'gast_abgelaufen');
    if (Date.now() - tok.s > p('P-GAST-DAUER') * 1000) throw new AppError(410, 'ST-KON-03', {}, 'gast_abgelaufen');
    const b = body(
      req,
      z.object({ lat: z.number().optional(), lng: z.number().optional(), cityId: z.string().optional() }),
    );
    let ref;
    let cell = null;
    if (b.lat !== undefined && b.lng !== undefined && isValid({ lat: b.lat, lng: b.lng })) {
      cell = roundForLevel({ lat: b.lat, lng: b.lng }, 'grob');
      ref = cell;
    } else if (b.cityId) {
      const c = await one(`SELECT lat, lng FROM cities WHERE id = $1 AND active`, [b.cityId]);
      if (!c) throw bad('UI-EINGABE-PRUEFEN');
      ref = { lat: c.lat, lng: c.lng };
    } else {
      // AK-F01-04: keine Ortung über die Netzadresse
      return { needsLocation: true, tiles: [] };
    }
    const res = await discover({
      viewer: { id: null, guestKey: `gast:${tok.g}`, cell, responseEnabled: false, seeGroups: [], intention: null },
      ref,
      cityMode: !cell,
      sort: 'naehe',
      filters: {},
      page: 0,
    });
    return {
      tiles: res.tiles,
      near: res.near,
      radiusKm: res.radiusKm,
      fewNearby: res.fewNearby,
      weekly: [],
      cityMode: !cell,
      expiresAt: new Date(tok.s + p('P-GAST-DAUER') * 1000).toISOString(),
    };
  });

  app.get('/api/cities', async () => ({
    cities: await q(`SELECT id, name, country FROM cities WHERE active ORDER BY name`),
  }));
}
