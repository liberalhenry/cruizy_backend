/**
 * Startprüfung. Im Echtbetrieb (OPERATION_MODE=live) startet der Server nur,
 * wenn nichts mehr auf Attrappen läuft und der Hash-Abgleich angebunden ist
 * (AK-M02-11). Im Testbetrieb werden dieselben Punkte als Hinweis ausgegeben.
 */
import { env } from './config/env.js';
import { p } from './config/params.js';
import { hashProviderConfigured } from './providers/checks.js';

export function startupProblems(): string[] {
  const e = env();
  const out: string[] = [];
  if (e.AGE_PROVIDER === 'mock') out.push('Altersprüfung läuft über die Attrappe (AGE_PROVIDER=mock) — kein Prüfpartner angebunden.');
  if (!e.SMTP_URL) out.push('Kein Mailversand eingerichtet (SMTP_URL leer) — Mails landen nur im Protokoll.');
  if (e.SMS_PROVIDER === 'log') out.push('Kein SMS-Versand eingerichtet (SMS_PROVIDER=log).');
  if (e.CLASSIFIER === 'mock-allow') out.push('Klassifikator-Attrappe gibt alles frei (CLASSIFIER=mock-allow).');
  if (!hashProviderConfigured()) out.push('Kein Hash-Abgleich angebunden (HASH_PROVIDER).');
  if (!p('P-HASH-AKTIV')) out.push('Hash-Abgleich ist ausgeschaltet (P-HASH-AKTIV) — Betrieb nur mit erfundenen Daten (AK-M02-11).');
  if (!e.COOKIE_SECURE) out.push('Cookies ohne Secure-Kennzeichen (COOKIE_SECURE=0).');
  if (!e.APP_URL.startsWith('https://')) out.push('APP_URL ist keine https-Adresse.');
  if (!e.MOD_URL.startsWith('https://')) out.push('MOD_URL ist keine https-Adresse.');
  if (e.APP_URL === e.MOD_URL) out.push('Moderationswerkzeug und App teilen sich eine Adresse (M00).');
  return out;
}

export function testModeProblems(): string[] {
  const e = env();
  const out: string[] = [];
  if (e.OPERATION_MODE === 'test' && !e.TEST_INVITE_CODE) out.push('TEST_INVITE_CODE ist leer — im Testbetrieb kann sich dann niemand registrieren.');
  return out;
}
