/**
 * HTML-Gestaltung aller E-Mails im Corporate Design von Cruizy (Issue #9).
 * Leitfaden: shared/brand/README.md.
 *
 * Zwei Fassungen:
 *  * „marke“   — Kopf mit Logo (als eingebettetes Bild, cid:), Akzentfarbe, Fußzeile mit Namen.
 *  * „neutral“ — dieselbe Gestaltung ohne Logo und ohne Namen. Pflicht für Mails an Dritte
 *                (Check-in an Vertrauenspersonen, AK-F55-15) und überall, wenn MAIL_BRANDING=dezent.
 *
 * Diskretion (AK-F02-06) bleibt in beiden Fassungen gewahrt: Betreff und Vorschauzeile nennen
 * weder Produktnamen noch Anlass. Damit das Postfach keinen Text aus dem Kopf als Vorschau zeigt,
 * steht vor allem anderen eine versteckte Vorschauzeile mit Füllzeichen; das Logo trägt kein alt.
 *
 * Aufbau mit Tabellen und Inline-Stilen — so sieht es auch in Outlook und Gmail aus wie gedacht.
 * Keine externen Bilder, keine Schriften Dritter, keine Zählpixel.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';

export interface MailDesign {
  /** Überschrift im Inhalt */
  heading?: string;
  /** hervorgehobener Code (Bestätigungscode) */
  code?: string;
  /** Hauptknopf */
  action?: { label: string; url: string };
  /** „neutral“ erzwingt die Fassung ohne Logo und Namen */
  variant?: 'marke' | 'neutral';
  /** Mails an das Team (Wochenbericht) tragen immer die Marke */
  audience?: 'nutzer' | 'team';
}

export interface RenderInput {
  subject: string;
  preheader?: string;
  text: string;
  design?: MailDesign;
}

export interface Rendered {
  html: string;
  variant: 'marke' | 'neutral';
  attachments: { filename: string; content: Buffer; cid: string; contentType: string; contentDisposition: 'inline' }[];
}

/** Farben und Maße des Corporate Designs (shared/brand/README.md). */
export const BRAND = {
  grund: '#11141a',
  flaeche: '#191d25',
  linie: '#2e3441',
  text: '#e8ecf2',
  leise: '#9aa3b2',
  akzent: '#5aa9ff',
  akzentDunkel: '#2f6fc0',
  papier: '#f3f5f8',
  karte: '#ffffff',
  tinte: '#1b2029',
  tinteLeise: '#5b6576',
  schrift: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
} as const;

export const LOGO_CID = 'logo@marke';

let logo: Buffer | null | undefined;
function logoPng(): Buffer | null {
  if (logo !== undefined) return logo;
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    process.env.BRAND_DIR,
    process.env.TEXTS_DIR && resolve(process.env.TEXTS_DIR, '../brand'),
    resolve(here, '../../../shared/brand'),
    resolve(here, '../../../../shared/brand'),
    resolve(process.cwd(), '../shared/brand'),
  ].filter(Boolean) as string[];
  for (const c of candidates) {
    const f = join(c, 'cruizy-logo-hell-mail.png');
    if (existsSync(f)) return (logo = readFileSync(f));
  }
  return (logo = null);
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

const URL_RE = /https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)]/g;

/** Absatz: Zeilenumbrüche, Adressen als Verweis — die Adresse des Knopfs heißt wie der Knopf. */
function paragraph(p: string, action?: MailDesign['action']): string {
  const parts: string[] = [];
  let last = 0;
  for (const m of p.matchAll(URL_RE)) {
    parts.push(escapeHtml(p.slice(last, m.index)));
    const url = m[0];
    const label = action && url === action.url ? action.label : url;
    const wrap = label === url ? ';word-break:break-all' : '';
    parts.push(`<a href="${escapeHtml(url)}" style="color:${BRAND.akzentDunkel};text-decoration:underline${wrap}">${escapeHtml(label)}</a>`);
    last = m.index! + url.length;
  }
  parts.push(escapeHtml(p.slice(last)));
  return parts.join('').replace(/\n/g, '<br>');
}

function button(a: NonNullable<MailDesign['action']>) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px">
<tr><td style="border-radius:12px;background:${BRAND.akzentDunkel}" bgcolor="${BRAND.akzentDunkel}">
<a href="${escapeHtml(a.url)}" style="display:inline-block;padding:14px 26px;font-family:${BRAND.schrift};font-size:16px;font-weight:600;line-height:20px;color:#ffffff;text-decoration:none;border-radius:12px">${escapeHtml(a.label)}</a>
</td></tr></table>`;
}

function codeBox(code: string) {
  const spaced = code.split('').join('&#8202;');
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 20px">
<tr><td class="code" style="background:${BRAND.papier};border:1px solid #dfe4ec;border-radius:14px;padding:16px 24px;font-family:${BRAND.mono};font-size:32px;font-weight:700;letter-spacing:6px;color:${BRAND.tinte}">${spaced}</td></tr></table>`;
}

