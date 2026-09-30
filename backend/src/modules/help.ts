/**
 * Hilfe und Kontakt (F75): vier Eingänge, zehn Kategorien, Fallnummer sofort,
 * „Antwort nur in der App“ voreingestellt für Angemeldete (FV-92), ohne Konto
 * vollständig bearbeitbar (AK-F75-02).
 *
 * Support-Portal (Issue #37): Angemeldete schreiben dem Team und lesen Antworten in der App — auf Wunsch
 * mit einem Hinweis per E-Mail (ohne Inhalt); antworten geht nur in der App. Bittet das Team um Einsicht
 * in Daten, entscheidet die Person hier (Freigabe befristet, widerrufbar).
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { p } from '../config/params.js';
import { one, q } from '../db/pool.js';
import { loadAccount, requireMember } from '../lib/context.js';
import { decStr, encStr } from '../lib/crypto.js';
import { bad, notFound, tooMany } from '../lib/errors.js';
import { putFile } from '../lib/files.js';
import { body, idParam, ipKey, params } from '../lib/http.js';
import { prepare } from '../lib/images.js';
import { nextNumber } from '../lib/numbers.js';
import { hit } from '../lib/rate.js';
import { t } from '../lib/texts.js';
import { sendMail } from '../providers/mail.js';
import { discord } from '../services/discord.js';
import { runHashCheck } from '../providers/checks.js';
import { readUpload } from './photos.js';
import { appVersion } from '../lib/version.js';
import { requestsFor, sealDiagnostics } from '../services/support.js';
import { answerSeconds, potForTeam, teamForCategory, ticketSubject } from '../services/postfach.js';

/** Kategorie → Eingang (kontaktservice-und-tickets.md, 2.3) */
export const CATEGORY_POT: Record<number, 'missbrauch' | 'hilfe' | 'datenschutz' | 'behoerden' | null> = {
  1: 'missbrauch',
  2: 'missbrauch',
  3: 'hilfe',
  4: 'hilfe',
  5: 'hilfe',
  6: 'datenschutz',
  7: null, // → Widerspruch (M50), kein Vorgang
  8: 'missbrauch',
  9: 'behoerden',
  10: 'hilfe',
};

/** Postfach: Antwort binnen P-TICKET-FRIST (24 h) — Kategorie 1 unverzüglich. */
export function deadlineSeconds(_pot: string, category: number): number {
  return answerSeconds(category);
}

