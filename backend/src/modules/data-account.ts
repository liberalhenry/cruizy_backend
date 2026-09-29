/**
 * Datenkonto (F68, S60): sehen, exportieren, löschen — je ein Tipp, ohne Abo.
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { p } from '../config/params.js';
import { one, q, tx } from '../db/pool.js';
import { requireMember } from '../lib/context.js';
import { encrypt } from '../lib/crypto.js';
import { AppError, bad, notFound } from '../lib/errors.js';
import { getFile } from '../lib/files.js';
import { body } from '../lib/http.js';
import { CONSENT_PURPOSE, CONSENT_VERSION } from './auth.js';
import { startDeletion } from '../services/deletion.js';

export default async function dataRoutes(app: FastifyInstance) {
  app.get('/api/data', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true, allowSuspended: true });
    const count = async (sql: string) => (await one(sql, [a.id]))!.n as number;
    const acc = await one(`SELECT deletion_due_at, created_at FROM accounts WHERE id = $1`, [a.id]);
    const exp = await one(`SELECT status, requested_at, ready_at, expires_at FROM exports WHERE account_id = $1 ORDER BY requested_at DESC LIMIT 1`, [a.id]);
    return {
      // S60.02: Kategorien gespeicherter Daten
      categories: {
        konto: { since: acc.created_at },
        profil: { photos: await count(`SELECT count(*)::int AS n FROM photos WHERE account_id = $1 AND status <> 'blocked'`) },
        nachrichten: {
          conversations: await count(`SELECT count(*)::int AS n FROM conversations WHERE user_low = $1 OR user_high = $1`),
          ownMessages: await count(`SELECT count(*)::int AS n FROM messages WHERE sender_id = $1`),
        },
        standort: await one(`SELECT level, (cell_lat IS NOT NULL) AS stored FROM locations WHERE account_id = $1`, [a.id]),
        meldungen: await count(`SELECT count(*)::int AS n FROM reports WHERE reporter_id = $1`),
        album: await count(`SELECT count(*)::int AS n FROM private_media WHERE owner_id = $1 AND kind = 'album'`),
      },
      consents: await q(`SELECT id, purpose, text_version, granted_at, revoked_at FROM consents WHERE account_id = $1 ORDER BY granted_at`, [a.id]),
      export: exp
        ? { status: exp.status === 'running' ? 'queued' : exp.status, requestedAt: exp.requested_at, readyAt: exp.ready_at, expiresAt: exp.expires_at }
        : null,
      deletionDueAt: acc.deletion_due_at,
      checkZone2: p('P-ZONE2-ABGLEICH') ? 'A' : 'B', // ST-DAT-20, Fassung nach dem Schalter (AK-M09-05)
      hours: Math.round(p('P-EXPORT-DAUER') / 3600),
      days: Math.round(p('P-EXPORT-BEREIT') / 86400),
      graceDays: Math.round(p('P-KARENZ') / 86400),
      vaultDays: Math.round(p('P-LOESCH-NACHLAUF') / 86400),
    };
  });

  /** AK-F68-01: außer dem Passwort kein weiterer Schritt; der Download erscheint hier, nicht per E-Mail. */
  app.post('/api/data/export', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true, allowSuspended: true });
    const b = body(req, z.object({ password: z.string().min(8).max(200) }));
    const running = await one(`SELECT id FROM exports WHERE account_id = $1 AND status IN ('queued','running')`, [a.id]);
    if (running) return { ok: true };
    const row = await one(`INSERT INTO exports (account_id) VALUES ($1) RETURNING id`, [a.id]);
    await q(`UPDATE exports SET password_enc = $2 WHERE id = $1`, [row!.id, encrypt('export', b.password, `export:${row!.id}`)]);
    const { runExports } = await import('../services/export.js');
    runExports().catch(() => {});
    return { ok: true, hours: Math.round(p('P-EXPORT-DAUER') / 3600) };
  });

  /** AK-F68-03: nur nach erneuter Anmeldung. */
  app.get('/api/data/export/download', async (req, reply) => {
    const a = await requireMember(req, { allowDeletionPending: true, allowSuspended: true });
    if (Date.now() - a.reauthAt.getTime() > p('P-NEU-ANMELDUNG-EXPORT') * 1000) {
      throw new AppError(401, 'UI-NEU-ANMELDEN', {}, 'neu_anmelden');
    }
    const exp = await one(
      `SELECT file, ready_at FROM exports WHERE account_id = $1 AND status = 'ready' AND expires_at > now() ORDER BY ready_at DESC LIMIT 1`,
      [a.id],
    );
    if (!exp) throw notFound();
    const data = await getFile('exports', exp.file);
    reply.header('content-type', 'application/zip');
    reply.header('content-disposition', `attachment; filename="daten-${new Date(exp.ready_at).toISOString().slice(0, 10)}.zip"`);
    return reply.send(data);
  });

  /** AK-F68-04: keine Rückfrage — die Karenz ist die Rückfrage. */
  app.post('/api/data/delete', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true, allowSuspended: true });
    await startDeletion(a.id);
    const r = await one(`SELECT deletion_due_at FROM accounts WHERE id = $1`, [a.id]);
    return { deletionDueAt: r!.deletion_due_at };
  });

  /** AK-F68-06: Abbruch in der Karenz stellt den Zustand von vorher her. */
  app.post('/api/data/delete/cancel', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true, allowSuspended: true });
    const b = body(req, z.object({ reconsent: z.boolean().optional(), version: z.string().optional() }));
    const revoked = await one(
      `SELECT 1 FROM consents WHERE account_id = $1 AND purpose = $2 AND revoked_at IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM consents c2 WHERE c2.account_id = $1 AND c2.purpose = $2 AND c2.revoked_at IS NULL)`,
      [a.id, CONSENT_PURPOSE],
    );
    await tx(async (c) => {
      if (revoked) {
        // Nach einem Widerruf geht es nur mit einer neuen ausdrücklichen Einwilligung weiter
        if (!b.reconsent || b.version !== CONSENT_VERSION) throw new AppError(409, 'UI-EINWILLIGUNG-NEU', {}, 'einwilligung_noetig');
        await c.query(`INSERT INTO consents (account_id, purpose, text_version) VALUES ($1, $2, $3)`, [a.id, CONSENT_PURPOSE, CONSENT_VERSION]);
      }
      await c.query(`UPDATE accounts SET deletion_requested_at = NULL, deletion_due_at = NULL WHERE id = $1`, [a.id]);
    });
    return { ok: true };
  });

  /** Widerruf der Art.-9-Einwilligung (Q-09, AK-Q09-04) — Folge wie Löschen (⚠ W-05, AF-10). */
  app.post('/api/data/consent/revoke', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true, allowSuspended: true });
    const b = body(req, z.object({ consentId: z.string().uuid() }));
    const r = await one(`UPDATE consents SET revoked_at = now() WHERE id = $1 AND account_id = $2 AND revoked_at IS NULL RETURNING purpose`, [
      b.consentId,
      a.id,
    ]);
    if (!r) throw bad('UI-EINGABE-PRUEFEN');
    if (r.purpose === CONSENT_PURPOSE) await startDeletion(a.id);
    const acc = await one(`SELECT deletion_due_at FROM accounts WHERE id = $1`, [a.id]);
    return { ok: true, deletionDueAt: acc!.deletion_due_at };
  });
}
