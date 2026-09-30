/**
 * Gespräche (F41–F47, F12, F43, F44, F56-Karte, Z-03).
 *
 * PRÜFUNG ERFORDERLICH — Zugriff je Gespräch, Medien-Schranke, Stufe 2.
 *
 *  * Keine Nachrichtenlimits (AK-F41-01); Absender sieht nur „gesendet“ (AK-F41-02);
 *    keine Lesebestätigung, kein „schreibt gerade“ (F52). Den eigenen Lesestand kennt
 *    der Server nur, damit ungelesene Gespräche auf allen Geräten markiert sind (Issue #14) —
 *    die Gegenseite erfährt ihn nie.
 *  * Erstnachrichten landen in „Anfragen“, ohne Mitteilung und ohne Zählmarke (F42).
 *  * Medien nach der Einstellung der empfangenden Person (FV-57, FV-96), serverseitig
 *    erzwungen, auch bei direktem Aufruf (AK-F43-01).
 *  * Nachrichten liegen verschlüsselt und nur in der EU (AK-F41-07).
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { p } from '../config/params.js';
import { one, q, tx, type Queryable, db } from '../db/pool.js';
import { requireCleared, requireMember, type AccountCtx } from '../lib/context.js';
import { decStr, encStr } from '../lib/crypto.js';
import { AppError, bad, notFound } from '../lib/errors.js';
import { deleteFile, putFile } from '../lib/files.js';
import { body, idParam, params, uuid } from '../lib/http.js';
import { prepare } from '../lib/images.js';
import { prepareAudio } from '../lib/audio.js';
import { isoWeek } from '../lib/time.js';
import { t } from '../lib/texts.js';
import { runHashCheck } from '../providers/checks.js';
import { STARTERS, traitName } from '../services/catalogs.js';
import { emit } from '../services/hub.js';
import { audioUrl, imgUrl } from '../services/media-tokens.js';
import { metric } from '../services/metrics.js';
import { openHashCase } from '../services/photo-chain.js';
import { activityBand, currentIntention, initialOf, isBlockedEitherWay, canSee } from '../services/profiles.js';
import { sendPush } from '../services/push.js';
import { recomputeResponseRates } from '../services/response-rate.js';
import { stage2Required, stage2Satisfied } from '../services/stage2.js';
import { dropImageCache } from './media.js';
import { readUpload } from './photos.js';
import { CONTRACT_VERSION } from './verification.js';

const EXIT_DELAY_MS = 5000;

export function pair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

interface ConvRow {
  id: string;
  user_low: string;
  user_high: string;
  initiator_id: string;
  state: 'open' | 'ended';
  ended_by: string | null;
  ended_at: Date | null;
  low_text_at: Date | null;
  high_text_at: Date | null;
  disappearing_by: string | null;
  disappearing_since: Date | null;
  pending_exit_by: string | null;
  pending_exit_at: Date | null;
  last_message_at: Date;
  created_at: Date;
  low_read_at: Date | null;
  high_read_at: Date | null;
}

const other = (c: ConvRow, me: string) => (c.user_low === me ? c.user_high : c.user_low);
const myTextAt = (c: ConvRow, me: string) => (c.user_low === me ? c.low_text_at : c.high_text_at);
const theirTextAt = (c: ConvRow, me: string) => (c.user_low === me ? c.high_text_at : c.low_text_at);
const bothWrote = (c: ConvRow) => !!c.low_text_at && !!c.high_text_at;
const myReadAt = (c: ConvRow, me: string) => (c.user_low === me ? c.low_read_at : c.high_read_at);

/** Nachrichten der Gegenseite, die zugestellt sind und nach dem eigenen Lesestand kamen (Issue #14). */
const UNREAD_SQL = `m.sender_id IS NOT NULL AND m.sender_id <> $2 AND m.kind <> 'system'
  AND (m.expires_at IS NULL OR m.expires_at > now())
  AND (m.kind NOT IN ('image','audio') OR m.delivery IN ('sent','held_stage2'))`;

export async function markRead(convId: string, me: string) {
  await q(
    `UPDATE conversations SET low_read_at = CASE WHEN user_low = $2 THEN now() ELSE low_read_at END,
                              high_read_at = CASE WHEN user_high = $2 THEN now() ELSE high_read_at END
      WHERE id = $1 AND (user_low = $2 OR user_high = $2)`,
    [convId, me],
  );
}

/** Gespräch für eine beteiligte Person — verschwindet bei Blockierung (AK-F61-01). */
async function convFor(convId: string, me: string, client: Queryable = db()): Promise<ConvRow> {
  const c = await one<ConvRow>(`SELECT * FROM conversations WHERE id = $1 AND (user_low = $2 OR user_high = $2)`, [convId, me], client);
  if (!c) throw notFound();
  if (await isBlockedEitherWay(me, other(c, me))) throw notFound();
  if (c.state === 'ended' && c.ended_at && Date.now() - new Date(c.ended_at).getTime() > p('P-ARCHIV') * 1000) throw notFound();
  return c;
}

/** Kann die Gegenseite noch erreicht werden? (Löschkarenz, Sperre → nein, AK-F68-05) */
async function counterpartReachable(id: string): Promise<boolean> {
  const r = await one(
    `SELECT 1 FROM accounts WHERE id = $1 AND status = 'active' AND deletion_requested_at IS NULL
        AND moderation_state <> 'suspended' AND minor_locked_at IS NULL`,
    [id],
  );
  return !!r;
}

async function systemMessage(convId: string, code: string, actor: string | null, client: Queryable = db()) {
  const r = await one(
    `INSERT INTO messages (conversation_id, sender_id, kind, system_code) VALUES ($1, $2, 'system', $3) RETURNING id, created_at`,
    [convId, actor, code],
    client,
  );
  return r!;
}

function disappearingExpiry(c: ConvRow): Date | null {
  return c.disappearing_by ? new Date(Date.now() + p('P-VERFALL') * 1000) : null;
}

