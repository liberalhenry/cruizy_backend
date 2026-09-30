/**
 * Cruizy Date (Issue #19) — Schnittstellen. Ein Konto, zwei Bereiche; Date ergänzt, baut nichts um.
 *
 *  * Nicht-Mitglieder bekommen nur Landing-Informationen (Region, Warteliste) — nie Date-Profildaten.
 *  * Onboarding: Intention → Fotos → Gesichtsverifizierung (Anbieter, nur Ergebnis) → Profil
 *    (Beruf, Prompts, Voice-Intro, Interessen, Werte) → Präferenzen → Date-Kodex. Erst dann aktiv.
 *  * Likes nur auf ein konkretes Element (Foto, Prompt, Audio). Gegenseitiger Like → Match →
 *    Date-Chat im bestehenden Chatbereich (bestehende Gespräche werden markiert, nicht verdoppelt).
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { p } from '../config/params.js';
import { one, q, tx } from '../db/pool.js';
import { requireCleared, requireMember } from '../lib/context.js';
import { randomToken } from '../lib/crypto.js';
import { AppError, bad, conflict, notFound, tooMany } from '../lib/errors.js';
import { deleteFile, getFile, putFile } from '../lib/files.js';
import { body, idParam, params, uuid } from '../lib/http.js';
import { prepare } from '../lib/images.js';
import { prepareAudio } from '../lib/audio.js';
import { hit } from '../lib/rate.js';
import { classify, runHashCheck } from '../providers/checks.js';
import { faceProvider } from '../providers/face.js';
import { openManualReview } from '../services/manual-review.js';
import {
  DATE_DEALBREAKER_FIELDS,
  DATE_INTENTION_KEYS,
  DATE_INTENTIONS,
  DATE_INTERESTS,
  DATE_POSES,
  DATE_PROMPT_KEYS,
  DATE_PROMPTS,
  DATE_VALUE_KEYS,
  DATE_VALUES,
} from '../services/catalogs.js';
import {
  buildSuggestions,
  canSeeDateProfile,
  createMatch,
  dailyLimit,
  dateAccess,
  dateDay,
  dateEnabled,
  dateProfileView,
  endMatch,
  isActiveMember,
  likedElement,
  minimumState,
  premium,
  regionFor,
  requireActiveMember,
  tryActivate,
} from '../services/date.js';
import { imgUrl } from '../services/media-tokens.js';
import { openHashCase } from '../services/photo-chain.js';
import { initialOf } from '../services/profiles.js';
import { readUpload } from './photos.js';

const STEPS = ['intention', 'fotos', 'verifizierung', 'profil', 'praeferenzen', 'kodex', 'fertig'] as const;

/** Onboarding oder Bearbeiten: eigener Zugang, nicht gesperrt. */
async function ownAccess(accountId: string) {
  if (!dateEnabled()) throw new AppError(404, 'UI-NICHT-VERFUEGBAR', {}, 'date_aus');
  const acc = await dateAccess(accountId);
  if (!acc) throw new AppError(403, 'UI-DATE-NUR-MITGLIEDER', {}, 'date_nicht_gestartet');
  if (acc.status === 'gesperrt') throw new AppError(403, 'UI-DATE-GESPERRT', {}, 'date_gesperrt');
  return acc;
}

export async function setStep(accountId: string, step: (typeof STEPS)[number]) {
  // nur vorwärts — der Zwischenstand bleibt beim Zurückblättern erhalten
  const acc = await dateAccess(accountId);
  if (!acc || acc.status !== 'onboarding') return;
  if (STEPS.indexOf(step) > STEPS.indexOf(acc.step)) await q(`UPDATE date_access SET step = $2 WHERE account_id = $1`, [accountId, step]);
}

/** Neue Likes und Matches seit dem letzten Blick (Punkt am Date-Reiter). */
async function badges(accountId: string) {
  const r = await one(
    `SELECT (SELECT count(*)::int FROM date_likes l WHERE l.to_id = $1 AND l.created_at > coalesce(da.likes_seen_at, '-infinity')
               AND NOT EXISTS (SELECT 1 FROM date_likes b WHERE b.from_id = $1 AND b.to_id = l.from_id)) AS likes,
            (SELECT count(*)::int FROM date_matches m WHERE (m.user_low = $1 AND m.seen_low_at IS NULL OR m.user_high = $1 AND m.seen_high_at IS NULL) AND m.ended_at IS NULL) AS matches
       FROM date_access da WHERE da.account_id = $1`,
    [accountId],
  );
  return { likes: r?.likes ?? 0, matches: r?.matches ?? 0 };
}

const challenges = new Map<string, { pose: string; nonce: string; until: number }>();

