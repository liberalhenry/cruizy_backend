/**
 * Cruizy Date (Issue #19) — Kernlogik: Mitgliedschaft, Pflicht-Minimum, Region, Profilansicht,
 * Kompatibilität, Tagesvorschläge, Likes und Matches.
 *
 * PRÜFUNG ERFORDERLICH.
 *  * Gegenseitigkeit: Date-Profile, Vorschläge, Likes und das Date-Zeichen im Raster gibt es nur
 *    für Konten mit aktivem Date-Zugang — serverseitig, auch über die Schnittstelle.
 *  * Date-Sperren betreffen nur Date; der Hauptbereich bleibt.
 *  * Religion und Politik stehen im Profil (freiwillig), fließen aber nicht ins Matching ein.
 */
import { p } from '../config/params.js';
import { one, q, tx, type Queryable } from '../db/pool.js';
import { AppError } from '../lib/errors.js';
import { distanceKm, displayKm, type LatLng } from '../lib/geo.js';
import { localDateString } from '../lib/time.js';
import { DATE_INTENTIONS, DATE_PROMPTS, DATE_VALUES } from './catalogs.js';
import { hasTier } from './entitlements.js';
import { emit } from './hub.js';
import { audioUrl, imgUrl } from './media-tokens.js';
import { createNotice } from './notify.js';
import { isBlockedEitherWay } from './profiles.js';
import { t } from '../lib/texts.js';

export type DateStatus = 'onboarding' | 'aktiv' | 'pausiert' | 'gesperrt';

export function dateEnabled() {
  return !!p('P-DATE-AKTIV');
}

export async function dateAccess(accountId: string) {
  return one(`SELECT * FROM date_access WHERE account_id = $1`, [accountId]);
}

/** Aktives Mitglied: Zugang freigeschaltet, nicht pausiert, nicht gesperrt, Hauptkonto sichtbar. */
export async function isActiveMember(accountId: string, c: Queryable | undefined = undefined): Promise<boolean> {
  if (!dateEnabled()) return false;
  const r = await one(
    `SELECT 1 FROM date_access da JOIN accounts a ON a.id = da.account_id
      WHERE da.account_id = $1 AND da.status = 'aktiv' AND a.status = 'active' AND a.deletion_requested_at IS NULL
        AND a.moderation_state <> 'suspended' AND a.minor_locked_at IS NULL`,
    [accountId],
    c,
  );
  return !!r;
}

/** Nur für aktive Mitglieder: sonst 403 (Gegenseitigkeit). */
export async function requireActiveMember(accountId: string) {
  if (!dateEnabled()) throw new AppError(404, 'UI-NICHT-VERFUEGBAR', {}, 'date_aus');
  const acc = await dateAccess(accountId);
  if (acc?.status === 'gesperrt') throw new AppError(403, 'UI-DATE-GESPERRT', {}, 'date_gesperrt');
  if (!acc || acc.status !== 'aktiv') throw new AppError(403, 'UI-DATE-NUR-MITGLIEDER', {}, 'date_nur_mitglieder');
  await q(`UPDATE date_access SET last_active_at = now() WHERE account_id = $1`, [accountId]);
  return acc;
}

/** Heute in der Zeitzone der Nutzer (DACH: eine Zeitzone, P-ZEITZONE). */
export function dateDay(d = new Date()) {
  return localDateString(d);
}

// ───────────── Region ─────────────

