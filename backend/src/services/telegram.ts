/**
 * Telegram statt SMS (Issue #32) und Mitteilungen per Telegram (Issue #35).
 *
 *  * Nummer verbinden: Die Person öffnet den Bot und tippt „Nummer teilen“. Telegram schickt ihren
 *    Kontakt; wir übernehmen ihn nur, wenn es ihr eigener ist (contact.user_id = from.id). So kann
 *    niemand fremde Codes empfangen, nur weil er eine fremde Nummer eintippt.
 *  * Codes an eine noch nicht verbundene Nummer warten verschlüsselt (höchstens so lange, wie der Code
 *    gilt) und gehen hinaus, sobald die Nummer verbunden wird.
 *  * Konto verbinden (#35): ein Einmal-Link aus der App (t.me/<bot>?start=<token>) — nur wer angemeldet
 *    ist, bekommt ihn. Dann gehen Mitteilungen dieses Kontos in diesen Chat.
 *  * /stop trennt alles. Gespeichert sind nur verschlüsselte Chat-Kennung und Blindindizes.
 */
import { env } from '../config/env.js';
import { p } from '../config/params.js';
import { one, q } from '../db/pool.js';
import { blindIndex, decStr, encStr, normalizePhone, randomToken, tokenHash } from '../lib/crypto.js';
import { t } from '../lib/texts.js';
import { sendTelegram, telegramActive, tgCall } from '../providers/telegram.js';

export type PhoneReason = 'anlegen' | 'neues_geraet' | 'wiederherstellung' | 'art34' | 'checkin';

/** Wie lange eine Nachricht auf die Verbindung der Nummer wartet (Sekunden). */
function waitSeconds(reason: PhoneReason): number {
  // Codes gelten nur P-CODE-GUELTIG; Nachrichten aus dem Check-in und Art. 34 einen Tag
  return reason === 'checkin' || reason === 'art34' ? 86400 : p('P-CODE-GUELTIG');
}

const chatHash = (chatId: string) => blindIndex('telegram', chatId);
const readChat = (enc: Buffer) => decStr('pii', enc, 'telegram')!;

/** Adresse des Bots, optional mit Startwert. null, solange kein Bot eingerichtet ist. */
export function botLink(start?: string): string | null {
  const name = env().TELEGRAM_BOT_NAME;
  if (!name) return null;
  return `https://t.me/${name}${start ? `?start=${start}` : ''}`;
}

export async function phoneLinked(phone: string): Promise<boolean> {
  return !!(await one(`SELECT 1 FROM telegram_chats WHERE phone_hash = $1`, [blindIndex('phone', phone)]));
}

/**
 * Nachricht an eine Mobilnummer (ersetzt sendSms). „wartet“: die Nummer ist noch nicht mit dem Bot
 * verbunden — die Nachricht geht hinaus, sobald sie verbunden wird.
 */
export async function sendToPhone(phone: string, text: string, reason: PhoneReason): Promise<'gesendet' | 'wartet'> {
  const h = blindIndex('phone', phone);
  const chat = await one(`SELECT chat_enc FROM telegram_chats WHERE phone_hash = $1`, [h]);
  if (chat) {
    await sendTelegram({ chatId: readChat(chat.chat_enc), text });
    return 'gesendet';
  }
  // ein neuer Code ersetzt den wartenden alten desselben Anlasses
  if (reason !== 'checkin') await q(`DELETE FROM telegram_outbox WHERE phone_hash = $1 AND reason = $2`, [h, reason]);
  await q(`INSERT INTO telegram_outbox (phone_hash, reason, text_enc, expires_at) VALUES ($1, $2, $3, now() + make_interval(secs => $4))`, [
    h,
    reason,
    encStr('pii', text, 'telegram-outbox'),
    waitSeconds(reason),
  ]);
  return 'wartet';
}

/** Issue #35: Chat, an den Mitteilungen dieses Kontos gehen — oder null. */
export async function accountChat(accountId: string): Promise<string | null> {
  const r = await one(`SELECT chat_enc FROM telegram_chats WHERE account_id = $1`, [accountId]);
  return r ? readChat(r.chat_enc) : null;
}

