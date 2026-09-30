/**
 * Veranstalter und eigene Veranstaltungen (Issue #16).
 *
 *  * Nur als Veranstalter verifizierte Konten veröffentlichen direkt. Alle anderen reichen ein
 *    (höchstens P-EINREICHUNGEN-MAX offen); das Team entscheidet im Einzelfall (M75).
 *  * Veranstaltungen bis P-VERANSTALTUNG-MONATE im Voraus, mit Kategorien, Gästezahl, Bildern,
 *    Beschreibung, Preis, Dresscode, Absagefrist und wahlweise Gäste-Annahme durch den Veranstalter.
 *  * Lage: ein Ort aus dem Verzeichnis der Orte (öffentlich, genau) oder ein Ort aus dem
 *    Ortsverzeichnis (Stadt/Stadtteil). Eine genaue Stecknadel nur bei öffentlichem Veranstaltungsort —
 *    private Adressen stehen nie auf der Karte und nur angenommene Gäste sehen sie.
 *  * Chat Veranstalter ↔ angenommener Gast: eigener Bereich, getrennt von privaten Chats.
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { p } from '../config/params.js';
import { one, q } from '../db/pool.js';
import { requireCleared, requireMember } from '../lib/context.js';
import { decStr, encStr } from '../lib/crypto.js';
import { AppError, bad, conflict, notFound, tooMany } from '../lib/errors.js';
import { deleteFile, putFile } from '../lib/files.js';
import { distanceKm } from '../lib/geo.js';
import { body, idParam, params, uuid } from '../lib/http.js';
import { prepare } from '../lib/images.js';
import { hit } from '../lib/rate.js';
import { t } from '../lib/texts.js';
import { EVENT_CATEGORY_KEYS, EVENT_CATEGORY_MAX, ORGANIZER_KIND_KEYS } from '../services/catalogs.js';
import { acceptedCount, eventImages, mapPoint } from '../services/event-view.js';
import { emit } from '../services/hub.js';
import { imgUrl } from '../services/media-tokens.js';
import { createNotice } from '../services/notify.js';
import { placeById, placeLabel } from '../services/places-dir.js';
import { initialOf, isBlockedEitherWay } from '../services/profiles.js';
import { readUpload } from './photos.js';

const eventInput = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(10_000).default(''),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  categories: z.array(z.string()).min(1).max(EVENT_CATEGORY_MAX),
  capacity: z.number().int().min(1).max(100_000).nullable().default(null),
  approvalRequired: z.boolean().default(false),
  cancelUntilHours: z.number().int().min(0).default(0),
  placeId: uuid.nullable().optional(),
  placeDirId: z.number().int().nullable().optional(),
  address: z.string().trim().max(200).nullable().optional(),
  publicVenue: z.boolean().default(false),
  pin: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).nullable().optional(),
  price: z.string().trim().max(60).nullable().optional(),
  dressCode: z.string().trim().max(120).nullable().optional(),
  ampel: z.enum(['gruen', 'gelb', 'rot']).default('gruen'),
});
type EventInput = z.infer<typeof eventInput>;

export async function organizerOf(accountId: string) {
  return one(`SELECT * FROM organizers WHERE account_id = $1`, [accountId]);
}

/** Prüft die Angaben und rechnet die Lage aus. */
async function checkInput(b: EventInput) {
  const now = Date.now();
  if (b.startsAt.getTime() < now - 60_000) throw bad('UI-VA-BEGINN-VORBEI', {}, 'beginn');
  const maxAhead = new Date();
  maxAhead.setMonth(maxAhead.getMonth() + p('P-VERANSTALTUNG-MONATE'));
  if (b.startsAt > maxAhead) throw bad('UI-VA-ZU-WEIT', { monate: p('P-VERANSTALTUNG-MONATE') }, 'zu_weit_voraus');
  if (b.endsAt <= b.startsAt) throw bad('UI-VA-ENDE', {}, 'ende');
  if (b.endsAt.getTime() - b.startsAt.getTime() > 14 * 86400_000) throw bad('UI-VA-ZU-LANG', {}, 'zu_lang');
  if ([...b.description].length > p('P-VERANSTALTUNG-TEXT')) throw bad('UI-VA-TEXT-LANG', { zeichen: p('P-VERANSTALTUNG-TEXT') }, 'text');
  const cats = [...new Set(b.categories)];
  if (cats.some((c) => !EVENT_CATEGORY_KEYS.has(c))) throw bad('UI-EINGABE-PRUEFEN', {}, 'kategorie');
  if (b.cancelUntilHours > p('P-ABSAGEFRIST-MAX')) throw bad('UI-VA-FRIST-LANG', { std: p('P-ABSAGEFRIST-MAX') }, 'frist');

  let loc: { placeId: string | null; area: string; address: string | null; lat: number; lng: number; isPublic: boolean };
  if (b.placeId) {
    const pl = await one(`SELECT id, name, district, address, lat, lng FROM places WHERE id = $1 AND removed_at IS NULL`, [b.placeId]);
    if (!pl) throw bad('UI-VA-ORT-FEHLT', {}, 'ort');
    loc = { placeId: pl.id, area: pl.district ? `${pl.name}, ${pl.district}` : pl.name, address: pl.address ?? null, lat: pl.lat, lng: pl.lng, isPublic: true };
  } else if (b.placeDirId) {
    const d = placeById(b.placeDirId);
    if (!d) throw bad('UI-VA-ORT-FEHLT', {}, 'ort');
    const base = { lat: d.lat, lng: d.lng };
    // genaue Stecknadel nur beim öffentlichen Veranstaltungsort und in der Nähe des gewählten Orts
    if (b.publicVenue && b.pin) {
      if (distanceKm(base, b.pin) > 40) throw bad('UI-VA-PIN-WEIT', {}, 'pin');
      loc = { placeId: null, area: placeLabel(d), address: b.address ?? null, lat: b.pin.lat, lng: b.pin.lng, isPublic: true };
    } else {
      loc = { placeId: null, area: placeLabel(d), address: b.address ?? null, lat: base.lat, lng: base.lng, isPublic: !!b.publicVenue && !!b.address };
    }
  } else {
    throw bad('UI-VA-ORT-FEHLT', {}, 'ort');
  }
  const exactOnMap = loc.isPublic && (!!b.placeId || !!b.pin);
  const mp = mapPoint({ lat: loc.lat, lng: loc.lng }, exactOnMap);
  return { cats, loc, map: mp, exactOnMap };
}

