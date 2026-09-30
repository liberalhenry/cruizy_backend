/**
 * Raster „Nähe“ (F23–F27, Issue #22) und Namenssuche (Issue #20) — Abfragen nur über diese Datei.
 *
 * PRÜFUNG ERFORDERLICH — Prüffrage: „Enthält die Antwort irgendeinen Wert, aus
 * dem sich eine Entfernung genauer als die Rasterzelle ergibt?“ Antwort: Nein.
 *  * Entfernungen werden zwischen Zellmittelpunkten berechnet und nur gerundet
 *    ausgeliefert (displayKm: < 1 km, ganze km, ab 15 km in 5er-, ab 100 km in 10er-Schritten).
 *  * Im eingestellten Radius erscheinen IMMER alle sichtbaren Profile, die den Filtern
 *    entsprechen — gemischt wird nur die Reihenfolge, nie wird ein Profil weggelassen.
 *  * Sind es weniger als P-RASTER-MIN, wird stufenweise erweitert (P-RASTER-STUFEN) bis zur
 *    Obergrenze: P-RASTER-GRENZE, ab eingestelltem Radius von P-RASTER-GRENZE km die große
 *    Grenze, ab P-RASTER-GRENZE-GROSS km gar nicht. Abschaltbar in den Einstellungen.
 *  * Innerhalb eines Abschnitts: Aktivitätsstufe → Entfernungsbereich (bis 10 km je 1 km,
 *    darüber je 5 km) → Mischung mit einem Seed je Person und Sitzung.
 *  * Die Reihenfolge einer Sitzung liegt als Liste von Kennungen in grid_snapshots; Nachladen
 *    liest daraus — kein Profil doppelt, keins übersprungen.
 *  * Abo, Prüfzeichen oder Unterstützung ändern keine Reihenfolge (AK-F24-05).
 */
import { createHash } from 'node:crypto';
import { p } from '../config/params.js';
import { one, q } from '../db/pool.js';
import { boundingBox, type LatLng } from '../lib/geo.js';
import { CARD_COLUMNS, VISIBLE_SQL, toTile, type Tile, type Viewer } from './profiles.js';

export type SortMode = 'naehe' | 'antwortquote' | 'neu' | 'absicht';

export interface Range {
  min: number;
  max: number;
}

export interface Filters {
  intentions?: string[];
  age?: Range;
  weight?: Range;
  height?: Range;
  bodyTypes?: string[];
  kinks?: string[];
  positions?: string[];
  /** Issue #24: „Antwortet meistens oder besser“ */
  responsive?: boolean;
  withPhoto?: boolean;
}

export interface GridSettings {
  radiusKm: number;
  expand: boolean;
}

export interface DiscoverOpts {
  viewer: Viewer;
  /** Bezugspunkt: eigene Zelle, Reiseziel (Travel) — oder Stadtmitte bei Stadtwahl (dann ohne Entfernungen) */
  ref: LatLng;
  cityMode: boolean;
  sort: SortMode;
  filters: Filters;
  grid: GridSettings;
  /** Seed der Sitzung (vom Gerät, neu nach dem Neuladen oder P-RASTER-SEED-PAUSE ohne Aktivität) */
  seed: string;
}

export interface Section {
  index: number;
  /** Obergrenze des Abschnitts in km (Abschnitt 0 = eingestellter Radius) */
  km: number;
  /** Obergrenze des vorigen Abschnitts — für „Das war’s in {X} km“ */
  prevKm: number | null;
}

export interface GridPage {
  tiles: (Tile & { section: number })[];
  sections: Section[];
  cursor: string | null;
  hasMore: boolean;
  total: number;
}

export interface DiscoverResult extends GridPage {
  radiusKm: number;
  capKm: number;
  inRadius: number;
  fewNearby: boolean;
  newNearby: Tile[];
  /** Issue #18: angekündigte Reisen hierher — ab P-BALD-TAGE vor der Anreise */
  soonNearby: (Tile & { soon: { from: string; to: string; place: string } })[];
  sort: SortMode;
}

