/** Travel-Modus, Punkt verschieben, Reisen und Ortsverzeichnis (Issue #18). */
import { describe, expect, it } from 'vitest';
import { one, q } from '../src/db/pool.js';
import { destination, displayKm, distanceKm, roundToCell } from '../src/lib/geo.js';
import { looksLikeRegion, placeRadiusKm, searchPlaces } from '../src/services/places-dir.js';
import { member } from './helpers.js';

const HH = { lat: 53.5507, lng: 9.9930 };
const MUC = { lat: 48.137, lng: 11.575 };

async function findTile(c: Awaited<ReturnType<typeof member>>['c'], id: string, body: Record<string, unknown> = { filters: {} }) {
  let r = await c.post('/api/discovery', body);
  for (let i = 0; i < 80; i++) {
    const x = [...(r.body.tiles ?? []), ...(r.body.soonNearby ?? [])].find((t: { id: string }) => t.id === id);
    if (x || !r.body.cursor) return { tile: x ?? null, res: r };
    r = await c.post('/api/discovery', { ...body, cursor: r.body.cursor });
  }
  return { tile: null, res: r };
}

describe('Ortsverzeichnis', () => {
  it('findet Städte, Dörfer und Stadtteile — keine Regionen', () => {
    expect(searchPlaces('München')[0].name).toBe('München');
    expect(searchPlaces('munich')[0].name).toBe('München');
    const kreuzberg = searchPlaces('Kreuzberg').find((x) => x.kind === 'stadtteil');
    expect(kreuzberg?.parent).toBe('Berlin');
    expect(searchPlaces('Bayern').some((x) => x.name === 'Bayern')).toBe(false);
    expect(looksLikeRegion('Bayern')).toBe(true);
    expect(looksLikeRegion('Freising')).toBe(false);
    expect(placeRadiusKm(searchPlaces('München')[0])).toBe(25);
  });

  it('Suche über die Schnittstelle meldet Regionen als zu grob', async () => {
    const m = await member();
    const r = await m.c.get('/api/places-dir/search?q=Bayern');
    expect(r.body.results).toEqual([]);
    expect(r.body.region).toBe(true);
    const ok = await m.c.get('/api/places-dir/search?q=Freising');
    expect(ok.body.results[0].label).toBe('Freising');
    expect(ok.body.results[0].detail).toBe('Bayern, DE');
  });
});

describe('Travel-Modus', () => {
  it('stöbert am Zielort; die anderen sehen die echte Entfernung und das Reise-Zeichen', async () => {
    const traveller = await member({ name: 'Reisender', pos: HH });
    const local = await member({ name: 'Münchner', pos: destination(MUC, 45, 2) });
    const muc = (await traveller.c.get('/api/places-dir/search?q=München')).body.results[0];
    expect((await traveller.c.put('/api/travel', { placeId: muc.id })).status).toBe(200);
    // der Reisende sieht Leute in München — Entfernung vom Zielort aus
    const { tile, res } = await findTile(traveller.c, local.id, { filters: {}, grid: { radiusKm: 10, expand: false } });
    expect(res.body.travel).toBe(true);
    expect(tile).toBeTruthy();
    expect(tile.km).toBeLessThanOrEqual(4);
    // die Münchner sehen die ECHTE Entfernung und das Reise-Zeichen
    const view = await local.c.get(`/api/profiles/${traveller.id}`);
    expect(view.body.profile.travel).toEqual({ mode: 'flug' });
    const real = displayKm(distanceKm(roundToCell(destination(MUC, 45, 2), 2000), roundToCell(HH, 2000)));
    expect(view.body.profile.km).toBe(real);
    expect(view.body.profile.travelPlace).toBe('München');
    await traveller.c.del('/api/travel');
    expect((await local.c.get(`/api/profiles/${traveller.id}`)).body.profile.travel).toBeNull();
  });

  it('Punkt verschieben: bis 20 km, als ungefährer Ort, nie genauer als die Zelle', async () => {
    const a = await member({ pos: HH });
    const b = await member({ pos: destination(HH, 180, 1) });
    expect((await a.c.put('/api/location/shift', { bearing: 90, km: 25 })).status).toBe(400);
    expect((await a.c.put('/api/location/shift', { bearing: 90, km: 12 })).status).toBe(200);
    const l = await one(`SELECT display_lat, display_lng, approx FROM locations WHERE account_id = $1`, [a.id]);
    expect(l!.approx).toBe(true);
    const shifted = { lat: l!.display_lat, lng: l!.display_lng };
    expect(roundToCell(shifted, 2000)).toEqual(shifted);
    const km = distanceKm(roundToCell(HH, 2000), shifted);
    expect(km).toBeGreaterThan(10);
    expect(km).toBeLessThan(14);
    const view = await b.c.get(`/api/profiles/${a.id}`);
    expect(view.body.profile.approx).toBe(true);
    expect(view.body.profile.km).toBeGreaterThanOrEqual(10);
    await a.c.del('/api/location/shift');
    const back = await one(`SELECT approx, shift_lat FROM locations WHERE account_id = $1`, [a.id]);
    expect(back!.shift_lat).toBeNull();
  });
});