function eventValues(b: EventInput, c: Awaited<ReturnType<typeof checkInput>>) {
  return {
    title: b.title,
    description: b.description,
    starts_at: b.startsAt,
    ends_at: b.endsAt,
    categories: c.cats,
    capacity: b.capacity ?? null,
    approval_required: b.approvalRequired,
    cancel_until_hours: b.cancelUntilHours,
    place_id: c.loc.placeId,
    area: c.loc.area,
    address: c.loc.address,
    lat: c.loc.lat,
    lng: c.loc.lng,
    map_lat: c.map.lat,
    map_lng: c.map.lng,
    location_public: c.exactOnMap || c.loc.isPublic,
    price: b.price ?? null,
    dress_code: b.dressCode ?? null,
    ampel: b.ampel,
  };
}

async function hostEvent(id: string, accountId: string) {
  const e = await one(`SELECT * FROM events WHERE id = $1 AND host_id = $2`, [id, accountId]);
  if (!e) throw notFound();
  return e;
}

async function guestCounts(id: string) {
  const r = await one(
    `SELECT count(*) FILTER (WHERE status = 'angenommen')::int AS angenommen, count(*) FILTER (WHERE status = 'angefragt')::int AS angefragt,
            count(*) FILTER (WHERE status = 'abgesagt')::int AS abgesagt, count(*) FILTER (WHERE status = 'abgelehnt')::int AS abgelehnt
       FROM event_rsvps WHERE event_id = $1`,
    [id],
  );
  return r!;
}

