/**
 * Prüfungen durch das Team (Werkzeug → „Bestätigen“).
 *
 *  * age1 — Ausweis, bei dem die automatische Auswertung unsicher war (Issue #7). Es zählt nur das Geburtsdatum.
 *  * age2 — Stufe 2 ohne Prüfpartner: Ausweis und Selfie mit Geste.
 *  * face — Fotoprüfung (F06) ohne Prüfpartner: Selfie mit Geste gegen die Profilfotos.
 *  * date_face — Cruizy Date ohne Anbieter: Selfie mit Geste gegen das erste Date-Foto.
 *
 * Öffnen und Entscheiden stehen im Zugriffsprotokoll (M60). Mit der Entscheidung werden die
 * Bilder gelöscht. „unter 18“ sperrt das Konto wie bisher (FV-17); die Person kann widersprechen.
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one, q } from '../../db/pool.js';
import { bad, conflict, notFound } from '../../lib/errors.js';
import { deleteFile } from '../../lib/files.js';
import { body, idParam, params, query } from '../../lib/http.js';
import { t } from '../../lib/texts.js';
import { discord } from '../../services/discord.js';
import { poseLabel } from '../../services/manual-review.js';
import { createNotice } from '../../services/notify.js';
import { setStep } from '../date.js';
import { applyResult } from '../verification.js';
import { ampel, logged, requireStaff } from './core.js';
import { modImgUrl } from './index.js';

type Kind = 'age1' | 'age2' | 'face' | 'date_face';
type Decision = 'volljaehrig' | 'minderjaehrig' | 'unlesbar' | 'passt' | 'passt_nicht' | 'abgelaufen';

/** Welche Entscheidungen es je Art gibt */
export const DECISIONS: Record<Kind, Decision[]> = {
  age1: ['volljaehrig', 'unlesbar', 'minderjaehrig'],
  age2: ['volljaehrig', 'unlesbar', 'minderjaehrig'],
  face: ['passt', 'passt_nicht'],
  date_face: ['passt', 'passt_nicht'],
};

const RESULT: Record<Decision, string> = {
  volljaehrig: 'passed',
  minderjaehrig: 'minor',
  unlesbar: 'failed',
  passt: 'passed',
  passt_nicht: 'failed',
  abgelaufen: 'failed',
};

const NOTICE: Record<Kind, { title: string; ok: string; no: string }> = {
  age1: { title: 'UI-AUSWEIS-TITEL', ok: 'UI-AUSWEIS-OK', no: 'UI-AUSWEIS-UNLESBAR' },
  age2: { title: 'UI-TEAMPRUEFUNG-STUFE2-TITEL', ok: 'UI-TEAMPRUEFUNG-STUFE2-OK', no: 'UI-TEAMPRUEFUNG-STUFE2-NEIN' },
  face: { title: 'UI-TEAMPRUEFUNG-FOTO-TITEL', ok: 'UI-TEAMPRUEFUNG-FOTO-OK', no: 'UI-TEAMPRUEFUNG-FOTO-NEIN' },
  date_face: { title: 'UI-TEAMPRUEFUNG-DATE-TITEL', ok: 'UI-TEAMPRUEFUNG-DATE-OK', no: 'UI-TEAMPRUEFUNG-DATE-NEIN' },
};

/** Entscheidung umsetzen: Ergebnis, Bilder löschen, Mitteilung. Auch vom Ablauf-Auftrag genutzt. */
export async function closeReview(reviewId: string, decision: Decision, staffId: string | null) {
  const r = await one(
    `UPDATE id_reviews SET decided_at = now(), decided_by = $2, decision = $3 WHERE id = $1 AND decided_at IS NULL RETURNING *`,
    [reviewId, staffId, decision],
  );
  if (!r) return false;
  for (const f of r.files as string[]) await deleteFile('idcheck', f);
  await q(`UPDATE id_reviews SET files = '{}' WHERE id = $1`, [reviewId]);
  const kind = r.kind as Kind;
  if (kind === 'date_face') {
    const ok = decision === 'passt';
    await q(
      `UPDATE date_access SET verified_at = CASE WHEN $2 THEN now() ELSE verified_at END, verification_provider = 'team', verification_result = $3 WHERE account_id = $1`,
      [r.account_id, ok, ok ? 'bestanden' : 'kein_abgleich'],
    );
    if (ok) await setStep(r.account_id, 'profil');
  } else if (r.session_id) {
    await applyResult(r.session_id, RESULT[decision], `team-${r.number}`, { fromReview: true });
  }
  const n = NOTICE[kind];
  const text = decision === 'minderjaehrig' ? 'ST-VER-13' : RESULT[decision] === 'passed' ? n.ok : n.no;
  await createNotice(r.account_id, kind === 'date_face' ? 'date' : 'alterspruefung', t(n.title), t(text), r.number);
  return true;
}

