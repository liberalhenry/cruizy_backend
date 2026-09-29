/**
 * M50 · Einspruch (Bild, 48 h) und Widerspruch (jede andere Entscheidung, 72 h).
 *  * Der Einspruch geht NIE an die Person, die ursprünglich entschieden hat — technisch erzwungen (M50.04).
 *  * Bei einer Sperre hat die zweite Person freigegeben; entscheidet sie über den Widerspruch,
 *    wird das in der Antwort offengelegt (Hinweis M50).
 *  * Die Antwort ist Pflicht und muss auf den Einspruch eingehen (M50.06).
 *  * Aufhebung stellt vollständig her (M50.07); „Fehler bei uns“ ist ein eigenes Feld (M50.08).
 *  * Einspruch gegen einen Hash-Fall: kein Bild, keine Einzelheiten, Verweis auf den Weg über die Behörde.
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one, q } from '../../db/pool.js';
import { decStr } from '../../lib/crypto.js';
import { AppError, bad, notFound } from '../../lib/errors.js';
import { body, idParam, params } from '../../lib/http.js';
import { t } from '../../lib/texts.js';
import { createNotice } from '../../services/notify.js';
import { approvePhoto } from '../../services/photo-chain.js';
import { logged, requireStaff } from './core.js';
import { modImgUrl } from './index.js';
import { applySuspension } from './suspensions.js';

const RED_AFTER_H = 40;

function appealAmpel(createdAt: Date, deadline: Date): 'gruen' | 'gelb' | 'rot' {
  const age = Date.now() - createdAt.getTime();
  if (Date.now() >= deadline.getTime() || age >= RED_AFTER_H * 3600_000) return 'rot';
  if (age >= 24 * 3600_000) return 'gelb';
  return 'gruen';
}

/** Wer darf nicht entscheiden? Die ursprünglich entscheidende Person — bei Meldungen und Sperren ermittelt aus dem Fall. */
async function excludedDeciders(ap: any): Promise<{ excluded: string[]; involved: string[] }> {
  const excluded = new Set<string>();
  const involved = new Set<string>();
  if (ap.original_decider) excluded.add(ap.original_decider);
  if (ap.report_id) {
    const r = await one(`SELECT decided_by FROM reports WHERE id = $1`, [ap.report_id]);
    if (r?.decided_by) excluded.add(r.decided_by);
    const su = await q(`SELECT requested_by, approved_by FROM suspensions WHERE report_id = $1 AND approved_at IS NOT NULL`, [ap.report_id]);
    for (const x of su) {
      excluded.add(x.requested_by);
      if (x.approved_by) involved.add(x.approved_by);
    }
  }
  if (ap.suspension_id) {
    const su = await one(`SELECT requested_by, approved_by FROM suspensions WHERE id = $1`, [ap.suspension_id]);
    if (su) {
      excluded.add(su.requested_by);
      if (su.approved_by) involved.add(su.approved_by);
    }
  }
  return { excluded: [...excluded], involved: [...involved] };
}

async function isHashCase(ap: any): Promise<boolean> {
  if (!ap.photo_id) return false;
  const ph = await one(`SELECT status, decided_by FROM photos WHERE id = $1`, [ap.photo_id]);
  return ph?.status === 'blocked' || ph?.decided_by === 'hash';
}

