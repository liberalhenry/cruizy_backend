/**
 * Vorformulierte Nachrichten (Issue #21): eigene Textbausteine, die sich mit einem Tipp
 * senden lassen — gleiche Regeln wie jede Textnachricht (Länge, Erstkontakt, Blockierung).
 * Gespeichert verschlüsselt wie Nachrichten; nur für die Person selbst sichtbar.
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { p } from '../config/params.js';
import { one, q, tx } from '../db/pool.js';
import { requireMember } from '../lib/context.js';
import { decStr, encStr } from '../lib/crypto.js';
import { bad, notFound } from '../lib/errors.js';
import { body, idParam, params, uuid } from '../lib/http.js';

const aad = (accountId: string) => `tpl:${accountId}`;

function cleanText(text: string) {
  const s = text.replace(/\s+$/u, '').replace(/^\s+/u, '');
  if (!s) throw bad('UI-EINGABE-PRUEFEN', {}, 'leer');
  if ([...s].length > p('P-VORLAGE-ZEICHEN')) throw bad('ST-FEH-32', { zeichen: p('P-VORLAGE-ZEICHEN') }, 'zu_lang');
  return s;
}

export async function templatesOf(accountId: string) {
  const rows = await q(`SELECT id, text_enc, position FROM message_templates WHERE account_id = $1 ORDER BY position, created_at`, [accountId]);
  return rows.map((r) => ({ id: r.id as string, text: decStr('messages', r.text_enc, aad(accountId)) ?? '' }));
}

export default async function templateRoutes(app: FastifyInstance) {
  app.get('/api/templates', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    return { templates: await templatesOf(a.id), max: p('P-VORLAGEN-MAX'), maxChars: p('P-VORLAGE-ZEICHEN') };
  });

  app.post('/api/templates', async (req) => {
    const a = await requireMember(req);
    const b = body(req, z.object({ text: z.string().max(4000) }));
    const text = cleanText(b.text);
    const n = await one(`SELECT count(*)::int AS n, coalesce(max(position), -1) + 1 AS next FROM message_templates WHERE account_id = $1`, [a.id]);
    if (n!.n >= p('P-VORLAGEN-MAX')) throw bad('UI-VORLAGEN-MAX', { max: p('P-VORLAGEN-MAX') }, 'vorlagen_max');
    const r = await one(`INSERT INTO message_templates (account_id, text_enc, position) VALUES ($1, $2, $3) RETURNING id`, [
      a.id,
      encStr('messages', text, aad(a.id)),
      n!.next,
    ]);
    return { id: r!.id };
  });

  app.patch('/api/templates/:id', async (req) => {
    const a = await requireMember(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ text: z.string().max(4000) }));
    const r = await one(`UPDATE message_templates SET text_enc = $3 WHERE id = $1 AND account_id = $2 RETURNING id`, [
      id,
      a.id,
      encStr('messages', cleanText(b.text), aad(a.id)),
    ]);
    if (!r) throw notFound();
    return { ok: true };
  });

  app.delete('/api/templates/:id', async (req) => {
    const a = await requireMember(req);
    const { id } = params(req, idParam);
    const r = await one(`DELETE FROM message_templates WHERE id = $1 AND account_id = $2 RETURNING id`, [id, a.id]);
    if (!r) throw notFound();
    return { ok: true };
  });

  app.put('/api/templates/order', async (req) => {
    const a = await requireMember(req);
    const b = body(req, z.object({ ids: z.array(uuid).max(100) }));
    await tx(async (c) => {
      for (let i = 0; i < b.ids.length; i++) await c.query(`UPDATE message_templates SET position = $3 WHERE id = $1 AND account_id = $2`, [b.ids[i], a.id, i]);
    });
    return { ok: true };
  });
}
