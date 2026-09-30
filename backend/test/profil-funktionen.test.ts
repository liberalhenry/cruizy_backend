/** Vollständigkeit (#29), Profilbesucher (#27), Test-Erinnerung (#25). */
import { describe, expect, it } from 'vitest';
import { setParam } from '../src/config/params.js';
import { one, q } from '../src/db/pool.js';
import { destination } from '../src/lib/geo.js';
import { sendHealthReminders } from '../src/modules/health.js';
import { completeness } from '../src/services/completeness.js';
import { sentPushes } from '../src/services/push.js';
import { member } from './helpers.js';

const C = { lat: 52.52, lng: 13.405 };

const base = {
  approvedPhotos: 0,
  photoMode: 'initial' as const,
  bio: '',
  age: null,
  heightCm: null,
  weightKg: null,
  bodyTypes: [],
  faceChecked: false,
  traits: [],
  intentionSet: false,
};

describe('Vollständigkeit (#29)', () => {
  it('Punkte nach Konfiguration, Tipps nach Gewicht, sensible Angaben zählen nie', () => {
    expect(completeness(base).pct).toBe(0);
    const full = completeness({
      ...base,
      approvedPhotos: 3,
      photoMode: 'photo',
      bio: 'x'.repeat(60),
      age: 30,
      heightCm: 180,
      weightKg: 75,
      bodyTypes: ['otter'],
      faceChecked: true,
      traits: [1, 2, 3],
      intentionSet: true,
    });
    expect(full.pct).toBe(100);
    expect(full.tips).toEqual([]);
    const half = completeness({ ...base, approvedPhotos: 1, photoMode: 'photo', age: 30, heightCm: 180 });
    expect(half.pct).toBe(28); // Profilbild 20 + Hälfte der Basis (7,5), gerundet
    expect(half.tips.map((x) => x.key)).toEqual(['foto_echt', 'bio', 'drei_fotos']);
    expect(half.tips[2].count).toBe(2);
  });

  it('verteilt die Punkte fehlender Merkmale proportional um', () => {
    const r = completeness({ ...base, approvedPhotos: 1, photoMode: 'photo' }, { absicht: false, foto_echt: false });
    // Profilbild: 20 von 70 → 28,6 %
    expect(r.pct).toBe(29);
    expect(r.tips.every((x) => x.key !== 'absicht' && x.key !== 'foto_echt')).toBe(true);
  });

  it('nur im eigenen Profil — nie über die Schnittstelle für andere', async () => {
    const a = await member({ pos: C });
    const b = await member({ pos: C });
    await a.c.patch('/api/profile', { kinks: ['leder'], position: 'top' });
    const me = await a.c.get('/api/profile/me');
    expect(me.body.profile.completeness.pct).toBeGreaterThanOrEqual(0);
    const other = await b.c.get(`/api/profiles/${a.id}`);
    expect(JSON.stringify(other.body)).not.toMatch(/completeness|pct/);
    // Kinks und Position ändern die Vollständigkeit nicht
    const before = me.body.profile.completeness.pct;
    await a.c.patch('/api/profile', { kinks: [], position: null });
    expect((await a.c.get('/api/profile/me')).body.profile.completeness.pct).toBe(before);
  });
});

describe('Profilbesucher (#27)', () => {
  it('nur Profilöffnungen zählen, einmal je Tag; Blockierte und Gesperrte tauchen nicht auf', async () => {
    const t = await member({ pos: C });
    const v1 = await member({ pos: destination(C, 0, 1) });
    const v2 = await member({ pos: destination(C, 90, 1) });
    const v3 = await member({ pos: destination(C, 180, 1) });
    await v1.c.get(`/api/profiles/${t.id}`);
    await v1.c.get(`/api/profiles/${t.id}`);
    await v2.c.get(`/api/profiles/${t.id}`);
    await v3.c.get(`/api/profiles/${t.id}`);
    // Raster zählt nicht
    await v1.c.post('/api/discovery', { filters: {} });
    expect((await one(`SELECT count(*)::int AS n FROM profile_visits WHERE target_id = $1`, [t.id]))!.n).toBe(3);
    await t.c.post('/api/blocks', { targetId: v2.id });
    await q(`UPDATE accounts SET moderation_state = 'suspended' WHERE id = $1`, [v3.id]);
    const free = await t.c.get('/api/visitors');
    expect(free.body.premium).toBe(false);
    expect(free.body.count).toBe(1);
    // kostenlos: keine Identitäten über die Schnittstelle
    const json = JSON.stringify(free.body);
    expect(json).not.toContain(v1.id);
    expect(json).not.toMatch(/"name"|"id"/);
    expect((await t.c.post('/api/premium/test')).status).toBe(200);
    const paid = await t.c.get('/api/visitors');
    expect(paid.body.premium).toBe(true);
    expect(paid.body.visitors.map((x: { id: string }) => x.id)).toEqual([v1.id]);
    expect(paid.body.visitors[0].when).toBe('heute');
  });

  it('unsichtbar stöbern speichert keine Besuche und endet mit dem Abo', async () => {
    const t = await member({ pos: C });
    const v = await member({ pos: C });
    expect((await v.c.put('/api/visitors/invisible', { on: true })).status).toBe(403);
    await v.c.post('/api/premium/test');
    expect((await v.c.put('/api/visitors/invisible', { on: true })).status).toBe(200);
    await v.c.get(`/api/profiles/${t.id}`);
    expect(await one(`SELECT 1 FROM profile_visits WHERE visitor_id = $1`, [v.id])).toBeNull();
    await v.c.del('/api/premium/test');
    const pr = await one(`SELECT invisible_browsing FROM profiles WHERE account_id = $1`, [v.id]);
    expect(pr!.invisible_browsing).toBe(false);
    await v.c.get(`/api/profiles/${t.id}`);
    expect(await one(`SELECT 1 FROM profile_visits WHERE visitor_id = $1`, [v.id])).not.toBeNull();
  });

  it('nach 30 Tagen gelöscht', async () => {
    const t = await member({ pos: C });
    const v = await member({ pos: C });
    await v.c.get(`/api/profiles/${t.id}`);
    await q(`UPDATE profile_visits SET visited_at = now() - interval '31 days' WHERE target_id = $1`, [t.id]);
    const { JOBS } = await import('../src/jobs/index.js');
    await JOBS.find((j) => j.name === 'housekeeping')!.run();
    expect(await one(`SELECT 1 FROM profile_visits WHERE target_id = $1`, [t.id])).toBeNull();
  });
});

