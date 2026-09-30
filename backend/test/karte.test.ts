/** Karte ohne US-Dienste (Issue #17): Kachelabruf nur im erlaubten Gebiet, Grundkarte als Rückfall. */
import { describe, expect, it } from 'vitest';
import { mapConfig, tileInArea } from '../src/modules/karte.js';
import { member } from './helpers.js';

describe('Karte', () => {
  it('ohne Kachelserver: Grundkarte ohne Dritte', async () => {
    expect(mapConfig().mode).toBe('grundkarte');
    const m = await member();
    const r = await m.c.get('/api/map/config');
    expect(r.body).toMatchObject({ mode: 'grundkarte', tiles: null });
    // ohne MAP_TILE_UPSTREAM gibt es keinen Abruf
    expect((await m.c.get('/api/map/tiles/10/540/330')).status).toBe(404);
  });

  it('nur Kacheln über DACH und Umgebung', () => {
    // Hamburg z10
    expect(tileInArea(10, 540, 329)).toBe(true);
    // München z12
    expect(tileInArea(12, 2179, 1421)).toBe(true);
    // New York z10
    expect(tileInArea(10, 301, 385)).toBe(false);
    // ganz herausgezoomt: die eine Kachel enthält Europa
    expect(tileInArea(0, 0, 0)).toBe(true);
    expect(tileInArea(3, 9, 9)).toBe(false);
    expect(tileInArea(5, 99, 1)).toBe(false);
  });

  it('ohne Anmeldung kein Abruf', async () => {
    const { Client, testApp } = await import('./helpers.js');
    const c = new Client(await testApp());
    expect((await c.get('/api/map/tiles/10/540/329')).status).toBe(401);
  });
});
