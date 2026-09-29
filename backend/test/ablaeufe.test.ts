/** Gastmodus, Altersprüfung über die Attrappe, Hilfe und Kontakt, Check-in, Meldung ohne Konto. */
import { describe, expect, it } from 'vitest';
import { one, q } from '../src/db/pool.js';
import { resetRateLimits } from '../src/lib/rate.js';
import { JOBS } from '../src/jobs/index.js';
import { sentMails } from '../src/providers/mail.js';
import { Client, member, staff, testApp } from './helpers.js';

describe('Gastmodus (F01)', () => {
  it('zeigt Kacheln ohne Namen und nur unscharfe Bilder; ohne Standort keine Ortung', async () => {
    await member({ name: 'Sichtbar', pos: { lat: 50.94, lng: 6.96 } });
    resetRateLimits();
    const g = new Client(await testApp());
    expect((await g.post('/api/guest/start')).status).toBe(200);
    const none = await g.post('/api/guest/grid', {});
    expect(none.body.needsLocation).toBe(true);
    const r = await g.post('/api/guest/grid', { cityId: 'koeln' });
    expect(r.status).toBe(200);
    expect(r.body.tiles.length).toBeGreaterThan(0);
    for (const t of r.body.tiles) {
      expect(t.name).toBeNull();
      expect(t.response).toBeNull();
      if (t.photo) expect(t.blurred).toBe(true);
    }
  });

  it('nach dem Ablauf pausiert der Gastzugang', async () => {
    resetRateLimits();
    const g = new Client(await testApp());
    await g.post('/api/guest/start');
    delete g.cookies['gast'];
    const again = await g.post('/api/guest/start');
    expect(again.status).toBe(403);
    expect(again.body.fehler).toBe('UI-GAST-PAUSE');
  });
});

describe('Altersprüfung über die Attrappe (F04)', () => {
  it('gibt das Schreiben erst nach Prüfung und Vertrag frei; gespeichert wird nur Ergebnis, Weg und Zeitpunkt', async () => {
    const m = await member({ age1: false });
    const st = await m.c.post('/api/verify/start', { kind: 'age1', method: 'selfie' });
    expect(st.status).toBe(200);
    expect(st.body.url).toContain('/api/pruefpartner-attrappe/');
    // Die Attrappe signiert das Ergebnis und schickt es an den Webhook
    const done = await m.c.app.inject({
      method: 'POST',
      url: st.body.url,
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      payload: 'result=passed',
    });
    expect(done.statusCode).toBe(302);
    const acc = await one(`SELECT age1_at, age1_method FROM accounts WHERE id = $1`, [m.id]);
    expect(acc!.age1_at).not.toBeNull();
    expect(acc!.age1_method).toBe('selfie');
    const other = await member();
    const w1 = await m.c.post('/api/conversations', { to: other.id, text: 'Hallo' });
    expect(w1.body.code).toBe('vertrag_noetig');
    const cfg = await m.c.get('/api/config');
    const ctr = await m.c.post('/api/verify/contract', { version: cfg.body.contract.version, lines: [true, true, true, true] });
    expect(ctr.status).toBe(200);
    const w2 = await m.c.post('/api/conversations', { to: other.id, text: 'Hallo' });
    expect(w2.status).toBe(200);
  });

  it('ein gefälschter Webhook ohne gültige Signatur ändert nichts', async () => {
    const m = await member({ age1: false });
    const st = await m.c.post('/api/verify/start', { kind: 'age1', method: 'eid' });
    const raw = JSON.stringify({ session: st.body.sessionId, result: 'passed', ts: Date.now() });
    const r = await m.c.app.inject({ method: 'POST', url: '/api/verify/webhook', headers: { 'content-type': 'application/json', 'x-signature': 'falsch' }, payload: raw });
    expect(r.statusCode).toBe(401);
    const acc = await one(`SELECT age1_at FROM accounts WHERE id = $1`, [m.id]);
    expect(acc!.age1_at).toBeNull();
  });

  it('„nicht volljährig“ sperrt sofort (FV-17)', async () => {
    const m = await member({ age1: false });
    const st = await m.c.post('/api/verify/start', { kind: 'age1', method: 'eid' });
    await m.c.app.inject({ method: 'POST', url: st.body.url, headers: { 'content-type': 'application/x-www-form-urlencoded' }, payload: 'result=minor' });
    const acc = await one(`SELECT minor_locked_at, minor_delete_at FROM accounts WHERE id = $1`, [m.id]);
    expect(acc!.minor_locked_at).not.toBeNull();
    expect(acc!.minor_delete_at).not.toBeNull();
    expect((await m.c.post('/api/discovery', { filters: {} })).status).toBe(403);
  });
});

