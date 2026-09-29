/**
 * SMS-Versand (Z-10, F55). Neutraler Absender, ohne Produktnamen und ohne
 * Anlass (FV-95). Nur für die vier Anlässe aus AK-Z10-04 und die Check-in-
 * Durchreichung — nie für Werbung.
 */
import { env } from '../config/env.js';

export type SmsReason = 'anlegen' | 'neues_geraet' | 'wiederherstellung' | 'art34' | 'checkin';

export interface Sms {
  to: string;
  text: string;
  reason: SmsReason;
}

export const sentSms: Sms[] = [];

export async function sendSms(sms: Sms): Promise<void> {
  const e = env();
  if (e.SMS_PROVIDER === 'log') {
    if (e.OPERATION_MODE === 'live') throw new Error('SMS_PROVIDER=log ist im Echtbetrieb nicht zulässig');
    sentSms.push(sms);
    if (sentSms.length > 200) sentSms.shift();
    if (e.NODE_ENV !== 'test') console.log(`[SMS an ${sms.to}] ${sms.text}`);
    return;
  }
  const headers = { 'content-type': 'application/json', ...JSON.parse(e.SMS_HTTP_HEADERS || '{}') };
  const fill = (s: string) =>
    s.replaceAll('{to}', jsonEscape(sms.to)).replaceAll('{text}', jsonEscape(sms.text)).replaceAll('{sender}', jsonEscape(e.SMS_SENDER));
  const body = fill(e.SMS_HTTP_BODY);
  const res = await fetch(e.SMS_HTTP_URL, { method: 'POST', headers, body, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`SMS-Versand fehlgeschlagen (${res.status})`);
}

function jsonEscape(s: string) {
  return JSON.stringify(s).slice(1, -1);
}
