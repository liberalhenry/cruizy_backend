/**
 * Travel-Modus, Punkt verschieben und Reisen (Issue #18).
 *
 * PRÜFUNG ERFORDERLICH (Standort).
 *  * Punkt verschieben: bis P-VERSCHIEBEN-MAX-KM von der eigenen Zelle. Andere sehen Entfernungen
 *    von dort aus und „ungefährer Ort“. Die Richtung wählt die Person, der Server rechnet von der
 *    eigenen Zelle aus — die Zelle selbst verlässt den Server nie.
 *  * Travel: stöbern an einem Ort aus dem Ortsverzeichnis. Andere sehen die ECHTE (gerundete)
 *    Entfernung und ein Reise-Zeichen — niemand wird getäuscht.
 *  * Reisen: nur Orte aus dem Verzeichnis (Dorf, Stadt, Stadtteil), keine Regionen. Ab
 *    P-BALD-TAGE vor der Anreise erscheint die Person dort unter „Bald in der Gegend“.
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { p } from '../config/params.js';
import { one, q } from '../db/pool.js';
import { requireMember } from '../lib/context.js';
import { AppError, bad, notFound } from '../lib/errors.js';
import { destination, distanceKm, roundForLevel, type LatLng } from '../lib/geo.js';
import { body, idParam, params } from '../lib/http.js';
import { localDateString } from '../lib/time.js';
import { looksLikeRegion, placeById, placeDetail, placeLabel, placeRadiusKm, searchPlaces } from '../services/places-dir.js';
import { hasTier } from '../services/entitlements.js';

/** Auto bis 300 km, sonst Flugzeug — nur als Zeichen, nie als Zahl. */
export function travelMode(from: LatLng | null, to: LatLng): 'auto' | 'flug' {
  if (!from) return 'flug';
  return distanceKm(from, to) < 300 ? 'auto' : 'flug';
}

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

async function tripsOf(accountId: string, onlyPublic: boolean) {
  const rows = await q(
    `SELECT id, place_label, from_date, to_date, public FROM trips
      WHERE account_id = $1 AND to_date >= current_date ${onlyPublic ? 'AND public' : ''} ORDER BY from_date LIMIT 20`,
    [accountId],
  );
  return rows.map((r) => ({ id: r.id, place: r.place_label, from: localDateString(new Date(r.from_date)), to: localDateString(new Date(r.to_date)), public: r.public }));
}

export async function publicTrips(accountId: string) {
  return (await tripsOf(accountId, true)).map(({ id: _id, public: _p, ...rest }) => rest);
}

