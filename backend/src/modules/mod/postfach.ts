/**
 * Postfach im Werkzeug: alle Meldungen, Widersprüche, Rückmeldungen mit Antwortwunsch und Anfragen an
 * den Support als Tickets untereinander — sortiert danach, wer dran ist und wie viel Zeit bleibt.
 *
 *  * Frist: erste Antwort binnen 24 h, danach 24 h ab der letzten Nachricht der Person. Hat das Team
 *    geantwortet und die Person ist dran, läuft keine Frist („wartet“).
 *  * Teams: allgemeiner Support, Moderation, Technik, Datenschutz, Abo — Weitergabe steht im Verlauf.
 *  * Datenschutz und Behörden öffnet nur BETRIEB; für alle anderen ist das Ticket als vorhanden sichtbar.
 *  * Keine Volltextsuche (Abschnitt 13) — Suche nur nach Fall- oder Meldungsnummer.
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one, q } from '../../db/pool.js';
import { encStr } from '../../lib/crypto.js';
import { AppError, bad, notFound } from '../../lib/errors.js';
import { body, idParam, params, query } from '../../lib/http.js';
import { t } from '../../lib/texts.js';
import { TEAMS, TEAM_KEYS, potForTeam, syncPostfach, teamLabel, ticketSubject, type Team } from '../../services/postfach.js';
import { ampel, logged, requireStaff, type StaffCtx } from './core.js';

const RESTRICTED = new Set(['datenschutz', 'behoerden']);
export const mayOpenPot = (s: StaffCtx, pot: string) => !RESTRICTED.has(pot) || s.role === 'BETRIEB';

/** Wer ist dran? Das Team, solange die Person auf eine Antwort wartet. */
export function waitingOn(status: string): 'team' | 'person' | 'niemand' {
  if (status === 'abgeschlossen') return 'niemand';
  return status === 'beantwortet' ? 'person' : 'team';
}