export function activeFilterCount(f: Filters) {
  return (
    (f.intentions?.length ? 1 : 0) +
    (f.age ? 1 : 0) +
    (f.weight ? 1 : 0) +
    (f.height ? 1 : 0) +
    (f.bodyTypes?.length ? 1 : 0) +
    (f.kinks?.length ? 1 : 0) +
    (f.positions?.length ? 1 : 0) +
    (f.responsive ? 1 : 0) +
    (f.withPhoto ? 1 : 0)
  );
}

/** Obergrenze der Erweiterung (Issue #22, Abschnitt 1). */
export function expansionCap(radiusKm: number, expand: boolean): number {
  if (!expand) return radiusKm;
  const big = p('P-RASTER-GRENZE-GROSS');
  if (radiusKm >= big) return radiusKm;
  if (radiusKm >= p('P-RASTER-GRENZE')) return big;
  return Math.max(radiusKm, p('P-RASTER-GRENZE'));
}

/** Entfernungsbereich innerhalb einer Aktivitätsstufe: bis 10 km je 1 km, darüber je 5 km. */
export function distanceBucket(km: number): number {
  if (km < 10) return Math.floor(km);
  return 10 + Math.floor((km - 10) / 5);
}

const DIST_SQL = `(2 * 6371.0088 * asin(least(1, sqrt(
    power(sin(radians(l.display_lat - $2) / 2), 2) +
    cos(radians($2)) * cos(radians(l.display_lat)) * power(sin(radians(l.display_lng - $3) / 2), 2)))))`;

/** Aktivitätsstufen (Issue #22, Abschnitt 3): 1 online … 6 inaktiv 14–30 Tage, 7 = nicht im Raster */
function actSql(nowParam: string) {
  return `(CASE
    WHEN coalesce(a.last_active_at, a.created_at) > ${nowParam} - make_interval(secs => ${p('P-AKTIV-JETZT')}) THEN 1
    WHEN coalesce(a.last_active_at, a.created_at) > ${nowParam} - interval '1 hour' THEN 2
    WHEN coalesce(a.last_active_at, a.created_at) > ${nowParam} - interval '24 hours' THEN 3
    WHEN coalesce(a.last_active_at, a.created_at) > ${nowParam} - interval '7 days' THEN 4
    WHEN coalesce(a.last_active_at, a.created_at) > ${nowParam} - make_interval(days => ${p('P-RASTER-INAKTIV-UNTEN')}) THEN 5
    WHEN coalesce(a.last_active_at, a.created_at) > ${nowParam} - make_interval(days => ${p('P-RASTER-INAKTIV-WEG')}) THEN 6
    ELSE 7 END)`;
}

/**
 * Bedingungen der Filter (alle außer dem Radius). Hängt Werte an `vals` an.
 * Aliase: a = accounts, pr = profiles, l = locations.
 */
export function filterConditions(viewer: Viewer, filters: Filters, vals: unknown[]): string[] {
  const where: string[] = [];
  const add = (v: unknown) => {
    vals.push(v);
    return `$${vals.length}`;
  };
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
  // Bei aktivem Bereichsfilter erscheint niemand ohne Angabe (AK-PG-04)
  if (filters.age) where.push(`pr.age BETWEEN ${add(filters.age.min)} AND ${add(filters.age.max)}`);
  if (filters.weight) where.push(`pr.weight_kg BETWEEN ${add(filters.weight.min)} AND ${add(filters.weight.max)}`);
  if (filters.height) where.push(`pr.height_cm BETWEEN ${add(filters.height.min)} AND ${add(filters.height.max)}`);
  if (filters.bodyTypes?.length) where.push(`pr.body_types && ${add(filters.bodyTypes)}::text[]`);
  if (filters.kinks?.length) where.push(`pr.kinks && ${add(filters.kinks)}::text[]`);
  if (filters.positions?.length) where.push(`pr.position = ANY(${add(filters.positions)}::text[])`);
  // Issue #24: Stufe 1 „fast immer“ oder 2 „meistens“ — nur, wer die Quote zeigt
  if (filters.responsive) where.push(`(pr.response_rate_enabled AND pr.response_band IN (1, 2))`);
  if (filters.withPhoto) {
    where.push(`(pr.photo_mode = 'photo' AND EXISTS (SELECT 1 FROM photos phf WHERE phf.account_id = a.id AND phf.status = 'approved'))`);
  }
  return where;
}