export default async function appealRoutes(app: FastifyInstance) {
  app.get('/mod-api/appeals', async (req) => {
    const s = await requireStaff(req);
    const rows = await q(`SELECT * FROM appeals WHERE decided_at IS NULL ORDER BY created_at ASC`);
    const items = [];
    for (const r of rows) {
      const { excluded } = await excludedDeciders(r);
      items.push({
        id: r.id,
        number: r.number,
        kind: r.kind,
        createdAt: r.created_at,
        deadlineAt: r.deadline_at,
        ampel: appealAmpel(new Date(r.created_at), new Date(r.deadline_at)),
        // M50.04: über den eigenen Fall wird nicht entschieden — der Fall wartet, die Frist läuft sichtbar
        ownCase: excluded.includes(s.id),
      });
    }
    return { items };
  });

  /** Öffnen — die Ursprungsentscheidung unverändert und der Text ungekürzt (M50.02/03). */
  app.post('/mod-api/appeals/:id/open', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const ap = await one(`SELECT * FROM appeals WHERE id = $1`, [id]);
    if (!ap) throw notFound();
    const { excluded, involved } = await excludedDeciders(ap);
    const hashCase = await isHashCase(ap);
    return logged(s, ap.number, 'widerspruch_geoeffnet', 'Prüfung Einspruch/Widerspruch', async (c) => {
      let original: Record<string, unknown> = {};
      if (ap.photo_id) {
        const ph = (await c.query(`SELECT status, rejection_reason, rejection_area, decided_at, decided_by, decided_auto, original_file FROM photos WHERE id = $1`, [ap.photo_id])).rows[0];
        original = hashCase
          ? { what: 'bild', hashCase: true }
          : {
              what: 'bild',
              reason: ph ? t(ph.rejection_reason ?? 'ST-FEH-13') : null,
              area: ph?.rejection_area ?? null,
              decidedAt: ph?.decided_at,
              decidedBy: ph?.decided_auto ? 'Programm' : await staffName(ph?.decided_by),
              image: ph ? modImgUrl('zone1-original', ph.original_file, s.id) : null,
            };
      } else if (ap.report_id) {
        const r = (await c.query(`SELECT number, decision, decision_reason, decided_at, decided_by FROM reports WHERE id = $1`, [ap.report_id])).rows[0];
        original = { what: 'meldung', reportId: ap.report_id, caseRef: r?.number, decision: r?.decision, reason: r?.decision_reason, decidedAt: r?.decided_at, decidedBy: await staffName(r?.decided_by) };
      } else if (ap.suspension_id) {
        const su = (await c.query(`SELECT action, reason, requested_by, approved_by, approved_at FROM suspensions WHERE id = $1`, [ap.suspension_id])).rows[0];
        original = { what: 'sperre', action: su?.action, reason: su?.reason, requestedBy: await staffName(su?.requested_by), approvedBy: await staffName(su?.approved_by), at: su?.approved_at };
      }
      return {
        id: ap.id,
        number: ap.number,
        kind: ap.kind,
        createdAt: ap.created_at,
        deadlineAt: ap.deadline_at,
        text: decStr('tickets', ap.text_enc, 'appeal'),
        original,
        automated: ap.original_auto,
        mayDecide: !excluded.includes(s.id),
        disclose: involved.includes(s.id),
        hashCase,
      };
    });
  });

  /** M50.05–08: Ergebnis, Antwort, Aufhebung, „Fehler bei uns“. */
  app.post('/mod-api/appeals/:id/decide', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(
      req,
      z.object({
        outcome: z.enum(['bleibt', 'aufgehoben', 'abgemildert']),
        answer: z.string().trim().min(30).max(4000),
        ourError: z.boolean().default(false),
        // bei „abgemildert“ für eine Sperre: aus der Sperre wird eine Einschränkung
      }),
    );
    const ap = await one(`SELECT * FROM appeals WHERE id = $1 AND decided_at IS NULL`, [id]);
    if (!ap) throw notFound();
    const { excluded, involved } = await excludedDeciders(ap);
    // M50.04: technisch erzwungen — keine Rolle hebt das auf
    if (excluded.includes(s.id)) throw new AppError(403, 'UI-MOD-EIGENER-FALL', {}, 'eigener_fall');
    const hashCase = await isHashCase(ap);
    if (hashCase && b.outcome !== 'bleibt') throw bad('UI-MOD-HASH-WIDERSPRUCH', {}, 'hash_fall');
    let answer = b.answer;
    if (involved.includes(s.id)) answer += `\n\n${t('UI-WIDERSPRUCH-OFFENLEGUNG')}`;
    if (hashCase) answer += `\n\n${t('UI-WIDERSPRUCH-HASH-WEG')}`;

    const restorePhoto = ap.photo_id && b.outcome === 'aufgehoben' && !hashCase;
    await logged(s, ap.number, `widerspruch_${b.outcome}`, b.answer, async (c) => {
      await c.query(`UPDATE appeals SET decided_by = $2, decided_at = now(), outcome = $3, answer = $4, our_error = $5 WHERE id = $1`, [id, s.id, b.outcome, answer, b.ourError]);
      if (b.outcome === 'bleibt') return;
      // Sperre aufheben oder abmildern — stellt vollständig her (M50.07)
      const suspensions = ap.suspension_id
        ? [(await c.query(`SELECT * FROM suspensions WHERE id = $1`, [ap.suspension_id])).rows[0]]
        : ap.report_id
          ? (await c.query(`SELECT * FROM suspensions WHERE report_id = $1 AND approved_at IS NOT NULL AND action <> 'lift'`, [ap.report_id])).rows
          : [];
      for (const su of suspensions.filter(Boolean)) {
        if (!su.account_id) continue;
        if (b.outcome === 'aufgehoben') await applySuspension(c, { id: su.id, account_id: su.account_id, action: 'lift' });
        else if (su.action !== 'restrict') {
          await applySuspension(c, { id: su.id, account_id: su.account_id, action: 'lift' });
          await applySuspension(c, { id: su.id, account_id: su.account_id, action: 'restrict' });
        }
      }
      if (ap.report_id) {
        await c.query(`INSERT INTO report_events (report_id, status, note) VALUES ($1, 'widerspruch', $2)`, [ap.report_id, b.outcome]);
      }
    });
    if (restorePhoto) await approvePhoto(ap.photo_id, { by: s.id, auto: false });

    if (ap.account_id) {
      const outcomeText = t(`UI-WIDERSPRUCH-${b.outcome.toUpperCase()}`);
      await createNotice(ap.account_id, 'widerspruch', t('UI-WIDERSPRUCH-ENTSCHIEDEN', { fallnummer: ap.number }), `${outcomeText}\n\n${answer}`, ap.number);
    }
    return { ok: true };
  });
}

async function staffName(id: string | null | undefined): Promise<string | null> {
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) return id ?? null;
  const r = await one(`SELECT name FROM staff WHERE id = $1`, [id]);
  return r?.name ?? null;
}
