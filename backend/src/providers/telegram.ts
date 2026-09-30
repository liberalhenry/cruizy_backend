/**
 * Telegram-Bot (Issue #32) — ersetzt den SMS-Versand.
 *
 * Ein Bot kann niemandem an eine Mobilnummer schreiben. Die Person öffnet den Bot deshalb einmal und
 * teilt dort ihre Nummer („Nummer teilen“); Telegram bestätigt, dass es ihre eigene ist. Ab dann gehen
 * Codes und — auf Wunsch — Mitteilungen dorthin (siehe services/telegram.ts).
 *
 *   log      = nichts verlassen den Server, Nachrichten stehen nur im Protokoll (nur Testbetrieb)
 *   polling  = der Server holt neue Nachrichten an den Bot selbst ab (kein offener Eingang nötig)
 *   webhook  = Telegram liefert an /api/telegram/webhook, gesichert mit TELEGRAM_WEBHOOK_SECRET
 *
 * Wie beim SMS-Versand: neutraler Wortlaut, ohne Produktnamen und ohne Anlass (FV-95).
 */
import { env } from '../config/env.js';

export interface TgMessage {
  chatId: string;
  text: string;
  /** kontakt = Knopf „Nummer teilen“ einblenden, entfernen = Tastatur wieder ausblenden */
  keyboard?: 'kontakt' | 'entfernen';
  /** Beschriftung des Knopfs „Nummer teilen“ */
  contactLabel?: string;
}

export const sentTelegram: TgMessage[] = [];

export function telegramActive(): boolean {
  const e = env();
  return e.TELEGRAM_MODE !== 'log' && !!e.TELEGRAM_BOT_TOKEN;
}

/** Aufruf der Bot-Schnittstelle. Der Token steht nie im Protokoll. */
export async function tgCall<T>(method: string, payload: object, timeoutMs = 10_000): Promise<T> {
  const e = env();
  const res = await fetch(`${e.TELEGRAM_API_URL}/bot${e.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const data = (await res.json().catch(() => null)) as { ok?: boolean; result?: T; description?: string } | null;
  if (!res.ok || !data?.ok) throw new Error(`Telegram ${method} fehlgeschlagen (${res.status}${data?.description ? `: ${data.description}` : ''})`);
  return data.result as T;
}

export async function sendTelegram(m: TgMessage): Promise<void> {
  const e = env();
  if (e.TELEGRAM_MODE === 'log' || !e.TELEGRAM_BOT_TOKEN) {
    if (e.OPERATION_MODE === 'live') throw new Error('Telegram-Bot ist nicht eingerichtet (TELEGRAM_MODE/TELEGRAM_BOT_TOKEN)');
    sentTelegram.push(m);
    if (sentTelegram.length > 200) sentTelegram.shift();
    if (e.NODE_ENV !== 'test') console.log(`[Telegram an ${m.chatId}] ${m.text}`);
    return;
  }
  const replyMarkup =
    m.keyboard === 'kontakt'
      ? { keyboard: [[{ text: m.contactLabel ?? '📱', request_contact: true }]], resize_keyboard: true, one_time_keyboard: true }
      : m.keyboard === 'entfernen'
        ? { remove_keyboard: true }
        : undefined;
  await tgCall('sendMessage', {
    chat_id: m.chatId,
    text: m.text,
    link_preview_options: { is_disabled: true },
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}
