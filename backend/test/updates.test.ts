/** Aktualisierung per Knopf (Issue #5): nur Owner, nur echte Releases, ein Auftrag zur Zeit. */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { one, q } from '../src/db/pool.js';
import { appVersion, compareVersions } from '../src/lib/version.js';
import { setReleaseFetcher } from '../src/modules/mod/updates.js';
import { staff } from './helpers.js';

function bump(v: string, part: 0 | 1 | 2) {
  const x = v.split('-')[0].split('.').map(Number);
  x[part]++;
  for (let i = part + 1; i < 3; i++) x[i] = 0;
  return x.join('.');
}

const current = appVersion();
const newer = bump(current, 1);
const release = (v: string, extra: Record<string, unknown> = {}) => ({
  tag_name: `v${v}`,
  name: `v${v}`,
  body: `## ${v}\n- Neu`,
  published_at: new Date().toISOString(),
  draft: false,
  prerelease: false,
  html_url: `https://github.com/x/y/releases/tag/v${v}`,
  ...extra,
});

let calls = 0;
beforeAll(() => {
  setReleaseFetcher(async (url) => {
    calls++;
    expect(url).toMatch(/^https:\/\/api\.github\.com\/repos\/[\w.-]+\/[\w.-]+\/releases/);
    const list = [release(current), release(newer), release(bump(current, 2), { draft: true }), release(`${bump(newer, 0)}-rc.1`, { prerelease: true }), { ...release('x'), tag_name: 'kaputt' }];
    return new Response(JSON.stringify(list), { status: 200, headers: { 'content-type': 'application/json' } });
  });
});
afterAll(() => setReleaseFetcher(null));

async function agentOnline(online = true) {
  await q(
    `INSERT INTO update_agent (id, last_seen_at, version) VALUES (true, now() - make_interval(secs => $1), $2)
     ON CONFLICT (id) DO UPDATE SET last_seen_at = EXCLUDED.last_seen_at`,
    [online ? 0 : 3600, current],
  );
}

describe('SemVer', () => {
  it('vergleicht nach SemVer 2.0.0', () => {
    expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
    expect(compareVersions('1.10.0', '1.9.9')).toBe(1);
    expect(compareVersions('2.0.0', '10.0.0')).toBe(-1);
    expect(compareVersions('1.0.0-rc.1', '1.0.0')).toBe(-1);
    expect(compareVersions('1.0.0-alpha', '1.0.0-alpha.1')).toBe(-1);
    expect(compareVersions('1.0.0-alpha.beta', '1.0.0-beta')).toBe(-1);
    expect(compareVersions('1.0.0-beta.2', '1.0.0-beta.11')).toBe(-1);
    expect(compareVersions('v1.0.0', '1.0.0+build.5')).toBe(0);
    expect(() => compareVersions('1.0', '1.0.0')).toThrow();
  });
});

describe('Aktualisierung (Issue #5)', () => {
  it('nur Owner sehen und fordern an', async () => {
    const mod = await staff('BETRIEB', false);
    expect((await mod.c.get('/mod-api/updates')).status).toBe(403);
    expect((await mod.c.post('/mod-api/updates', { version: newer, reason: 'neue Version' })).status).toBe(403);
  });

  it('zeigt den Stand und die Releases; Entwürfe und fremde Tags fallen weg', async () => {
    const s = await staff('BETRIEB', true);
    const r = await s.c.get('/mod-api/updates?neu=1');
    expect(r.status).toBe(200);
    expect(r.body.current).toBe(current);
    expect(r.body.latest.version).toBe(newer);
    expect(r.body.updateAvailable).toBe(true);
    const versions = r.body.releases.map((x: any) => x.version);
    expect(versions[0]).toMatch(/-rc\.1$/);
    expect(versions).toContain(current);
    expect(versions).not.toContain(bump(current, 2));
    expect(versions).not.toContain('kaputt');
  });

  it('Auftrag nur für ein vorhandenes Release, nur mit laufendem Updater, höchstens einer zur Zeit', async () => {
    const s = await staff('BETRIEB', true);
    await q(`DELETE FROM update_runs`);
    await agentOnline(false);
    expect((await s.c.post('/mod-api/updates', { version: newer, reason: 'neue Version einspielen' })).status).toBe(503);
    await agentOnline(true);
    expect((await s.c.post('/mod-api/updates', { version: '99.0.0', reason: 'gibt es nicht' })).body.code).toBe('version_unbekannt');
    expect((await s.c.post('/mod-api/updates', { version: current, reason: 'schon drauf' })).body.code).toBe('schon_installiert');
    expect((await s.c.post('/mod-api/updates', { version: 'v1; rm -rf /', reason: 'Einschleusen' })).status).toBe(400);

    const ok = await s.c.post('/mod-api/updates', { version: newer, reason: 'neue Version einspielen' });
    expect(ok.status).toBe(200);
    const run = await one(`SELECT status, target_version, from_version FROM update_runs WHERE id = $1`, [ok.body.id]);
    expect(run).toMatchObject({ status: 'angefordert', target_version: newer, from_version: current });
    expect(await one(`SELECT 1 FROM access_log WHERE staff_id = $1 AND case_ref = $2`, [s.id, `update:${newer}`])).toBeTruthy();

    expect((await s.c.post('/mod-api/updates', { version: newer, reason: 'noch einmal' })).status).toBe(409);

    // vor dem Start zurücknehmen
    expect((await s.c.post(`/mod-api/updates/${ok.body.id}/cancel`, {})).status).toBe(200);
    expect((await one(`SELECT status FROM update_runs WHERE id = $1`, [ok.body.id]))!.status).toBe('abgebrochen');
    const list = await s.c.get('/mod-api/updates');
    expect(list.body.runs[0]).toMatchObject({ id: ok.body.id, status: 'abgebrochen' });
  });

  it('die Datenbank nimmt keine ungültige Versionsnummer an', async () => {
    const s = await staff('BETRIEB', true);
    await expect(q(`INSERT INTO update_runs (target_version, from_version, requested_by) VALUES ('1.0.0; x', '0.1.0', $1)`, [s.id])).rejects.toThrow();
  });

  it('Releases werden zwischengespeichert', async () => {
    const s = await staff('BETRIEB', true);
    await s.c.get('/mod-api/updates?neu=1');
    const before = calls;
    await s.c.get('/mod-api/updates');
    expect(calls).toBe(before);
  });
});
