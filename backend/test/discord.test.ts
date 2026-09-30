/** Discord-Webhooks (Issue #6): Kanal je Kategorie, keine personenbezogenen Daten, robust. */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetEnvCache } from '../src/config/env.js';
import { one } from '../src/db/pool.js';
import { buildPayload, discord, discordFlush, setDiscordTransport, webhookFor } from '../src/services/discord.js';
import { Client, member, staff, testApp } from './helpers.js';
import { destination } from '../src/lib/geo.js';

const DEFAULT = 'https://discord.invalid/api/webhooks/1/default';
const SICHERHEIT = 'https://discord.invalid/api/webhooks/2/sicherheit';
const KOELN = { lat: 50.9375, lng: 6.9603 };

let sent: { url: string; payload: any }[] = [];
let answer: (url: string) => { status: number; retryAfterMs?: number } = () => ({ status: 204 });

beforeAll(() => {
  process.env.DISCORD_WEBHOOK_DEFAULT = DEFAULT;
  process.env.DISCORD_WEBHOOK_SICHERHEIT = SICHERHEIT;
  resetEnvCache();
  setDiscordTransport(async (url, payload) => {
    sent.push({ url, payload });
    return answer(url);
  });
});

afterAll(() => {
  delete process.env.DISCORD_WEBHOOK_DEFAULT;
  delete process.env.DISCORD_WEBHOOK_SICHERHEIT;
  resetEnvCache();
  setDiscordTransport(null);
});

beforeEach(() => {
  sent = [];
  answer = () => ({ status: 204 });
});

const titles = () => sent.map((x) => x.payload.embeds[0].title as string);

describe('Discord-Webhooks (Issue #6)', () => {
  it('eigene Adresse je Kategorie, sonst DEFAULT', () => {
    expect(webhookFor('sicherheit')).toBe(SICHERHEIT);
    expect(webhookFor('meldungen')).toBe(DEFAULT);
  });

  it('Werkzeug-Handlungen: Vorgang und Person ja, Begründung nie', async () => {
    const s = await staff('BETRIEB');
    const geheim = 'Begründung mit Personenbezug: Max Mustermann aus Köln';
    const r = await s.c.post('/mod-api/log/export', { reason: geheim });
    expect(r.status).toBe(200);
    await discordFlush();
    const hit = sent.find((x) => x.payload.embeds[0].title === 'Protokoll exportiert');
    expect(hit).toBeTruthy();
    expect(hit!.url).toBe(DEFAULT);
    expect(JSON.stringify(sent)).not.toContain('Mustermann');
  });

  it('fehlgeschlagene Werkzeug-Anmeldung geht an den Kanal Sicherheit', async () => {
    const c = new Client(await testApp());
    await c.post('/mod-api/login', { login: 'gibt-es-nicht', password: 'falsch', totp: '000000' });
    await discordFlush();
    const hit = sent.find((x) => x.payload.embeds[0].title === 'Werkzeug: Anmeldung fehlgeschlagen');
    expect(hit!.url).toBe(SICHERHEIT);
    expect(JSON.stringify(hit!.payload)).not.toContain('gibt-es-nicht');
  });

  it('neue Meldung: Nummer und Grund, keine Inhalte und keine Beteiligten', async () => {
    const a = await member({ pos: KOELN, name: 'Adrian' });
    const b = await member({ pos: destination(KOELN, 0, 1), name: 'Bruno' });
    const first = await a.c.post('/api/conversations', { to: b.id, text: 'streng geheimer Nachrichtentext' });
    sent = [];
    const r = await b.c.post('/api/reports', {
      reason: 'belaestigung',
      targetId: a.id,
      context: 'gespraech',
      contextId: first.body.conversationId,
      items: [{ kind: 'message', id: first.body.messageId }],
    });
    expect(r.status).toBe(200);
    await discordFlush();
    expect(titles()).toContain(`Neue Meldung ${r.body.number}`);
    const all = JSON.stringify(sent);
    for (const s of ['streng geheim', 'Adrian', 'Bruno', a.id, b.id]) expect(all).not.toContain(s);
  });

  it('Erwähnungen sind abgeschaltet; @everyone wird entschärft', () => {
    const p = buildPayload('system', { title: 'Hallo @everyone' });
    expect(p.allowed_mentions.parse).toEqual([]);
    expect(p.embeds[0].title).not.toBe('Hallo @everyone');
  });

  it('bei 429 wird wiederholt; ein Fehler beim Versand stört die App nicht', async () => {
    let calls = 0;
    answer = () => (++calls === 1 ? { status: 429, retryAfterMs: 10 } : { status: 204 });
    discord('system', { title: 'Probe' });
    await discordFlush();
    expect(calls).toBe(2);
    answer = () => {
      throw new Error('Netz weg');
    };
    const m = await member();
    expect(m.id).toBeTruthy();
    const row = await one(`SELECT 1 AS ok`);
    expect(row!.ok).toBe(1);
  });
});
