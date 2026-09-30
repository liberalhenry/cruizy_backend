/**
 * M20 · Fallansicht Zone 3 (Meldung).
 *  * Nur die markierten Inhalte — nicht der Chat, nicht das Konto (M20.02).
 *  * Kontext ausklappen nur mit zweiter Person, eigenem Grund, protokolliert,
 *    nie voreingestellt (M20.03).
 *  * Meldende Person: nur Zahl früherer Meldungen und ihr Ausgang (M20.04).
 *  * Mehrere Meldungen zum selben Konto werden gebündelt gezeigt, nie automatisch
 *    zu einer Sperre aufaddiert.
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { p } from '../../config/params.js';
import { one, q } from '../../db/pool.js';
import { decStr, decrypt, encrypt } from '../../lib/crypto.js';
import { AppError, bad, notFound } from '../../lib/errors.js';
import { copyFile, deleteFile } from '../../lib/files.js';
import { body, idParam, params, uuid } from '../../lib/http.js';
import { t } from '../../lib/texts.js';
import { createNotice } from '../../services/notify.js';
import { purgeVaultEntry, readVault } from '../../services/deletion.js';
import { rejectPhoto } from '../../services/photo-chain.js';
import { deleteMessages } from '../chat.js';
import { sendMail } from '../../providers/mail.js';
import { ampel, logged, needsSecondPerson, requireStaff } from './core.js';
import { modImgUrl } from './index.js';

export const DECISIONS = ['bleibt', 'inhalt_entfernt', 'eingeschraenkt', 'gesperrt', 'an_behoerde'] as const;

export default async function reportRoutes(app: FastifyInstance) {
  app.get('/mod-api/reports', async (req) => {
    await requireStaff(req);
    const rows = await q(
      `SELECT r.id, r.number, r.reason, r.context, r.priority, r.status, r.created_at, r.deadline_at, r.target_id, r.from_web, r.vault_request,
              (SELECT count(*)::int FROM reports r2 WHERE r2.target_id = r.target_id AND r2.target_id IS NOT NULL AND r2.status IN ('received','in_review')) AS bundle
         FROM reports r WHERE r.status IN ('received','in_review') ORDER BY r.priority DESC, r.deadline_at ASC`,
    );
    return {
      items: rows.map((r) => ({
        id: r.id,
        number: r.number,
        reason: r.reason,
        context: r.context,
        priority: r.priority,
        status: r.status,
        createdAt: r.created_at,
        deadlineAt: r.deadline_at,
        ampel: ampel(new Date(r.created_at), new Date(r.deadline_at)),
        redSoon: Date.now() > new Date(r.created_at).getTime() + 20 * 3600_000,
        sameTargetOpen: r.bundle,
        fromWeb: r.from_web,
        vault: r.vault_request,
      })),
    };
  });

  /** M20.02: markierte Inhalte öffnen — protokolliert, Grund aus dem Meldegrund vorbelegt. */
  app.post('/mod-api/reports/:id/open', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ reason: z.string().min(1) }));
    const r = await one(`SELECT * FROM reports WHERE id = $1`, [id]);
    if (!r) throw notFound();
    return logged(s, r.number, 'meldung_geoeffnet', b.reason, async (c) => {
      if (r.status === 'received') {
        await c.query(`UPDATE reports SET status = 'in_review' WHERE id = $1`, [id]);
        await c.query(`INSERT INTO report_events (report_id, status) VALUES ($1, 'in_review')`, [id]);
      }
      const items = (await c.query(`SELECT * FROM report_items WHERE report_id = $1 ORDER BY created_at`, [id])).rows;
      const reporterStats = r.reporter_id
        ? (
            await c.query(
              `SELECT count(*)::int AS n, count(*) FILTER (WHERE decision = 'bleibt')::int AS ohne_verstoss
                 FROM reports WHERE reporter_id = $1 AND id <> $2`,
              [r.reporter_id, id],
            )
          ).rows[0]
        : null;
      const target = r.target_id
        ? (
            await c.query(
              `SELECT a.created_at, a.moderation_state,
                      (SELECT count(*)::int FROM reports x WHERE x.target_id = a.id AND x.decision IN ('inhalt_entfernt','eingeschraenkt','gesperrt')) AS prior,
                      (SELECT count(*)::int FROM reports x WHERE x.target_id = a.id AND x.status IN ('received','in_review')) AS open
                 FROM accounts a WHERE a.id = $1`,
              [r.target_id],
            )
          ).rows[0]
        : null;
      return {
        report: {
          id: r.id,
          number: r.number,
          reason: r.reason,
          description: r.description_enc ? decrypt('sealed', r.description_enc, 'report').toString() : null,
          context: r.context,
          priority: r.priority,
          createdAt: r.created_at,
          deadlineAt: r.deadline_at,
          status: r.status,
          fromWeb: r.from_web,
          targetRef: r.target_ref,
          vault: r.vault_request,
        },
        items: items.map((it) => ({
          id: it.id,
          kind: it.kind,
          content: it.snapshot_enc ? JSON.parse(decrypt('sealed', it.snapshot_enc, 'report').toString()) : null,
          // M-10: gemeldete Bilder zunächst unscharf — scharf erst nach bewusstem Tipp (in der Oberfläche)
          image: it.sealed_file ? modImgUrl('sealed', it.sealed_file, s.id) : null,
        })),
        reporter: reporterStats ? { earlierReports: reporterStats.n, withoutViolation: reporterStats.ohne_verstoss } : { web: r.from_web },
        target: target
          ? {
              accountAgeDays: Math.floor((Date.now() - new Date(target.created_at).getTime()) / 86400000),
              state: target.moderation_state,
              priorDecisions: target.prior,
              openCases: target.open,
            }
          : { gone: !!r.target_ref || !r.target_id },
      };
    });
  });

  /** M20.03: Kontext ausklappen — braucht eine Freigabe der zweiten Person (M20.03, 👥). */
  app.post('/mod-api/reports/:id/context/request', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ reason: z.string().min(5) }));
    const r = await one(`SELECT number FROM reports WHERE id = $1`, [id]);
    if (!r) throw notFound();
    // Issue #3: ein Owner gibt sich selbst frei — gekennzeichnet im Protokoll
    const self = !needsSecondPerson(s);
    return logged(s, r.number, self ? 'kontext_ohne_zweite_person' : 'kontext_beantragt', b.reason, async (c) => {
      const row = (
        await c.query(
          `INSERT INTO mod_approvals (kind, ref, requested_by, reason, approved_by, approved_at)
           VALUES ('kontext', $1, $2, $3, CASE WHEN $4 THEN $2::uuid END, CASE WHEN $4 THEN now() END) RETURNING id`,
          [id, s.id, b.reason, self],
        )
      ).rows[0];
      return { approvalId: row.id, approved: self };
    }, true);
  });

  app.post('/mod-api/reports/:id/context', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ approvalId: uuid, reason: z.string().min(1) }));
    const ap = await one(
      `SELECT * FROM mod_approvals WHERE id = $1 AND kind = 'kontext' AND ref = $2 AND requested_by = $3 AND approved_by IS NOT NULL AND approved_at > now() - interval '1 hour'`,
      [b.approvalId, id, s.id],
    );
    if (!ap) throw new AppError(403, 'UI-MOD-ZWEITE-PERSON', {}, 'freigabe_fehlt');
    const r = await one(`SELECT number FROM reports WHERE id = $1`, [id]);
    return logged(s, r!.number, 'kontext_geoeffnet', b.reason, async (c) => {
      const items = (await c.query(`SELECT original_ref FROM report_items WHERE report_id = $1 AND kind IN ('nachricht','bild_gespraech')`, [id])).rows;
      const out = [];
      for (const it of items) {
        const m = (await c.query(`SELECT conversation_id, created_at FROM messages WHERE id = $1`, [it.original_ref])).rows[0];
        if (!m) continue;
        // zwei Nachrichten davor und danach — nur Text; Bilder aus Zone 2 bleiben unzugänglich
        const around = (
          await c.query(
            `(SELECT id, sender_id, kind, body_enc, created_at FROM messages WHERE conversation_id = $1 AND created_at < $2 AND kind = 'text' ORDER BY created_at DESC LIMIT 2)
             UNION ALL
             (SELECT id, sender_id, kind, body_enc, created_at FROM messages WHERE conversation_id = $1 AND created_at > $2 AND kind = 'text' ORDER BY created_at ASC LIMIT 2)`,
            [m.conversation_id, m.created_at],
          )
        ).rows;
        out.push({
          around: around
            .sort((x, y) => new Date(x.created_at).getTime() - new Date(y.created_at).getTime())
            .map((x) => ({ at: x.created_at, text: decStr('messages', x.body_enc, `msg:${m.conversation_id}`) })),
        });
      }
      return { context: out };
    }, true);
  });

  app.post('/mod-api/reports/:id/decide', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ decision: z.enum(DECISIONS), reason: z.string().min(10), automated: z.boolean().default(false) }));
    const r = await one(`SELECT * FROM reports WHERE id = $1`, [id]);
    if (!r) throw notFound();
    if (r.status === 'decided' || r.status === 'closed') throw bad('UI-MOD-SCHON-ENTSCHIEDEN');
    // Einschränken und Sperren wirken nur über M40 (zwei Personen)
    const final = b.decision === 'eingeschraenkt' || b.decision === 'gesperrt' ? null : b.decision;
    await logged(s, r.number, `meldung_${b.decision}`, b.reason, async (c) => {
      if (b.decision === 'inhalt_entfernt') {
        const items = (await c.query(`SELECT kind, original_ref FROM report_items WHERE report_id = $1`, [id])).rows;
        const msgIds = items.filter((i) => ['nachricht', 'bild_gespraech'].includes(i.kind)).map((i) => i.original_ref);
        await deleteMessages(msgIds);
        for (const i of items.filter((x) => x.kind === 'gruppennachricht')) await c.query(`DELETE FROM event_group_messages WHERE id = $1`, [i.original_ref]);
        for (const i of items.filter((x) => x.kind === 'bild_album')) {
          const pm = (await c.query(`DELETE FROM private_media WHERE id = $1 RETURNING file`, [i.original_ref])).rows[0];
          if (pm) await deleteFile('zone2', pm.file);
        }
        for (const i of items.filter((x) => x.kind === 'profilfoto')) await rejectPhoto(i.original_ref, { reason: 'ST-FEH-13', area: null, by: s.id, auto: false });
      }
      if (b.decision === 'eingeschraenkt' || b.decision === 'gesperrt') {
        if (!r.target_id) throw bad('UI-MOD-KEIN-KONTO');
        await c.query(
          `INSERT INTO suspensions (account_id, action, reason, report_id, requested_by) VALUES ($1, $2, $3, $4, $5)`,
          [r.target_id, b.decision === 'gesperrt' ? 'suspend' : 'restrict', b.reason, id, s.id],
        );
      }
      await c.query(
        `UPDATE reports SET status = CASE WHEN $2::text IS NULL THEN status ELSE 'decided' END, decision = $3, decision_reason = $4,
                decided_by = $5, decided_at = CASE WHEN $2::text IS NULL THEN decided_at ELSE now() END WHERE id = $1`,
        [id, final, b.decision, b.reason, s.id],
      );
      await c.query(`INSERT INTO report_events (report_id, status, note) VALUES ($1, $2, $3)`, [id, final ? 'decided' : 'sperre_beantragt', b.decision]);
    });
    if (final) await informParties(id);
    return { ok: true, pendingSecondPerson: !final };
  });

  app.post('/mod-api/reports/:id/close', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ reason: z.string().min(1) }));
    const r = await one(`SELECT number, status FROM reports WHERE id = $1`, [id]);
    if (!r) throw notFound();
    await logged(s, r.number, 'fall_geschlossen', b.reason, async (c) => {
      // M20.08: setzt die Aufbewahrungsfrist in Gang (FV-78)
      await c.query(
        `UPDATE reports SET status = 'closed', closed_at = now(), retention_until = now() + make_interval(secs => $2) WHERE id = $1`,
        [id, p('P-FALL-AUFBEWAHRUNG')],
      );
      await c.query(`INSERT INTO report_events (report_id, status) VALUES ($1, 'closed')`, [id]);
    });
    return { ok: true };
  });

  // ───── Nachlauf-Ablage (FV-97): nur über einen Meldefall der Gegenseite ─────
  app.post('/mod-api/reports/:id/vault', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ reason: z.string().min(5) }));
    const r = await one(`SELECT number, reporter_id, vault_request FROM reports WHERE id = $1`, [id]);
    if (!r || !r.reporter_id) throw notFound();
    return logged(s, r.number, 'nachlauf_geoeffnet', b.reason, async (c) => {
      const rows = (await c.query(`SELECT id, created_at, purge_at, payload_enc FROM deletion_vault WHERE counterpart_id = $1 AND report_id IS NULL`, [r.reporter_id])).rows;
      return {
        entries: rows.map((v) => {
          const data = readVault(v.payload_enc);
          return {
            id: v.id,
            purgeAt: v.purge_at,
            messages: data.messages.map((m) => ({ from: m.from, kind: m.kind, text: m.text, at: m.at, image: m.sealedFile ? modImgUrl('sealed', m.sealedFile, s.id) : null })),
          };
        }),
      };
    }, true);
  });

  app.post('/mod-api/reports/:id/vault/:vaultId/attach', async (req) => {
    const s = await requireStaff(req);
    const { id, vaultId } = params(req, z.object({ id: uuid, vaultId: uuid }));
    const b = body(req, z.object({ reason: z.string().min(5) }));
    const r = await one(`SELECT number, reporter_id FROM reports WHERE id = $1`, [id]);
    const v = await one(`SELECT * FROM deletion_vault WHERE id = $1 AND counterpart_id = $2`, [vaultId, r?.reporter_id]);
    if (!r || !v) throw notFound();
    await logged(s, r.number, 'nachlauf_uebernommen', b.reason, async (c) => {
      const data = readVault(v.payload_enc);
      for (const m of data.messages) {
        const sealed = m.sealedFile ? await copyFile('sealed', m.sealedFile, 'sealed') : null;
        await c.query(`INSERT INTO report_items (report_id, kind, snapshot_enc, sealed_file) VALUES ($1, 'nachlauf', $2, $3)`, [
          id,
          encrypt('sealed', JSON.stringify({ text: m.text, at: m.at, von: m.from }), 'report'),
          sealed,
        ]);
      }
    }, true);
    await purgeVaultEntry(vaultId);
    return { ok: true };
  });
}

