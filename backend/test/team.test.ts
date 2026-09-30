/** Teamverwaltung (Issue #8): nur Owner, alles protokolliert, immer ein Owner übrig. */
import * as OTPAuth from 'otpauth';
import { describe, expect, it } from 'vitest';
import { one, q } from '../src/db/pool.js';
import { resetRateLimits } from '../src/lib/rate.js';
import { Client, staff, testApp } from './helpers.js';

async function loginAs(login: string, password: string, secret: string) {
  const c = new Client(await testApp());
  resetRateLimits();
  const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(secret), digits: 6, period: 30 }).generate();
  const r = await c.post('/mod-api/login', { login, password, totp });
  return { c, status: r.status };
}

const uniq = () => `neu-${Math.random().toString(36).slice(2, 8)}`;

describe('Teamverwaltung (Issue #8)', () => {
  it('nur Owner (Gründer) dürfen das Team verwalten', async () => {
    const mod = await staff('MOD', false);
    const betrieb = await staff('BETRIEB', false);
    expect((await mod.c.get('/mod-api/team')).status).toBe(403);
    expect((await betrieb.c.get('/mod-api/team')).status).toBe(403);
    expect((await betrieb.c.post('/mod-api/team', { name: 'X Y', login: uniq(), role: 'MOD', reason: 'Verstärkung' })).status).toBe(403);
    const owner = await staff('MOD', true);
    const list = await owner.c.get('/mod-api/team');
    expect(list.status).toBe(200);
    expect(list.body.items.some((x: any) => x.id === owner.id)).toBe(true);
  });

  it('anlegen: Einmalpasswort und zweiter Faktor funktionieren, alles steht im Protokoll', async () => {
    const owner = await staff('BETRIEB', true);
    const login = uniq();
    const r = await owner.c.post('/mod-api/team', { name: 'Neue Person', login, role: 'MOD', reason: 'Verstärkung für die Meldungen' });
    expect(r.status).toBe(200);
    expect(r.body.password).toBeTruthy();
    expect(r.body.totp.uri).toMatch(/^otpauth:\/\/totp\//);
    expect(r.body.totp.qr).toMatch(/^data:image\/png;base64,/);
    const log = await one(`SELECT action, reason FROM access_log WHERE staff_id = $1 AND case_ref = $2`, [owner.id, `team:${login}`]);
    expect(log!.action).toBe('team_angelegt');
    // Passwort taucht nirgends im Protokoll auf
    expect(log!.reason).not.toContain(r.body.password);
    const n = await loginAs(login, r.body.password, r.body.totp.secret);
    expect(n.status).toBe(200);
    // doppelte Kennung
    const dup = await owner.c.post('/mod-api/team', { name: 'Noch wer', login, role: 'MOD', reason: 'Verstärkung' });
    expect(dup.status).toBe(409);
    // ohne Begründung nichts
    expect((await owner.c.post('/mod-api/team', { name: 'Ohne Grund', login: uniq(), role: 'MOD', reason: '' })).status).toBe(400);
  });

  it('Rolle ändern, sperren, neues Passwort, neuer zweiter Faktor', async () => {
    const owner = await staff('BETRIEB', true);
    const login = uniq();
    const created = await owner.c.post('/mod-api/team', { name: 'Person B', login, role: 'MOD', reason: 'Verstärkung' });
    const id = created.body.id;
    const p = await owner.c.patch(`/mod-api/team/${id}`, { role: 'BETRIEB', founder: true, reason: 'übernimmt den Betrieb' });
    expect(p.status).toBe(200);
    const row = await one(`SELECT role, founder FROM staff WHERE id = $1`, [id]);
    expect(row).toMatchObject({ role: 'BETRIEB', founder: true });

    const pw = await owner.c.post(`/mod-api/team/${id}/password`, { reason: 'Passwort vergessen' });
    expect((await loginAs(login, created.body.password, created.body.totp.secret)).status).toBe(400);
    expect((await loginAs(login, pw.body.password, created.body.totp.secret)).status).toBe(200);

    const tf = await owner.c.post(`/mod-api/team/${id}/totp`, { reason: 'Telefon verloren' });
    expect((await loginAs(login, pw.body.password, created.body.totp.secret)).status).toBe(400);
    const ok = await loginAs(login, pw.body.password, tf.body.totp.secret);
    expect(ok.status).toBe(200);

    expect((await owner.c.post(`/mod-api/team/${id}/disable`, { reason: 'verlässt das Team' })).status).toBe(200);
    // die laufende Sitzung endet sofort
    expect((await ok.c.get('/mod-api/me')).status).toBe(401);
    expect((await loginAs(login, pw.body.password, tf.body.totp.secret)).status).toBe(400);
    expect((await owner.c.post(`/mod-api/team/${id}/enable`, { reason: 'kommt zurück' })).status).toBe(200);
    expect((await loginAs(login, pw.body.password, tf.body.totp.secret)).status).toBe(200);
  });

  it('immer mindestens ein aktiver Owner; niemand sperrt oder löscht sich selbst', async () => {
    const owner = await staff('BETRIEB', true);
    // alle anderen Owner vorübergehend ausblenden, damit dieser der letzte ist
    const others = await q(`UPDATE staff SET founder = false WHERE founder AND id <> $1 AND disabled_at IS NULL RETURNING id`, [owner.id]);
    try {
      const self = await owner.c.patch(`/mod-api/team/${owner.id}`, { founder: false, reason: 'gebe ab' });
      expect(self.status).toBe(409);
      expect(self.body.code).toBe('letzter_owner');
      expect((await owner.c.post(`/mod-api/team/${owner.id}/disable`, { reason: 'mich selbst sperren' })).status).toBe(400);
      expect((await owner.c.post(`/mod-api/team/${owner.id}/delete`, { reason: 'mich selbst löschen' })).status).toBe(400);
    } finally {
      if (others.length) await q(`UPDATE staff SET founder = true WHERE id = ANY($1)`, [others.map((o) => o.id)]);
    }
  });

  it('löschen: ohne Protokollspuren ganz, sonst gesperrt und ohne Anmeldedaten', async () => {
    const owner = await staff('BETRIEB', true);
    const fresh = await owner.c.post('/mod-api/team', { name: 'Nie aktiv', login: uniq(), role: 'MOD', reason: 'Probe' });
    const d1 = await owner.c.post(`/mod-api/team/${fresh.body.id}/delete`, { reason: 'versehentlich angelegt' });
    expect(d1.body.mode).toBe('entfernt');
    expect(await one(`SELECT 1 FROM staff WHERE id = $1`, [fresh.body.id])).toBeNull();

    const login = uniq();
    const active = await owner.c.post('/mod-api/team', { name: 'War aktiv', login, role: 'MOD', reason: 'Probe' });
    const s = await loginAs(login, active.body.password, active.body.totp.secret);
    await s.c.post('/mod-api/me/password', { current: active.body.password, next: 'ein-neues-langes-passwort' });
    const d2 = await owner.c.post(`/mod-api/team/${active.body.id}/delete`, { reason: 'hat das Team verlassen' });
    expect(d2.body.mode).toBe('aufbewahrt');
    const row = await one(`SELECT login, disabled_at, deleted_at FROM staff WHERE id = $1`, [active.body.id]);
    expect(row!.login).not.toBe(login);
    expect(row!.disabled_at).not.toBeNull();
    expect(row!.deleted_at).not.toBeNull();
    expect((await loginAs(login, 'ein-neues-langes-passwort', active.body.totp.secret)).status).toBe(400);
    // Protokolleinträge der Person bleiben erhalten
    expect(await one(`SELECT 1 FROM access_log WHERE staff_id = $1`, [active.body.id])).toBeTruthy();
    // die Kennung ist wieder frei
    expect((await owner.c.post('/mod-api/team', { name: 'Nachfolge', login, role: 'MOD', reason: 'Nachfolge' })).status).toBe(200);
    // gelöschte Zugänge erscheinen nicht mehr in der Liste
    const list = await owner.c.get('/mod-api/team');
    expect(list.body.items.some((x: any) => x.id === active.body.id)).toBe(false);
  });

  it('eigenes Passwort ändern verlangt das bisherige', async () => {
    const s = await staff('MOD', false);
    expect((await s.c.post('/mod-api/me/password', { current: 'falsch', next: 'ein-neues-langes-passwort' })).status).toBe(400);
    expect((await s.c.post('/mod-api/me/password', { current: 'mod-passwort-lang', next: 'kurz' })).status).toBe(400);
    expect((await s.c.post('/mod-api/me/password', { current: 'mod-passwort-lang', next: 'ein-neues-langes-passwort' })).status).toBe(200);
  });
});
