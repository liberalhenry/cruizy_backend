/**
 * M10 · Warteschlange Zone 1 (Graubereich).
 *  * Nur Zone 1 — hier gibt es nichts aus Zone 2 (M10.02).
 *  * Reihenfolge nach Alter, nicht nach Wert (Hinweis M10).
 *  * Klassifikatorwert für MOD nur als Band, als Zahl nur für BETRIEB.
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { p } from '../../config/params.js';
import { one, q } from '../../db/pool.js';
import { notFound } from '../../lib/errors.js';
import { body, idParam, params } from '../../lib/http.js';
import { t } from '../../lib/texts.js';
import { approvePhoto, rejectPhoto } from '../../services/photo-chain.js';
import { createNotice } from '../../services/notify.js';
import { createReport } from '../reports.js';
import { inHourWindow } from '../../lib/time.js';
import { logged, requireStaff } from './core.js';
import { modImgUrl } from './index.js';

function scoreBand(score: number | null) {
  if (score === null || score === undefined) return 'kein Wert';
  if (score < p('P-KLASS-UNTEN') + (p('P-KLASS-OBEN') - p('P-KLASS-UNTEN')) / 3) return 'eher unbedenklich';
  if (score < p('P-KLASS-OBEN') - (p('P-KLASS-OBEN') - p('P-KLASS-UNTEN')) / 3) return 'unklar';
  return 'eher explizit';
}

function queueAmpel(queuedAt: Date) {
  const age = Date.now() - queuedAt.getTime();
  if (age > p('P-FRIST-GRAU') * 1000) return 'rot';
  const tag = p('P-TAGSUEBER');
  if (age > p('P-FRIST-GRAU-TAG') * 1000 && inHourWindow(queuedAt, tag.von, tag.bis)) return 'gelb';
  return 'gruen';
}

const REJECT_REASONS = ['ST-FEH-13', 'ST-FEH-14', 'ST-FEH-15'];

export default async function queueRoutes(app: FastifyInstance) {
  app.get('/mod-api/queue', async (req) => {
    const s = await requireStaff(req);
    const rows = await q(`SELECT id, queued_at, classifier_score FROM photos WHERE status = 'queued' ORDER BY queued_at ASC`);
    return {
      items: rows.map((r) => ({
        id: r.id,
        queuedAt: r.queued_at,
        zone: 1,
        band: scoreBand(r.classifier_score),
        score: s.role === 'BETRIEB' ? r.classifier_score : undefined,
        ampel: queueAmpel(new Date(r.queued_at)),
      })),
      reasons: REJECT_REASONS,
    };
  });

  app.post('/mod-api/queue/:id/open', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ reason: z.string().default('Prüfung Graubereich Zone 1') }));
    return logged(s, `foto:${id}`, 'bild_geoeffnet', b.reason, async (c) => {
      const ph = await one(`SELECT * FROM photos WHERE id = $1 AND status = 'queued'`, [id], c);
      if (!ph) throw notFound();
      const acc = await one(`SELECT created_at FROM accounts WHERE id = $1`, [ph.account_id], c);
      const prior = await one(
        `SELECT count(*) FILTER (WHERE status = 'rejected')::int AS rejected, count(*) FILTER (WHERE status = 'approved')::int AS approved
           FROM photos WHERE account_id = $1 AND id <> $2`,
        [ph.account_id, id],
        c,
      );
      const reports = await one(`SELECT count(*)::int AS n FROM reports WHERE target_id = $1`, [ph.account_id], c);
      // M10.04: keine Profilangaben, die für die Entscheidung nicht nötig sind
      return {
        id,
        image: modImgUrl('zone1-original', ph.original_file, s.id),
        blurredChoice: ph.blurred,
        accountAgeDays: Math.floor((Date.now() - new Date(acc.created_at).getTime()) / 86400000),
        priorDecisions: prior,
        reports: reports!.n,
      };
    });
  });

  app.post('/mod-api/queue/:id/decide', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(
      req,
      z.object({
        decision: z.enum(['freigeben', 'ablehnen', 'hochstufen', 'zuruecklegen']),
        reason: z.string().min(1),
        rejectReason: z.enum(['ST-FEH-13', 'ST-FEH-14', 'ST-FEH-15']).optional(),
        area: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }).nullable().optional(),
        freeText: z.string().max(500).optional(),
      }),
    );
    const ph = await one(`SELECT id, account_id FROM photos WHERE id = $1 AND status = 'queued'`, [id]);
    if (!ph) throw notFound();
    await logged(s, `foto:${id}`, `warteschlange_${b.decision}`, b.reason, async () => {});
    if (b.decision === 'freigeben') await approvePhoto(id, { by: s.id, auto: false });
    if (b.decision === 'ablehnen') {
      await rejectPhoto(id, { reason: b.rejectReason ?? 'ST-FEH-13', area: b.area ?? null, by: s.id, auto: false });
      await createNotice(
        ph.account_id,
        'foto',
        t('UI-FOTO-ABGELEHNT-TITEL'),
        t('ST-MEL-23', { inhalt: t('UI-DEIN-FOTO'), begruendung: `${t(b.rejectReason ?? 'ST-FEH-13')}.${b.freeText ? ` ${b.freeText}` : ''}` }),
        id,
      );
    }
    if (b.decision === 'hochstufen') {
      await q(`UPDATE photos SET status = 'queued', queued_at = queued_at WHERE id = $1`, [id]);
      const r = await createReport({ reporter: null, reason: 'anderes', description: `Hochgestuft aus der Warteschlange: ${b.reason}`, targetId: ph.account_id, context: 'foto', contextId: id, items: [] });
      return { ok: true, report: r.number };
    }
    // „zurücklegen“: der Fall bleibt offen und geht an die zweite Person — ausdrücklich erwünscht (M10.08)
    return { ok: true };
  });
}