export async function regionFor(accountId: string): Promise<{ active: boolean; cityId: string | null; city: string | null }> {
  const cfg = p('P-DATE-REGIONEN') as { modus: string; staedte: string[]; radiusKm: number; schwelle: number };
  const loc = await one(
    `SELECT l.city_id, l.cell_lat, l.cell_lng, c.name AS city_name FROM locations l LEFT JOIN cities c ON c.id = l.city_id WHERE l.account_id = $1`,
    [accountId],
  );
  // nächste Stadt aus der Liste (oder die gewählte Stadt)
  let cityId: string | null = loc?.city_id ?? null;
  let city: string | null = loc?.city_name ?? null;
  if (loc?.cell_lat != null) {
    const near = await one(
      `SELECT id, name FROM cities ORDER BY (lat - $1) ^ 2 + ((lng - $2) * cos(radians($1))) ^ 2 LIMIT 1`,
      [loc.cell_lat, loc.cell_lng],
    );
    if (near) {
      cityId = near.id;
      city = near.name;
    }
  }
  if (cfg.modus === 'alle') return { active: true, cityId, city };
  if (!cityId) return { active: false, cityId, city };
  if (cfg.staedte.includes(cityId)) {
    if (loc?.cell_lat == null) return { active: true, cityId, city };
    const c = await one(`SELECT lat, lng FROM cities WHERE id = $1`, [cityId]);
    return { active: !c || distanceKm({ lat: loc.cell_lat, lng: loc.cell_lng }, { lat: c.lat, lng: c.lng }) <= cfg.radiusKm, cityId, city };
  }
  // Schwelle: genug Leute auf der Warteliste → die Stadt ist freigeschaltet
  const w = await one(`SELECT count(*)::int AS n FROM date_waitlist WHERE city_id = $1`, [cityId]);
  return { active: w!.n >= cfg.schwelle, cityId, city };
}

// ───────────── Pflicht-Minimum ─────────────

export async function minimumState(accountId: string) {
  const acc = await dateAccess(accountId);
  const [minPhotos] = p('P-DATE-FOTOS') as readonly number[];
  const [minPrompts] = p('P-DATE-PROMPTS') as readonly number[];
  const photos = await one(`SELECT count(*) FILTER (WHERE status <> 'rejected')::int AS n, count(*) FILTER (WHERE status = 'approved')::int AS ok FROM date_photos WHERE account_id = $1`, [accountId]);
  const prompts = await one(`SELECT count(*)::int AS n FROM date_prompts WHERE account_id = $1`, [accountId]);
  const voice = await one(`SELECT 1 FROM date_audio WHERE account_id = $1 AND kind = 'intro'`, [accountId]);
  const prof = await one(`SELECT job FROM date_profiles WHERE account_id = $1`, [accountId]);
  const items = {
    intention: !!acc?.intention,
    fotos: photos!.n >= minPhotos,
    verifizierung: !!acc?.verified_at,
    beruf: !!prof?.job?.trim(),
    prompts: prompts!.n >= minPrompts,
    voice: !!voice,
    kodex: !!acc?.code_accepted_at,
  };
  const missing = Object.entries(items)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  return { ok: missing.length === 0, items, missing, photos: photos!.n, photosApproved: photos!.ok, prompts: prompts!.n };
}

/** Freischalten, sobald Verifizierung, Pflicht-Minimum und Kodex erfüllt sind. */
export async function tryActivate(accountId: string): Promise<boolean> {
  const acc = await dateAccess(accountId);
  if (!acc || acc.status !== 'onboarding') return acc?.status === 'aktiv';
  const m = await minimumState(accountId);
  if (!m.ok) return false;
  await q(`UPDATE date_access SET status = 'aktiv', step = 'fertig', activated_at = now(), last_active_at = now() WHERE account_id = $1`, [accountId]);
  return true;
}

// ───────────── Profilansicht ─────────────

const INTENTION_LABEL = new Map<string, string>(DATE_INTENTIONS.map((x) => [x.key, x.label]));
const PROMPT_LABEL = new Map<string, string>(DATE_PROMPTS.map((x) => [x.key, x.label]));
function valueLabel(field: keyof typeof DATE_VALUES, key: string | null) {
  if (!key) return null;
  return (DATE_VALUES[field] as readonly { key: string; label: string }[]).find((x) => x.key === key)?.label ?? null;
}

/** Darf `viewer` das Date-Profil von `target` sehen? Beide aktiv, nicht blockiert, Profil mit Fotos. */
export async function canSeeDateProfile(viewer: string, target: string): Promise<boolean> {
  if (viewer === target) return true;
  if (!(await isActiveMember(viewer)) || !(await isActiveMember(target))) return false;
  if (await isBlockedEitherWay(viewer, target)) return false;
  return true;
}

