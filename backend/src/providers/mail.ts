/**
 * E-Mail-Versand über SMTP bei einem Dienst mit Sitz in der EU (Q-08, Nr. 63).
 * Betreff und Vorschauzeile nennen weder Produktnamen noch Zweck (AK-F02-06).
 * Ohne SMTP_URL landen E-Mails im Protokoll — nur im Testbetrieb zulässig.
 */
import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env.js';

export interface Mail {
  to: string;
  subject: string;
  preheader?: string;
  text: string;
}

let transport: Transporter | null = null;
export const sentMails: Mail[] = []; // für Tests und die Testbetriebsanzeige

export async function sendMail(mail: Mail): Promise<void> {
  const e = env();
  if (!e.SMTP_URL) {
    if (e.OPERATION_MODE === 'live') throw new Error('SMTP_URL fehlt — im Echtbetrieb Pflicht');
    sentMails.push(mail);
    if (sentMails.length > 200) sentMails.shift();
    if (e.NODE_ENV !== 'test') console.log(`[Mail an ${mail.to}] ${mail.subject}\n${mail.text}`);
    return;
  }
  transport ??= nodemailer.createTransport(e.SMTP_URL);
  const html = `<!doctype html><html><body style="font-family:sans-serif">${
    mail.preheader
      ? `<div style="display:none;max-height:0;overflow:hidden">${escapeHtml(mail.preheader)}</div>`
      : ''
  }<p>${escapeHtml(mail.text).replace(/\n/g, '<br>')}</p></body></html>`;
  await transport.sendMail({ from: e.MAIL_FROM, to: mail.to, subject: mail.subject, text: mail.text, html });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