export default async function idcheckRoutes(app: FastifyInstance) {
  app.get('/mod-api/id-reviews', async (req) => {
    await requireStaff(req);
    const qs = query(req, z.object({ kind: z.enum(['age1', 'age2', 'face', 'date_face', 'alle']).default('alle') }));
    const kindFilter = qs.kind === 'alle' ? '' : `AND kind = '${qs.kind}'`;
    const rows = await q(
      `SELECT id, number, kind, auto_note, pose, created_at, deadline_at, cardinality(files) AS files FROM id_reviews
        WHERE decided_at IS NULL ${kindFilter} ORDER BY deadline_at`,
    );
    const done = await q(
      `SELECT r.number, r.kind, r.decision, r.decided_at, st.name AS decided_by FROM id_reviews r LEFT JOIN staff st ON st.id = r.decided_by
        WHERE r.decided_at > now() - interval '7 days' ${kindFilter.replace('kind', 'r.kind')} ORDER BY r.decided_at DESC LIMIT 50`,
    );
    return {
      items: rows.map((r) => ({
        id: r.id,
        number: r.number,
        kind: r.kind,
        note: r.auto_note,
        pose: poseLabel(r.pose),
        createdAt: r.created_at,
        deadlineAt: r.deadline_at,
        files: r.files,
        ampel: ampel(new Date(r.created_at), new Date(r.deadline_at)),
      })),
      done: done.map((d) => ({ number: d.number, kind: d.kind, decision: d.decision, decidedAt: d.decided_at, decidedBy: d.decided_by ?? 'automatisch' })),
    };
  });

  app.post('/mod-api/id-reviews/:id/open', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ reason: z.string().trim().min(1).max(500).default('Bestätigen: Bilder für die Entscheidung ansehen') }));
    const r = await one(`SELECT * FROM id_reviews WHERE id = $1 AND decided_at IS NULL`, [id]);
    if (!r) throw notFound();
    const kind = r.kind as Kind;
    // Vergleichsbilder: Profilfotos (Fotoprüfung) bzw. erstes Date-Foto
    let references: string[] = [];
    if (kind === 'face') {
      const ph = await q(`SELECT public_file FROM photos WHERE account_id = $1 AND status = 'approved' AND public_file IS NOT NULL ORDER BY position LIMIT 4`, [r.account_id]);
      references = ph.map((x) => modImgUrl('zone1-public', x.public_file, s.id));
    } else if (kind === 'date_face') {
      const ph = await one(`SELECT file FROM date_photos WHERE account_id = $1 AND status <> 'rejected' ORDER BY position, created_at LIMIT 1`, [r.account_id]);
      if (ph) references = [modImgUrl('zone1-public', ph.file, s.id)];
    }
    return logged(s, r.number, kind === 'age1' ? 'ausweis_geoeffnet' : `teampruefung_${kind}_geoeffnet`, b.reason, async () => ({
      id: r.id,
      number: r.number,
      kind,
      note: r.auto_note,
      pose: poseLabel(r.pose),
      decisions: DECISIONS[kind],
      images: (r.files as string[]).map((f) => modImgUrl('idcheck', f, s.id)),
      references,
    }));
  });

  app.post('/mod-api/id-reviews/:id/decide', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(
      req,
      z.object({ decision: z.enum(['volljaehrig', 'minderjaehrig', 'unlesbar', 'passt', 'passt_nicht']), reason: z.string().trim().min(3).max(500) }),
    );
    const r = await one(`SELECT number, kind FROM id_reviews WHERE id = $1 AND decided_at IS NULL`, [id]);
    if (!r) throw notFound();
    if (!DECISIONS[r.kind as Kind].includes(b.decision)) throw bad('UI-EINGABE-PRUEFEN', {}, 'entscheidung');
    // erst der Protokolleintrag, dann die Wirkung
    const action = r.kind === 'age1' ? `ausweis_${b.decision}` : `teampruefung_${r.kind}_${b.decision}`;
    await logged(s, r.number, action, b.reason, async () => null, b.decision === 'minderjaehrig');
    if (!(await closeReview(id, b.decision, s.id))) throw conflict('UI-NICHT-VERFUEGBAR', 'schon_entschieden');
    discord('alterspruefung', {
      title: `${r.number}: ${b.decision}`,
      level: b.decision === 'volljaehrig' || b.decision === 'passt' ? 'ok' : b.decision === 'minderjaehrig' ? 'danger' : 'warn',
      fields: [{ name: 'Person', value: s.name }],
    });
    return { ok: true };
  });
}
