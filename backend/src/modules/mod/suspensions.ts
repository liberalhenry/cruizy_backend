/**
 * M40 · Kontosperre mit Freigabe durch zwei Personen.
 *  * Die einzige Stelle, an der ein Konto eingeschränkt oder gesperrt wird.
 *  * Ohne Bezug (Meldung oder Hash-Fall) keine Sperre (M40.03).
 *  * Freigabe nie durch die antragstellende Person — auch nicht über eine zweite
 *    Sitzung, auch nicht als BETRIEB, kein Notfallzugang (M40.04, Zusage 3).
 *    Zusätzlich erzwingt die Datenbank approved_by <> requested_by.
 *  * Eine abgelehnte Freigabe bleibt dauerhaft im Fall (M40.05).
 *  * Keine automatische Sperre (Art. 22 DSGVO).
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { p } from '../../config/params.js';
import { one, q, type Queryable } from '../../db/pool.js';
import { AppError, bad, conflict, notFound } from '../../lib/errors.js';
import { body, idParam, params } from '../../lib/http.js';
import { t } from '../../lib/texts.js';
import { closeAllFor, emit } from '../../services/hub.js';
import { createNotice } from '../../services/notify.js';
import { logged, requireStaff } from './core.js';
import { informParties } from './reports.js';

const ACTIONS = ['restrict', 'suspend', 'suspend_delete', 'lift'] as const;
type Action = (typeof ACTIONS)[number];

const STATE_FOR: Record<Action, 'none' | 'restricted' | 'suspended'> = {
  restrict: 'restricted',
  suspend: 'suspended',
  suspend_delete: 'suspended',
  lift: 'none',
};

async function resolveCase(ref: string, c?: Queryable) {
  const r = await one(`SELECT id, number, target_id FROM reports WHERE number = $1`, [ref.trim()], c);
  if (r) return { reportId: r.id as string, hashCaseId: null, accountId: r.target_id as string | null, number: r.number as string };
  const h = await one(`SELECT id, number, account_ref FROM hash_cases WHERE number = $1`, [ref.trim()], c);
  if (h) return { reportId: null, hashCaseId: h.id as string, accountId: h.account_ref as string | null, number: h.number as string };
  return null;
}

/** Wirkung einer freigegebenen Entscheidung — nur aus approve() heraus aufrufbar. */
async function applySuspension(c: Queryable, s: { id: string; account_id: string; action: Action; approved_at?: Date }) {
  await c.query(`UPDATE accounts SET moderation_state = $2 WHERE id = $1`, [s.account_id, STATE_FOR[s.action]]);
  if (s.action === 'suspend_delete') {
    // Löschen nur nach Ablauf aller Fristen (M40.01): Widerspruchsfrist + Karenz
    await c.query(
      `UPDATE accounts SET deletion_requested_at = COALESCE(deletion_requested_at, now()),
              deletion_due_at = GREATEST(COALESCE(deletion_due_at, now()), now() + make_interval(secs => $2)) WHERE id = $1`,
      [s.account_id, p('P-FRIST-WIDERSPRUCH') + p('P-KARENZ')],
    );
  }
  if (s.action === 'lift') {
    // Aufhebung stellt vollständig her (M50.07) — auch eine durch Sperre ausgelöste Löschung
    const last = (
      await c.query(
        `SELECT approved_at FROM suspensions WHERE account_id = $1 AND action = 'suspend_delete' AND approved_at IS NOT NULL ORDER BY approved_at DESC LIMIT 1`,
        [s.account_id],
      )
    ).rows[0];
    if (last) {
      await c.query(
        `UPDATE accounts SET deletion_requested_at = NULL, deletion_due_at = NULL WHERE id = $1 AND deletion_requested_at >= $2 - interval '1 second'`,
        [s.account_id, last.approved_at],
      );
    }
    await c.query(`UPDATE accounts SET hash_restricted_at = NULL WHERE id = $1`, [s.account_id]);
  }
}

