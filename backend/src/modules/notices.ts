/**
 * Mitteilungsbereich (Z-01, S55) und Rückmeldefeld (Z-07).
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one, q } from '../db/pool.js';
import { requireMember } from '../lib/context.js';
import { encStr } from '../lib/crypto.js';
import { tooMany } from '../lib/errors.js';
import { noticeTarget } from '../services/notify.js';
import { body, idParam, params } from '../lib/http.js';
import { hit } from '../lib/rate.js';

export default async function noticeRoutes(app: FastifyInstance) {
  app.get('/api/notices', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true, allowSuspended: true });
    const rows = await q(
      `SELECT id, kind, title, body, ref, url, created_at, first_shown_at, read_at FROM notices WHERE account_id = $1 ORDER BY created_at DESC LIMIT 200`,
      [a.id],
    );
    // AK-Z01-03: Zeitpunkt der ersten Anzeige als Zustellnachweis
    const fresh = rows.filter((r) => !r.first_shown_at).map((r) => r.id);
    if (fresh.length) await q(`UPDATE notices SET first_shown_at = now() WHERE id = ANY($1)`, [fresh]);
    return {
      notices: rows.map((r) => ({
        id: r.id,
        kind: r.kind,
        title: r.title,
        body: r.body,
        ref: r.ref,
        // Issue #36: Knopf „Dorthin“ statt Download
        target: noticeTarget(r.kind, r.ref, r.url),
        createdAt: r.created_at,
        read: !!r.read_at,
      })),
    };
  });

  app.get('/api/notices/unread', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true, allowSuspended: true });
    const r = await one(`SELECT count(*)::int AS n FROM notices WHERE account_id = $1 AND read_at IS NULL`, [a.id]);
    return { count: r!.n };
  });

  app.post('/api/notices/:id/read', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true, allowSuspended: true });
    const { id } = params(req, idParam);
    await q(`UPDATE notices SET read_at = COALESCE(read_at, now()), first_shown_at = COALESCE(first_shown_at, now()) WHERE id = $1 AND account_id = $2`, [id, a.id]);
    return { ok: true };
  });

  // Issue #36: der Download als Textdatei (AK-Z01-04) ist entfallen — Mitteilungen stehen weiter in
  // der Datenkopie (Art. 15/20); in der App führt stattdessen ein Knopf dorthin, wo es weitergeht.

  /** Rückmeldefeld (Z-07, FV-89): ohne Konto-Kennung, außer eine Antwort ist erwünscht. */
  app.post('/api/feedback', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    const b = body(req, z.object({ text: z.string().min(1).max(3000), wantsReply: z.boolean().default(false) }));
    if (!hit('feedback', a.id, 10, 3600_000)) throw tooMany();
    await q(`INSERT INTO feedback (account_id, text_enc, wants_reply) VALUES ($1, $2, $3)`, [
      b.wantsReply ? a.id : null,
      encStr('tickets', b.text, 'feedback'),
      b.wantsReply,
    ]);
    return { ok: true };
  });
}
