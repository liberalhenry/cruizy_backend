/**
 * Hilfe und Kontakt (F75): vier Eingänge, zehn Kategorien, Fallnummer sofort,
 * „Antwort nur in der App“ voreingestellt für Angemeldete (FV-92), ohne Konto
 * vollständig bearbeitbar (AK-F75-02).
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { p } from '../config/params.js';
import { one, q } from '../db/pool.js';
import { loadAccount, requireMember } from '../lib/context.js';
import { decStr, encStr } from '../lib/crypto.js';
import { bad, notFound, tooMany } from '../lib/errors.js';
import { putFile } from '../lib/files.js';
import { body, idParam, ipKey, params } from '../lib/http.js';
import { prepare } from '../lib/images.js';
import { nextNumber } from '../lib/numbers.js';
import { hit } from '../lib/rate.js';
import { t } from '../lib/texts.js';
import { sendMail } from '../providers/mail.js';
import { discord } from '../services/discord.js';
import { runHashCheck } from '../providers/checks.js';
import { readUpload } from './photos.js';

/** Kategorie → Eingang (kontaktservice-und-tickets.md, 2.3) */
export const CATEGORY_POT: Record<number, 'missbrauch' | 'hilfe' | 'datenschutz' | 'behoerden' | null> = {
  1: 'missbrauch',
  2: 'missbrauch',
  3: 'hilfe',
  4: 'hilfe',
  5: 'hilfe',
  6: 'datenschutz',
  7: null, // → Widerspruch (M50), kein Vorgang
  8: 'missbrauch',
  9: 'behoerden',
  10: 'hilfe',
};

export function deadlineSeconds(pot: string, category: number): number {
  if (category === 1) return 0; // unverzüglich
  if (pot === 'datenschutz' || pot === 'behoerden') return p('P-TICKET-FRIST-DATENSCHUTZ');
  return p('P-TICKET-FRIST');
}

export default async function helpRoutes(app: FastifyInstance) {
  app.post('/api/help/tickets', async (req) => {
    const acc = await loadAccount(req);
    const b = body(
      req,
      z.object({
        category: z.number().int().min(1).max(10),
        text: z.string().min(1).max(p('P-TICKET-MAX')),
        replyWay: z.enum(['app', 'email']).default('app'),
        email: z.string().email().max(254).optional(),
        relatedRef: z.string().max(100).optional(),
      }),
    );
    if (!hit('ticket', acc?.id ?? ipKey(req), 10, 3600_000)) throw tooMany();
    const pot = CATEGORY_POT[b.category];
    // AK-F75-07: Kategorie 7 legt keinen Vorgang an, sondern führt zum Widerspruch
    if (!pot) return { redirect: 'widerspruch', textId: 'ST-HLF-23' };
    const loggedIn = !!acc && acc.consented;
    const replyWay = loggedIn ? b.replyWay : 'email';
    if (replyWay === 'email' && !b.email && !loggedIn) throw bad('ST-HLF-22', {}, 'email_noetig');
    let email = b.email ?? null;
    if (replyWay === 'email' && !email && acc) {
      const r = await one(`SELECT email_enc FROM accounts WHERE id = $1`, [acc.id]);
      email = decStr('pii', r?.email_enc, 'email');
      if (!email) throw bad('ST-HLF-22', {}, 'email_noetig');
    }
    const number = await nextNumber('H');
    const secs = deadlineSeconds(pot, b.category);
    const row = await one(
      `INSERT INTO tickets (number, category, pot, account_id, had_account, text_enc, reply_way, email_enc, related_ref, priority, deadline_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now() + make_interval(secs => $11)) RETURNING id`,
      [
        number,
        b.category,
        pot,
        loggedIn ? acc!.id : null,
        loggedIn,
        encStr('tickets', b.text, 'ticket'),
        replyWay,
        email ? encStr('tickets', email, 'ticket') : null,
        b.relatedRef ?? null,
        b.category === 1,
        secs,
      ],
    );
    if (!loggedIn && email) {
      // FV-92: Betreff nur die Fallnummer
      await sendMail({ to: email, subject: t('ST-HLF-24', { fallnummer: number }), text: t('UI-MAIL-HILFE-EINGANG', { fallnummer: number }) });
    }
    discord('meldungen', {
      title: `Neue Anfrage ${number}`,
      level: b.category === 1 ? 'danger' : 'info',
      fields: [
        { name: 'Kategorie', value: String(b.category) },
        { name: 'Bereich', value: pot },
        { name: 'Konto', value: loggedIn ? 'ja' : 'nein' },
      ],
    });
    // AK-F75-01: Fallnummer sofort
    return { id: row!.id, number, datenschutz: pot === 'datenschutz' };
  });

  app.post('/api/help/tickets/:id/attachment', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true, allowSuspended: true });
    const { id } = params(req, idParam);
    const tk = await one(`SELECT id, attachment_file FROM tickets WHERE id = $1 AND account_id = $2`, [id, a.id]);
    if (!tk || tk.attachment_file) throw notFound();
    const { buffer } = await readUpload(req);
    const prepared = await prepare(buffer); // derselbe Prüfweg wie jedes Bild (M85.04)
    const h = await runHashCheck(prepared.data);
    if (h.hit) throw bad('ST-FEH-33');
    const file = await putFile('tickets', prepared.data);
    await q(`UPDATE tickets SET attachment_file = $2 WHERE id = $1`, [id, file]);
    return { ok: true };
  });

  app.get('/api/help/tickets', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true, allowSuspended: true });
    const rows = await q(`SELECT * FROM tickets WHERE account_id = $1 ORDER BY created_at DESC`, [a.id]);
    const out = [];
    for (const r of rows) {
      const msgs = await q(`SELECT author, body_enc, created_at FROM ticket_messages WHERE ticket_id = $1 ORDER BY created_at`, [r.id]);
      out.push({
        id: r.id,
        number: r.number,
        category: r.category,
        status: r.status,
        createdAt: r.created_at,
        text: decStr('tickets', r.text_enc, 'ticket'),
        messages: msgs.map((m) => ({ fromTeam: m.author === 'team', text: decStr('tickets', m.body_enc, 'ticket'), at: m.created_at })),
      });
    }
    return { tickets: out };
  });

  app.post('/api/help/tickets/:id/reply', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true, allowSuspended: true });
    const { id } = params(req, idParam);
    const b = body(req, z.object({ text: z.string().min(1).max(p('P-TICKET-MAX')) }));
    const tk = await one(`SELECT id, status FROM tickets WHERE id = $1 AND account_id = $2`, [id, a.id]);
    if (!tk || tk.status === 'abgeschlossen') throw notFound();
    await q(`INSERT INTO ticket_messages (ticket_id, author, body_enc) VALUES ($1, 'person', $2)`, [id, encStr('tickets', b.text, 'ticket')]);
    await q(`UPDATE tickets SET status = 'in_bearbeitung' WHERE id = $1 AND status = 'beantwortet'`, [id]);
    return { ok: true };
  });

  /** Stand eines Vorgangs ohne Konto — nachschlagbar mit Fallnummer (FV-91). */
  app.get('/api/public/tickets/:number', async (req) => {
    const { number } = params(req, z.object({ number: z.string().regex(/^H-\d{4}-\d{6}$/) }));
    if (!hit('ticket-lookup', ipKey(req), 30, 3600_000)) throw tooMany();
    const tk = await one(`SELECT status, created_at FROM tickets WHERE number = $1`, [number]);
    if (!tk) throw notFound();
    return { status: tk.status };
  });
}