describe('Test-Erinnerung (#25)', () => {
  it('nur mit Einwilligung; Intervall, „In einer Woche“, Zurücksetzen; Push verrät nichts', async () => {
    const m = await member({ pos: C });
    await q(`UPDATE profiles SET quiet_from = 0, quiet_to = 0 WHERE account_id = $1`, [m.id]);
    expect((await m.c.put('/api/health/reminder', { intervalMonths: 3 })).status).toBe(400);
    const on = await m.c.put('/api/health/reminder', { intervalMonths: 3, consent: true });
    expect(on.status).toBe(200);
    const next = new Date(on.body.nextAt);
    expect(next.getTime() - Date.now()).toBeGreaterThan(85 * 86400_000);
    await q(`UPDATE health_reminders SET next_at = now() - interval '1 minute' WHERE account_id = $1`, [m.id]);
    await m.c.post('/api/push/subscribe', { endpoint: `https://push.example.invalid/${m.id}`, keys: { p256dh: 'x', auth: 'y' } }).catch(() => null);
    await q(`INSERT INTO push_subscriptions (account_id, endpoint, p256dh, auth) VALUES ($1, $2, 'x', 'y') ON CONFLICT DO NOTHING`, [m.id, `https://push.example.invalid/h/${m.id}`]);
    await sendHealthReminders();
    const push = [...sentPushes].reverse().find((x) => x.accountId === m.id);
    expect(push!.payload.title).toBe('Du hast eine Erinnerung.');
    const notice = await one(`SELECT title, body, ref FROM notices WHERE account_id = $1 AND kind = 'test_erinnerung'`, [m.id]);
    expect(notice!.title).toBe('Zeit für deinen Check!');
    expect(notice!.ref).toContain('aidshilfe');
    // nicht doppelt
    await sendHealthReminders();
    expect((await one(`SELECT count(*)::int AS n FROM notices WHERE account_id = $1 AND kind = 'test_erinnerung'`, [m.id]))!.n).toBe(1);
    const snooze = await m.c.post('/api/health/reminder/snooze');
    expect(Math.round((new Date(snooze.body.nextAt).getTime() - Date.now()) / 86400_000)).toBe(7);
    const done = await m.c.post('/api/health/reminder/done');
    expect(new Date(done.body.nextAt).getTime() - Date.now()).toBeGreaterThan(85 * 86400_000);
    // nichts im Profil, für niemanden
    const other = await member({ pos: C });
    expect(JSON.stringify((await other.c.get(`/api/profiles/${m.id}`)).body)).not.toMatch(/erinnerung|health|interval|next_at/i);
    // Ausschalten löscht alles
    await m.c.del('/api/health/reminder');
    expect(await one(`SELECT 1 FROM health_reminders WHERE account_id = $1`, [m.id])).toBeNull();
    expect(await one(`SELECT 1 FROM notices WHERE account_id = $1 AND kind = 'test_erinnerung'`, [m.id])).toBeNull();
  });

  it('Gesundheitsfelder sind aus: weder Oberfläche noch Schnittstelle', async () => {
    const m = await member();
    expect((await m.c.get('/api/health/profile')).status).toBe(404);
    expect((await m.c.put('/api/health/profile', { consent: true, prep: 'ja', lastTest: '2026-09' })).status).toBe(404);
    const cfg = await m.c.get('/api/config');
    expect(cfg.body.params.healthFields).toBe(false);
    setParam('P-GESUNDHEITSFELDER', true);
    expect((await m.c.put('/api/health/profile', { consent: true, prep: 'ja', lastTest: '2026-09' })).status).toBe(200);
    setParam('P-GESUNDHEITSFELDER', false);
  });
});