export default async function dateRoutes(app: FastifyInstance) {
  /** Überblick: Region, Zugang, Pflicht-Minimum, Punkte — Landing ohne Profildaten. */
  app.get('/api/date/me', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    const hidden = (await one(`SELECT date_hidden FROM profiles WHERE account_id = $1`, [a.id]))?.date_hidden ?? false;
    if (!dateEnabled()) return { enabled: false, hidden };
    const acc = await dateAccess(a.id);
    const region = await regionFor(a.id);
    const waitlisted = !!(await one(`SELECT 1 FROM date_waitlist WHERE account_id = $1`, [a.id]));
    const out: Record<string, unknown> = {
      enabled: true,
      hidden,
      region: { active: region.active, city: region.city },
      waitlisted,
      status: acc?.status ?? null,
      catalog: {
        intentions: DATE_INTENTIONS,
        prompts: DATE_PROMPTS,
        interests: DATE_INTERESTS,
        values: DATE_VALUES,
        dealbreakerFields: DATE_DEALBREAKER_FIELDS,
        limits: {
          photos: p('P-DATE-FOTOS'),
          prompts: p('P-DATE-PROMPTS'),
          interests: p('P-DATE-INTERESSEN'),
          voiceMax: p('P-DATE-VOICE-MAX'),
          comment: p('P-DATE-KOMMENTAR'),
          lookingFor: p('P-DATE-SUCHE-TEXT'),
        },
      },
    };
    if (!acc) return out;
    if (acc.status === 'gesperrt') return { ...out, suspended: { at: acc.suspended_at } };
    return {
      ...out,
      step: acc.step,
      intention: acc.intention,
      verified: !!acc.verified_at,
      // ohne Anbieter: Selfie liegt beim Team
      verificationReview: acc.verification_result === 'team_prueft',
      verificationResult: acc.verification_result ?? null,
      biometricConsent: !!acc.biometric_consent_at,
      codeAccepted: !!acc.code_accepted_at,
      minimum: await minimumState(a.id),
      settings: { badgeInGrid: acc.badge_in_grid, nsfwReceive: acc.nsfw_receive, autoPaused: acc.auto_paused },
      badges: acc.status === 'aktiv' ? await badges(a.id) : { likes: 0, matches: 0 },
      premium: {
        likesSehen: await premium(a.id, 'likesSehen'),
        superLike: await premium(a.id, 'superLike'),
        zurueckholen: await premium(a.id, 'zurueckholen'),
        filter: await premium(a.id, 'filter'),
        mehrVorschlaege: await premium(a.id, 'mehrVorschlaege'),
      },
    };
  });

  app.post('/api/date/waitlist', async (req) => {
    const a = await requireMember(req);
    if (!dateEnabled()) throw notFound();
    const region = await regionFor(a.id);
    await q(`INSERT INTO date_waitlist (account_id, city_id) VALUES ($1, $2) ON CONFLICT (account_id) DO UPDATE SET city_id = EXCLUDED.city_id`, [a.id, region.cityId]);
    return { ok: true };
  });

  /** „Date freischalten“ — startet das Onboarding (nur in freigeschalteten Regionen, mit Altersprüfung). */
  app.post('/api/date/start', async (req) => {
    const a = await requireCleared(req);
    if (!dateEnabled()) throw notFound();
    const acc = await dateAccess(a.id);
    if (acc?.status === 'gesperrt') throw new AppError(403, 'UI-DATE-GESPERRT', {}, 'date_gesperrt');
    if (acc) return { ok: true, status: acc.status };
    if (!(await regionFor(a.id)).active) throw new AppError(409, 'UI-DATE-WARTELISTE', {}, 'region_inaktiv');
    await q(`INSERT INTO date_access (account_id) VALUES ($1) ON CONFLICT DO NOTHING`, [a.id]);
    await q(`INSERT INTO date_profiles (account_id) VALUES ($1) ON CONFLICT DO NOTHING`, [a.id]);
    await q(`INSERT INTO date_preferences (account_id) VALUES ($1) ON CONFLICT DO NOTHING`, [a.id]);
    await q(`DELETE FROM date_waitlist WHERE account_id = $1`, [a.id]);
    return { ok: true, status: 'onboarding' };
  });

  app.put('/api/date/intention', async (req) => {
    const a = await requireMember(req);
    await ownAccess(a.id);
    const b = body(req, z.object({ intention: z.string() }));
    if (!DATE_INTENTION_KEYS.has(b.intention)) throw bad('UI-EINGABE-PRUEFEN', {}, 'intention');
    await q(`UPDATE date_access SET intention = $2 WHERE account_id = $1`, [a.id, b.intention]);
    await setStep(a.id, 'fotos');
    return { ok: true };
  });

  // ───── Fotos (eigene Galerie, immer jugendfrei) ─────
  app.post('/api/date/photos', async (req) => {
    const a = await requireCleared(req);
    await ownAccess(a.id);
    if (!hit('upload', a.id, 30, 3600_000)) throw tooMany();
    const [, max] = p('P-DATE-FOTOS') as readonly number[];
    const n = await one(`SELECT count(*)::int AS n, coalesce(max(position), -1) + 1 AS pos FROM date_photos WHERE account_id = $1 AND status <> 'rejected'`, [a.id]);
    if (n!.n >= max) throw bad('UI-DATE-FOTOS-MAX', { max }, 'fotos_max');
    const { buffer } = await readUpload(req);
    const prepared = await prepare(buffer);
    const h = await runHashCheck(prepared.data);
    if (h.hit) {
      const tmp = await putFile('zone1-original', prepared.data);
      await openHashCase({ zone: 1, accountId: a.id, file: tmp, store: 'zone1-original', hash: h.hash, list: h.list ?? 'unbekannt' });
      throw new AppError(400, 'ST-FEH-33', {}, 'nicht_gesendet');
    }
    // Date-Profile bleiben jugendfrei: Klassifikator wie bei Profilfotos, Grauzone → Team, darüber abgelehnt
    const score = await classify(prepared.data);
    const status = score !== null && score > p('P-KLASS-OBEN') ? 'rejected' : score === null || score >= p('P-KLASS-UNTEN') ? 'queued' : 'approved';
    const file = await putFile('zone1-public', prepared.data);
    const r = await one(
      `INSERT INTO date_photos (account_id, file, position, status, width, height, decided_at) VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $4 <> 'queued' THEN now() END) RETURNING id`,
      [a.id, file, n!.pos, status, prepared.width, prepared.height],
    );
    if (status === 'rejected') await deleteFile('zone1-public', file);
    const m = await minimumState(a.id);
    if (m.items.fotos) await setStep(a.id, 'verifizierung');
    return { id: r!.id, status, url: status === 'rejected' ? null : imgUrl('date', r!.id, a.id) };
  });

  app.delete('/api/date/photos/:id', async (req) => {
    const a = await requireMember(req);
    await ownAccess(a.id);
    const { id } = params(req, idParam);
    const r = await one(`DELETE FROM date_photos WHERE id = $1 AND account_id = $2 RETURNING file, status`, [id, a.id]);
    if (!r) throw notFound();
    if (r.status !== 'rejected') await deleteFile('zone1-public', r.file);
    return { ok: true };
  });

  /** Reihenfolge (Drag & Drop). Das erste Foto ist das Referenzbild der Verifizierung. */
  app.put('/api/date/photos/order', async (req) => {
    const a = await requireMember(req);
    await ownAccess(a.id);
    const b = body(req, z.object({ ids: z.array(uuid).max(12) }));
    const firstBefore = await one(`SELECT id FROM date_photos WHERE account_id = $1 AND status <> 'rejected' ORDER BY position, created_at LIMIT 1`, [a.id]);
    await tx(async (cl) => {
      let i = 0;
      for (const id of b.ids) await cl.query(`UPDATE date_photos SET position = $3 WHERE id = $1 AND account_id = $2`, [id, a.id, i++]);
    });
    const firstAfter = await one(`SELECT id FROM date_photos WHERE account_id = $1 AND status <> 'rejected' ORDER BY position, created_at LIMIT 1`, [a.id]);
    // neues erstes Foto → neu verifizieren (erkennbares Gesicht, Abgleich mit dem Selfie)
    const reverify = firstBefore?.id !== firstAfter?.id;
    if (reverify) await q(`UPDATE date_access SET verified_at = NULL, verification_result = 'erstes_foto_geaendert' WHERE account_id = $1`, [a.id]);
    return { ok: true, reverify };
  });

  // ───── Gesichtsverifizierung ─────
  app.post('/api/date/verification/consent', async (req) => {
    const a = await requireMember(req);
    await ownAccess(a.id);
    body(req, z.object({ accept: z.literal(true) }));
    await q(`UPDATE date_access SET biometric_consent_at = now() WHERE account_id = $1`, [a.id]);
    return { ok: true };
  });

  app.post('/api/date/verification/challenge', async (req) => {
    const a = await requireMember(req);
    const acc = await ownAccess(a.id);
    if (!acc.biometric_consent_at) throw new AppError(409, 'UI-DATE-EINWILLIGUNG-NOETIG', {}, 'einwilligung_noetig');
    // ohne Anbieter prüft das Team — auch dann mit zufälliger Geste
    if (await one(`SELECT 1 FROM id_reviews WHERE account_id = $1 AND kind = 'date_face' AND decided_at IS NULL`, [a.id])) {
      throw new AppError(409, 'UI-TEAMPRUEFUNG-LAEUFT', {}, 'pruefung_laeuft');
    }
    const pose = DATE_POSES[Math.floor(Math.random() * DATE_POSES.length)];
    const nonce = randomToken(12);
    challenges.set(a.id, { pose: pose.key, nonce, until: Date.now() + p('P-DATE-POSE-GUELTIG') * 1000 });
    return { pose: pose.key, label: pose.label, nonce, expiresInS: p('P-DATE-POSE-GUELTIG') };
  });

  /** Selfie → Anbieter. Selfie und Referenz nur im Speicher; gespeichert wird nur das Ergebnis. */
  app.post('/api/date/verification', async (req) => {
    const a = await requireCleared(req);
    const acc = await ownAccess(a.id);
    if (!acc.biometric_consent_at) throw new AppError(409, 'UI-DATE-EINWILLIGUNG-NOETIG', {}, 'einwilligung_noetig');
    if (!hit('date-verify', a.id, 6, 3600_000)) throw tooMany();
    const { buffer, fields } = await readUpload(req);
    const ch = challenges.get(a.id);
    if (!ch || ch.nonce !== fields.nonce || ch.until < Date.now()) throw bad('UI-DATE-POSE-ABGELAUFEN', {}, 'pose_abgelaufen');
    challenges.delete(a.id);
    const ref = await one(`SELECT file FROM date_photos WHERE account_id = $1 AND status <> 'rejected' ORDER BY position, created_at LIMIT 1`, [a.id]);
    if (!ref) throw bad('UI-DATE-ERST-FOTOS', {}, 'fotos_fehlen');
    const provider = faceProvider();
    if (!provider.available()) {
      // Kein Anbieter: Das Team vergleicht Selfie und erstes Foto (Werkzeug → Bestätigen)
      const number = await openManualReview({
        kind: 'date_face',
        sessionId: null,
        accountId: a.id,
        images: [(await prepare(buffer)).data],
        pose: ch.pose,
        note: 'Selfie: passt es zum ersten Date-Foto, und ist die Geste zu sehen?',
      });
      await q(`UPDATE date_access SET verification_provider = 'team', verification_result = 'team_prueft' WHERE account_id = $1`, [a.id]);
      return { ok: false, review: true, number, hours: Math.round(p('P-AUSWEIS-FRIST') / 3600) };
    }
    let selfie: Buffer | null = (await prepare(buffer)).data;
    let reference: Buffer | null = await getFile('zone1-public', ref.file);
    let result;
    try {
      result = await provider.verify({ selfie, reference, pose: ch.pose });
    } catch {
      throw new AppError(503, 'UI-DATE-VERIFIZIERUNG-NICHT-VERFUEGBAR', {}, 'anbieter_fehler');
    } finally {
      // nichts bleibt liegen
      selfie = null;
      reference = null;
    }
    const ok = result.match && result.livenessOk;
    await q(
      `UPDATE date_access SET verified_at = CASE WHEN $2 THEN now() ELSE verified_at END, verification_provider = $3, verification_result = $4 WHERE account_id = $1`,
      [a.id, ok, provider.name, ok ? 'bestanden' : !result.livenessOk ? 'pose_nicht_erkannt' : 'kein_abgleich'],
    );
    if (ok) await setStep(a.id, 'profil');
    return { ok, reason: ok ? null : !result.livenessOk ? 'pose' : 'abgleich' };
  });

  // ───── Profil, Prompts, Audio, Präferenzen ─────
  app.get('/api/date/profile', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    await ownAccess(a.id);
    const raw = await one(`SELECT * FROM date_profiles WHERE account_id = $1`, [a.id]);
    const prefs = await one(`SELECT * FROM date_preferences WHERE account_id = $1`, [a.id]);
    return {
      view: await dateProfileView(a.id, a.id, { own: true }),
      raw: {
        job: raw?.job ?? '',
        employer: raw?.employer ?? '',
        interests: raw?.interests ?? [],
        lookingFor: raw?.looking_for ?? '',
        values: {
          relationship_model: raw?.relationship_model ?? null,
          kids: raw?.kids ?? null,
          smoking: raw?.smoking ?? null,
          alcohol: raw?.alcohol ?? null,
          sport: raw?.sport ?? null,
          religion: raw?.religion ?? null,
          politics: raw?.politics ?? null,
        },
      },
      preferences: prefs ? { ageMin: prefs.age_min, ageMax: prefs.age_max, distanceKm: prefs.distance_km, dealbreakers: prefs.dealbreakers } : null,
    };
  });

  app.put('/api/date/profile', async (req) => {
    const a = await requireMember(req);
    await ownAccess(a.id);
    const b = body(
      req,
      z.object({
        job: z.string().trim().min(2).max(80),
        employer: z.string().trim().max(80).nullable().optional(),
        interests: z.array(z.string().trim().min(2).max(30)),
        lookingFor: z.string().trim().max(2000).nullable().optional(),
        values: z.record(z.string(), z.string().nullable()).default({}),
      }),
    );
    const [minI, maxI] = p('P-DATE-INTERESSEN') as readonly number[];
    const interests = [...new Set(b.interests.map((x) => x.trim()))];
    if (interests.length < minI || interests.length > maxI) throw bad('UI-DATE-INTERESSEN-ANZAHL', { min: minI, max: maxI }, 'interessen');
    if (b.lookingFor && [...b.lookingFor].length > p('P-DATE-SUCHE-TEXT')) throw bad('UI-DATE-SUCHE-LANG', { zeichen: p('P-DATE-SUCHE-TEXT') }, 'text');
    const vals: Record<string, string | null> = {};
    for (const f of Object.keys(DATE_VALUES)) {
      const v = b.values[f] ?? null;
      if (v !== null && !DATE_VALUE_KEYS[f].has(v)) throw bad('UI-EINGABE-PRUEFEN', {}, 'wert');
      vals[f] = v;
    }
    await q(
      `INSERT INTO date_profiles (account_id, job, employer, interests, looking_for, relationship_model, kids, smoking, alcohol, sport, religion, politics, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())
       ON CONFLICT (account_id) DO UPDATE SET job = $2, employer = $3, interests = $4, looking_for = $5, relationship_model = $6, kids = $7,
         smoking = $8, alcohol = $9, sport = $10, religion = $11, politics = $12, updated_at = now()`,
      [a.id, b.job, b.employer || null, interests, b.lookingFor || null, vals.relationship_model, vals.kids, vals.smoking, vals.alcohol, vals.sport, vals.religion, vals.politics],
    );
    return { ok: true, minimum: await minimumState(a.id) };
  });

  app.put('/api/date/prompts', async (req) => {
    const a = await requireMember(req);
    await ownAccess(a.id);
    const b = body(req, z.object({ prompts: z.array(z.object({ key: z.string(), answer: z.string().trim().min(1).max(300) })) }));
    const [minP, maxP] = p('P-DATE-PROMPTS') as readonly number[];
    const keys = new Set(b.prompts.map((x) => x.key));
    if (keys.size !== b.prompts.length || b.prompts.some((x) => !DATE_PROMPT_KEYS.has(x.key))) throw bad('UI-EINGABE-PRUEFEN', {}, 'prompt');
    if (b.prompts.length < minP || b.prompts.length > maxP) throw bad('UI-DATE-PROMPTS-ANZAHL', { min: minP, max: maxP }, 'prompts');
    await tx(async (cl) => {
      // bestehende behalten, damit Likes auf einen Prompt erhalten bleiben
      await cl.query(`DELETE FROM date_prompts WHERE account_id = $1 AND NOT (prompt_key = ANY($2))`, [a.id, [...keys]]);
      let i = 0;
      for (const pr of b.prompts) {
        await cl.query(
          `INSERT INTO date_prompts (account_id, prompt_key, answer, position) VALUES ($1, $2, $3, $4)
           ON CONFLICT (account_id, prompt_key) DO UPDATE SET answer = EXCLUDED.answer, position = EXCLUDED.position`,
          [a.id, pr.key, pr.answer, i++],
        );
      }
    });
    return { ok: true, minimum: await minimumState(a.id) };
  });

  /** Voice-Intro (Pflicht) oder Audio-Prompt (freiwillig), höchstens P-DATE-VOICE-MAX Sekunden. */
  app.post('/api/date/audio', async (req) => {
    const a = await requireCleared(req);
    await ownAccess(a.id);
    if (!hit('upload', a.id, 30, 3600_000)) throw tooMany();
    const { buffer, fields } = await readUpload(req);
    const kind = fields.kind === 'prompt' ? 'prompt' : 'intro';
    const promptKey = kind === 'prompt' ? fields.promptKey : null;
    if (kind === 'prompt' && (!promptKey || !DATE_PROMPT_KEYS.has(promptKey))) throw bad('UI-EINGABE-PRUEFEN', {}, 'prompt');
    const audio = await prepareAudio(buffer, { maxSeconds: p('P-DATE-VOICE-MAX'), maxMb: 5 });
    const file = await putFile('zone2', audio.data);
    const old = await one(`SELECT file FROM date_audio WHERE account_id = $1 AND kind = $2`, [a.id, kind]);
    const r = await one(
      `INSERT INTO date_audio (account_id, kind, prompt_key, file, duration_ms) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (account_id, kind) DO UPDATE SET prompt_key = EXCLUDED.prompt_key, file = EXCLUDED.file, duration_ms = EXCLUDED.duration_ms, created_at = now()
       RETURNING id`,
      [a.id, kind, promptKey, file, audio.durationMs],
    );
    if (old) await deleteFile('zone2', old.file);
    return { id: r!.id, durationMs: audio.durationMs, minimum: await minimumState(a.id) };
  });

  app.delete('/api/date/audio/:kind', async (req) => {
    const a = await requireMember(req);
    await ownAccess(a.id);
    const { kind } = params(req, z.object({ kind: z.enum(['intro', 'prompt']) }));
    const r = await one(`DELETE FROM date_audio WHERE account_id = $1 AND kind = $2 RETURNING file`, [a.id, kind]);
    if (r) await deleteFile('zone2', r.file);
    return { ok: true };
  });

  app.put('/api/date/preferences', async (req) => {
    const a = await requireMember(req);
    await ownAccess(a.id);
    const b = body(
      req,
      z.object({
        ageMin: z.number().int().min(18).max(99),
        ageMax: z.number().int().min(18).max(99),
        distanceKm: z.number().int().min(5).max(1000),
        dealbreakers: z.record(z.string(), z.array(z.string()).max(4)).default({}),
      }),
    );
    if (b.ageMin > b.ageMax) throw bad('UI-EINGABE-PRUEFEN', {}, 'alter');
    const db: Record<string, string[]> = {};
    for (const [f, v] of Object.entries(b.dealbreakers)) {
      if (!(DATE_DEALBREAKER_FIELDS as readonly string[]).includes(f)) throw bad('UI-EINGABE-PRUEFEN', {}, 'dealbreaker');
      if (v.some((x) => !DATE_VALUE_KEYS[f].has(x))) throw bad('UI-EINGABE-PRUEFEN', {}, 'dealbreaker');
      if (v.length) db[f] = [...new Set(v)];
    }
    await q(
      `INSERT INTO date_preferences (account_id, age_min, age_max, distance_km, dealbreakers) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (account_id) DO UPDATE SET age_min = $2, age_max = $3, distance_km = $4, dealbreakers = $5`,
      [a.id, b.ageMin, b.ageMax, b.distanceKm, JSON.stringify(db)],
    );
    await setStep(a.id, 'kodex');
    return { ok: true };
  });

  /** Date-Kodex (Pflicht) — danach freischalten, sobald das Pflicht-Minimum erfüllt ist. */
  app.post('/api/date/code', async (req) => {
    const a = await requireCleared(req);
    await ownAccess(a.id);
    body(req, z.object({ accept: z.literal(true) }));
    await q(`UPDATE date_access SET code_accepted_at = coalesce(code_accepted_at, now()) WHERE account_id = $1`, [a.id]);
    const active = await tryActivate(a.id);
    const m = await minimumState(a.id);
    return { active, minimum: m };
  });

  /** Nach Änderungen im Profil: erneut prüfen (z. B. wenn das Minimum erst jetzt erfüllt ist). */
  app.post('/api/date/activate', async (req) => {
    const a = await requireCleared(req);
    await ownAccess(a.id);
    const active = await tryActivate(a.id);
    return { active, minimum: await minimumState(a.id) };
  });

  // ───── Heute: Tagesvorschläge ─────
  app.get('/api/date/today', async (req) => {
    const a = await requireMember(req);
    await requireActiveMember(a.id);
    const day = dateDay();
    await buildSuggestions(a.id, day);
    const rows = await q(`SELECT candidate_id, acted FROM date_daily_suggestions WHERE account_id = $1 AND day = $2 ORDER BY position`, [a.id, day]);
    const limit = await dailyLimit(a.id);
    let current = null;
    for (const r of rows) {
      if (r.acted) continue;
      // beim Anzeigen erneut prüfen: pausiert, gesperrt, blockiert → überspringen
      if (!(await canSeeDateProfile(a.id, r.candidate_id))) {
        await q(`UPDATE date_daily_suggestions SET acted = 'pass' WHERE account_id = $1 AND day = $2 AND candidate_id = $3`, [a.id, day, r.candidate_id]);
        continue;
      }
      const likedMe = await one(`SELECT comment FROM date_likes WHERE from_id = $1 AND to_id = $2`, [r.candidate_id, a.id]);
      current = { ...(await dateProfileView(r.candidate_id, a.id)), likedMe: !!likedMe };
      break;
    }
    const done = rows.filter((r) => r.acted).length;
    return { day, limit, total: rows.length, done, current, finished: !current };
  });

  app.get('/api/date/profiles/:id', async (req) => {
    const a = await requireMember(req);
    await requireActiveMember(a.id);
    const { id } = params(req, idParam);
    if (!(await canSeeDateProfile(a.id, id)) || !(await isActiveMember(id))) throw notFound();
    const view = await dateProfileView(id, a.id);
    if (!view || !view.photos.length) throw notFound();
    const myLike = await one(`SELECT 1 FROM date_likes WHERE from_id = $1 AND to_id = $2`, [a.id, id]);
    const match = await one(
      `SELECT id, conversation_id FROM date_matches WHERE user_low = LEAST($1::uuid, $2::uuid) AND user_high = GREATEST($1::uuid, $2::uuid) AND ended_at IS NULL`,
      [a.id, id],
    );
    return { profile: view, liked: !!myLike, match: match ? { id: match.id, conversationId: match.conversation_id } : null };
  });

  /** Like auf ein konkretes Element — optional mit Kommentar. Gegenseitig → Match. */
  app.post('/api/date/like', async (req) => {
    const a = await requireCleared(req);
    await requireActiveMember(a.id);
    const b = body(
      req,
      z.object({
        to: uuid,
        target: z.object({ kind: z.enum(['foto', 'prompt', 'audio']), id: uuid }),
        comment: z.string().trim().max(500).optional(),
        super: z.boolean().default(false),
      }),
    );
    if (b.to === a.id) throw bad('UI-EINGABE-PRUEFEN');
    if (b.comment && [...b.comment].length > p('P-DATE-KOMMENTAR')) throw bad('UI-DATE-KOMMENTAR-LANG', { zeichen: p('P-DATE-KOMMENTAR') }, 'kommentar');
    if (!hit('date-like', a.id, 200, 86400_000)) throw tooMany();
    if (!(await canSeeDateProfile(a.id, b.to)) || !(await isActiveMember(b.to))) throw notFound();
    if (b.super && !(await premium(a.id, 'superLike'))) throw new AppError(402, 'UI-DATE-PREMIUM', {}, 'premium');
    const table = { foto: `date_photos WHERE status = 'approved' AND`, prompt: 'date_prompts WHERE', audio: 'date_audio WHERE' }[b.target.kind];
    const el = await one(`SELECT 1 FROM ${table} id = $1 AND account_id = $2`, [b.target.id, b.to]);
    if (!el) throw bad('UI-DATE-ELEMENT-FEHLT', {}, 'element');
    const like = await one(
      `INSERT INTO date_likes (from_id, to_id, target_kind, target_id, comment, super) VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (from_id, to_id) DO NOTHING RETURNING id`,
      [a.id, b.to, b.target.kind, b.target.id, b.comment || null, b.super],
    );
    if (!like) throw conflict('UI-DATE-SCHON-GELIKT');
    await q(`UPDATE date_daily_suggestions SET acted = 'like' WHERE account_id = $1 AND day = $2 AND candidate_id = $3`, [a.id, dateDay(), b.to]);
    const back = await one(`SELECT id FROM date_likes WHERE from_id = $1 AND to_id = $2`, [b.to, a.id]);
    if (back) {
      const m = await createMatch(a.id, b.to, like.id, back.id);
      return { ok: true, match: { id: m.id, conversationId: m.conversationId, existed: m.existed } };
    }
    return { ok: true, match: null };
  });

  app.post('/api/date/pass', async (req) => {
    const a = await requireMember(req);
    await requireActiveMember(a.id);
    const b = body(req, z.object({ to: uuid }));
    await q(`INSERT INTO date_passes (from_id, to_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [a.id, b.to]);
    await q(`UPDATE date_daily_suggestions SET acted = 'pass' WHERE account_id = $1 AND day = $2 AND candidate_id = $3`, [a.id, dateDay(), b.to]);
    return { ok: true };
  });

  /** Premium: das zuletzt übersprungene Profil zurückholen. */
  app.post('/api/date/rewind', async (req) => {
    const a = await requireMember(req);
    await requireActiveMember(a.id);
    if (!(await premium(a.id, 'zurueckholen'))) throw new AppError(402, 'UI-DATE-PREMIUM', {}, 'premium');
    const last = await one(`SELECT to_id FROM date_passes WHERE from_id = $1 ORDER BY created_at DESC LIMIT 1`, [a.id]);
    if (!last) throw notFound();
    await q(`DELETE FROM date_passes WHERE from_id = $1 AND to_id = $2`, [a.id, last.to_id]);
    await q(`UPDATE date_daily_suggestions SET acted = NULL WHERE account_id = $1 AND day = $2 AND candidate_id = $3`, [a.id, dateDay(), last.to_id]);
    return { ok: true };
  });

  /** Likes: wer, worauf, mit welchem Kommentar. Ohne Premium nur Anzahl und unscharfe Vorschau. */
  app.get('/api/date/likes', async (req) => {
    const a = await requireMember(req);
    await requireActiveMember(a.id);
    await q(`UPDATE date_access SET likes_seen_at = now() WHERE account_id = $1`, [a.id]);
    const rows = await q(
      `SELECT l.*, pr.name, pr.age,
              (SELECT ph.id FROM date_photos ph WHERE ph.account_id = l.from_id AND ph.status = 'approved' ORDER BY ph.position, ph.created_at LIMIT 1) AS photo_id
         FROM date_likes l JOIN profiles pr ON pr.account_id = l.from_id
         JOIN date_access da ON da.account_id = l.from_id AND da.status = 'aktiv'
        WHERE l.to_id = $1 AND NOT EXISTS (SELECT 1 FROM date_likes b WHERE b.from_id = $1 AND b.to_id = l.from_id)
          AND NOT EXISTS (SELECT 1 FROM date_passes ps WHERE ps.from_id = $1 AND ps.to_id = l.from_id)
          AND NOT EXISTS (SELECT 1 FROM blocks b WHERE b.revoked_at IS NULL AND ((b.blocker_id = $1 AND b.blocked_id = l.from_id) OR (b.blocker_id = l.from_id AND b.blocked_id = $1)))
        ORDER BY l.super DESC, l.created_at DESC LIMIT 200`,
      [a.id],
    );
    const full = await premium(a.id, 'likesSehen');
    if (!full) {
      return {
        full: false,
        count: rows.length,
        previews: rows.slice(0, 6).map((r) => (r.photo_id ? imgUrl('date', r.photo_id, a.id, 'guest') : null)),
      };
    }
    const out = [];
    for (const r of rows) {
      out.push({
        likeId: r.id,
        from: { id: r.from_id, name: r.name, age: r.age, photo: r.photo_id ? imgUrl('date', r.photo_id, a.id) : null, initial: initialOf(r.name ?? '?') },
        element: await likedElement(r, a.id),
        comment: r.comment,
        super: r.super,
        at: r.created_at,
      });
    }
    return { full: true, count: rows.length, likes: out };
  });

  app.get('/api/date/matches', async (req) => {
    const a = await requireMember(req);
    await requireActiveMember(a.id);
    await q(
      `UPDATE date_matches SET seen_low_at = CASE WHEN user_low = $1 THEN coalesce(seen_low_at, now()) ELSE seen_low_at END,
              seen_high_at = CASE WHEN user_high = $1 THEN coalesce(seen_high_at, now()) ELSE seen_high_at END
        WHERE (user_low = $1 OR user_high = $1) AND ended_at IS NULL`,
      [a.id],
    );
    const rows = await q(
      `SELECT m.id, m.conversation_id, m.created_at, CASE WHEN m.user_low = $1 THEN m.user_high ELSE m.user_low END AS other_id
         FROM date_matches m WHERE (m.user_low = $1 OR m.user_high = $1) AND m.ended_at IS NULL ORDER BY m.created_at DESC`,
      [a.id],
    );
    const out = [];
    for (const r of rows) {
      const pr = await one(
        `SELECT pr.name, (SELECT ph.id FROM date_photos ph WHERE ph.account_id = pr.account_id AND ph.status = 'approved' ORDER BY ph.position LIMIT 1) AS photo_id
           FROM profiles pr WHERE pr.account_id = $1`,
        [r.other_id],
      );
      out.push({ id: r.id, conversationId: r.conversation_id, since: r.created_at, other: { id: r.other_id, name: pr?.name, photo: pr?.photo_id ? imgUrl('date', pr.photo_id, a.id) : null } });
    }
    return { matches: out };
  });

  app.post('/api/date/matches/:id/unmatch', async (req) => {
    const a = await requireMember(req);
    const { id } = params(req, idParam);
    if (!(await endMatch(id, a.id))) throw notFound();
    return { ok: true };
  });

  // ───── Einstellungen, Pause, Verlassen ─────
  app.put('/api/date/settings', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    const b = body(
      req,
      z.object({
        hidden: z.boolean().optional(),
        badgeInGrid: z.boolean().optional(),
        nsfwReceive: z.enum(['ja', 'nein', 'freigabe']).optional(),
      }),
    );
    if (b.hidden !== undefined) await q(`UPDATE profiles SET date_hidden = $2 WHERE account_id = $1`, [a.id, b.hidden]);
    if (b.badgeInGrid !== undefined) await q(`UPDATE date_access SET badge_in_grid = $2 WHERE account_id = $1`, [a.id, b.badgeInGrid]);
    if (b.nsfwReceive !== undefined) await q(`UPDATE date_access SET nsfw_receive = $2 WHERE account_id = $1`, [a.id, b.nsfwReceive]);
    return { ok: true };
  });

  app.post('/api/date/pause', async (req) => {
    const a = await requireMember(req);
    const r = await one(`UPDATE date_access SET status = 'pausiert', paused_at = now(), auto_paused = false WHERE account_id = $1 AND status = 'aktiv' RETURNING 1`, [a.id]);
    if (!r) throw notFound();
    return { ok: true };
  });

  app.post('/api/date/resume', async (req) => {
    const a = await requireMember(req);
    const r = await one(
      `UPDATE date_access SET status = 'aktiv', paused_at = NULL, auto_paused = false, last_active_at = now() WHERE account_id = $1 AND status = 'pausiert' RETURNING 1`,
      [a.id],
    );
    if (!r) throw notFound();
    return { ok: true };
  });

  /** „Date verlassen“: alle Date-Daten samt Medien löschen. Bestätigung mit dem Wort „VERLASSEN“. */
  app.delete('/api/date', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    const b = body(req, z.object({ confirm: z.literal('VERLASSEN') }));
    void b;
    const acc = await dateAccess(a.id);
    if (!acc) return { ok: true };
    // eine Date-Sperre lässt sich nicht durch Verlassen umgehen
    if (acc.status === 'gesperrt') throw new AppError(409, 'UI-DATE-GESPERRT', {}, 'date_gesperrt');
    await leaveDate(a.id);
    return { ok: true };
  });
}

/** Löscht alle Date-Daten eines Kontos (Verlassen, Kontolöschung). */
export async function leaveDate(accountId: string) {
  const ms = await q(`SELECT id FROM date_matches WHERE (user_low = $1 OR user_high = $1) AND ended_at IS NULL`, [accountId]);
  for (const m of ms) await endMatch(m.id, accountId);
  const photos = await q(`SELECT file, status FROM date_photos WHERE account_id = $1`, [accountId]);
  const audio = await q(`SELECT file FROM date_audio WHERE account_id = $1`, [accountId]);
  await tx(async (cl) => {
    for (const t of ['date_photos', 'date_prompts', 'date_audio', 'date_profiles', 'date_preferences', 'date_waitlist', 'date_access']) {
      await cl.query(`DELETE FROM ${t} WHERE account_id = $1`, [accountId]);
    }
    await cl.query(`DELETE FROM date_likes WHERE from_id = $1 OR to_id = $1`, [accountId]);
    await cl.query(`DELETE FROM date_passes WHERE from_id = $1 OR to_id = $1`, [accountId]);
    await cl.query(`DELETE FROM date_daily_suggestions WHERE account_id = $1 OR candidate_id = $1`, [accountId]);
    await cl.query(`DELETE FROM date_matches WHERE user_low = $1 OR user_high = $1`, [accountId]);
  });
  for (const ph of photos) if (ph.status !== 'rejected') await deleteFile('zone1-public', ph.file);
  for (const au of audio) await deleteFile('zone2', au.file);
}