interface Candidate {
  id: string;
  dist: number;
  act: number;
  created: Date;
  intention: string | null;
  has_intention: boolean;
  response: number | null;
}

/** Alle Kandidaten bis zur Obergrenze — nur Kennung, Entfernung, Aktivität (leichtgewichtig). */
async function candidates(opts: DiscoverOpts, capKm: number): Promise<Candidate[]> {
  const { viewer, ref, filters } = opts;
  const box = boundingBox(ref, capKm);
  const vals: unknown[] = [viewer.id, ref.lat, ref.lng, new Date()];
  const add = (v: unknown) => {
    vals.push(v);
    return `$${vals.length}`;
  };
  const where = [
    VISIBLE_SQL,
    `l.level <> 'aus'`,
    `l.display_lat IS NOT NULL`,
    `NOT l.invisible`,
    `a.hash_restricted_at IS NULL`,
    `l.display_lat BETWEEN ${add(box.minLat)} AND ${add(box.maxLat)}`,
    `l.display_lng BETWEEN ${add(box.minLng)} AND ${add(box.maxLng)}`,
    ...filterConditions(viewer, filters, vals),
  ];
  const rows = await q<Candidate>(
    `SELECT * FROM (
       SELECT a.id, ${DIST_SQL} AS dist, ${actSql('$4::timestamptz')} AS act, a.created_at AS created,
              pr.intention, (pr.intention IS NOT NULL AND pr.intention_expires_at > now()) AS has_intention,
              CASE WHEN pr.response_rate_enabled THEN pr.response_band END AS response
         FROM accounts a
         JOIN profiles pr ON pr.account_id = a.id
         JOIN locations l ON l.account_id = a.id
        WHERE ${where.join(' AND ')}
     ) d WHERE d.dist <= ${add(capKm)} AND d.act < 7`,
    vals,
  );
  return rows;
}

function mix(seed: string, id: string): string {
  return createHash('sha256').update(`${seed}:${id}`).digest('hex');
}

/** Reihenfolge innerhalb eines Abschnitts (Issue #22, Abschnitte 3 und 4). */
export function sortSection(rows: Candidate[], opts: { sort: SortMode; seed: string; viewerIntention: string | null }): Candidate[] {
  const newMs = p('P-NEU-TAGE') * 86400_000;
  const nowMs = Date.now();
  const keyed = rows.map((r) => {
    let first = 0;
    if (opts.sort === 'neu') first = nowMs - new Date(r.created).getTime() < newMs ? 0 : 1;
    else if (opts.sort === 'absicht') first = r.has_intention && r.intention === opts.viewerIntention ? 0 : r.has_intention ? 2 : 1;
    else if (opts.sort === 'antwortquote') first = r.response ?? 9;
    // Inaktive ab P-RASTER-INAKTIV-UNTEN ans Ende des Abschnitts — auch bei anderer Sortierung
    const tail = r.act >= 6 ? 1 : 0;
    return { r, k: [tail, first, r.act, distanceBucket(r.dist)], rnd: mix(opts.seed, r.id) };
  });
  keyed.sort((x, y) => {
    for (let i = 0; i < x.k.length; i++) if (x.k[i] !== y.k[i]) return x.k[i] - y.k[i];
    return x.rnd < y.rnd ? -1 : x.rnd > y.rnd ? 1 : 0;
  });
  return keyed.map((x) => x.r);
}

