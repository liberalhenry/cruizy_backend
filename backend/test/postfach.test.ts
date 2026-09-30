/**
 * Postfach im Werkzeug: jede Meldung, jeder Widerspruch, jede Rückmeldung mit Antwortwunsch und jede
 * Anfrage ist ein Ticket; Teams und Weitergabe; Frist 24 h bis zur ersten Antwort, danach 24 h ab der
 * letzten Nachricht der Person; interne Notizen sieht die Person nie; Sperre aus dem Ticket heraus.
 */
import { describe, expect, it } from 'vitest';
import { one, q } from '../src/db/pool.js';
import { destination } from '../src/lib/geo.js';
import { syncPostfach, teamForCategory } from '../src/services/postfach.js';
import { member, staff } from './helpers.js';

const KOELN = { lat: 50.9375, lng: 6.9603 };
const H = 3600_000;

describe('Postfach', () => {
  it('Anfrage ohne Anlass → allgemeiner Support; mit Anlass direkt ins Team', async () => {
    const m = await member({ name: 'Fragt' });
    const s = await staff('BETRIEB', false);
    const general = await m.c.post('/api/help/tickets', { text: 'Ich habe eine allgemeine Frage.' });
    const tech = await m.c.post('/api/help/tickets', { category: 5, text: 'Die Karte lädt nicht.' });
    const data = await m.c.post('/api/help/tickets', { category: 6, text: 'Auskunft bitte.' });
    const row = async (id: string) => one(`SELECT team, kind, pot, deadline_at FROM tickets WHERE id = $1`, [id]);
    expect(await row(general.body.id)).toMatchObject({ team: 'support', kind: 'anfrage', pot: 'hilfe' });
    expect((await row(tech.body.id))!.team).toBe('technik');
    expect(await row(data.body.id)).toMatchObject({ team: 'datenschutz', pot: 'datenschutz' });
    // Frist 24 h bis zur ersten Antwort
    const d = new Date((await row(general.body.id))!.deadline_at).getTime() - Date.now();
    expect(d).toBeGreaterThan(23.9 * H);
    expect(d).toBeLessThan(24.1 * H);
    expect(teamForCategory(1)).toBe('moderation');
    // im Postfach: Filter nach Team
    const list = (await s.c.get('/mod-api/postfach?team=technik')).body;
    expect(list.items.map((x: { id: string }) => x.id)).toContain(tech.body.id);
    expect(list.items.map((x: { id: string }) => x.id)).not.toContain(general.body.id);
    expect(list.teams.find((x: { key: string }) => x.key === 'support').open).toBeGreaterThan(0);
  });

  it('Weitergabe, interne Notiz, Frist nach Antwort und nach Nachricht der Person', async () => {
    const m = await member({ name: 'Weiter' });
    const s = await staff('MOD', false);
    const tk = await m.c.post('/api/help/tickets', { text: 'Seit dem Update stürzt die App ab.' });
    const id = tk.body.id;
    expect((await s.c.post(`/mod-api/tickets/${id}/open`, { reason: 'Bearbeitung' })).status).toBe(200);
    // an Technik weitergeben — mit Notiz fürs Team
    const fw = await s.c.post(`/mod-api/tickets/${id}/team`, { team: 'technik', note: 'Bitte Absturz prüfen, Android.' });
    expect(fw.status).toBe(200);
    expect((await one(`SELECT team, assigned_to FROM tickets WHERE id = $1`, [id]))).toEqual({ team: 'technik', assigned_to: null });
    await s.c.post(`/mod-api/tickets/${id}/reply`, { text: 'Nur fürs Team: Version 0.4.0.', internal: true });
    // die Person sieht weder Notizen noch Systemeinträge
    let mine = (await m.c.get('/api/help/tickets')).body.tickets.find((x: { id: string }) => x.id === id);
    expect(mine.messages).toEqual([]);
    expect((await one(`SELECT status FROM tickets WHERE id = $1`, [id]))!.status).toBe('in_bearbeitung');
    // Antwort an die Person: jetzt ist sie dran, keine Frist für das Team
    await s.c.post(`/mod-api/tickets/${id}/reply`, { text: 'Danke! Welches Gerät nutzt du?' });
    mine = (await m.c.get('/api/help/tickets')).body.tickets.find((x: { id: string }) => x.id === id);
    expect(mine.messages.map((x: { text: string }) => x.text)).toEqual(['Danke! Welches Gerät nutzt du?']);
    let item = (await s.c.get('/mod-api/postfach?view=wartet')).body.items.find((x: { id: string }) => x.id === id);
    expect(item).toMatchObject({ waitingOn: 'person', deadlineAt: null, firstResponse: true });
    // Die Person antwortet → 24 h ab ihrer Nachricht
    await q(`UPDATE tickets SET deadline_at = now() - interval '1 hour' WHERE id = $1`, [id]);
    await m.c.post(`/api/help/tickets/${id}/reply`, { text: 'Pixel 7.' });
    const row = await one(`SELECT status, deadline_at FROM tickets WHERE id = $1`, [id]);
    expect(row!.status).toBe('in_bearbeitung');
    const left = new Date(row!.deadline_at).getTime() - Date.now();
    expect(left).toBeGreaterThan(23.9 * H);
    item = (await s.c.get('/mod-api/postfach?team=technik')).body.items.find((x: { id: string }) => x.id === id);
    expect(item).toMatchObject({ waitingOn: 'team', unread: 1 });
    // im Werkzeug: vollständiger Verlauf mit Notizen und Systemeintrag
    const open = (await s.c.post(`/mod-api/tickets/${id}/open`, { reason: 'Bearbeitung' })).body;
    expect(open.text).toBe('Seit dem Update stürzt die App ab.');
    expect(open.messages.map((x: { author: string; internal: boolean }) => `${x.author}${x.internal ? '/intern' : ''}`)).toEqual([
      'system/intern',
      'team/intern',
      'team/intern',
      'team',
      'person',
    ]);
  });

  it('Meldung → Ticket mit der meldenden Person; Antwort landet bei ihr; Entscheidung schließt das Ticket', async () => {
    const a = await member({ pos: KOELN, name: 'Gemeldet' });
    const b = await member({ pos: destination(KOELN, 0, 1), name: 'Meldet' });
    const first = await a.c.post('/api/conversations', { to: b.id, text: 'eine Drohung' });
    const r = await b.c.post('/api/reports', {
      reason: 'belaestigung',
      description: 'Er droht mir.',
      targetId: a.id,
      context: 'gespraech',
      contextId: first.body.conversationId,
      items: [{ kind: 'message', id: first.body.messageId }],
    });
    const rep = await one(`SELECT id FROM reports WHERE number = $1`, [r.body.number]);
    const tk = await one(`SELECT * FROM tickets WHERE report_id = $1`, [rep!.id]);
    expect(tk).toMatchObject({ kind: 'meldung', team: 'moderation', account_id: b.id, related_ref: r.body.number });
    const s = await staff('MOD', false);
    const list = (await s.c.get('/mod-api/postfach?team=moderation')).body.items;
    expect(list.find((x: { id: string }) => x.id === tk!.id).subject).toContain(r.body.number);
    const open = (await s.c.post(`/mod-api/tickets/${tk!.id}/open`, { reason: 'Meldung prüfen' })).body;
    expect(open.text).toBe('Er droht mir.');
    expect(open.report).toMatchObject({ number: r.body.number, target: { id: a.id, name: 'Gemeldet' } });
    expect(open.person).toMatchObject({ id: b.id, name: 'Meldet' });
    await s.c.post(`/mod-api/tickets/${tk!.id}/reply`, { text: 'Danke, wir sehen es uns an.' });
    const n = await one(`SELECT kind FROM notices WHERE account_id = $1 AND ref = $2`, [b.id, tk!.number]);
    expect(n!.kind).toBe('hilfe_antwort');
    const mine = (await b.c.get('/api/help/tickets')).body.tickets.find((x: { id: string }) => x.id === tk!.id);
    expect(mine.kind).toBe('meldung');
    expect(mine.subject).toContain(r.body.number);
    // Entscheidung → Ticket abgeschlossen (die Person war dran, nicht das Team)
    await s.c.post(`/mod-api/reports/${rep!.id}/decide`, { decision: 'bleibt', reason: 'Keine Drohung erkennbar, Ironie.' });
    await syncPostfach();
    expect((await one(`SELECT status FROM tickets WHERE id = $1`, [tk!.id]))!.status).toBe('abgeschlossen');
  });

  it('Widerspruch, Rückmeldung mit Antwortwunsch und alte Fälle bekommen Tickets; Sperre aus dem Ticket', async () => {
    const m = await member({ name: 'Rueck' });
    await m.c.post('/api/feedback', { text: 'Bitte einen Dunkelmodus für die Karte.', wantsReply: true });
    await m.c.post('/api/feedback', { text: 'Anonym.', wantsReply: false });
    const fb = await q(`SELECT t.kind, t.team FROM tickets t JOIN feedback f ON f.id = t.feedback_id WHERE t.account_id = $1`, [m.id]);
    expect(fb).toEqual([{ kind: 'rueckmeldung', team: 'support' }]);
    // alter Fall ohne Ticket (vor dem Postfach): der Abgleich legt eines an
    const owner = await staff('MOD', true);
    const tk = await m.c.post('/api/help/tickets', { text: 'Ich werde belästigt, bitte sperrt mich nicht.' });
    const number = (await one(`SELECT number FROM tickets WHERE id = $1`, [tk.body.id]))!.number;
    // Sperre mit Bezug auf das Ticket — ein Owner braucht keine zweite Person und keine Begründung
    const su = await owner.c.post('/mod-api/suspensions', { action: 'restrict', caseRef: number });
    expect(su.body.state).toBe('wirksam');
    expect((await one(`SELECT ticket_id FROM suspensions WHERE id = $1`, [su.body.id]))!.ticket_id).toBe(tk.body.id);
    const ap = await m.c.post('/api/appeals', { suspensionId: su.body.id, text: 'Das ist ein Irrtum.' });
    const appeal = await one(`SELECT id FROM appeals WHERE number = $1`, [ap.body.number]);
    const apTicket = await one(`SELECT kind, team, account_id FROM tickets WHERE appeal_id = $1`, [appeal!.id]);
    expect(apTicket).toEqual({ kind: 'widerspruch', team: 'moderation', account_id: m.id });
    await q(`DELETE FROM tickets WHERE appeal_id = $1`, [appeal!.id]);
    await syncPostfach();
    expect(await one(`SELECT 1 FROM tickets WHERE appeal_id = $1`, [appeal!.id])).not.toBeNull();
  });

  it('Datenschutz-Tickets öffnet nur BETRIEB — auch nach Weitergabe', async () => {
    const m = await member();
    const mod = await staff('MOD', false);
    const betrieb = await staff('BETRIEB', false);
    const tk = await m.c.post('/api/help/tickets', { text: 'Bitte löscht meine Daten.' });
    expect((await mod.c.post(`/mod-api/tickets/${tk.body.id}/team`, { team: 'datenschutz' })).status).toBe(200);
    expect((await mod.c.post(`/mod-api/tickets/${tk.body.id}/open`, { reason: 'x' })).status).toBe(403);
    expect((await betrieb.c.post(`/mod-api/tickets/${tk.body.id}/open`, { reason: 'Auskunft' })).status).toBe(200);
    const item = (await mod.c.get('/mod-api/postfach?team=datenschutz')).body.items.find((x: { id: string }) => x.id === tk.body.id);
    expect(item.mayOpen).toBe(false);
  });
});
