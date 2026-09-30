/**
 * Veranstaltungen (Issue #16/#17): gemeinsame Darstellung für Liste, Karte und Detail.
 *
 * PRÜFUNG ERFORDERLICH (Standort).
 *  * Genaue Lage nur bei öffentlichen Orten (Club, Bar, Konzerthaus …) — `location_public`.
 *    Sonst steht auf der Karte nur der Mittelpunkt einer P-KARTE-UNGEFAEHR-Zelle am Ort,
 *    die Adresse sehen nur Gastgeber und angenommene Gäste.
 *  * Namen der Gäste sehen nur angenommene Gäste und der Gastgeber (AK-F32-01). Freie Plätze
 *    stehen als Zahl dabei, wenn eine Gästezahl angegeben ist (Issue #16).
 */
import { p } from '../config/params.js';
import { one, q } from '../db/pool.js';
import { displayKm, distanceKm, roundToCell, type LatLng } from '../lib/geo.js';
import { EVENT_CATEGORIES } from './catalogs.js';
import { imgUrl } from './media-tokens.js';

export const CATEGORY_ICON = new Map<string, string>(EVENT_CATEGORIES.map((c) => [c.key, c.icon]));

/** Punkt für die Karte: genau nur bei öffentlichen Orten. */
export function mapPoint(exact: LatLng, isPublic: boolean): LatLng {
  return isPublic ? exact : roundToCell(exact, p('P-KARTE-UNGEFAEHR'));
}

/** Zusagen, die Plätze belegen: angenommene Gäste plus erfundene Testgäste der Testveranstaltung. */
export async function acceptedCount(eventId: string): Promise<number> {
  const r = await one(
    `SELECT (SELECT count(*)::int FROM event_rsvps WHERE event_id = $1 AND status = 'angenommen') + e.test_guests AS n FROM events e WHERE e.id = $1`,
    [eventId],
  );
  return r?.n ?? 0;
}

export const EVENT_LIST_COLUMNS = `e.id, e.title, e.starts_at, e.ends_at, e.status, e.categories, e.capacity, e.featured, e.area,
  e.map_lat, e.map_lng, e.location_public, e.price, e.approval_required, e.host_id, e.test_guests, e.place_id,
  pl.name AS place_name, pl.lat AS place_lat, pl.lng AS place_lng,
  o.name AS organizer_name, o.status AS organizer_status,
  (SELECT count(*)::int FROM event_rsvps r WHERE r.event_id = e.id AND r.status = 'angenommen') AS accepted,
  (SELECT r.status FROM event_rsvps r WHERE r.event_id = e.id AND r.account_id = $1) AS my_status,
  (SELECT ei.id FROM event_images ei WHERE ei.event_id = e.id ORDER BY ei.position, ei.created_at LIMIT 1) AS cover_id`;

export const EVENT_LIST_FROM = `events e LEFT JOIN places pl ON pl.id = e.place_id LEFT JOIN organizers o ON o.id = e.organizer_id`;

/** Wo liegt die Veranstaltung ungefähr (für Entfernung und Karte)? */
export function eventPoint(e: { map_lat: number | null; map_lng: number | null; place_lat?: number | null; place_lng?: number | null }): LatLng | null {
  if (e.map_lat != null) return { lat: e.map_lat, lng: e.map_lng! };
  if (e.place_lat != null) return { lat: e.place_lat, lng: e.place_lng! };
  return null;
}

export function eventCard(e: any, viewer: string, ref: LatLng | null) {
  const pt = eventPoint(e);
  const taken = (e.accepted ?? 0) + (e.test_guests ?? 0);
  return {
    id: e.id,
    title: e.title,
    startsAt: e.starts_at,
    endsAt: e.ends_at,
    cancelled: e.status === 'cancelled',
    categories: e.categories ?? [],
    area: e.area ?? null,
    place: e.place_id ? { id: e.place_id, name: e.place_name } : null,
    organizer: e.organizer_name ? { name: e.organizer_name, verified: e.organizer_status === 'verifiziert' } : null,
    featured: !!e.featured,
    capacity: e.capacity ?? null,
    spotsLeft: e.capacity ? Math.max(0, e.capacity - taken) : null,
    price: e.price ?? null,
    approvalRequired: !!e.approval_required,
    km: ref && pt ? displayKm(distanceKm(ref, pt)) : null,
    rsvp: e.my_status === 'angenommen',
    myStatus: e.my_status ?? null,
    isHost: e.host_id === viewer,
    cover: e.cover_id ? imgUrl('event', e.cover_id, viewer) : null,
    // alte Felder für Ort-Seite und Liste
    count: e.my_status === 'angenommen' ? taken : null,
  };
}

/** Ist die Veranstaltung für diese Person sichtbar? (rote Ampel nur mit Altersprüfung — M75.03) */
export async function visibleEvent(id: string, viewer: { id: string; age1: boolean }) {
  const e = await one(
    `SELECT e.*, pl.name AS place_name, pl.address AS place_address, pl.lat AS place_lat, pl.lng AS place_lng,
            o.name AS organizer_name, o.status AS organizer_status, o.kind AS organizer_kind, o.website AS organizer_website, o.account_id AS organizer_account
       FROM ${EVENT_LIST_FROM} WHERE e.id = $1`,
    [id],
  );
  if (!e) return null;
  const host = e.host_id === viewer.id;
  if (!host && !['approved', 'cancelled'].includes(e.status)) return null;
  if (!host && e.ampel === 'rot' && !viewer.age1) return null;
  return e;
}

export async function eventImages(eventId: string, viewer: string) {
  const rows = await q(`SELECT id, width, height FROM event_images WHERE event_id = $1 ORDER BY position, created_at`, [eventId]);
  return rows.map((r) => ({ id: r.id, url: imgUrl('event', r.id, viewer), width: r.width, height: r.height }));
}

/** Späteste Absage: Beginn minus Frist des Veranstalters. */
export function cancelDeadline(e: { starts_at: Date; cancel_until_hours: number }) {
  return new Date(new Date(e.starts_at).getTime() - (e.cancel_until_hours ?? 0) * 3600_000);
}