export function mailVariant(design?: MailDesign): 'marke' | 'neutral' {
  if (design?.variant === 'neutral') return 'neutral';
  if (design?.audience === 'team') return 'marke';
  return env().MAIL_BRANDING === 'dezent' ? 'neutral' : 'marke';
}

export function renderMail(m: RenderInput): Rendered {
  const d = m.design ?? {};
  const variant = mailVariant(d);
  const png = variant === 'marke' ? logoPng() : null;
  const branded = variant === 'marke';
  // Vorschauzeile immer setzen, dahinter Füllzeichen — sonst zeigt das Postfach Text aus dem Kopf
  const preheader = m.preheader ?? m.subject;
  const filler = '&#8199;&#65279;&#847;'.repeat(90);

  // Text ohne Knopf-Markierungen wie „[Das war ich nicht]“, wenn es einen echten Knopf gibt
  const text = d.action ? m.text.replace(/\s*\[[^\]]{2,60}\]/g, '') : m.text;
  const paras = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    // die Knopfadresse steht als Knopf da — als eigener Absatz wäre sie doppelt
    .filter((p) => !(d.action && p === d.action.url))
    .map((p) => `<p style="margin:0 0 16px;font-family:${BRAND.schrift};font-size:16px;line-height:24px;color:${BRAND.tinte}">${paragraph(p, d.action)}</p>`)
    .join('\n');

  const head = branded
    ? png
      ? `<img src="cid:${LOGO_CID}" width="${Math.round((png.readUInt32BE(16) / png.readUInt32BE(20)) * 36)}" height="36" alt="" style="display:block;border:0;outline:none;height:36px;width:auto">`
      : `<span style="font-family:${BRAND.schrift};font-size:24px;font-weight:700;letter-spacing:.5px;color:${BRAND.text}">cruizy</span>`
    : // neutrale Fassung: nur die Akzentlinie, kein Name, kein Bild
      `<span style="display:block;width:40px;height:4px;border-radius:2px;background:${BRAND.akzent};font-size:0;line-height:0">&nbsp;</span>`;

  const footer = branded
    ? `cruizy · Diese Nachricht wurde automatisch versendet.`
    : `Diese Nachricht wurde automatisch versendet.`;

  const html = `<!doctype html>
<html lang="de" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(m.subject)}</title>
<style>
  body{margin:0;padding:0;-webkit-text-size-adjust:100%}
  a{color:${BRAND.akzentDunkel}}
  @media (max-width:620px){ .wrap{width:100%!important} .pad{padding:24px 20px!important} }
  @media (prefers-color-scheme: dark){
    .bg{background:${BRAND.grund}!important} .card{background:${BRAND.flaeche}!important;border-color:${BRAND.linie}!important}
    .card p,.card h1{color:${BRAND.text}!important} .code{background:${BRAND.grund}!important;color:${BRAND.text}!important;border-color:${BRAND.linie}!important}
    .foot{color:${BRAND.leise}!important} .card a{color:${BRAND.akzent}!important}
  }
</style>
</head>
<body class="bg" style="margin:0;padding:0;background:${BRAND.papier}">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all">${escapeHtml(preheader)}${filler}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg" style="background:${BRAND.papier}">
<tr><td align="center" style="padding:32px 12px">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="wrap" style="width:600px;max-width:600px">
    <tr><td style="background:${BRAND.grund};border-radius:18px 18px 0 0;padding:22px 32px" bgcolor="${BRAND.grund}">${head}</td></tr>
    <tr><td class="card pad" style="background:${BRAND.karte};border:1px solid #e3e7ee;border-top:0;border-radius:0 0 18px 18px;padding:32px" bgcolor="${BRAND.karte}">
      ${d.heading ? `<h1 style="margin:0 0 16px;font-family:${BRAND.schrift};font-size:22px;line-height:28px;font-weight:700;color:${BRAND.tinte}">${escapeHtml(d.heading)}</h1>` : ''}
      ${d.code ? codeBox(d.code) : ''}
      ${paras}
      ${d.action ? button(d.action) : ''}
      ${d.action ? `<p style="margin:0;font-family:${BRAND.schrift};font-size:13px;line-height:19px;color:${BRAND.tinteLeise}">Funktioniert der Knopf nicht? Diese Adresse in den Browser kopieren:<br><span style="word-break:break-all">${escapeHtml(d.action.url)}</span></p>` : ''}
    </td></tr>
    <tr><td class="foot" style="padding:18px 32px;font-family:${BRAND.schrift};font-size:12px;line-height:18px;color:${BRAND.tinteLeise};text-align:center">${footer}</td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;

  return {
    html,
    variant,
    attachments: png ? [{ filename: 'logo.png', content: png, cid: LOGO_CID, contentType: 'image/png', contentDisposition: 'inline' }] : [],
  };
}