describe('Hilfe und Kontakt (F75)', () => {
  it('Fallnummer sofort; Antwort nur in der App; Betreff ohne Anlass', async () => {
    const m = await member();
    const t = await m.c.post('/api/help/tickets', { category: 3, text: 'Ich komme nicht weiter.' });
    expect(t.status).toBe(200);
    expect(t.body.number).toMatch(/^H-\d{4}-\d{6}$/);
    const s = await staff();
    const list = await s.c.get('/mod-api/tickets');
    const item = list.body.items.find((x: { number: string }) => x.number === t.body.number);
    expect(item).toBeTruthy();
    await s.c.post(`/mod-api/tickets/${item.id}/open`, { reason: 'Bearbeitung' });
    const before = sentMails.length;
    const rep = await s.c.post(`/mod-api/tickets/${item.id}/reply`, { text: 'So kommst du wieder hinein: ...' });
    expect(rep.status).toBe(200);
    expect(sentMails.length).toBe(before); // keine Mail
    const mine = await m.c.get('/api/help/tickets');
    expect(JSON.stringify(mine.body)).toContain('So kommst du wieder hinein');
  });

  it('Kategorie 7 legt keinen Vorgang an, sondern führt zum Widerspruch', async () => {
    const m = await member();
    const r = await m.c.post('/api/help/tickets', { category: 7, text: 'Mein Konto ist gesperrt' });
    expect(r.body.redirect).toBe('widerspruch');
  });

  it('Datenschutzvorgänge: MOD sieht, dass es sie gibt, aber nicht den Inhalt', async () => {
    const m = await member();
    const t = await m.c.post('/api/help/tickets', { category: 6, text: 'Auskunft nach Art. 15' });
    const mod = await staff('MOD');
    const betrieb = await staff('BETRIEB');
    const list = await mod.c.get('/mod-api/tickets');
    const item = list.body.items.find((x: { number: string }) => x.number === t.body.number);
    expect(item.mayOpen).toBe(false);
    expect((await mod.c.post(`/mod-api/tickets/${item.id}/open`, { reason: 'x' })).status).toBe(403);
    expect((await betrieb.c.post(`/mod-api/tickets/${item.id}/open`, { reason: 'Auskunft' })).status).toBe(200);
  });

  it('Kategorie ändern: neue Frist, die alte bleibt sichtbar (M85.09)', async () => {
    const m = await member();
    const t = await m.c.post('/api/help/tickets', { category: 10, text: 'Eigentlich eine Belästigung' });
    const s = await staff();
    const item = (await s.c.get('/mod-api/tickets')).body.items.find((x: { number: string }) => x.number === t.body.number);
    const r = await s.c.post(`/mod-api/tickets/${item.id}/category`, { category: 2, reason: 'falsch eingeordnet' });
    expect(r.status).toBe(200);
    const row = await one(`SELECT pot, deadline_history FROM tickets WHERE id = $1`, [item.id]);
    expect(row!.pot).toBe('missbrauch');
    expect(row!.deadline_history).toHaveLength(1);
  });

  it('ohne Konto: Antwort per Mail, Betreff nur die Fallnummer', async () => {
    resetRateLimits();
    const g = new Client(await testApp());
    const r = await g.post('/api/help/tickets', { category: 5, text: 'Etwas geht nicht', email: 'ohne-konto@example.invalid' });
    expect(r.status).toBe(200);
    const mail = [...sentMails].reverse().find((x) => x.to === 'ohne-konto@example.invalid');
    expect(mail!.subject).toBe(`Deine Fallnummer ${r.body.number}`);
  });
});

describe('Meldung ohne Konto (Art. 16 DSA)', () => {
  it('nimmt eine Meldung mit Kontaktangaben an und vergibt eine Fallnummer', async () => {
    resetRateLimits();
    const g = new Client(await testApp());
    const noContact = await g.post('/api/public/report', { reason: 'fake', where: 'Profil „Max“ in Köln', goodFaith: true });
    expect(noContact.body.code).toBe('kontakt_fehlt');
    // Verdacht auf Missbrauchsdarstellungen: ohne Pflicht zu Name und Adresse
    const csam = await g.post('/api/public/report', { reason: 'missbrauchsdarstellung', where: 'Album eines Profils', goodFaith: true });
    expect(csam.status).toBe(200);
    const r = await g.post('/api/public/report', { reason: 'fake', where: 'Profil „Max“ in Köln', description: 'Fremde Fotos', name: 'Jemand', email: 'melder@example.invalid', goodFaith: true });
    expect(r.status).toBe(200);
    expect(r.body.number).toMatch(/^M-\d{4}-\d{6}$/);
  });
});

describe('Check-in (F55)', () => {
  it('fragt nach, und ohne Antwort ist nach der Frist eine Weiterleitung möglich — nichts wird dauerhaft gespeichert', async () => {
    const m = await member();
    const c = await m.c.post('/api/checkins', { effect: 'benachrichtigen' });
    expect(c.status).toBe(200);
    await q(`UPDATE checkins SET q1_at = now() - interval '1 minute' WHERE id = $1`, [c.body.id]);
    await JOBS.find((j) => j.name === 'checkins')!.run();
    const cur = await m.c.get('/api/checkins/current');
    expect(cur.body.checkin.asked).toBeGreaterThanOrEqual(1);
    const ans = await m.c.post(`/api/checkins/${c.body.id}/answer`, { answer: 'ja' });
    expect(ans.status).toBe(200);
    expect(await one(`SELECT 1 FROM checkins WHERE id = $1`, [c.body.id])).toBeNull();
  });
});