export default async function postfachRoutes(app: FastifyInstance) {
  app.get('/mod-api/postfach', async (req) => {
    const s = await requireStaff(req);
    const qs = query(
      req,
      z.object({
        team: z.enum([...TEAM_KEYS, 'alle', 'meine'] as [string, ...string[]]).default('alle'),
        view: z.enum(['offen', 'wartet', 'erledigt']).default('offen'),
        suche: z.string().trim().max(20).optional(),
      }),
    );
    // Abgleich vorab: fehlende Tickets entstehen sofort, nicht erst beim nächsten Takt
    await syncPostfach().catch(() => {});
    const me = await one(`SELECT teams FROM staff WHERE id = $1`, [s.id]);
    const myTeams: string[] = me?.teams ?? [];
    const where: string[] = [];
    const vals: unknown[] = [];
    if (qs.suche) {
      vals.push(qs.suche.toUpperCase());
      where.push(`(t.number = $${vals.length} OR t.related_ref = $${vals.length})`);
    } else {
      where.push(
        qs.view === 'offen' ? `t.status IN ('eingegangen','in_bearbeitung')` : qs.view === 'wartet' ? `t.status = 'beantwortet'` : `t.status = 'abgeschlossen' AND t.closed_at > now() - interval '30 days'`,
      );
      if (qs.team === 'meine') {
        vals.push(myTeams);
        where.push(`t.team = ANY($${vals.length})`);
      } else if (qs.team !== 'alle') {
        vals.push(qs.team);
        where.push(`t.team = $${vals.length}`);
      }
    }
    const rows = await q(
      `SELECT t.id, t.number, t.kind, t.team, t.category, t.pot, t.status, t.created_at, t.deadline_at, t.last_person_at, t.had_account,
              t.priority, t.related_ref, t.first_response_at, t.closed_at, st.name AS assigned, r.reason AS report_reason,
              (SELECT count(*)::int FROM ticket_messages m WHERE m.ticket_id = t.id AND m.author = 'person'
                  AND m.created_at > COALESCE((SELECT max(m2.created_at) FROM ticket_messages m2 WHERE m2.ticket_id = t.id AND m2.author = 'team' AND NOT m2.internal), 'epoch')) AS unread
         FROM tickets t
         LEFT JOIN staff st ON st.id = t.assigned_to
         LEFT JOIN reports r ON r.id = t.report_id
        WHERE ${where.join(' AND ')}
        ORDER BY (t.category = 1 AND t.status <> 'abgeschlossen') DESC, t.priority DESC,
                 CASE WHEN t.status IN ('eingegangen','in_bearbeitung') THEN t.deadline_at END ASC NULLS LAST,
                 COALESCE(t.closed_at, t.last_person_at, t.created_at) DESC
        LIMIT 300`,
      vals,
    );
    // Zähler je Team: wo wartet jemand auf eine Antwort?
    const counts = await q(
      `SELECT team, count(*)::int AS n, count(*) FILTER (WHERE deadline_at < now() OR category = 1)::int AS ueberfaellig
         FROM tickets WHERE status IN ('eingegangen','in_bearbeitung') GROUP BY team`,
    );
    return {
      teams: TEAMS.map((x) => {
        const c = counts.find((r) => r.team === x.key);
        return { key: x.key, label: x.label, open: c?.n ?? 0, overdue: c?.ueberfaellig ?? 0, mine: myTeams.includes(x.key) };
      }),
      myTeams,
      items: rows.map((r) => {
        const start = new Date(r.last_person_at ?? r.created_at);
        const wait = waitingOn(r.status);
        return {
          id: r.id,
          number: r.number,
          kind: r.kind,
          team: r.team,
          teamLabel: teamLabel(r.team),
          subject: ticketSubject(r, { reportReason: r.report_reason }),
          status: r.status,
          waitingOn: wait,
          createdAt: r.created_at,
          lastPersonAt: r.last_person_at,
          deadlineAt: wait === 'team' ? r.deadline_at : null,
          remainingMinutes: wait === 'team' ? Math.round((new Date(r.deadline_at).getTime() - Date.now()) / 60000) : null,
          ampel: wait !== 'team' ? null : r.category === 1 ? 'rot' : ampel(start, new Date(r.deadline_at)),
          firstResponse: !!r.first_response_at,
          unread: r.unread,
          assigned: r.assigned,
          priority: r.priority || r.category === 1,
          withoutAccount: !r.had_account,
          mayOpen: mayOpenPot(s, r.pot),
        };
      }),
    };
  });

  /** An ein anderes Team weitergeben — mit Notiz für das Team, sichtbar im Verlauf (nie für die Person). */
  app.post('/mod-api/tickets/:id/team', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ team: z.enum(TEAM_KEYS), note: z.string().trim().max(2000).optional(), reason: z.string().trim().max(500).optional() }));
    const tk = await one(`SELECT * FROM tickets WHERE id = $1 AND status <> 'abgeschlossen'`, [id]);
    if (!tk) throw notFound();
    if (!mayOpenPot(s, tk.pot)) throw new AppError(403, 'UI-MOD-RECHT', {}, 'recht');
    if (tk.team === b.team) throw bad('UI-PF-SCHON-IM-TEAM', {}, 'schon_im_team');
    const pot = tk.kind === 'anfrage' ? potForTeam(b.team as Team, tk.category) : tk.pot;
    await logged(s, tk.number, 'ticket_weitergegeben', b.reason || `${teamLabel(tk.team)} → ${teamLabel(b.team)}`, async (c) => {
      await c.query(`UPDATE tickets SET team = $2, pot = $3, assigned_to = NULL WHERE id = $1`, [id, b.team, pot]);
      await c.query(`INSERT INTO ticket_messages (ticket_id, author, staff_id, body_enc, internal) VALUES ($1, 'system', $2, $3, true)`, [
        id,
        s.id,
        encStr('tickets', t('UI-PF-WEITERGEGEBEN', { von: teamLabel(tk.team), an: teamLabel(b.team), person: s.name }), 'ticket'),
      ]);
      if (b.note) {
        await c.query(`INSERT INTO ticket_messages (ticket_id, author, staff_id, body_enc, internal) VALUES ($1, 'team', $2, $3, true)`, [id, s.id, encStr('tickets', b.note, 'ticket')]);
      }
    });
    return { ok: true, team: b.team };
  });

  /** Übernehmen oder abgeben. */
  app.post('/mod-api/tickets/:id/assign', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ take: z.boolean() }));
    const tk = await one(`SELECT pot FROM tickets WHERE id = $1`, [id]);
    if (!tk) throw notFound();
    if (!mayOpenPot(s, tk.pot)) throw new AppError(403, 'UI-MOD-RECHT', {}, 'recht');
    await q(`UPDATE tickets SET assigned_to = $2 WHERE id = $1`, [id, b.take ? s.id : null]);
    return { ok: true };
  });

  /** Eigene Teams (für „Meine Teams“ im Postfach). Owner legen sie für andere unter „Team“ fest. */
  app.put('/mod-api/me/teams', async (req) => {
    const s = await requireStaff(req);
    const b = body(req, z.object({ teams: z.array(z.enum(TEAM_KEYS)).max(TEAM_KEYS.length) }));
    await q(`UPDATE staff SET teams = $2 WHERE id = $1`, [s.id, [...new Set(b.teams)]]);
    return { ok: true };
  });
}