/** Issue #35: Einmal-Link zum Verbinden des Kontos mit dem Bot (gilt 30 Minuten). */
export async function accountLinkUrl(accountId: string): Promise<string | null> {
  if (!botLink()) return null;
  const token = randomToken(18); // 24 Zeichen base64url — Telegram erlaubt bis 64 Zeichen [A-Za-z0-9_-]
  await q(`DELETE FROM telegram_link_tokens WHERE account_id = $1`, [accountId]);
  await q(`INSERT INTO telegram_link_tokens (token_hash, account_id, expires_at) VALUES ($1, $2, now() + interval '30 minutes')`, [tokenHash(token), accountId]);
  return botLink(`k${token}`);
}

export async function unlinkAccount(accountId: string) {
  await q(`UPDATE profiles SET notify_telegram = false WHERE account_id = $1`, [accountId]);
  const r = await one(`UPDATE telegram_chats SET account_id = NULL WHERE account_id = $1 RETURNING chat_enc`, [accountId]);
  if (r) await sendTelegram({ chatId: readChat(r.chat_enc), text: t('UI-TG-KONTO-GETRENNT') }).catch(() => {});
  await q(`DELETE FROM telegram_chats WHERE account_id IS NULL AND phone_hash IS NULL`);
}

async function upsertChat(chatId: string, set: { phoneHash?: Buffer; accountId?: string }) {
  const ch = chatHash(chatId);
  if (set.phoneHash) await q(`UPDATE telegram_chats SET phone_hash = NULL WHERE phone_hash = $1 AND chat_hash <> $2`, [set.phoneHash, ch]);
  if (set.accountId) await q(`UPDATE telegram_chats SET account_id = NULL WHERE account_id = $1 AND chat_hash <> $2`, [set.accountId, ch]);
  await q(
    `INSERT INTO telegram_chats (chat_hash, chat_enc, phone_hash, account_id) VALUES ($1, $2, $3, $4)
     ON CONFLICT (chat_hash) DO UPDATE SET
       phone_hash = COALESCE(EXCLUDED.phone_hash, telegram_chats.phone_hash),
       account_id = COALESCE(EXCLUDED.account_id, telegram_chats.account_id),
       linked_at = now()`,
    [ch, encStr('pii', chatId, 'telegram'), set.phoneHash ?? null, set.accountId ?? null],
  );
}

async function flushOutbox(phoneHash: Buffer, chatId: string) {
  const rows = await q(`DELETE FROM telegram_outbox WHERE phone_hash = $1 RETURNING text_enc, expires_at, id`, [phoneHash]);
  for (const r of rows.sort((a, b) => Number(a.id) - Number(b.id))) {
    if (new Date(r.expires_at) < new Date()) continue;
    await sendTelegram({ chatId, text: decStr('pii', r.text_enc, 'telegram-outbox')! });
  }
}

/** Hintergrundauftrag: abgelaufene wartende Nachrichten und Links löschen. */
export async function purgeTelegram() {
  await q(`DELETE FROM telegram_outbox WHERE expires_at < now()`);
  await q(`DELETE FROM telegram_link_tokens WHERE expires_at < now()`);
}

// ───────────── Eingang: Nachrichten an den Bot ─────────────

export interface TgUpdate {
  update_id: number;
  message?: {
    chat?: { id: number | string; type?: string };
    from?: { id: number | string; is_bot?: boolean };
    text?: string;
    contact?: { phone_number: string; user_id?: number | string };
  };
}

const ask = (chatId: string, text: string) => sendTelegram({ chatId, text, keyboard: 'kontakt', contactLabel: t('UI-TG-NUMMER-TEILEN') });