/** Name des Gastgebers im Chat: Veranstaltername oder Profilname. */
async function hostName(e: { host_id: string; organizer_id: string | null }) {
  if (e.organizer_id) {
    const o = await one(`SELECT name FROM organizers WHERE id = $1`, [e.organizer_id]);
    if (o) return o.name as string;
  }
  return ((await one(`SELECT name FROM profiles WHERE account_id = $1`, [e.host_id]))?.name as string) ?? '';
}

async function chatAccess(eventId: string, guestId: string, me: string) {
  const e = await one(`SELECT id, title, host_id, organizer_id, ends_at, status FROM events WHERE id = $1`, [eventId]);
  if (!e || !e.host_id) throw notFound();
  if (me !== e.host_id && me !== guestId) throw notFound();
  // nur angenommene Gäste (Issue #16) — nach einer Absage bleibt der Verlauf lesbar
  const r = await one(`SELECT status FROM event_rsvps WHERE event_id = $1 AND account_id = $2`, [eventId, guestId]);
  if (!r || (r.status !== 'angenommen' && r.status !== 'abgesagt')) throw notFound();
  if (await isBlockedEitherWay(e.host_id, guestId)) throw notFound();
  const writable = r.status === 'angenommen' && new Date(e.ends_at).getTime() > Date.now() - 2 * 86400_000;
  return { e, writable, role: me === e.host_id ? ('veranstalter' as const) : ('gast' as const) };
}

export async function eventChatUnread(accountId: string): Promise<number> {
  const r = await one(
    `SELECT count(*)::int AS n FROM event_chats c JOIN events e ON e.id = c.event_id
      WHERE c.last_message_at IS NOT NULL AND (
        (e.host_id = $1 AND c.last_message_at > coalesce(c.host_read_at, '-infinity')
           AND EXISTS (SELECT 1 FROM event_chat_messages m WHERE m.event_id = c.event_id AND m.guest_id = c.guest_id AND m.sender_id <> $1 AND m.created_at > coalesce(c.host_read_at, '-infinity')))
        OR (c.guest_id = $1 AND c.last_message_at > coalesce(c.guest_read_at, '-infinity')
           AND EXISTS (SELECT 1 FROM event_chat_messages m WHERE m.event_id = c.event_id AND m.guest_id = c.guest_id AND m.sender_id <> $1 AND m.created_at > coalesce(c.guest_read_at, '-infinity'))))`,
    [accountId],
  );
  return r!.n;
}

/** Hintergrundauftrag: Chats 30 Tage nach dem Ende der Veranstaltung löschen. */
export async function purgeEventChats() {
  await q(`DELETE FROM event_chats c USING events e WHERE e.id = c.event_id AND e.ends_at < now() - interval '30 days'`);
}