/** Mitteilungen an beide Seiten (AK-F62-04/05, AK-Z01-07) — die gemeldete Person erfährt nicht, wer gemeldet hat. */
export async function informParties(reportId: string) {
  const r = await one(`SELECT * FROM reports WHERE id = $1`, [reportId]);
  if (!r) return;
  const text =
    r.decision === 'bleibt'
      ? t('ST-MEL-22', { name: t('UI-DIE-PERSON') })
      : t('ST-MEL-21', { entscheidung: t(`UI-ENTSCHEIDUNG-${r.decision.toUpperCase().replace(/_/g, '-')}`), begruendung: r.decision_reason });
  if (r.reporter_id) {
    await createNotice(r.reporter_id, 'meldung_entscheidung', t('UI-MELDUNG-ENTSCHIEDEN', { fallnummer: r.number }), `${text}\n\n${t('UI-WEGE-DAGEGEN')}`, r.number);
  } else if (r.reporter_contact_enc) {
    const contact = JSON.parse(decStr('tickets', r.reporter_contact_enc, 'report-contact') ?? '{}');
    if (contact.email) {
      await sendMail({
        to: contact.email,
        subject: t('ST-HLF-24', { fallnummer: r.number }),
        text: `${text}\n\n${t('UI-WEGE-DAGEGEN')}`,
        design: { heading: t('UI-MAIL-KOPF-ENTSCHEIDUNG') },
      });
    }
  }
  if (r.target_id && r.decision === 'inhalt_entfernt') {
    await createNotice(
      r.target_id,
      'entscheidung_betroffen',
      t('UI-ENTSCHEIDUNG-BETROFFEN'),
      t('ST-MEL-23', { inhalt: t('UI-EINEN-INHALT'), begruendung: r.decision_reason }),
      r.id,
    );
  }
}
