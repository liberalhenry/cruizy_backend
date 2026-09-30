/**
 * M90 · Tagesübersicht und Belastungsschutz — plus Verwaltung (Parameter, Ansprechperson,
 * Rückmeldungen, Kennzahlen).
 *  * Tageszähler „1 von 2“ und Uhrzeitsperre 21 Uhr sind Konstanten, nicht einstellbar (M90.01/02).
 *  * Gesprächserinnerung nach jedem Hash-Fall (M90.04), Quartalsdurchsicht muss quittiert werden (M90.05).
 *  * Ohne Ansprechperson lässt sich der Hash-Abgleich nicht einschalten (M90.06).
 *  * „Abgeben“ erzeugt keine Statistik (M90.08) — es gibt keine Leistungszahlen je Person.
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PARAMETER, allParams, p, setParam, type ParamKey } from '../../config/params.js';
import { one, q } from '../../db/pool.js';
import { decStr } from '../../lib/crypto.js';
import { AppError, bad, notFound } from '../../lib/errors.js';
import { body, idParam, params } from '../../lib/http.js';
import { localParts } from '../../lib/time.js';
import { t } from '../../lib/texts.js';
import { hashProviderConfigured } from '../../providers/checks.js';
import { createNotice } from '../../services/notify.js';
import { rerunPendingHashes } from '../../services/photo-chain.js';
import { HASH_CASES_PER_DAY, afterHashLock, ampel, getSetting, hashCasesToday, logged, requireStaff, setSetting, type StaffCtx } from './core.js';

function quarterOf(d: Date) {
  const l = localParts(d);
  return `${l.year}-Q${Math.floor((l.month - 1) / 3) + 1}`;
}

function quarterStart(d: Date): Date {
  const l = localParts(d);
  const m = Math.floor((l.month - 1) / 3) * 3;
  return new Date(Date.UTC(l.year, m, 1));
}

async function missedInMonth(offset: number): Promise<number> {
  const r = await one(
    `WITH m AS (SELECT date_trunc('month', now() AT TIME ZONE 'Europe/Berlin') - make_interval(months => $1) AS start)
     SELECT
       (SELECT count(*)::int FROM reports, m WHERE created_at >= m.start AND created_at < m.start + interval '1 month' AND deadline_at < COALESCE(decided_at, closed_at, now()))
     + (SELECT count(*)::int FROM appeals, m WHERE created_at >= m.start AND created_at < m.start + interval '1 month' AND deadline_at < COALESCE(decided_at, now()))
     + (SELECT count(*)::int FROM tickets, m WHERE category <> 1 AND created_at >= m.start AND created_at < m.start + interval '1 month' AND deadline_at < COALESCE(closed_at, now()) AND status <> 'beantwortet')
     AS n`,
    [offset],
  );
  return r!.n;
}

async function quarterReview(s: StaffCtx) {
  const start = quarterStart(new Date());
  // $2 muss in jeder Fassung vorkommen, sonst lehnt Postgres die Abfrage ab (BETRIEB sieht alle)
  const visibleStaff = s.role === 'BETRIEB' ? '$2::uuid IS NOT NULL' : s.founder ? '(st.founder OR st.id = $2)' : 'st.id = $2';
  const perPerson = await q(
    `SELECT st.name, count(DISTINCT l.case_ref)::int AS cases, count(*) FILTER (WHERE l.special)::int AS special,
            count(DISTINCT l.case_ref) FILTER (WHERE l.action = 'hash_fall_geoeffnet')::int AS hash_cases
       FROM access_log l JOIN staff st ON st.id = l.staff_id
      WHERE l.at >= $1 AND ${visibleStaff} GROUP BY st.name ORDER BY st.name`,
    [start, s.id],
  );
  const errors = await one(`SELECT count(*)::int AS n FROM appeals WHERE our_error AND decided_at >= $1`, [start]);
  const missed = await one(
    `SELECT (SELECT count(*)::int FROM reports WHERE created_at >= $1 AND deadline_at < COALESCE(decided_at, closed_at, now()))
          + (SELECT count(*)::int FROM appeals WHERE created_at >= $1 AND deadline_at < COALESCE(decided_at, now())) AS n`,
    [start],
  );
  return { quarter: quarterOf(new Date()), perPerson, ourErrors: errors!.n, missedDeadlines: missed!.n };
}

export default async function overviewRoutes(app: FastifyInstance) {
  app.get('/mod-api/overview', async (req) => {
    const s = await requireStaff(req);
    const [queue] = await q(`SELECT count(*)::int AS n, min(queued_at) AS oldest FROM photos WHERE status = 'queued'`);
    const reports = await q(`SELECT created_at, deadline_at, priority FROM reports WHERE status IN ('received','in_review')`);
    const appeals = await q(`SELECT created_at, deadline_at FROM appeals WHERE decided_at IS NULL`);
    const [hash] = await q(`SELECT count(*)::int AS n, count(*) FILTER (WHERE deadline_at < now() + interval '6 hours')::int AS urgent FROM hash_cases WHERE status = 'open'`);
    const [claims] = await q(`SELECT count(*)::int AS n FROM place_claims WHERE status IN ('open','question')`);
    const [subs] = await q(`SELECT (SELECT count(*)::int FROM inbound_mails WHERE status = 'open') + (SELECT count(*)::int FROM events WHERE status = 'pending') AS n`);
    const [susp] = await q(`SELECT count(*)::int AS n FROM suspensions WHERE approved_at IS NULL AND rejected_at IS NULL AND requested_by <> $1`, [s.id]);
    const [appr] = await q(`SELECT count(*)::int AS n FROM mod_approvals WHERE approved_by IS NULL AND rejected_at IS NULL AND requested_by <> $1 AND created_at > now() - interval '1 day'`, [s.id]);
    const [art18] = await q(`SELECT count(*)::int AS n FROM authority_reports WHERE sent_at IS NULL`);
    const tickets = await q(`SELECT pot, category, created_at, deadline_at FROM tickets WHERE status NOT IN ('abgeschlossen','beantwortet')`);
    const pots = ['missbrauch', 'hilfe', 'datenschutz', 'behoerden'].map((pot) => {
      const rows = tickets.filter((r) => r.pot === pot);
      return {
        pot,
        open: rows.length,
        oldest: rows.reduce<Date | null>((m, r) => (!m || r.created_at < m ? r.created_at : m), null),
        red: rows.filter((r) => r.category === 1 || ampel(new Date(r.created_at), new Date(r.deadline_at)) === 'rot').length,
      };
    });

    // Tageszähler aller Personen — sichtbar nur zwischen den Gründern und für BETRIEB
    const staff = await q(`SELECT id, name, founder FROM staff WHERE disabled_at IS NULL`);
    const counters = [];
    for (const st of staff) {
      if (st.id !== s.id && s.role !== 'BETRIEB' && !(s.founder && st.founder)) continue;
      counters.push({ name: st.name, own: st.id === s.id, hashToday: await hashCasesToday(st.id) });
    }
    const allAtLimit = counters.length > 0 && staff.length === counters.length && counters.every((c) => c.hashToday >= HASH_CASES_PER_DAY);

    // Quartalsdurchsicht: erscheint automatisch und muss quittiert werden
    const acked = await one(`SELECT 1 FROM staff_notes WHERE staff_id = $1 AND kind = 'quartal_quittiert' AND ref = $2`, [s.id, quarterOf(new Date())]);
    const quarterDue = !acked && (await one(`SELECT 1 FROM access_log WHERE at < $1 LIMIT 1`, [quarterStart(new Date())]));

    const lastMonth = await missedInMonth(1);
    const monthBefore = await missedInMonth(2);
    const weekly = await one(`SELECT ref, at FROM staff_notes WHERE staff_id = $1 AND kind = 'wochenbericht' ORDER BY at DESC LIMIT 1`, [s.id]);
    const contact = await getSetting<{ name: string; phone: string }>('ansprechperson');

    return {
      me: { name: s.name, role: s.role, hashToday: await hashCasesToday(s.id), hashLimit: HASH_CASES_PER_DAY, hashLocked: afterHashLock() },
      counters,
      // M90, Zustände: beide an der Tagesgrenze → Übergabe an die Beschwerdestelle anbieten
      offerHandover: allAtLimit,
      queue: { open: queue.n, oldest: queue.oldest },
      reports: {
        open: reports.length,
        priority: reports.filter((r) => r.priority).length,
        red: reports.filter((r) => ampel(new Date(r.created_at), new Date(r.deadline_at)) === 'rot').length,
      },
      appeals: { open: appeals.length, red: appeals.filter((r) => Date.now() - new Date(r.created_at).getTime() >= 40 * 3600_000).length },
      hashCases: { open: hash.n, urgent: hash.urgent, zone2Active: p('P-ZONE2-ABGLEICH'), hashActive: p('P-HASH-AKTIV') },
      claims: claims.n,
      submissions: subs.n,
      // Issue #16
      organizerApplications: (await one(`SELECT count(*)::int AS n FROM organizers WHERE status = 'beantragt'`))!.n,
      eventsUnchecked: (await one(`SELECT count(*)::int AS n FROM events WHERE status = 'approved' AND checked_at IS NULL AND ends_at > now()`))!.n,
      suspensionsToApprove: susp.n,
      approvalsToGive: appr.n,
      art18Drafts: art18.n,
      pots,
      dangerTickets: tickets.filter((r) => r.category === 1).length,
      // „Ein Tag mit einer roten Frist ist kein normaler Tag.“
      redDay: pots.some((x) => x.red > 0) || reports.some((r) => ampel(new Date(r.created_at), new Date(r.deadline_at)) === 'rot'),
      // Abbruchkriterium: zwei Monate in Folge gerissene Fristen
      stopExpansion: lastMonth > 0 && monthBefore > 0,
      quarterReview: quarterDue ? await quarterReview(s) : null,
      weeklySummary: weekly ? { at: weekly.at, text: weekly.ref } : null,
      contactPerson: contact,
      emergency: [t('UI-MOD-NOTFALL-1'), t('UI-MOD-NOTFALL-2')],
    };
  });

  /** M90.04: Gesprächserinnerung bestätigt — wird im Fall vermerkt. */
  app.post('/mod-api/overview/talk', async (req) => {
    const s = await requireStaff(req);
    const b = body(req, z.object({ caseRef: z.string().max(40) }));
    await q(`INSERT INTO staff_notes (staff_id, kind, ref) VALUES ($1, 'gespraech', $2)`, [s.id, b.caseRef]);
    return { ok: true };
  });

  /** M90.05: Quartalsdurchsicht quittieren. */
  app.post('/mod-api/overview/quarter/ack', async (req) => {
    const s = await requireStaff(req);
    await q(`INSERT INTO staff_notes (staff_id, kind, ref) VALUES ($1, 'quartal_quittiert', $2)`, [s.id, quarterOf(new Date())]);
    return { ok: true };
  });

  app.get('/mod-api/overview/quarter', async (req) => {
    const s = await requireStaff(req);
    return quarterReview(s);
  });

  // ───── M90.06 Ansprechperson ─────
  app.put('/mod-api/settings/contact', async (req) => {
    const s = await requireStaff(req, 'BETRIEB');
    const b = body(req, z.object({ name: z.string().trim().min(2).max(100), phone: z.string().trim().min(5).max(40) }));
    await logged(s, 'einstellung:ansprechperson', 'ansprechperson_gesetzt', 'Ansprechperson hinterlegt', async (c) => {
      await setSetting('ansprechperson', b, c);
    });
    return { ok: true };
  });

  // ───── Parameter (BETRIEB) ─────
  app.get('/mod-api/params', async (req) => {
    await requireStaff(req, 'BETRIEB');
    return { params: allParams(), hashProvider: hashProviderConfigured(), contactSet: !!(await getSetting('ansprechperson')) };
  });

  app.put('/mod-api/params/:key', async (req) => {
    const s = await requireStaff(req, 'BETRIEB');
    const { key } = params(req, z.object({ key: z.string().regex(/^P-[A-Z0-9-]+$/) }));
    const b = body(req, z.object({ value: z.unknown(), reason: z.string().trim().min(5).max(500) }));
    if (!(key in PARAMETER)) throw notFound();
    const def = PARAMETER[key as ParamKey].wert as unknown;
    const value = b.value;
    const sameType =
      Array.isArray(def) ? Array.isArray(value) : def !== null && typeof def === 'object' ? typeof value === 'object' && value !== null && !Array.isArray(value) : typeof value === typeof def;
    if (!sameType) throw bad('UI-MOD-PARAMETER-TYP', {}, 'typ');
    if (typeof value === 'number' && (!Number.isFinite(value) || value < 0)) throw bad('UI-MOD-PARAMETER-TYP', {}, 'typ');
    if (key === 'P-HASH-AKTIV' && value === true) {
      // M90.06: ohne Ansprechperson kein Hash-Abgleich
      if (!(await getSetting('ansprechperson'))) throw new AppError(409, 'UI-MOD-ANSPRECHPERSON-FEHLT', {}, 'ansprechperson_fehlt');
      if (!hashProviderConfigured()) throw new AppError(409, 'UI-MOD-ABGLEICH-FEHLT', {}, 'abgleich_fehlt');
    }
    await logged(s, `parameter:${key}`, 'parameter_geaendert', `${JSON.stringify(value)} — ${b.reason}`, async (c) => {
      await c.query(
        `INSERT INTO parameters (key, value, updated_by) VALUES ($1, $2, $3) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now(), updated_by = EXCLUDED.updated_by`,
        [key, JSON.stringify(value), s.id],
      );
    }, true);
    setParam(key as ParamKey, value as never);
    // AK-M02-12: sobald angebunden, laufen die ausstehenden Bilder nach
    if (key === 'P-HASH-AKTIV' && value === true) rerunPendingHashes().catch(() => {});
    return { ok: true };
  });

  // ───── Rückmeldungen (Z-07) ─────
  app.get('/mod-api/feedback', async (req) => {
    await requireStaff(req);
    const rows = await q(`SELECT id, text_enc, wants_reply, created_at, answered_at FROM feedback ORDER BY created_at DESC LIMIT 200`);
    return { items: rows.map((r) => ({ id: r.id, text: decStr('tickets', r.text_enc, 'feedback'), wantsReply: r.wants_reply, createdAt: r.created_at, answeredAt: r.answered_at })) };
  });

  app.post('/mod-api/feedback/:id/answer', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ text: z.string().trim().min(5).max(3000) }));
    const f = await one(`SELECT account_id, wants_reply, answered_at FROM feedback WHERE id = $1`, [id]);
    if (!f || !f.wants_reply || !f.account_id || f.answered_at) throw notFound();
    await logged(s, `rueckmeldung:${id}`, 'rueckmeldung_beantwortet', 'Antwort auf Rückmeldung', async (c) => {
      await c.query(`UPDATE feedback SET answered_at = now() WHERE id = $1`, [id]);
    });
    await createNotice(f.account_id, 'rueckmeldung_antwort', t('UI-RUECKMELDUNG-ANTWORT'), b.text);
    return { ok: true };
  });

  // ───── Kennzahlen (Q-16) — nur Summen, keine Personen ─────
  app.get('/mod-api/metrics', async (req) => {
    await requireStaff(req, 'BETRIEB');
    const [live] = await q(
      `SELECT
         (SELECT count(DISTINCT account_id)::int FROM metric_events WHERE kind = 'app_open' AND at > now() - interval '30 days') AS mau,
         (SELECT count(DISTINCT account_id)::int FROM metric_events WHERE kind = 'app_open' AND at > now() - interval '7 days') AS wau,
         (SELECT count(DISTINCT account_id)::int FROM metric_events WHERE kind = 'app_open' AND at > now() - interval '1 day') AS dau,
         (SELECT count(*)::int FROM metric_events WHERE kind = 'user_created' AND at > now() - interval '30 days') AS new_30d,
         (SELECT count(*)::int FROM metric_events WHERE kind = 'message_sent' AND at > now() - interval '1 day') AS messages_24h,
         (SELECT count(*)::int FROM metric_events WHERE kind = 'contact' AND at > now() - interval '30 days') AS contacts_30d,
         (SELECT count(*)::int FROM accounts WHERE status = 'active') AS accounts,
         (SELECT count(*)::int FROM accounts WHERE age1_at IS NOT NULL) AS verified`,
    );
    const archive = await q(`SELECT month, data FROM metrics_archive ORDER BY month DESC LIMIT 24`);
    return {
      live,
      // Schwellen aus den Parametern — zur Einordnung
      thresholds: { e2ee: p('P-E2EE-MAU'), payments: p('P-BEZAHL-MAU'), capacity: p('P-AUSLASTUNG-MAU') },
      archive,
    };
  });
}
