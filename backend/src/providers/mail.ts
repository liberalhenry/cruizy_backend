/**
 * E-Mail-Versand über SMTP bei einem Dienst mit Sitz in der EU (Q-08, Nr. 63).
 * Betreff und Vorschauzeile nennen weder Produktnamen noch Zweck (AK-F02-06).
 * Ohne SMTP_URL landen E-Mails im Protokoll — nur im Testbetrieb zulässig.
 * Gestaltung (HTML, Logo, Farben): mail-design.ts.
 */
import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env.js';
import { renderMail, type MailDesign } from './mail-design.js';

export interface Mail {
  to: string;
  subject: string;
  preheader?: string;
  text: string;
  /** Gestaltung der HTML-Fassung (Issue #9) — Überschrift, Code, Knopf, Fassung */
  design?: MailDesign;
}

export interface SentMail extends Mail {
  html: string;
  variant: 'marke' | 'neutral';
}

let transport: Transporter | null = null;
export const sentMails: SentMail[] = []; // für Tests und die Testbetriebsanzeige

/** Jede Mail geht als HTML im Corporate Design und zusätzlich als reiner Text (multipart/alternative). */
export async function sendMail(mail: Mail): Promise<void> {
  const e = env();
  const r = renderMail(mail);
  if (!e.SMTP_URL) {
    if (e.OPERATION_MODE === 'live') throw new Error('SMTP_URL fehlt — im Echtbetrieb Pflicht');
    sentMails.push({ ...mail, html: r.html, variant: r.variant });
    if (sentMails.length > 200) sentMails.shift();
    if (e.NODE_ENV !== 'test') console.log(`[Mail an ${mail.to}] ${mail.subject}\n${mail.text}`);
    return;
  }
  transport ??= nodemailer.createTransport(e.SMTP_URL);
  await transport.sendMail({ from: e.MAIL_FROM, to: mail.to, subject: mail.subject, text: mail.text, html: r.html, attachments: r.attachments });
}
