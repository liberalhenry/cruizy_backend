/**
 * Postfach im Werkzeug: jede Meldung, jeder Widerspruch, jede Rückmeldung mit Antwortwunsch und jede
 * Anfrage an den Support ist ein Ticket. Darüber schreibt das Team mit der Person (Chat im Werkzeug,
 * Postfach „Hilfe“ in der App).
 *
 *  * Teams: Anfragen ohne besonderen Anlass landen im allgemeinen Support und werden von dort
 *    weitergegeben; mit Anlass (Kategorie) direkt im zuständigen Team.
 *  * Frist: erste Antwort binnen P-TICKET-FRIST (24 h), danach 24 h ab der letzten Nachricht der Person.
 *    Solange das Team geantwortet hat und die Person dran ist, läuft keine Frist.
 *  * Datenschutz und Behörden öffnet nur BETRIEB (unverändert, über den „Topf“ des Tickets).
 */
import { p } from '../config/params.js';
import { db, one, q, type Queryable } from '../db/pool.js';
import { decStr, encStr } from '../lib/crypto.js';
import { nextNumber } from '../lib/numbers.js';
import { t } from '../lib/texts.js';

export const TEAMS = [
  { key: 'support', label: 'Allgemeiner Support' },
  { key: 'moderation', label: 'Moderation & Sicherheit' },
  { key: 'technik', label: 'Technik' },
  { key: 'datenschutz', label: 'Datenschutz & Recht' },
  { key: 'abrechnung', label: 'Abo & Zahlung' },
] as const;
export type Team = (typeof TEAMS)[number]['key'];
export const TEAM_KEYS = TEAMS.map((x) => x.key) as [Team, ...Team[]];
export const teamLabel = (k: string) => TEAMS.find((x) => x.key === k)?.label ?? k;

export type Pot = 'missbrauch' | 'hilfe' | 'datenschutz' | 'behoerden';

/**
 * Zuständiges Team je Kategorie der Hilfe. 10 („Etwas anderes“) und 3 (Konto) sind der allgemeine
 * Support — von dort geht es bei Bedarf weiter.
 */
export function teamForCategory(category: number): Team {
  switch (category) {
    case 1:
    case 2:
    case 8:
      return 'moderation';
    case 4:
      return 'abrechnung';
    case 5:
      return 'technik';
    case 6:
    case 9:
      return 'datenschutz';
    default:
      return 'support';
  }
}

/** Topf (Rechte im Werkzeug) passend zum Team: Datenschutz und Behörden nur für BETRIEB. */
export function potForTeam(team: Team, category: number): Pot {
  if (team === 'datenschutz') return category === 9 ? 'behoerden' : 'datenschutz';
  if (team === 'moderation') return 'missbrauch';
  return 'hilfe';
}

/** Sekunden bis zur Antwort: Kategorie 1 („in Gefahr“) sofort, sonst P-TICKET-FRIST. */
export function answerSeconds(category: number): number {
  return category === 1 ? 0 : p('P-TICKET-FRIST');
}

// ───────────── Tickets zu Meldungen, Widersprüchen, Rückmeldungen ─────────────

/** Ticket zu einer Meldung — Gegenüber ist die meldende Person (Konto oder Kontaktangabe im Webformular). */
export async function ensureReportTicket(reportId: string, c: Queryable = db()): Promise<string | null> {
  const has = await one(`SELECT id FROM tickets WHERE report_id = $1`, [reportId], c);
  if (has) return has.id;
  const r = await one(`SELECT * FROM reports WHERE id = $1`, [reportId], c);
  if (!r) return null;
  let email: string | null = null;
  if (!r.reporter_id && r.reporter_contact_enc) {
    try {
      email = JSON.parse(decStr('tickets', r.reporter_contact_enc, 'report-contact') ?? '{}').email ?? null;
    } catch {
      email = null;
    }
  }
  const number = await nextNumber('H', c);
  const category = r.reason === 'gefahr' ? 1 : 2;
  const row = await one(
    `INSERT INTO tickets (number, category, pot, account_id, had_account, text_enc, reply_way, email_enc, related_ref, priority,
                          deadline_at, team, kind, report_id, last_person_at, created_at)
     VALUES ($1, $2, 'missbrauch', $3, $4, $5, $6, $7, $8, $9, $10, 'moderation', 'meldung', $11, $12, $12)
     ON CONFLICT (report_id) WHERE report_id IS NOT NULL DO NOTHING RETURNING id`,
    [
      number,
      category,
      r.reporter_id,
      !!r.reporter_id,
      encStr('tickets', `Meldung ${r.number}`, 'ticket'),
      r.reporter_id ? 'app' : 'email',
      email ? encStr('tickets', email, 'ticket') : null,
      r.number,
      r.priority,
      r.deadline_at,
      reportId,
      r.created_at,
    ],
    c,
  );
  return row?.id ?? (await one(`SELECT id FROM tickets WHERE report_id = $1`, [reportId], c))?.id ?? null;
}

