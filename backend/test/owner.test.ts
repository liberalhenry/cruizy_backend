/**
 * Owner handeln allein und ohne Begründung — in jeder Werkzeug-Route. Für alle anderen bleiben
 * Begründung und zweite Person Pflicht.
 */
import { describe, expect, it } from 'vitest';
import { one } from '../src/db/pool.js';
import { OWNER_NO_REASON } from '../src/modules/mod/core.js';
import { destination } from '../src/lib/geo.js';
import { member, staff } from './helpers.js';

const KOELN = { lat: 50.9375, lng: 6.9603 };

async function reported() {
  const a = await member({ pos: KOELN });
  const b = await member({ pos: destination(KOELN, 0, 1) });
  const first = await a.c.post('/api/conversations', { to: b.id, text: 'eine Drohung' });
  const r = await b.c.post('/api/reports', {
    reason: 'belaestigung',
    targetId: a.id,
    context: 'gespraech',
    contextId: first.body.conversationId,
    items: [{ kind: 'message', id: first.body.messageId }],
  });
  const rep = await one(`SELECT id FROM reports WHERE number = $1`, [r.body.number]);
  return { a, b, number: r.body.number as string, reportId: rep!.id as string };
}

describe('Owner: alles allein, ohne Begründung', () => {
  it('Meldung „gesperrt“ ohne Begründung wirkt sofort — ohne zweite Person', async () => {
    const { a, reportId, number } = await reported();
    const owner = await staff('MOD', true);
    const d = await owner.c.post(`/mod-api/reports/${reportId}/decide`, { decision: 'gesperrt' });
    expect(d.status).toBe(200);
    expect(d.body).toMatchObject({ pendingSecondPerson: false, selfApproved: true });
    expect((await one(`SELECT moderation_state FROM accounts WHERE id = $1`, [a.id]))!.moderation_state).toBe('suspended');
    const rep = await one(`SELECT status, decision FROM reports WHERE id = $1`, [reportId]);
    expect(rep).toEqual({ status: 'decided', decision: 'gesperrt' });
    const log = await one(`SELECT reason FROM access_log WHERE case_ref = $1 AND action = 'meldung_gesperrt'`, [number]);
    expect(log!.reason).toBe(OWNER_NO_REASON);
    // die betroffene Person liest keinen Platzhalter, sondern einen neutralen Satz
    const n = await one(`SELECT body FROM notices WHERE account_id = $1 AND kind = 'sperre'`, [a.id]);
    expect(n!.body).not.toContain(OWNER_NO_REASON);
    expect(n!.body).toContain('Nach Prüfung durch unser Team.');
  });

  it('ohne Owner: Begründung Pflicht, Sperre wartet auf die zweite Person', async () => {
    const { a, reportId } = await reported();
    const mod = await staff('MOD', false);
    expect((await mod.c.post(`/mod-api/reports/${reportId}/decide`, { decision: 'gesperrt' })).status).toBe(400);
    const d = await mod.c.post(`/mod-api/reports/${reportId}/decide`, { decision: 'gesperrt', reason: 'Drohung im Erstkontakt, eindeutig' });
    expect(d.body.pendingSecondPerson).toBe(true);
    expect((await one(`SELECT moderation_state FROM accounts WHERE id = $1`, [a.id]))!.moderation_state).toBe('none');
  });

  it('Sperre, Fall schließen, Kontext, Datenfreigabe — alles ohne Begründung', async () => {
    const { a, number, reportId } = await reported();
    const owner = await staff('BETRIEB', true);
    const su = await owner.c.post('/mod-api/suspensions', { action: 'restrict', caseRef: number });
    expect(su.status).toBe(200);
    expect(su.body.state).toBe('wirksam');
    expect((await one(`SELECT moderation_state FROM accounts WHERE id = $1`, [a.id]))!.moderation_state).toBe('restricted');
    const ctx = await owner.c.post(`/mod-api/reports/${reportId}/context/request`, {});
    expect(ctx.status).toBe(200);
    expect(ctx.body.approved).toBe(true);
    const tk = await a.c.post('/api/help/tickets', { category: 3, text: 'Warum bin ich eingeschränkt?' });
    expect((await owner.c.post(`/mod-api/tickets/${tk.body.id}/open`, {})).status).toBe(200);
    const dr = await owner.c.post(`/mod-api/tickets/${tk.body.id}/data-request`, { scope: ['konto'] });
    expect(dr.status).toBe(200);
    // die Person sieht einen neutralen Satz statt des Platzhalters
    const mine = (await a.c.get('/api/help/tickets')).body.tickets.find((x: { id: string }) => x.id === tk.body.id);
    expect(mine.dataRequests[0].reason).toBe('Damit wir dir bei deiner Anfrage helfen können.');
    expect((await owner.c.post(`/mod-api/tickets/${tk.body.id}/category`, { category: 5 })).status).toBe(200);
  });

  it('Widerspruch gegen die eigene Entscheidung: Owner ja, andere nein', async () => {
    const { a, number } = await reported();
    const owner = await staff('MOD', true);
    const su = await owner.c.post('/mod-api/suspensions', { action: 'suspend', caseRef: number });
    const ap = await a.c.post('/api/appeals', { suspensionId: su.body.id, text: 'Das war ein Missverständnis, bitte prüft das.' });
    const appeal = await one(`SELECT id FROM appeals WHERE number = $1`, [ap.body.number]);
    const answer = 'Wir haben die Nachricht noch einmal gelesen und heben die Sperre auf.';
    const d = await owner.c.post(`/mod-api/appeals/${appeal!.id}/decide`, { outcome: 'aufgehoben', answer });
    expect(d.status).toBe(200);
    expect((await one(`SELECT moderation_state FROM accounts WHERE id = $1`, [a.id]))!.moderation_state).toBe('none');
    const log = await one(`SELECT 1 FROM access_log WHERE case_ref = $1 AND action = 'widerspruch_aufgehoben_ohne_zweite_person'`, [ap.body.number]);
    expect(log).not.toBeNull();
  });
});