async function notifyNewMessage(c: ConvRow, senderId: string, preview: string | null) {
  const recipient = other(c, senderId);
  emit(recipient, 'nachricht', { conversationId: c.id });
  emit(senderId, 'nachricht', { conversationId: c.id });
  // F42: für Anfragen nie eine Mitteilung — nur wenn die empfangende Person selbst schon geschrieben hat
  if (!myTextAt(c, recipient)) return;
  const prof = await one(`SELECT push_preview FROM profiles WHERE account_id = $1`, [recipient]);
  let title = t('ST-PUSH-01');
  if (prof?.push_preview && preview !== null) {
    const s = await one(`SELECT name FROM profiles WHERE account_id = $1`, [senderId]);
    title = t('ST-PUSH-03', { name: s?.name ?? '', vorschau: preview.slice(0, 60) });
  }
  await sendPush(recipient, 'message', { title, url: `/chats/${c.id}`, tag: `c:${c.id}` }, senderId);
}

/** Antwortquote (F19, Issue #24): Erstnachricht beim Empfänger vermerken — nur Wertung, keine Inhalte. */
async function recordFirstMessage(convId: string, recipient: string, sender: string, client: Queryable) {
  await q(
    `INSERT INTO first_message_stats (conversation_id, recipient_id, sender_id, received_at, iso_week, counted, deadline_at)
     VALUES ($1, $2, $3, now(), $4, true, now() + make_interval(secs => $5)) ON CONFLICT DO NOTHING`,
    [convId, recipient, sender, isoWeek(new Date()), p('P-AQ-FRIST')],
    client,
  );
}

/** Erste Reaktion der angeschriebenen Person — Text, Sprache oder höfliche Absage (F19, AK-F45-04). */
async function markAnswered(convId: string, recipient: string, client: Queryable) {
  const r = await q(
    `UPDATE first_message_stats SET answered_at = now()
      WHERE conversation_id = $1 AND recipient_id = $2 AND answered_at IS NULL AND deadline_at > now() RETURNING 1`,
    [convId, recipient],
    client,
  );
  // nach dem Abschluss der Buchung neu berechnen (die Quote kommt nie aus dem Client)
  if (r.length) setTimeout(() => recomputeResponseRates(recipient).catch(() => {}), 300);
}

async function afterText(c: ConvRow, me: string, client: Queryable) {
  if (myTextAt(c, me)) return;
  const col = c.user_low === me ? 'low_text_at' : 'high_text_at';
  await q(`UPDATE conversations SET ${col} = now() WHERE id = $1`, [c.id], client);
  if (c.initiator_id !== me) {
    await markAnswered(c.id, me, client);
    // S63.02: Voreinstellung gilt für Gespräche, die die Person beantwortet
    if (!c.disappearing_by) {
      const pr = await one(`SELECT disappearing_default FROM profiles WHERE account_id = $1`, [me], client);
      if (pr?.disappearing_default) {
        await q(`UPDATE conversations SET disappearing_by = $2, disappearing_since = now() WHERE id = $1`, [c.id, me], client);
        await systemMessage(c.id, 'verfall_an', me, client);
      }
    }
    if (theirTextAt(c, me)) {
      // FV-08: zustande gekommener Kontakt
      await metric(me, 'contact', client);
      await metric(other(c, me), 'contact', client);
    }
  }
}

async function messageView(m: any, me: string, conv: ConvRow) {
  const mine = m.sender_id === me;
  const base = {
    id: m.id,
    mine,
    kind: m.kind,
    createdAt: m.created_at,
    expiresAt: m.expires_at,
    clientRef: mine ? m.client_ref : null,
  };
  if (m.kind === 'text' || m.kind === 'exit') {
    return { ...base, text: decStr('messages', m.body_enc, `msg:${conv.id}`) };
  }
  if (m.kind === 'image' && m.once) {
    // Issue #26: Einmal-Bild — nie eine Adresse in der Liste, nur der Zustand
    const state = m.once_viewed_at ? 'angesehen' : m.once_expired_at || !m.file ? 'abgelaufen' : 'neu';
    const closed = !mine && m.delivery === 'held_stage2';
    return { ...base, image: null, once: { state }, closed };
  }
  if (m.kind === 'image') {
    // Absender: immer „gesendet“ (AK-F43-12). Empfänger mit Stufe-2-Pflicht: geschlossene Kachel (FV-86).
    const closed = !mine && m.delivery === 'held_stage2';
    return { ...base, image: closed ? null : imgUrl('chat', m.id, me), closed };
  }
  if (m.kind === 'audio') {
    return { ...base, audio: m.file ? { url: audioUrl(m.id, me), durationMs: m.duration_ms ?? 0 } : null };
  }
  if (m.kind === 'place') {
    const pl = await one(`SELECT id, name, kind, district FROM places WHERE id = $1 AND removed_at IS NULL`, [m.place_id]);
    return { ...base, place: pl };
  }
  if (m.kind === 'album_offer') {
    const s = await one(`SELECT id, owner_id, state FROM album_shares WHERE id = $1`, [m.ref_id]);
    return { ...base, album: s ? { shareId: s.id, state: s.state, mine: s.owner_id === me } : null };
  }
  return { ...base, system: m.system_code, actorIsMe: mine };
}

