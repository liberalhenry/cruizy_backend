/** Antwortquote (Issue #24): Berechnung, Ausschlüsse, Absage, Mindestzahl, Hysterese, nie Prozent für andere. */
import { describe, expect, it } from 'vitest';
import { one, q } from '../src/db/pool.js';
import { destination } from '../src/lib/geo.js';
import { finalizeExit } from '../src/modules/chat.js';
import { recomputeResponseRates, stageFor } from '../src/services/response-rate.js';
import { member, type Member } from './helpers.js';

const C = { lat: 47.1, lng: 9.2 };

async function incoming(target: Member, n: number) {
  const out: { s: Member; conv: string }[] = [];
  for (let i = 0; i < n; i++) {
    const s = await member({ pos: destination(C, (i * 29) % 360, 1) });
    const r = await s.c.post('/api/conversations', { to: target.id, text: 'Hallo' });
    out.push({ s, conv: r.body.conversationId });
  }
  return out;
}
const expire = (id: string) =>
  q(`UPDATE first_message_stats SET deadline_at = now() - interval '1 minute' WHERE recipient_id = $1 AND answered_at IS NULL`, [id]);

describe('Stufen mit Hysterese', () => {
  it('aufsteigen sofort, absteigen erst 5 Punkte unter der Grenze', () => {
    expect(stageFor(0.9, null)).toBe(1);
    expect(stageFor(0.7, null)).toBe(2);
    expect(stageFor(0.5, null)).toBe(3);
    expect(stageFor(0.4, null)).toBeNull();
    expect(stageFor(0.82, 1)).toBe(1); // bleibt bis unter 80 %
    expect(stageFor(0.79, 1)).toBe(2);
    expect(stageFor(0.61, 2)).toBe(2); // bleibt bis unter 60 %
    expect(stageFor(0.59, 2)).toBe(3);
    expect(stageFor(0.41, 3)).toBe(3); // bleibt bis unter 40 %
    expect(stageFor(0.39, 3)).toBeNull();
    expect(stageFor(0.86, 3)).toBe(1); // Aufstieg sofort
    expect(stageFor(null, 1)).toBeNull(); // unter der Mindestzahl keine Quote
  });
});

describe('Berechnung', () => {
  it('unter 10 gezählten Unterhaltungen keine Quote', async () => {
    const target = await member({ pos: C });
    const list = await incoming(target, 9);
    for (const x of list) await target.c.post(`/api/conversations/${x.conv}/messages`, { text: 'Hi' });
    await recomputeResponseRates(target.id);
    const me = await target.c.get('/api/profile/me');
    expect(me.body.profile.responseRate.band).toBeNull();
    expect(me.body.profile.responseRate.pct).toBeNull();
    expect(me.body.profile.responseRate.counted).toBe(9);
  });

  it('Absage zählt als Antwort; eigener Prozentwert nur für einen selbst', async () => {
    const target = await member({ pos: C });
    const list = await incoming(target, 12);
    for (const x of list.slice(0, 9)) await target.c.post(`/api/conversations/${x.conv}/messages`, { text: 'Hi' });
    // höfliche Absage per Tipp
    await target.c.post(`/api/conversations/${list[9].conv}/exit`);
    await q(`UPDATE conversations SET pending_exit_at = now() - interval '1 second' WHERE id = $1`, [list[9].conv]);
    await finalizeExit(list[9].conv);
    await expire(target.id);
    await recomputeResponseRates(target.id);
    const me = await target.c.get('/api/profile/me');
    expect(me.body.profile.responseRate.pct).toBe(83); // 10 von 12
    expect(me.body.profile.responseRate.band).toBe(2);
    const view = await list[0].s.c.get(`/api/profiles/${target.id}`);
    expect(view.body.profile.response).toBe(2);
    // nur Feldnamen und Zahlenwerte prüfen — Kennungen und Bild-Token enthalten zufällig auch „83“
    expect(JSON.stringify(view.body)).not.toMatch(/"(pct|counted|answered)"|:0\.83\b|:83[,}]/);
  });

  it('Ausschlüsse: blockiert, gemeldet, gesperrt, zurückgezogen, laufende Frist, Massennachrichten', async () => {
    const target = await member({ pos: C });
    const list = await incoming(target, 10);
    for (const x of list) await target.c.post(`/api/conversations/${x.conv}/messages`, { text: 'Hi' });
    const bad = await incoming(target, 6);
    await target.c.post('/api/blocks', { targetId: bad[0].s.id });
    await target.c.post('/api/reports', { reason: 'belaestigung', targetId: bad[1].s.id, context: 'profil' });
    await q(`UPDATE accounts SET moderation_state = 'suspended' WHERE id = $1`, [bad[2].s.id]);
    await q(`DELETE FROM messages WHERE conversation_id = $1`, [bad[3].conv]); // zurückgezogen
    // bad[4]: Frist läuft noch → noch nicht gezählt
    // bad[5]: Massenabsender (mehr als 20 neue Unterhaltungen in einer Stunde)
    const spam = bad[5].s;
    for (let i = 0; i < 21; i++) {
      const r = await member({ pos: destination(C, i * 17, 2) });
      await spam.c.post('/api/conversations', { to: r.id, text: 'Hallo' });
    }
    await q(`UPDATE first_message_stats SET deadline_at = now() - interval '1 minute'
              WHERE recipient_id = $1 AND answered_at IS NULL AND sender_id <> $2`, [target.id, bad[4].s.id]);
    await recomputeResponseRates(target.id);
    const pr = await one(`SELECT response_band, response_pct, response_counted FROM profiles WHERE account_id = $1`, [target.id]);
    expect(pr!.response_counted).toBe(10);
    expect(pr!.response_pct).toBe(1);
    expect(pr!.response_band).toBe(1);
  });

  it('auf der Kachel nur die oberste Stufe', async () => {
    const target = await member({ pos: C });
    const viewer = await member({ pos: destination(C, 0, 1) });
    await q(`UPDATE profiles SET response_band = 2, response_pct = 0.7, response_counted = 12 WHERE account_id = $1`, [target.id]);
    const find = async () => {
      let r = await viewer.c.post('/api/discovery', { filters: {}, grid: { radiusKm: 3, expand: false } });
      for (;;) {
        const x = r.body.tiles.find((t: { id: string }) => t.id === target.id);
        if (x || !r.body.cursor) return x;
        r = await viewer.c.post('/api/discovery', { filters: {}, cursor: r.body.cursor });
      }
    };
    expect((await find()).response).toBeNull();
    await q(`UPDATE profiles SET response_band = 1 WHERE account_id = $1`, [target.id]);
    expect((await find()).response).toBe(1);
    // Filter „Antwortet meistens oder besser“
    await q(`UPDATE profiles SET response_band = 3 WHERE account_id = $1`, [target.id]);
    const f = await viewer.c.post('/api/discovery', { filters: { responsive: true }, grid: { radiusKm: 3, expand: false } });
    expect(f.body.tiles.some((t: { id: string }) => t.id === target.id)).toBe(false);
  });
});