export async function dateProfileView(target: string, viewer: string, opts: { own?: boolean } = {}) {
  const base = await one(
    `SELECT pr.name, pr.age, pr.height_cm, da.intention, da.verified_at, dp.*,
            l.cell_lat, l.cell_lng
       FROM date_access da JOIN profiles pr ON pr.account_id = da.account_id
       LEFT JOIN date_profiles dp ON dp.account_id = da.account_id
       LEFT JOIN locations l ON l.account_id = da.account_id
      WHERE da.account_id = $1`,
    [target],
  );
  if (!base) return null;
  const me = viewer === target ? null : await one(`SELECT cell_lat, cell_lng FROM locations WHERE account_id = $1`, [viewer]);
  const photos = await q(
    `SELECT id, status FROM date_photos WHERE account_id = $1 ${opts.own ? `AND status <> 'rejected'` : `AND status = 'approved'`} ORDER BY position, created_at`,
    [target],
  );
  const prompts = await q(`SELECT id, prompt_key, answer FROM date_prompts WHERE account_id = $1 ORDER BY position`, [target]);
  const audio = await q(`SELECT id, kind, prompt_key, duration_ms FROM date_audio WHERE account_id = $1`, [target]);
  const km =
    me?.cell_lat != null && base.cell_lat != null ? displayKm(distanceKm({ lat: me.cell_lat, lng: me.cell_lng }, { lat: base.cell_lat, lng: base.cell_lng })) : null;
  const au = (kind: string) => {
    const a = audio.find((x) => x.kind === kind);
    return a ? { id: a.id, url: audioUrl(a.id, viewer, 'date'), durationMs: a.duration_ms, promptKey: a.prompt_key, prompt: a.prompt_key ? PROMPT_LABEL.get(a.prompt_key) ?? null : null } : null;
  };
  return {
    id: target,
    name: base.name,
    age: base.age,
    heightCm: base.height_cm,
    km,
    verified: !!base.verified_at,
    intention: base.intention,
    intentionLabel: base.intention ? INTENTION_LABEL.get(base.intention) ?? null : null,
    job: base.job ?? null,
    employer: base.employer ?? null,
    interests: base.interests ?? [],
    lookingFor: base.looking_for ?? null,
    values: {
      relationshipModel: valueLabel('relationship_model', base.relationship_model),
      kids: valueLabel('kids', base.kids),
      smoking: valueLabel('smoking', base.smoking),
      alcohol: valueLabel('alcohol', base.alcohol),
      sport: valueLabel('sport', base.sport),
      religion: valueLabel('religion', base.religion),
      politics: valueLabel('politics', base.politics),
    },
    photos: photos.map((x) => ({ id: x.id, url: imgUrl('date', x.id, viewer), status: opts.own ? x.status : undefined })),
    prompts: prompts.map((x) => ({ id: x.id, key: x.prompt_key, prompt: PROMPT_LABEL.get(x.prompt_key) ?? x.prompt_key, answer: x.answer })),
    voice: au('intro'),
    audioPrompt: au('prompt'),
  };
}

// ───────────── Kompatibilität (austauschbar) ─────────────

export interface DateCandidate {
  id: string;
  age: number | null;
  intention: string | null;
  interests: string[];
  relationship_model: string | null;
  kids: string | null;
  smoking: string | null;
  alcohol: string | null;
  sport: string | null;
  cell: LatLng | null;
  prefs: { age_min: number; age_max: number; distance_km: number; dealbreakers: Record<string, string[]> };
}

/** Schließt ein Deal-Breaker von `a` die Person `b` aus? */
export function dealbreakerHit(a: DateCandidate, b: DateCandidate): boolean {
  for (const [field, bad] of Object.entries(a.prefs.dealbreakers ?? {})) {
    const v = (b as unknown as Record<string, string | null>)[field];
    if (v && Array.isArray(bad) && bad.includes(v)) return true;
  }
  return false;
}

/**
 * Kompatibilität 0…100: Intention, Werte, Interessen. Entfernung ist nur Filter.
 * Religion und Politik zählen nicht.
 */
