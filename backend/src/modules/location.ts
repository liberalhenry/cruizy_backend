/**
 * Standort, Standortstufe und Zonen (F60, F69, F70).
 *
 * PRÜFUNG ERFORDERLICH — Prüffrage: „Liegt nach der Verarbeitung irgendwo eine
 * genauere Position als der Zellmittelpunkt?“ Antwort: Nein. Die eingehende
 * Position lebt nur in dieser Funktion; gespeichert werden der Zellmittelpunkt
 * der eigenen Stufe und — für andere — der Punkt, von dem aus sie Entfernungen
 * sehen (echte Zelle oder Ersatzpunkt). Die Schnittstelle gibt nur eine
 * Bestätigung zurück (F70, Ablauf 1).
 */
import type { FastifyInstance } from 'fastify';
import { randomInt } from 'node:crypto';
import { z } from 'zod';
import { p } from '../config/params.js';
import { one, q } from '../db/pool.js';
import { requireMember } from '../lib/context.js';
import { decrypt, encrypt } from '../lib/crypto.js';
import { AppError, bad, notFound } from '../lib/errors.js';
import { body, idParam, params } from '../lib/http.js';
import { countryOf, destination, distanceKm, isValid, roundForLevel, roundToCell, type LatLng } from '../lib/geo.js';
import { hasTier } from '../services/entitlements.js';

const latLng = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) });

interface ZoneRow {
  id: string;
  center: LatLng;
  radius_km: number;
  effect: 'ersatzpunkt' | 'unsichtbar';
  subst: LatLng | null;
}

async function zonesOf(accountId: string): Promise<ZoneRow[]> {
  const rows = await q(`SELECT id, center_enc, radius_km, effect, subst_enc FROM zones WHERE account_id = $1`, [accountId]);
  return rows.map((r) => ({
    id: r.id,
    center: JSON.parse(decrypt('location', r.center_enc, `zone:${accountId}`).toString()),
    radius_km: r.radius_km,
    effect: r.effect,
    subst: r.subst_enc ? JSON.parse(decrypt('location', r.subst_enc, `zone:${accountId}`).toString()) : null,
  }));
}

/**
 * Verarbeitet eine eingehende Position. Exportiert für Tests.
 * Gibt zurück, ob die Meldung angenommen wurde — nie eine Position.
 */
export async function acceptPosition(accountId: string, pos: LatLng, opts: { force?: boolean } = {}): Promise<{ accepted: boolean; reason?: string }> {
  if (!isValid(pos)) return { accepted: false, reason: 'ungueltig' };
  const loc = await one(`SELECT level, cell_lat, cell_lng, updated_at FROM locations WHERE account_id = $1`, [accountId]);
  const level = (loc?.level ?? 'grob') as 'grob' | 'nah' | 'aus';
  // AK-F69-04: Stufe „Aus“ → keine Position speichern
  if (level === 'aus') return { accepted: false, reason: 'aus' };

  const cell = roundForLevel(pos, level);
  const fine = roundToCell(pos, p('P-ZELLE-NAH')); // nur für den Zonenvergleich, wird nicht gespeichert

  if (loc?.updated_at && !opts.force) {
    const ageS = (Date.now() - new Date(loc.updated_at).getTime()) / 1000;
    // AK-F70-05: höchstens eine Meldung je P-STANDORT-TAKT
    if (ageS < p('P-STANDORT-TAKT')) return { accepted: false, reason: 'takt' };
    // unplausible Sprünge werden verworfen (FV-02)
    if (loc.cell_lat != null) {
      const km = distanceKm({ lat: loc.cell_lat, lng: loc.cell_lng }, cell);
      const kmh = km / Math.max(ageS / 3600, 1 / 60);
      if (km > 20 && kmh > p('P-STANDORT-SPRUNG-KMH')) return { accepted: false, reason: 'sprung' };
    }
  }

  let display: LatLng | null = cell;
  let approx = false;
  let invisible = false;
  let inZone = false;
  for (const z of await zonesOf(accountId)) {
    if (distanceKm(fine, z.center) <= z.radius_km) {
      inZone = true;
      if (z.effect === 'unsichtbar' && (await hasTier(accountId, 'plus'))) {
        invisible = true;
      } else if (z.subst) {
        display = z.subst; // AK-F60-07: jedes Band, das andere sehen, vom Ersatzpunkt aus
        approx = true;
      }
      break;
    }
  }
  await q(
    `INSERT INTO locations (account_id, level, cell_lat, cell_lng, display_lat, display_lng, approx, invisible, in_zone, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
     ON CONFLICT (account_id) DO UPDATE SET cell_lat = $3, cell_lng = $4, display_lat = $5, display_lng = $6,
       approx = $7, invisible = $8, in_zone = $9, updated_at = now()`,
    [accountId, level, cell.lat, cell.lng, display?.lat ?? null, display?.lng ?? null, approx, invisible, inZone],
  );
  return { accepted: true };
}

