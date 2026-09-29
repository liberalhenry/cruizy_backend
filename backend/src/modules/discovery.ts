import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { p } from '../config/params.js';
import { one, q } from '../db/pool.js';
import { requireMember } from '../lib/context.js';
import { bad } from '../lib/errors.js';
import { body } from '../lib/http.js';
import { activeFilterCount, countMatches, discover, type Filters, type SortMode } from '../services/discovery.js';
import { viewerFor } from '../services/profiles.js';
import { touchActivity } from '../services/activity.js';

export const filterSchema = z
  .object({
    bands: z.array(z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])).max(4).optional(),
    intentions: z.array(z.enum(['abend', 'schreiben', 'absicht3', 'absicht4', 'offen'])).max(5).optional(),
    age: z.object({ min: z.number().int().min(18).max(99), max: z.number().int().min(18).max(120) }).optional(),
  })
  .default({});

export function checkFilters(f: Filters) {
  // AK-F26-01: höchstens zwei gleichzeitig
  if (activeFilterCount(f) > 2) throw bad('ST-FEH-61', {}, 'filtergrenze');
  if (f.age && f.age.min > f.age.max) throw bad('UI-EINGABE-PRUEFEN');
}

async function resolveRef(accountId: string) {
  const viewer = await viewerFor(accountId);
  if (viewer.cell) return { viewer, ref: viewer.cell, cityMode: false };
  const loc = await one(`SELECT c.lat, c.lng FROM locations l JOIN cities c ON c.id = l.city_id WHERE l.account_id = $1`, [accountId]);
  if (loc) return { viewer, ref: { lat: loc.lat, lng: loc.lng }, cityMode: true };
  return { viewer, ref: null, cityMode: true };
}

export default async function discoveryRoutes(app: FastifyInstance) {
  app.post('/api/discovery', async (req) => {
    const a = await requireMember(req);
    const b = body(
      req,
      z.object({
        sort: z.enum(['naehe', 'antwortquote', 'neu', 'absicht']).optional(),
        filters: filterSchema,
        page: z.number().int().min(0).max(50).default(0),
      }),
    );
    checkFilters(b.filters);
    await touchActivity(a.id);
    const prof = await one(`SELECT sort_mode, response_rate_enabled FROM profiles WHERE account_id = $1`, [a.id]);
    let sort: SortMode = (b.sort ?? prof?.sort_mode ?? 'naehe') as SortMode;
    // AK-F24-06 / AK-X18-01: ohne eigene Antwortquote keine Sortierung danach
    if (sort === 'antwortquote' && !prof?.response_rate_enabled) sort = 'naehe';
    if (b.sort && b.sort !== prof?.sort_mode) {
      // AK-F24-02: die Wahl bleibt gespeichert
      await q(`UPDATE profiles SET sort_mode = $2 WHERE account_id = $1`, [a.id, sort]);
    }
    await q(`UPDATE profiles SET filters = $2 WHERE account_id = $1`, [a.id, JSON.stringify(b.filters)]);
    const { viewer, ref, cityMode } = await resolveRef(a.id);
    if (!ref) return { needsLocation: true, tiles: [], weekly: [], sort };
    const res = await discover({ viewer, ref, cityMode, sort, filters: b.filters, page: b.page });
    return {
      ...res,
      cityMode,
      // Namen der Abschnitte und Regeln stehen in der Textdatei (ST-STO-14, S11)
      filtersActive: activeFilterCount(b.filters),
      target: p('P-RASTER-ZIEL'),
      noResultsWithFilters: res.total === 0 && activeFilterCount(b.filters) > 0,
    };
  });

  app.post('/api/discovery/count', async (req) => {
    const a = await requireMember(req);
    const b = body(req, z.object({ filters: filterSchema }));
    checkFilters(b.filters);
    const { viewer, ref, cityMode } = await resolveRef(a.id);
    if (!ref) return { count: 0 };
    return { count: await countMatches({ viewer, ref, cityMode, sort: 'naehe', filters: b.filters, page: 0 }) };
  });
}
