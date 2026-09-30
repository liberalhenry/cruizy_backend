/**
 * Issue #32: Telegram-Bot statt SMS — Codes an Mobilnummern, Verbindung nur mit der eigenen Nummer,
 * wartende Nachrichten, Webhook mit Geheimnis, Trennen. Issue #35: Konto per Einmal-Link verbinden.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { resetEnvCache } from '../src/config/env.js';
import { one, q } from '../src/db/pool.js';
import { blindIndex } from '../src/lib/crypto.js';
import { resetRateLimits } from '../src/lib/rate.js';
import { sentTelegram } from '../src/providers/telegram.js';
import { accountChat, handleUpdate } from '../src/services/telegram.js';
import { Client, member, testApp } from './helpers.js';

let updateId = 1000;
const contact = (chat: number, from: number, phone: string, userId: number = from) => ({
  update_id: updateId++,
  message: { chat: { id: chat, type: 'private' }, from: { id: from }, contact: { phone_number: phone, user_id: userId } },
});
const text = (chat: number, body: string) => ({ update_id: updateId++, message: { chat: { id: chat, type: 'private' }, from: { id: chat }, text: body } });
const lastTo = (chat: number) => [...sentTelegram].reverse().find((m) => m.chatId === String(chat));
const codeIn = (s: string | undefined) => /\b(\d{6})\b/.exec(s ?? '')?.[1];

afterEach(() => {
  delete process.env.TELEGRAM_MODE;
  delete process.env.TELEGRAM_WEBHOOK_SECRET;
  delete process.env.TELEGRAM_BOT_NAME;
  resetEnvCache();
});

describe('Telegram statt SMS (Issue #32)', () => {
  it('Code an eine noch nicht verbundene Nummer wartet — nur die eigene Nummer verbindet', async () => {
    const m = await member({ name: 'Nummer' });
    const phone = '+4915112345671';
    expect((await m.c.post('/api/auth/add/phone', { phone })).status).toBe(200);
    const waiting = await one(`SELECT count(*)::int AS n FROM telegram_outbox WHERE phone_hash = $1`, [blindIndex('phone', phone)]);
    expect(waiting!.n).toBe(1);

    // /start zeigt den Knopf „Nummer teilen“
    await handleUpdate(text(501, '/start'));
    expect(lastTo(501)).toMatchObject({ keyboard: 'kontakt' });
    // fremder Kontakt (user_id ≠ Absender) zählt nicht — der Code bleibt beim Server
    await handleUpdate(contact(502, 502, phone, 999));
    expect(codeIn(lastTo(502)?.text)).toBeUndefined();
    // eigene Nummer (ohne „+“, wie Telegram sie schickt) → verbunden, wartender Code kommt sofort
    await handleUpdate(contact(501, 501, phone.slice(1)));
    const code = codeIn(lastTo(501)?.text);
    expect(code).toMatch(/^\d{6}$/);
    expect((await one(`SELECT count(*)::int AS n FROM telegram_outbox WHERE phone_hash = $1`, [blindIndex('phone', phone)]))!.n).toBe(0);
    expect((await m.c.post('/api/auth/add/confirm', { kind: 'phone', code })).status).toBe(200);

    // neues Gerät: Code geht direkt an den verbundenen Chat
    const fresh = new Client(await testApp());
    resetRateLimits();
    await q(`DELETE FROM send_log`);
    const login = await fresh.post('/api/auth/login', { identifier: '0151 12345671', password: m.password });
    expect(login.body.next).toBe('geraet');
    const deviceCode = codeIn(lastTo(501)?.text);
    expect((await fresh.post('/api/auth/device-code', { token: login.body.token, code: deviceCode })).status).toBe(200);

    // /stop trennt — danach wartet ein neuer Code wieder
    await handleUpdate(text(501, '/stop'));
    expect(await one(`SELECT 1 FROM telegram_chats WHERE phone_hash = $1`, [blindIndex('phone', phone)])).toBeNull();
    await q(`DELETE FROM send_log`);
    await new Client(await testApp()).post('/api/auth/reset/request', { identifier: phone });
    expect((await one(`SELECT count(*)::int AS n FROM telegram_outbox WHERE phone_hash = $1`, [blindIndex('phone', phone)]))!.n).toBe(1);
  });

  it('Webhook nur mit Geheimnis und nur im Webhook-Betrieb', async () => {
    const app = await testApp();
    const post = (secret?: string) =>
      app.inject({
        method: 'POST',
        url: '/api/telegram/webhook',
        payload: text(601, '/start'),
        headers: secret ? { 'x-telegram-bot-api-secret-token': secret } : {},
      });
    expect((await post('x'.repeat(20))).statusCode).toBe(404);
    process.env.TELEGRAM_MODE = 'webhook';
    process.env.TELEGRAM_WEBHOOK_SECRET = 'geheimnis-fuer-den-webhook';
    resetEnvCache();
    expect((await post()).statusCode).toBe(404);
    expect((await post('falsches-geheimnis-123')).statusCode).toBe(404);
    const before = sentTelegram.length;
    // kein eigener Kopf nötig — Telegram schickt ihn nicht
    expect((await post('geheimnis-fuer-den-webhook')).statusCode).toBe(200);
    expect(sentTelegram.length).toBe(before + 1);
  });

  it('Konto per Einmal-Link verbinden und trennen (Issue #35)', async () => {
    const m = await member({ name: 'Verbinder' });
    expect((await m.c.post('/api/telegram/link')).body.code).toBe('telegram_aus');
    process.env.TELEGRAM_BOT_NAME = 'hinweis_bot';
    resetEnvCache();
    const r = await m.c.post('/api/telegram/link');
    expect(r.body.url).toMatch(/^https:\/\/t\.me\/hinweis_bot\?start=k[\w-]+$/);
    const start = new URL(r.body.url).searchParams.get('start')!;
    expect(start.length).toBeLessThanOrEqual(64);
    await handleUpdate(text(701, `/start ${start}`));
    expect(await accountChat(m.id)).toBe('701');
    expect((await m.c.get('/api/telegram')).body).toMatchObject({ available: true, linked: true });
    // der Link gilt nur einmal
    await handleUpdate(text(702, `/start ${start}`));
    expect(await accountChat(m.id)).toBe('701');
    expect((await m.c.del('/api/telegram/link')).status).toBe(200);
    expect(await accountChat(m.id)).toBeNull();
  });
});
