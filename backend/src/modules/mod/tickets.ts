/**
 * M85 · Vorgänge des Kontaktservice.
 *  * Vier Töpfe, Missbrauch immer oben; Kategorie 1 als eigene Zeile über allem (M85.01).
 *  * Sortiert nach Restfrist — nicht umstellbar (M85.02).
 *  * Rot lässt sich nicht wegklicken (M85.03).
 *  * Datenschutz und Behörden nur BETRIEB — für MOD als vorhanden sichtbar, Inhalt nicht.
 *  * Bezug zeigt die Kennung, nie den Inhalt (M85.05).
 *  * Vorlagen sind immer bearbeitbar und werden nie automatisch versandt (M85.06).
 *  * Kategorie ändern: Frist neu, alte Frist bleibt sichtbar (M85.09).
 *  * Keine Volltextsuche, keine Zufriedenheitsbewertung, kein Löschen (Abschnitt 13).
 *  * Issue #37: Antworten stehen bei Personen mit Konto immer in der App (auf Wunsch Hinweis per E-Mail ohne
 *    Inhalt). Das Team kann um Einsicht in Konto-, Profil- und Diagnosedaten bitten — sichtbar erst nach
 *    Freigabe durch die Person, jede Einsicht im Zugriffsprotokoll.
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { p } from '../../config/params.js';
import { one, q } from '../../db/pool.js';
import { decStr, encStr } from '../../lib/crypto.js';
import { AppError, bad, notFound } from '../../lib/errors.js';
import { body, idParam, params, query } from '../../lib/http.js';
import { hasText, t } from '../../lib/texts.js';
import { sendMail } from '../../providers/mail.js';
import { createNotice } from '../../services/notify.js';
import { CATEGORY_POT, deadlineSeconds } from '../help.js';
import { REASONS, createReport } from '../reports.js';
import { ampel, logged, requireStaff, type StaffCtx } from './core.js';
import { modImgUrl } from './index.js';
import { env } from '../../config/env.js';
import { SCOPES, endRequestsOf, releasedData, requestsFor } from '../../services/support.js';
import { TEAMS, openingText, teamLabel, ticketSubject } from '../../services/postfach.js';
import { waitingOn } from './postfach.js';

const POTS = ['missbrauch', 'hilfe', 'datenschutz', 'behoerden'] as const;
const RESTRICTED = new Set(['datenschutz', 'behoerden']);
const CLOSE_REASONS = ['beantwortet', 'erledigt ohne Antwort', 'keine Rückmeldung', 'doppelt', 'als Moderationsfall weitergeführt', 'kein Anliegen erkennbar'] as const;

function mayOpen(s: StaffCtx, pot: string) {
  return !RESTRICTED.has(pot) || s.role === 'BETRIEB';
}

/** Aufbewahrung nach Abschluss (P-TICKET-AUFBEWAHRUNG): Missbrauch, Datenschutz, Behörden länger. */
function retentionSeconds(pot: string): number {
  const r = p('P-TICKET-AUFBEWAHRUNG');
  return pot === 'hilfe' ? r.hilfe : r.missbrauch;
}

function ticketAmpel(r: { created_at: Date; deadline_at: Date; category: number }) {
  if (r.category === 1) return 'rot';
  return ampel(new Date(r.created_at), new Date(r.deadline_at));
}

/**
 * Issue #37: Hinweis per E-Mail, dass es im Vorgang etwas Neues gibt — ohne Inhalt, Betreff nur die
 * Fallnummer (FV-92). Gelesen und geantwortet wird in der App. Hat die Person Mitteilungen ohnehin per
 * E-Mail eingeschaltet (Issue #35), kommt dieser Hinweis schon über die Mitteilung.
 */
async function hintMail(accountId: string, number: string) {
  const a = await one(
    `SELECT a.email_enc, a.email_verified_at, pr.notify_email FROM accounts a LEFT JOIN profiles pr ON pr.account_id = a.id WHERE a.id = $1`,
    [accountId],
  );
  if (!a?.email_verified_at || a.notify_email) return;
  const email = decStr('pii', a.email_enc, 'email');
  if (!email) return;
  const link = `${env().APP_URL}/ich/hilfe?vorgang=${encodeURIComponent(number)}`;
  await sendMail({
    to: email,
    subject: t('ST-HLF-24', { fallnummer: number }),
    text: `${t('UI-SUP-MAIL-HINWEIS', { fallnummer: number })}\n\n${link}`,
    design: { heading: t('UI-MAIL-KOPF-ANTWORT'), action: { label: t('UI-NF-IN-DER-APP'), url: link } },
  }).catch(() => {});
}