export default async function travelRoutes(app: FastifyInstance) {
  /** Ortssuche im mitgelieferten Verzeichnis — nichts geht an Dritte. */
  app.get('/api/places-dir/search', async (req) => {
    await requireMember(req);
    const qq = String((req.query as { q?: string }).q ?? '').slice(0, 60);
    // „Bayern“ o. Ä.: zu grob — ein Dorf, eine Stadt oder ein Stadtteil muss es sein
    if (looksLikeRegion(qq)) return { results: [], region: true };
    const list = searchPlaces(qq, 8);
    return { results: list.map((x) => ({ id: x.id, label: placeLabel(x), detail: placeDetail(x), kind: x.kind })), region: false };
  });

  app.get('/api/travel', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    const l = await one(`SELECT travel_place, travel_since, shift_lat IS NOT NULL AS shifted, level FROM locations WHERE account_id = $1`, [a.id]);
    return {
      travel: l?.travel_place ? { place: l.travel_place, since: l.travel_since } : null,
      shifted: !!l?.shifted,
      trips: await tripsOf(a.id, false),
      limits: { shiftMaxKm: p('P-VERSCHIEBEN-MAX-KM'), soonDays: p('P-BALD-TAGE'), tripMaxDays: p('P-REISE-MAX-TAGE') },
      needsPlus: p('P-TRAVEL-ABO') && !(await hasTier(a.id, 'plus')),
    };
  });

  /** Travel-Modus: stöbern an einem Ort aus dem Verzeichnis. */
  app.put('/api/travel', async (req) => {
    const a = await requireMember(req);
    const b = body(req, z.object({ placeId: z.number().int() }));
    if (p('P-TRAVEL-ABO') && !(await hasTier(a.id, 'plus'))) throw new AppError(403, 'UI-TRAVEL-ABO', {}, 'abo_noetig');
    const pl = placeById(b.placeId);
    if (!pl) throw bad('UI-TRAVEL-ORT-FEHLT', {}, 'ort_unbekannt');
    await q(`UPDATE locations SET travel_lat = $2, travel_lng = $3, travel_place = $4, travel_since = now() WHERE account_id = $1`, [
      a.id,
      pl.lat,
      pl.lng,
      placeLabel(pl),
    ]);
    return { ok: true, place: placeLabel(pl) };
  });

  app.delete('/api/travel', async (req) => {
    const a = await requireMember(req);
    await q(`UPDATE locations SET travel_lat = NULL, travel_lng = NULL, travel_place = NULL, travel_since = NULL WHERE account_id = $1`, [a.id]);
    return { ok: true };
  });

  /**
   * Punkt verschieben (bis 20 km): Richtung in Grad und Entfernung. Der neue Punkt wird auf
   * die Zelle der eigenen Stufe gerundet; andere sehen ab sofort Entfernungen von dort.
   */
  app.put('/api/location/shift', async (req) => {
    const a = await requireMember(req);
    const b = body(req, z.object({ bearing: z.number().min(0).max(360), km: z.number().min(0.5) }));
    const max = p('P-VERSCHIEBEN-MAX-KM');
    if (b.km > max) throw bad('UI-VERSCHIEBEN-ZU-WEIT', { km: max }, 'zu_weit');
    const l = await one(`SELECT level, cell_lat, cell_lng, invisible FROM locations WHERE account_id = $1`, [a.id]);
    if (!l || l.cell_lat == null || l.level === 'aus') throw new AppError(409, 'UI-VERSCHIEBEN-OHNE-ORT', {}, 'kein_standort');
    const pt = roundForLevel(destination({ lat: l.cell_lat, lng: l.cell_lng }, b.bearing, b.km), l.level);
    await q(
      `UPDATE locations SET shift_lat = $2, shift_lng = $3,
              display_lat = CASE WHEN invisible THEN display_lat ELSE $2 END,
              display_lng = CASE WHEN invisible THEN display_lng ELSE $3 END,
              approx = true WHERE account_id = $1`,
      [a.id, pt.lat, pt.lng],
    );
    return { ok: true };
  });

  app.delete('/api/location/shift', async (req) => {
    const a = await requireMember(req);
    // zurück auf die eigene Zelle; die nächste Standortmeldung wendet Zonen wieder an
    await q(
      `UPDATE locations SET shift_lat = NULL, shift_lng = NULL, display_lat = CASE WHEN in_zone THEN display_lat ELSE cell_lat END,
              display_lng = CASE WHEN in_zone THEN display_lng ELSE cell_lng END, approx = in_zone AND approx, updated_at = NULL
        WHERE account_id = $1`,
      [a.id],
    );
    return { ok: true };
  });

  // ───── Reisen ─────
  app.post('/api/trips', async (req) => {
    const a = await requireMember(req);
    const b = body(req, z.object({ placeId: z.number().int(), from: dateStr, to: dateStr, public: z.boolean().default(true) }));
    const pl = placeById(b.placeId);
    if (!pl) throw bad('UI-TRAVEL-ORT-FEHLT', {}, 'ort_unbekannt');
    const today = localDateString(new Date());
    if (b.to < b.from || b.to < today) throw bad('UI-REISE-DATUM', {}, 'datum');
    const days = (Date.parse(b.to) - Date.parse(b.from)) / 86400_000;
    if (days > p('P-REISE-MAX-TAGE')) throw bad('UI-REISE-ZU-LANG', { tage: p('P-REISE-MAX-TAGE') }, 'zu_lang');
    if (Date.parse(b.from) - Date.now() > 366 * 86400_000) throw bad('UI-REISE-DATUM', {}, 'datum');
    const n = await one(`SELECT count(*)::int AS n FROM trips WHERE account_id = $1 AND to_date >= current_date`, [a.id]);
    if (n!.n >= p('P-REISEN-MAX')) throw bad('UI-REISEN-MAX', { max: p('P-REISEN-MAX') }, 'reisen_max');
    const r = await one(
      `INSERT INTO trips (account_id, place_id, place_label, lat, lng, radius_km, from_date, to_date, public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [a.id, pl.id, placeLabel(pl), pl.lat, pl.lng, placeRadiusKm(pl), b.from, b.to, b.public],
    );
    return { id: r!.id, place: placeLabel(pl) };
  });

  app.patch('/api/trips/:id', async (req) => {
    const a = await requireMember(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ public: z.boolean() }));
    const r = await one(`UPDATE trips SET public = $3 WHERE id = $1 AND account_id = $2 RETURNING id`, [id, a.id, b.public]);
    if (!r) throw notFound();
    return { ok: true };
  });

  app.delete('/api/trips/:id', async (req) => {
    const a = await requireMember(req);
    const { id } = params(req, idParam);
    const r = await one(`DELETE FROM trips WHERE id = $1 AND account_id = $2 RETURNING id`, [id, a.id]);
    if (!r) throw notFound();
    return { ok: true };
  });
}
