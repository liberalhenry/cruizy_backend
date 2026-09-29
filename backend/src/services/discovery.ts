/**
 * Raster „Nähe“ (F23–F27, F29) — Abfragen nur über diese Funktion.
 *
 * PRÜFUNG ERFORDERLICH — Prüffrage: „Enthält die Antwort irgendeinen Wert, aus
 * dem sich eine Entfernung genauer als das Band ergibt?“ Antwort: Nein.
 *  * Entfernungen werden zwischen Zellmittelpunkten berechnet und nur als Band
 *    ausgeliefert (AK-F23-02, AK-F70-01).
 *  * „Nähe“ sortiert nach Band, nie nach Metern; Gleichstand: Aktivitätsband,
 *    dann eine je betrachtender Person täglich neu gemischte Reihenfolge (FV-04, FV-40).
 *  * Der Radius ist immer ein Vielfaches von 10 km (AK-F25-04).
 *  * Abo, Prüfzeichen oder Unterstützung ändern keine Reihenfolge (AK-F24-05).
 */
import { p } from '../config/params.js';
import { q } from '../db/pool.js';
import { boundingBox, type LatLng } from '../lib/geo.js';
import { localDateString } from '../lib/time.js';
import { CARD_COLUMNS, VISIBLE_SQL, toTile, type Tile, type Viewer } from './profiles.js';

export type SortMode = 'naehe' | 'antwortquote' | 'neu' | 'absicht';

export interface Filters {
  bands?: (1 | 2 | 3 | 4)[];
  intentions?: string[];
  age?: { min: number; max: number };
}

export interface DiscoverOpts {
  viewer: Viewer;
  /** Bezugspunkt: eigene Zelle — oder Stadtmitte bei Stadtwahl (dann ohne Bänder) */
  ref: LatLng;
  cityMode: boolean;
  sort: SortMode;
  filters: Filters;
  page: number;
}

export interface DiscoverResult {
  tiles: Tile[];
  near: number;
  radiusKm: number;
  total: number;
  hasMore: boolean;
  weekly: Tile[];
  fewNearby: boolean;
  sort: SortMode;
}

export function activeFilterCount(f: Filters) {
  return (f.bands?.length ? 1 : 0) + (f.intentions?.length ? 1 : 0) + (f.age ? 1 : 0);
}

const DIST_SQL = `(2 * 6371.0088 * asin(least(1, sqrt(
    power(sin(radians(l.display_lat - $2) / 2), 2) +
    cos(radians($2)) * cos(radians(l.display_lat)) * power(sin(radians(l.display_lng - $3) / 2), 2)))))`;

const ACT_SQL = `(CASE
    WHEN a.last_active_at > now() - make_interval(secs => ${'$5'}) THEN 1
    WHEN a.last_active_at > now() - interval '1 hour' THEN 2
    WHEN (a.last_active_at AT TIME ZONE $6)::date = (now() AT TIME ZONE $6)::date THEN 3
    WHEN a.last_active_at > now() - interval '7 days' THEN 4
    ELSE 5 END)`;

/**
 * Baut die gemeinsame Kandidatenmenge (alle Filter, bis P-RASTER-MAX-KM).
 * Parameter: $1 viewer, $2 lat, $3 lng, $4 Tagessamen, $5 P-AKTIV-JETZT, $6 Zeitzone, $7.. weitere
 */
