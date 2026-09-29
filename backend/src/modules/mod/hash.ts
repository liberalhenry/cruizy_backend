/**
 * M30 · Hash-Treffer-Fall — so gebaut, dass niemand ein Bild ansehen muss.
 *  * Kein Bildverweis in der Fallansicht (Zusage 4, AK-M04-02).
 *  * Hashwert im Klartext nur für BETRIEB (M30.03).
 *  * Höchstens zwei Hash-Fälle je Person und Tag, keine ab 21 Uhr (M90.01/02) — Sperren, nicht einstellbar.
 *  * Datei ansehen nur mit schriftlichem Grund und zweiter Person (M30.08).
 *  * Es gibt keine Schaltfläche „Datei löschen“.
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { p } from '../../config/params.js';
import { one, q } from '../../db/pool.js';
import { AppError, notFound } from '../../lib/errors.js';
import { body, idParam, params, uuid } from '../../lib/http.js';
import { HASH_CASES_PER_DAY, afterHashLock, hashCasesToday, logged, requireStaff } from './core.js';
import { modImgUrl } from './index.js';

export default async function hashRoutes(app: FastifyInstance) {
  app.get('/mod-api/hash-cases', async (req) => {
    await requireStaff(req);
    const rows = await q(`SELECT id, number, zone, status, created_at, deadline_at, assigned_to FROM hash_cases WHERE status = 'open' ORDER BY created_at`);
    return {
      // Zone 2 mit ausgeschaltetem Schalter: dieser Fall entsteht gar nicht (⚠ Nr. 30)
      zone2Active: p('P-ZONE2-ABGLEICH'),
      hashActive: p('P-HASH-AKTIV'),
      items: rows.map((r) => ({ id: r.id, number: r.number, zone: r.zone, createdAt: r.created_at, deadlineAt: r.deadline_at, assignedTo: r.assigned_to })),
    };
  });

  app.post('/mod-api/hash-cases/:id/open', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ reason: z.string().default('Bearbeitung Hash-Treffer') }));
    const hc = await one(`SELECT * FROM hash_cases WHERE id = $1`, [id]);
    if (!hc) throw notFound();
    const already = await one(`SELECT 1 FROM access_log WHERE staff_id = $1 AND case_ref = $2 AND action = 'hash_fall_geoeffnet' AND at::date = now()::date`, [s.id, hc.number]);
    if (afterHashLock()) throw new AppError(403, 'UI-MOD-NACH-21', {}, 'uhrzeitsperre');
    if (!already && (await hashCasesToday(s.id)) >= HASH_CASES_PER_DAY) throw new AppError(403, 'UI-MOD-TAGESGRENZE', {}, 'tagesgrenze');
    return logged(s, hc.number, 'hash_fall_geoeffnet', b.reason, async (c) => {
      const same = (await c.query(`SELECT count(*)::int AS n FROM hash_cases WHERE hash_value = $1 AND id <> $2`, [hc.hash_value, id])).rows[0];
      return {
        case: {
          id: hc.id,
          number: hc.number,
          createdAt: hc.created_at,
          zone: hc.zone,
          account: hc.account_ref,
          status: hc.status,
          list: hc.list_name,
          hash: s.role === 'BETRIEB' ? hc.hash_value : undefined,
          sameHashUploads: same.n,
          deadlineAt: hc.deadline_at,
          done: ['Inhalt gesperrt', 'Datei gesichert', 'Fall eröffnet', 'beide benachrichtigt'],
          restrictAllowed: p('P-TREFFER-EINSCHRAENKUNG'),
        },
        // bewusst: kein Bildverweis
      };
    });
  });

  app.post('/mod-api/hash-cases/:id/view/request', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ reason: z.string().min(20) }));
    const hc = await one(`SELECT number FROM hash_cases WHERE id = $1`, [id]);
    if (!hc) throw notFound();
    return logged(s, hc.number, 'datei_ansicht_beantragt', b.reason, async (c) => {
      const r = (await c.query(`INSERT INTO mod_approvals (kind, ref, requested_by, reason) VALUES ('datei', $1, $2, $3) RETURNING id`, [id, s.id, b.reason])).rows[0];
      return { approvalId: r.id };
    }, true);
  });

  app.post('/mod-api/hash-cases/:id/view', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ approvalId: uuid, reason: z.string().min(1) }));
    if (afterHashLock()) throw new AppError(403, 'UI-MOD-NACH-21', {}, 'uhrzeitsperre');
    const ap = await one(
      `SELECT * FROM mod_approvals WHERE id = $1 AND kind = 'datei' AND ref = $2 AND requested_by = $3 AND approved_by IS NOT NULL AND approved_at > now() - interval '30 minutes'`,
      [b.approvalId, id, s.id],
    );
    if (!ap) throw new AppError(403, 'UI-MOD-ZWEITE-PERSON', {}, 'freigabe_fehlt');
    const hc = await one(`SELECT number, sealed_file FROM hash_cases WHERE id = $1`, [id]);
    return logged(s, hc!.number, 'datei_angesehen', b.reason, async () => ({ image: modImgUrl('sealed', hc!.sealed_file, s.id) }), true);
  });

  app.post('/mod-api/hash-cases/:id/status', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ status: z.enum(['false_positive', 'closed']), reason: z.string().min(5) }));
    const hc = await one(`SELECT number FROM hash_cases WHERE id = $1`, [id]);
    if (!hc) throw notFound();
    await logged(s, hc.number, `hash_${b.status}`, b.reason, async (c) => {
      await c.query(`UPDATE hash_cases SET status = $2 WHERE id = $1`, [id, b.status]);
    });
    return { ok: true };
  });

  /** M30.10 / M90.08: „Ich kann das gerade nicht“ — ohne Begründungszwang, ohne Zähler. */
  app.post('/mod-api/hash-cases/:id/handover', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const hc = await one(`SELECT number FROM hash_cases WHERE id = $1`, [id]);
    if (!hc) throw notFound();
    await logged(s, hc.number, 'zustaendigkeit_abgegeben', 'Abgabe', async (c) => {
      const other = (await c.query(`SELECT id FROM staff WHERE id <> $1 AND disabled_at IS NULL ORDER BY founder DESC LIMIT 1`, [s.id])).rows[0];
      await c.query(`UPDATE hash_cases SET assigned_to = $2 WHERE id = $1`, [id, other?.id ?? null]);
    });
    return { ok: true };
  });

  // ───── Freigaben der zweiten Person (M20.03, M30.08) ─────
  app.get('/mod-api/approvals', async (req) => {
    const s = await requireStaff(req);
    const rows = await q(
      `SELECT a.id, a.kind, a.ref, a.reason, a.created_at, st.name AS requested_by
         FROM mod_approvals a JOIN staff st ON st.id = a.requested_by
        WHERE a.approved_by IS NULL AND a.rejected_at IS NULL AND a.requested_by <> $1 AND a.created_at > now() - interval '1 day'
        ORDER BY a.created_at`,
      [s.id],
    );
    return { items: rows };
  });

  app.post('/mod-api/approvals/:id', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ approve: z.boolean(), reason: z.string().min(1) }));
    const ap = await one(`SELECT * FROM mod_approvals WHERE id = $1 AND approved_by IS NULL AND rejected_at IS NULL`, [id]);
    if (!ap) throw notFound();
    // nie die eigene Anfrage (auch durch CHECK in der Datenbank erzwungen)
    if (ap.requested_by === s.id) throw new AppError(403, 'UI-MOD-EIGENER-ANTRAG', {}, 'eigener_antrag');
    await logged(s, `freigabe:${ap.kind}:${ap.ref}`, b.approve ? 'gegengezeichnet' : 'gegenzeichnung_abgelehnt', b.reason, async (c) => {
      if (b.approve) await c.query(`UPDATE mod_approvals SET approved_by = $2, approved_at = now() WHERE id = $1`, [id, s.id]);
      else await c.query(`UPDATE mod_approvals SET rejected_at = now() WHERE id = $1`, [id]);
    }, true);
    return { ok: true };
  });
}