export default async function suspensionRoutes(app: FastifyInstance) {
  app.get('/mod-api/suspensions', async (req) => {
    const s = await requireStaff(req);
    const rows = await q(
      `SELECT su.*, r.number AS report_number, h.number AS hash_number, rq.name AS requested_name, ap.name AS approved_name, rj.name AS rejected_name
         FROM suspensions su
         LEFT JOIN reports r ON r.id = su.report_id
         LEFT JOIN hash_cases h ON h.id = su.hash_case_id
         JOIN staff rq ON rq.id = su.requested_by
         LEFT JOIN staff ap ON ap.id = su.approved_by
         LEFT JOIN staff rj ON rj.id = su.rejected_by
        WHERE (su.approved_at IS NULL AND su.rejected_at IS NULL) OR su.requested_at > now() - interval '30 days'
        ORDER BY (su.approved_at IS NULL AND su.rejected_at IS NULL) DESC, su.requested_at DESC`,
    );
    return {
      items: rows.map((r) => ({
        id: r.id,
        action: r.action,
        reason: r.reason,
        caseRef: r.report_number ?? r.hash_number,
        reportId: r.report_id,
        requestedBy: r.requested_name,
        requestedAt: r.requested_at,
        approvedBy: r.approved_name,
        approvedAt: r.approved_at,
        rejectedBy: r.rejected_name,
        rejectedAt: r.rejected_at,
        rejectionReason: r.rejection_reason,
        state: r.approved_at ? 'wirksam' : r.rejected_at ? 'abgelehnt' : 'entwurf',
        // die zweite Person — nie die antragstellende (M40.04)
        canDecide: !r.approved_at && !r.rejected_at && r.requested_by !== s.id,
      })),
    };
  });

  /** M40.01–03: Antrag. Ohne Bezug keine Sperre. */
  app.post('/mod-api/suspensions', async (req) => {
    const s = await requireStaff(req);
    const b = body(
      req,
      z.object({
        action: z.enum(ACTIONS),
        reason: z.string().trim().min(10).max(2000),
        caseRef: z.string().trim().min(3).max(40),
      }),
    );
    const cs = await resolveCase(b.caseRef);
    if (!cs) throw bad('UI-MOD-BEZUG-FEHLT', {}, 'bezug_fehlt');
    if (!cs.accountId) throw bad('UI-MOD-KEIN-KONTO', {}, 'kein_konto');
    const acc = await one(`SELECT moderation_state FROM accounts WHERE id = $1`, [cs.accountId]);
    if (!acc) throw bad('UI-MOD-KEIN-KONTO', {}, 'kein_konto');
    if (b.action === 'lift' && acc.moderation_state === 'none') throw bad('UI-MOD-NICHTS-AUFZUHEBEN');
    const open = await one(`SELECT 1 FROM suspensions WHERE account_id = $1 AND approved_at IS NULL AND rejected_at IS NULL`, [cs.accountId]);
    if (open) throw conflict('UI-MOD-ANTRAG-OFFEN');
    // Freigabe abgelehnt → ein neuer Anlauf braucht einen neuen Grund (M40, Zustände)
    const same = await one(`SELECT 1 FROM suspensions WHERE account_id = $1 AND rejected_at IS NOT NULL AND lower(reason) = lower($2)`, [cs.accountId, b.reason]);
    if (same) throw bad('UI-MOD-NEUER-GRUND', {}, 'neuer_grund');
    return logged(s, cs.number, `sperre_beantragt_${b.action}`, b.reason, async (c) => {
      const row = (
        await c.query(
          `INSERT INTO suspensions (account_id, action, reason, report_id, hash_case_id, requested_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [cs.accountId, b.action, b.reason, cs.reportId, cs.hashCaseId, s.id],
        )
      ).rows[0];
      if (cs.reportId) await c.query(`INSERT INTO report_events (report_id, status, note) VALUES ($1, 'sperre_beantragt', $2)`, [cs.reportId, b.action]);
      return { id: row.id, state: 'entwurf' };
    }, true);
  });

  /** M40.04: die zweite Person sieht denselben Fall. */
  app.get('/mod-api/suspensions/:id', async (req) => {
    await requireStaff(req);
    const { id } = params(req, idParam);
    const su = await one(
      `SELECT su.*, r.number AS report_number, r.reason AS report_reason, h.number AS hash_number, a.moderation_state, a.created_at AS account_created
         FROM suspensions su LEFT JOIN reports r ON r.id = su.report_id LEFT JOIN hash_cases h ON h.id = su.hash_case_id
         LEFT JOIN accounts a ON a.id = su.account_id WHERE su.id = $1`,
      [id],
    );
    if (!su) throw notFound();
    const history = await q(
      `SELECT action, reason, requested_at, approved_at, rejected_at, rejection_reason FROM suspensions WHERE account_id = $1 AND id <> $2 ORDER BY requested_at DESC`,
      [su.account_id, id],
    );
    return {
      id: su.id,
      action: su.action,
      reason: su.reason,
      caseRef: su.report_number ?? su.hash_number,
      reportId: su.report_id,
      reportReason: su.report_reason,
      accountState: su.moderation_state,
      accountAgeDays: su.account_created ? Math.floor((Date.now() - new Date(su.account_created).getTime()) / 86400000) : null,
      history,
    };
  });

  /** M40.04/06: Freigabe durch die zweite Person — erst dann wirkt die Entscheidung. */
  app.post('/mod-api/suspensions/:id/approve', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ reason: z.string().trim().min(1).max(2000) }));
    const su = await one(`SELECT * FROM suspensions WHERE id = $1`, [id]);
    if (!su || su.approved_at || su.rejected_at) throw notFound();
    // Kein Umweg: dieselbe Kennung — gleich welche Sitzung, gleich welche Rolle — gibt nie frei.
    if (su.requested_by === s.id) throw new AppError(403, 'UI-MOD-EIGENER-ANTRAG', {}, 'eigener_antrag');
    if (!su.account_id) throw bad('UI-MOD-KEIN-KONTO', {}, 'kein_konto');
    const ref = su.report_id ? (await one(`SELECT number FROM reports WHERE id = $1`, [su.report_id]))?.number : (await one(`SELECT number FROM hash_cases WHERE id = $1`, [su.hash_case_id]))?.number;
    const effectiveAt = await logged(s, ref ?? `sperre:${id}`, `sperre_freigegeben_${su.action}`, b.reason, async (c) => {
      const upd = (
        await c.query(
          `UPDATE suspensions SET approved_by = $2, approved_at = now() WHERE id = $1 AND approved_at IS NULL AND rejected_at IS NULL AND requested_by <> $2 RETURNING approved_at`,
          [id, s.id],
        )
      ).rows[0];
      if (!upd) throw notFound();
      await applySuspension(c, { id, account_id: su.account_id, action: su.action });
      if (su.report_id && su.action !== 'lift') {
        await c.query(
          `UPDATE reports SET status = 'decided', decision = $2, decided_at = now(), decided_by = $3 WHERE id = $1 AND status IN ('received','in_review')`,
          [su.report_id, su.action === 'restrict' ? 'eingeschraenkt' : 'gesperrt', su.requested_by],
        );
        await c.query(`INSERT INTO report_events (report_id, status, note) VALUES ($1, 'decided', $2)`, [su.report_id, su.action]);
      }
      return upd.approved_at as Date;
    }, true);

    // M40.06: Mitteilung mit Zeitpunkt, Widerspruchsweg und Frist
    const hours = Math.round(p('P-FRIST-WIDERSPRUCH') / 3600);
    if (su.action === 'lift') {
      await createNotice(su.account_id, 'wiederherstellung', t('UI-SPERRE-AUFGEHOBEN-TITEL'), t('UI-SPERRE-AUFGEHOBEN-TEXT'), id);
    } else {
      const what = su.action === 'restrict' ? t('UI-DEIN-KONTO-EINGESCHRAENKT') : t('UI-DEIN-KONTO-GESPERRT');
      await createNotice(
        su.account_id,
        'sperre',
        t('UI-SPERRE-TITEL'),
        `${t('ST-MEL-23', { inhalt: what, begruendung: su.reason })}\n\n${t('UI-SPERRE-AB', { zeit: new Date(effectiveAt).toISOString() })}\n${t('UI-WIDERSPRUCH-FRIST', { stunden: hours })}${su.action === 'suspend_delete' ? `\n${t('UI-SPERRE-LOESCHUNG')}` : ''}`,
        id,
      );
      emit(su.account_id, 'konto', { moderation: STATE_FOR[su.action as Action] });
      if (su.action !== 'restrict') closeAllFor(su.account_id);
    }
    if (su.report_id && su.action !== 'lift') await informParties(su.report_id);
    return { ok: true, effectiveAt };
  });

  /** M40.05: Ablehnung der Freigabe — mit Begründung, bleibt im Fall. */
  app.post('/mod-api/suspensions/:id/reject', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ reason: z.string().trim().min(10).max(2000) }));
    const su = await one(`SELECT * FROM suspensions WHERE id = $1`, [id]);
    if (!su || su.approved_at || su.rejected_at) throw notFound();
    if (su.requested_by === s.id) throw new AppError(403, 'UI-MOD-EIGENER-ANTRAG', {}, 'eigener_antrag');
    const ref = su.report_id ? (await one(`SELECT number FROM reports WHERE id = $1`, [su.report_id]))?.number : `sperre:${id}`;
    await logged(s, ref ?? `sperre:${id}`, 'sperre_freigabe_abgelehnt', b.reason, async (c) => {
      await c.query(`UPDATE suspensions SET rejected_by = $2, rejected_at = now(), rejection_reason = $3 WHERE id = $1`, [id, s.id, b.reason]);
      if (su.report_id) {
        // der Meldefall ist wieder offen für eine Entscheidung; die Ablehnung steht im Verlauf
        await c.query(`UPDATE reports SET decision = NULL, decision_reason = NULL WHERE id = $1 AND status IN ('received','in_review')`, [su.report_id]);
        await c.query(`INSERT INTO report_events (report_id, status, note) VALUES ($1, 'sperre_abgelehnt', $2)`, [su.report_id, b.reason]);
      }
    }, true);
    return { ok: true };
  });
}

export { applySuspension };