export function compatibility(a: DateCandidate, b: DateCandidate): number {
  let s = 0;
  // Intention (max 30)
  if (a.intention && b.intention) {
    if (a.intention === b.intention) s += 30;
    else if ([a.intention, b.intention].includes('beziehung') && [a.intention, b.intention].includes('offen')) s += 22;
    else s += 14;
  }
  // Beziehungsmodell (max 15)
  if (a.relationship_model && b.relationship_model) {
    if (a.relationship_model === b.relationship_model) s += 15;
    else if ([a.relationship_model, b.relationship_model].includes('unsicher')) s += 7;
  }
  // Kinderwunsch (max 15, Konflikt 0)
  if (a.kids && b.kids) {
    const conflict = (x: string, y: string) => (x === 'will' && y === 'will_nicht') || (x === 'will_nicht' && y === 'will');
    if (a.kids === b.kids) s += 15;
    else if (!conflict(a.kids, b.kids)) s += 8;
  }
  // Lebensstil (max 15)
  if (a.smoking && a.smoking === b.smoking) s += 5;
  if (a.alcohol && a.alcohol === b.alcohol) s += 5;
  if (a.sport && b.sport) {
    const order = ['selten', 'manchmal', 'regelmaessig', 'taeglich'];
    s += Math.max(0, 5 - 2 * Math.abs(order.indexOf(a.sport) - order.indexOf(b.sport)));
  }
  // Interessen (max 25, Jaccard)
  const ia = new Set(a.interests.map((x) => x.toLocaleLowerCase('de-DE')));
  const ib = new Set(b.interests.map((x) => x.toLocaleLowerCase('de-DE')));
  const inter = [...ia].filter((x) => ib.has(x)).length;
  const union = new Set([...ia, ...ib]).size;
  if (union) s += Math.round((inter / union) * 25 * 10) / 10;
  return Math.min(100, s);
}

/** Passt `b` in die Filter von `a` (Alter, Entfernung, Deal-Breaker)? — beidseitig prüfen. */
export function fits(a: DateCandidate, b: DateCandidate): boolean {
  if (b.age != null && (b.age < a.prefs.age_min || b.age > a.prefs.age_max)) return false;
  if (a.cell && b.cell && distanceKm(a.cell, b.cell) > a.prefs.distance_km) return false;
  if (dealbreakerHit(a, b)) return false;
  return true;
}

async function loadCandidates(ids: string[] | null): Promise<DateCandidate[]> {
  const rows = await q(
    `SELECT da.account_id AS id, pr.age, da.intention, dp.interests, dp.relationship_model, dp.kids, dp.smoking, dp.alcohol, dp.sport,
            l.cell_lat, l.cell_lng, pf.age_min, pf.age_max, pf.distance_km, pf.dealbreakers
       FROM date_access da JOIN accounts a ON a.id = da.account_id JOIN profiles pr ON pr.account_id = da.account_id
       LEFT JOIN date_profiles dp ON dp.account_id = da.account_id
       LEFT JOIN date_preferences pf ON pf.account_id = da.account_id
       LEFT JOIN locations l ON l.account_id = da.account_id
      WHERE da.status = 'aktiv' AND a.status = 'active' AND a.deletion_requested_at IS NULL AND a.moderation_state <> 'suspended'
        AND a.minor_locked_at IS NULL
        AND EXISTS (SELECT 1 FROM date_photos ph WHERE ph.account_id = da.account_id AND ph.status = 'approved')
        AND ($1::uuid[] IS NULL OR da.account_id = ANY($1))`,
    [ids],
  );
  return rows.map((r) => ({
    id: r.id,
    age: r.age,
    intention: r.intention,
    interests: r.interests ?? [],
    relationship_model: r.relationship_model,
    kids: r.kids,
    smoking: r.smoking,
    alcohol: r.alcohol,
    sport: r.sport,
    cell: r.cell_lat != null ? { lat: r.cell_lat, lng: r.cell_lng } : null,
    prefs: { age_min: r.age_min ?? 18, age_max: r.age_max ?? 99, distance_km: r.distance_km ?? 100, dealbreakers: r.dealbreakers ?? {} },
  }));
}

export async function dailyLimit(accountId: string) {
  const tier = (p('P-DATE-PREMIUM') as Record<string, string>).mehrVorschlaege;
  if (tier !== 'frei' && (await hasTier(accountId, tier as 'plus' | 'pro'))) return p('P-DATE-VORSCHLAEGE-PREMIUM');
  if (tier === 'frei') return p('P-DATE-VORSCHLAEGE-PREMIUM');
  return p('P-DATE-VORSCHLAEGE');
}