/**
 * Teilt die Kandidaten in Abschnitte: erst alles im Radius, dann — wenn weniger als
 * P-RASTER-MIN — Stufe um Stufe bis zur Obergrenze. Stufen ohne neue Profile bekommen
 * keinen Abschnitt (kein Trenner).
 */
export function buildSections(all: Candidate[], radiusKm: number, capKm: number) {
  const min = p('P-RASTER-MIN');
  const inside = all.filter((c) => c.dist <= radiusKm);
  const sections: { km: number; prevKm: number | null; rows: Candidate[] }[] = [{ km: radiusKm, prevKm: null, rows: inside }];
  let count = inside.length;
  let lower = radiusKm;
  if (count < min && capKm > radiusKm) {
    const stages = (p('P-RASTER-STUFEN') as readonly number[]).filter((s) => s > radiusKm && s <= capKm);
    if (!stages.includes(capKm)) stages.push(capKm);
    for (const s of stages) {
      const rows = all.filter((c) => c.dist > lower && c.dist <= s);
      if (rows.length) {
        const prevKm = sections[sections.length - 1].km;
        sections.push({ km: s, prevKm, rows });
        count += rows.length;
      }
      lower = s;
      if (count >= min) break;
    }
  }
  return { sections, inRadius: inside.length, total: count };
}

async function tilesFor(ids: string[], viewer: Viewer, cityMode: boolean): Promise<Map<string, Tile>> {
  if (!ids.length) return new Map();
  const rows = await q(
    `SELECT ${CARD_COLUMNS} FROM accounts a
       JOIN profiles pr ON pr.account_id = a.id
       JOIN locations l ON l.account_id = a.id
      WHERE a.id = ANY($2::uuid[]) AND ${VISIBLE_SQL} AND NOT l.invisible AND l.level <> 'aus' AND a.hash_restricted_at IS NULL`,
    [viewer.id, ids],
  );
  const out = new Map<string, Tile>();
  for (const r of rows) {
    const tile = toTile(r, viewer);
    // FV-39: bei Stadtwahl keine Entfernungen
    out.set(r.id, cityMode ? { ...tile, km: null, approx: false } : tile);
  }
  return out;
}

function cursorOf(snapshot: string, offset: number) {
  return `${snapshot}.${offset}`;
}

async function pageFrom(
  snap: { id: string | null; ids: string[]; sections: number[]; meta: { sections: Section[]; cityMode: boolean } },
  offset: number,
  viewer: Viewer,
): Promise<GridPage> {
  const size = p('P-RASTER-SEITE');
  const slice = snap.ids.slice(offset, offset + size);
  const secs = snap.sections.slice(offset, offset + size);
  const map = await tilesFor(slice, viewer, snap.meta.cityMode);
  const tiles: (Tile & { section: number })[] = [];
  slice.forEach((id, i) => {
    const tile = map.get(id);
    // Wer inzwischen blockiert, gelöscht oder unsichtbar ist, fällt heraus — nichts rückt nach
    if (tile) tiles.push({ ...tile, section: secs[i] });
  });
  const next = offset + size;
  const hasMore = next < snap.ids.length;
  return {
    tiles,
    sections: snap.meta.sections,
    cursor: hasMore && snap.id ? cursorOf(snap.id, next) : null,
    hasMore: hasMore && !!snap.id,
    total: snap.ids.length,
  };
}