export default async function veranstalterRoutes(app: FastifyInstance) {
  // ───── Verifizierung als Veranstalter ─────
  app.get('/api/organizer', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    const o = await organizerOf(a.id);
    const open = await one(`SELECT count(*)::int AS n FROM events WHERE host_id = $1 AND status = 'pending'`, [a.id]);
    return {
      organizer: o
        ? { id: o.id, name: o.name, kind: o.kind, city: o.city, website: o.website, status: o.status, note: o.status === 'abgelehnt' || o.status === 'entzogen' ? o.decision_note : null }
        : null,
      verified: o?.status === 'verifiziert',
      openSubmissions: open!.n,
      maxSubmissions: p('P-EINREICHUNGEN-MAX'),
    };
  });

  app.post('/api/organizer', async (req) => {
    const a = await requireCleared(req);
    const b = body(
      req,
      z.object({
        name: z.string().trim().min(2).max(100),
        kind: z.string(),
        city: z.string().trim().min(2).max(80),
        website: z.string().trim().url().max(300).nullable().optional(),
        email: z.string().trim().email().max(254),
        note: z.string().trim().max(1500).default(''),
      }),
    );
    if (!ORGANIZER_KIND_KEYS.has(b.kind)) throw bad('UI-EINGABE-PRUEFEN', {}, 'art');
    if (!hit('organizer', a.id, 5, 86400_000)) throw tooMany();
    const o = await organizerOf(a.id);
    if (o && (o.status === 'beantragt' || o.status === 'verifiziert')) throw conflict('UI-VA-SCHON-BEANTRAGT');
    const vals = [a.id, b.name, b.kind, b.city, b.website ?? null, encStr('pii', b.email, 'organizer'), b.note ? encStr('pii', b.note, 'organizer') : null];
    if (o) {
      await q(
        `UPDATE organizers SET name = $2, kind = $3, city = $4, website = $5, contact_email_enc = $6, note_enc = $7, status = 'beantragt',
                created_at = now(), decided_at = NULL, decided_by = NULL, decision_note = NULL WHERE account_id = $1`,
        vals,
      );
    } else {
      await q(`INSERT INTO organizers (account_id, name, kind, city, website, contact_email_enc, note_enc) VALUES ($1, $2, $3, $4, $5, $6, $7)`, vals);
    }
    return { ok: true, status: 'beantragt' };
  });

  app.delete('/api/organizer', async (req) => {
    const a = await requireMember(req);
    await q(`UPDATE events SET organizer_id = NULL WHERE organizer_id = (SELECT id FROM organizers WHERE account_id = $1)`, [a.id]);
    await q(`DELETE FROM organizers WHERE account_id = $1`, [a.id]);
    return { ok: true };
  });

  // ───── eigene Veranstaltungen ─────
  app.get('/api/host/events', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    const rows = await q(
      `SELECT e.id, e.title, e.starts_at, e.ends_at, e.status, e.capacity, e.area, e.cancel_note, e.review_note, e.featured, e.approval_required,
              count(r.*) FILTER (WHERE r.status = 'angenommen')::int AS angenommen,
              count(r.*) FILTER (WHERE r.status = 'angefragt')::int AS angefragt,
              count(r.*) FILTER (WHERE r.status = 'abgesagt')::int AS abgesagt,
              (SELECT ei.id FROM event_images ei WHERE ei.event_id = e.id ORDER BY ei.position, ei.created_at LIMIT 1) AS cover_id
         FROM events e LEFT JOIN event_rsvps r ON r.event_id = e.id
        WHERE e.host_id = $1 AND (e.ends_at > now() - interval '30 days' OR e.status = 'pending')
        GROUP BY e.id ORDER BY e.starts_at`,
      [a.id],
    );
    return {
      events: rows.map((e) => ({
        id: e.id,
        title: e.title,
        startsAt: e.starts_at,
        endsAt: e.ends_at,
        status: e.status,
        over: new Date(e.ends_at) < new Date(),
        area: e.area,
        capacity: e.capacity,
        counts: { angenommen: e.angenommen, angefragt: e.angefragt, abgesagt: e.abgesagt },
        note: e.status === 'rejected' ? e.cancel_note : e.review_note,
        cover: e.cover_id ? imgUrl('event', e.cover_id, a.id) : null,
      })),
    };
  });

  app.get('/api/host/events/:id', async (req) => {
    const a = await requireMember(req);
    const { id } = params(req, idParam);
    const e = await hostEvent(id, a.id);
    return {
      event: {
        id: e.id,
        title: e.title,
        description: e.description,
        startsAt: e.starts_at,
        endsAt: e.ends_at,
        categories: e.categories,
        capacity: e.capacity,
        approvalRequired: e.approval_required,
        cancelUntilHours: e.cancel_until_hours,
        placeId: e.place_id,
        area: e.area,
        address: e.address,
        publicVenue: e.location_public,
        pin: e.location_public && !e.place_id ? { lat: e.lat, lng: e.lng } : null,
        price: e.price,
        dressCode: e.dress_code,
        ampel: e.ampel,
        status: e.status,
        images: await eventImages(id, a.id),
      },
      counts: await guestCounts(id),
    };
  });

  app.post('/api/host/events', async (req) => {
    const a = await requireCleared(req);
    const b = body(req, eventInput);
    if (!hit('host-event', a.id, 20, 86400_000)) throw tooMany();
    const o = await organizerOf(a.id);
    const verified = o?.status === 'verifiziert';
    if (!verified) {
      const open = await one(`SELECT count(*)::int AS n FROM events WHERE host_id = $1 AND status = 'pending'`, [a.id]);
      if (open!.n >= p('P-EINREICHUNGEN-MAX')) throw new AppError(409, 'UI-VA-EINREICHUNGEN-MAX', { max: p('P-EINREICHUNGEN-MAX') }, 'einreichungen_max');
    }
    const c = await checkInput(b);
    const v = eventValues(b, c);
    const r = await one(
      `INSERT INTO events (title, description, starts_at, ends_at, categories, capacity, approval_required, cancel_until_hours, place_id, area, address,
                           lat, lng, map_lat, map_lng, location_public, price, dress_code, ampel, host_id, organizer_id, source, status, approved_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, CASE WHEN $23 = 'approved' THEN now() END)
       RETURNING id, status`,
      [
        ...Object.values(v),
        a.id,
        verified ? o!.id : null,
        verified ? 'veranstalter' : 'einreichung',
        verified ? 'approved' : 'pending',
      ],
    );
    return { id: r!.id, status: r!.status, verified };
  });

  app.patch('/api/host/events/:id', async (req) => {
    const a = await requireCleared(req);
    const { id } = params(req, idParam);
    const e = await hostEvent(id, a.id);
    if (e.status === 'cancelled' || new Date(e.ends_at) < new Date()) throw conflict('UI-VA-NICHT-AENDERBAR');
    const b = body(req, eventInput);
    const c = await checkInput(b);
    const v = eventValues(b, c);
    const o = await organizerOf(a.id);
    const verified = o?.status === 'verifiziert';
    // Einreichungen gehen nach einer Änderung erneut in die Prüfung; Verifizierte werden nachgeprüft
    const status = verified ? (e.status === 'rejected' ? 'approved' : e.status === 'pending' ? 'approved' : e.status) : 'pending';
    const cols = Object.keys(v);
    await q(
      `UPDATE events SET ${cols.map((k, i) => `${k} = $${i + 2}`).join(', ')}, status = $${cols.length + 2}, organizer_id = $${cols.length + 3},
              updated_at = now(), checked_at = NULL, approved_at = CASE WHEN $${cols.length + 2} = 'approved' THEN coalesce(approved_at, now()) END
        WHERE id = $1`,
      [id, ...Object.values(v), status, verified ? o!.id : null],
    );
    return { ok: true, status };
  });

  app.delete('/api/host/events/:id', async (req) => {
    const a = await requireMember(req);
    const { id } = params(req, idParam);
    const e = await hostEvent(id, a.id);
    // Veröffentlichte Veranstaltungen werden abgesagt, nicht gelöscht — die Gäste sollen es sehen
    if (e.status === 'approved') throw conflict('UI-VA-ERST-ABSAGEN');
    const imgs = await q(`SELECT file FROM event_images WHERE event_id = $1`, [id]);
    await q(`DELETE FROM events WHERE id = $1`, [id]);
    for (const i of imgs) await deleteFile('zone1-public', i.file);
    return { ok: true };
  });

  app.post('/api/host/events/:id/cancel', async (req) => {
    const a = await requireMember(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ note: z.string().trim().max(300).optional() }));
    const e = await hostEvent(id, a.id);
    if (e.status !== 'approved') throw notFound();
    await q(`UPDATE events SET status = 'cancelled', cancel_note = $2 WHERE id = $1`, [id, b.note ?? null]);
    const guests = await q(`SELECT account_id FROM event_rsvps WHERE event_id = $1 AND status IN ('angenommen','angefragt')`, [id]);
    for (const g of guests) {
      await createNotice(g.account_id, 'veranstaltung', t('UI-VA-N-ABGESAGT-TITEL'), t('UI-VA-N-ABGESAGT', { titel: e.title }), `veranstaltung:${id}`, undefined, {
        url: `/ereignisse/${id}`,
      });
    }
    return { ok: true };
  });

  app.post('/api/host/events/:id/images', async (req) => {
    const a = await requireCleared(req);
    const { id } = params(req, idParam);
    await hostEvent(id, a.id);
    if (!hit('upload', a.id, 30, 3600_000)) throw tooMany();
    const n = await one(`SELECT count(*)::int AS n, coalesce(max(position), -1) + 1 AS pos FROM event_images WHERE event_id = $1`, [id]);
    if (n!.n >= p('P-VERANSTALTUNG-BILDER')) throw bad('UI-VA-BILDER-MAX', { max: p('P-VERANSTALTUNG-BILDER') }, 'bilder_max');
    const { buffer } = await readUpload(req);
    // Stufe 0: Format, Größe, alle Metadaten verwerfen (AK-F72-01/02)
    const prepared = await prepare(buffer);
    const file = await putFile('zone1-public', prepared.data);
    const r = await one(`INSERT INTO event_images (event_id, file, position, width, height) VALUES ($1, $2, $3, $4, $5) RETURNING id`, [
      id,
      file,
      n!.pos,
      prepared.width,
      prepared.height,
    ]);
    // Bilder einer veröffentlichten Veranstaltung werden vom Team nachgeprüft
    await q(`UPDATE events SET checked_at = NULL WHERE id = $1`, [id]);
    return { id: r!.id, url: imgUrl('event', r!.id, a.id) };
  });

  app.delete('/api/host/events/:id/images/:imageId', async (req) => {
    const a = await requireMember(req);
    const { id, imageId } = params(req, z.object({ id: uuid, imageId: uuid }));
    await hostEvent(id, a.id);
    const r = await one(`DELETE FROM event_images WHERE id = $1 AND event_id = $2 RETURNING file`, [imageId, id]);
    if (!r) throw notFound();
    await deleteFile('zone1-public', r.file);
    return { ok: true };
  });

  // ───── Gästeliste ─────
  app.get('/api/host/events/:id/guests', async (req) => {
    const a = await requireMember(req);
    const { id } = params(req, idParam);
    const e = await hostEvent(id, a.id);
    const rows = await q(
      `SELECT r.account_id, r.status, r.note, r.created_at, r.decided_at, r.cancelled_at, pr.name, pr.initial_color, pr.photo_mode,
              (SELECT ph.id FROM photos ph WHERE ph.account_id = pr.account_id AND ph.status = 'approved' ORDER BY position LIMIT 1) AS photo_id,
              EXISTS (SELECT 1 FROM event_chats c WHERE c.event_id = r.event_id AND c.guest_id = r.account_id AND c.last_message_at > coalesce(c.host_read_at, '-infinity')
                        AND EXISTS (SELECT 1 FROM event_chat_messages m WHERE m.event_id = c.event_id AND m.guest_id = c.guest_id AND m.sender_id <> $2 AND m.created_at > coalesce(c.host_read_at, '-infinity'))) AS unread
         FROM event_rsvps r JOIN profiles pr ON pr.account_id = r.account_id JOIN accounts ac ON ac.id = r.account_id
        WHERE r.event_id = $1 AND ac.deletion_requested_at IS NULL AND ac.moderation_state <> 'suspended'
          AND NOT EXISTS (SELECT 1 FROM blocks b WHERE b.revoked_at IS NULL AND ((b.blocker_id = $2 AND b.blocked_id = r.account_id) OR (b.blocker_id = r.account_id AND b.blocked_id = $2)))
        ORDER BY (r.status = 'angefragt') DESC, r.created_at`,
      [id, a.id],
    );
    const taken = await acceptedCount(id);
    return {
      event: { id: e.id, title: e.title, capacity: e.capacity, approvalRequired: e.approval_required, startsAt: e.starts_at, status: e.status },
      counts: { ...(await guestCounts(id)), belegt: taken },
      guests: rows.map((r) => ({
        id: r.account_id,
        name: r.name,
        initial: initialOf(r.name),
        color: r.initial_color,
        photo: r.photo_mode === 'photo' && r.photo_id ? imgUrl('photo', r.photo_id, a.id, 'public') : null,
        status: r.status,
        note: r.note,
        at: r.status === 'abgesagt' ? r.cancelled_at : r.status === 'angefragt' ? r.created_at : (r.decided_at ?? r.created_at),
        unread: r.unread,
      })),
    };
  });

  app.post('/api/host/events/:id/guests/:guestId', async (req) => {
    const a = await requireMember(req);
    const { id, guestId } = params(req, z.object({ id: uuid, guestId: uuid }));
    const b = body(req, z.object({ decision: z.enum(['annehmen', 'ablehnen']) }));
    const e = await hostEvent(id, a.id);
    const r = await one(`SELECT status FROM event_rsvps WHERE event_id = $1 AND account_id = $2`, [id, guestId]);
    if (!r || r.status === 'abgesagt') throw notFound();
    if (b.decision === 'annehmen') {
      if (r.status === 'angenommen') return { ok: true };
      if (e.capacity && (await acceptedCount(id)) >= e.capacity) throw new AppError(409, 'UI-VA-VOLL', {}, 'voll');
      await q(`UPDATE event_rsvps SET status = 'angenommen', decided_at = now() WHERE event_id = $1 AND account_id = $2`, [id, guestId]);
      await createNotice(guestId, 'veranstaltung', t('UI-VA-N-ANGENOMMEN-TITEL'), t('UI-VA-N-ANGENOMMEN', { titel: e.title }), `veranstaltung:${id}`, undefined, {
        url: `/ereignisse/${id}`,
      });
    } else {
      await q(`UPDATE event_rsvps SET status = 'abgelehnt', decided_at = now() WHERE event_id = $1 AND account_id = $2`, [id, guestId]);
      // neutral: kein Grund, keine Wertung
      await createNotice(guestId, 'veranstaltung', t('UI-VA-N-ABGELEHNT-TITEL'), t('UI-VA-N-ABGELEHNT', { titel: e.title }), `veranstaltung:${id}`, undefined, {
        push: false,
      });
    }
    return { ok: true };
  });

  // ───── Chat Veranstalter ↔ Gast (eigener Bereich in „Chats“) ─────
  app.get('/api/event-chats', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    const rows = await q(
      `SELECT c.event_id, c.guest_id, c.last_message_at, c.host_read_at, c.guest_read_at, e.title, e.starts_at, e.host_id, e.organizer_id, e.status,
              o.name AS organizer_name, hp.name AS host_name, gp.name AS guest_name, gp.initial_color AS guest_color,
              (SELECT ei.id FROM event_images ei WHERE ei.event_id = e.id ORDER BY ei.position, ei.created_at LIMIT 1) AS cover_id,
              (SELECT m.sender_id FROM event_chat_messages m WHERE m.event_id = c.event_id AND m.guest_id = c.guest_id ORDER BY m.created_at DESC LIMIT 1) AS last_sender
         FROM event_chats c JOIN events e ON e.id = c.event_id
         LEFT JOIN organizers o ON o.id = e.organizer_id
         LEFT JOIN profiles hp ON hp.account_id = e.host_id
         LEFT JOIN profiles gp ON gp.account_id = c.guest_id
        WHERE (e.host_id = $1 OR c.guest_id = $1) AND c.last_message_at IS NOT NULL
        ORDER BY c.last_message_at DESC LIMIT 200`,
      [a.id],
    );
    return {
      chats: rows.map((r) => {
        const host = r.host_id === a.id;
        const read = host ? r.host_read_at : r.guest_read_at;
        return {
          eventId: r.event_id,
          guestId: r.guest_id,
          title: r.title,
          startsAt: r.starts_at,
          cancelled: r.status === 'cancelled',
          role: host ? 'veranstalter' : 'gast',
          other: host ? { name: r.guest_name, initial: initialOf(r.guest_name ?? '?'), color: r.guest_color } : { name: r.organizer_name ?? r.host_name, initial: initialOf(r.organizer_name ?? r.host_name ?? '?'), color: null },
          cover: r.cover_id ? imgUrl('event', r.cover_id, a.id) : null,
          lastAt: r.last_message_at,
          unread: r.last_sender && r.last_sender !== a.id && (!read || new Date(read) < new Date(r.last_message_at)),
        };
      }),
    };
  });

  app.get('/api/events/:id/chat/:guestId', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    const { id, guestId } = params(req, z.object({ id: uuid, guestId: uuid }));
    const { e, writable, role } = await chatAccess(id, guestId, a.id);
    const rows = await q(
      `SELECT id, sender_id, body_enc, created_at FROM event_chat_messages WHERE event_id = $1 AND guest_id = $2 ORDER BY created_at LIMIT 500`,
      [id, guestId],
    );
    await q(
      `INSERT INTO event_chats (event_id, guest_id, ${role === 'veranstalter' ? 'host_read_at' : 'guest_read_at'}) VALUES ($1, $2, now())
       ON CONFLICT (event_id, guest_id) DO UPDATE SET ${role === 'veranstalter' ? 'host_read_at' : 'guest_read_at'} = now()`,
      [id, guestId],
    );
    const guest = await one(`SELECT name, initial_color FROM profiles WHERE account_id = $1`, [guestId]);
    const hn = await hostName(e);
    return {
      event: { id: e.id, title: e.title },
      role,
      writable,
      other: role === 'veranstalter' ? { id: guestId, name: guest?.name, initial: initialOf(guest?.name ?? '?'), color: guest?.initial_color } : { id: e.host_id, name: hn, initial: initialOf(hn || '?'), color: null },
      messages: rows.map((m) => ({ id: m.id, mine: m.sender_id === a.id, text: decStr('messages', m.body_enc, `echat:${id}:${guestId}`), createdAt: m.created_at })),
    };
  });

  app.post('/api/events/:id/chat/:guestId', async (req) => {
    const a = await requireCleared(req);
    const { id, guestId } = params(req, z.object({ id: uuid, guestId: uuid }));
    const b = body(req, z.object({ text: z.string().min(1) }));
    const text = b.text.trim();
    if (!text) throw bad('UI-EINGABE-PRUEFEN');
    if ([...text].length > p('P-NACHRICHT-MAX')) throw bad('ST-FEH-32', { zeichen: p('P-NACHRICHT-MAX') });
    if (!hit('echat', a.id, 120, 3600_000)) throw tooMany();
    const { e, writable, role } = await chatAccess(id, guestId, a.id);
    if (!writable) throw conflict('UI-VA-CHAT-ZU');
    await q(
      `INSERT INTO event_chats (event_id, guest_id, last_message_at, ${role === 'veranstalter' ? 'host_read_at' : 'guest_read_at'}) VALUES ($1, $2, now(), now())
       ON CONFLICT (event_id, guest_id) DO UPDATE SET last_message_at = now(), ${role === 'veranstalter' ? 'host_read_at' : 'guest_read_at'} = now()`,
      [id, guestId],
    );
    const m = await one(`INSERT INTO event_chat_messages (event_id, guest_id, sender_id, body_enc) VALUES ($1, $2, $3, $4) RETURNING id, created_at`, [
      id,
      guestId,
      a.id,
      encStr('messages', text, `echat:${id}:${guestId}`),
    ]);
    const other = role === 'veranstalter' ? guestId : e.host_id;
    emit(other, 'veranstaltung_chat', { eventId: id, guestId });
    emit(a.id, 'veranstaltung_chat', { eventId: id, guestId });
    return { id: m!.id, createdAt: m!.created_at };
  });
}