export async function premium(accountId: string, feature: 'mehrVorschlaege' | 'likesSehen' | 'filter' | 'superLike' | 'zurueckholen') {
  const tier = (p('P-DATE-PREMIUM') as Record<string, string>)[feature];
  if (!tier || tier === 'frei') return true;
  return hasTier(accountId, tier as 'plus' | 'pro');
}

/**
 * Tagesvorschläge berechnen (Hintergrundauftrag oder erster Abruf des Tages). Idempotent je Tag.
 * Ausgeschlossen: Blockierte, schon Gelikte/Übersprungene, bestehende Matches, Deal-Breaker (beidseitig).
 */
export async function buildSuggestions(accountId: string, day = dateDay()): Promise<number> {
  const existing = await one(`SELECT count(*)::int AS n FROM date_daily_suggestions WHERE account_id = $1 AND day = $2`, [accountId, day]);
  if (existing!.n > 0) return existing!.n;
  const [me] = await loadCandidates([accountId]);
  if (!me) return 0;
  const excluded = new Set<string>(
    (
      await q(
        `SELECT to_id AS id FROM date_likes WHERE from_id = $1
         UNION SELECT to_id FROM date_passes WHERE from_id = $1
         UNION SELECT CASE WHEN user_low = $1 THEN user_high ELSE user_low END FROM date_matches WHERE (user_low = $1 OR user_high = $1) AND ended_at IS NULL
         UNION SELECT CASE WHEN blocker_id = $1 THEN blocked_id ELSE blocker_id END FROM blocks WHERE revoked_at IS NULL AND (blocker_id = $1 OR blocked_id = $1)
         UNION SELECT candidate_id FROM date_daily_suggestions WHERE account_id = $1 AND day > $2::date - 7`,
        [accountId, day],
      )
    ).map((r) => r.id),
  );
  excluded.add(accountId);
  const likedMe = new Set((await q(`SELECT from_id FROM date_likes WHERE to_id = $1`, [accountId])).map((r) => r.from_id as string));
  const all = (await loadCandidates(null)).filter((c) => !excluded.has(c.id) && fits(me, c) && fits(c, me));
  // gleiche Punktzahl: stabil je Tag gemischt
  const tie = (id: string) => [...`${id}${day}`].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) / 2 ** 32;
  const scored = all
    .map((c) => ({ id: c.id, score: compatibility(me, c) + (likedMe.has(c.id) ? 20 : 0) + tie(c.id) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, await dailyLimit(accountId));
  await tx(async (cl) => {
    let i = 0;
    for (const s of scored) {
      await cl.query(
        `INSERT INTO date_daily_suggestions (account_id, day, candidate_id, position, score) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
        [accountId, day, s.id, i++, s.score],
      );
    }
  });
  return scored.length;
}

/** Hintergrundauftrag: Vorschläge für alle aktiven Mitglieder vorberechnen (nach Mitternacht). */
export async function precomputeSuggestions() {
  if (!dateEnabled()) return;
  const day = dateDay();
  const rows = await q(
    `SELECT da.account_id FROM date_access da WHERE da.status = 'aktiv'
        AND NOT EXISTS (SELECT 1 FROM date_daily_suggestions s WHERE s.account_id = da.account_id AND s.day = $1)
      LIMIT 2000`,
    [day],
  );
  for (const r of rows) await buildSuggestions(r.account_id, day).catch(() => 0);
  await q(`DELETE FROM date_daily_suggestions WHERE day < $1::date - 14`, [day]);
}

/** Hintergrundauftrag: nach P-DATE-PAUSE-TAGE ohne Aktivität pausieren (Reaktivierung beim Anmelden). */
export async function autoPauseDate() {
  await q(
    `UPDATE date_access SET status = 'pausiert', paused_at = now(), auto_paused = true
      WHERE status = 'aktiv' AND last_active_at < now() - make_interval(days => $1)`,
    [p('P-DATE-PAUSE-TAGE')],
  );
}

export async function reactivateAfterLogin(accountId: string) {
  await q(`UPDATE date_access SET status = 'aktiv', paused_at = NULL, auto_paused = false, last_active_at = now() WHERE account_id = $1 AND status = 'pausiert' AND auto_paused`, [
    accountId,
  ]);
}

// ───────────── Likes und Matches ─────────────

const pair = (a: string, b: string): [string, string] => (a < b ? [a, b] : [b, a]);

export async function activeMatch(a: string, b: string) {
  const [low, high] = pair(a, b);
  return one(`SELECT * FROM date_matches WHERE user_low = $1 AND user_high = $2 AND ended_at IS NULL`, [low, high]);
}

/**
 * Match anlegen. Gibt es schon ein Gespräch, wird es markiert (kein zweites) — mit Hinweis
 * „Ihr habt euch auch in Cruizy Date gematcht“.
 */
export async function createMatch(me: string, other: string, myLike: string, theirLike: string) {
  const [low, high] = pair(me, other);
  const res = await tx(async (cl) => {
    const dup = await one(`SELECT id FROM date_matches WHERE user_low = $1 AND user_high = $2 AND ended_at IS NULL`, [low, high], cl);
    if (dup) return { id: dup.id as string, conversationId: null as string | null, existed: true };
    let conv = await one(`SELECT id, state FROM conversations WHERE user_low = $1 AND user_high = $2`, [low, high], cl);
    let existed = !!conv && conv.state === 'open';
    if (conv && conv.state !== 'open') {
      // beendetes Gespräch: wieder öffnen statt ein zweites anzulegen
      await cl.query(`UPDATE conversations SET state = 'open', ended_by = NULL, ended_at = NULL, pending_exit_by = NULL, pending_exit_at = NULL WHERE id = $1`, [conv.id]);
      existed = false;
    }
    if (!conv) {
      conv = await one(`INSERT INTO conversations (user_low, user_high, initiator_id) VALUES ($1, $2, $3) RETURNING id, state`, [low, high, me], cl);
    }
    await cl.query(`INSERT INTO messages (conversation_id, sender_id, kind, system_code) VALUES ($1, NULL, 'system', $2)`, [
      conv!.id,
      existed ? 'date_match_bestehend' : 'date_match',
    ]);
    await cl.query(`UPDATE conversations SET last_message_at = now() WHERE id = $1`, [conv!.id]);
    const m = await one(
      `INSERT INTO date_matches (user_low, user_high, like_low_id, like_high_id, conversation_id, conversation_existed)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [low, high, low === me ? myLike : theirLike, low === me ? theirLike : myLike, conv!.id, existed],
      cl,
    );
    return { id: m!.id as string, conversationId: conv!.id as string, existed };
  });
  for (const who of [me, other]) {
    emit(who, 'date', { match: res.id });
    emit(who, 'nachricht', { conversationId: res.conversationId });
  }
  await createNotice(other, 'date', t('UI-DATE-N-MATCH-TITEL'), t('UI-DATE-N-MATCH'), null, undefined, { pushTitle: t('UI-DATE-N-MATCH-PUSH'), url: '/chats?reiter=date' });
  return res;
}

/** Unmatch: aus Date entfernt — ein durch das Match entstandenes Gespräch endet für beide. */
export async function endMatch(matchId: string, by: string) {
  const m = await one(`SELECT * FROM date_matches WHERE id = $1 AND ended_at IS NULL AND (user_low = $2 OR user_high = $2)`, [matchId, by]);
  if (!m) return false;
  await tx(async (cl) => {
    await cl.query(`UPDATE date_matches SET ended_at = now(), ended_by = $2 WHERE id = $1`, [matchId, by]);
    if (m.conversation_id) {
      await cl.query(`INSERT INTO messages (conversation_id, sender_id, kind, system_code) VALUES ($1, $2, 'system', 'date_unmatch')`, [m.conversation_id, by]);
      if (!m.conversation_existed) {
        await cl.query(`UPDATE conversations SET state = 'ended', ended_by = $2, ended_at = now() WHERE id = $1 AND state = 'open'`, [m.conversation_id, by]);
      }
    }
    // Likes zwischen beiden entfernen — kein erneuter Vorschlag über alte Likes
    await cl.query(`DELETE FROM date_likes WHERE (from_id = $1 AND to_id = $2) OR (from_id = $2 AND to_id = $1)`, [m.user_low, m.user_high]);
    await cl.query(`INSERT INTO date_passes (from_id, to_id) VALUES ($1, $2), ($2, $1) ON CONFLICT DO NOTHING`, [m.user_low, m.user_high]);
  });
  for (const who of [m.user_low, m.user_high]) emit(who, 'nachricht', { conversationId: m.conversation_id });
  return true;
}

/** Das gelikte Element als kurze Beschreibung (für den angepinnten Kopf im Date-Chat). */
export async function likedElement(like: { target_kind: string; target_id: string; to_id: string } | null, viewer: string) {
  if (!like) return null;
  if (like.target_kind === 'foto') {
    const ph = await one(`SELECT id FROM date_photos WHERE id = $1 AND status = 'approved'`, [like.target_id]);
    return ph ? { kind: 'foto', url: imgUrl('date', ph.id, viewer) } : { kind: 'foto', url: null };
  }
  if (like.target_kind === 'prompt') {
    const pr = await one(`SELECT prompt_key, answer FROM date_prompts WHERE id = $1`, [like.target_id]);
    return { kind: 'prompt', prompt: pr ? PROMPT_LABEL.get(pr.prompt_key) ?? pr.prompt_key : null, answer: pr?.answer ?? null };
  }
  return { kind: 'audio' };
}

/** Date-Kopf für ein Gespräch: gelikte Elemente und Kommentare beider Seiten. */
export async function dateChatHeader(conversationId: string, viewer: string) {
  const m = await one(`SELECT * FROM date_matches WHERE conversation_id = $1 AND ended_at IS NULL`, [conversationId]);
  if (!m) return null;
  const likes = await q(`SELECT * FROM date_likes WHERE id = ANY($1)`, [[m.like_low_id, m.like_high_id].filter(Boolean)]);
  const out = [];
  for (const l of likes) {
    out.push({ mine: l.from_id === viewer, comment: l.comment, element: await likedElement(l, viewer) });
  }
  return { matchId: m.id, since: m.created_at, existedBefore: m.conversation_existed, likes: out };
}

/** Konten, die in `ids` aktive Date-Mitglieder sind und das Zeichen im Raster zeigen wollen. */
export async function dateBadgeIds(viewer: string, ids: string[]): Promise<Set<string>> {
  if (!ids.length || !(await isActiveMember(viewer))) return new Set();
  const rows = await q(`SELECT account_id FROM date_access WHERE account_id = ANY($1) AND status = 'aktiv' AND badge_in_grid`, [ids]);
  return new Set(rows.map((r) => r.account_id as string));
}

/** Date-Sperre (nur Date — der Hauptbereich bleibt). */
export async function suspendDate(accountId: string, reason: string, by: string | null) {
  await q(`UPDATE date_access SET status = 'gesperrt', suspended_at = now(), suspended_reason = $2, suspended_by = $3 WHERE account_id = $1`, [accountId, reason, by]);
  // offene Matches enden, das Profil wird nicht mehr ausgespielt
  const ms = await q(`SELECT id FROM date_matches WHERE (user_low = $1 OR user_high = $1) AND ended_at IS NULL`, [accountId]);
  for (const m of ms) await endMatch(m.id, accountId);
  await createNotice(accountId, 'date', t('UI-DATE-N-GESPERRT-TITEL'), t('UI-DATE-N-GESPERRT'), null);
}

/** Nach einer berechtigten Date-Meldung: ab P-DATE-MELDUNGEN-SPERRE Date sperren. */
export async function checkDateStrikes(accountId: string, staffId: string) {
  const r = await one(`SELECT count(*)::int AS n FROM reports WHERE target_id = $1 AND decision = 'date_verstoss'`, [accountId]);
  const acc = await dateAccess(accountId);
  if (acc && acc.status !== 'gesperrt' && r!.n >= p('P-DATE-MELDUNGEN-SPERRE')) {
    await suspendDate(accountId, `${r!.n} berechtigte Date-Meldungen`, staffId);
    return true;
  }
  return false;
}