export async function discover(opts: DiscoverOpts): Promise<DiscoverResult> {
  const radiusKm = Math.max(1, Math.min(opts.grid.radiusKm, p('P-RASTER-RADIUS-MAX')));
  const capKm = expansionCap(radiusKm, opts.grid.expand);
  const all = await candidates(opts, capKm);
  const built = buildSections(all, radiusKm, capKm);
  const ordered: Candidate[] = [];
  const sectionOf: number[] = [];
  const sections: Section[] = [];
  built.sections.forEach((s, i) => {
    sections.push({ index: i, km: s.km, prevKm: s.prevKm });
    for (const r of sortSection(s.rows, { sort: opts.sort, seed: opts.seed, viewerIntention: opts.viewer.intention })) {
      ordered.push(r);
      sectionOf.push(i);
    }
  });
  const meta = { sections, cityMode: opts.cityMode };
  let snapId: string | null = null;
  if (opts.viewer.id) {
    const snap = await one(
      `INSERT INTO grid_snapshots (account_id, ids, sections, meta) VALUES ($1, $2, $3, $4) RETURNING id`,
      [opts.viewer.id, ordered.map((r) => r.id), sectionOf, JSON.stringify(meta)],
    );
    snapId = snap!.id;
    // nur die jüngsten Listen je Person behalten
    await q(
      `DELETE FROM grid_snapshots WHERE account_id = $1 AND id NOT IN (
         SELECT id FROM grid_snapshots WHERE account_id = $1 ORDER BY created_at DESC LIMIT 3)`,
      [opts.viewer.id],
    );
  }
  const page = await pageFrom({ id: snapId, ids: ordered.map((r) => r.id), sections: sectionOf, meta }, 0, opts.viewer);

  // „Neu in deiner Nähe“: im Radius, sonst bis zur Obergrenze der Erweiterung — nach Entfernung
  const newMs = p('P-NEU-TAGE') * 86400_000;
  const isNew = (c: Candidate) => Date.now() - new Date(c.created).getTime() < newMs;
  let fresh = all.filter((c) => c.dist <= radiusKm && isNew(c));
  if (!fresh.length) fresh = all.filter(isNew);
  fresh = fresh.sort((x, y) => x.dist - y.dist).slice(0, p('P-NEU-REIHE'));
  const freshTiles = await tilesFor(
    fresh.map((c) => c.id),
    opts.viewer,
    opts.cityMode,
  );
  const newNearby = fresh.map((c) => freshTiles.get(c.id)).filter(Boolean) as Tile[];

  const soonNearby = opts.cityMode ? [] : await soonTiles(opts.viewer, opts.ref);

  return {
    ...page,
    soonNearby,
    radiusKm,
    capKm,
    inRadius: built.inRadius,
    fewNearby: built.inRadius < p('P-RASTER-MIN'),
    newNearby,
    sort: opts.sort,
  };
}

/**
 * „Bald in der Gegend“ (Issue #18): öffentliche Reisen, deren Ziel (mit seinem Umkreis je nach
 * Ortsgröße) den Bezugspunkt einschließt — ab P-BALD-TAGE vor der Anreise bis zum letzten Tag.
 */
async function soonTiles(viewer: Viewer, ref: LatLng) {
  const rows = await q(
    `SELECT ${CARD_COLUMNS}, t.place_label, t.from_date, t.to_date
       FROM trips t
       JOIN accounts a ON a.id = t.account_id
       JOIN profiles pr ON pr.account_id = a.id
       LEFT JOIN locations l ON l.account_id = a.id
      WHERE t.public AND t.to_date >= current_date AND t.from_date - make_interval(days => $4) <= current_date
        AND ${VISIBLE_SQL} AND a.hash_restricted_at IS NULL
        AND (2 * 6371.0088 * asin(least(1, sqrt(power(sin(radians(t.lat - $2) / 2), 2) +
             cos(radians($2)) * cos(radians(t.lat)) * power(sin(radians(t.lng - $3) / 2), 2))))) <= t.radius_km
      ORDER BY t.from_date LIMIT 20`,
    [viewer.id, ref.lat, ref.lng, p('P-BALD-TAGE')],
  );
  const seen = new Set<string>();
  const out = [];
  for (const r of rows) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    const d = (x: Date) => new Date(x).toISOString().slice(0, 10);
    out.push({ ...toTile(r, viewer), soon: { from: d(r.from_date), to: d(r.to_date), place: r.place_label } });
  }
  return out;
}

