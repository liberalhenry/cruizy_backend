import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { p } from '../config/params.js';
import { one, q } from '../db/pool.js';
import { requireMember } from '../lib/context.js';
import { bad, notFound, tooMany } from '../lib/errors.js';
import { body } from '../lib/http.js';
import { hit } from '../lib/rate.js';
import { BODY_TYPE_KEYS, KINK_KEYS, POSITION_KEYS } from '../services/catalogs.js';
import { activeFilterCount, countMatches, discover, discoverMore, searchByName, type Filters, type SortMode } from '../services/discovery.js';
import { viewerFor, type Viewer } from '../services/profiles.js';
import { touchActivity } from '../services/activity.js';
import { type LatLng } from '../lib/geo.js';

const range = (min: number, max: number) => z.object({ min: z.number().int().min(min).max(max), max: z.number().int().min(min).max(max) });

export const filterSchema = z
  .object({
    intentions: z.array(z.enum(['abend', 'schreiben', 'absicht3', 'absicht4', 'offen'])).max(5).optional(),
    age: range(18, 120).optional(),
    weight: range(35, 250).optional(),
    height: range(120, 230).optional(),
    bodyTypes: z.array(z.string()).max(20).optional(),
    kinks: z.array(z.string()).max(40).optional(),
    positions: z.array(z.string()).max(6).optional(),
    responsive: z.boolean().optional(),
    withPhoto: z.boolean().optional(),
  })
  // alte gespeicherte Filter (Entfernungsbänder) werden still verworfen
  .passthrough()
  .transform((f) => {
    const { bands: _bands, ...rest } = f as Record<string, unknown>;
    return rest as Filters;
  })
  .default({});

export function checkFilters(f: Filters) {
  for (const r of [f.age, f.weight, f.height]) if (r && r.min > r.max) throw bad('UI-EINGABE-PRUEFEN', {}, 'bereich');
  if (f.bodyTypes?.some((x) => !BODY_TYPE_KEYS.has(x))) throw bad('UI-EINGABE-PRUEFEN', {}, 'koerpertyp');
  if (f.kinks?.some((x) => !KINK_KEYS.has(x))) throw bad('UI-EINGABE-PRUEFEN', {}, 'kink');
  if (f.positions?.some((x) => !POSITION_KEYS.has(x))) throw bad('UI-EINGABE-PRUEFEN', {}, 'position');
}

/** Bezugspunkt fürs Raster: Reiseziel (Travel, Issue #18) → eigene Zelle → gewählte Stadt. */
export async function resolveRef(accountId: string): Promise<{ viewer: Viewer; ref: LatLng | null; cityMode: boolean; travel: boolean }> {
  const viewer = await viewerFor(accountId);
  const tr = await one(`SELECT travel_lat, travel_lng FROM locations WHERE account_id = $1 AND travel_lat IS NOT NULL`, [accountId]);
  if (tr) return { viewer: { ...viewer, cell: { lat: tr.travel_lat, lng: tr.travel_lng } }, ref: { lat: tr.travel_lat, lng: tr.travel_lng }, cityMode: false, travel: true };
  if (viewer.cell) return { viewer, ref: viewer.cell, cityMode: false, travel: false };
  const loc = await one(`SELECT c.lat, c.lng FROM locations l JOIN cities c ON c.id = l.city_id WHERE l.account_id = $1`, [accountId]);
  if (loc) return { viewer, ref: { lat: loc.lat, lng: loc.lng }, cityMode: true, travel: false };
  return { viewer, ref: null, cityMode: true, travel: false };
}

const gridSchema = z.object({
  radiusKm: z.number().int().min(1).max(1000).optional(),
  expand: z.boolean().optional(),
});