export async function conversationSummary(c: ConvRow, me: string) {
  const otherId = other(c, me);
  const pr = await one(
    `SELECT pr.name, pr.photo_mode, pr.initial_color, a.last_active_at, a.status, a.deletion_requested_at, a.moderation_state,
            (SELECT id FROM photos ph WHERE ph.account_id = a.id AND ph.status = 'approved' ORDER BY position, created_at LIMIT 1) AS photo_id
       FROM accounts a LEFT JOIN profiles pr ON pr.account_id = a.id WHERE a.id = $1`,
    [otherId],
  );
  const available = !!pr && pr.status === 'active' && !pr.deletion_requested_at && pr.moderation_state !== 'suspended';
  const last = await one(
    `SELECT kind, body_enc, sender_id, system_code, once FROM messages
      WHERE conversation_id = $1 AND (expires_at IS NULL OR expires_at > now())
        AND (delivery = 'sent' OR sender_id = $2 OR delivery = 'held_stage2')
      ORDER BY created_at DESC LIMIT 1`,
    [c.id, me],
  );
  let preview: string | null = null;
  if (last?.kind === 'text' || last?.kind === 'exit') preview = decStr('messages', last.body_enc, `msg:${c.id}`)?.split('\n')[0] ?? null;
  const unread = await one(
    `SELECT count(*)::int AS n FROM messages m WHERE m.conversation_id = $1 AND ${UNREAD_SQL} AND ($3::timestamptz IS NULL OR m.created_at > $3)`,
    [c.id, me, myReadAt(c, me)],
  );
  const box =
    c.state === 'ended' ? 'archiv' : c.initiator_id === me || myTextAt(c, me) ? 'gespraeche' : 'anfragen';
  const pendingRequest =
    box !== 'archiv'
      ? !!(await one(`SELECT 1 FROM media_grants WHERE conversation_id = $1 AND recipient_id = $2 AND state = 'pending'`, [c.id, me]))
      : false;
  return {
    id: c.id,
    box,
    other: available
      ? {
          id: otherId,
          name: pr.name,
          initial: initialOf(pr.name ?? '?'),
          color: pr.initial_color,
          photo: pr.photo_mode === 'photo' && pr.photo_id ? imgUrl('photo', pr.photo_id, me, 'public') : null,
          activity: activityBand(pr.last_active_at ? new Date(pr.last_active_at) : null),
        }
      : { id: null, name: null, unavailable: true },
    lastAt: c.last_message_at,
    last: last ? { kind: last.kind, mine: last.sender_id === me, text: preview, system: last.system_code, once: !!last.once } : null,
    unread: unread!.n,
    disappearing: !!c.disappearing_by,
    disappearingMine: c.disappearing_by === me,
    state: c.state,
    endedByMe: c.ended_by === me,
    archiveUntil: c.ended_at ? new Date(new Date(c.ended_at).getTime() + p('P-ARCHIV') * 1000) : null,
    bothWrote: bothWrote(c),
    iWrote: !!myTextAt(c, me),
    initiatorIsMe: c.initiator_id === me,
    pendingExit: c.pending_exit_by === me ? c.pending_exit_at : null,
    mediaRequest: pendingRequest,
    reachable: available,
  };
}

// ───────────── Medien-Schranke (F43, FV-57, FV-96) ─────────────

export type MediaGate = { kind: 'allowed' } | { kind: 'blocked' } | { kind: 'request' } | { kind: 'pending' } | { kind: 'drop' };

export async function mediaGate(c: ConvRow, sender: string): Promise<MediaGate> {
  const recipient = other(c, sender);
  const grant = await one(`SELECT state FROM media_grants WHERE conversation_id = $1 AND recipient_id = $2`, [c.id, recipient]);
  if (grant?.state === 'allowed') return { kind: 'allowed' };
  const pr = await one(`SELECT media_receive FROM profiles WHERE account_id = $1`, [recipient]);
  const setting = pr?.media_receive ?? p('P-BILD-EMPFANG');
  if (setting === 'immer') return { kind: 'allowed' };
  if (setting === 'bestaetigung') {
    if (grant?.state === 'denied') return { kind: 'drop' };
    if (grant?.state === 'pending') return { kind: 'pending' };
    return { kind: 'request' };
  }
  // „Nach der ersten Antwort“: beide haben Text geschrieben; ein Ausstieg zählt nicht (AK-F43-03)
  if (grant?.state === 'pending') return { kind: 'pending' };
  if (grant?.state === 'denied') return { kind: 'drop' };
  return bothWrote(c) ? { kind: 'allowed' } : { kind: 'blocked' };
}

/** Bei „Immer erlaubt“ werden wartende Bilder zugestellt (FV-96, Randfall). */
export async function releaseHeldImages(recipientId: string) {
  const grants = await q(`SELECT conversation_id FROM media_grants WHERE recipient_id = $1 AND state = 'pending'`, [recipientId]);
  for (const g of grants) await decideRequest(g.conversation_id, recipientId, 'zulassen');
}

/** Nach bestandener Stufe 2: zurückgehaltene Bilder an diese Person werden sichtbar (FV-86). */
export async function releaseHeldForStage2(accountId: string) {
  const rows = await q(
    `UPDATE messages m SET delivery = 'sent' FROM conversations c
      WHERE m.conversation_id = c.id AND m.delivery = 'held_stage2' AND m.sender_id <> $1
        AND (c.user_low = $1 OR c.user_high = $1)
      RETURNING c.id`,
    [accountId],
  );
  for (const r of rows) emit(accountId, 'nachricht', { conversationId: r.id });
}

async function decideRequest(convId: string, recipient: string, decision: 'zulassen' | 'ablehnen') {
  const rows = await tx(async (c) => {
    const g = (await c.query(`SELECT state FROM media_grants WHERE conversation_id = $1 AND recipient_id = $2 FOR UPDATE`, [convId, recipient])).rows[0];
    if (!g || g.state !== 'pending') return null;
    await c.query(`UPDATE media_grants SET state = $3, decided_at = now() WHERE conversation_id = $1 AND recipient_id = $2`, [
      convId,
      recipient,
      decision === 'zulassen' ? 'allowed' : 'denied',
    ]);
    if (decision === 'zulassen') {
      // AK-F43-10: alle wartenden Bilder auf einmal zustellen
      const hasStage2 = stage2Required()
        ? !!(await c.query(`SELECT 1 FROM accounts WHERE id = $1 AND age2_at IS NOT NULL`, [recipient])).rowCount
        : true;
      await c.query(
        `UPDATE messages SET delivery = $3 WHERE conversation_id = $1 AND sender_id <> $2 AND delivery = 'held_request'`,
        [convId, recipient, hasStage2 ? 'sent' : 'held_stage2'],
      );
      return [];
    }
    // AK-F43-09: abgelehnt → alle wartenden Bilder gelöscht
    return (
      await c.query(
        `DELETE FROM private_media pm USING messages m
          WHERE m.media_id = pm.id AND m.conversation_id = $1 AND m.sender_id <> $2 AND m.delivery = 'held_request'
          RETURNING pm.file`,
        [convId, recipient],
      )
    ).rows;
  });
  if (rows) for (const r of rows) await deleteFile('zone2', r.file);
  emit(recipient, 'nachricht', { conversationId: convId });
  return rows !== null;
}

/** Wartende Bilder löschen (Blockierung, Verfall der Anfrage). */
export async function deleteHeldImages(convId: string, senderId?: string) {
  const rows = await q(
    `DELETE FROM private_media pm USING messages m
      WHERE m.media_id = pm.id AND m.conversation_id = $1 AND m.delivery IN ('held_request','held_stage2','dropped')
        AND ($2::uuid IS NULL OR m.sender_id = $2)
      RETURNING pm.file`,
    [convId, senderId ?? null],
  );
  for (const r of rows) await deleteFile('zone2', r.file);
}

