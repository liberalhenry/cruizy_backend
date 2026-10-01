/**
 * Einrichtung: Welche Prüf- und Versandwege sind in der .env angebunden — und was übernimmt
 * stattdessen das Team im Werkzeug („Bestätigen“)? Der Server startet in jedem Fall; die Liste
 * steht beim Start im Protokoll und im Werkzeug unter „Einrichtung“.
 */
import { env } from './config/env.js';
import { p } from './config/params.js';
import { hashProviderConfigured } from './providers/checks.js';

export type SetupState = 'ok' | 'team' | 'aus' | 'warnung';

export interface SetupItem {
  key: string;
  label: string;
  state: SetupState;
  /** was gilt — in einem Satz */
  detail: string;
  /** was in die .env gehört, damit es ohne das Team läuft */
  env?: string;
}

export function setupStatus(): SetupItem[] {
  const e = env();
  const tg = e.TELEGRAM_MODE !== 'log' && !!e.TELEGRAM_BOT_TOKEN && !!e.TELEGRAM_BOT_NAME;
  const out: SetupItem[] = [
    e.SMTP_URL
      ? { key: 'mail', label: 'E-Mail-Versand', state: 'ok', detail: 'Codes und Hinweise gehen per E-Mail hinaus.' }
      : {
          key: 'mail',
          label: 'E-Mail-Versand',
          state: 'team',
          detail: 'Kein SMTP: E-Mail-Adressen bestätigt das Team. Passwort-Zurücksetzen per E-Mail geht nur über den Support.',
          env: 'SMTP_URL, MAIL_FROM',
        },
    tg
      ? { key: 'telegram', label: 'Telegram-Bot', state: 'ok', detail: 'Codes an Mobilnummern gehen über den Bot.' }
      : {
          key: 'telegram',
          label: 'Telegram-Bot',
          state: 'team',
          detail: 'Kein Bot: Mobilnummern und neue Geräte bestätigt das Team. Passwort-Zurücksetzen per Nummer geht nur über den Support.',
          env: 'TELEGRAM_MODE, TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_NAME',
        },
    {
      key: 'age1',
      label: 'Altersprüfung (Ausweis)',
      state: 'ok',
      detail: 'Der Server liest das Geburtsdatum vom Ausweisbild; ist er unsicher, entscheidet das Team.',
    },
    {
      key: 'age2',
      label: 'Stufe 2 und Fotoprüfung',
      state: 'team',
      detail: 'Kein Prüfpartner angebunden: Ausweis und Selfie bzw. Selfie mit Geste prüft das Team.',
    },
    e.DATE_FACE_PROVIDER === 'http' && e.DATE_FACE_URL
      ? { key: 'date_face', label: 'Cruizy Date: Gesicht', state: 'ok', detail: 'Selfie und erstes Foto gleicht der Anbieter ab.' }
      : {
          key: 'date_face',
          label: 'Cruizy Date: Gesicht',
          state: 'team',
          detail: 'Kein Anbieter: Selfie und erstes Date-Foto vergleicht das Team.',
          env: 'DATE_FACE_PROVIDER=http, DATE_FACE_URL',
        },
    hashProviderConfigured() && p('P-HASH-AKTIV')
      ? { key: 'hash', label: 'Hash-Abgleich', state: 'ok', detail: 'Bilder werden mit bekannten Missbrauchsdarstellungen abgeglichen.' }
      : {
          key: 'hash',
          label: 'Hash-Abgleich',
          state: 'team',
          detail: hashProviderConfigured()
            ? 'Angebunden, aber ausgeschaltet (P-HASH-AKTIV): Jedes Profilbild prüft das Team.'
            : 'Kein Abgleichdienst: Jedes Profilbild prüft das Team, bevor es sichtbar wird.',
          env: 'HASH_PROVIDER=http, HASH_URL',
        },
    e.CLASSIFIER === 'http' && e.CLASSIFIER_URL
      ? { key: 'classifier', label: 'Bild-Klassifikator', state: 'ok', detail: 'Eindeutige Bilder entscheidet der Klassifikator, der Rest geht an das Team.' }
      : { key: 'classifier', label: 'Bild-Klassifikator', state: 'team', detail: 'Kein Klassifikator: Jedes Profilbild prüft das Team.', env: 'CLASSIFIER=http, CLASSIFIER_URL' },
  ];
  if (e.TELEGRAM_MODE === 'webhook' && e.TELEGRAM_WEBHOOK_SECRET.length < 16) {
    out.push({ key: 'telegram_secret', label: 'Telegram-Webhook', state: 'warnung', detail: 'TELEGRAM_MODE=webhook braucht TELEGRAM_WEBHOOK_SECRET (mindestens 16 Zeichen).' });
  }
  if (!e.COOKIE_SECURE) out.push({ key: 'cookie', label: 'Cookies', state: 'warnung', detail: 'Cookies ohne Secure-Kennzeichen (COOKIE_SECURE=0).' });
  if (!e.APP_URL.startsWith('https://')) out.push({ key: 'app_url', label: 'App-Adresse', state: 'warnung', detail: 'APP_URL ist keine https-Adresse.' });
  if (!e.MOD_URL.startsWith('https://')) out.push({ key: 'mod_url', label: 'Werkzeug-Adresse', state: 'warnung', detail: 'MOD_URL ist keine https-Adresse.' });
  if (e.APP_URL === e.MOD_URL) out.push({ key: 'urls', label: 'Adressen', state: 'warnung', detail: 'Moderationswerkzeug und App teilen sich eine Adresse (M00).' });
  return out;
}

/** Kurzfassung für das Protokoll beim Start */
export function startupNotes(): string[] {
  return setupStatus()
    .filter((x) => x.state !== 'ok')
    .map((x) => `${x.label}: ${x.detail}`);
}
