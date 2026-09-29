/**
 * Standortschutz (F70, F60): nur Zellmittelpunkte, nur Entfernungsstufen,
 * keine Meter, keine Rückrechnung durch Dreiecksmessung.
 */
import { describe, expect, it } from 'vitest';
import { one } from '../src/db/pool.js';
import { band, destination, distanceKm, roundToCell } from '../src/lib/geo.js';
import { acceptPosition } from '../src/modules/location.js';
import { member } from './helpers.js';

const KOELN = { lat: 50.9375, lng: 6.9603 };

describe('Raster und Stufen', () => {
  it('rundet jede Position auf einen Zellmittelpunkt — Nachbarpunkte landen in derselben Zelle', () => {
    const a = roundToCell({ lat: 50.93751, lng: 6.96031 }, 2000);
    const b = roundToCell({ lat: 50.93752, lng: 6.96029 }, 2000);
    expect(a).toEqual(b);
    // die Rundung verschiebt höchstens um eine halbe Zellendiagonale
    expect(distanceKm(a, { lat: 50.93751, lng: 6.96031 })).toBeLessThan(1.5);
  });

  it('kennt nur vier Stufen', () => {
    expect(band(0.2)).toBe(1);
    expect(band(2)).toBe(2);
    expect(band(7)).toBe(3);
    expect(band(40)).toBe(4);
  });

  it('speichert nie die gemeldete Position, nur den Zellmittelpunkt', async () => {
    const m = await member();
    const pos = { lat: 50.941234, lng: 6.957891 };
    await acceptPosition(m.id, pos, { force: true });
    const row = await one(`SELECT cell_lat, cell_lng, display_lat, display_lng FROM locations WHERE account_id = $1`, [m.id]);
    const cell = roundToCell(pos, 2000);
    expect(row!.cell_lat).toBeCloseTo(cell.lat, 9);
    expect(row!.cell_lng).toBeCloseTo(cell.lng, 9);
    expect(row!.cell_lat).not.toBeCloseTo(pos.lat, 5);
  });

  it('Stufe „Aus“ speichert keine Position (AK-F69-04)', async () => {
    const m = await member({ level: 'aus' });
    const r = await acceptPosition(m.id, KOELN, { force: true });
    expect(r.accepted).toBe(false);
    const row = await one(`SELECT cell_lat FROM locations WHERE account_id = $1`, [m.id]);
    expect(row!.cell_lat).toBeNull();
  });
});

describe('Entdecken', () => {
  it('liefert nur Stufen — keine Koordinaten, keine Meter, keine Kilometer', async () => {
    const target = await member({ pos: destination(KOELN, 45, 2.2) });
    const viewer = await member({ pos: KOELN });
    const r = await viewer.c.post('/api/discovery', { filters: {} });
    expect(r.status).toBe(200);
    const tile = [...r.body.tiles, ...(r.body.weekly ?? [])].find((x: { id: string }) => x.id === target.id);
    expect(tile).toBeTruthy();
    expect([1, 2, 3, 4]).toContain(tile.band);
    const json = JSON.stringify(r.body);
    expect(json).not.toMatch(/"(lat|lng|latitude|longitude|meters|km|distance)"/i);
  });

  it('Dreiecksmessung aus vielen Blickpunkten ergibt nicht mehr als die Zelle', async () => {
    const secret = { lat: 50.9502, lng: 6.9377 };
    const target = await member({ pos: secret });
    // Angreifer misst von 12 Punkten im Kreis — er bekommt nur Stufen
    const bandsSeen = new Set<number>();
    for (let i = 0; i < 12; i++) {
      const spy = await member({ pos: destination(secret, i * 30, 1.2) });
      const r = await spy.c.post('/api/discovery', { filters: {} });
      const tile = [...r.body.tiles, ...(r.body.weekly ?? [])].find((x: { id: string }) => x.id === target.id);
      expect(tile).toBeTruthy();
      bandsSeen.add(tile.band);
    }
    // alle Messpunkte liegen in 1–3 km → höchstens zwei verschiedene Stufen, keine feinere Information
    expect([...bandsSeen].every((b) => b === 1 || b === 2)).toBe(true);
  });

  it('blockierte Personen verschwinden in beide Richtungen (AK-F61-06)', async () => {
    const a = await member({ pos: KOELN });
    const b = await member({ pos: destination(KOELN, 90, 0.5) });
    const blk = await a.c.post('/api/blocks', { targetId: b.id });
    expect(blk.status).toBe(200);
    const ra = await a.c.post('/api/discovery', { filters: {} });
    const rb = await b.c.post('/api/discovery', { filters: {} });
    const has = (r: { body: { tiles: { id: string }[]; weekly?: { id: string }[] } }, id: string) =>
      [...r.body.tiles, ...(r.body.weekly ?? [])].some((x) => x.id === id);
    expect(has(ra, b.id)).toBe(false);
    expect(has(rb, a.id)).toBe(false);
    expect((await a.c.get(`/api/profiles/${b.id}`)).status).toBe(404);
  });

  it('höchstens zwei Filter gleichzeitig (AK-F26-01)', async () => {
    const a = await member({ pos: KOELN });
    const r = await a.c.post('/api/discovery', { filters: { bands: [1], intentions: ['abend'], age: { min: 20, max: 30 } } });
    expect(r.status).toBe(400);
    expect(r.body.fehler).toBe('ST-FEH-61');
  });
});