/** Gespräch samt Bildern löschen (Archivablauf, endgültige Blockierung, Kontolöschung). */
export async function purgeConversation(convId: string, client: Queryable = db()) {
  const files = await q(
    `SELECT pm.id, pm.file FROM messages m JOIN private_media pm ON pm.id = m.media_id WHERE m.conversation_id = $1 AND pm.kind IN ('chat','audio')`,
    [convId],
    client,
  );
  await q(`DELETE FROM conversations WHERE id = $1`, [convId], client);
  if (files.length) await q(`DELETE FROM private_media WHERE id = ANY($1)`, [files.map((f) => f.id)], client);
  for (const f of files) await deleteFile('zone2', f.file);
}

/** Löscht eine einzelne Nachricht samt Bild (Verfall nach P-VERFALL). */
export async function deleteMessages(ids: string[]) {
  if (!ids.length) return;
  const files = await q(
    `SELECT pm.id, pm.file FROM messages m JOIN private_media pm ON pm.id = m.media_id WHERE m.id = ANY($1)`,
    [ids],
  );
  await q(`DELETE FROM messages WHERE id = ANY($1)`, [ids]);
  if (files.length) await q(`DELETE FROM private_media WHERE id = ANY($1)`, [files.map((f) => f.id)]);
  for (const f of files) await deleteFile('zone2', f.file);
}

// ───────────── Höflicher Ausstieg (F45) ─────────────

const exitTimers = new Map<string, NodeJS.Timeout>();

export async function finalizeExit(convId: string): Promise<boolean> {
  const done = await tx(async (cl) => {
    const c = (
      await cl.query(`SELECT * FROM conversations WHERE id = $1 AND pending_exit_at IS NOT NULL AND pending_exit_at <= now() FOR UPDATE`, [convId])
    ).rows[0] as ConvRow | undefined;
    if (!c || c.state !== 'open') return null;
    const by = c.pending_exit_by!;
    // AK-F45-03: die Gegenseite erhält genau den festen Text
    await cl.query(
      `INSERT INTO messages (conversation_id, sender_id, kind, body_enc, expires_at) VALUES ($1, $2, 'exit', $3, $4)`,
      [c.id, by, encStr('messages', t('ST-FEST-05'), `msg:${c.id}`), disappearingExpiry(c)],
    );
    await cl.query(
      `UPDATE conversations SET state = 'ended', ended_by = $2, ended_at = now(), pending_exit_by = NULL, pending_exit_at = NULL,
              last_message_at = now() WHERE id = $1`,
      [c.id, by],
    );
    // AK-F45-04: die Absage zählt für die Antwortquote als Antwort
    if (c.initiator_id !== by) await markAnswered(c.id, by, cl);
    return c;
  });
  exitTimers.delete(convId);
  if (!done) return false;
  emit(done.user_low, 'nachricht', { conversationId: convId });
  emit(done.user_high, 'nachricht', { conversationId: convId });
  return true;
}

function scheduleExit(convId: string) {
  clearTimeout(exitTimers.get(convId));
  exitTimers.set(
    convId,
    setTimeout(() => finalizeExit(convId).catch(() => {}), EXIT_DELAY_MS + 50),
  );
}

// ───────────── Senden ─────────────

async function checkCanWrite(a: AccountCtx, c: ConvRow | null, to: string) {
  if (!(await counterpartReachable(to))) throw new AppError(404, 'UI-NICHT-VERFUEGBAR', {}, 'nicht_erreichbar');
  if (await isBlockedEitherWay(a.id, to)) throw notFound();
  if (c && c.state === 'ended') throw new AppError(409, 'ST-CHAT-20', {}, 'beendet'); // AK-F45-05, AK-F46-02
  if (c?.pending_exit_by && c.pending_exit_by !== a.id) {
    // läuft eine Absage der Gegenseite, geht die Nachricht noch hinein — erst das Ende schließt
  }
}

async function insertText(a: AccountCtx, c: ConvRow, text: string, clientRef: string | null, cl: Queryable) {
  const dup = clientRef
    ? await one(`SELECT id FROM messages WHERE conversation_id = $1 AND sender_id = $2 AND client_ref = $3`, [c.id, a.id, clientRef], cl)
    : null;
  if (dup) return dup.id as string;
  const m = await one(
    `INSERT INTO messages (conversation_id, sender_id, kind, body_enc, expires_at, client_ref)
     VALUES ($1, $2, 'text', $3, $4, $5) RETURNING id`,
    [c.id, a.id, encStr('messages', text, `msg:${c.id}`), disappearingExpiry(c), clientRef],
    cl,
  );
  await q(`UPDATE conversations SET last_message_at = now() WHERE id = $1`, [c.id], cl);
  await afterText(c, a.id, cl);
  await metric(a.id, 'message_sent', cl);
  return m!.id as string;
}

function validText(text: string) {
  const s = text.replace(/\s+$/u, '');
  if (!s.trim()) throw bad('UI-EINGABE-PRUEFEN', {}, 'leer');
  if ([...s].length > p('P-NACHRICHT-MAX')) throw bad('ST-FEH-32', { zeichen: p('P-NACHRICHT-MAX') }, 'zu_lang'); // AK-F41-05
  return s;
}

/**
 * Sprachnachrichten (Issue #28): erst, wenn beide geschrieben haben (Erstkontakt nur Text),
 * und nur, wenn die empfangende Person sie nicht abgeschaltet hat.
 */
export async function voiceGate(c: ConvRow, sender: string): Promise<'ok' | 'erstkontakt' | 'aus' | 'beendet'> {
  if (c.state !== 'open') return 'beendet';
  if (!bothWrote(c)) return 'erstkontakt';
  const pr = await one(`SELECT voice_receive FROM profiles WHERE account_id = $1`, [other(c, sender)]);
  return pr?.voice_receive === false ? 'aus' : 'ok';
}

