/**
 * Profil (5.0, F13–F21) und Einstellungen (S63).
 */
import type { FastifyInstance } from 'fastify';
import { randomInt } from 'node:crypto';
import { z } from 'zod';
import { p } from '../config/params.js';
import { one, q, tx } from '../db/pool.js';
import { requireMember, requireSession } from '../lib/context.js';
import { AppError, bad, notFound } from '../lib/errors.js';
import { body, idParam, params } from '../lib/http.js';
import {
  GENDER_KEYS,
  INTENTIONS,
  TRAIT_IDS,
  hasExclusionaryPhrase,
  validName,
  type IntentionKey,
} from '../services/catalogs.js';
import { allowedDurations, computeExpiry, renewalQuiet, type Duration } from '../services/intentions.js';
import { CARD_COLUMNS, VISIBLE_SQL, currentIntention, profileView, toTile, viewerFor } from '../services/profiles.js';
import { ownPhotos } from './photos.js';
import { emit } from '../services/hub.js';

const intentionKey = z.enum(['abend', 'schreiben', 'absicht3', 'absicht4']);
const durationKey = z.enum(['1h', '2h', '4h', '8h', 'morgen', 'wochenende', 'abend', 'schreiben']);

function randomColor() {
  const colors = p('P-INITIALE-FARBEN') as readonly string[];
  return colors[randomInt(0, colors.length)];
}

async function setIntention(accountId: string, key: IntentionKey | null, duration?: Duration) {
  if (!key) {
    await q(
      `UPDATE profiles SET intention = NULL, intention_started_at = NULL, intention_expires_at = NULL, intention_expired_at = NULL WHERE account_id = $1`,
      [accountId],
    );
    return null;
  }
  let res;
  try {
    res = computeExpiry(key, duration);
  } catch {
    throw bad('UI-EINGABE-PRUEFEN', {}, 'dauer');
  }
  await q(
    `UPDATE profiles SET intention = $2, intention_started_at = now(), intention_expires_at = $3,
            last_intention = $2, last_intention_duration = $4, intention_expired_at = NULL
      WHERE account_id = $1`,
    [accountId, key, res.end, res.duration],
  );
  return res.end;
}

export async function ownProfile(accountId: string) {
  const r = await one(
    `SELECT pr.*, a.age1_at, a.age2_at, a.face_check_at, a.contract_version, a.deletion_due_at, a.moderation_state,
            a.created_at AS account_created, a.recovery_prompted_at, a.recovery_code_created_at,
            a.email_verified_at IS NOT NULL AS has_email, a.phone_verified_at IS NOT NULL AS has_phone,
            a.primary_method, a.trusted_key_hash IS NOT NULL AS has_trusted, a.hash_restricted_at,
            l.level, l.city_id, l.cell_lat IS NOT NULL AS has_location, l.approx, l.invisible, l.in_zone, l.country
       FROM profiles pr JOIN accounts a ON a.id = pr.account_id
       LEFT JOIN locations l ON l.account_id = pr.account_id
      WHERE pr.account_id = $1`,
    [accountId],
  );
  if (!r) return null;
  const nowD = new Date();
  const intention = currentIntention(r, nowD);
  const expiredUnrenewed =
    !intention &&
    r.intention_expired_at &&
    r.last_intention &&
    (!r.renewal_dismissed_until || new Date(r.renewal_dismissed_until) < new Date(r.intention_expired_at));
  const ageDue =
    r.age != null && r.age_set_at && Date.now() - new Date(r.age_prompted_at ?? r.age_set_at).getTime() > p('P-ALTER-NACHFRAGE') * 1000;
  return {
    name: r.name,
    age: r.age,
    agePrompt: !!ageDue,
    photoMode: r.photo_mode,
    color: r.initial_color,
    intention,
    // F14: Erneuerungsleiste nach stillem Ablauf, nicht zwischen 4 und 10 Uhr (FV-30)
    renewal: expiredUnrenewed && !renewalQuiet(nowD) ? { key: r.last_intention, duration: r.last_intention_duration } : null,
    traits: r.traits,
    gender: { category: r.gender_category, text: r.gender_text, visible: r.gender_visible },
    seeGroups: r.see_groups,
    freeText: r.free_text,
    freeTextFlagged: r.free_text_flagged,
    responseRate: { enabled: r.response_rate_enabled, band: r.response_rate_enabled ? r.response_band : null },
    verified: { age: !!r.age1_at, stage2: !!r.age2_at, photos: !!r.face_check_at, contract: !!r.contract_version },
    settings: {
      sort: r.sort_mode,
      mediaReceive: r.media_receive,
      disappearingDefault: r.disappearing_default,
      pushEnabled: r.push_enabled,
      pushPreview: r.push_preview,
      quietFrom: r.quiet_from,
      quietTo: r.quiet_to,
      checkinEffect: r.checkin_effect,
      filters: r.filters,
    },
    location: {
      level: r.level ?? 'grob',
      cityId: r.city_id,
      hasLocation: !!r.has_location,
      approx: !!r.approx,
      invisible: !!r.invisible,
      inZone: !!r.in_zone,
      country: r.country,
    },
    account: {
      primaryMethod: r.primary_method,
      hasEmail: r.has_email,
      hasPhone: r.has_phone,
      hasTrusted: r.has_trusted,
      deletionDueAt: r.deletion_due_at,
      moderationState: r.moderation_state,
      restricted: !!r.hash_restricted_at || r.moderation_state === 'restricted',
      // AK-Z09-02: nach P-CODE-NACHFRAGE einmal fragen, danach nie wieder ungefragt
      recoveryPrompt:
        !r.recovery_prompted_at &&
        r.recovery_code_created_at &&
        Date.now() - new Date(r.account_created).getTime() > p('P-CODE-NACHFRAGE') * 1000,
    },
  };
}

