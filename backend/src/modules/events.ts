/**
 * Ereignisse mit Zusage (F32), temporäre Ereignisgruppen (F33) und — Issue #15/#16/#17 —
 * Veranstaltungsliste mit Umkreis, Kategorien und Zeitraum, Karte und Gästeliste mit Absagefrist.
 *
 *  * Wer nicht zugesagt hat, sieht weder Zahl noch Namen der Zusagenden (AK-F32-01).
 *  * Eine Zusage ist eine Buchung: vorher die Schranke aus Nr. 64 (AK-F04-11).
 *  * Die Gruppe öffnet P-GRUPPE-OFFEN vor Beginn, ist reine Textgruppe und wird
 *    P-GRUPPE-ENDE nach dem Ende gelöscht (FV-51).
 *  * Blockierte sehen einander weder in der Liste noch in der Gruppe (AK-X06-01/02).
 *  * Issue #16: Zusage sofort oder als Anfrage (Veranstalter nimmt an); volle Veranstaltungen nehmen
 *    keine Zusage mehr an; Absage bis zur Frist des Veranstalters, danach nur über den Veranstalter.
 *  * Liste bis P-VERANSTALTUNG-MONATE voraus, „bald“ (nach Beginn) oder „nah“ (nach Entfernung,
 *    innerhalb gleicher Entfernungsstufe nach Beginn). Empfohlene Veranstaltungen von Cruizy oben,
 *    gekennzeichnet — keine bezahlte Hervorhebung.
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { p } from '../config/params.js';
import { one, q } from '../db/pool.js';
import { requireCleared, requireMember } from '../lib/context.js';
import { decStr, encStr } from '../lib/crypto.js';
import { AppError, bad, notFound } from '../lib/errors.js';
import { body, idParam, params, query } from '../lib/http.js';
import { t } from '../lib/texts.js';
import { emit } from '../services/hub.js';
import { boundingBox, displayKm, distanceKm, type LatLng } from '../lib/geo.js';
import { localDateString } from '../lib/time.js';
import { EVENT_CATEGORY_KEYS } from '../services/catalogs.js';
import {
  acceptedCount,
  cancelDeadline,
  eventCard,
  eventImages,
  eventPoint,
  EVENT_LIST_COLUMNS,
  EVENT_LIST_FROM,
  visibleEvent,
} from '../services/event-view.js';
import { imgUrl } from '../services/media-tokens.js';
import { createNotice } from '../services/notify.js';
import { resolveRef } from './discovery.js';
import { initialOf, isBlockedEitherWay } from '../services/profiles.js';
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
    const rs = await q(`SELECT account_id FROM event_rsvps WHERE event_id = $1 AND status = 'angenommen'`, [e.id]);
    for (const r of rs) await sendPush(r.account_id, 'event', { title: t('ST-PUSH-11'), url: `/ereignisse/${e.id}` });
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

const TZ = `'Europe/Berlin'`;

/** Zeitraum als Ortsdaten [von, bis] — beide einschließlich. */
export function whenRange(when: string, now = new Date()): [string, string] | null {
  const day = (d: number) => localDateString(new Date(now.getTime() + d * 86400_000));
  const wd = (now.getDay() + 6) % 7; // 0 = Montag
  switch (when) {
    case 'heute':
      return [day(0), day(0)];
    case 'morgen':
      return [day(1), day(1)];
    case 'wochenende': {
      // laufendes Wochenende (Fr–So) oder das nächste
      const toFri = wd >= 4 ? 0 : 4 - wd;
      return [day(toFri), day(6 - wd)];
    }
    case '7tage':
      return [day(0), day(6)];
    case '30tage':
      return [day(0), day(29)];
    default:
      return null;
  }
}

const listSchema = z.object({
  sort: z.enum(['bald', 'naehe']).default('bald'),
  radius: z.coerce.number().int().min(1).max(2000).optional(),
  cats: z.string().max(400).optional(),
  when: z.enum(['alle', 'heute', 'morgen', 'wochenende', '7tage', '30tage']).default('alle'),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  q: z.string().max(60).optional(),
  offset: z.coerce.number().int().min(0).max(2000).default(0),
});

