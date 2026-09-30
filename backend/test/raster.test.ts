/**
 * Raster (Issue #22): Radius, stufenweise Erweiterung mit Trennern, Obergrenzen, stabile
 * Reihenfolge je Seed, Aktivitätsstufen, „Neu“; Namenssuche und Filter (Issue #20).
 *
 * Jeder Test arbeitet in einer eigenen, weit entfernten Gegend — die Testdatenbank enthält
 * viele Profile rund um Köln.
 */
import { describe, expect, it } from 'vitest';
import { q } from '../src/db/pool.js';
import { destination } from '../src/lib/geo.js';
import { buildSections, distanceBucket, expansionCap } from '../src/services/discovery.js';
import { member } from './helpers.js';

// je Test eine Gegend, mindestens ~300 km voneinander entfernt
const AREA = (k: number) => ({ lat: 64, lng: -20 + k * 7 });

function cand(id: string, dist: number, act = 1) {
  return { id, dist, act, created: new Date(0), intention: null, has_intention: false, response: null };
}

async function allPages(c: Awaited<ReturnType<typeof member>>['c'], body: Record<string, unknown>) {
  let r = await c.post('/api/discovery', body);
  const first = r.body;
  const tiles = [...r.body.tiles];
  for (let i = 0; i < 50 && r.body.cursor; i++) {
    r = await c.post('/api/discovery', { ...body, cursor: r.body.cursor });
    tiles.push(...r.body.tiles);
  }
  return { first, tiles };
}

describe('Erweiterung (Logik)', () => {
  it('Obergrenzen: unter 100 km → 100, ab 100 → 150, ab 150 → keine Erweiterung, aus → Radius', () => {
    expect(expansionCap(30, true)).toBe(100);
    expect(expansionCap(99, true)).toBe(100);
    expect(expansionCap(100, true)).toBe(150);
    expect(expansionCap(120, true)).toBe(150);
    expect(expansionCap(150, true)).toBe(150);
    expect(expansionCap(200, true)).toBe(200);
    expect(expansionCap(30, false)).toBe(30);
  });

  it('erweitert stufenweise bis mindestens 50 — nur mit neuen Profilen je Stufe', () => {
    const all = [
      ...Array.from({ length: 10 }, (_, i) => cand(`a${i}`, 3)),
      ...Array.from({ length: 20 }, (_, i) => cand(`b${i}`, 20)),
      ...Array.from({ length: 30 }, (_, i) => cand(`c${i}`, 40)),
      ...Array.from({ length: 30 }, (_, i) => cand(`d${i}`, 90)),
    ];
    const r = buildSections(all, 10, 100);
    expect(r.sections.map((s) => [s.km, s.prevKm, s.rows.length])).toEqual([
      [10, null, 10],
      [25, 10, 20],
      [50, 25, 30],
    ]);
    expect(r.total).toBe(60);
    // Radius 30 → nächste Stufe 50 (danach sind es 60 — Schluss)
    const r2 = buildSections(all, 30, 100);
    expect(r2.sections.map((s) => s.km)).toEqual([30, 50]);
    // mit weniger Profilen weiter bis 100
    const r3 = buildSections(all.filter((c) => c.dist !== 40), 30, 100);
    expect(r3.sections.map((s) => s.km)).toEqual([30, 100]);
  });

  it('kein Trenner für Stufen ohne neue Profile; Obergrenze wird nie überschritten', () => {
    const all = [cand('a', 2), cand('b', 70), cand('c', 140)];
    const r = buildSections(all, 5, 100);
    expect(r.sections.map((s) => [s.km, s.prevKm])).toEqual([
      [5, null],
      [100, 5],
    ]);
    expect(r.total).toBe(2);
  });

  it('Entfernungsbereiche: bis 10 km je 1 km, darüber je 5 km', () => {
    expect(distanceBucket(0.3)).toBe(0);
    expect(distanceBucket(9.9)).toBe(9);
    expect(distanceBucket(10)).toBe(10);
    expect(distanceBucket(14.9)).toBe(10);
    expect(distanceBucket(15)).toBe(11);
  });
});

