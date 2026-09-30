/**
 * Standortschutz (F70, F60): nur Zellmittelpunkte, nur Entfernungsstufen,
 * keine Meter, keine Rückrechnung durch Dreiecksmessung.
 */
import { describe, expect, it } from 'vitest';
import { one } from '../src/db/pool.js';
import { band, destination, displayKm, distanceKm, roundToCell } from '../src/lib/geo.js';
import { acceptPosition } from '../src/modules/location.js';
import { member, type Member } from './helpers.js';

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

/** Sucht eine Kachel im Raster — über alle Seiten (die Testdatenbank ist voll). */
export async function findTile(c: Member['c'], id: string, body: Record<string, unknown> = { filters: {} }) {
  let r = await c.post('/api/discovery', body);
  for (let i = 0; i < 60; i++) {
    const tile = [...(r.body.tiles ?? []), ...(r.body.newNearby ?? [])].find((x: { id: string }) => x.id === id);
    if (tile) return { tile, res: r };
    if (!r.body.cursor) return { tile: null, res: r };
    r = await c.post('/api/discovery', { ...body, cursor: r.body.cursor });
  }
  return { tile: null, res: r };
}

describe('Entdecken', () => {
  it('liefert gerundete Kilometer — keine Koordinaten, keine Meter (Issue #12)', async () => {
    const target = await member({ pos: destination(KOELN, 45, 6.3) });
    const viewer = await member({ pos: KOELN });
    const { tile, res } = await findTile(viewer.c, target.id);
    expect(res.status).toBe(200);
    expect(tile).toBeTruthy();
    expect(Number.isInteger(tile.km)).toBe(true);
    // Zellmittelpunkte (2 km) — die Zahl stimmt mit der Entfernung der Zellen überein
    const a = roundToCell(KOELN, 2000);
    const b = roundToCell(destination(KOELN, 45, 6.3), 2000);
    expect(tile.km).toBe(displayKm(distanceKm(a, b)));
    const json = JSON.stringify(res.body);
    expect(json).not.toMatch(/"(lat|lng|latitude|longitude|meters|distance|dist)"/i);
  });

  it('rundet: < 1 km, ganze km bis 14, dann 5er-, ab 100 km 10er-Schritte', () => {
    expect(displayKm(0.4)).toBe(0);
    expect(displayKm(1.2)).toBe(1);
    expect(displayKm(9.6)).toBe(10);
    expect(displayKm(13.2)).toBe(13);
    expect(displayKm(16)).toBe(15);
    expect(displayKm(23)).toBe(25);
    expect(displayKm(98)).toBe(100);
    expect(displayKm(143)).toBe(140);
  });

  it('Dreiecksmessung aus vielen Blickpunkten ergibt nicht mehr als die Zelle', async () => {
    const secret = { lat: 50.9502, lng: 6.9377 };
    const target = await member({ pos: secret });
    const targetCell = roundToCell(secret, 2000);
    // Angreifer misst von 12 Punkten im Kreis — jede Zahl ist die Entfernung zum ZELLMITTELPUNKT
    for (let i = 0; i < 12; i++) {
      const spyPos = destination(secret, i * 30, 1.2);
      const spy = await member({ pos: spyPos });
      const { tile } = await findTile(spy.c, target.id);
      expect(tile).toBeTruthy();
      expect(tile.km).toBe(displayKm(distanceKm(roundToCell(spyPos, 2000), targetCell)));
    }
  });

  it('blockierte Personen verschwinden in beide Richtungen (AK-F61-06)', async () => {
    const a = await member({ pos: KOELN });
    const b = await member({ pos: destination(KOELN, 90, 0.5) });
    const blk = await a.c.post('/api/blocks', { targetId: b.id });
    expect(blk.status).toBe(200);
    expect((await findTile(a.c, b.id)).tile).toBeNull();
    expect((await findTile(b.c, a.id)).tile).toBeNull();
    expect((await a.c.get(`/api/profiles/${b.id}`)).status).toBe(404);
  });

  it('beliebig viele Filter gleichzeitig; alte Entfernungsbänder werden ignoriert (Issue #20)', async () => {
    const a = await member({ pos: KOELN });
    const r = await a.c.post('/api/discovery', { filters: { bands: [1], intentions: ['abend'], age: { min: 20, max: 30 }, weight: { min: 60, max: 90 }, bodyTypes: ['otter'] } });
    expect(r.status).toBe(200);
    const bad = await a.c.post('/api/discovery', { filters: { bodyTypes: ['gibtsnicht'] } });
    expect(bad.status).toBe(400);
  });
});