function catsOf(s?: string) {
  return (s ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter((x) => EVENT_CATEGORY_KEYS.has(x));
}

async function listEvents(accountId: string, age1: boolean, f: z.infer<typeof listSchema>, ref: LatLng | null) {
  const vals: unknown[] = [accountId];
  const where = [
    `e.status IN ('approved','cancelled')`,
    `e.ends_at > now()`,
    `e.starts_at < now() + make_interval(months => ${Number(p('P-VERANSTALTUNG-MONATE'))})`,
    // abgesagte nur, solange sie in den nächsten 8 Tagen lägen — danach verschwinden sie
    `(e.status = 'approved' OR e.starts_at < now() + interval '8 days')`,
  ];
  if (!age1) where.push(`e.ampel <> 'rot'`); // M75.03
  const cats = catsOf(f.cats);
  if (cats.length) {
    vals.push(cats);
    where.push(`e.categories && $${vals.length}::text[]`);
  }
  const range = f.from || f.to ? [f.from ?? localDateString(new Date()), f.to ?? f.from!] : whenRange(f.when);
  if (range) {
    vals.push(range[0], range[1]);
    where.push(`e.starts_at < (($${vals.length}::date + 1)::timestamp AT TIME ZONE ${TZ}) AND e.ends_at > ($${vals.length - 1}::date::timestamp AT TIME ZONE ${TZ})`);
  }
  if (f.q?.trim()) {
    vals.push(`%${f.q.trim().replace(/[%_\\]/g, '')}%`);
    where.push(`(e.title ILIKE $${vals.length} OR e.area ILIKE $${vals.length} OR pl.name ILIKE $${vals.length} OR o.name ILIKE $${vals.length})`);
  }
  const radius = f.radius ?? null;
  if (ref && radius) {
    const box = boundingBox(ref, radius);
    vals.push(box.minLat, box.maxLat, box.minLng, box.maxLng);
    const n = vals.length;
    where.push(`coalesce(e.map_lat, pl.lat) BETWEEN $${n - 3} AND $${n - 2} AND coalesce(e.map_lng, pl.lng) BETWEEN $${n - 1} AND $${n}`);
  }
  // Blockierte Gastgeber tauchen nicht auf (AK-X06-01)
  where.push(`(e.host_id IS NULL OR ${NOT_BLOCKED('$1', 'e.host_id')})`);
  const rows = await q(
    `SELECT ${EVENT_LIST_COLUMNS} FROM ${EVENT_LIST_FROM} WHERE ${where.join(' AND ')} ORDER BY e.starts_at LIMIT 1500`,
    vals,
  );
  const inRadius = rows.filter((e) => {
    if (!ref || !radius) return true;
    const pt = eventPoint(e);
    return !pt || distanceKm(ref, pt) <= radius;
  });
  const sorted =
    f.sort === 'naehe' && ref
      ? inRadius
          .map((e) => {
            const pt = eventPoint(e);
            const km = pt ? distanceKm(ref, pt) : 99999;
            // gleiche Entfernungsstufe → das frühere zuerst
            const stufe = km <= 5 ? 0 : km <= 15 ? 1 : km <= 50 ? 2 : km <= 150 ? 3 : 4 + Math.floor(km / 300);
            return { e, stufe, km };
          })
          .sort((a, b) => a.stufe - b.stufe || new Date(a.e.starts_at).getTime() - new Date(b.e.starts_at).getTime() || a.km - b.km)
          .map((x) => x.e)
      : inRadius;
  const featured = f.offset === 0 ? sorted.filter((e) => e.featured && e.status === 'approved').slice(0, 3) : [];
  const rest = sorted.filter((e) => !featured.includes(e));
  const page = rest.slice(f.offset, f.offset + 20);
  return {
    featured: featured.map((e) => eventCard(e, accountId, ref)),
    events: page.map((e) => eventCard(e, accountId, ref)),
    total: rest.length,
    next: f.offset + 20 < rest.length ? f.offset + 20 : null,
  };
}

export default async function eventRoutes(app: FastifyInstance) {
  /** Issue #15/#16: Veranstaltungen mit Umkreis, Kategorien, Zeitraum — „bald“ oder „nah“. */
  app.get('/api/events', async (req) => {
    const a = await requireMember(req);
    const f = query(req, listSchema);
    const { ref, travel } = await resolveRef(a.id);
    const radius = f.radius ?? (ref ? p('P-VERANSTALTUNG-RADIUS') : undefined);
    const r = await listEvents(a.id, a.age1, { ...f, radius }, ref);
    return { ...r, hasRef: !!ref, travel, radius: ref ? radius : null };
  });

  /**
   * Issue #17: Punkte für die Karte im sichtbaren Ausschnitt. Genau nur bei öffentlichen Orten,
   * sonst der Mittelpunkt einer groben Zelle. Beim Herauszoomen werden nahe Punkte gebündelt.
   */
  app.get('/api/events/map', async (req) => {
    const a = await requireMember(req);
    const f = query(
      req,
      z.object({
        minLat: z.coerce.number().min(-90).max(90),
        maxLat: z.coerce.number().min(-90).max(90),
        minLng: z.coerce.number().min(-180).max(180),
        maxLng: z.coerce.number().min(-180).max(180),
        zoom: z.coerce.number().min(0).max(20).default(10),
        cats: z.string().max(400).optional(),
        when: listSchema.shape.when,
      }),
    );
    const vals: unknown[] = [a.id, f.minLat, f.maxLat, f.minLng, f.maxLng];
    const where = [
      `e.status = 'approved'`,
      `e.ends_at > now()`,
      `e.starts_at < now() + make_interval(months => ${Number(p('P-VERANSTALTUNG-MONATE'))})`,
      `coalesce(e.map_lat, pl.lat) BETWEEN $2 AND $3 AND coalesce(e.map_lng, pl.lng) BETWEEN $4 AND $5`,
      `(e.host_id IS NULL OR ${NOT_BLOCKED('$1', 'e.host_id')})`,
    ];
    if (!a.age1) where.push(`e.ampel <> 'rot'`);
    const cats = catsOf(f.cats);
    if (cats.length) {
      vals.push(cats);
      where.push(`e.categories && $${vals.length}::text[]`);
    }
    const range = whenRange(f.when);
    if (range) {
      vals.push(range[0], range[1]);
      where.push(`e.starts_at < (($${vals.length}::date + 1)::timestamp AT TIME ZONE ${TZ}) AND e.ends_at > ($${vals.length - 1}::date::timestamp AT TIME ZONE ${TZ})`);
    }
    const rows = await q(
      `SELECT e.id, e.title, e.starts_at, e.categories, e.featured, e.location_public, e.place_id, e.map_lat, e.map_lng, pl.lat AS place_lat, pl.lng AS place_lng
         FROM ${EVENT_LIST_FROM} WHERE ${where.join(' AND ')} ORDER BY e.featured DESC, e.starts_at LIMIT 2000`,
      vals,
    );
    const points = rows.map((e) => {
      const pt = eventPoint(e)!;
      return { id: e.id, lat: pt.lat, lng: pt.lng, exact: !!(e.location_public || e.place_id), title: e.title, startsAt: e.starts_at, categories: e.categories, featured: e.featured };
    });
    // Bündeln: Rastergröße nach Zoomstufe (etwa 60 Bildpunkte)
    const cellDeg = (360 / Math.pow(2, f.zoom)) * (60 / 256);
    if (f.zoom >= 13) return { points, groups: [] };
    const groups = new Map<string, { lat: number; lng: number; n: number; ids: string[]; featured: boolean }>();
    for (const pt of points) {
      const k = `${Math.floor(pt.lat / cellDeg)}:${Math.floor(pt.lng / cellDeg)}`;
      const g = groups.get(k) ?? { lat: 0, lng: 0, n: 0, ids: [], featured: false };
      g.lat += pt.lat;
      g.lng += pt.lng;
      g.n++;
      g.featured ||= pt.featured;
      if (g.ids.length < 50) g.ids.push(pt.id);
      groups.set(k, g);
    }
    const single = new Set<string>();
    const out = [];
    for (const g of groups.values()) {
      if (g.n === 1) single.add(g.ids[0]);
      else out.push({ lat: g.lat / g.n, lng: g.lng / g.n, n: g.n, ids: g.ids, featured: g.featured });
    }
    return { points: points.filter((x) => single.has(x.id)), groups: out };
  });

  app.get('/api/events/:id', async (req) => {
    const a = await requireMember(req);
    const { id } = params(req, idParam);
    const e = await visibleEvent(id, a);
    if (!e) throw notFound();
    const isHost = e.host_id === a.id;
    const my = await one(`SELECT status FROM event_rsvps WHERE event_id = $1 AND account_id = $2`, [id, a.id]);
    const mine = my?.status === 'angenommen';
    let attendees = null;
    if (mine || isHost) {
      const rows = await q(
        `SELECT pr.account_id, pr.name, pr.initial_color, pr.photo_mode,
                (SELECT ph.id FROM photos ph WHERE ph.account_id = pr.account_id AND ph.status = 'approved' ORDER BY position LIMIT 1) AS photo_id
           FROM event_rsvps r JOIN profiles pr ON pr.account_id = r.account_id JOIN accounts a ON a.id = r.account_id
          WHERE r.event_id = $1 AND r.status = 'angenommen' AND a.deletion_requested_at IS NULL AND a.moderation_state <> 'suspended'
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
    const taken = await acceptedCount(id);
    const g = groupState(e);
    const deadline = cancelDeadline(e);
    const hostProfile = e.host_id ? await one(`SELECT name FROM profiles WHERE account_id = $1`, [e.host_id]) : null;
    const ref = (await resolveRef(a.id)).ref;
    const pt = eventPoint(e);
    const exact = !!(e.location_public || e.place_id);
    const insider = mine || isHost;
    return {
      event: {
        id: e.id,
        title: e.title,
        description: e.description,
        startsAt: e.starts_at,
        endsAt: e.ends_at,
        cancelled: e.status === 'cancelled',
        pending: e.status === 'pending',
        rejected: e.status === 'rejected',
        cancelNote: e.cancel_note,
        over: new Date(e.ends_at) < new Date(),
        place: e.place_id ? { id: e.place_id, name: e.place_name } : null,
        source: e.source,
        categories: e.categories ?? [],
        area: e.area,
        // Adresse: bei öffentlichen Orten für alle, sonst nur für angenommene Gäste und den Gastgeber
        address: exact || insider ? (e.address ?? e.place_address ?? null) : null,
        addressHidden: !exact && !insider && !!e.address,
        point: pt ? { lat: pt.lat, lng: pt.lng, exact } : null,
        km: ref && pt ? displayKm(distanceKm(ref, pt)) : null,
        price: e.price,
        dressCode: e.dress_code,
        capacity: e.capacity,
        spotsLeft: e.capacity ? Math.max(0, e.capacity - taken) : null,
        full: !!e.capacity && taken >= e.capacity,
        approvalRequired: e.approval_required,
        cancelUntil: e.cancel_until_hours > 0 ? deadline : null,
        featured: e.featured,
        organizer: e.organizer_name ? { name: e.organizer_name, verified: e.organizer_status === 'verifiziert', kind: e.organizer_kind, website: e.organizer_website } : null,
        host: e.host_id && !e.organizer_name ? { id: e.host_id, name: hostProfile?.name ?? null } : null,
        hostId: e.host_id,
        images: await eventImages(id, a.id),
      },
      isHost,
      rsvp: mine,
      myStatus: my?.status ?? null,
      canCancel: !my || my.status !== 'angenommen' || Date.now() < deadline.getTime(),
      canChat: !!e.host_id && !isHost && mine,
      myGuestId: mine ? a.id : null,
      count: attendees ? taken : null,
      attendees,
      group: { open: mine && g.open, opensAt: g.opensAt, closesAt: g.closesAt },
    };
  });

  app.post('/api/events/:id/rsvp', async (req) => {
    const a = await requireCleared(req); // AK-F04-11: Zusage = Buchung
    const { id } = params(req, idParam);
    const b = body(req, z.object({ note: z.string().trim().max(300).optional() }).default({}));
    const e = await one(`SELECT * FROM events WHERE id = $1`, [id]);
    if (!e || e.status !== 'approved') throw new AppError(409, 'UI-EREIGNIS-ABGESAGT', {}, 'abgesagt');
    if (new Date(e.ends_at) < new Date()) throw new AppError(409, 'UI-EREIGNIS-VORBEI', {}, 'vorbei'); // AK-F32-05
    if (e.host_id === a.id) throw bad('UI-VA-EIGENE', {}, 'eigene');
    if (e.ampel === 'rot' && !a.age1) throw notFound();
    if (e.host_id && (await isBlockedEitherWay(a.id, e.host_id))) throw notFound();
    const prev = await one(`SELECT status FROM event_rsvps WHERE event_id = $1 AND account_id = $2`, [id, a.id]);
    if (prev?.status === 'angenommen' || prev?.status === 'angefragt') return { ok: true, status: prev.status };
    if (prev?.status === 'abgelehnt') throw new AppError(409, 'UI-VA-ABGELEHNT', {}, 'abgelehnt');
    // volle Veranstaltung: keine Zusage mehr (Issue #16)
    if (e.capacity && (await acceptedCount(id)) >= e.capacity) throw new AppError(409, 'UI-VA-VOLL', {}, 'voll');
    const status = e.approval_required ? 'angefragt' : 'angenommen';
    await q(
      `INSERT INTO event_rsvps (event_id, account_id, status, note, decided_at) VALUES ($1, $2, $3, $4, CASE WHEN $3 = 'angenommen' THEN now() END)
       ON CONFLICT (event_id, account_id) DO UPDATE SET status = EXCLUDED.status, note = EXCLUDED.note, cancelled_at = NULL,
         decided_at = EXCLUDED.decided_at, created_at = now()`,
      [id, a.id, status, b.note ?? null],
    );
    if (e.host_id && status === 'angefragt') {
      await createNotice(e.host_id, 'veranstaltung', t('UI-VA-N-ANFRAGE-TITEL'), t('UI-VA-N-ANFRAGE', { titel: e.title }), `veranstaltung:${id}`, undefined, {
        url: `/veranstalter/veranstaltungen/${id}`,
      });
    }
    return { ok: true, status };
  });

  app.delete('/api/events/:id/rsvp', async (req) => {
    const a = await requireMember(req);
    const { id } = params(req, idParam);
    const e = await one(`SELECT starts_at, cancel_until_hours, status FROM events WHERE id = $1`, [id]);
    const r = await one(`SELECT status FROM event_rsvps WHERE event_id = $1 AND account_id = $2`, [id, a.id]);
    if (!e || !r) return { ok: true };
    // Issue #16: nach der Absagefrist des Veranstalters nur noch über den Veranstalter
    if (r.status === 'angenommen' && e.status === 'approved' && Date.now() >= cancelDeadline(e).getTime()) {
      throw new AppError(409, 'UI-VA-FRIST-VORBEI', { zeit: cancelDeadline(e).toISOString() }, 'absagefrist');
    }
    // AK-F32-03: sofort aus jeder Liste; die Gruppe ist damit verlassen
    if (r.status === 'angefragt') await q(`DELETE FROM event_rsvps WHERE event_id = $1 AND account_id = $2`, [id, a.id]);
    else if (r.status === 'angenommen') await q(`UPDATE event_rsvps SET status = 'abgesagt', cancelled_at = now() WHERE event_id = $1 AND account_id = $2`, [id, a.id]);
    return { ok: true };
  });

  app.get('/api/events/:id/group', async (req) => {
    const a = await requireMember(req);
    const { id } = params(req, idParam);
    const e = await one(`SELECT starts_at, ends_at FROM events WHERE id = $1`, [id]);
    const mine = await one(`SELECT 1 FROM event_rsvps WHERE event_id = $1 AND account_id = $2 AND status = 'angenommen'`, [id, a.id]);
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
    const mine = await one(`SELECT 1 FROM event_rsvps WHERE event_id = $1 AND account_id = $2 AND status = 'angenommen'`, [id, a.id]);
    if (!e || !mine || !groupState(e).open || new Date(e.ends_at) < new Date(Date.now() - p('P-GRUPPE-ENDE') * 1000)) throw notFound();
    await q(`INSERT INTO event_group_messages (event_id, sender_id, body_enc) VALUES ($1, $2, $3)`, [id, a.id, encStr('messages', text, `grp:${id}`)]);
    const members = await q(`SELECT account_id FROM event_rsvps WHERE event_id = $1 AND status = 'angenommen'`, [id]);
    for (const m of members) emit(m.account_id, 'gruppe', { eventId: id });
    return { ok: true };
  });
}