/** Ticket zu einem Widerspruch oder Einspruch — Gegenüber ist die widersprechende Person. */
export async function ensureAppealTicket(appealId: string, c: Queryable = db()): Promise<string | null> {
  const has = await one(`SELECT id FROM tickets WHERE appeal_id = $1`, [appealId], c);
  if (has) return has.id;
  const ap = await one(`SELECT * FROM appeals WHERE id = $1`, [appealId], c);
  if (!ap) return null;
  const number = await nextNumber('H', c);
  const row = await one(
    `INSERT INTO tickets (number, category, pot, account_id, had_account, text_enc, reply_way, related_ref, deadline_at,
                          team, kind, appeal_id, last_person_at, created_at)
     VALUES ($1, 7, 'missbrauch', $2, $3, $4, 'app', $5, $6, 'moderation', 'widerspruch', $7, $8, $8)
     ON CONFLICT (appeal_id) WHERE appeal_id IS NOT NULL DO NOTHING RETURNING id`,
    [number, ap.account_id, !!ap.account_id, encStr('tickets', `Widerspruch ${ap.number}`, 'ticket'), ap.number, ap.deadline_at, appealId, ap.created_at],
    c,
  );
  return row?.id ?? (await one(`SELECT id FROM tickets WHERE appeal_id = $1`, [appealId], c))?.id ?? null;
}

/** Ticket zu einer Rückmeldung — nur, wenn die Person eine Antwort wünscht (sonst bleibt sie ohne Kontobezug). */
export async function ensureFeedbackTicket(feedbackId: string, c: Queryable = db()): Promise<string | null> {
  const has = await one(`SELECT id FROM tickets WHERE feedback_id = $1`, [feedbackId], c);
  if (has) return has.id;
  const f = await one(`SELECT * FROM feedback WHERE id = $1 AND wants_reply AND account_id IS NOT NULL`, [feedbackId], c);
  if (!f) return null;
  const number = await nextNumber('H', c);
  const row = await one(
    `INSERT INTO tickets (number, category, pot, account_id, had_account, text_enc, reply_way, deadline_at, team, kind, feedback_id, last_person_at, created_at)
     VALUES ($1, 10, 'hilfe', $2, true, $3, 'app', $4::timestamptz + make_interval(secs => $5), 'support', 'rueckmeldung', $6, $4, $4)
     ON CONFLICT (feedback_id) WHERE feedback_id IS NOT NULL DO NOTHING RETURNING id`,
    [number, f.account_id, encStr('tickets', decStr('tickets', f.text_enc, 'feedback') ?? '', 'ticket'), f.created_at, p('P-TICKET-FRIST'), feedbackId],
    c,
  );
  return row?.id ?? (await one(`SELECT id FROM tickets WHERE feedback_id = $1`, [feedbackId], c))?.id ?? null;
}

/**
 * Abgleich (Hintergrundauftrag, jede Minute): fehlende Tickets anlegen — auch für Fälle von vor dem
 * Postfach — und Tickets schließen, deren Fall entschieden ist und bei denen die Person nicht mehr dran ist.
 */