export async function handleUpdate(u: TgUpdate): Promise<void> {
  const m = u.message;
  if (!m?.chat || !m.from || m.from.is_bot || (m.chat.type && m.chat.type !== 'private')) return;
  const chatId = String(m.chat.id);

  if (m.contact) {
    // nur die eigene Nummer — geteilte Kontakte anderer Personen zählen nicht
    if (m.contact.user_id === undefined || String(m.contact.user_id) !== String(m.from.id)) {
      await ask(chatId, t('UI-TG-NUR-EIGENE'));
      return;
    }
    const raw = m.contact.phone_number.trim();
    const phone = normalizePhone(raw.startsWith('+') ? raw : `+${raw}`);
    if (!phone) {
      await sendTelegram({ chatId, text: t('UI-TG-NUMMER-UNGUELTIG'), keyboard: 'entfernen' });
      return;
    }
    const ph = blindIndex('phone', phone);
    await upsertChat(chatId, { phoneHash: ph });
    await sendTelegram({ chatId, text: t('UI-TG-VERBUNDEN'), keyboard: 'entfernen' });
    await flushOutbox(ph, chatId);
    return;
  }

  const text = (m.text ?? '').trim();
  if (/^\/(stop|trennen)\b/i.test(text)) {
    const gone = await one(`DELETE FROM telegram_chats WHERE chat_hash = $1 RETURNING account_id`, [chatHash(chatId)]);
    if (gone?.account_id) await q(`UPDATE profiles SET notify_telegram = false WHERE account_id = $1`, [gone.account_id]);
    await sendTelegram({ chatId, text: t('UI-TG-GETRENNT'), keyboard: 'entfernen' });
    return;
  }
  if (/^\/start\b/i.test(text)) {
    const start = text.split(/\s+/)[1] ?? '';
    if (start.startsWith('k') && start.length > 10) {
      const row = await one(`DELETE FROM telegram_link_tokens WHERE token_hash = $1 AND expires_at > now() RETURNING account_id`, [tokenHash(start.slice(1))]);
      if (!row) {
        await sendTelegram({ chatId, text: t('UI-TG-LINK-ABGELAUFEN') });
        return;
      }
      await upsertChat(chatId, { accountId: row.account_id });
      // wer den Link aus den Einstellungen öffnet, will die Mitteilungen hier bekommen
      await q(`UPDATE profiles SET notify_telegram = true WHERE account_id = $1`, [row.account_id]);
      await sendTelegram({ chatId, text: t('UI-TG-KONTO-VERBUNDEN') });
      return;
    }
    await ask(chatId, t('UI-TG-WILLKOMMEN'));
    return;
  }
  await ask(chatId, t('UI-TG-HILFE'));
}

// ───────────── Abholen oder Webhook ─────────────

let polling = false;

/** Beim Serverstart: Webhook anmelden oder das Abholen starten. */
export async function startTelegram(log = console.log): Promise<void> {
  const e = env();
  if (!telegramActive()) return;
  if (e.TELEGRAM_MODE === 'webhook') {
    await tgCall('setWebhook', {
      url: `${e.APP_URL}/api/telegram/webhook`,
      secret_token: e.TELEGRAM_WEBHOOK_SECRET,
      allowed_updates: ['message'],
    }).then(
      () => log('Telegram: Webhook angemeldet'),
      (err) => console.error(`Telegram: Webhook nicht angemeldet — ${(err as Error).message}`),
    );
    return;
  }
  polling = true;
  void (async () => {
    await tgCall('deleteWebhook', {}).catch(() => {});
    let offset = Number((await one(`SELECT value FROM telegram_state WHERE key = 'offset'`).catch(() => null))?.value ?? 0);
    log('Telegram: Abholen gestartet');
    while (polling) {
      try {
        const updates = await tgCall<TgUpdate[]>('getUpdates', { offset, timeout: 25, allowed_updates: ['message'] }, 35_000);
        for (const up of updates) {
          offset = up.update_id + 1;
          await handleUpdate(up).catch((err) => console.error(`Telegram: Nachricht nicht verarbeitet — ${(err as Error).message}`));
        }
        if (updates.length) {
          await q(`INSERT INTO telegram_state (key, value) VALUES ('offset', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`, [String(offset)]);
        }
      } catch {
        if (polling) await new Promise((r) => setTimeout(r, 5000));
      }
    }
  })();
}

export function stopTelegram() {
  polling = false;
}