function candidateSql(opts: DiscoverOpts, extra: unknown[]) {
  const { viewer, ref, filters } = opts;
  const box = boundingBox(ref, p('P-RASTER-MAX-KM'));
  const where: string[] = [
    VISIBLE_SQL,
    `l.level <> 'aus'`,
    `l.display_lat IS NOT NULL`,
    `NOT l.invisible`,
    `a.hash_restricted_at IS NULL`,
  ];
  const add = (v: unknown) => {
    extra.push(v);
    return `$${6 + extra.length}`;
  };
  where.push(`l.display_lat BETWEEN ${add(box.minLat)} AND ${add(box.maxLat)}`);
  where.push(`l.display_lng BETWEEN ${add(box.minLng)} AND ${add(box.maxLng)}`);
  // F17 „Wen ich sehen möchte“ — Profile ohne sichtbare Angabe erscheinen immer (FV-32, AK-X19-01)
  if (viewer.id && viewer.seeGroups.length) {
    where.push(`(NOT pr.gender_visible OR pr.gender_category IS NULL OR pr.gender_category = ANY(${add(viewer.seeGroups)}))`);
  }
  if (filters.intentions?.length) {
    const keys = filters.intentions.filter((k) => k !== 'offen');
    const withOpen = filters.intentions.includes('offen');
    const conds: string[] = [];
    if (keys.length) conds.push(`(pr.intention = ANY(${add(keys)}) AND pr.intention_expires_at > now())`);
    if (withOpen) conds.push(`(pr.intention IS NULL OR pr.intention_expires_at <= now())`);
    where.push(`(${conds.join(' OR ')})`);
  }
  if (filters.age) {
    // AK-PG-04: ohne Altersangabe erscheint niemand bei aktivem Altersfilter
    where.push(`pr.age BETWEEN ${add(filters.age.min)} AND ${add(filters.age.max)}`);
  }
  const bandExpr = `(CASE WHEN d.dist < 1 THEN 1 WHEN d.dist < 3 THEN 2 WHEN d.dist < 10 THEN 3 ELSE 4 END)`;
  const base = `
    SELECT * FROM (
      SELECT ${CARD_COLUMNS}, ${DIST_SQL} AS dist, ${ACT_SQL} AS act,
             md5($4 || a.id::text) AS rnd,
             (pr.intention IS NOT NULL AND pr.intention_expires_at > now()) AS has_intention
        FROM accounts a
        JOIN profiles pr ON pr.account_id = a.id
        JOIN locations l ON l.account_id = a.id
       WHERE ${where.join(' AND ')}
    ) d WHERE d.dist <= ${p('P-RASTER-MAX-KM')}`;
  const bandFilter = filters.bands?.length ? ` AND ${bandExpr} = ANY(${add(filters.bands)})` : '';
  return { sql: base + bandFilter, bandExpr };
}

function orderBy(opts: DiscoverOpts, bandExpr: string): string {
  const tie = `d.act, d.rnd`; // FV-04: Aktivitätsband, dann tägliche Zufallsreihenfolge
  const section = opts.cityMode ? '' : `(${bandExpr} = 4), `;
  switch (opts.sort) {
    case 'antwortquote':
      return `${section}(CASE WHEN d.response_rate_enabled AND d.response_band IS NOT NULL THEN d.response_band ELSE 9 END), ${tie}`;
    case 'neu':
      return `${section}(d.first_visible_at > now() - make_interval(days => ${p('P-NEU-TAGE')})) DESC,
              (CASE WHEN d.first_visible_at > now() - make_interval(days => ${p('P-NEU-TAGE')})
                    THEN (d.first_visible_at AT TIME ZONE $6)::date END) DESC NULLS LAST, ${tie}`;
    case 'absicht': {
      const own = opts.viewer.intention ? `'${opts.viewer.intention.replace(/[^a-z0-9]/g, '')}'` : 'NULL';
      return `${section}(CASE WHEN d.has_intention AND d.intention = ${own} THEN 0 WHEN NOT d.has_intention THEN 1 ELSE 2 END),
              ${opts.cityMode ? '' : `${bandExpr}, `}${tie}`;
    }
    default:
      return opts.cityMode ? tie : `${section}${bandExpr}, ${tie}`;
  }
}

