/**
 * Ohne Testbetrieb: Fehlt ein Prüf- oder Versandweg in der .env, bestätigt das Team im Werkzeug.
 * (Die Tests laufen ohne SMTP und ohne Telegram-Bot — also genau in diesem Fall.)
 */
import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { env, resetEnvCache } from '../src/config/env.js';
import { setParam } from '../src/config/params.js';
import { one, q } from '../src/db/pool.js';
import { resetRateLimits } from '../src/lib/rate.js';
import { Client, jpeg, lastCode, member, staff, testApp, upload } from './helpers.js';

function files(parts: Record<string, Buffer>) {
  const boundary = `----t${randomUUID()}`;
  const chunks: Buffer[] = [];
  for (const [name, buf] of Object.entries(parts)) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"; filename="${name}.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`), buf, Buffer.from('\r\n'));
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return { payload: Buffer.concat(chunks), headers: { 'content-type': `multipart/form-data; boundary=${boundary}` } };
}

describe('Adressen ohne Versand: das Team bestätigt', () => {
  it('Registrierung wartet auf das Team; nach der Bestätigung geht es ohne Code weiter', async () => {
    resetRateLimits();
    const c = new Client(await testApp());
    const email = `team-${Date.now()}@example.invalid`;
    const r = await c.post('/api/auth/register', { method: 'email', email, password: 'ein-langes-testpasswort' });
    expect(r.body.ohneVersand).toBe(true);
    // solange niemand bestätigt hat: „wartet“, kein Fehlversuch
    const wait = await c.post('/api/auth/verify', { token: r.body.token, code: '' });
    expect(wait.status).toBe(409);
    expect(wait.body.code).toBe('wartet');

    const s = await staff('MOD', false);
    expect((await s.c.get('/mod-api/nav')).body.kontakte).toBeGreaterThanOrEqual(1);
    const list = await s.c.get('/mod-api/contacts');
    const item = list.body.items.find((x: { target: string }) => x.target === `${email.slice(0, 2)}…@example.invalid`);
    expect(item).toMatchObject({ purpose: 'verify_email' });
    // ohne Begründung nichts (kein Owner)
    expect((await s.c.post(`/mod-api/contacts/${item.id}/bestaetigen`, {})).status).toBe(400);
    expect((await s.c.post(`/mod-api/contacts/${item.id}/bestaetigen`, { reason: 'Adresse unauffällig' })).status).toBe(200);
    expect(await one(`SELECT 1 FROM access_log WHERE case_ref = $1 AND action = 'kontakt_bestaetigen_verify_email'`, [item.ref])).toBeTruthy();

    const ok = await c.post('/api/auth/verify', { token: r.body.token, code: '' });
    expect(ok.status).toBe(200);
    expect(ok.body.next).toBe('einwilligung');
    // der Code gilt nur einmal
    expect((await c.post('/api/auth/verify', { token: r.body.token, code: '' })).status).toBe(409);
  });

  it('abgelehnt bleibt es beim Warten; der zugestellte Code (Entwicklung) gilt weiter nicht doppelt', async () => {
    resetRateLimits();
    const c = new Client(await testApp());
    const email = `abgelehnt-${Date.now()}@example.invalid`;
    const r = await c.post('/api/auth/register', { method: 'email', email, password: 'ein-langes-testpasswort' });
    const s = await staff();
    const item = (await s.c.get('/mod-api/contacts')).body.items.find((x: { target: string }) => x.target.startsWith(email.slice(0, 2)) && x.target.endsWith('@example.invalid'));
    expect((await s.c.post(`/mod-api/contacts/${item.id}/ablehnen`, {})).status).toBe(200); // Owner: ohne Begründung
    expect((await c.post('/api/auth/verify', { token: r.body.token, code: '' })).status).toBe(409);
    expect((await c.post('/api/auth/verify', { token: r.body.token, code: lastCode(email) })).status).toBe(400);
  });

  it('Passwort vergessen geht ohne Versand nie über das Team', async () => {
    const m = await member();
    resetRateLimits();
    const c = new Client(await testApp());
    const r = await c.post('/api/auth/reset/request', { identifier: m.email });
    expect(r.body.ohneVersand).toBe(true);
    const done = await c.post('/api/auth/reset/complete', { identifier: m.email, code: '', password: 'ein-neues-langes-passwort' });
    expect(done.status).toBe(400);
    expect(await one(`SELECT 1 FROM verification_codes WHERE account_id = $1 AND purpose = 'reset' AND delivery = 'team'`, [m.id])).toBeNull();
  });
});

describe('Stufe 2 und Fotoprüfung ohne Prüfpartner', () => {
  it('Stufe 2: Ausweis und Selfie mit Geste → das Team entscheidet → Bilder gelöscht', async () => {
    const m = await member();
    const st = await m.c.get('/api/verify/state');
    expect(st.body.methods.age2).toEqual(['team']);
    const start = await m.c.post('/api/verify/start', { kind: 'age2', method: 'team' });
    expect(start.body.url).toBe(`/pruefung/team?s=${start.body.sessionId}`);
    const info = await m.c.get(`/api/verify/team/${start.body.sessionId}`);
    expect(info.body).toMatchObject({ kind: 'age2', state: 'pending' });
    expect(info.body.pose.label).toBeTruthy();
    // nur ein Bild reicht nicht
    const one1 = files({ selfie: await jpeg() });
    expect((await m.c.req('POST', `/api/verify/team/${start.body.sessionId}`, one1.payload, one1.headers)).status).toBe(400);
    const both = files({ ausweis: await jpeg({ color: '#ddd' }), selfie: await jpeg({ color: '#a86' }) });
    const sent = await m.c.req('POST', `/api/verify/team/${start.body.sessionId}`, both.payload, both.headers);
    expect(sent.body.state).toBe('review');
    expect(sent.body.number).toMatch(/^B-\d{4}-\d{6}$/);
    expect((await m.c.get('/api/verify/state')).body.reviewAge2).toBe(true);
    // zweiter Vorgang während der Prüfung: nein
    expect((await m.c.post('/api/verify/start', { kind: 'age2', method: 'team' })).status).toBe(409);

    const s = await staff('MOD', false);
    const list = await s.c.get('/mod-api/id-reviews?kind=age2');
    const item = list.body.items.find((x: { number: string }) => x.number === sent.body.number);
    expect(item.kind).toBe('age2');
    const open = await s.c.post(`/mod-api/id-reviews/${item.id}/open`, {});
    expect(open.body.images).toHaveLength(2);
    expect(open.body.decisions).toEqual(['volljaehrig', 'unlesbar', 'minderjaehrig']);
    expect((await s.c.post(`/mod-api/id-reviews/${item.id}/decide`, { decision: 'passt', reason: 'falsche Art' })).status).toBe(400);
    expect((await s.c.post(`/mod-api/id-reviews/${item.id}/decide`, { decision: 'volljaehrig', reason: 'volljährig, dieselbe Person' })).status).toBe(200);
    const acc = await one(`SELECT age2_at, age2_method FROM accounts WHERE id = $1`, [m.id]);
    expect(acc!.age2_at).not.toBeNull();
    expect(acc!.age2_method).toBe('team');
    expect((await one(`SELECT cardinality(files) AS n FROM id_reviews WHERE id = $1`, [item.id]))!.n).toBe(0);
    expect(await one(`SELECT 1 FROM notices WHERE account_id = $1 AND ref = $2`, [m.id, sent.body.number])).toBeTruthy();
  });

  it('Fotoprüfung: Selfie gegen die Profilfotos, „passt“ setzt das Prüfzeichen', async () => {
    const m = await member();
    expect((await upload(m.c, '/api/photos', await jpeg({ color: '#357' }))).body.status).toBe('approved');
    const start = await m.c.post('/api/verify/start', { kind: 'face', method: 'team', faceConsent: true });
    expect(start.status).toBe(200);
    const sf = files({ selfie: await jpeg({ color: '#a86' }) });
    const sent = await m.c.req('POST', `/api/verify/team/${start.body.sessionId}`, sf.payload, sf.headers);
    expect(sent.body.state).toBe('review');
    const s = await staff();
    const item = (await s.c.get('/mod-api/id-reviews?kind=face')).body.items.find((x: { number: string }) => x.number === sent.body.number);
    const open = await s.c.post(`/mod-api/id-reviews/${item.id}/open`, {});
    expect(open.body.references.length).toBeGreaterThanOrEqual(1);
    expect(open.body.decisions).toEqual(['passt', 'passt_nicht']);
    expect((await s.c.post(`/mod-api/id-reviews/${item.id}/decide`, { decision: 'passt' })).status).toBe(200);
    expect((await one(`SELECT face_check_at FROM accounts WHERE id = $1`, [m.id]))!.face_check_at).not.toBeNull();
  });
});

describe('Bilder ohne Hash-Abgleich', () => {
  it('ist der Abgleich aus, prüft ein Mensch jedes Profilbild — auch wenn der Klassifikator freigäbe', async () => {
    setParam('P-HASH-AKTIV', false);
    const m = await member();
    const up = await upload(m.c, '/api/photos', await jpeg({ color: '#246' }));
    expect(up.body.status).toBe('queued');
    const ph = await one(`SELECT status, hash_state FROM photos WHERE id = $1`, [up.body.id]);
    expect(ph).toMatchObject({ status: 'queued', hash_state: 'pending' });
  });
});

describe('Überblick im Werkzeug', () => {
  it('lädt auch für BETRIEB mit fälliger Quartalsdurchsicht (vorher Fehler in der Abfrage)', async () => {
    const s = await staff('BETRIEB', false);
    await q(`INSERT INTO access_log (staff_id, at, case_ref, action, reason) VALUES ($1, now() - interval '1 year', 'ALT', 'alt', 'alt')`, [s.id]);
    const r = await s.c.get('/mod-api/overview');
    expect(r.status).toBe(200);
    expect(r.body.quarterReview).toBeTruthy();
    const nav = await s.c.get('/mod-api/nav');
    expect(nav.status).toBe(200);
    expect(nav.body).toHaveProperty('bestaetigen');
  });
});

describe('Einrichtung', () => {
  it('nur Owner und BETRIEB; zeigt, was das Team übernimmt; löscht nur erfundene Beispieldaten', async () => {
    const mod = await staff('MOD', false);
    expect((await mod.c.get('/mod-api/einrichtung')).status).toBe(403);
    const owner = await staff();
    const r = await owner.c.get('/mod-api/einrichtung');
    expect(r.status).toBe(200);
    expect(r.body.setup.find((x: { key: string }) => x.key === 'mail').state).toBe('team');
    expect(r.body.setup.find((x: { key: string }) => x.key === 'telegram').state).toBe('team');

    const fake = await member();
    const real = await member();
    await q(`UPDATE accounts SET is_test_data = true WHERE id = $1`, [fake.id]);
    expect((await owner.c.get('/mod-api/einrichtung')).body.testdata.konten).toBeGreaterThanOrEqual(1);
    expect((await mod.c.post('/mod-api/einrichtung/testdaten-loeschen', { reason: 'aufräumen' })).status).toBe(403);
    const del = await owner.c.post('/mod-api/einrichtung/testdaten-loeschen', {});
    expect(del.status).toBe(200);
    expect(await one(`SELECT 1 FROM accounts WHERE id = $1`, [fake.id])).toBeNull();
    expect(await one(`SELECT 1 FROM accounts WHERE id = $1`, [real.id])).toBeTruthy();
    expect((await owner.c.get('/mod-api/einrichtung')).body.testdata.konten).toBe(0);
  });

  it('alte Werte aus dem Testbetrieb in der .env verhindern den Start nicht', () => {
    const keep = { ...process.env };
    Object.assign(process.env, { OPERATION_MODE: 'test', TEST_INVITE_CODE: 'x', AGE_PROVIDER: 'mock', DATE_FACE_PROVIDER: 'stub', CLASSIFIER: 'mock-allow', HASH_PROVIDER: 'mock' });
    resetEnvCache();
    try {
      const e = env();
      expect(e).toMatchObject({ AGE_PROVIDER: 'ausweis', DATE_FACE_PROVIDER: 'none', CLASSIFIER: 'queue', HASH_PROVIDER: 'none' });
      expect('OPERATION_MODE' in e).toBe(false);
    } finally {
      for (const k of ['OPERATION_MODE', 'TEST_INVITE_CODE', 'AGE_PROVIDER', 'DATE_FACE_PROVIDER', 'CLASSIFIER', 'HASH_PROVIDER']) {
        if (k in keep) process.env[k] = keep[k];
        else delete process.env[k];
      }
      resetEnvCache();
    }
  });
});