export default async function helpRoutes(app: FastifyInstance) {
  app.post('/api/help/tickets', async (req) => {
    const acc = await loadAccount(req);
    const b = body(
      req,
      z.object({
        // ohne Anlass: allgemeiner Support (Kategorie 10), von dort wird weitergegeben
        category: z.number().int().min(1).max(10).default(10),
        text: z.string().min(1).max(p('P-TICKET-MAX')),
        replyWay: z.enum(['app', 'email']).default('app'),
        // Issue #37: Hinweis per E-Mail, wenn das Team antwortet — der Inhalt steht nur in der App
        notifyEmail: z.boolean().optional(),
        email: z.string().email().max(254).optional(),
        relatedRef: z.string().max(100).optional(),
      }),
    );
    if (!hit('ticket', acc?.id ?? ipKey(req), 10, 3600_000)) throw tooMany();
    // AK-F75-07: Kategorie 7 legt keinen Vorgang an, sondern führt zum Widerspruch
    if (!CATEGORY_POT[b.category]) return { redirect: 'widerspruch', textId: 'ST-HLF-23' };
    // Postfach: mit Anlass direkt ins zuständige Team, sonst allgemeiner Support
    const team = teamForCategory(b.category);
    const pot = potForTeam(team, b.category);
    const loggedIn = !!acc && acc.consented;
    // Issue #37: mit Konto steht die Antwort immer in der App; „per E-Mail“ heißt nur noch „Hinweis per E-Mail“
    const replyWay = loggedIn ? 'app' : 'email';
    const notifyEmail = loggedIn && (b.notifyEmail ?? b.replyWay === 'email');
    if (!loggedIn && !b.email) throw bad('ST-HLF-22', {}, 'email_noetig');
    const email = loggedIn ? null : (b.email ?? null);
    if (notifyEmail) {
      const r = await one(`SELECT email_verified_at FROM accounts WHERE id = $1`, [acc!.id]);
      if (!r?.email_verified_at) throw bad('UI-NF-EMAIL-FEHLT', {}, 'email_noetig');
    }
    const number = await nextNumber('H');
    const secs = deadlineSeconds(pot, b.category);
    const row = await one(
      `INSERT INTO tickets (number, category, pot, account_id, had_account, text_enc, reply_way, email_enc, related_ref, priority, deadline_at, notify_email, last_person_at, team, kind)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now() + make_interval(secs => $11), $12, now(), $13, 'anfrage') RETURNING id`,
      [
        number,
        b.category,
        pot,
        loggedIn ? acc!.id : null,
        loggedIn,
        encStr('tickets', b.text, 'ticket'),
        replyWay,
        email ? encStr('tickets', email, 'ticket') : null,
        b.relatedRef ?? null,
        b.category === 1,
        secs,
        notifyEmail,
        team,
      ],
    );
    if (!loggedIn && email) {
      // FV-92: Betreff nur die Fallnummer
      await sendMail({
        to: email,
        subject: t('ST-HLF-24', { fallnummer: number }),
        text: t('UI-MAIL-HILFE-EINGANG', { fallnummer: number }),
        design: { heading: t('UI-MAIL-KOPF-EINGANG') },
      });
    }
    discord('meldungen', {
      title: `Neue Anfrage ${number}`,
      level: b.category === 1 ? 'danger' : 'info',
      fields: [
        { name: 'Kategorie', value: String(b.category) },
        { name: 'Bereich', value: pot },
        { name: 'Konto', value: loggedIn ? 'ja' : 'nein' },
      ],
    });
    // AK-F75-01: Fallnummer sofort
    return { id: row!.id, number, datenschutz: pot === 'datenschutz' };
  });

  app.post('/api/help/tickets/:id/attachment', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true, allowSuspended: true });
    const { id } = params(req, idParam);
    const tk = await one(`SELECT id, attachment_file FROM tickets WHERE id = $1 AND account_id = $2`, [id, a.id]);
    if (!tk || tk.attachment_file) throw notFound();
    const { buffer } = await readUpload(req);
    const prepared = await prepare(buffer); // derselbe Prüfweg wie jedes Bild (M85.04)
    const h = await runHashCheck(prepared.data);
    if (h.hit) throw bad('ST-FEH-33');
    const file = await putFile('tickets', prepared.data);
    await q(`UPDATE tickets SET attachment_file = $2 WHERE id = $1`, [id, file]);
    return { ok: true };
  });

  app.get('/api/help/tickets', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true, allowSuspended: true });
    const rows = await q(`SELECT * FROM tickets WHERE account_id = $1 ORDER BY created_at DESC`, [a.id]);
    const out = [];
    for (const r of rows) {
      // interne Notizen und Systemeinträge des Teams sieht die Person nie
      const msgs = await q(
        `SELECT author, body_enc, created_at, read_by_person_at FROM ticket_messages WHERE ticket_id = $1 AND author <> 'system' AND NOT internal ORDER BY created_at`,
        [r.id],
      );
      const rep = r.report_id ? await one(`SELECT reason FROM reports WHERE id = $1`, [r.report_id]) : null;
      out.push({
        id: r.id,
        number: r.number,
        category: r.category,
        status: r.status,
        createdAt: r.created_at,
        text: decStr('tickets', r.text_enc, 'ticket'),
        messages: msgs.map((m) => ({ fromTeam: m.author === 'team', text: decStr('tickets', m.body_enc, 'ticket'), at: m.created_at })),
        // Postfach: Art und Betreff (Meldung, Widerspruch, Rückmeldung, Anfrage)
        kind: r.kind,
        subject: ticketSubject(r, { reportReason: rep?.reason }),
        // Issue #37
        unread: msgs.filter((m) => m.author === 'team' && !m.read_by_person_at).length,
        notifyEmail: r.notify_email,
        hasAttachment: !!r.attachment_file,
        dataRequests: await requestsFor(r.id),
      });
    }
    return { tickets: out };
  });

  app.post('/api/help/tickets/:id/reply', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true, allowSuspended: true });
    const { id } = params(req, idParam);
    const b = body(req, z.object({ text: z.string().min(1).max(p('P-TICKET-MAX')) }));
    const tk = await one(`SELECT id, status, category FROM tickets WHERE id = $1 AND account_id = $2`, [id, a.id]);
    if (!tk || tk.status === 'abgeschlossen') throw notFound();
    await q(`INSERT INTO ticket_messages (ticket_id, author, body_enc) VALUES ($1, 'person', $2)`, [id, encStr('tickets', b.text, 'ticket')]);
    // Postfach: ab der letzten Nachricht der Person wieder 24 h bis zur Antwort
    await q(
      `UPDATE tickets SET status = CASE WHEN status = 'beantwortet' THEN 'in_bearbeitung' ELSE status END, last_person_at = now(),
              deadline_at = now() + make_interval(secs => $2)
        WHERE id = $1`,
      [id, answerSeconds(tk.category)],
    );
    return { ok: true };
  });

  // ───────────── Support-Portal (Issue #37) ─────────────

  /** Antworten des Teams als gelesen markieren. */
  app.post('/api/help/tickets/:id/read', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true, allowSuspended: true });
    const { id } = params(req, idParam);
    await q(
      `UPDATE ticket_messages SET read_by_person_at = now()
        WHERE ticket_id = (SELECT id FROM tickets WHERE id = $1 AND account_id = $2) AND author = 'team' AND read_by_person_at IS NULL`,
      [id, a.id],
    );
    return { ok: true };
  });

  /** Hinweis per E-Mail bei Antworten an- oder ausschalten. */
  app.patch('/api/help/tickets/:id', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true, allowSuspended: true });
    const { id } = params(req, idParam);
    const b = body(req, z.object({ notifyEmail: z.boolean() }));
    if (b.notifyEmail) {
      const r = await one(`SELECT email_verified_at FROM accounts WHERE id = $1`, [a.id]);
      if (!r?.email_verified_at) throw bad('UI-NF-EMAIL-FEHLT', {}, 'email_noetig');
    }
    const r = await q(`UPDATE tickets SET notify_email = $3 WHERE id = $1 AND account_id = $2 RETURNING id`, [id, a.id, b.notifyEmail]);
    if (!r.length) throw notFound();
    return { ok: true };
  });

  /** Anfrage des Teams nach Daten: freigeben (mit Diagnosedaten vom Gerät) oder ablehnen. */
  app.post('/api/help/data-requests/:id', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true, allowSuspended: true });
    const { id } = params(req, idParam);
    const b = body(
      req,
      z.object({
        decision: z.enum(['freigeben', 'ablehnen']),
        diagnostics: z.record(z.unknown()).optional(),
      }),
    );
    const r = await one(`SELECT * FROM support_data_requests WHERE id = $1 AND account_id = $2 AND status = 'offen'`, [id, a.id]);
    if (!r) throw notFound();
    if (b.decision === 'ablehnen') {
      await q(`UPDATE support_data_requests SET status = 'abgelehnt', decided_at = now() WHERE id = $1`, [id]);
      return { ok: true };
    }
    let diag: Buffer | null = null;
    if ((r.scope as string[]).includes('diagnose')) {
      const json = JSON.stringify(b.diagnostics ?? {});
      if (json.length > 20_000) throw bad('UI-EINGABE-PRUEFEN', {}, 'zu_gross');
      diag = sealDiagnostics(id, { ...(b.diagnostics ?? {}), server: { version: appVersion(), freigegeben: new Date().toISOString() } });
    }
    await q(
      `UPDATE support_data_requests SET status = 'freigegeben', decided_at = now(), expires_at = now() + make_interval(secs => $2), diagnostics_enc = $3 WHERE id = $1`,
      [id, p('P-SUPPORT-FREIGABE'), diag],
    );
    const tk = await one(`SELECT number FROM tickets WHERE id = $1`, [r.ticket_id]);
    discord('meldungen', { title: `Datenfreigabe erteilt ${tk?.number ?? ''}`.trim(), level: 'info', fields: [{ name: 'Bereiche', value: (r.scope as string[]).join(', ') }] });
    return { ok: true };
  });

  /** Freigabe jederzeit zurücknehmen — Diagnosedaten werden sofort gelöscht. */
  app.post('/api/help/data-requests/:id/revoke', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true, allowSuspended: true });
    const { id } = params(req, idParam);
    const r = await q(
      `UPDATE support_data_requests SET status = 'widerrufen', diagnostics_enc = NULL, expires_at = now()
        WHERE id = $1 AND account_id = $2 AND status = 'freigegeben' RETURNING id`,
      [id, a.id],
    );
    if (!r.length) throw notFound();
    return { ok: true };
  });

  /** Stand eines Vorgangs ohne Konto — nachschlagbar mit Fallnummer (FV-91). */
  app.get('/api/public/tickets/:number', async (req) => {
    const { number } = params(req, z.object({ number: z.string().regex(/^H-\d{4}-\d{6}$/) }));
    if (!hit('ticket-lookup', ipKey(req), 30, 3600_000)) throw tooMany();
    const tk = await one(`SELECT status, created_at FROM tickets WHERE number = $1`, [number]);
    if (!tk) throw notFound();
    return { status: tk.status };
  });
}