export default async function chatRoutes(app: FastifyInstance) {
  app.get('/api/conversations', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    const rows = await q<ConvRow>(
      `SELECT c.* FROM conversations c
        WHERE (c.user_low = $1 OR c.user_high = $1)
          AND NOT EXISTS (SELECT 1 FROM blocks b WHERE b.revoked_at IS NULL
                AND ((b.blocker_id = c.user_low AND b.blocked_id = c.user_high) OR (b.blocker_id = c.user_high AND b.blocked_id = c.user_low)))
          AND (c.state = 'open' OR c.ended_at > now() - make_interval(secs => $2))
        ORDER BY c.last_message_at DESC LIMIT 500`,
      [a.id, p('P-ARCHIV')],
    );
    const list = [];
    for (const c of rows) list.push(await conversationSummary(c, a.id));
    return { conversations: list };
  });

  /** Issue #14: ungelesene Gespräche — Zählmarke im Reiter „Chats“, getrennt nach Gesprächen und Anfragen. */
  app.get('/api/conversations/unread', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    const rows = await q(
      `SELECT c.id, (c.initiator_id = $1 OR (c.user_low = $1 AND c.low_text_at IS NOT NULL) OR (c.user_high = $1 AND c.high_text_at IS NOT NULL)) AS mine
         FROM conversations c
        WHERE (c.user_low = $1 OR c.user_high = $1) AND c.state = 'open'
          AND NOT EXISTS (SELECT 1 FROM blocks b WHERE b.revoked_at IS NULL
                AND ((b.blocker_id = c.user_low AND b.blocked_id = c.user_high) OR (b.blocker_id = c.user_high AND b.blocked_id = c.user_low)))
          AND EXISTS (SELECT 1 FROM messages m WHERE m.conversation_id = c.id AND ${UNREAD_SQL.replace(/\$2/g, '$1')}
                AND m.created_at > coalesce(CASE WHEN c.user_low = $1 THEN c.low_read_at ELSE c.high_read_at END, '-infinity'))`,
      [a.id],
    );
    return { conversations: rows.filter((r) => r.mine).length, requests: rows.filter((r) => !r.mine).length };
  });

  app.post('/api/conversations/:id/read', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    const { id } = params(req, idParam);
    await convFor(id, a.id);
    await markRead(id, a.id);
    return { ok: true };
  });

  app.get('/api/conversations/:id', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    const { id } = params(req, idParam);
    const c = await convFor(id, a.id);
    const before = (req.query as { before?: string }).before;
    const msgs = await q(
      `SELECT m.*, pm.file FROM messages m LEFT JOIN private_media pm ON pm.id = m.media_id
        WHERE m.conversation_id = $1 AND (m.expires_at IS NULL OR m.expires_at > now())
          AND (m.sender_id = $2 OR m.sender_id IS NULL OR m.delivery IN ('sent','held_stage2') OR m.kind NOT IN ('image','audio'))
          AND ($3::timestamptz IS NULL OR m.created_at < $3)
        ORDER BY m.created_at DESC LIMIT 200`,
      [c.id, a.id, before ?? null],
    );
    const views = [];
    for (const m of msgs.reverse()) views.push(await messageView(m, a.id, c));
    const summary = await conversationSummary(c, a.id);
    const gate = await mediaGate(c, a.id);
    const unlocked = await one(`SELECT revoked_at FROM face_unlocks WHERE conversation_id = $1 AND owner_id = $2`, [c.id, a.id]);
    const hasBlurred = await one(`SELECT 1 FROM photos WHERE account_id = $1 AND status = 'approved' AND blurred LIMIT 1`, [a.id]);
    const firstIncoming = c.initiator_id !== a.id && !myTextAt(c, a.id);
    const from = firstIncoming ? await one(`SELECT from_outside FROM conversations WHERE id = $1`, [c.id]) : null;
    // Issue #14: Öffnen markiert als gelesen — nur für mich
    if (!before) await markRead(c.id, a.id);
    const voice = await voiceGate(c, a.id);
    const me = await one(`SELECT starters_enabled, once_hint_seen FROM profiles WHERE account_id = $1`, [a.id]);
    return {
      voiceAllowed: voice === 'ok',
      voiceBlocked: voice === 'ok' ? null : voice,
      startersEnabled: me?.starters_enabled ?? true,
      onceHintSeen: me?.once_hint_seen ?? false,
      conversation: summary,
      messages: views,
      // Die sendende Seite sieht nur, ob der Knopf in Stellung 1 gesperrt ist (FV-57, Ablauf 4)
      mediaAllowed: gate.kind !== 'blocked',
      stage2: stage2Required() ? ((await stage2Satisfied(a)) ? 'offen' : a.age2 ? 'bestaetigung_noetig' : 'pruefung_noetig') : 'nicht_noetig',
      faceUnlock: { possible: !!hasBlurred, active: !!unlocked && !unlocked.revoked_at },
      icebreakerAvailable: !(await one(`SELECT 1 FROM messages WHERE conversation_id = $1 AND kind IN ('text','image','exit') LIMIT 1`, [c.id])),
      fromOutside: !!from?.from_outside,
    };
  });

  /** Erste Nachricht an eine Person (legt das Gespräch an). */
  app.post('/api/conversations', async (req) => {
    const a = await requireCleared(req);
    const b = body(req, z.object({ to: uuid, text: z.string(), clientRef: z.string().max(64).optional() }));
    if (b.to === a.id) throw bad('UI-EINGABE-PRUEFEN');
    const text = validText(b.text);
    const [low, high] = pair(a.id, b.to);
    const existing = await one<ConvRow>(`SELECT * FROM conversations WHERE user_low = $1 AND user_high = $2`, [low, high]);
    if (!existing) {
      // FV-18: neue Fassung des Community-Vertrags vor der nächsten Erstnachricht bestätigen
      const acc = await one(`SELECT contract_version FROM accounts WHERE id = $1`, [a.id]);
      if (acc?.contract_version !== CONTRACT_VERSION) throw new AppError(403, 'ST-CV-01', {}, 'vertrag_noetig');
      if (!(await canSee(a.id, b.to))) throw notFound();
    }
    await checkCanWrite(a, existing, b.to);
    const res = await tx(async (cl) => {
      let c = existing;
      let created = false;
      if (!c) {
        const r = await cl.query(
          `INSERT INTO conversations (user_low, user_high, initiator_id) VALUES ($1, $2, $3)
           ON CONFLICT (user_low, user_high) DO NOTHING RETURNING *`,
          [low, high, a.id],
        );
        c = r.rows[0] ?? (await one<ConvRow>(`SELECT * FROM conversations WHERE user_low = $1 AND user_high = $2`, [low, high], cl));
        created = !!r.rows[0];
        if (created) {
          const pr = await one(`SELECT disappearing_default FROM profiles WHERE account_id = $1`, [a.id], cl);
          if (pr?.disappearing_default) {
            await cl.query(`UPDATE conversations SET disappearing_by = $2, disappearing_since = now() WHERE id = $1`, [c!.id, a.id]);
            c = { ...c!, disappearing_by: a.id, disappearing_since: new Date() };
            await systemMessage(c.id, 'verfall_an', a.id, cl);
          }
          await recordFirstMessage(c!.id, b.to, a.id, cl);
          await metric(a.id, 'first_message', cl);
        }
      }
      const mid = await insertText(a, c!, text, b.clientRef ?? null, cl);
      if (created) await cl.query(`UPDATE first_message_stats SET first_message_id = $2 WHERE conversation_id = $1`, [c!.id, mid]);
      return { c: c!, mid };
    });
    await notifyNewMessage(res.c, a.id, text);
    return { conversationId: res.c.id, messageId: res.mid, status: 'gesendet' };
  });

  app.post('/api/conversations/:id/messages', async (req) => {
    const a = await requireCleared(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ text: z.string(), clientRef: z.string().max(64).optional() }));
    const text = validText(b.text);
    const c = await convFor(id, a.id);
    await checkCanWrite(a, c, other(c, a.id));
    const mid = await tx(async (cl) => insertText(a, c, text, b.clientRef ?? null, cl));
    await notifyNewMessage(c, a.id, text);
    return { messageId: mid, status: 'gesendet' };
  });

  /** Bild im Gespräch — Zone 2: kein Klassifikator, eigene Ablage (M-01, AK-F41-08). */
  app.post('/api/conversations/:id/images', async (req) => {
    const a = await requireCleared(req);
    const { id } = params(req, idParam);
    const c = await convFor(id, a.id);
    const to = other(c, a.id);
    await checkCanWrite(a, c, to);
    // AK-Z03-03: mit Schalter „Stufe 2“ braucht auch das Senden Stufe 2
    if (stage2Required() && !(await stage2Satisfied(a))) {
      throw new AppError(403, 'ST-VER-41', {}, a.age2 ? 'stufe2_bestaetigen' : 'stufe2_noetig');
    }
    const gate = await mediaGate(c, a.id);
    if (gate.kind === 'blocked') {
      // AK-F43-01: auch bei direktem Aufruf der Schnittstelle abgewiesen — ohne Inhalt protokolliert
      req.log.info({ conversation: c.id }, 'Erstkontakt: Medien abgewiesen');
      throw new AppError(403, 'ST-FEH-30', { name: '' }, 'erstkontakt_nur_text');
    }
    const { buffer, fields } = await readUpload(req);
    const prepared = await prepare(buffer); // Stufe 0
    // Stufe 1 in Zone 2 nur bei eingeschaltetem Schalter (M-09)
    let hashState: 'checked' | 'pending' | 'skipped' = 'skipped';
    if (p('P-ZONE2-ABGLEICH')) {
      const h = await runHashCheck(prepared.data);
      hashState = h.state;
      if (h.hit) {
        const tmp = await putFile('zone2', prepared.data);
        await openHashCase({ zone: 2, accountId: a.id, file: tmp, store: 'zone2', hash: h.hash, list: h.list ?? 'unbekannt' });
        await deleteFile('zone2', tmp);
        // kein erklärender Text (M-04, AK-M04-07)
        throw new AppError(400, 'ST-FEH-33', {}, 'nicht_gesendet');
      }
    }
    const file = await putFile('zone2', prepared.data);
    let delivery: 'sent' | 'held_request' | 'held_stage2' | 'dropped' = 'sent';
    if (gate.kind === 'request' || gate.kind === 'pending') delivery = 'held_request';
    if (gate.kind === 'drop') delivery = 'dropped';
    if (delivery === 'sent' && stage2Required()) {
      const r = await one(`SELECT age2_at FROM accounts WHERE id = $1`, [to]);
      if (!r?.age2_at) delivery = 'held_stage2'; // FV-86: geschlossene Kachel, der Absender erfährt nichts
    }
    const clientRef = fields.clientRef?.slice(0, 64) ?? null;
    // Issue #26: Einmal-Bild — gleiche Schranken, gleiche Aufbereitung, nur einmal abrufbar
    const once = fields.once === 'true';
    const mid = await tx(async (cl) => {
      const media = await one(
        `INSERT INTO private_media (owner_id, kind, file, width, height, hash_state) VALUES ($1, 'chat', $2, $3, $4, $5) RETURNING id`,
        [a.id, file, prepared.width, prepared.height, hashState],
        cl,
      );
      const m = await one(
        `INSERT INTO messages (conversation_id, sender_id, kind, media_id, delivery, expires_at, client_ref, once)
         VALUES ($1, $2, 'image', $3, $4, $5, $6, $7) RETURNING id`,
        [c.id, a.id, media!.id, delivery, disappearingExpiry(c), clientRef, once],
        cl,
      );
      if (once) await cl.query(`UPDATE profiles SET once_hint_seen = true WHERE account_id = $1`, [a.id]);
      if (gate.kind === 'request') {
        // FV-96: eine Anfrage je Gespräch — weitere Bilder warten hinter derselben (AK-F43-08)
        await cl.query(
          `INSERT INTO media_grants (conversation_id, recipient_id, state) VALUES ($1, $2, 'pending') ON CONFLICT DO NOTHING`,
          [c.id, to],
        );
      }
      await cl.query(`UPDATE conversations SET last_message_at = now() WHERE id = $1`, [c.id]);
      await metric(a.id, 'message_sent', cl);
      return m!.id as string;
    });
    if (delivery === 'sent' || delivery === 'held_stage2') await notifyNewMessage(c, a.id, null);
    if (gate.kind === 'request') emit(to, 'nachricht', { conversationId: c.id });
    emit(a.id, 'nachricht', { conversationId: c.id });
    // Absender sieht in jedem Fall „gesendet“ (AK-F43-12)
    return { messageId: mid, status: 'gesendet' };
  });

  /** Sprachnachricht (Issue #28) — erst nach der ersten Antwort, nur wenn die Gegenseite sie empfängt. */
  app.post('/api/conversations/:id/audio', async (req) => {
    const a = await requireCleared(req);
    const { id } = params(req, idParam);
    const c = await convFor(id, a.id);
    const to = other(c, a.id);
    await checkCanWrite(a, c, to);
    const gate = await voiceGate(c, a.id);
    if (gate === 'erstkontakt') throw new AppError(403, 'UI-SPRACHE-ERST-ANTWORT', {}, 'erstkontakt_nur_text');
    if (gate === 'aus') throw new AppError(403, 'UI-SPRACHE-AUS', {}, 'sprache_aus');
    const { buffer, fields } = await readUpload(req);
    const audio = await prepareAudio(buffer, { maxSeconds: p('P-SPRACHE-MAX'), maxMb: p('P-SPRACHE-MB') });
    const file = await putFile('zone2', audio.data);
    const clientRef = fields.clientRef?.slice(0, 64) ?? null;
    const mid = await tx(async (cl) => {
      const media = await one(
        `INSERT INTO private_media (owner_id, kind, file, hash_state, mime) VALUES ($1, 'audio', $2, 'skipped', $3) RETURNING id`,
        [a.id, file, audio.mime],
        cl,
      );
      const m = await one(
        `INSERT INTO messages (conversation_id, sender_id, kind, media_id, delivery, expires_at, client_ref, duration_ms)
         VALUES ($1, $2, 'audio', $3, 'sent', $4, $5, $6) RETURNING id`,
        [c.id, a.id, media!.id, disappearingExpiry(c), clientRef, audio.durationMs],
        cl,
      );
      await cl.query(`UPDATE conversations SET last_message_at = now() WHERE id = $1`, [c.id]);
      await metric(a.id, 'message_sent', cl);
      return m!.id as string;
    });
    await notifyNewMessage(c, a.id, null);
    return { messageId: mid, status: 'gesendet', durationMs: audio.durationMs };
  });

  /**
   * Einmal-Bild öffnen (Issue #26): genau einmal. Liefert eine einmalig gültige Adresse;
   * die Datei wird kurz danach endgültig gelöscht (P-EINMAL-MELDEFENSTER, damit eine Meldung
   * aus dem Anzeigefenster noch eine Kopie sichern kann).
   */
  app.post('/api/conversations/:id/messages/:mid/open', async (req) => {
    const a = await requireMember(req);
    const { id, mid } = params(req, z.object({ id: uuid, mid: uuid }));
    await convFor(id, a.id);
    if (!(await stage2Satisfied(a))) throw new AppError(403, 'ST-VER-41', {}, 'stufe2_noetig');
    const m = await one(
      `UPDATE messages SET once_viewed_at = now(), once_purge_at = now() + make_interval(secs => $3)
        WHERE id = $1 AND conversation_id = $2 AND once AND sender_id <> $4 AND delivery = 'sent'
          AND once_viewed_at IS NULL AND once_expired_at IS NULL
        RETURNING id, sender_id`,
      [mid, id, p('P-EINMAL-MELDEFENSTER'), a.id],
    );
    if (!m) throw new AppError(410, 'UI-EINMAL-WEG', {}, 'einmal_weg');
    emit(m.sender_id, 'nachricht', { conversationId: id });
    return { url: imgUrl('once', mid, a.id, undefined, 60), seconds: p('P-EINMAL-ANZEIGE') };
  });

  app.post('/api/conversations/:id/media-request', async (req) => {
    const a = await requireMember(req, { write: true });
    const { id } = params(req, idParam);
    const b = body(req, z.object({ decision: z.enum(['zulassen', 'ablehnen']) }));
    await convFor(id, a.id);
    const ok = await decideRequest(id, a.id, b.decision);
    if (!ok) throw notFound();
    return { ok: true };
  });

  // ───── Höflicher Ausstieg ─────
  app.post('/api/conversations/:id/exit', async (req) => {
    const a = await requireMember(req, { write: true });
    const { id } = params(req, idParam);
    const c = await convFor(id, a.id);
    if (c.state !== 'open') throw new AppError(409, 'ST-CHAT-20', {}, 'beendet');
    const at = new Date(Date.now() + EXIT_DELAY_MS);
    // AK-F45-01: keine Bestätigungsabfrage, fünf Sekunden „Rückgängig“ — der Server hält die Absage zurück
    await q(`UPDATE conversations SET pending_exit_by = $2, pending_exit_at = $3 WHERE id = $1 AND state = 'open'`, [c.id, a.id, at]);
    scheduleExit(c.id);
    return { undoUntil: at.toISOString() };
  });

  app.delete('/api/conversations/:id/exit', async (req) => {
    const a = await requireMember(req);
    const { id } = params(req, idParam);
    // AK-F45-02: innerhalb der fünf Sekunden wird nichts gesendet
    const r = await one(
      `UPDATE conversations SET pending_exit_by = NULL, pending_exit_at = NULL
        WHERE id = $1 AND pending_exit_by = $2 AND pending_exit_at > now() AND state = 'open' RETURNING id`,
      [id, a.id],
    );
    if (!r) throw new AppError(409, 'UI-ZU-SPAET', {}, 'zu_spaet');
    clearTimeout(exitTimers.get(id));
    exitTimers.delete(id);
    return { ok: true };
  });

  // ───── Wiedereröffnung aus dem Archiv (F46) ─────
  app.post('/api/conversations/:id/reopen', async (req) => {
    const a = await requireMember(req, { write: true });
    const { id } = params(req, idParam);
    const c = await convFor(id, a.id);
    // FV-61: nur wer ausgestiegen ist, nur innerhalb von P-ARCHIV
    if (c.state !== 'ended' || c.ended_by !== a.id) throw new AppError(403, 'UI-EINGABE-PRUEFEN', {}, 'nicht_erlaubt');
    await tx(async (cl) => {
      await cl.query(`UPDATE conversations SET state = 'open', ended_by = NULL, ended_at = NULL, last_message_at = now() WHERE id = $1`, [c.id]);
      await systemMessage(c.id, 'wieder_geoeffnet', a.id, cl); // AK-F46-03
    });
    emit(other(c, a.id), 'nachricht', { conversationId: c.id });
    return { ok: true };
  });

  // ───── Verfallende Nachrichten (F47) ─────
  app.post('/api/conversations/:id/disappearing', async (req) => {
    const a = await requireMember(req, { write: true });
    const { id } = params(req, idParam);
    const b = body(req, z.object({ on: z.boolean() }));
    const c = await convFor(id, a.id);
    if (b.on) {
      if (c.disappearing_by) return { ok: true };
      await tx(async (cl) => {
        await cl.query(`UPDATE conversations SET disappearing_by = $2, disappearing_since = now() WHERE id = $1`, [c.id, a.id]);
        await systemMessage(c.id, 'verfall_an', a.id, cl);
      });
    } else {
      // AK-F47-04: ausschalten nur, wer eingeschaltet hat
      if (c.disappearing_by !== a.id) throw new AppError(403, 'UI-VERFALL-NICHT-DU', {}, 'nicht_erlaubt');
      await tx(async (cl) => {
        await cl.query(`UPDATE conversations SET disappearing_by = NULL, disappearing_since = NULL WHERE id = $1`, [c.id]);
        await systemMessage(c.id, 'verfall_aus', a.id, cl);
      });
    }
    emit(other(c, a.id), 'nachricht', { conversationId: c.id });
    return { ok: true };
  });

  // ───── Gesicht zeigen (F12) ─────
  app.post('/api/conversations/:id/face', async (req) => {
    const a = await requireMember(req, { write: true });
    const { id } = params(req, idParam);
    const b = body(req, z.object({ on: z.boolean() }));
    const c = await convFor(id, a.id);
    const viewer = other(c, a.id);
    if (b.on) {
      const has = await one(`SELECT 1 FROM photos WHERE account_id = $1 AND status = 'approved' AND blurred LIMIT 1`, [a.id]);
      if (!has) throw bad('UI-KEIN-UNKENNTLICHES-FOTO', {}, 'kein_foto');
      await tx(async (cl) => {
        await cl.query(
          `INSERT INTO face_unlocks (conversation_id, owner_id, viewer_id) VALUES ($1, $2, $3)
           ON CONFLICT (conversation_id, owner_id) DO UPDATE SET revoked_at = NULL, created_at = now()`,
          [c.id, a.id, viewer],
        );
        await systemMessage(c.id, 'gesicht_an', a.id, cl); // AK-F12-05
      });
    } else {
      await tx(async (cl) => {
        await cl.query(`UPDATE face_unlocks SET revoked_at = now() WHERE conversation_id = $1 AND owner_id = $2`, [c.id, a.id]);
        await systemMessage(c.id, 'gesicht_aus', a.id, cl);
      });
      dropImageCache('c:');
    }
    emit(viewer, 'nachricht', { conversationId: c.id });
    return { ok: true };
  });

  // ───── Ortskarte im Gespräch (F56) ─────
  app.post('/api/conversations/:id/place', async (req) => {
    const a = await requireMember(req, { write: true });
    const { id } = params(req, idParam);
    const b = body(req, z.object({ placeId: uuid }));
    const c = await convFor(id, a.id);
    if (!bothWrote(c)) throw new AppError(403, 'UI-TREFFPUNKT-SPAETER', {}, 'erst_beide');
    const pl = await one(`SELECT id FROM places WHERE id = $1 AND removed_at IS NULL`, [b.placeId]);
    if (!pl) throw notFound();
    await q(
      `INSERT INTO messages (conversation_id, sender_id, kind, place_id, expires_at) VALUES ($1, $2, 'place', $3, $4)`,
      [c.id, a.id, pl.id, disappearingExpiry(c)],
    );
    await q(`UPDATE conversations SET last_message_at = now() WHERE id = $1`, [c.id]);
    emit(other(c, a.id), 'nachricht', { conversationId: c.id });
    emit(a.id, 'nachricht', { conversationId: c.id });
    return { ok: true };
  });

  // ───── Gesprächsstarter (F44, Issue #30) ─────
  app.get('/api/icebreakers/:id', async (req) => {
    const a = await requireMember(req);
    const { id } = params(req, idParam);
    if (!(await canSee(a.id, id))) throw notFound();
    const [low, high] = pair(a.id, id);
    const conv = await one(`SELECT id FROM conversations WHERE user_low = $1 AND user_high = $2`, [low, high]);
    if (conv && (await one(`SELECT 1 FROM messages WHERE conversation_id = $1 AND kind IN ('text','image','exit','audio') LIMIT 1`, [conv.id]))) {
      return { suggestions: [] }; // AK-F44-03: nur im leeren Chat
    }
    const me = await one(`SELECT traits FROM profiles WHERE account_id = $1`, [a.id]);
    const them = await one(`SELECT traits, free_text, intention, intention_expires_at FROM profiles WHERE account_id = $1`, [id]);
    return { suggestions: buildStarters({ mine: me?.traits ?? [], theirs: them?.traits ?? [], bio: them?.free_text ?? '', intention: them ? currentIntention(them)?.key ?? null : null }) };
  });
}