/** Nachladen aus der gespeicherten Reihenfolge. null = Liste abgelaufen (dann neu laden). */
export async function discoverMore(viewer: Viewer, cursor: string): Promise<GridPage | null> {
  const m = /^([0-9a-f-]{36})\.(\d{1,6})$/.exec(cursor);
  if (!m || !viewer.id) return null;
  const snap = await one(
    `SELECT id, ids, sections, meta FROM grid_snapshots WHERE id = $1 AND account_id = $2 AND created_at > now() - interval '6 hours'`,
    [m[1], viewer.id],
  );
  if (!snap) return null;
  return pageFrom({ id: snap.id, ids: snap.ids, sections: snap.sections, meta: snap.meta }, Number(m[2]), viewer);
}

/** Trefferzähler (F26, FV-42): genau so viele Profile, wie das Raster mit diesen Filtern zeigen würde. */
export async function countMatches(opts: Omit<DiscoverOpts, 'seed' | 'sort'>): Promise<number> {
  const radiusKm = Math.max(1, Math.min(opts.grid.radiusKm, p('P-RASTER-RADIUS-MAX')));
  const capKm = expansionCap(radiusKm, opts.grid.expand);
  const all = await candidates({ ...opts, seed: '', sort: 'naehe' }, capKm);
  return buildSections(all, radiusKm, capKm).total;
}

/**
 * Namenssuche (Issue #20): Teil des Namens, ohne Groß-/Kleinschreibung, nur sichtbare Profile,
 * die gefunden werden möchten, bis P-SUCHE-MAX-KM um den eigenen Ort (oder die gewählte Stadt).
 * Dieselben Filter wie im Raster. Treffer am Namensanfang zuerst, dann nach Entfernung.
 * Ohne Bezugspunkt keine Suche — sonst ließe sich jede Person bundesweit finden.
 */
export async function searchByName(opts: { viewer: Viewer; ref: LatLng; cityMode: boolean; query: string; filters: Filters; limit: number }) {
  const vals: unknown[] = [opts.viewer.id];
  const add = (v: unknown) => {
    vals.push(v);
    return `$${vals.length}`;
  };
  const needle = opts.query.trim().toLocaleLowerCase('de-DE').replace(/[\\%_]/g, (c) => `\\${c}`);
  const where = [
    VISIBLE_SQL,
    `pr.name_searchable`,
    `a.hash_restricted_at IS NULL`,
    `NOT l.invisible`,
    `l.level <> 'aus'`,
    `l.display_lat IS NOT NULL`,
    `lower(pr.name) LIKE ${add(`%${needle}%`)}`,
    ...filterConditions(opts.viewer, opts.filters, vals),
  ];
  const box = boundingBox(opts.ref, p('P-SUCHE-MAX-KM'));
  const la = add(opts.ref.lat);
  const ln = add(opts.ref.lng);
  const distExpr = `(2 * 6371.0088 * asin(least(1, sqrt(power(sin(radians(l.display_lat - ${la}) / 2), 2) +
    cos(radians(${la})) * cos(radians(l.display_lat)) * power(sin(radians(l.display_lng - ${ln}) / 2), 2)))))`;
  where.push(`l.display_lat BETWEEN ${add(box.minLat)} AND ${add(box.maxLat)}`, `l.display_lng BETWEEN ${add(box.minLng)} AND ${add(box.maxLng)}`);
  const prefix = add(`${needle}%`);
  const rows = await q(
    `SELECT * FROM (
       SELECT ${CARD_COLUMNS}, ${distExpr} AS dist, (lower(pr.name) LIKE ${prefix}) AS prefix_hit
         FROM accounts a JOIN profiles pr ON pr.account_id = a.id JOIN locations l ON l.account_id = a.id
        WHERE ${where.join(' AND ')}
     ) d WHERE d.dist <= ${p('P-SUCHE-MAX-KM')}
     ORDER BY d.prefix_hit DESC, d.dist, lower(d.name) LIMIT ${Math.min(Math.max(opts.limit, 1), 60)}`,
    vals,
  );
  return rows.map((r) => {
    const tile = toTile(r, opts.viewer);
    return opts.cityMode ? { ...tile, km: null, approx: false } : tile;
  });
}
