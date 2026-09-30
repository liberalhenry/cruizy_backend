/**
 * Issue #35: Mitteilungen auf Wunsch zusätzlich per E-Mail oder Telegram.
 *
 *  * Nur, was die Person einschaltet — Voreinstellung aus.
 *  * Inhalt nur, wenn sie es ausdrücklich will; sonst ein Hinweis ohne Inhalt mit Link in die App.
 *  * Sicherheitsmitteilungen (Sperre, Entscheidungen, Wiederherstellung, Check-in …) gehen nie mit Inhalt
 *    hinaus — sie stehen nur in der App (ST-KON-29).
 *  * Betreff und Absender neutral, ohne Produktnamen (AK-F02-06).
 */
import { env } from '../config/env.js';
import { one } from '../db/pool.js';
import { decStr } from '../lib/crypto.js';
import { t } from '../lib/texts.js';
import { sendMail } from '../providers/mail.js';
import { sendTelegram } from '../providers/telegram.js';
import { accountChat } from './telegram.js';

/** Arten, deren Inhalt nie per E-Mail oder Telegram hinausgeht. */
export const ONLY_IN_APP = new Set([
  'sperre',
  'entscheidung_betroffen',
  'meldung_entscheidung',
  'widerspruch',
  'wiederherstellung',
  'sicherheit',
  'checkin',
  'alterspruefung',
  'hilfe_freigabe',
]);

const pending = new Set<Promise<unknown>>();

/** Angestoßene Arbeit einer Mitteilung (Push, Weiterleitung) merken — wirft nie. */
export function track(job: Promise<unknown>) {
  const safe = job.catch(() => {});
  pending.add(safe);
  void safe.finally(() => pending.delete(safe));
}

/** Nur für Tests: warten, bis alle angestoßenen Push-Mitteilungen und Weiterleitungen fertig sind. */
export async function flushForwards() {
  while (pending.size) await Promise.allSettled([...pending]);
}

/** Wird von createNotice angestoßen — wartet nicht und wirft nie. */
export function forwardNotice(accountId: string, n: { kind: string; title: string; body: string; target: string | null }) {
  track(deliver(accountId, n));
}

async function deliver(accountId: string, n: { kind: string; title: string; body: string; target: string | null }) {
  const pr = await one(
    `SELECT pr.notify_email, pr.notify_telegram, pr.notify_content, a.email_enc, a.email_verified_at
       FROM profiles pr JOIN accounts a ON a.id = pr.account_id WHERE pr.account_id = $1`,
    [accountId],
  );
  if (!pr || (!pr.notify_email && !pr.notify_telegram)) return;
  const link = `${env().APP_URL}${n.target ?? '/ich/mitteilungen'}`;
  const withContent = pr.notify_content && !ONLY_IN_APP.has(n.kind);
  // Markierungen wie „[Bereich]“ sind nur für die Darstellung in der App gedacht
  const body = n.body.replace(/\s*\[[^\]]+\]/g, '').trim();

  if (pr.notify_email && pr.email_verified_at) {
    const to = decStr('pii', pr.email_enc, 'email');
    if (to) {
      await sendMail({
        to,
        subject: t('UI-NF-MAIL-BETREFF'),
        preheader: t('UI-NF-MAIL-VORSCHAU'),
        text: withContent ? `${n.title}\n\n${body}\n\n${link}` : `${t('UI-NF-OHNE-INHALT')}\n\n${link}`,
        design: {
          heading: withContent ? n.title : t('UI-NF-MAIL-BETREFF'),
          action: { label: t('UI-NF-IN-DER-APP'), url: link },
        },
      }).catch(() => {});
    }
  }
  if (pr.notify_telegram) {
    const chat = await accountChat(accountId);
    if (chat) {
      await sendTelegram({ chatId: chat, text: withContent ? `${n.title}\n\n${body}\n\n${link}` : `${t('UI-NF-OHNE-INHALT')}\n${link}` }).catch(() => {});
    }
  }
}