export async function syncPostfach() {
  const reports = await q(`SELECT r.id FROM reports r WHERE r.status IN ('received','in_review') AND NOT EXISTS (SELECT 1 FROM tickets t WHERE t.report_id = r.id)`);
  for (const r of reports) await ensureReportTicket(r.id);
  const appeals = await q(`SELECT a.id FROM appeals a WHERE a.decided_at IS NULL AND NOT EXISTS (SELECT 1 FROM tickets t WHERE t.appeal_id = a.id)`);
  for (const a of appeals) await ensureAppealTicket(a.id);
  const feedback = await q(
    `SELECT f.id FROM feedback f WHERE f.wants_reply AND f.account_id IS NOT NULL AND f.answered_at IS NULL AND NOT EXISTS (SELECT 1 FROM tickets t WHERE t.feedback_id = f.id)`,
  );
  for (const f of feedback) await ensureFeedbackTicket(f.id);
  // entschieden und niemand wartet mehr aufs Team → abgeschlossen
  const retention = p('P-TICKET-AUFBEWAHRUNG');
  await q(
    `UPDATE tickets t SET status = 'abgeschlossen', closed_at = now(), closed_reason = 'Fall entschieden',
            delete_after = now() + make_interval(secs => $1)
      WHERE t.status IN ('beantwortet','eingegangen','in_bearbeitung')
        AND ((t.report_id IS NOT NULL AND EXISTS (SELECT 1 FROM reports r WHERE r.id = t.report_id AND r.status IN ('decided','closed')))
          OR (t.appeal_id IS NOT NULL AND EXISTS (SELECT 1 FROM appeals a WHERE a.id = t.appeal_id AND a.decided_at IS NOT NULL)))
        AND NOT EXISTS (
          SELECT 1 FROM ticket_messages m WHERE m.ticket_id = t.id AND m.author = 'person'
             AND m.created_at > COALESCE((SELECT max(m2.created_at) FROM ticket_messages m2 WHERE m2.ticket_id = t.id AND m2.author = 'team' AND NOT m2.internal), 'epoch'))`,
    [retention.missbrauch],
  );
}

// ───────────── Anzeige ─────────────

const REASON_TEXT: Record<string, string> = {
  belaestigung: 'ST-MEL-03',
  nacktbilder: 'ST-MEL-04',
  fake: 'ST-MEL-05',
  minderjaehrig: 'ST-MEL-06',
  hass: 'ST-MEL-07',
  sexgeld: 'ST-MEL-08',
  gefahr: 'ST-MEL-09',
  intim_ohne_einwilligung: 'UI-MEL-INTIM',
  passt_nicht_zu_date: 'UI-MEL-DATE',
  anderes: 'ST-MEL-10',
};

/** Betreffzeile eines Tickets (Werkzeug und App). */
export function ticketSubject(tk: { kind: string; category: number; related_ref?: string | null }, extra: { reportReason?: string | null } = {}): string {
  if (tk.kind === 'meldung') return `${t('UI-PF-MELDUNG')} ${tk.related_ref ?? ''}${extra.reportReason ? ` · ${t(REASON_TEXT[extra.reportReason] ?? 'ST-MEL-10')}` : ''}`.trim();
  if (tk.kind === 'widerspruch') return `${t('UI-PF-WIDERSPRUCH')} ${tk.related_ref ?? ''}`.trim();
  if (tk.kind === 'rueckmeldung') return t('UI-PF-RUECKMELDUNG');
  // ohne Anlass (Kategorie 10) — die allgemeine Frage im Support
  return tk.category === 10 ? t('UI-HLF-KAT-ALLGEMEIN') : t(`UI-HLF-KAT-${tk.category}`);
}

/**
 * Erste Nachricht im Verlauf: der Text, mit dem der Vorgang begann — bei Meldungen die Beschreibung,
 * bei Widersprüchen die Begründung der Person. Nur im Werkzeug nach dem protokollierten Öffnen.
 */
export async function openingText(tk: { kind: string; text_enc: Buffer; report_id?: string | null; appeal_id?: string | null }): Promise<string> {
  if (tk.kind === 'meldung' && tk.report_id) {
    const r = await one(`SELECT description_enc FROM reports WHERE id = $1`, [tk.report_id]);
    return r?.description_enc ? (decStr('sealed', r.description_enc, 'report') ?? '') : t('UI-PF-OHNE-BESCHREIBUNG');
  }
  if (tk.kind === 'widerspruch' && tk.appeal_id) {
    const a = await one(`SELECT text_enc FROM appeals WHERE id = $1`, [tk.appeal_id]);
    return a ? (decStr('tickets', a.text_enc, 'appeal') ?? '') : '';
  }
  return decStr('tickets', tk.text_enc, 'ticket') ?? '';
}
