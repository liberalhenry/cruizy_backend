/**
 * Melden mit Fallnummer (F62, M-03) und Widerspruch (M-07).
 *
 * PRÜFUNG ERFORDERLICH.
 *  * Eine Meldung öffnet die Vertraulichkeit nur für die markierten Inhalte; der
 *    Fall enthält eine Kopie genau davon (AK-F62-03), versiegelt verschlüsselt.
 *  * Fallnummer sofort (AK-F62-01); ohne Konto über das Webformular (AK-F62-02, FV-72).
 *  * „Gewalt oder Gefahr“ hat Vorrang und wird auf Art. 18 DSA geprüft (AK-F62-06).
 *  * Die gemeldete Person erfährt nie, wer gemeldet hat (AK-F62-08).
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { p } from '../config/params.js';
import { one, q, tx } from '../db/pool.js';
import { requireMember } from '../lib/context.js';
import { decStr, encStr } from '../lib/crypto.js';
import { AppError, bad, notFound, tooMany } from '../lib/errors.js';
import { copyFile } from '../lib/files.js';
import { body, ipKey, uuid } from '../lib/http.js';
import { nextNumber } from '../lib/numbers.js';
import { hit } from '../lib/rate.js';
import { t } from '../lib/texts.js';
import { sendMail } from '../providers/mail.js';
import { discord } from '../services/discord.js';
import { blockUser } from './safety.js';

export const REASONS = {
  belaestigung: 'ST-MEL-03',
  nacktbilder: 'ST-MEL-04',
  fake: 'ST-MEL-05',
  minderjaehrig: 'ST-MEL-06',
  hass: 'ST-MEL-07',
  sexgeld: 'ST-MEL-08',
  gefahr: 'ST-MEL-09',
  intim_ohne_einwilligung: 'UI-MEL-INTIM', // FV-73
  passt_nicht_zu_date: 'UI-MEL-DATE', // Issue #19: sucht nur Hookups / passt nicht zu Date
  anderes: 'ST-MEL-10',
} as const;
type Reason = keyof typeof REASONS;
const reasonSchema = z.enum(Object.keys(REASONS) as [Reason, ...Reason[]]);

const itemSchema = z.object({
  kind: z.enum(['message', 'album_image', 'group_message', 'event_chat_message']),
  id: uuid,
});

async function snapshotItems(reporter: string, context: string, contextId: string | undefined, items: z.infer<typeof itemSchema>[]) {
  const out: { kind: string; snapshot: Buffer | null; sealed: string | null; ref: string; owner: string | null }[] = [];
  for (const it of items) {
    if (it.kind === 'message') {
      const m = await one(
        `SELECT m.*, c.user_low, c.user_high FROM messages m JOIN conversations c ON c.id = m.conversation_id
          WHERE m.id = $1 AND (c.user_low = $2 OR c.user_high = $2) AND (m.expires_at IS NULL OR m.expires_at > now())`,
        [it.id, reporter],
      );
      // AK-X11-02: bereits verfallene Nachrichten lassen sich nicht mehr melden
      if (!m || (contextId && m.conversation_id !== contextId)) throw bad('UI-MELDEN-INHALT-WEG', {}, 'inhalt_weg');
      if (m.sender_id === reporter) continue;
      if ((m.kind === 'image' || m.kind === 'audio') && m.delivery !== 'sent' && m.delivery !== 'held_stage2') continue;
      let sealed: string | null = null;
      let text: string | null = null;
      if (m.kind === 'image' || m.kind === 'audio') {
        const pm = await one(`SELECT file FROM private_media WHERE id = $1`, [m.media_id]);
        // Einmal-Bild (Issue #26): nur solange die Datei noch da ist — dann bleibt eine Kopie für die Prüfung
        if (pm?.file) sealed = await copyFile('zone2', pm.file, 'sealed');
        else if (m.once) throw bad('UI-MELDEN-INHALT-WEG', {}, 'inhalt_weg');
      } else if (m.body_enc) {
        text = decStr('messages', m.body_enc, `msg:${m.conversation_id}`);
      }
      out.push({
        kind: m.kind === 'image' ? (m.once ? 'einmal_bild' : 'bild_gespraech') : m.kind === 'audio' ? 'sprachnachricht' : 'nachricht',
        snapshot: encStr('sealed', JSON.stringify({ text, at: m.created_at, kind: m.kind }), 'report'),
        sealed,
        ref: m.id,
        owner: m.sender_id,
      });
    } else if (it.kind === 'album_image') {
      const pm = await one(
        `SELECT pm.* FROM private_media pm JOIN album_shares s ON s.owner_id = pm.owner_id AND s.album_id = pm.album_id
          WHERE pm.id = $1 AND pm.kind = 'album' AND s.viewer_id = $2 AND s.state = 'accepted'`,
        [it.id, reporter],
      );
      if (!pm) throw bad('UI-MELDEN-INHALT-WEG', {}, 'inhalt_weg');
      out.push({ kind: 'bild_album', snapshot: null, sealed: await copyFile('zone2', pm.file, 'sealed'), ref: pm.id, owner: pm.owner_id });
    } else if (it.kind === 'event_chat_message') {
      // Issue #16: Chat Veranstalter ↔ Gast — nur die eigenen Gesprächspartner
      const m = await one(
        `SELECT m.* FROM event_chat_messages m JOIN events e ON e.id = m.event_id WHERE m.id = $1 AND (m.guest_id = $2 OR e.host_id = $2)`,
        [it.id, reporter],
      );
      if (!m) throw bad('UI-MELDEN-INHALT-WEG', {}, 'inhalt_weg');
      if (m.sender_id === reporter) continue;
      out.push({
        kind: 'veranstaltungschat',
        snapshot: encStr('sealed', JSON.stringify({ text: decStr('messages', m.body_enc, `echat:${m.event_id}:${m.guest_id}`), at: m.created_at }), 'report'),
        sealed: null,
        ref: m.id,
        owner: m.sender_id,
      });
    } else {
      const gm = await one(
        `SELECT g.* FROM event_group_messages g JOIN event_rsvps r ON r.event_id = g.event_id AND r.account_id = $2 AND r.status = 'angenommen' WHERE g.id = $1`,
        [it.id, reporter],
      );
      if (!gm) throw bad('UI-MELDEN-INHALT-WEG', {}, 'inhalt_weg');
      out.push({
        kind: 'gruppennachricht',
        snapshot: encStr('sealed', JSON.stringify({ text: decStr('messages', gm.body_enc, `grp:${gm.event_id}`), at: gm.created_at }), 'report'),
        sealed: null,
        ref: gm.id,
        owner: gm.sender_id,
      });
    }
  }
  return out;
}

async function snapshotProfile(target: string) {
  const pr = await one(`SELECT name, free_text FROM profiles WHERE account_id = $1`, [target]);
  const photos = await q(`SELECT id, original_file FROM photos WHERE account_id = $1 AND status = 'approved' ORDER BY position LIMIT 8`, [target]);
  const out = [
    { kind: 'profil', snapshot: encStr('sealed', JSON.stringify({ name: pr?.name, text: pr?.free_text }), 'report'), sealed: null as string | null, ref: target, owner: target },
  ];
  for (const ph of photos) {
    out.push({ kind: 'profilfoto', snapshot: null as unknown as Buffer, sealed: await copyFile('zone1-original', ph.original_file, 'sealed'), ref: ph.id, owner: target });
  }
  return out;
}

export async function createReport(opts: {
  reporter: string | null;
  reporterContact?: { name?: string; email?: string } | null;
  reason: Reason;
  description?: string;
  targetId?: string | null;
  targetRef?: string | null;
  context: string;
  contextId?: string;
  items: Awaited<ReturnType<typeof snapshotItems>>;
  alsoBlocked?: boolean;
  fromWeb?: boolean;
  vaultRequest?: boolean;
}) {
  return tx(async (c) => {
    const number = await nextNumber('M', c);
    const priority = opts.reason === 'gefahr';
    const r = await one(
      `INSERT INTO reports (number, reporter_id, reporter_contact_enc, reason, description_enc, target_id, target_ref, context,
                            context_id, priority, deadline_at, also_blocked, from_web, vault_request)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now() + make_interval(secs => $11), $12, $13, $14) RETURNING id`,
      [
        number,
        opts.reporter,
        opts.reporterContact ? encStr('tickets', JSON.stringify(opts.reporterContact), 'report-contact') : null,
        opts.reason,
        opts.description ? encStr('sealed', opts.description, 'report') : null,
        opts.targetId ?? null,
        opts.targetRef ?? null,
        opts.context,
        opts.contextId ?? null,
        priority,
        priority ? Math.min(p('P-FRIST-MELDUNG'), 3600) : p('P-FRIST-MELDUNG'),
        !!opts.alsoBlocked,
        !!opts.fromWeb,
        !!opts.vaultRequest,
      ],
      c,
    );
    for (const it of opts.items) {
      await c.query(`INSERT INTO report_items (report_id, kind, snapshot_enc, sealed_file, original_ref) VALUES ($1, $2, $3, $4, $5)`, [
        r!.id,
        it.kind,
        it.snapshot ?? null,
        it.sealed,
        it.ref,
      ]);
    }
    await c.query(`INSERT INTO report_events (report_id, status) VALUES ($1, 'received')`, [r!.id]);
    return { id: r!.id as string, number };
  }).then((res) => {
    // Issue #6: nur Nummer, Grundkategorie und Herkunft — kein Inhalt, keine Beteiligten
    discord('meldungen', {
      title: `Neue Meldung ${res.number}`,
      level: opts.reason === 'gefahr' ? 'danger' : 'warn',
      fields: [
        { name: 'Grund', value: opts.reason },
        { name: 'Kontext', value: opts.context },
        { name: 'Eingang', value: opts.fromWeb ? 'Web ohne Konto' : 'App' },
        ...(opts.reason === 'gefahr' ? [{ name: 'Vorrang', value: 'ja' }] : []),
      ],
    });
    return res;
  });
}

export default async function reportRoutes(app: FastifyInstance) {
  app.post('/api/reports', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true, allowSuspended: true });
    const b = body(
      req,
      z.object({
        reason: reasonSchema,
        description: z.string().max(3000).optional(),
        targetId: uuid.optional(),
        context: z.enum(['profil', 'gespraech', 'album', 'gruppe', 'ort', 'ereignis', 'geloeschtes_gespraech', 'veranstaltung_chat', 'date']),
        contextId: uuid.optional(),
        items: z.array(itemSchema).max(50).default([]),
        alsoBlock: z.boolean().optional(),
      }),
    );
    if (!hit('report', a.id, 30, 3600_000)) throw tooMany();
    let items: Awaited<ReturnType<typeof snapshotItems>> = [];
    let target = b.targetId ?? null;
    if (b.context === 'gespraech' || b.context === 'album' || b.context === 'gruppe' || b.context === 'veranstaltung_chat') {
      items = await snapshotItems(a.id, b.context, b.context === 'gespraech' ? b.contextId : undefined, b.items);
      target ??= items.find((i) => i.owner && i.owner !== a.id)?.owner ?? null;
      if (b.context === 'gespraech' && b.contextId && !target) {
        const c = await one(`SELECT user_low, user_high FROM conversations WHERE id = $1 AND (user_low = $2 OR user_high = $2)`, [b.contextId, a.id]);
        if (c) target = c.user_low === a.id ? c.user_high : c.user_low;
      }
    } else if ((b.context === 'profil' || b.context === 'date') && target) {
      const exists = await one(`SELECT 1 FROM profiles WHERE account_id = $1`, [target]);
      if (!exists) throw notFound();
      items = (await snapshotProfile(target)) as typeof items;
    } else if (b.context === 'ereignis' && b.contextId) {
      // Issue #16: Veranstaltung melden — betroffen ist, wer sie eingestellt hat
      const e = await one(`SELECT host_id FROM events WHERE id = $1`, [b.contextId]);
      if (!e) throw notFound();
      target ??= e.host_id ?? null;
    }
    const res = await createReport({
      reporter: a.id,
      reason: b.reason,
      description: b.description,
      targetId: target,
      context: b.context,
      contextId: b.contextId,
      items,
      alsoBlocked: !!b.alsoBlock,
      vaultRequest: b.context === 'geloeschtes_gespraech',
    });
    if (b.alsoBlock && target && target !== a.id) await blockUser(a.id, target, false).catch(() => {});
    return { number: res.number, hours: Math.round(p('P-FRIST-MELDUNG') / 3600) };
  });

  /** Webformular ohne Konto (FV-72, Art. 16 DSA). */
  app.post('/api/public/report', async (req) => {
    const b = body(
      req,
      z.object({
        reason: z.union([reasonSchema, z.literal('missbrauchsdarstellung')]),
        where: z.string().min(2).max(500),
        description: z.string().max(3000).optional(),
        name: z.string().max(100).optional(),
        email: z.string().email().max(254).optional(),
        goodFaith: z.literal(true),
      }),
    );
    if (!hit('webreport', ipKey(req), 10, 3600_000)) throw tooMany();
    const csam = b.reason === 'missbrauchsdarstellung';
    // Name und E-Mail sind Pflicht — außer bei Verdacht auf Darstellungen sexuellen Kindesmissbrauchs
    if (!csam && (!b.name || !b.email)) throw bad('UI-MELDEN-KONTAKT', {}, 'kontakt_fehlt');
    const res = await createReport({
      reporter: null,
      reporterContact: b.name || b.email ? { name: b.name, email: b.email } : null,
      reason: csam ? 'minderjaehrig' : (b.reason as Reason),
      description: `${csam ? '[Verdacht Missbrauchsdarstellung] ' : ''}Fundstelle: ${b.where}\n\n${b.description ?? ''}`,
      targetRef: b.where,
      context: 'webformular',
      items: [],
      fromWeb: true,
    });
    if (b.email) {
      await sendMail({
        to: b.email,
        subject: t('ST-HLF-24', { fallnummer: res.number }),
        text: t('UI-MAIL-MELDUNG-EINGANG', { fallnummer: res.number }),
        design: { heading: t('UI-MAIL-KOPF-EINGANG') },
      });
    }
    return { number: res.number, hours: Math.round(p('P-FRIST-MELDUNG') / 3600) };
  });

  /** Meine Meldungen, Einsprüche und Entscheidungen, die mich betreffen (S56). */
  app.get('/api/reports/mine', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true, allowSuspended: true });
    const reports = await q(
      `SELECT r.id, r.number, r.created_at, r.status, r.decision, r.decision_reason, r.decided_at, r.reason
         FROM reports r WHERE r.reporter_id = $1 ORDER BY r.created_at DESC`,
      [a.id],
    );
    const affecting = await q(
      `SELECT r.id, r.number, r.decided_at, r.decision, r.decision_reason FROM reports r
        WHERE r.target_id = $1 AND r.decision IN ('inhalt_entfernt','eingeschraenkt','gesperrt') ORDER BY r.decided_at DESC`,
      [a.id],
    );
    const appeals = await q(
      `SELECT number, kind, created_at, deadline_at, decided_at, outcome, answer FROM appeals WHERE account_id = $1 ORDER BY created_at DESC`,
      [a.id],
    );
    const suspensions = await q(
      `SELECT id, action, reason, approved_at FROM suspensions WHERE account_id = $1 AND approved_at IS NOT NULL ORDER BY approved_at DESC`,
      [a.id],
    );
    return {
      reports: reports.map((r) => ({
        id: r.id,
        number: r.number,
        createdAt: r.created_at,
        status: r.status,
        decision: r.status === 'decided' || r.status === 'closed' ? r.decision : null,
        reason: r.decision_reason && (r.status === 'decided' || r.status === 'closed') ? r.decision_reason : null,
        decidedAt: r.decided_at,
      })),
      // Entscheidungen, die eigene Inhalte oder das Konto einschränken — mit Widerspruchsweg (S56.03)
      affecting: affecting.map((r) => ({ id: r.id, number: r.number, decidedAt: r.decided_at, decision: r.decision, reason: r.decision_reason })),
      suspensions: suspensions.map((s) => ({ id: s.id, action: s.action, reason: s.reason, at: s.approved_at })),
      appeals: appeals.map((x) => ({
        number: x.number,
        kind: x.kind,
        createdAt: x.created_at,
        deadlineAt: x.deadline_at,
        decidedAt: x.decided_at,
        outcome: x.outcome,
        answer: x.answer,
      })),
    };
  });

  /** Widerspruch gegen eine Entscheidung, die eigene Inhalte oder das Konto einschränkt (72 h, FV-81). */
  app.post('/api/appeals', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true, allowSuspended: true });
    const b = body(req, z.object({ reportId: uuid.optional(), suspensionId: uuid.optional(), text: z.string().min(1).max(3000) }));
    let decider: string | null = null;
    if (b.reportId) {
      const r = await one(`SELECT decided_by FROM reports WHERE id = $1 AND target_id = $2 AND decision IS NOT NULL`, [b.reportId, a.id]);
      if (!r) throw notFound();
      decider = r.decided_by;
    } else if (b.suspensionId) {
      const s = await one(`SELECT requested_by FROM suspensions WHERE id = $1 AND account_id = $2 AND approved_at IS NOT NULL`, [b.suspensionId, a.id]);
      if (!s) throw notFound();
      decider = s.requested_by;
    } else throw bad('UI-EINGABE-PRUEFEN');
    const open = await one(
      `SELECT number FROM appeals WHERE account_id = $1 AND decided_at IS NULL AND (report_id = $2 OR suspension_id = $3)`,
      [a.id, b.reportId ?? null, b.suspensionId ?? null],
    );
    if (open) throw new AppError(409, 'UI-WIDERSPRUCH-LAEUFT', {}, 'laeuft');
    const number = await nextNumber('E');
    await q(
      `INSERT INTO appeals (number, account_id, kind, report_id, suspension_id, text_enc, original_decider, deadline_at)
       VALUES ($1, $2, 'entscheidung', $3, $4, $5, $6, now() + make_interval(secs => $7))`,
      [number, a.id, b.reportId ?? null, b.suspensionId ?? null, encStr('tickets', b.text, 'appeal'), decider, p('P-FRIST-WIDERSPRUCH')],
    );
    discord('meldungen', { title: `Neuer Widerspruch ${number}`, level: 'warn', fields: [{ name: 'Art', value: b.reportId ? 'gegen Entscheidung zu Meldung' : 'gegen Sperre' }] });
    // AK-M07-03: die Bestätigung nennt die geltende Frist
    return { number, hours: Math.round(p('P-FRIST-WIDERSPRUCH') / 3600) };
  });
}
