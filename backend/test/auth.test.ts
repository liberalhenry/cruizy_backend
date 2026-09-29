import { describe, expect, it } from 'vitest';
import { one } from '../src/db/pool.js';
import { CONSENT_VERSION } from '../src/modules/auth.js';
import { sentMails } from '../src/providers/mail.js';
import { resetRateLimits } from '../src/lib/rate.js';
import { Client, lastCode, member, testApp } from './helpers.js';

describe('Registrierung und Anmeldung', () => {
  it('verlangt im Testbetrieb den Einladungscode (AK-M02-11)', async () => {
    const c = new Client(await testApp());
    const r = await c.post('/api/auth/register', { method: 'email', email: 'x-ohne@example.invalid', password: 'ein-langes-testpasswort' });
    expect(r.status).toBe(403);
    expect(r.body.fehler).toBe('UI-TESTBETRIEB-EINLADUNG');
  });

  it('antwortet bei vorhandener Adresse gleich und schickt keine Mail (AK-F02-02)', async () => {
    const m = await member();
    resetRateLimits();
    const c = new Client(await testApp());
    const before = sentMails.length;
    const r = await c.post('/api/auth/register', { method: 'email', email: m.email, password: 'ein-anderes-passwort', invite: 'einladung' });
    expect(r.status).toBe(200);
    expect(r.body.next).toBe('code');
    expect(typeof r.body.token).toBe('string');
    expect(sentMails.length).toBe(before);
  });

  it('schreibende Aufrufe ohne eigenen Kopf werden abgewiesen', async () => {
    const app = await testApp();
    const r = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { identifier: 'a@b.de', password: 'x' } });
    expect(r.statusCode).toBe(403);
  });

  it('zeigt den Wiederherstellungscode genau einmal und speichert nur den Prüfwert (AK-Z09-01)', async () => {
    resetRateLimits();
    const c = new Client(await testApp());
    const email = `wh-${Date.now()}@example.invalid`;
    const r = await c.post('/api/auth/register', { method: 'email', email, password: 'ein-langes-testpasswort', invite: 'einladung' });
    await c.post('/api/auth/verify', { token: r.body.token, code: lastCode(email) });
    const first = await c.post('/api/auth/consent', { accept: true, version: CONSENT_VERSION });
    expect(first.body.recoveryCode).toMatch(/^[A-Z0-9]{5}(-[A-Z0-9]{5}){3}$/);
    const again = await c.post('/api/auth/consent', { accept: true, version: CONSENT_VERSION });
    expect(again.body.recoveryCode).toBeNull();
    const row = await one(`SELECT recovery_code_hash FROM accounts a JOIN consents c ON c.account_id = a.id ORDER BY c.granted_at DESC LIMIT 1`);
    expect(row!.recovery_code_hash).not.toContain(first.body.recoveryCode);
  });

  it('meldet an und ab', async () => {
    const m = await member();
    await m.c.post('/api/auth/logout');
    expect((await m.c.get('/api/profile/me')).status).toBe(401);
    resetRateLimits();
    const r = await m.c.post('/api/auth/login', { identifier: m.email, password: m.password });
    expect(r.status).toBe(200);
    expect(r.body.next).toBe('app');
    expect((await m.c.get('/api/profile/me')).status).toBe(200);
  });

  it('falsches Passwort und unbekannte Adresse sehen gleich aus', async () => {
    const m = await member();
    resetRateLimits();
    const c = new Client(await testApp());
    const a = await c.post('/api/auth/login', { identifier: m.email, password: 'falsch-falsch-falsch' });
    const b = await c.post('/api/auth/login', { identifier: 'gibt-es-nicht@example.invalid', password: 'falsch-falsch-falsch' });
    expect(a.status).toBe(b.status);
    expect(a.body).toEqual(b.body);
  });

  it('jede Antwort trägt die Betriebskennzeichnung', async () => {
    const c = new Client(await testApp());
    const r = await c.get('/api/config');
    expect(r.headers['x-betrieb']).toBe('test');
    expect(r.body.inviteRequired).toBe(true);
  });
});
