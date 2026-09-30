/**
 * Werkzeug · Cruizy Date (Issue #19): Mitglieder und Verifizierungsstatus, Date-Zugang sperren und
 * entsperren (nur Date — der Hauptbereich bleibt), Date-Fotos prüfen (immer jugendfrei), Date-Meldungen.
 * Jede Handlung mit Grund im Zugriffsprotokoll.
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one, q } from '../../db/pool.js';
import { deleteFile } from '../../lib/files.js';
import { notFound } from '../../lib/errors.js';
import { body, idParam, params, query } from '../../lib/http.js';
import { t } from '../../lib/texts.js';
import { suspendDate, tryActivate } from '../../services/date.js';
import { createNotice } from '../../services/notify.js';
import { logged, requireStaff } from './core.js';
import { modImgUrl } from './index.js';

export default async function dateModRoutes(app: FastifyInstance) {
  app.get('/mod-api/date/overview', async (req) => {
    await requireStaff(req);
    const counts = await q(`SELECT status, count(*)::int AS n FROM date_access GROUP BY status`);
    const photos = await one(`SELECT count(*)::int AS n FROM date_photos WHERE status = 'queued'`);
    const reports = await one(`SELECT count(*)::int AS n FROM reports WHERE reason = 'passt_nicht_zu_date' AND status NOT IN ('decided','closed')`);
    const waitlist = await q(`SELECT coalesce(c.name, '—') AS city, count(*)::int AS n FROM date_waitlist w LEFT JOIN cities c ON c.id = w.city_id GROUP BY c.name ORDER BY n DESC LIMIT 20`);
    return { status: Object.fromEntries(counts.map((c) => [c.status, c.n])), photosQueued: photos!.n, reportsOpen: reports!.n, waitlist };
  });

  app.get('/mod-api/date/members', async (req) => {
    await requireStaff(req);
    const qs = query(req, z.object({ status: z.enum(['onboarding', 'aktiv', 'pausiert', 'gesperrt']).default('aktiv') }));
    const rows = await q(
      `SELECT da.account_id, da.status, da.verified_at, da.verification_provider, da.verification_result, da.suspended_at, da.suspended_reason,
              da.created_at, da.activated_at, da.last_active_at, pr.name,
              (SELECT count(*)::int FROM reports r WHERE r.target_id = da.account_id AND r.reason = 'passt_nicht_zu_date') AS reports,
              (SELECT count(*)::int FROM reports r WHERE r.target_id = da.account_id AND r.decision = 'date_verstoss') AS upheld
         FROM date_access da JOIN profiles pr ON pr.account_id = da.account_id
        WHERE da.status = $1 ORDER BY da.created_at DESC LIMIT 300`,
      [qs.status],
    );
    return {
      items: rows.map((r) => ({
        id: r.account_id,
        name: r.name,
        status: r.status,
        verification: { at: r.verified_at, provider: r.verification_provider, result: r.verification_result },
        suspended: r.suspended_at ? { at: r.suspended_at, reason: r.suspended_reason } : null,
        since: r.created_at,
        activatedAt: r.activated_at,
        lastActive: r.last_active_at,
        reports: r.reports,
        upheld: r.upheld,
      })),
    };
  });

  /** Issue #33: alle Date-Fotos eines Mitglieds mit Status — für die Prüfung im Werkzeug. */
  app.get('/mod-api/date/members/:id/photos', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const rows = await q(
      `SELECT id, file, status, position, created_at FROM date_photos WHERE account_id = $1 AND status <> 'rejected' ORDER BY position, created_at`,
      [id],
    );
    return { items: rows.map((r) => ({ id: r.id, status: r.status, at: r.created_at, image: modImgUrl('zone1-public', r.file, s.id) })) };
  });

  app.post('/mod-api/date/members/:id/suspend', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ reason: z.string().trim().min(5).max(1000) }));
    const acc = await one(`SELECT status FROM date_access WHERE account_id = $1`, [id]);
    if (!acc || acc.status === 'gesperrt') throw notFound();
    await logged(s, `date:${id}`, 'date_gesperrt', b.reason, async () => {
      await suspendDate(id, b.reason, s.id);
    });
    return { ok: true };
  });

  app.post('/mod-api/date/members/:id/unsuspend', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ reason: z.string().trim().min(5).max(1000) }));
    await logged(s, `date:${id}`, 'date_entsperrt', b.reason, async (c) => {
      const r = await c.query(
        `UPDATE date_access SET status = CASE WHEN activated_at IS NULL THEN 'onboarding' ELSE 'aktiv' END, suspended_at = NULL, suspended_reason = NULL, suspended_by = NULL, last_active_at = now()
          WHERE account_id = $1 AND status = 'gesperrt'`,
        [id],
      );
      if (!r.rowCount) throw notFound();
    });
    await createNotice(id, 'date', t('UI-DATE-N-ENTSPERRT-TITEL'), t('UI-DATE-N-ENTSPERRT'), null);
    return { ok: true };
  });

  // ───── Date-Fotos (Grauzone des Klassifikators, ohne Dienst: alle) ─────
  app.get('/mod-api/date/photos', async (req) => {
    const s = await requireStaff(req);
    const rows = await q(
      `SELECT ph.id, ph.account_id, ph.file, ph.created_at, ph.position, pr.name
         FROM date_photos ph LEFT JOIN profiles pr ON pr.account_id = ph.account_id
        WHERE ph.status = 'queued' ORDER BY ph.created_at LIMIT 100`,
    );
    return {
      items: rows.map((r) => ({ id: r.id, account: r.account_id, name: r.name, position: r.position, at: r.created_at, image: modImgUrl('zone1-public', r.file, s.id) })),
    };
  });

  app.post('/mod-api/date/photos/:id/decide', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ decision: z.enum(['freigeben', 'ablehnen']), reason: z.string().trim().min(3).max(500) }));
    const ph = await one(`SELECT account_id, file FROM date_photos WHERE id = $1 AND status = 'queued'`, [id]);
    if (!ph) throw notFound();
    await logged(s, `date-foto:${id}`, `date_foto_${b.decision}`, b.reason, async (c) => {
      await c.query(`UPDATE date_photos SET status = $2, decided_at = now() WHERE id = $1`, [id, b.decision === 'freigeben' ? 'approved' : 'rejected']);
    });
    if (b.decision === 'ablehnen') {
      await deleteFile('zone1-public', ph.file);
      await createNotice(ph.account_id, 'date', t('UI-DATE-N-FOTO-ABGELEHNT-TITEL'), t('UI-DATE-N-FOTO-ABGELEHNT'), null);
    } else {
      await tryActivate(ph.account_id);
    }
    return { ok: true };
  });

  app.get('/mod-api/date/reports', async (req) => {
    await requireStaff(req);
    const rows = await q(
      `SELECT r.id, r.number, r.status, r.created_at, r.target_id, r.decision, pr.name
         FROM reports r LEFT JOIN profiles pr ON pr.account_id = r.target_id
        WHERE r.reason = 'passt_nicht_zu_date' ORDER BY (r.status IN ('decided','closed')), r.created_at DESC LIMIT 200`,
    );
    return { items: rows.map((r) => ({ id: r.id, number: r.number, status: r.status, at: r.created_at, target: r.target_id ? { id: r.target_id, name: r.name } : null, decision: r.decision })) };
  });
}
