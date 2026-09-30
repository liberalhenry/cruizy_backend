/**
 * Was andere von einem Profil sehen (F23, F20, F19, F11, F12, F13, F16, FV-38).
 *
 * PRÜFUNG ERFORDERLICH — hier entsteht jede Antwort, die Angaben über andere
 * Personen enthält. Sie enthält nie Koordinaten, Meter, Zeitstempel der
 * Aktivität oder Zählwerte (AK-F23-02, AK-F20-01, AK-F19-01).
 */
import { p } from '../config/params.js';
import { q, one } from '../db/pool.js';
import { displayKm, distanceKm, type LatLng } from '../lib/geo.js';
import { sameLocalDay } from '../lib/time.js';
import { imgUrl } from './media-tokens.js';
import { publicTrips } from '../modules/travel.js';

export interface Viewer {
  id: string | null; // null = Gast
  guestKey?: string;
  cell: LatLng | null; // eigener gerundeter Ort — oder null (Stadtwahl, Stufe „Aus“)
  responseEnabled: boolean;
  seeGroups: string[];
  intention: string | null;
}

/** Sichtbarkeitsbedingung für Profile anderer (Alias „a“ = accounts, „pr“ = profiles). $1 = betrachtende Person. */
export const VISIBLE_SQL = `
  a.status = 'active' AND a.consented_at IS NOT NULL
  AND a.deletion_requested_at IS NULL
  AND a.moderation_state <> 'suspended'
  AND a.minor_locked_at IS NULL
  AND ($1::uuid IS NULL OR a.id <> $1)
  AND ($1::uuid IS NULL OR NOT EXISTS (
        SELECT 1 FROM blocks b WHERE b.revoked_at IS NULL
          AND ((b.blocker_id = $1 AND b.blocked_id = a.id) OR (b.blocker_id = a.id AND b.blocked_id = $1))))`;

export const CARD_COLUMNS = `
  a.id, a.created_at AS account_created_at, a.last_active_at, a.first_visible_at, a.face_check_at, a.hash_restricted_at,
  pr.name, pr.age, pr.photo_mode, pr.initial_color, pr.intention, pr.intention_expires_at,
  pr.response_rate_enabled, pr.response_band, pr.gender_visible, pr.gender_category,
  l.display_lat, l.display_lng, l.approx, l.level, l.travel_lat, l.travel_lng, l.travel_place, l.cell_lat AS own_cell_lat, l.cell_lng AS own_cell_lng,
  (SELECT row(ph.id, ph.blurred)::text FROM photos ph
     WHERE ph.account_id = a.id AND ph.status = 'approved' ORDER BY ph.position, ph.created_at LIMIT 1) AS first_photo,
  (a.face_check_at IS NOT NULL AND NOT EXISTS (
     SELECT 1 FROM photos ph2 WHERE ph2.account_id = a.id AND ph2.status = 'approved' AND ph2.created_at > a.face_check_at)) AS verified`;

export type ActivityBand = 1 | 2 | 3 | 4 | 5;

function travelModeOf(from: LatLng | null, to: LatLng): 'auto' | 'flug' {
  return !from || distanceKm(from, to) >= 300 ? 'flug' : 'auto';
}

export function activityBand(last: Date | null, nowD = new Date()): ActivityBand {
  if (!last) return 5;
  const diff = nowD.getTime() - last.getTime();
  if (diff < p('P-AKTIV-JETZT') * 1000) return 1;
  if (diff < 3600_000) return 2;
  if (sameLocalDay(last, nowD)) return 3;
  if (diff < 7 * 86400_000) return 4;
  return 5;
}

export function currentIntention(row: { intention: string | null; intention_expires_at: Date | null }, nowD = new Date()) {
  if (!row.intention || !row.intention_expires_at || new Date(row.intention_expires_at) <= nowD) return null;
  // AK-F14-04: Restlaufzeit in ganzen Stunden, nie Minuten
  const hours = Math.max(1, Math.ceil((new Date(row.intention_expires_at).getTime() - nowD.getTime()) / 3600_000));
  return { key: row.intention, hours };
}

function parsePhoto(txt: string | null): { id: string; blurred: boolean } | null {
  if (!txt) return null;
  const m = /^\(([^,]+),([tf])\)$/.exec(txt);
  return m ? { id: m[1], blurred: m[2] === 't' } : null;
}

export interface Tile {
  id: string;
  name: string | null;
  photo: string | null;
  blurred: boolean;
  initial: string;
  color: string;
  /** gerundete Entfernung (displayKm): 0 = unter 1 km, null = keine Angabe (Stadtwahl, Gast ohne Ort) */
  km: number | null;
  approx: boolean;
  /** Konto jünger als P-NEU-TAGE (Issue #22) */
  isNew: boolean;
  /** Travel-Modus (Issue #18): nur das Zeichen, nie der Ort, an dem gestöbert wird */
  travel: { mode: 'auto' | 'flug' } | null;
  intention: { key: string; hours: number } | null;
  response: 1 | 2 | 3 | null;
  verified: boolean;
  activity?: ActivityBand;
}

export function initialOf(name: string): string {
  const ch = [...name.trim()][0] ?? '?';
  return /\p{L}/u.test(ch) ? ch.toLocaleUpperCase('de-DE') : ch;
}

