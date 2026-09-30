/**
 * Issue #37: Support-Portal — Nachricht an das Team, Antwort in der App (Hinweis per E-Mail nur auf Wunsch
 * und ohne Inhalt), Antworten nur in der App, Datenfreigabe erst nach Zustimmung, befristet, widerrufbar,
 * jede Einsicht im Zugriffsprotokoll, Ende mit dem Abschluss.
 */
import { describe, expect, it } from 'vitest';
import { one, q } from '../src/db/pool.js';
import { sentMails } from '../src/providers/mail.js';
import { flushForwards } from '../src/services/notice-forward.js';
import { expireDataRequests } from '../src/services/support.js';
import { member, staff } from './helpers.js';

describe('Support-Portal (Issue #37)', () => {
  it('Nachricht, Antwort in der App, Hinweis per E-Mail ohne Inhalt', async () => {
    const m = await member({ name: 'Fragt' });
    const s = await staff();
    const tk = await m.c.post('/api/help/tickets', { category: 3, text: 'Mein Foto lädt nicht hoch.', notifyEmail: true });
    expect(tk.status).toBe(200);
    const row = await one(`SELECT reply_way, notify_email FROM tickets WHERE id = $1`, [tk.body.id]);
    expect(row).toEqual({ reply_way: 'app', notify_email: true });

    await s.c.post(`/mod-api/tickets/${tk.body.id}/open`, { reason: 'Bearbeitung' });
    expect((await s.c.post(`/mod-api/tickets/${tk.body.id}/reply`, { text: 'Geheime Antwort: bitte App neu laden.' })).status).toBe(200);
    await flushForwards();
    const mail = [...sentMails].reverse().find((x) => x.to === m.email)!;
    expect(mail.subject).toContain(tk.body.number);
    expect(mail.text).not.toContain('Geheime Antwort');
    expect(mail.text).toContain(`/ich/hilfe?vorgang=${tk.body.number}`);

    let mine = (await m.c.get('/api/help/tickets')).body.tickets[0];
    expect(mine.unread).toBe(1);
    expect(mine.messages.at(-1)).toMatchObject({ fromTeam: true, text: 'Geheime Antwort: bitte App neu laden.' });
    await m.c.post(`/api/help/tickets/${tk.body.id}/read`);
    mine = (await m.c.get('/api/help/tickets')).body.tickets[0];
    expect(mine.unread).toBe(0);
    // Antwort der Person nur in der App — der Vorgang geht zurück in Bearbeitung
    expect((await m.c.post(`/api/help/tickets/${tk.body.id}/reply`, { text: 'Klappt jetzt, danke!' })).status).toBe(200);
    expect((await one(`SELECT status FROM tickets WHERE id = $1`, [tk.body.id]))!.status).toBe('in_bearbeitung');
    // Hinweis wieder ausschalten
    expect((await m.c.patch(`/api/help/tickets/${tk.body.id}`, { notifyEmail: false })).status).toBe(200);
    // Schließen funktioniert (Aufbewahrung je Bereich)
    expect((await s.c.post(`/mod-api/tickets/${tk.body.id}/close`, { closeReason: 'beantwortet' })).status).toBe(200);
    const closed = await one(`SELECT status, delete_after > now() + interval '80 days' AS lang FROM tickets WHERE id = $1`, [tk.body.id]);
    expect(closed).toEqual({ status: 'abgeschlossen', lang: true });
  });

  it('Datenfreigabe nur nach Zustimmung, mit Diagnose, widerrufbar, protokolliert', async () => {
    const m = await member({ name: 'Gibt frei' });
    const s = await staff();
    const tk = await m.c.post('/api/help/tickets', { category: 3, text: 'Die App stürzt ab.' });
    const id = tk.body.id;
    await s.c.post(`/mod-api/tickets/${id}/open`, { reason: 'Bearbeitung' });
    const req = await s.c.post(`/mod-api/tickets/${id}/data-request`, { scope: ['konto', 'profil', 'diagnose'], reason: 'Wir brauchen Gerätedaten zum Absturz.' });
    expect(req.status).toBe(200);
    // höchstens eine offene Anfrage
    expect((await s.c.post(`/mod-api/tickets/${id}/data-request`, { scope: ['konto'], reason: 'Noch eine Anfrage bitte.' })).status).toBe(409);
    // vor der Freigabe: nichts
    expect((await s.c.post(`/mod-api/tickets/${id}/data`, { requestId: req.body.id })).body.code).toBe('keine_freigabe');
    // die Person sieht die Anfrage mit Begründung und hat eine Mitteilung
    const mine = (await m.c.get('/api/help/tickets')).body.tickets[0];
    expect(mine.dataRequests[0]).toMatchObject({ status: 'offen', scope: ['konto', 'profil', 'diagnose'], reason: 'Wir brauchen Gerätedaten zum Absturz.' });
    const n = await one(`SELECT kind, url FROM notices WHERE account_id = $1 ORDER BY created_at DESC LIMIT 1`, [m.id]);
    expect(n!.kind).toBe('hilfe_freigabe');
    const target = (await m.c.get('/api/notices')).body.notices[0].target;
    expect(target).toBe(`/ich/hilfe?vorgang=${tk.body.number}`);

    const ok = await m.c.post(`/api/help/data-requests/${req.body.id}`, {
      decision: 'freigeben',
      diagnostics: { userAgent: 'Testbrowser', screen: '390x844', errors: [{ message: 'TypeError: x is undefined' }] },
    });
    expect(ok.status).toBe(200);
    const data = await s.c.post(`/mod-api/tickets/${id}/data`, { requestId: req.body.id, reason: 'Absturz nachvollziehen' });
    expect(data.status).toBe(200);
    expect(data.body.data.konto.email).toMatch(/^t…@example\.invalid$/);
    expect(data.body.data.konto.emailBestaetigt).toBe(true);
    expect(data.body.data.profil.name).toBe('Gibt frei');
    expect(data.body.data.diagnose.userAgent).toBe('Testbrowser');
    expect(data.body.data.diagnose.server.version).toBeTruthy();
    const log = await one(`SELECT count(*)::int AS n FROM access_log WHERE case_ref = $1 AND action = 'freigegebene_daten_eingesehen'`, [tk.body.number]);
    expect(log!.n).toBe(1);

    // Widerruf: sofort nichts mehr, Diagnosedaten gelöscht
    expect((await m.c.post(`/api/help/data-requests/${req.body.id}/revoke`)).status).toBe(200);
    expect((await s.c.post(`/mod-api/tickets/${id}/data`, { requestId: req.body.id })).status).toBe(403);
    expect((await one(`SELECT diagnostics_enc FROM support_data_requests WHERE id = $1`, [req.body.id]))!.diagnostics_enc).toBeNull();

    // neue Anfrage, abgelehnt → nichts
    const req2 = await s.c.post(`/mod-api/tickets/${id}/data-request`, { scope: ['profil'], reason: 'Bitte nur das Profil ansehen.' });
    await m.c.post(`/api/help/data-requests/${req2.body.id}`, { decision: 'ablehnen' });
    expect((await s.c.post(`/mod-api/tickets/${id}/data`, { requestId: req2.body.id })).status).toBe(403);

    // Freigabe läuft ab
    const req3 = await s.c.post(`/mod-api/tickets/${id}/data-request`, { scope: ['konto'], reason: 'Bitte noch einmal das Konto.' });
    await m.c.post(`/api/help/data-requests/${req3.body.id}`, { decision: 'freigeben' });
    await q(`UPDATE support_data_requests SET expires_at = now() - interval '1 minute' WHERE id = $1`, [req3.body.id]);
    await expireDataRequests();
    expect((await one(`SELECT status FROM support_data_requests WHERE id = $1`, [req3.body.id]))!.status).toBe('abgelaufen');

    // fremde Personen können nicht entscheiden
    const other = await member({ name: 'Fremd' });
    const req4 = await s.c.post(`/mod-api/tickets/${id}/data-request`, { scope: ['konto'], reason: 'Letzte Anfrage in diesem Fall.' });
    expect((await other.c.post(`/api/help/data-requests/${req4.body.id}`, { decision: 'freigeben' })).status).toBe(404);
    // Abschluss beendet offene Anfragen
    await s.c.post(`/mod-api/tickets/${id}/close`, { closeReason: 'beantwortet' });
    expect((await one(`SELECT status FROM support_data_requests WHERE id = $1`, [req4.body.id]))!.status).toBe('abgelaufen');
  });

  it('ohne Konto: keine Datenfreigabe, Antwort weiter per E-Mail', async () => {
    const { Client, testApp } = await import('./helpers.js');
    const anon = new Client(await testApp());
    const tk = await anon.post('/api/help/tickets', { category: 3, text: 'Frage ohne Konto', email: 'ohne-konto@example.invalid' });
    const s = await staff();
    await s.c.post(`/mod-api/tickets/${tk.body.id}/open`, { reason: 'Bearbeitung' });
    expect((await s.c.post(`/mod-api/tickets/${tk.body.id}/data-request`, { scope: ['konto'], reason: 'Das geht ohne Konto nicht.' })).status).toBe(404);
    await s.c.post(`/mod-api/tickets/${tk.body.id}/reply`, { text: 'Antwort per E-Mail an dich.' });
    const mail = [...sentMails].reverse().find((x) => x.to === 'ohne-konto@example.invalid')!;
    expect(mail.text).toContain('Antwort per E-Mail an dich.');
  });
});