export default async function profileRoutes(app: FastifyInstance) {
  // Profil anlegen (S05) — nach der Einwilligung
  app.post('/api/profile', async (req) => {
    const a = await requireSession(req);
    if (a.status !== 'active' || !a.consented) throw new AppError(403, 'UI-EINWILLIGUNG-FEHLT', {}, 'einwilligung_fehlt');
    const b = body(
      req,
      z.object({
        name: z.string().max(60),
        photoMode: z.enum(['photo', 'initial']).default('initial'),
        color: z.string().optional(),
        intention: intentionKey.nullable().optional(),
        duration: durationKey.optional(),
      }),
    );
    if (!validName(b.name, p('P-NAME-MAX'))) throw bad('UI-NAME-UNGUELTIG', { max: p('P-NAME-MAX') }, 'name');
    const colors = p('P-INITIALE-FARBEN') as readonly string[];
    const color = b.color && colors.includes(b.color) ? b.color : randomColor();
    await tx(async (c) => {
      await c.query(
        `INSERT INTO profiles (account_id, name, photo_mode, initial_color, media_receive)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (account_id) DO UPDATE SET name = EXCLUDED.name, photo_mode = EXCLUDED.photo_mode, initial_color = EXCLUDED.initial_color`,
        [a.id, b.name.trim(), b.photoMode, color, p('P-BILD-EMPFANG')],
      );
      // AK-Q02-01 / AK-F69-01: die ungenaueste Stufe ist voreingestellt
      await c.query(`INSERT INTO locations (account_id, level) VALUES ($1, 'grob') ON CONFLICT DO NOTHING`, [a.id]);
      await c.query(`UPDATE accounts SET first_visible_at = COALESCE(first_visible_at, now()) WHERE id = $1`, [a.id]);
    });
    if (b.intention) await setIntention(a.id, b.intention, b.duration);
    return { ok: true, profile: await ownProfile(a.id) };
  });

  app.get('/api/profile/me', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true, allowSuspended: true });
    return { profile: await ownProfile(a.id), photos: await ownPhotos(a.id) };
  });

  app.patch('/api/profile', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    const b = body(
      req,
      z.object({
        name: z.string().max(60).optional(),
        age: z.number().int().min(0).max(130).nullable().optional(),
        traits: z.array(z.number().int()).optional(),
        gender: z
          .object({ category: z.string().nullable(), text: z.string().max(80).nullable(), visible: z.boolean() })
          .optional(),
        seeGroups: z.array(z.string()).optional(),
        freeText: z.string().optional(),
        responseRate: z.boolean().optional(),
        settings: z
          .object({
            sort: z.enum(['naehe', 'antwortquote', 'neu', 'absicht']).optional(),
            mediaReceive: z.enum(['nach_antwort', 'bestaetigung', 'immer']).optional(),
            disappearingDefault: z.boolean().optional(),
            pushEnabled: z.boolean().optional(),
            pushPreview: z.boolean().optional(),
            quietFrom: z.number().int().min(0).max(23).optional(),
            quietTo: z.number().int().min(0).max(23).optional(),
            checkinEffect: z.enum(['nichts', 'benachrichtigen']).optional(),
          })
          .optional(),
      }),
    );
    const sets: string[] = [];
    const vals: unknown[] = [a.id];
    const set = (col: string, v: unknown) => {
      vals.push(v);
      sets.push(`${col} = $${vals.length}`);
    };
    let hint: string | null = null;

    if (b.name !== undefined) {
      if (!validName(b.name, p('P-NAME-MAX'))) throw bad('UI-NAME-UNGUELTIG', { max: p('P-NAME-MAX') }, 'name');
      set('name', b.name.trim());
    }
    if (b.age !== undefined) {
      if (b.age !== null && b.age < 18) {
        // AK-PG-03: nichts speichern, weitere Nutzung erst nach bestandener Altersprüfung
        await q(`UPDATE accounts SET age_gate_required = true WHERE id = $1 AND age1_at IS NULL`, [a.id]);
        throw new AppError(403, 'UI-ALTER-UNTER-18', {}, 'alter_unter_18');
      }
      set('age', b.age);
      set('age_set_at', b.age === null ? null : new Date());
      set('age_prompted_at', null);
    }
    if (b.traits !== undefined) {
      const uniq = [...new Set(b.traits)];
      // AK-F15-01/02: nur Kennungen aus dem Katalog, höchstens P-MERKMALE-MAX
      if (uniq.some((t) => !TRAIT_IDS.has(t))) throw bad('UI-EINGABE-PRUEFEN', {}, 'merkmal');
      if (uniq.length > p('P-MERKMALE-MAX')) throw bad('UI-MERKMALE-MAX', { max: p('P-MERKMALE-MAX') }, 'merkmale_max');
      set('traits', uniq);
    }
    if (b.gender !== undefined) {
      if (b.gender.category && !GENDER_KEYS.has(b.gender.category)) throw bad('UI-EINGABE-PRUEFEN');
      set('gender_category', b.gender.category);
      set('gender_text', b.gender.text?.trim() || null);
      set('gender_visible', b.gender.visible);
    }
    if (b.seeGroups !== undefined) {
      // F17: nur Positivauswahl; leere Auswahl = alle
      if (b.seeGroups.some((g) => !GENDER_KEYS.has(g))) throw bad('UI-EINGABE-PRUEFEN');
      set('see_groups', [...new Set(b.seeGroups)]);
    }
    if (b.freeText !== undefined) {
      if ([...b.freeText].length > 400) throw bad('ST-FEH-64', { zahl: [...b.freeText].length }, 'freitext_lang');
      // FV-33: Hinweis, keine Sperre — gespeichert wird in jedem Fall
      const flagged = hasExclusionaryPhrase(b.freeText);
      set('free_text', b.freeText);
      set('free_text_flagged', flagged);
      if (flagged) hint = 'ST-FEH-62';
    }
    if (b.responseRate !== undefined) {
      set('response_rate_enabled', b.responseRate);
      // AK-X18-01: gewählte Sortierung „Antwortquote“ fällt auf „Nähe“ zurück
      if (!b.responseRate) sets.push(`sort_mode = CASE WHEN sort_mode = 'antwortquote' THEN 'naehe' ELSE sort_mode END`);
    }
    const s = b.settings;
    if (s) {
      if (s.sort === 'antwortquote') {
        const cur = await one(`SELECT response_rate_enabled FROM profiles WHERE account_id = $1`, [a.id]);
        const enabled = b.responseRate ?? cur?.response_rate_enabled;
        if (!enabled) throw bad('UI-SORT-AQ-AUS', {}, 'sortierung'); // AK-F24-06
      }
      if (s.sort) set('sort_mode', s.sort);
      if (s.mediaReceive) set('media_receive', s.mediaReceive);
      if (s.disappearingDefault !== undefined) set('disappearing_default', s.disappearingDefault);
      if (s.pushEnabled !== undefined) set('push_enabled', s.pushEnabled);
      if (s.pushPreview !== undefined) set('push_preview', s.pushPreview);
      if (s.quietFrom !== undefined) set('quiet_from', s.quietFrom);
      if (s.quietTo !== undefined) set('quiet_to', s.quietTo);
      if (s.checkinEffect) set('checkin_effect', s.checkinEffect);
    }
    if (sets.length) await q(`UPDATE profiles SET ${sets.join(', ')}, updated_at = now() WHERE account_id = $1`, vals);
    if (s?.mediaReceive === 'immer') {
      // FV-96: läuft eine Anfrage und die Person stellt auf „Immer“, werden die wartenden Bilder zugestellt
      const { releaseHeldImages } = await import('./chat.js');
      await releaseHeldImages(a.id);
    }
    return { ok: true, hint, profile: await ownProfile(a.id) };
  });

  app.post('/api/profile/age-confirm', async (req) => {
    const a = await requireMember(req);
    await q(`UPDATE profiles SET age_prompted_at = now() WHERE account_id = $1`, [a.id]);
    return { ok: true };
  });

  app.put('/api/profile/intention', async (req) => {
    const a = await requireMember(req);
    const b = body(req, z.object({ key: intentionKey.nullable(), duration: durationKey.optional() }));
    const end = await setIntention(a.id, b.key, b.duration);
    emit(a.id, 'profil', {});
    return { ok: true, expiresAt: end };
  });

  // Erneuerung über die wischbare Leiste: die zuletzt gewählte Absicht mit neuem Fenster
  app.post('/api/profile/intention/renew', async (req) => {
    const a = await requireMember(req);
    const r = await one(`SELECT last_intention, last_intention_duration FROM profiles WHERE account_id = $1`, [a.id]);
    if (!r?.last_intention) throw bad('UI-EINGABE-PRUEFEN');
    const dur = allowedDurations(r.last_intention).includes(r.last_intention_duration) ? r.last_intention_duration : undefined;
    await setIntention(a.id, r.last_intention, dur);
    return { ok: true };
  });

  // Wegwischen: bleibt „Offen“, Leiste erscheint zu diesem Ablauf nicht mehr (AK-F14-03)
  app.post('/api/profile/intention/dismiss', async (req) => {
    const a = await requireMember(req);
    await q(`UPDATE profiles SET renewal_dismissed_until = now() WHERE account_id = $1`, [a.id]);
    return { ok: true };
  });

  app.get('/api/profile/intentions', async () => ({
    intentions: INTENTIONS.map((i) => ({ key: i.key, textId: i.textId, default: i.default, durations: allowedDurations(i.key) })),
  }));

  // Fremdes Profil (S20)
  app.get('/api/profiles/:id', async (req) => {
    const a = await requireMember(req);
    const { id } = params(req, idParam);
    const viewer = await viewerFor(a.id);
    const view = await profileView(viewer, id);
    // „Dieses Profil gibt es nicht mehr.“ — Blockierung, Löschung, Sperre sehen gleich aus
    if (!view) throw notFound();
    const bookmarked = !!(await one(`SELECT 1 FROM bookmarks WHERE owner_id = $1 AND target_id = $2`, [a.id, id]));
    return { profile: { ...view, bookmarked } };
  });

  // Merkliste (F21) — privat, ohne Benachrichtigung
  app.get('/api/bookmarks', async (req) => {
    const a = await requireMember(req);
    const viewer = await viewerFor(a.id);
    const rows = await q(
      `SELECT ${CARD_COLUMNS} FROM bookmarks bm
         JOIN accounts a ON a.id = bm.target_id
         JOIN profiles pr ON pr.account_id = a.id
         LEFT JOIN locations l ON l.account_id = a.id
        WHERE bm.owner_id = $1 AND ${VISIBLE_SQL}
        ORDER BY bm.created_at DESC`,
      [a.id],
    );
    // AK-F21-03: dieselben Regeln wie im Raster — Bänder statt genauer Werte
    return { tiles: rows.map((r) => toTile(r, viewer)) };
  });

  app.post('/api/bookmarks/:id', async (req) => {
    const a = await requireMember(req);
    const { id } = params(req, idParam);
    const viewer = await viewerFor(a.id);
    if (!(await profileView(viewer, id))) throw notFound();
    const first = !(await one(`SELECT 1 FROM bookmarks WHERE owner_id = $1 LIMIT 1`, [a.id]));
    await q(`INSERT INTO bookmarks (owner_id, target_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [a.id, id]);
    return { ok: true, firstTime: first };
  });

  app.delete('/api/bookmarks/:id', async (req) => {
    const a = await requireMember(req);
    const { id } = params(req, idParam);
    await q(`DELETE FROM bookmarks WHERE owner_id = $1 AND target_id = $2`, [a.id, id]);
    return { ok: true };
  });
}