/**
 * Gesprächsstarter aus den öffentlichen Angaben der Gegenseite (Issue #30).
 * 2–3 Vorschläge, jeder aus einer anderen Quelle; fehlt eine Quelle, springt „allgemein“ ein.
 */
export function buildStarters(input: { mine: number[]; theirs: number[]; bio: string; intention: string | null }, rnd: () => number = Math.random): string[] {
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rnd() * arr.length)];
  const fill = (tpl: string, vars: Record<string, string>) => tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  const shared = input.theirs.filter((x) => input.mine.includes(x));
  const onlyTheirs = input.theirs.filter((x) => !input.mine.includes(x));
  const sources: string[] = [];
  if (shared.length) sources.push(fill(pick(STARTERS.gemeinsam), { interesse: traitName(pick(shared)) ?? '' }));
  if (onlyTheirs.length) sources.push(fill(pick(STARTERS.interesse), { interesse: traitName(pick(onlyTheirs)) ?? '' }));
  if (input.bio.trim().length >= 20) sources.push(pick(STARTERS.bio));
  if (input.intention && STARTERS.absicht[input.intention]) sources.push(pick(STARTERS.absicht[input.intention]));
  const out = sources.slice(0, 3);
  const general = [...STARTERS.allgemein].sort(() => rnd() - 0.5);
  while (out.length < 3 && general.length) out.push(general.shift()!);
  // mindestens zwei, höchstens drei
  return out.slice(0, Math.max(2, Math.min(3, out.length)));
}

export { other as otherParticipant, type ConvRow };