export default async function locationRoutes(app: FastifyInstance) {
  app.put('/api/location', async (req) => {
    const a = await requireMember(req);
    const b = body(req, latLng.extend({ accuracy: z.number().min(0).max(1e6).optional() }));
    const res = await acceptPosition(a.id, { lat: b.lat, lng: b.lng });
    const cur = await one(`SELECT level, in_zone, approx, invisible, cell_lat, cell_lng FROM locations WHERE account_id = $1`, [a.id]);
    const country = cur?.cell_lat != null ? countryOf({ lat: cur.cell_lat, lng: cur.cell_lng }) : null;
    return {
      ok: true,
      accepted: res.accepted,
      // ST-FEH-21: Standort sehr ungenau
      imprecise: (b.accuracy ?? 0) > 5000,
      level: cur?.level ?? 'grob',
      inZone: !!cur?.in_zone,
      approx: !!cur?.approx,
      invisible: !!cur?.invisible,
      country, // nur für die eigene Anzeige der Notrufnummern, nicht gespeichert (FV-75)
    };
  });

  app.put('/api/location/level', async (req) => {
    const a = await requireMember(req);
    const b = body(req, z.object({ level: z.enum(['grob', 'nah', 'aus']).optional(), cityId: z.string().nullable().optional() }));
    if (b.cityId) {
      const c = await one(`SELECT id FROM cities WHERE id = $1 AND active`, [b.cityId]);
      if (!c) throw bad('UI-EINGABE-PRUEFEN');
    }
    if (b.level) {
      if (b.level === 'aus') {
        // „Aus“: nichts mehr gespeichert, unsichtbar in Raster, Karte und Wochenaktiven (FV-01)
        await q(
          `UPDATE locations SET level = 'aus', cell_lat = NULL, cell_lng = NULL, display_lat = NULL, display_lng = NULL,
                  approx = false, invisible = false, in_zone = false, updated_at = NULL WHERE account_id = $1`,
          [a.id],
        );
      } else {
        // neue Stufe gilt für die nächste Berechnung (AK-F69-03): alte Zelle verwerfen, Client meldet neu
        await q(
          `UPDATE locations SET level = $2, cell_lat = NULL, cell_lng = NULL, display_lat = NULL, display_lng = NULL,
                  updated_at = NULL WHERE account_id = $1`,
          [a.id, b.level],
        );
      }
    }
    if (b.cityId !== undefined) await q(`UPDATE locations SET city_id = $2 WHERE account_id = $1`, [a.id, b.cityId]);
    return { ok: true };
  });

  app.get('/api/location', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    const loc = await one(`SELECT level, city_id, cell_lat IS NOT NULL AS has, in_zone, approx, invisible FROM locations WHERE account_id = $1`, [a.id]);
    const zones = await q(`SELECT id, label, radius_km, effect, subst_enc IS NOT NULL AS has_subst, created_at FROM zones WHERE account_id = $1 ORDER BY created_at`, [a.id]);
    return {
      level: loc?.level ?? 'grob',
      cityId: loc?.city_id ?? null,
      hasLocation: !!loc?.has,
      inZone: !!loc?.in_zone,
      approx: !!loc?.approx,
      invisible: !!loc?.invisible,
      zones: zones.map((z) => ({ id: z.id, label: z.label, radiusKm: z.radius_km, effect: z.effect })),
      limits: {
        zonesMax: p('P-ZONEN-MAX'),
        radius: p('P-ZONE-RADIUS'),
        substMinKm: p('P-ERSATZPUNKT-MIN-KM'),
        substMaxKm: p('P-ERSATZPUNKT-MAX-KM'),
        invisibleAllowed: await hasTier(a.id, 'plus'),
      },
    };
  });

  /** Zufälliger Vorschlag für einen Ersatzpunkt im erlaubten Ring (standortanzeige-konzept.md, Abschnitt 3). */
  app.post('/api/zones/suggest', async (req) => {
    await requireMember(req);
    const b = body(req, latLng);
    const center = roundToCell(b, p('P-ZELLE-NAH'));
    const min = p('P-ERSATZPUNKT-MIN-KM');
    const max = Math.min(p('P-ERSATZPUNKT-MAX-KM'), min + 6);
    const km = min + 0.5 + (randomInt(0, 1000) / 1000) * (max - min - 0.5);
    const pt = roundToCell(destination(center, randomInt(0, 360), km), p('P-ZELLE-NAH'));
    // Nur die eigene Seite sieht diesen Punkt — es ist der Vorschlag, den die Person verschieben kann.
    return { point: pt };
  });

  app.post('/api/zones', async (req) => {
    const a = await requireMember(req);
    const b = body(
      req,
      z.object({
        center: latLng,
        radiusKm: z.number(),
        effect: z.enum(['ersatzpunkt', 'unsichtbar']),
        subst: latLng.nullable().optional(),
        label: z.string().max(30).nullable().optional(),
      }),
    );
    const count = await one(`SELECT count(*)::int AS n FROM zones WHERE account_id = $1`, [a.id]);
    // Obergrenze gilt für alle — ohne Bezahlaufforderung (F60, Randfall)
    if (count!.n >= p('P-ZONEN-MAX')) throw bad('UI-ZONEN-MAX', { max: p('P-ZONEN-MAX') }, 'zonen_max');
    const r = p('P-ZONE-RADIUS');
    if (b.radiusKm < r.min || b.radiusKm > r.max) throw bad('UI-ZONE-RADIUS', { min: r.min, max: r.max }, 'radius'); // AK-F60-02
    // AK-F60-13: Mittelpunkt nur als Rasterzelle, nie genau
    const center = roundToCell(b.center, p('P-ZELLE-NAH'));
    let subst: LatLng | null = null;
    if (b.effect === 'unsichtbar') {
      if (!(await hasTier(a.id, 'plus'))) throw new AppError(403, 'ST-STO-40', {}, 'unsichtbar_im_abo');
    } else {
      if (!b.subst) throw bad('ST-STO-43', {}, 'ersatzpunkt_fehlt');
      subst = roundToCell(b.subst, p('P-ZELLE-NAH'));
      const km = distanceKm(center, subst);
      if (km < p('P-ERSATZPUNKT-MIN-KM')) throw bad('ST-STO-47', {}, 'ersatzpunkt_zu_nah'); // AK-F60-12
      if (km > p('P-ERSATZPUNKT-MAX-KM') && !(await hasTier(a.id, 'pro'))) throw bad('ST-STO-44', {}, 'ersatzpunkt_zu_weit'); // AK-F60-08
    }
    const aad = `zone:${a.id}`;
    const row = await one(
      `INSERT INTO zones (account_id, label, center_enc, radius_km, effect, subst_enc) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [a.id, b.label ?? null, encrypt('location', JSON.stringify(center), aad), b.radiusKm, b.effect, subst ? encrypt('location', JSON.stringify(subst), aad) : null],
    );
    // Die nächste Standortmeldung wendet die Zone an; der Takt wird dafür zurückgesetzt.
    await q(`UPDATE locations SET updated_at = NULL WHERE account_id = $1`, [a.id]);
    return { id: row!.id };
  });

  app.delete('/api/zones/:id', async (req) => {
    const a = await requireMember(req);
    const { id } = params(req, idParam);
    // AK-F60-05: Koordinaten sofort gelöscht
    const r = await one(`DELETE FROM zones WHERE id = $1 AND account_id = $2 RETURNING id`, [id, a.id]);
    if (!r) throw notFound();
    await q(`UPDATE locations SET updated_at = NULL, display_lat = CASE WHEN in_zone THEN NULL ELSE display_lat END,
                   display_lng = CASE WHEN in_zone THEN NULL ELSE display_lng END, in_zone = false, approx = false, invisible = false
              WHERE account_id = $1`, [a.id]);
    return { ok: true };
  });
}