describe('Raster (Schnittstelle)', () => {
  it('zeigt alle im Radius, erweitert mit Abschnitten und lässt sich abschalten', async () => {
    const C = AREA(0);
    const viewer = await member({ pos: C });
    const near = [];
    for (let i = 0; i < 3; i++) near.push(await member({ pos: destination(C, i * 100, 1 + i) }));
    const far = [];
    for (let i = 0; i < 2; i++) far.push(await member({ pos: destination(C, 200 + i * 40, 60) }));
    const outside = await member({ pos: destination(C, 10, 130) });

    const { first, tiles } = await allPages(viewer.c, { filters: {}, grid: { radiusKm: 5, expand: true }, seed: 'seed-1' });
    const ids = tiles.map((x: { id: string }) => x.id);
    for (const m of near) expect(ids).toContain(m.id);
    for (const m of far) expect(ids).toContain(m.id);
    expect(ids).not.toContain(outside.id);
    // Abschnitt 0: der Radius; danach genau ein Abschnitt (Stufen 10, 25, 50 ohne neue Profile)
    expect(first.sections.map((s: { km: number; prevKm: number | null }) => [s.km, s.prevKm])).toEqual([
      [5, null],
      [100, 5],
    ]);
    const secOf = (id: string) => tiles.find((x: { id: string }) => x.id === id).section;
    for (const m of near) expect(secOf(m.id)).toBe(0);
    for (const m of far) expect(secOf(m.id)).toBe(1);
    // Einstellung aus: nur der Radius, kein Trenner
    const off = await allPages(viewer.c, { filters: {}, grid: { radiusKm: 5, expand: false }, seed: 'seed-1' });
    expect(off.first.sections).toHaveLength(1);
    expect(off.tiles.map((x: { id: string }) => x.id).sort()).toEqual(near.map((m) => m.id).sort());
    // eingestellter Radius ab 150 km: keine Erweiterung, aber alles im Radius
    const wide = await allPages(viewer.c, { filters: {}, grid: { radiusKm: 150, expand: true }, seed: 'seed-1' });
    expect(wide.tiles.map((x: { id: string }) => x.id)).toContain(outside.id);
    expect(wide.first.sections).toHaveLength(1);
    expect(wide.first.capKm).toBe(150);
  });

  it('stabile Seiten mit Seed: nichts doppelt, nichts übersprungen; neuer Seed mischt neu', async () => {
    const C = AREA(1);
    const viewer = await member({ pos: C });
    const ids: string[] = [];
    for (let i = 0; i < 35; i++) ids.push((await member({ pos: destination(C, (i * 37) % 360, 0.5 + (i % 3) * 0.2) })).id);
    // alle gleich aktiv, gleicher Entfernungsbereich → nur der Seed entscheidet
    await q(`UPDATE accounts SET last_active_at = now() - interval '2 hours' WHERE id = ANY($1)`, [ids]);
    const body = { filters: {}, grid: { radiusKm: 5, expand: false }, seed: 'sitzung-a' };
    const a = await allPages(viewer.c, body);
    expect(a.first.tiles.length).toBe(30);
    expect(a.first.hasMore).toBe(true);
    const seen = a.tiles.map((x: { id: string }) => x.id);
    expect(new Set(seen).size).toBe(seen.length);
    expect([...seen].sort()).toEqual([...ids].sort());
    const again = await allPages(viewer.c, body);
    expect(again.tiles.map((x: { id: string }) => x.id)).toEqual(seen);
    const other = await allPages(viewer.c, { ...body, seed: 'sitzung-b' });
    expect(other.tiles.map((x: { id: string }) => x.id)).not.toEqual(seen);
    expect([...other.tiles.map((x: { id: string }) => x.id)].sort()).toEqual([...ids].sort());
  });

  it('online zuerst, 14–30 Tage inaktiv ans Ende, ab 30 Tagen nicht im Raster (Profil bleibt erreichbar)', async () => {
    const C = AREA(2);
    const viewer = await member({ pos: C });
    const online = await member({ pos: destination(C, 0, 3) });
    const week = await member({ pos: destination(C, 90, 0.4) });
    const stale = await member({ pos: destination(C, 180, 0.3) });
    const gone = await member({ pos: destination(C, 270, 0.3) });
    await q(`UPDATE accounts SET last_active_at = now() WHERE id = $1`, [online.id]);
    await q(`UPDATE accounts SET last_active_at = now() - interval '3 days' WHERE id = $1`, [week.id]);
    await q(`UPDATE accounts SET last_active_at = now() - interval '20 days' WHERE id = $1`, [stale.id]);
    await q(`UPDATE accounts SET last_active_at = now() - interval '40 days' WHERE id = $1`, [gone.id]);
    const { tiles } = await allPages(viewer.c, { filters: {}, grid: { radiusKm: 10, expand: false }, seed: 'x' });
    const ids = tiles.map((x: { id: string }) => x.id);
    expect(ids).toEqual([online.id, week.id, stale.id]);
    expect((await viewer.c.get(`/api/profiles/${gone.id}`)).status).toBe(200);
  });

  it('„Neu“-Kennzeichen und Reihe „Neu in deiner Nähe“', async () => {
    const C = AREA(3);
    const viewer = await member({ pos: C });
    const fresh = await member({ pos: destination(C, 0, 2) });
    const old = await member({ pos: destination(C, 90, 1) });
    await q(`UPDATE accounts SET created_at = now() - interval '10 days' WHERE id = ANY($1)`, [[old.id, viewer.id]]);
    const r = await viewer.c.post('/api/discovery', { filters: {}, grid: { radiusKm: 10, expand: false }, seed: 'n' });
    expect(r.body.newNearby.map((x: { id: string }) => x.id)).toEqual([fresh.id]);
    const tiles = r.body.tiles as { id: string; isNew: boolean; km: number }[];
    expect(tiles.find((x) => x.id === fresh.id)!.isNew).toBe(true);
    expect(tiles.find((x) => x.id === old.id)!.isNew).toBe(false);
    // jede Kachel trägt die gerundete Entfernung
    for (const x of tiles) expect(Number.isInteger(x.km)).toBe(true);
  });

  it('Filter: Gewicht, Körpertyp, Kinks, Position (Issue #20)', async () => {
    const C = AREA(4);
    const viewer = await member({ pos: C });
    const a = await member({ pos: destination(C, 0, 1) });
    const b = await member({ pos: destination(C, 180, 1) });
    expect((await a.c.patch('/api/profile', { weightKg: 70, bodyTypes: ['otter', 'jock'], kinks: ['leder'], position: 'vers' })).status).toBe(200);
    expect((await b.c.patch('/api/profile', { weightKg: 95, bodyTypes: ['bear'], position: 'top' })).status).toBe(200);
    const ids = async (filters: Record<string, unknown>) =>
      (await allPages(viewer.c, { filters, grid: { radiusKm: 5, expand: false }, seed: 'f' })).tiles.map((x: { id: string }) => x.id).sort();
    expect(await ids({ weight: { min: 60, max: 80 } })).toEqual([a.id]);
    expect(await ids({ bodyTypes: ['bear', 'otter'] })).toEqual([a.id, b.id].sort());
    expect(await ids({ kinks: ['leder'] })).toEqual([a.id]);
    expect(await ids({ positions: ['top'] })).toEqual([b.id]);
    expect(await ids({ weight: { min: 60, max: 100 }, positions: ['vers'], bodyTypes: ['jock'] })).toEqual([a.id]);
  });

  it('Namenssuche: Teilwort, nur im Umkreis, nur wer auffindbar ist, nicht Blockierte', async () => {
    const C = AREA(5);
    const viewer = await member({ pos: C });
    const hit = await member({ name: 'Zyprian', pos: destination(C, 0, 40) });
    const hidden = await member({ name: 'Zyprianus', pos: destination(C, 0, 5) });
    const farAway = await member({ name: 'Zyprianer', pos: destination(C, 0, 250) });
    const blocked = await member({ name: 'Zypri', pos: destination(C, 90, 3) });
    await hidden.c.patch('/api/profile', { settings: { nameSearchable: false } });
    await blocked.c.post('/api/blocks', { targetId: viewer.id });
    const r = await viewer.c.post('/api/search', { q: 'ypri', filters: {} });
    expect(r.status).toBe(200);
    const ids = r.body.results.map((x: { id: string }) => x.id);
    expect(ids).toContain(hit.id);
    expect(ids).not.toContain(hidden.id);
    expect(ids).not.toContain(farAway.id);
    expect(ids).not.toContain(blocked.id);
    expect((await viewer.c.post('/api/search', { q: 'z', filters: {} })).status).toBe(400);
  });
});