export default async function ticketModRoutes(app: FastifyInstance) {
  app.get('/mod-api/tickets', async (req) => {
    const s = await requireStaff(req);
    const qs = query(req, z.object({ number: z.string().regex(/^H-\d{4}-\d{6}$/).optional() }));
    // Suche nur nach Fallnummer (Abschnitt 13, Nr. 16)
    const rows = await q(
      `SELECT t.id, t.number, t.category, t.pot, t.status, t.created_at, t.deadline_at, t.deadline_history, t.had_account, t.priority, st.name AS assigned
         FROM tickets t LEFT JOIN staff st ON st.id = t.assigned_to
        WHERE ${qs.number ? 't.number = $1' : "t.status <> 'abgeschlossen'"}
        ORDER BY (t.category = 1) DESC, t.deadline_at ASC`,
      qs.number ? [qs.number] : [],
    );
    const pots = POTS.map((pot) => {
      const inPot = rows.filter((r) => r.pot === pot && r.status !== 'abgeschlossen');
      return {
        pot,
        open: inPot.length,
        oldest: inPot.reduce<Date | null>((min, r) => (!min || r.created_at < min ? r.created_at : min), null),
        red: inPot.filter((r) => ticketAmpel(r) === 'rot').length,
        mayOpen: mayOpen(s, pot),
      };
    });
    return {
      danger: rows.filter((r) => r.category === 1 && r.status !== 'abgeschlossen').map((r) => ({ id: r.id, number: r.number, createdAt: r.created_at })),
      pots,
      items: rows.map((r) => ({
        id: r.id,
        number: r.number,
        category: r.category,
        pot: r.pot,
        status: r.status,
        createdAt: r.created_at,
        deadlineAt: r.deadline_at,
        remainingMinutes: Math.round((new Date(r.deadline_at).getTime() - Date.now()) / 60000),
        ampel: ticketAmpel(r),
        previousDeadlines: r.deadline_history,
        assigned: r.assigned,
        withoutAccount: !r.had_account,
        mayOpen: mayOpen(s, r.pot),
      })),
      closeReasons: CLOSE_REASONS,
    };
  });

  /** Vorlagen zu den häufigen Fragen — nur als Textvorschlag, nie automatisch versandt. */
  app.get('/mod-api/tickets/templates', async (req) => {
    await requireStaff(req);
    const out = [];
    for (let i = 1; i <= 20; i++) {
      const k = String(i).padStart(2, '0');
      if (hasText(`UI-FAQ-${k}-F`)) out.push({ question: t(`UI-FAQ-${k}-F`), answer: t(`UI-FAQ-${k}-A`) });
    }
    return { templates: out };
  });

  app.post('/mod-api/tickets/:id/open', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const tk = await one(`SELECT * FROM tickets WHERE id = $1`, [id]);
    if (!tk) throw notFound();
    if (!mayOpen(s, tk.pot)) throw new AppError(403, 'UI-MOD-RECHT', {}, 'recht');
    const b = body(req, z.object({ reason: z.string().trim().min(1).max(500).default('Bearbeitung Vorgang') }));
    return logged(s, tk.number, 'vorgang_geoeffnet', b.reason, async (c) => {
      if (tk.status === 'eingegangen') await c.query(`UPDATE tickets SET status = 'in_bearbeitung', assigned_to = COALESCE(assigned_to, $2) WHERE id = $1`, [id, s.id]);
      const msgs = (
        await c.query(
          `SELECT m.author, m.staff_id, m.body_enc, m.created_at, m.internal, st.name AS staff_name
             FROM ticket_messages m LEFT JOIN staff st ON st.id = m.staff_id WHERE m.ticket_id = $1 ORDER BY m.created_at`,
          [id],
        )
      ).rows;
      // Bezug: Meldung (gemeldete Person), Widerspruch, Gegenüber im Ticket
      const rep = tk.report_id
        ? await one(
            `SELECT r.id, r.number, r.reason, r.status, r.decision, r.context, r.target_id, r.from_web, pr.name AS target_name, a.moderation_state AS target_state
               FROM reports r LEFT JOIN profiles pr ON pr.account_id = r.target_id LEFT JOIN accounts a ON a.id = r.target_id WHERE r.id = $1`,
            [tk.report_id],
          )
        : null;
      const ap = tk.appeal_id ? await one(`SELECT id, number, kind, decided_at, outcome, deadline_at FROM appeals WHERE id = $1`, [tk.appeal_id]) : null;
      const person = tk.account_id
        ? await one(`SELECT a.id, a.moderation_state, pr.name FROM accounts a LEFT JOIN profiles pr ON pr.account_id = a.id WHERE a.id = $1`, [tk.account_id])
        : null;
      const assigned = tk.assigned_to ? await one(`SELECT id, name FROM staff WHERE id = $1`, [tk.assigned_to]) : null;
      const status = tk.status === 'eingegangen' ? 'in_bearbeitung' : tk.status;
      return {
        id: tk.id,
        number: tk.number,
        kind: tk.kind,
        team: tk.team,
        teamLabel: teamLabel(tk.team),
        teams: TEAMS,
        subject: ticketSubject(tk, { reportReason: rep?.reason }),
        category: tk.category,
        pot: tk.pot,
        status,
        waitingOn: waitingOn(status),
        createdAt: tk.created_at,
        deadlineAt: tk.deadline_at,
        lastPersonAt: tk.last_person_at,
        firstResponseAt: tk.first_response_at,
        previousDeadlines: tk.deadline_history,
        // erste Nachricht im Chat: womit der Vorgang begann
        text: await openingText(tk),
        attachment: tk.attachment_file ? modImgUrl('tickets', tk.attachment_file, s.id) : null,
        replyWay: tk.reply_way,
        // M85.05: nur die Kennung, nie der Inhalt
        relatedRef: tk.related_ref,
        // M85.10: ohne Konto — keine Kontoansicht, kein Verlauf
        withoutAccount: !tk.had_account,
        canWrite: !!tk.account_id || !!tk.email_enc,
        assigned: assigned ? { id: assigned.id, name: assigned.name, me: assigned.id === s.id } : null,
        person: person ? { id: person.id, name: person.name, moderationState: person.moderation_state } : null,
        report: rep
          ? {
              id: rep.id,
              number: rep.number,
              reason: rep.reason,
              status: rep.status,
              decision: rep.decision,
              context: rep.context,
              fromWeb: rep.from_web,
              target: rep.target_id ? { id: rep.target_id, name: rep.target_name, moderationState: rep.target_state } : null,
            }
          : null,
        appeal: ap ? { id: ap.id, number: ap.number, kind: ap.kind, decidedAt: ap.decided_at, outcome: ap.outcome, deadlineAt: ap.deadline_at } : null,
        messages: msgs.map((m) => ({
          author: m.author,
          fromTeam: m.author === 'team',
          internal: m.internal,
          staffName: m.staff_name,
          text: decStr('tickets', m.body_enc, 'ticket'),
          at: m.created_at,
        })),
        // Issue #37
        notifyEmail: tk.notify_email,
        dataRequests: tk.account_id ? await requestsFor(tk.id) : [],
        mayRequestData: !!tk.account_id && tk.status !== 'abgeschlossen',
        closeReasons: CLOSE_REASONS,
      };
    });
  });

  // ───────────── Issue #37: Datenfreigabe ─────────────

  /** Um Einsicht bitten — die Person entscheidet in der App. Höchstens eine offene Anfrage je Vorgang. */
  app.post('/mod-api/tickets/:id/data-request', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ scope: z.array(z.enum(SCOPES)).min(1).max(3), reason: z.string().trim().min(10).max(500) }));
    const tk = await one(`SELECT * FROM tickets WHERE id = $1 AND status <> 'abgeschlossen'`, [id]);
    if (!tk || !tk.account_id) throw notFound();
    if (!mayOpen(s, tk.pot)) throw new AppError(403, 'UI-MOD-RECHT', {}, 'recht');
    const open = await one(`SELECT 1 FROM support_data_requests WHERE ticket_id = $1 AND status = 'offen'`, [id]);
    if (open) throw new AppError(409, 'UI-SUP-ANFRAGE-OFFEN', {}, 'anfrage_offen');
    const scope = [...new Set(b.scope)];
    const r = await logged(s, tk.number, 'datenfreigabe_angefragt', `${scope.join(', ')}: ${b.reason}`, async (c) =>
      (
        await c.query(`INSERT INTO support_data_requests (ticket_id, account_id, requested_by, scope, reason) VALUES ($1, $2, $3, $4, $5) RETURNING id`, [
          id,
          tk.account_id,
          s.id,
          scope,
          b.reason,
        ])
      ).rows[0],
    );
    await createNotice(tk.account_id, 'hilfe_freigabe', t('UI-SUP-N-FREIGABE-TITEL', { fallnummer: tk.number }), t('UI-SUP-N-FREIGABE'), tk.number);
    if (tk.notify_email) await hintMail(tk.account_id, tk.number);
    return { ok: true, id: r.id };
  });

  /** Freigegebene Daten ansehen — nur solange die Freigabe gilt, jede Einsicht im Zugriffsprotokoll. */
  app.post('/mod-api/tickets/:id/data', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ requestId: z.string().uuid(), reason: z.string().trim().min(3).max(500).default('Bearbeitung Vorgang') }));
    const tk = await one(`SELECT number, pot FROM tickets WHERE id = $1`, [id]);
    if (!tk) throw notFound();
    if (!mayOpen(s, tk.pot)) throw new AppError(403, 'UI-MOD-RECHT', {}, 'recht');
    const r = await one(
      `SELECT * FROM support_data_requests WHERE id = $1 AND ticket_id = $2 AND status = 'freigegeben' AND expires_at > now()`,
      [b.requestId, id],
    );
    if (!r) throw new AppError(403, 'UI-SUP-KEINE-FREIGABE', {}, 'keine_freigabe');
    return logged(s, tk.number, 'freigegebene_daten_eingesehen', b.reason, async () => ({ expiresAt: r.expires_at, scope: r.scope, data: await releasedData(r as never) }));
  });

  /** M85.06: Antwort — Text von einem Menschen. */
  app.post('/mod-api/tickets/:id/reply', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    // Postfach: Chat — kurze Antworten sind erlaubt; „intern“ = Notiz nur für das Team
    const b = body(req, z.object({ text: z.string().trim().min(1).max(p('P-TICKET-MAX')), internal: z.boolean().default(false) }));
    const tk = await one(`SELECT * FROM tickets WHERE id = $1 AND status <> 'abgeschlossen'`, [id]);
    if (!tk) throw notFound();
    if (!mayOpen(s, tk.pot)) throw new AppError(403, 'UI-MOD-RECHT', {}, 'recht');
    if (b.internal) {
      await logged(s, tk.number, 'ticket_notiz', 'Interne Notiz', async (c) => {
        await c.query(`INSERT INTO ticket_messages (ticket_id, author, staff_id, body_enc, internal) VALUES ($1, 'team', $2, $3, true)`, [id, s.id, encStr('tickets', b.text, 'ticket')]);
      });
      return { ok: true, internal: true };
    }
    // ohne Konto und ohne Kontaktangabe (z. B. hochgestufte Meldung) gibt es niemanden, dem wir schreiben könnten
    if (!tk.account_id && !tk.email_enc) throw bad('UI-PF-KEIN-GEGENUEBER', {}, 'kein_gegenueber');
    await logged(s, tk.number, 'vorgang_beantwortet', 'Antwort an die Person', async (c) => {
      await c.query(`INSERT INTO ticket_messages (ticket_id, author, staff_id, body_enc) VALUES ($1, 'team', $2, $3)`, [id, s.id, encStr('tickets', b.text, 'ticket')]);
      await c.query(
        `UPDATE tickets SET status = 'beantwortet', assigned_to = COALESCE(assigned_to, $2), first_response_at = COALESCE(first_response_at, now()) WHERE id = $1`,
        [id, s.id],
      );
    });
    if (tk.account_id) {
      // Issue #37: mit Konto steht die Antwort immer in der App — auf Wunsch ein Hinweis per E-Mail, ohne Inhalt
      await createNotice(tk.account_id, 'hilfe_antwort', t('ST-HLF-24', { fallnummer: tk.number }), t('ST-HLF-25'), tk.number);
      if (tk.notify_email || tk.reply_way === 'email') await hintMail(tk.account_id, tk.number);
    } else {
      const email = decStr('tickets', tk.email_enc, 'ticket');
      // FV-92: im Betreff nur die Fallnummer
      // Regel 3 (2.4): der erste Satz nennt den Anlass nicht
      if (email) {
        await sendMail({
          to: email,
          subject: t('ST-HLF-24', { fallnummer: tk.number }),
          text: `${t('UI-MAIL-ANTWORT-EINLEITUNG', { fallnummer: tk.number })}\n\n${b.text}`,
          design: { heading: t('UI-MAIL-KOPF-ANTWORT') },
        });
      }
    }
    return { ok: true };
  });

  /** M85.09: Kategorie ändern — Frist neu berechnet, die alte bleibt sichtbar. */
  app.post('/mod-api/tickets/:id/category', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ category: z.number().int().min(1).max(10), reason: z.string().trim().min(3).max(500) }));
    const tk = await one(`SELECT * FROM tickets WHERE id = $1 AND status <> 'abgeschlossen'`, [id]);
    if (!tk) throw notFound();
    const pot = CATEGORY_POT[b.category];
    if (!pot) throw bad('UI-MOD-KATEGORIE-WIDERSPRUCH');
    if (!mayOpen(s, tk.pot) && s.role !== 'BETRIEB') {
      // MOD darf die Kategorie eines Datenschutzvorgangs nicht ändern, ohne ihn zu sehen — nur BETRIEB
      throw new AppError(403, 'UI-MOD-RECHT', {}, 'recht');
    }
    await logged(s, tk.number, 'kategorie_geaendert', `${tk.category} → ${b.category}: ${b.reason}`, async (c) => {
      const history = [...(tk.deadline_history ?? []), { category: tk.category, deadlineAt: tk.deadline_at, changedAt: new Date().toISOString() }];
      await c.query(
        `UPDATE tickets SET category = $2, pot = $3, priority = $4, deadline_at = COALESCE(last_person_at, created_at) + make_interval(secs => $5), deadline_history = $6 WHERE id = $1`,
        [id, b.category, pot, b.category === 1, deadlineSeconds(pot, b.category), JSON.stringify(history)],
      );
    });
    return { ok: true };
  });

  /** M85.08: Schließen mit Grund aus einer kurzen Liste. */
  app.post('/mod-api/tickets/:id/close', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ closeReason: z.enum(CLOSE_REASONS), reason: z.string().trim().min(1).max(500).optional() }));
    const tk = await one(`SELECT * FROM tickets WHERE id = $1 AND status <> 'abgeschlossen'`, [id]);
    if (!tk) throw notFound();
    if (!mayOpen(s, tk.pot)) throw new AppError(403, 'UI-MOD-RECHT', {}, 'recht');
    await endRequestsOf(id);
    await logged(s, tk.number, 'vorgang_geschlossen', b.reason ? `${b.closeReason}: ${b.reason}` : b.closeReason, async (c) => {
      await c.query(
        `UPDATE tickets SET status = 'abgeschlossen', closed_reason = $2, closed_at = now(), delete_after = now() + make_interval(secs => $3) WHERE id = $1`,
        [id, b.closeReason, retentionSeconds(tk.pot)],
      );
    });
    return { ok: true };
  });

  /** M85.07: als Moderationsfall öffnen — Fall nach M20, Vorgang geschlossen mit Verweis. */
  app.post('/mod-api/tickets/:id/to-case', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(
      req,
      z.object({
        reportReason: z.enum(Object.keys(REASONS) as [keyof typeof REASONS, ...(keyof typeof REASONS)[]]),
        reason: z.string().trim().min(5).max(500),
      }),
    );
    const tk = await one(`SELECT * FROM tickets WHERE id = $1 AND status <> 'abgeschlossen'`, [id]);
    if (!tk) throw notFound();
    if (!mayOpen(s, tk.pot)) throw new AppError(403, 'UI-MOD-RECHT', {}, 'recht');
    const email = decStr('tickets', tk.email_enc, 'ticket');
    const r = await createReport({
      reporter: tk.account_id,
      reporterContact: !tk.account_id && email ? { email } : null,
      reason: b.reportReason,
      description: `${t('UI-MOD-AUS-VORGANG', { nummer: tk.number })}\n\n${decStr('tickets', tk.text_enc, 'ticket') ?? ''}`,
      context: 'kontaktservice',
      targetRef: tk.related_ref,
      items: [],
      fromWeb: !tk.account_id,
    });
    await endRequestsOf(id);
    await logged(s, tk.number, 'als_fall_geoeffnet', `${b.reason} → ${r.number}`, async (c) => {
      await c.query(
        `UPDATE tickets SET status = 'abgeschlossen', closed_reason = $2, closed_at = now(), delete_after = now() + make_interval(secs => $3) WHERE id = $1`,
        [id, `als Moderationsfall weitergeführt: ${r.number}`, retentionSeconds(tk.pot)],
      );
    }, true);
    return { ok: true, report: r.number, reportId: r.id };
  });
}
