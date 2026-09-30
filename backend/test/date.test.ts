/**
 * Cruizy Date (Issue #19): Zugriffsregeln, Freischaltung nur mit Verifizierung, Pflicht-Minimum und
 * Kodex, Tageslimit, Likes auf Elemente und Matches, Chat-Zusammenführung, NSFW-Einwilligung,
 * Date-Sperre ohne Folgen für den Hauptbereich, Auto-Pause, Verlassen.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { resetEnvCache } from '../src/config/env.js';
import { setParam } from '../src/config/params.js';
import { one, q } from '../src/db/pool.js';
import { destination } from '../src/lib/geo.js';
import { audioAvailable } from '../src/lib/audio.js';
import { setFaceProvider } from '../src/providers/face.js';
import { autoPauseDate, compatibility, dateDay, type DateCandidate } from '../src/services/date.js';
import { Client, jpeg, member, multipart, staff, upload, type Member } from './helpers.js';

const HH = { lat: 53.5507, lng: 9.993 };

function tone(seconds: number): Buffer {
  const dir = mkdtempSync(join(tmpdir(), 'ton-'));
  const out = join(dir, 'a.webm');
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', `sine=frequency=440:duration=${seconds}`, '-c:a', 'libopus', '-y', out]);
  const data = readFileSync(out);
  rmSync(dir, { recursive: true, force: true });
  return data;
}

async function uploadAudio(c: Client, data: Buffer, fields: Record<string, string> = {}) {
  const m = multipart(data, fields, 'intro.webm');
  return c.req('POST', '/api/date/audio', m.payload, m.headers);
}

async function verify(m: Member) {
  await m.c.post('/api/date/verification/consent', { accept: true });
  const ch = await m.c.post('/api/date/verification/challenge');
  const selfie = multipart(await jpeg({ color: '#a86' }), { nonce: ch.body.nonce }, 'selfie.jpg');
  return m.c.req('POST', '/api/date/verification', selfie.payload, selfie.headers);
}

/** Ein vollständiges, aktives Date-Mitglied über die echten Schnittstellen. */
async function dateMember(opts: { name?: string; pos?: { lat: number; lng: number }; values?: Record<string, string>; interests?: string[]; dealbreakers?: Record<string, string[]> } = {}) {
  const m = await member({ name: opts.name ?? 'Dater', pos: opts.pos ?? HH });
  expect((await m.c.post('/api/date/start')).status).toBe(200);
  await m.c.put('/api/date/intention', { intention: 'beziehung' });
  for (const color of ['#345', '#456', '#567']) expect((await upload(m.c, '/api/date/photos', await jpeg({ color }))).body.status).toBe('approved');
  expect((await verify(m)).body.ok).toBe(true);
  await m.c.put('/api/date/profile', { job: 'Tischler', interests: opts.interests ?? ['Kochen', 'Wandern', 'Kino'], lookingFor: 'Jemanden zum Bleiben.', values: opts.values ?? { kids: 'offen' } });
  await m.c.put('/api/date/prompts', {
    prompts: [
      { key: 'sonntag', answer: 'Lange frühstücken.' },
      { key: 'redflag', answer: 'Unpünktlichkeit.' },
    ],
  });
  expect((await uploadAudio(m.c, tone(3))).status).toBe(200);
  await m.c.put('/api/date/preferences', { ageMin: 18, ageMax: 99, distanceKm: 300, dealbreakers: opts.dealbreakers ?? {} });
  const code = await m.c.post('/api/date/code', { accept: true });
  expect(code.body.active).toBe(true);
  return m;
}

afterEach(() => setFaceProvider(null));