export async function discover(opts: DiscoverOpts): Promise<DiscoverResult> {
  const target = p('P-RASTER-ZIEL');
  const maxKm = p('P-RASTER-MAX-KM');
  const seed = `${opts.viewer.id ?? opts.viewer.guestKey ?? 'gast'}:${localDateString(new Date())}:`;
  const baseParams: unknown[] = [opts.viewer.id, opts.ref.lat, opts.ref.lng, seed, p('P-AKTIV-JETZT'), p('P-ZEITZONE')];

  // 1. Radius: 10 km, dann in 10-km-Schritten bis zum Ziel oder zur Obergrenze (FV-41)
  const extra1: unknown[] = [];
  const c1 = candidateSql(opts, extra1);
  const rings = await q<{ ring: number; n: number }>(
    `SELECT LEAST(floor(d.dist / 10)::int, ${Math.ceil(maxKm / 10) - 1}) AS ring, count(*)::int AS n
       FROM (${c1.sql}) d GROUP BY 1 ORDER BY 1`,
    [...baseParams, ...extra1],
  );
  const counts = new Map(rings.map((r) => [r.ring, r.n]));
  const near = counts.get(0) ?? 0;
  let radiusKm = 10;
  let cum = near;
  while (cum < target && radiusKm < maxKm) {
    cum += counts.get(radiusKm / 10) ?? 0;
    radiusKm += 10;
  }
  const total = cum;

  // 2. Seite des Rasters
  const extra2: unknown[] = [];
  const c2 = candidateSql(opts, extra2);
  const pageSize = target;
  const offset = Math.max(0, opts.page) * pageSize;
  const rows = await q(
    `SELECT d.* FROM (${c2.sql}) d WHERE d.dist ${radiusKm >= maxKm ? '<=' : '<'} ${radiusKm} ORDER BY ${orderBy(opts, c2.bandExpr)} LIMIT ${pageSize + 1} OFFSET ${offset}`,
    [...baseParams, ...extra2],
  );
  const hasMore = rows.length > pageSize;
  const tiles = rows.slice(0, pageSize).map((r) => stripForCity(toTile(r, opts.viewer), opts.cityMode));

  // 3. Wochenaktive bis P-WOCHENAKTIV-KM, wenn es in der Nähe wenig gibt (F27)
  let weekly: Tile[] = [];
  const fewNearby = near < p('P-WOCHENAKTIV-SCHWELLE');
  const weeklyKm = p('P-WOCHENAKTIV-KM');
  if (fewNearby && !opts.cityMode && opts.page === 0 && radiusKm < weeklyKm) {
    const extra3: unknown[] = [];
    const c3 = candidateSql(opts, extra3);
    const wrows = await q(
      `SELECT d.* FROM (${c3.sql}) d
        WHERE d.dist >= ${radiusKm} AND d.dist <= ${weeklyKm} AND d.act IN (3, 4)
        ORDER BY d.act, ${c3.bandExpr}, d.rnd LIMIT 60`,
      [...baseParams, ...extra3],
    );
    weekly = wrows.map((r) => toTile(r, opts.viewer, { withActivity: true }));
  }

  return { tiles, near, radiusKm, total, hasMore, weekly, fewNearby, sort: opts.sort };
}

/** Trefferzähler (F26, FV-42): genau die Profile, die das Raster mit diesen Filtern zeigen würde. */
export async function countMatches(opts: DiscoverOpts): Promise<number> {
  const r = await discoverCountOnly(opts);
  return r;
}

async function discoverCountOnly(opts: DiscoverOpts): Promise<number> {
  const target = p('P-RASTER-ZIEL');
  const maxKm = p('P-RASTER-MAX-KM');
  const extra: unknown[] = [];
  const c = candidateSql(opts, extra);
  const rings = await q<{ ring: number; n: number }>(
    `SELECT LEAST(floor(d.dist / 10)::int, ${Math.ceil(maxKm / 10) - 1}) AS ring, count(*)::int AS n FROM (${c.sql}) d GROUP BY 1`,
    [opts.viewer.id, opts.ref.lat, opts.ref.lng, '', p('P-AKTIV-JETZT'), p('P-ZEITZONE'), ...extra],
  );
  const counts = new Map(rings.map((r) => [r.ring, r.n]));
  let radius = 10;
  let cum = counts.get(0) ?? 0;
  while (cum < target && radius < maxKm) {
    cum += counts.get(radius / 10) ?? 0;
    radius += 10;
  }
  return cum;
}

function stripForCity(t: Tile, cityMode: boolean): Tile {
  // FV-39: bei Stadtwahl keine Entfernungsbänder
  return cityMode ? { ...t, band: null, approx: false } : t;
}
