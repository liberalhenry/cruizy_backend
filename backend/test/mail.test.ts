/** HTML-Mails im Corporate Design (Issue #9) — ohne die Diskretion aufzugeben. */
import { afterEach, describe, expect, it } from 'vitest';
import { resetEnvCache } from '../src/config/env.js';
import { renderMail } from '../src/providers/mail-design.js';
import { sentMails } from '../src/providers/mail.js';
import { t } from '../src/lib/texts.js';
import { Client, testApp } from './helpers.js';

afterEach(() => {
  delete process.env.MAIL_BRANDING;
  resetEnvCache();
});

/** sichtbarer Text vor dem Inhalt — das, was ein Postfach als Vorschau nimmt */
function previewText(html: string) {
  const body = html.slice(html.indexOf('<body'));
  return body.replace(/<[^>]+>/g, ' ').replace(/&[#\w]+;/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);
}

describe('HTML-Mails (Issue #9)', () => {
  it('Code-Mail der Registrierung: HTML mit Logo, Code hervorgehoben, Text bleibt', async () => {
    const c = new Client(await testApp());
    const email = `mail-${Date.now()}@example.invalid`;
    const r = await c.post('/api/auth/register', { method: 'email', email, password: 'ein-langes-testpasswort' });
    expect(r.status).toBe(200);
    const m = [...sentMails].reverse().find((x) => x.to === email)!;
    expect(m.variant).toBe('marke');
    expect(m.html).toMatch(/^<!doctype html>/);
    expect(m.html).toContain('cid:logo@marke');
    const code = /\b(\d{6})\b/.exec(m.text)![1];
    expect(m.html).toContain(code.split('').join('&#8202;'));
    // Betreff und Vorschauzeile ohne Produktnamen (AK-F02-06)
    expect(m.subject.toLowerCase()).not.toContain('cruizy');
    expect(previewText(m.html).toLowerCase()).not.toContain('cruizy');
  });

  it('das Logo hängt als eingebettetes Bild an — keine externen Bilder, keine Zählpixel', () => {
    const r = renderMail({ subject: 'Betreff', text: 'Hallo', design: { heading: 'Überschrift' } });
    expect(r.attachments).toHaveLength(1);
    expect(r.attachments[0]).toMatchObject({ cid: 'logo@marke', contentType: 'image/png' });
    expect(r.html).not.toMatch(/<img[^>]+src="https?:/);
    expect(r.html).toMatch(/<img[^>]+alt=""/);
  });

  it('Knopf und Verweise; Nutzereingaben werden maskiert', () => {
    const url = 'https://app.example.de/passwort?token=abc';
    const r = renderMail({ subject: 'x', text: `Link: ${url}\n\n<script>alert(1)</script>`, design: { action: { label: 'Neues Passwort', url } } });
    expect(r.html).toContain(`href="${url}"`);
    expect(r.html).toContain('>Neues Passwort</a>');
    expect(r.html).not.toContain('<script>alert(1)</script>');
    expect(r.html).toContain('&lt;script&gt;');
  });

  it('neutrale Fassung (Dritte, Check-in): kein Logo, kein Name', () => {
    const r = renderMail({ subject: t('UI-CHECKIN-MAIL-BETREFF'), text: 'Bitte melde dich bei mir.', design: { variant: 'neutral' } });
    expect(r.variant).toBe('neutral');
    expect(r.attachments).toHaveLength(0);
    expect(r.html.toLowerCase()).not.toContain('cruizy');
    expect(r.html).not.toContain('cid:');
  });

  it('MAIL_BRANDING=dezent: alle Nutzer-Mails neutral, Team-Mails behalten die Marke', () => {
    process.env.MAIL_BRANDING = 'dezent';
    resetEnvCache();
    expect(renderMail({ subject: 'x', text: 'y' }).variant).toBe('neutral');
    expect(renderMail({ subject: 'x', text: 'y', design: { audience: 'team' } }).variant).toBe('marke');
  });
});
