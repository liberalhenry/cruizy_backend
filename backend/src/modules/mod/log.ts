/**
 * M60 · Zugriffsprotokoll — die Regel, die alle anderen trägt.
 *  * Zeitleiste absteigend, nicht nach Person filterbar (M60.01).
 *  * Niemand ändert oder löscht einen Eintrag (Trigger in der Datenbank, M60.02).
 *  * Gründer sehen die Einträge des jeweils anderen; eine angestellte Moderationskraft
 *    sieht nur ihre eigenen; BETRIEB sieht alles (Rechte M60).
 *  * Export nur BETRIEB, nur als Ganzes, nur mit Grund — der Export steht selbst im Protokoll (M60.06).
 *  * Wöchentliche Zusammenfassung an beide, auch wenn niemand hinsieht (M60.05).
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { q } from '../../db/pool.js';
import { body, query } from '../../lib/http.js';
import { sendMail } from '../../providers/mail.js';
import { logged, requireStaff, type StaffCtx } from './core.js';

/** Welche Einträge darf diese Person sehen? */
function visibility(s: StaffCtx): { sql: string; params: unknown[] } {
  if (s.role === 'BETRIEB') return { sql: 'TRUE', params: [] };
  if (s.founder) return { sql: `(l.staff_id = $1 OR st.founder)`, params: [s.id] };
  return { sql: `l.staff_id = $1`, params: [s.id] };
}

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? '' : v instanceof Date ? v.toISOString() : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default async function logRoutes(app: FastifyInstance) {
  app.get('/mod-api/log', async (req) => {
    const s = await requireStaff(req);
    const qs = query(req, z.object({ before: z.coerce.number().int().positive().optional() }));
    const v = visibility(s);
    const params = [...v.params];
    let where = v.sql;
    if (qs.before) {
      params.push(qs.before);
      where += ` AND l.id < $${params.length}`;
    }
    const rows = await q(
      `SELECT l.id, l.at, l.case_ref, l.action, l.reason, l.special, l.staff_id, st.name
         FROM access_log l JOIN staff st ON st.id = l.staff_id
        WHERE ${where} ORDER BY l.id DESC LIMIT 100`,
      params,
    );
    return {
      items: rows.map((r) => ({
        id: r.id,
        at: r.at,
        who: r.name,
        caseRef: r.case_ref,
        action: r.action,
        reason: r.reason,
        special: r.special,
        own: r.staff_id === s.id,
      })),
      next: rows.length === 100 ? rows[rows.length - 1].id : null,
    };
  });

  /** M60.06: nur als Ganzes, nur BETRIEB, nur mit Grund. */
  app.post('/mod-api/log/export', async (req, reply) => {
    const s = await requireStaff(req, 'BETRIEB');
    const b = body(req, z.object({ reason: z.string().trim().min(10).max(1000) }));
    const csv = await logged(s, 'protokoll', 'protokoll_exportiert', b.reason, async (c) => {
      const rows = (
        await c.query(
          `SELECT l.id, l.at, st.name, st.role, l.case_ref, l.action, l.reason, l.special FROM access_log l JOIN staff st ON st.id = l.staff_id ORDER BY l.id`,
        )
      ).rows;
      const lines = ['id;zeitpunkt;person;rolle;fall;handlung;begruendung;besonders'];
      for (const r of rows) lines.push([r.id, r.at, r.name, r.role, r.case_ref, r.action, r.reason, r.special ? 'ja' : 'nein'].map(csvCell).join(';'));
      return lines.join('\n');
    }, true);
    reply.header('content-type', 'text/csv; charset=utf-8');
    reply.header('content-disposition', `attachment; filename="zugriffsprotokoll-${new Date().toISOString().slice(0, 10)}.csv"`);
    return reply.send(csv);
  });
}

/** M60.05: Wochenzusammenfassung — Zahl der Fälle, besondere Einträge, gerissene Fristen. */
export async function weeklySummary(): Promise<string> {
  const [cases] = await q(
    `SELECT count(DISTINCT case_ref)::int AS cases, count(*) FILTER (WHERE special)::int AS special, count(*)::int AS entries
       FROM access_log WHERE at > now() - interval '7 days'`,
  );
  const specials = await q(
    `SELECT l.at, st.name, l.case_ref, l.action FROM access_log l JOIN staff st ON st.id = l.staff_id
      WHERE l.special AND l.at > now() - interval '7 days' ORDER BY l.at`,
  );
  const [missed] = await q(
    `SELECT
       (SELECT count(*)::int FROM reports WHERE deadline_at < COALESCE(decided_at, now()) AND created_at > now() - interval '7 days') AS reports,
       (SELECT count(*)::int FROM appeals WHERE deadline_at < COALESCE(decided_at, now()) AND created_at > now() - interval '7 days') AS appeals,
       (SELECT count(*)::int FROM tickets WHERE deadline_at < COALESCE(closed_at, now()) AND created_at > now() - interval '7 days' AND category <> 1) AS tickets,
       (SELECT count(*)::int FROM hash_cases WHERE deadline_at < now() AND status = 'open') AS hash_cases,
       (SELECT count(*)::int FROM place_claims WHERE deadline_at < COALESCE(decided_at, now()) AND created_at > now() - interval '7 days') AS claims`,
  );
  const lines = [
    'Wochenzusammenfassung Zugriffsprotokoll',
    '',
    `Fälle mit Zugriffen: ${cases.cases}`,
    `Einträge gesamt: ${cases.entries}`,
    `Besondere Einträge: ${cases.special}`,
    ...specials.map((x) => `  · ${new Date(x.at).toISOString()} ${x.name} — ${x.case_ref} — ${x.action}`),
    '',
    'Gerissene Fristen:',
    `  Meldungen: ${missed.reports}`,
    `  Einsprüche/Widersprüche: ${missed.appeals}`,
    `  Vorgänge Kontaktservice: ${missed.tickets}`,
    `  Hash-Fälle (offen, überfällig): ${missed.hash_cases}`,
    `  Beanspruchungen: ${missed.claims}`,
  ];
  const text = lines.join('\n');
  const to = env()
    .MOD_REPORT_MAIL.split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  for (const addr of to) await sendMail({ to: addr, subject: 'Wochenzusammenfassung', text });
  // auch im Werkzeug sichtbar, falls keine Adresse hinterlegt ist
  await q(`INSERT INTO staff_notes (staff_id, kind, ref) SELECT id, 'wochenbericht', $1 FROM staff WHERE disabled_at IS NULL AND founder`, [text]);
  return text;
}