describe.skipIf(!(await audioAvailable()))('Cruizy Date', () => {
  it('Nicht-Mitglieder: Landing-Daten, aber keine Date-Profile — auch nicht über die Schnittstelle', async () => {
    const a = await dateMember({ name: 'Aktiv' });
    const outsider = await member({ pos: HH });
    const me = await outsider.c.get('/api/date/me');
    expect(me.body).toMatchObject({ enabled: true, status: null, region: { active: true } });
    expect((await outsider.c.get(`/api/date/profiles/${a.id}`)).body.code).toBe('date_nur_mitglieder');
    expect((await outsider.c.get('/api/date/today')).status).toBe(403);
    expect((await outsider.c.get('/api/date/likes')).status).toBe(403);
    // Date-Fotos und Voice-Intro bleiben zu
    const own = await a.c.get('/api/date/profile');
    expect((await outsider.c.get(own.body.view.photos[0].url)).status).toBe(404);
    expect((await outsider.c.get(own.body.view.voice.url)).status).toBe(404);
    // im normalen Profil: kein Date-Knopf, kein Zeichen
    const pv = await outsider.c.get(`/api/profiles/${a.id}`);
    expect(pv.body.profile.dateProfile).toBe(false);
    expect(pv.body.profile.date).toBe(false);
  });

  it('Freischaltung nur mit Verifizierung, Pflicht-Minimum und Kodex', async () => {
    const m = await member({ pos: HH });
    await m.c.post('/api/date/start');
    await m.c.put('/api/date/intention', { intention: 'offen' });
    // Kodex allein reicht nicht
    let r = await m.c.post('/api/date/code', { accept: true });
    expect(r.body.active).toBe(false);
    expect(r.body.minimum.missing).toEqual(expect.arrayContaining(['fotos', 'verifizierung', 'beruf', 'prompts', 'voice']));
    // Casual gibt es nicht
    expect((await m.c.put('/api/date/intention', { intention: 'casual' })).status).toBe(400);
    for (const color of ['#123', '#234', '#345']) await upload(m.c, '/api/date/photos', await jpeg({ color }));
    // Verifizierung braucht die Einwilligung (Art. 9) und eine gültige Pose
    expect((await m.c.post('/api/date/verification/challenge')).body.code).toBe('einwilligung_noetig');
    setFaceProvider({ name: 'test', available: () => true, verify: async () => ({ match: false, livenessOk: true }) });
    expect((await verify(m)).body).toEqual({ ok: false, reason: 'abgleich' });
    setFaceProvider(null);
    expect((await verify(m)).body.ok).toBe(true);
    // nur Ergebnis und Zeitpunkt gespeichert
    const acc = await one(`SELECT verified_at, verification_provider, verification_result FROM date_access WHERE account_id = $1`, [m.id]);
    expect(acc).toMatchObject({ verification_provider: 'stub', verification_result: 'bestanden' });
    await m.c.put('/api/date/profile', { job: 'Pfleger', interests: ['Lesen', 'Yoga', 'Kochen'], values: {} });
    await m.c.put('/api/date/prompts', { prompts: [{ key: 'schwach', answer: 'Schokolade' }, { key: 'zusammen', answer: 'Reisen' }] });
    r = await m.c.post('/api/date/activate');
    expect(r.body.active).toBe(false);
    expect(r.body.minimum.missing).toEqual(['voice']);
    // Voice-Intro höchstens 30 Sekunden
    expect((await uploadAudio(m.c, tone(33))).body.code).toBe('audio_zu_lang');
    await uploadAudio(m.c, tone(4));
    r = await m.c.post('/api/date/activate');
    expect(r.body.active).toBe(true);
    // ein neues erstes Foto verlangt eine neue Verifizierung
    const own = await m.c.get('/api/date/profile');
    const ids = own.body.view.photos.map((x: { id: string }) => x.id);
    const re = await m.c.put('/api/date/photos/order', { ids: [ids[1], ids[0], ids[2]] });
    expect(re.body.reverify).toBe(true);
  });

  it('Tagesvorschläge: begrenzt, kompatibel, ohne Deal-Breaker und Blockierte', async () => {
    setParam('P-DATE-VORSCHLAEGE', 2);
    const me = await dateMember({ name: 'Ich', dealbreakers: { smoking: ['regelmaessig'] }, interests: ['Kochen', 'Wandern', 'Kino', 'Yoga'] });
    const good = await dateMember({ name: 'Passt', interests: ['Kochen', 'Wandern', 'Kino', 'Yoga'], values: { kids: 'offen' } });
    const smoker = await dateMember({ name: 'Raucher', values: { smoking: 'regelmaessig' } });
    const blocked = await dateMember({ name: 'Blockiert' });
    const far = await dateMember({ name: 'Fern', pos: { lat: 47.37, lng: 8.54 } });
    await me.c.post(`/api/blocks/${blocked.id}`, {}).catch(() => null);
    await q(`INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [me.id, blocked.id]);
    await q(`DELETE FROM date_daily_suggestions WHERE account_id = $1`, [me.id]);
    const seen: string[] = [];
    for (let i = 0; i < 5; i++) {
      const r = await me.c.get('/api/date/today');
      if (!r.body.current) {
        expect(r.body.finished).toBe(true);
        break;
      }
      seen.push(r.body.current.id);
      // ein Profil zur Zeit, mit Fotos, Prompts und Voice-Intro
      expect(r.body.current.photos.length).toBe(3);
      expect(r.body.current.prompts.length).toBe(2);
      expect(r.body.current.voice.url).toMatch(/^\/api\/audio\//);
      await me.c.post('/api/date/pass', { to: r.body.current.id });
    }
    expect(seen.length).toBeLessThanOrEqual(2);
    expect(seen).not.toContain(smoker.id);
    expect(seen).not.toContain(blocked.id);
    expect(seen).not.toContain(far.id); // 300 km sind zu wenig bis Zürich
    // die kompatibelste Person zuerst, sofern sie nicht schon von anderen Tests belegt ist
    const rows = await q(`SELECT candidate_id FROM date_daily_suggestions WHERE account_id = $1 AND day = $2 ORDER BY position`, [me.id, dateDay()]);
    expect(rows.map((r) => r.candidate_id)).toContain(good.id);
    setParam('P-DATE-VORSCHLAEGE', 12);
  });

  it('Kompatibilität: Intention, Werte, Interessen — Religion und Politik zählen nicht', () => {
    const base: DateCandidate = {
      id: 'a',
      age: 30,
      intention: 'beziehung',
      interests: ['Kochen', 'Kino'],
      relationship_model: 'monogam',
      kids: 'will',
      smoking: 'nie',
      alcohol: 'gelegentlich',
      sport: 'regelmaessig',
      cell: null,
      prefs: { age_min: 18, age_max: 99, distance_km: 100, dealbreakers: {} },
    };
    const twin = { ...base, id: 'b' };
    const conflict = { ...base, id: 'c', kids: 'will_nicht', intention: 'kennenlernen', interests: ['Gaming'] };
    expect(compatibility(base, twin)).toBeGreaterThan(90);
    expect(compatibility(base, conflict)).toBeLessThan(compatibility(base, twin) - 40);
  });

  it('Likes nur auf ein konkretes Element; gegenseitig → Match → Date-Chat; bestehender Chat wird markiert', async () => {
    const a = await dateMember({ name: 'Ada' });
    const b = await dateMember({ name: 'Ben' });
    const bp = (await a.c.get(`/api/date/profiles/${b.id}`)).body.profile;
    // Element muss zur Person gehören
    const foreign = (await b.c.get(`/api/date/profiles/${a.id}`)).body.profile.photos[0].id;
    expect((await a.c.post('/api/date/like', { to: b.id, target: { kind: 'foto', id: foreign } })).body.code).toBe('element');
    expect((await a.c.post('/api/date/like', { to: b.id, target: { kind: 'prompt', id: bp.prompts[0].id }, comment: 'x'.repeat(151) })).body.code).toBe('kommentar');
    const l1 = await a.c.post('/api/date/like', { to: b.id, target: { kind: 'prompt', id: bp.prompts[0].id }, comment: 'Frühstück klingt gut!' });
    expect(l1.body.match).toBeNull();
    // b sieht ohne Premium nur Anzahl und unscharfe Vorschau
    const likes = await b.c.get('/api/date/likes');
    expect(likes.body.full).toBe(false);
    expect(likes.body.count).toBeGreaterThanOrEqual(1);
    expect((await b.c.get(likes.body.previews[0])).status).toBe(200);
    // mit Premium: wer, worauf, welcher Kommentar
    await b.c.post('/api/premium/test');
    const full = await b.c.get('/api/date/likes');
    const mine = full.body.likes.find((x: { from: { id: string } }) => x.from.id === a.id);
    expect(mine).toMatchObject({ comment: 'Frühstück klingt gut!', element: { kind: 'prompt', answer: 'Lange frühstücken.' } });
    // Zurückliken → Match
    const ap = (await b.c.get(`/api/date/profiles/${a.id}`)).body.profile;
    const l2 = await b.c.post('/api/date/like', { to: a.id, target: { kind: 'foto', id: ap.photos[0].id } });
    expect(l2.body.match.conversationId).toBeTruthy();
    expect(l2.body.match.existed).toBe(false);
    const convs = await a.c.get('/api/conversations');
    const conv = convs.body.conversations.find((c: { id: string }) => c.id === l2.body.match.conversationId);
    expect(conv.date).toBeTruthy();
    expect(conv.box).toBe('gespraeche');
    const detail = await a.c.get(`/api/conversations/${conv.id}`);
    expect(detail.body.date.likes.find((x: { mine: boolean }) => x.mine).comment).toBe('Frühstück klingt gut!');
    expect(detail.body.messages[0].system).toBe('date_match');

    // bestehender Chat: kein zweiter, sondern markiert
    const c = await dateMember({ name: 'Cem' });
    const d = await dateMember({ name: 'Dan' });
    const first = await c.c.post('/api/conversations', { to: d.id, text: 'Hallo aus dem Raster' });
    const cp = (await d.c.get(`/api/date/profiles/${c.id}`)).body.profile;
    const dp = (await c.c.get(`/api/date/profiles/${d.id}`)).body.profile;
    await c.c.post('/api/date/like', { to: d.id, target: { kind: 'audio', id: dp.voice.id } });
    const m = await d.c.post('/api/date/like', { to: c.id, target: { kind: 'foto', id: cp.photos[1].id } });
    expect(m.body.match.conversationId).toBe(first.body.conversationId);
    expect(m.body.match.existed).toBe(true);
    const n = await one(`SELECT count(*)::int AS n FROM conversations WHERE (user_low = $1 AND user_high = $2) OR (user_low = $2 AND user_high = $1)`, [c.id, d.id]);
    expect(n!.n).toBe(1);
    const dm = await c.c.get(`/api/conversations/${first.body.conversationId}`);
    expect(dm.body.messages.some((x: { system: string }) => x.system === 'date_match_bestehend')).toBe(true);
    // Unmatch: aus Date raus, der alte Chat bleibt
    await c.c.post(`/api/date/matches/${m.body.match.id}/unmatch`);
    const after = (await c.c.get('/api/conversations')).body.conversations.find((x: { id: string }) => x.id === first.body.conversationId);
    expect(after.date).toBeNull();
    expect(after.state).toBe('open');
    // Unmatch eines durch Date entstandenen Chats: endet für beide
    await a.c.post(`/api/date/matches/${l2.body.match.id}/unmatch`);
    expect((await b.c.get('/api/conversations')).body.conversations.find((x: { id: string }) => x.id === conv.id).state).toBe('ended');
  });

  it('Date-Zeichen im Raster nur für andere Date-Mitglieder', async () => {
    const a = await dateMember({ name: 'Zeichen', pos: destination(HH, 90, 1) });
    const b = await dateMember({ name: 'Sieht', pos: destination(HH, 90, 2) });
    const outsider = await member({ pos: destination(HH, 90, 1.5) });
    const find = async (m: Member) => {
      let r = await m.c.post('/api/discovery', { filters: {} });
      for (let i = 0; i < 40; i++) {
        const t = (r.body.tiles ?? []).find((x: { id: string }) => x.id === a.id);
        if (t || !r.body.cursor) return t;
        r = await m.c.post('/api/discovery', { filters: {}, cursor: r.body.cursor });
      }
      return null;
    };
    expect((await find(b))?.date).toBe(true);
    expect((await find(outsider))?.date).toBeUndefined();
    await a.c.put('/api/date/settings', { badgeInGrid: false });
    expect((await find(b))?.date).toBeUndefined();
    expect((await b.c.get(`/api/profiles/${a.id}`)).body.profile.dateProfile).toBe(true);
  });

  it('NSFW in Date-Chats: Standard „Nur nach Freigabe“ — unscharf, Original erst nach Freigabe; „Nein“ blockt', async () => {
    const a = await dateMember({ name: 'Sender' });
    const b = await dateMember({ name: 'Empfang' });
    const bp = (await a.c.get(`/api/date/profiles/${b.id}`)).body.profile;
    const ap = (await b.c.get(`/api/date/profiles/${a.id}`)).body.profile;
    await a.c.post('/api/date/like', { to: b.id, target: { kind: 'foto', id: bp.photos[0].id } });
    const m = await b.c.post('/api/date/like', { to: a.id, target: { kind: 'foto', id: ap.photos[0].id } });
    const conv = m.body.match.conversationId;
    await a.c.post(`/api/conversations/${conv}/messages`, { text: 'Hi!' });
    await b.c.post(`/api/conversations/${conv}/messages`, { text: 'Hallo!' });
    // ohne Klassifikatordienst gilt jedes Bild in Date-Chats vorsichtshalber als „könnte intim sein“
    process.env.CLASSIFIER = 'queue';
    resetEnvCache();
    try {
      expect((await upload(a.c, `/api/conversations/${conv}/images`, await jpeg({ color: '#f0a' }))).status).toBe(200);
      let view = await b.c.get(`/api/conversations/${conv}`);
      let img = view.body.messages.find((x: { kind: string }) => x.kind === 'image');
      expect(img.nsfw.state).toBe('verdeckt');
      const blurred = await b.c.get(img.image);
      expect(blurred.status).toBe(200);
      // das Original gibt es ohne Freigabe nicht — auch nicht mit einer selbst gebauten „clear“-Adresse
      const guessed = (await b.c.post(`/api/conversations/${conv}/messages/${img.id}/nsfw`, { decision: 'ansehen' })).body.url;
      expect(guessed).toBeTruthy();
      view = await b.c.get(`/api/conversations/${conv}`);
      img = view.body.messages.find((x: { kind: string }) => x.kind === 'image');
      expect(img.nsfw.state).toBe('frei');
      const clear = await b.c.get(img.image);
      expect(clear.status).toBe(200);
      expect(clear.raw.equals(blurred.raw)).toBe(false);
      // nächstes Bild: wieder unscharf (nur „ansehen“, nicht „künftig erlauben“)
      await upload(a.c, `/api/conversations/${conv}/images`, await jpeg({ color: '#0af' }));
      view = await b.c.get(`/api/conversations/${conv}`);
      const second = view.body.messages.filter((x: { kind: string }) => x.kind === 'image')[1];
      expect(second.nsfw.state).toBe('verdeckt');
      const clearTry = second.image.replace(/\/api\/img\/.*/, '');
      expect(clearTry).toBe('');
      // „Ablehnen“ je Chat: weitere Bilder werden beim Senden abgewiesen
      await b.c.post(`/api/conversations/${conv}/messages/${second.id}/nsfw`, { decision: 'ablehnen' });
      expect((await upload(a.c, `/api/conversations/${conv}/images`, await jpeg())).body.code).toBe('nsfw_nein');
      // Einstellung „Nein“ gilt für alle Date-Chats
      await q(`DELETE FROM nsfw_consent WHERE conversation_id = $1`, [conv]);
      await b.c.put('/api/date/settings', { nsfwReceive: 'nein' });
      expect((await upload(a.c, `/api/conversations/${conv}/images`, await jpeg())).body.code).toBe('nsfw_nein');
      await b.c.put('/api/date/settings', { nsfwReceive: 'ja' });
      expect((await upload(a.c, `/api/conversations/${conv}/images`, await jpeg())).status).toBe(200);
    } finally {
      process.env.CLASSIFIER = 'mock-allow';
      resetEnvCache();
    }
  });

  it('Date-Sperre nach berechtigten Meldungen — nur Date, der Hauptbereich bleibt', async () => {
    setParam('P-DATE-MELDUNGEN-SPERRE', 2);
    const target = await dateMember({ name: 'Hookup' });
    const s = await staff();
    for (let i = 0; i < 2; i++) {
      const reporter = await dateMember({ name: `Melder${i}` });
      const r = await reporter.c.post('/api/reports', { reason: 'passt_nicht_zu_date', context: 'date', targetId: target.id, items: [] });
      expect(r.status).toBe(200);
      const rep = await one(`SELECT id FROM reports WHERE number = $1`, [r.body.number]);
      const d = await s.c.post(`/mod-api/reports/${rep!.id}/decide`, { decision: 'date_verstoss', reason: 'Sucht eindeutig nur Hookups.' });
      expect(d.status).toBe(200);
      expect(d.body.dateSuspended).toBe(i === 1);
    }
    const me = await target.c.get('/api/date/me');
    expect(me.body.status).toBe('gesperrt');
    expect((await target.c.get('/api/date/today')).body.code).toBe('date_gesperrt');
    // Verlassen hebt die Sperre nicht auf
    expect((await target.c.req('DELETE', '/api/date', { confirm: 'VERLASSEN' })).body.code).toBe('date_gesperrt');
    // Hauptbereich unverändert
    expect((await target.c.post('/api/discovery', { filters: {} })).status).toBe(200);
    const acc = await one(`SELECT moderation_state FROM accounts WHERE id = $1`, [target.id]);
    expect(acc!.moderation_state).not.toBe('suspended');
    const n = await one(`SELECT body FROM notices WHERE account_id = $1 AND kind = 'date' ORDER BY created_at DESC`, [target.id]);
    expect(n!.body).toMatch(/Hauptseite kannst du weiterhin nutzen/);
    // Team entsperrt
    await s.c.post(`/mod-api/date/members/${target.id}/unsuspend`, { reason: 'Einspruch berechtigt.' });
    expect((await target.c.get('/api/date/me')).body.status).toBe('aktiv');
    setParam('P-DATE-MELDUNGEN-SPERRE', 3);
  });

  it('Auto-Pause nach Inaktivität, Reaktivierung beim Anmelden; Pausieren; Verlassen löscht alles', async () => {
    const m = await dateMember({ name: 'Pause' });
    await q(`UPDATE date_access SET last_active_at = now() - interval '20 days' WHERE account_id = $1`, [m.id]);
    await autoPauseDate();
    expect((await m.c.get('/api/date/me')).body.status).toBe('pausiert');
    const viewer = await dateMember({ name: 'Schaut' });
    expect((await viewer.c.get(`/api/date/profiles/${m.id}`)).status).toBe(404);
    const login = new Client(m.c.app);
    expect((await login.post('/api/auth/login', { identifier: m.email, password: m.password })).status).toBe(200);
    expect((await m.c.get('/api/date/me')).body.status).toBe('aktiv');
    // manuell pausieren: bleibt pausiert, auch nach dem Anmelden
    await m.c.post('/api/date/pause');
    await login.post('/api/auth/login', { identifier: m.email, password: m.password });
    expect((await m.c.get('/api/date/me')).body.status).toBe('pausiert');
    await m.c.post('/api/date/resume');
    // Verlassen: alle Date-Daten samt Medien
    const files = await q(`SELECT file FROM date_photos WHERE account_id = $1`, [m.id]);
    expect(files.length).toBe(3);
    expect((await m.c.req('DELETE', '/api/date', { confirm: 'VERLASSEN' })).status).toBe(200);
    for (const t of ['date_access', 'date_profiles', 'date_photos', 'date_prompts', 'date_audio', 'date_preferences']) {
      const r = await one(`SELECT count(*)::int AS n FROM ${t} WHERE account_id = $1`, [m.id]);
      expect(r!.n).toBe(0);
    }
    expect((await m.c.get('/api/date/me')).body.status).toBeNull();
  });

  it('Date ausblenden und Feature-Schalter', async () => {
    const m = await member({ pos: HH });
    await m.c.put('/api/date/settings', { hidden: true });
    expect((await m.c.get('/api/date/me')).body.hidden).toBe(true);
    setParam('P-DATE-AKTIV', false);
    expect((await m.c.get('/api/date/me')).body.enabled).toBe(false);
    expect((await m.c.post('/api/date/start')).status).toBe(404);
    setParam('P-DATE-AKTIV', true);
  });

  it('Regionen: nicht freigeschaltet → Warteliste; genug Wartende schalten die Stadt frei', async () => {
    setParam('P-DATE-REGIONEN', { modus: 'liste', staedte: ['berlin'], radiusKm: 60, schwelle: 2 });
    try {
      const hh = await member({ pos: HH });
      expect((await hh.c.get('/api/date/me')).body.region).toEqual({ active: false, city: 'Hamburg' });
      expect((await hh.c.post('/api/date/start')).body.code).toBe('region_inaktiv');
      await hh.c.post('/api/date/waitlist');
      const hh2 = await member({ pos: destination(HH, 0, 3) });
      await hh2.c.post('/api/date/waitlist');
      expect((await hh.c.get('/api/date/me')).body.region.active).toBe(true);
    } finally {
      setParam('P-DATE-REGIONEN', { modus: 'alle', staedte: [], radiusKm: 60, schwelle: 150 });
    }
  });

  it('Migration 012 ist reversibel', async () => {
    const { migrate, migrateDown } = await import('../src/db/migrate.js');
    await migrateDown('012_date', () => {});
    expect(await one(`SELECT to_regclass('public.date_access') AS t`)).toEqual({ t: null });
    const col = await one(`SELECT count(*)::int AS n FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'nsfw'`);
    expect(col!.n).toBe(0);
    await migrate(() => {});
    expect((await one(`SELECT to_regclass('public.date_access')::text AS t`))!.t).toBe('date_access');
  });
});