export function toTile(row: any, viewer: Viewer, opts: { withActivity?: boolean; fullResponse?: boolean } = {}): Tile {
  const photo = row.photo_mode === 'photo' ? parsePhoto(row.first_photo) : null;
  const guest = !viewer.id;
  const pos: LatLng | null = row.display_lat != null ? { lat: row.display_lat, lng: row.display_lng } : null;
  let km: number | null = null;
  if (viewer.cell && pos) km = displayKm(distanceKm(viewer.cell, pos));
  const stage =
    !guest && viewer.responseEnabled && row.response_rate_enabled && row.response_band ? (row.response_band as 1 | 2 | 3) : null;
  // Issue #24: auf der Kachel nur die oberste Stufe, im Profil jede der drei — nie der Prozentwert
  const response = opts.fullResponse ? stage : stage === 1 ? 1 : null;
  const viewerKey = viewer.id ?? viewer.guestKey ?? 'gast';
  return {
    id: row.id,
    // FV-11: Gäste sehen keinen Namen, keine Antwortquote, kein Aktivitätsband
    name: guest ? null : row.name,
    photo: photo ? imgUrl('photo', photo.id, viewerKey, guest ? 'guest' : 'public') : null,
    blurred: photo ? photo.blurred || guest : false,
    initial: guest ? '' : initialOf(row.name),
    color: row.initial_color,
    km,
    approx: !!row.approx && km !== null,
    travel:
      row.travel_lat != null && !guest
        ? { mode: travelModeOf(row.own_cell_lat != null ? { lat: row.own_cell_lat, lng: row.own_cell_lng } : null, { lat: row.travel_lat, lng: row.travel_lng }) }
        : null,
    isNew: !!row.account_created_at && Date.now() - new Date(row.account_created_at).getTime() < p('P-NEU-TAGE') * 86400_000,
    intention: currentIntention(row),
    response,
    verified: !guest && !!row.verified,
    ...(opts.withActivity && !guest ? { activity: activityBand(row.last_active_at ? new Date(row.last_active_at) : null) } : {}),
  };
}

export async function viewerFor(accountId: string): Promise<Viewer> {
  const row = await one(
    `SELECT pr.response_rate_enabled, pr.see_groups, pr.intention, pr.intention_expires_at, l.cell_lat, l.cell_lng, l.level
       FROM profiles pr LEFT JOIN locations l ON l.account_id = pr.account_id WHERE pr.account_id = $1`,
    [accountId],
  );
  return {
    id: accountId,
    cell: row?.cell_lat != null && row.level !== 'aus' ? { lat: row.cell_lat, lng: row.cell_lng } : null,
    responseEnabled: !!row?.response_rate_enabled,
    seeGroups: row?.see_groups ?? [],
    intention: row ? (currentIntention(row)?.key ?? null) : null,
  };
}

/** Ist das Profil für diese Person sichtbar (Blockierung, Löschung, Sperre)? */
export async function canSee(viewerId: string, targetId: string): Promise<boolean> {
  const r = await one(
    `SELECT 1 FROM accounts a JOIN profiles pr ON pr.account_id = a.id WHERE a.id = $2 AND ${VISIBLE_SQL}`,
    [viewerId, targetId],
  );
  return !!r;
}

export async function isBlockedEitherWay(a: string, b: string): Promise<boolean> {
  const r = await one(
    `SELECT 1 FROM blocks WHERE revoked_at IS NULL
       AND ((blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)) LIMIT 1`,
    [a, b],
  );
  return !!r;
}

/** Vollständige Profilansicht (S20). */
export async function profileView(viewer: Viewer, targetId: string) {
  const row = await one(
    `SELECT ${CARD_COLUMNS}, pr.free_text, pr.traits, pr.gender_text, a.moderation_state,
            pr.height_cm, pr.weight_kg, pr.position, pr.body_types, pr.kinks
       FROM accounts a JOIN profiles pr ON pr.account_id = a.id
       LEFT JOIN locations l ON l.account_id = a.id
      WHERE a.id = $2 AND ${VISIBLE_SQL}`,
    [viewer.id, targetId],
  );
  if (!row) return null;
  const tile = toTile(row, viewer, { withActivity: true, fullResponse: true });
  // Freischaltung des Gesichts (F12): gilt, solange sie nicht zurückgenommen ist
  const unlocked = viewer.id
    ? !!(await one(
        `SELECT 1 FROM face_unlocks WHERE owner_id = $1 AND viewer_id = $2 AND revoked_at IS NULL`,
        [targetId, viewer.id],
      ))
    : false;
  const photos =
    row.photo_mode === 'photo'
      ? await q(
          `SELECT id, blurred FROM photos WHERE account_id = $1 AND status = 'approved' ORDER BY position, created_at`,
          [targetId],
        )
      : [];
  const viewerKey = viewer.id ?? 'gast';
  return {
    ...tile,
    age: row.age ?? null, // AK-PG-06: ganze Jahre, weder Monat noch Jahr der Geburt
    photos: photos.map((ph) => ({
      url: imgUrl('photo', ph.id, viewerKey, ph.blurred && unlocked ? 'clear' : 'public'),
      blurred: ph.blurred && !unlocked,
    })),
    faceUnlocked: unlocked,
    freeText: row.free_text || '',
    traits: row.traits ?? [],
    gender: row.gender_visible ? { category: row.gender_category, text: row.gender_text } : null,
    // Issue #13 — alles freiwillig; leer heißt „keine Angabe“
    heightCm: row.height_cm ?? null,
    weightKg: row.weight_kg ?? null,
    position: row.position ?? null,
    bodyTypes: row.body_types ?? [],
    kinks: row.kinks ?? [],
    // Issue #18: wo die Person gerade stöbert, und ihre öffentlichen Reisen
    travelPlace: row.travel_lat != null ? row.travel_place : null,
    trips: viewer.id ? await publicTrips(targetId) : [],
  };
}
