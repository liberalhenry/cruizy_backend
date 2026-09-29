/**
 * Ereignisse mit Zusage (F32) und temporäre Ereignisgruppen (F33).
 *
 *  * Wer nicht zugesagt hat, sieht weder Zahl noch Namen der Zusagenden (AK-F32-01).
 *  * Eine Zusage ist eine Buchung: vorher die Schranke aus Nr. 64 (AK-F04-11).
 *  * Die Gruppe öffnet P-GRUPPE-OFFEN vor Beginn, ist reine Textgruppe und wird
 *    P-GRUPPE-ENDE nach dem Ende gelöscht (FV-51).
 *  * Blockierte sehen einander weder in der Liste noch in der Gruppe (AK-X06-01/02).
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { p } from '../config/params.js';
import { one, q } from '../db/pool.js';
import { requireCleared, requireMember } from '../lib/context.js';
import { decStr, encStr } from '../lib/crypto.js';
import { AppError, bad, notFound } from '../lib/errors.js';
import { body, idParam, params } from '../lib/http.js';
import { t } from '../lib/texts.js';
import { emit } from '../services/hub.js';
import { imgUrl } from '../services/media-tokens.js';
import { initialOf } from '../services/profiles.js';
import { sendPush } from '../services/push.js';

const NOT_BLOCKED = (viewer: string, other: string) => `NOT EXISTS (SELECT 1 FROM blocks b WHERE b.revoked_at IS NULL
   AND ((b.blocker_id = ${viewer} AND b.blocked_id = ${other}) OR (b.blocker_id = ${other} AND b.blocked_id = ${viewer})))`;

function groupState(e: { starts_at: Date; ends_at: Date }) {
  const nowMs = Date.now();
  const opens = new Date(e.starts_at).getTime() - p('P-GRUPPE-OFFEN') * 1000;
  const closes = new Date(e.ends_at).getTime() + p('P-GRUPPE-ENDE') * 1000;
  return { open: nowMs >= opens && nowMs < closes, opensAt: new Date(opens), closesAt: new Date(closes) };
}

export async function remindEvents() {
  // FV-50: Erinnerung P-EREIGNIS-ERINNERUNG vor Beginn — ohne Titel und Ort (AK-F32-06)
  const rows = await q(
    `UPDATE events SET reminded_at = now()
      WHERE status = 'approved' AND reminded_at IS NULL AND starts_at > now()
        AND starts_at <= now() + make_interval(secs => $1)
      RETURNING id`,
    [p('P-EREIGNIS-ERINNERUNG')],
  );
  for (const e of rows) {
    const rs = await q(`SELECT account_id FROM event_rsvps WHERE event_id = $1`, [e.id]);
    for (const r of rs) await sendPush(r.account_id, 'event', { title: t('ST-PUSH-11'), url: `/heute/ereignis/${e.id}` });
  }
}

export async function purgeEventGroups() {
  const rows = await q(
    `UPDATE events SET group_purged_at = now()
      WHERE group_purged_at IS NULL AND ends_at < now() - make_interval(secs => $1) RETURNING id`,
    [p('P-GRUPPE-ENDE')],
  );
  // AK-F33-04: Gruppe und Nachrichten gelöscht — gemeldete liegen als Kopie im Fall
  for (const e of rows) await q(`DELETE FROM event_group_messages WHERE event_id = $1`, [e.id]);
}

export default async function eventRoutes(app: FastifyInstance) {
  app.get('/api/events/:id', async (req) => {
    const a = await requireMember(req);
    const { id } = params(req, idParam);
    const e = await one(
      `SELECT e.*, pl.name AS place_name, pl.id AS pid FROM events e LEFT JOIN places pl ON pl.id = e.place_id
        WHERE e.id = $1 AND e.status IN ('approved','cancelled')`,
      [id],
    );
    if (!e || (e.ampel === 'rot' && !a.age1)) throw notFound();
    const mine = !!(await one(`SELECT 1 FROM event_rsvps WHERE event_id = $1 AND account_id = $2`, [id, a.id]));
    let attendees = null;
    if (mine) {
      const rows = await q(
        `SELECT pr.account_id, pr.name, pr.initial_color, pr.photo_mode,
                (SELECT ph.id FROM photos ph WHERE ph.account_id = pr.account_id AND ph.status = 'approved' ORDER BY position LIMIT 1) AS photo_id
           FROM event_rsvps r JOIN profiles pr ON pr.account_id = r.account_id JOIN accounts a ON a.id = r.account_id
          WHERE r.event_id = $1 AND a.deletion_requested_at IS NULL AND a.moderation_state <> 'suspended'
            AND ${NOT_BLOCKED('$2', 'r.account_id')}
          ORDER BY r.created_at`,
        [id, a.id],
      );
      attendees = rows.map((r) => ({
        id: r.account_id,
        me: r.account_id === a.id,
        name: r.name,
        initial: initialOf(r.name),
        color: r.initial_color,
        photo: r.photo_mode === 'photo' && r.photo_id ? imgUrl('photo', r.photo_id, a.id, 'public') : null,
      }));
    }
    const g = groupState(e);
    return {
      event: {
        id: e.id,
        title: e.title,
        description: e.description,
        startsAt: e.starts_at,
        endsAt: e.ends_at,
        cancelled: e.status === 'cancelled',
        cancelNote: e.cancel_note,
        over: new Date(e.ends_at) < new Date(),
        place: e.pid ? { id: e.pid, name: e.place_name } : null,
        source: e.source,
      },
      rsvp: mine,
      count: attendees ? attendees.length : null,
      attendees,
      group: { open: mine && g.open, opensAt: g.opensAt, closesAt: g.closesAt },
    };
  });

  app.post('/api/events/:id/rsvp', async (req) => {
    const a = await requireCleared(req); // AK-F04-11: Zusage = Buchung
    const { id } = params(req, idParam);
    const e = await one(`SELECT status, ends_at FROM events WHERE id = $1`, [id]);
    if (!e || e.status !== 'approved') throw new AppError(409, 'UI-EREIGNIS-ABGESAGT', {}, 'abgesagt');
    if (new Date(e.ends_at) < new Date()) throw new AppError(409, 'UI-EREIGNIS-VORBEI', {}, 'vorbei'); // AK-F32-05
    await q(`INSERT INTO event_rsvps (event_id, account_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [id, a.id]);
    return { ok: true };
  });

  app.delete('/api/events/:id/rsvp', async (req) => {
    const a = await requireMember(req);
    const { id } = params(req, idParam);
    // AK-F32-03: sofort aus jeder Liste; die Gruppe ist damit verlassen
    await q(`DELETE FROM event_rsvps WHERE event_id = $1 AND account_id = $2`, [id, a.id]);
    return { ok: true };
  });

  app.get('/api/events/:id/group', async (req) => {
    const a = await requireMember(req);
    const { id } = params(req, idParam);
    const e = await one(`SELECT starts_at, ends_at FROM events WHERE id = $1`, [id]);
    const mine = await one(`SELECT 1 FROM event_rsvps WHERE event_id = $1 AND account_id = $2`, [id, a.id]);
    // AK-F33-01/02: vorher und ohne Zusage nicht zugänglich
    if (!e || !mine || !groupState(e).open) throw notFound();
    const rows = await q(
      `SELECT g.id, g.sender_id, g.body_enc, g.created_at, pr.name, pr.initial_color FROM event_group_messages g
         LEFT JOIN profiles pr ON pr.account_id = g.sender_id
        WHERE g.event_id = $1 AND ${NOT_BLOCKED('$2', 'g.sender_id')}
        ORDER BY g.created_at LIMIT 500`,
      [id, a.id],
    );
    return {
      closesAt: groupState(e).closesAt,
      messages: rows.map((r) => ({
        id: r.id,
        mine: r.sender_id === a.id,
        sender: r.sender_id === a.id ? null : { id: r.sender_id, name: r.name, initial: initialOf(r.name ?? '?'), color: r.initial_color },
        text: decStr('messages', r.body_enc, `grp:${id}`),
        createdAt: r.created_at,
      })),
    };
  });

  app.post('/api/events/:id/group', async (req) => {
    const a = await requireCleared(req); // F33: für das Schreiben dieselben Voraussetzungen wie beim ersten Senden
    const { id } = params(req, idParam);
    // AK-F33-03: nur Text
    const b = body(req, z.object({ text: z.string().min(1) }));
    const text = b.text.trim();
    if ([...text].length > p('P-NACHRICHT-MAX')) throw bad('ST-FEH-32', { zeichen: p('P-NACHRICHT-MAX') });
    const e = await one(`SELECT starts_at, ends_at FROM events WHERE id = $1 AND status = 'approved'`, [id]);
    const mine = await one(`SELECT 1 FROM event_rsvps WHERE event_id = $1 AND account_id = $2`, [id, a.id]);
    if (!e || !mine || !groupState(e).open || new Date(e.ends_at) < new Date(Date.now() - p('P-GRUPPE-ENDE') * 1000)) throw notFound();
    await q(`INSERT INTO event_group_messages (event_id, sender_id, body_enc) VALUES ($1, $2, $3)`, [id, a.id, encStr('messages', text, `grp:${id}`)]);
    const members = await q(`SELECT account_id FROM event_rsvps WHERE event_id = $1`, [id]);
    for (const m of members) emit(m.account_id, 'gruppe', { eventId: id });
    return { ok: true };
  });
}
