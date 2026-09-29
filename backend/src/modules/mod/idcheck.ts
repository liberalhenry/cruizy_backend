/**
 * Altersprüfung per Ausweis — Prüfung durch das Team (Issue #7).
 *
 *  * Es zählt nur das Geburtsdatum. Andere Angaben auf dem Bild werden nicht erfasst.
 *  * Öffnen und Entscheiden stehen im Zugriffsprotokoll (M60); ohne Begründung nichts.
 *  * Mit der Entscheidung werden die Bilder gelöscht — auch bei „unlesbar“.
 *  * „unter 18“ sperrt das Konto wie bisher (FV-17); die Person kann mit einem anderen
 *    Ausweis widersprechen.
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one, q } from '../../db/pool.js';
import { conflict, notFound } from '../../lib/errors.js';
import { deleteFile } from '../../lib/files.js';
import { body, idParam, params } from '../../lib/http.js';
import { t } from '../../lib/texts.js';
import { discord } from '../../services/discord.js';
import { createNotice } from '../../services/notify.js';
import { applyResult } from '../verification.js';
import { ampel, logged, requireStaff } from './core.js';
import { modImgUrl } from './index.js';

const RESULT = { volljaehrig: 'passed', minderjaehrig: 'minor', unlesbar: 'failed' } as const;

/** Entscheidung umsetzen: Ergebnis, Bilder löschen, Mitteilung. Auch vom Ablauf-Auftrag genutzt. */
export async function closeReview(reviewId: string, decision: 'volljaehrig' | 'minderjaehrig' | 'unlesbar' | 'abgelaufen', staffId: string | null) {
  const r = await one(
    `UPDATE id_reviews SET decided_at = now(), decided_by = $2, decision = $3 WHERE id = $1 AND decided_at IS NULL RETURNING *`,
    [reviewId, staffId, decision],
  );
  if (!r) return false;
  for (const f of r.files as string[]) await deleteFile('idcheck', f);
  await q(`UPDATE id_reviews SET files = '{}' WHERE id = $1`, [reviewId]);
  await applyResult(r.session_id, decision === 'abgelaufen' ? 'failed' : RESULT[decision], `ausweis-team-${r.number}`, { fromReview: true });
  const text: Record<typeof decision, string> = {
    volljaehrig: 'UI-AUSWEIS-OK',
    minderjaehrig: 'ST-VER-13',
    unlesbar: 'UI-AUSWEIS-UNLESBAR',
    abgelaufen: 'UI-AUSWEIS-UNLESBAR',
  };
  await createNotice(r.account_id, 'alterspruefung', t('UI-AUSWEIS-TITEL'), t(text[decision]), r.number);
  return true;
}

export default async function idcheckRoutes(app: FastifyInstance) {
  app.get('/mod-api/id-reviews', async (req) => {
    await requireStaff(req);
    const rows = await q(
      `SELECT id, number, auto_note, created_at, deadline_at, cardinality(files) AS files FROM id_reviews WHERE decided_at IS NULL ORDER BY created_at`,
    );
    const done = await q(
      `SELECT r.number, r.decision, r.decided_at, st.name AS decided_by FROM id_reviews r LEFT JOIN staff st ON st.id = r.decided_by
        WHERE r.decided_at > now() - interval '7 days' ORDER BY r.decided_at DESC LIMIT 50`,
    );
    return {
      items: rows.map((r) => ({
        id: r.id,
        number: r.number,
        note: r.auto_note,
        createdAt: r.created_at,
        deadlineAt: r.deadline_at,
        files: r.files,
        ampel: ampel(new Date(r.created_at), new Date(r.deadline_at)),
      })),
      done: done.map((d) => ({ number: d.number, decision: d.decision, decidedAt: d.decided_at, decidedBy: d.decided_by ?? 'automatisch' })),
    };
  });

  app.post('/mod-api/id-reviews/:id/open', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ reason: z.string().trim().min(1).max(500).default('Altersprüfung: Geburtsdatum auf dem Ausweis prüfen') }));
    const r = await one(`SELECT * FROM id_reviews WHERE id = $1 AND decided_at IS NULL`, [id]);
    if (!r) throw notFound();
    return logged(s, r.number, 'ausweis_geoeffnet', b.reason, async () => ({
      id: r.id,
      number: r.number,
      note: r.auto_note,
      images: (r.files as string[]).map((f) => modImgUrl('idcheck', f, s.id)),
    }));
  });

  app.post('/mod-api/id-reviews/:id/decide', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ decision: z.enum(['volljaehrig', 'minderjaehrig', 'unlesbar']), reason: z.string().trim().min(3).max(500) }));
    const r = await one(`SELECT number FROM id_reviews WHERE id = $1 AND decided_at IS NULL`, [id]);
    if (!r) throw notFound();
    // erst der Protokolleintrag, dann die Wirkung
    await logged(s, r.number, `ausweis_${b.decision}`, b.reason, async () => null, b.decision === 'minderjaehrig');
    if (!(await closeReview(id, b.decision, s.id))) throw conflict('UI-NICHT-VERFUEGBAR', 'schon_entschieden');
    discord('alterspruefung', {
      title: `Ausweis ${r.number}: ${b.decision}`,
      level: b.decision === 'volljaehrig' ? 'ok' : b.decision === 'minderjaehrig' ? 'danger' : 'warn',
      fields: [{ name: 'Person', value: s.name }],
    });
    return { ok: true };
  });
}
