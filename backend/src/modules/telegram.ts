/**
 * Telegram-Bot (Issues #32, #35): Eingang für Telegram (Webhook) und die Verbindung des eigenen Kontos
 * für Mitteilungen per Telegram.
 */
import type { FastifyInstance } from 'fastify';
import { env } from '../config/env.js';
import { requireMember } from '../lib/context.js';
import { safeEqual } from '../lib/crypto.js';
import { AppError, bad, tooMany } from '../lib/errors.js';
import { hit } from '../lib/rate.js';
import { accountChat, accountLinkUrl, botLink, handleUpdate, unlinkAccount, type TgUpdate } from '../services/telegram.js';

export default async function telegramRoutes(app: FastifyInstance) {
  /** Telegram liefert hierher, wenn TELEGRAM_MODE=webhook — nur mit dem vereinbarten Geheimnis. */
  app.post('/api/telegram/webhook', async (req) => {
    const e = env();
    const given = String(req.headers['x-telegram-bot-api-secret-token'] ?? '');
    if (e.TELEGRAM_MODE !== 'webhook' || e.TELEGRAM_WEBHOOK_SECRET.length < 16 || !safeEqual(Buffer.from(given), Buffer.from(e.TELEGRAM_WEBHOOK_SECRET))) {
      throw new AppError(404, 'UI-NICHT-VERFUEGBAR', {}, 'nicht_gefunden');
    }
    // Fehler bei einer einzelnen Nachricht dürfen Telegram nicht zum Wiederholen bringen
    await handleUpdate(req.body as TgUpdate).catch((err) => req.log.error({ err: { message: (err as Error).message } }, 'Telegram-Nachricht nicht verarbeitet'));
    return { ok: true };
  });

  /** Stand der Verbindung des eigenen Kontos (Issue #35). */
  app.get('/api/telegram', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    return { available: !!botLink(), bot: botLink(), linked: !!(await accountChat(a.id)) };
  });

  /** Einmal-Link „Mit Telegram verbinden“ — gilt 30 Minuten. */
  app.post('/api/telegram/link', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    if (!hit('telegram-link', a.id, 10, 3600_000)) throw tooMany();
    const url = await accountLinkUrl(a.id);
    if (!url) throw bad('UI-TG-NICHT-EINGERICHTET', {}, 'telegram_aus');
    return { url };
  });

  app.delete('/api/telegram/link', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    await unlinkAccount(a.id);
    return { ok: true };
  });
}