describe('Reisen und „Bald in der Gegend“', () => {
  it('erscheint ab 3 Tagen vor der Anreise am Ziel, mit Hinweis auf Zeitraum und Ort', async () => {
    const t = await member({ name: 'Tourist', pos: HH });
    const viewer = await member({ pos: destination({ lat: 47.998, lng: 7.842 }, 0, 1) }); // Freiburg
    const fr = (await t.c.get('/api/places-dir/search?q=Freiburg')).body.results[0];
    const d = (days: number) => new Date(Date.now() + days * 86400_000).toISOString().slice(0, 10);
    const far = await t.c.post('/api/trips', { placeId: fr.id, from: d(10), to: d(14) });
    expect(far.status).toBe(200);
    let r = await viewer.c.post('/api/discovery', { filters: {} });
    expect(r.body.soonNearby.some((x: { id: string }) => x.id === t.id)).toBe(false);
    await q(`UPDATE trips SET from_date = current_date + 2, to_date = current_date + 6 WHERE id = $1`, [far.body.id]);
    r = await viewer.c.post('/api/discovery', { filters: {} });
    const soon = r.body.soonNearby.find((x: { id: string }) => x.id === t.id);
    expect(soon.soon.place).toBe('Freiburg');
    // im Profil sichtbar; nicht öffentlich → nirgends
    expect((await viewer.c.get(`/api/profiles/${t.id}`)).body.profile.trips[0].place).toBe('Freiburg');
    await t.c.patch(`/api/trips/${far.body.id}`, { public: false });
    r = await viewer.c.post('/api/discovery', { filters: {} });
    expect(r.body.soonNearby.some((x: { id: string }) => x.id === t.id)).toBe(false);
    expect((await viewer.c.get(`/api/profiles/${t.id}`)).body.profile.trips).toEqual([]);
  });

  it('nur Orte aus dem Verzeichnis, sinnvolle Daten', async () => {
    const t = await member({ pos: HH });
    const d = (days: number) => new Date(Date.now() + days * 86400_000).toISOString().slice(0, 10);
    expect((await t.c.post('/api/trips', { placeId: 1, from: d(1), to: d(2) })).body.code).toBe('ort_unbekannt');
    const muc = (await t.c.get('/api/places-dir/search?q=München')).body.results[0];
    expect((await t.c.post('/api/trips', { placeId: muc.id, from: d(5), to: d(2) })).body.code).toBe('datum');
    expect((await t.c.post('/api/trips', { placeId: muc.id, from: d(1), to: d(200) })).body.code).toBe('zu_lang');
  });

  it('mehr Städte für die Stadtwahl', async () => {
    const r = await (await member()).c.get('/api/cities');
    expect(r.body.cities.length).toBeGreaterThan(90);
    expect(r.body.cities.some((c: { name: string }) => c.name === 'Leipzig')).toBe(true);
  });
});