export default async function discoveryRoutes(app: FastifyInstance) {
  app.post('/api/discovery', async (req) => {
    const a = await requireMember(req);
    const b = body(
      req,
      z.object({
        sort: z.enum(['naehe', 'antwortquote', 'neu', 'absicht']).optional(),
        filters: filterSchema,
        grid: gridSchema.optional(),
        seed: z.string().min(1).max(64).optional(),
        cursor: z.string().max(80).optional(),
        // ältere Oberfläche: Seitenzahl — wird wie ein neuer Aufruf behandelt
        page: z.number().int().min(0).max(1000).optional(),
      }),
    );
    checkFilters(b.filters);
    await touchActivity(a.id);
    const { viewer, ref, cityMode, travel } = await resolveRef(a.id);

    // Nachladen: nur aus der gespeicherten Reihenfolge — so ist die Folge stabil
    if (b.cursor) {
      const page = await discoverMore(viewer, b.cursor);
      if (!page) return { expired: true, tiles: [], sections: [], hasMore: false, cursor: null };
      return { ...page, cityMode };
    }

    const prof = await one(`SELECT sort_mode, response_rate_enabled, grid_radius_km, grid_expand FROM profiles WHERE account_id = $1`, [a.id]);
    let sort: SortMode = (b.sort ?? prof?.sort_mode ?? 'naehe') as SortMode;
    // AK-F24-06 / AK-X18-01: ohne eigene Antwortquote keine Sortierung danach
    if (sort === 'antwortquote' && !prof?.response_rate_enabled) sort = 'naehe';
    const grid = {
      radiusKm: Math.min(b.grid?.radiusKm ?? prof?.grid_radius_km ?? p('P-RASTER-RADIUS'), p('P-RASTER-RADIUS-MAX')),
      expand: b.grid?.expand ?? prof?.grid_expand ?? true,
    };
    // AK-F24-02: Sortierung, Filter und Radius bleiben gespeichert
    await q(
      `UPDATE profiles SET sort_mode = $2, filters = $3, grid_radius_km = $4, grid_expand = $5 WHERE account_id = $1`,
      [a.id, sort, JSON.stringify(b.filters), grid.radiusKm, grid.expand],
    );
    if (!ref) return { needsLocation: true, tiles: [], sections: [], newNearby: [], sort, grid };
    const seed = `${a.id}:${b.seed ?? new Date().toISOString().slice(0, 13)}`;
    const res = await discover({ viewer, ref, cityMode, sort, filters: b.filters, grid, seed });
    return {
      ...res,
      cityMode,
      travel,
      grid,
      filtersActive: activeFilterCount(b.filters),
      noResultsWithFilters: res.total === 0 && activeFilterCount(b.filters) > 0,
      seedPauseMin: Math.round(p('P-RASTER-SEED-PAUSE') / 60),
    };
  });

  app.post('/api/discovery/count', async (req) => {
    const a = await requireMember(req);
    const b = body(req, z.object({ filters: filterSchema, grid: gridSchema.optional() }));
    checkFilters(b.filters);
    const { viewer, ref, cityMode } = await resolveRef(a.id);
    if (!ref) return { count: 0 };
    const prof = await one(`SELECT grid_radius_km, grid_expand FROM profiles WHERE account_id = $1`, [a.id]);
    const grid = { radiusKm: b.grid?.radiusKm ?? prof?.grid_radius_km ?? p('P-RASTER-RADIUS'), expand: b.grid?.expand ?? prof?.grid_expand ?? true };
    return { count: await countMatches({ viewer, ref, cityMode, filters: b.filters, grid }) };
  });

  /** Namenssuche (Issue #20). */
  app.post('/api/search', async (req) => {
    const a = await requireMember(req);
    const b = body(req, z.object({ q: z.string().max(40), filters: filterSchema }));
    checkFilters(b.filters);
    if ([...b.q.trim()].length < p('P-SUCHE-MIN-ZEICHEN')) throw bad('UI-SUCHE-ZU-KURZ', { zahl: p('P-SUCHE-MIN-ZEICHEN') }, 'zu_kurz');
    if (!hit('search', a.id, 60, 60_000)) throw tooMany();
    const { viewer, ref, cityMode } = await resolveRef(a.id);
    if (!ref) return { needsLocation: true, results: [] };
    return { results: await searchByName({ viewer, ref, cityMode, query: b.q, filters: b.filters, limit: 60 }), maxKm: p('P-SUCHE-MAX-KM') };
  });

  app.get('/api/search/me', async (req) => {
    const a = await requireMember(req);
    const r = await one(`SELECT name_searchable FROM profiles WHERE account_id = $1`, [a.id]);
    if (!r) throw notFound();
    return { searchable: r.name_searchable };
  });
}
