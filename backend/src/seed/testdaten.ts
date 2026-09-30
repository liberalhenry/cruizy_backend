/**
 * Erfundene Testdaten für den Testbetrieb (AK-M02-11: nur erfundene Daten).
 * Läuft ausschließlich bei OPERATION_MODE=test. Alle Zeilen tragen is_test_data.
 *
 *   npm run seed:test            legt 40 Testkonten rund um Köln an, dazu Orte und Termine
 *                                und die empfohlene „Cruizy Test-Party“ in Hamburg (Issue #16).
 *                                Issue #34: alle Profile vollständig (4 Fotos, Text, Maße, Körpertyp,
 *                                Position, Interessen, Absicht, Fotoprüfung) — auch bei schon
 *                                vorhandenen Testkonten; test4 … test40 haben ein fertiges Cruizy-Date-
 *                                Profil, test1 … test3 nicht (zum Ausprobieren des Onboardings).
 *   npm run seed:test -- --clear löscht alle Testdaten wieder
 *
 * Anmeldung: test1@example.invalid … test40@example.invalid, Passwort aus
 * SEED_PASSWORD (Vorgabe: testpasswort-123).
 */
import { randomInt } from 'node:crypto';
import sharp from 'sharp';
import { env } from '../config/env.js';
import { p, setOverrides } from '../config/params.js';
import { closeDb, one, q } from '../db/pool.js';
import { migrate } from '../db/migrate.js';
import { blindIndex, encStr, hashPassword, normalizeEmail } from '../lib/crypto.js';
import { putFile } from '../lib/files.js';
import { prepare } from '../lib/images.js';
import { TRAIT_IDS } from '../services/catalogs.js';
import { computeExpiry } from '../services/intentions.js';
import { approvePhoto } from '../services/photo-chain.js';
import { acceptPosition } from '../modules/location.js';
import { CONSENT_PURPOSE, CONSENT_VERSION } from '../modules/auth.js';
import { CONTRACT_VARIANT, CONTRACT_VERSION } from '../modules/verification.js';
import { deleteAccountNow } from '../services/deletion.js';
import { clearTestEvents, seedTestEvents } from './veranstaltungen.js';
import { seedDateLikes, seedDateMember } from './date.js';

const NAMES = ['Alex', 'Ben', 'Can', 'Dario', 'Eli', 'Finn', 'Gabriel', 'Hakan', 'Ilias', 'Jonas', 'Kai', 'Luca', 'Mika', 'Noah', 'Oskar', 'Paul', 'Quentin', 'Rafael', 'Sami', 'Tom', 'Umut', 'Vince', 'Wim', 'Xaver', 'Yusuf', 'Zeno', 'Arne', 'Bastian', 'Cem', 'David', 'Emil', 'Felix', 'Gino', 'Henrik', 'Ivo', 'Jan', 'Kilian', 'Levin', 'Malte', 'Nico'];
// Issue #34: jeder Text hat mindestens 50 Zeichen (zählt so zur Profil-Vollständigkeit)
const TEXTS = [
  'Neu in der Stadt und offen für einen Kaffee. Erzähl mir, wo es das beste Frühstück gibt.',
  'Gern ein Bier am Abend, gern auch einfach schreiben. Ich antworte meistens schneller als gedacht.',
  'Laufe viel am Rhein. Frag mich nach Podcasts — ich habe zu jedem Thema eine Empfehlung.',
  'Tagsüber im Büro, abends lieber draußen. Suche Leute für Konzerte und spontane Ausflüge.',
  'Koche gerne, suche Leute für Spieleabende. Verlieren kann ich übrigens nicht besonders gut.',
  'Kurz hier, lange Gespräche mag ich trotzdem. Ehrlich, direkt und immer für einen Witz zu haben.',
];
const POSITION_KEYS = ['top', 'vers_top', 'vers', 'vers_bottom', 'bottom', 'keine_penetration'];
const BODY_KEYS = ['schlank', 'durchschnitt', 'jock', 'otter', 'bear', 'muscle', 'daddy', 'twunk', 'kraeftig', 'geek'];
const KINK_KEYS = ['sportswear', 'leder', 'kuscheln', 'massage', 'vanilla', 'sneaker', 'switch', 'rollenspiel'];
const PHOTOS_PER_PROFILE = 4;
const INTENTIONS = ['abend', 'schreiben', 'absicht3', 'absicht4'] as const;

const CENTER = { lat: 50.9375, lng: 6.9603 };

function jitter(km: number) {
  const r = Math.sqrt(Math.random()) * km;
  const a = Math.random() * 2 * Math.PI;
  return {
    lat: CENTER.lat + (r / 111.32) * Math.cos(a),
    lng: CENTER.lng + (r / (111.32 * Math.cos((CENTER.lat * Math.PI) / 180))) * Math.sin(a),
  };
}

/** Abstraktes Testbild — Farbverlauf, keine Person. */
async function testImage(seed: number): Promise<Buffer> {
  const hue = (seed * 47) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="945">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue},60%,55%)"/><stop offset="1" stop-color="hsl(${(hue + 80) % 360},55%,35%)"/>
    </linearGradient></defs>
    <rect width="720" height="945" fill="url(#g)"/>
    <circle cx="${200 + (seed * 37) % 320}" cy="${260 + (seed * 53) % 420}" r="${80 + (seed % 5) * 20}" fill="rgba(255,255,255,0.25)"/>
    <rect x="40" y="880" width="${120 + (seed % 7) * 40}" height="24" rx="12" fill="rgba(255,255,255,0.5)"/>
  </svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toBuffer();
}

/**
 * Issue #34: Profil vollständig — nur Leeres wird ergänzt, eigene Änderungen im Testbetrieb bleiben.
 * Fotos bis PHOTOS_PER_PROFILE, Fotoprüfung als erledigt (testdaten), Maße, Körpertyp, Position,
 * Interessen, Absicht, Text; Kinks bei jedem zweiten Konto (freiwillig, zählt nie zur Vollständigkeit).
 */
async function fillProfile(id: string, i: number) {
  const traitIds = [...TRAIT_IDS];
  const traits = [0, 5, 11, 17].map((o) => traitIds[(i * 7 + o) % traitIds.length]);
  const intention = INTENTIONS[i % INTENTIONS.length];
  const exp = computeExpiry(intention, undefined);
  await q(
    `UPDATE profiles SET
       photo_mode = 'photo',
       free_text = CASE WHEN char_length(coalesce(free_text, '')) < 50 THEN $2 ELSE free_text END,
       traits = CASE WHEN cardinality(traits) < 3 THEN $3::int[] ELSE traits END,
       gender_category = coalesce(gender_category, 'mann'),
       gender_visible = true,
       height_cm = coalesce(height_cm, $4),
       weight_kg = coalesce(weight_kg, $5),
       position = coalesce(position, $6),
       body_types = CASE WHEN cardinality(body_types) = 0 THEN $7::text[] ELSE body_types END,
       kinks = CASE WHEN cardinality(kinks) = 0 THEN $8::text[] ELSE kinks END,
       intention = coalesce(intention, $9),
       intention_started_at = CASE WHEN intention IS NULL THEN now() ELSE intention_started_at END,
       intention_expires_at = CASE WHEN intention IS NULL THEN $10 ELSE intention_expires_at END,
       last_intention = coalesce(last_intention, $9),
       last_intention_duration = coalesce(last_intention_duration, $11),
       response_rate_enabled = true,
       updated_at = now()
     WHERE account_id = $1`,
    [
      id,
      TEXTS[i % TEXTS.length],
      [...new Set(traits)],
      165 + ((i * 7) % 30),
      60 + ((i * 11) % 40),
      POSITION_KEYS[i % POSITION_KEYS.length],
      [BODY_KEYS[i % BODY_KEYS.length], ...(i % 3 === 0 ? [BODY_KEYS[(i + 4) % BODY_KEYS.length]] : [])],
      i % 2 === 0 ? [KINK_KEYS[i % KINK_KEYS.length], KINK_KEYS[(i + 3) % KINK_KEYS.length]] : [],
      intention,
      exp?.end ?? null,
      exp?.duration ?? null,
    ],
  );
  await q(`UPDATE accounts SET face_check_at = coalesce(face_check_at, now()) WHERE id = $1`, [id]);
  const have = await one(`SELECT count(*)::int AS n, coalesce(max(position), -1) AS pos FROM photos WHERE account_id = $1 AND status <> 'rejected'`, [id]);
  for (let k = have!.n; k < PHOTOS_PER_PROFILE; k++) {
    const img = await prepare(await testImage(i * 10 + k));
    const file = await putFile('zone1-original', img.data);
    const ph = await one(
      `INSERT INTO photos (account_id, position, status, blurred, original_file, width, height, hash_state) VALUES ($1, $2, 'checking', false, $3, $4, $5, 'pending') RETURNING id`,
      [id, have!.pos + 1 + (k - have!.n), file, img.width, img.height],
    );
    await approvePhoto(ph!.id, { by: 'testdaten', auto: true });
  }
}

async function clear() {
  const rows = await q(`SELECT id FROM accounts WHERE is_test_data`);
  for (const r of rows) await deleteAccountNow(r.id, { vault: false });
  await clearTestEvents();
  await q(`DELETE FROM places WHERE is_test_data`);
  console.log(`Testdaten entfernt (${rows.length} Konten).`);
}

async function seed() {
  const password = process.env.SEED_PASSWORD || 'testpasswort-123';
  const pwHash = await hashPassword(password);
  const colors = p('P-INITIALE-FARBEN') as readonly string[];
  const traitIds = [...TRAIT_IDS];
  let created = 0;
  const ids: string[] = [];
  let filled = 0;
  for (let i = 1; i <= 40; i++) {
    const email = normalizeEmail(`test${i}@example.invalid`);
    const exists = await one(`SELECT id FROM accounts WHERE email_hash = $1`, [blindIndex('email', email)]);
    if (exists) {
      // Issue #34: vorhandene Testkonten werden vervollständigt
      await fillProfile(exists.id, i);
      ids.push(exists.id);
      filled++;
      continue;
    }
    const acc = await one(
      `INSERT INTO accounts (status, primary_method, email_hash, email_enc, email_verified_at, password_hash, consented_at,
                             age1_at, age1_method, age1_ref, contract_version, contract_variant, contract_at,
                             last_active_at, first_visible_at, is_test_data, created_at)
       VALUES ('active', 'email', $1, $2, now(), $3, now(), now(), 'testdaten', 'seed', $4, $5, now(),
               now() - make_interval(mins => $6), now() - make_interval(days => $7), true, now() - make_interval(days => $7))
       RETURNING id`,
      [blindIndex('email', email), encStr('pii', email, 'email'), pwHash, CONTRACT_VERSION, CONTRACT_VARIANT, randomInt(0, 60 * 24 * 5), randomInt(0, 60)],
    );
    const id = acc!.id as string;
    await q(`INSERT INTO consents (account_id, purpose, text_version) VALUES ($1, $2, $3)`, [id, CONSENT_PURPOSE, CONSENT_VERSION]);
    const intention = INTENTIONS[i % INTENTIONS.length];
    const exp = intention ? computeExpiry(intention, undefined) : null;
    const traits = [...new Set(Array.from({ length: randomInt(0, 6) }, () => traitIds[randomInt(0, traitIds.length)]))];
    const withPhoto = true;
    await q(
      `INSERT INTO profiles (account_id, name, age, age_set_at, photo_mode, initial_color, intention, intention_started_at, intention_expires_at,
                             last_intention, last_intention_duration, traits, free_text, media_receive, response_band)
       VALUES ($1, $2, $3, now(), $4, $5, $6, CASE WHEN $6::text IS NULL THEN NULL ELSE now() END, $7, $6, $8, $9, $10, $11, $12)`,
      [
        id,
        NAMES[(i - 1) % NAMES.length],
        randomInt(19, 62),
        withPhoto ? 'photo' : 'initial',
        colors[i % colors.length],
        intention,
        exp?.end ?? null,
        exp?.duration ?? null,
        traits,
        TEXTS[i % TEXTS.length],
        p('P-BILD-EMPFANG'),
        [1, 2, 3, null][i % 4],
      ],
    );
    await q(`INSERT INTO locations (account_id, level) VALUES ($1, $2)`, [id, i % 4 === 0 ? 'nah' : 'grob']);
    await acceptPosition(id, jitter(i < 30 ? 6 : 40), { force: true });
    if (withPhoto) {
      const img = await prepare(await testImage(i));
      const file = await putFile('zone1-original', img.data);
      const ph = await one(
        `INSERT INTO photos (account_id, position, status, blurred, original_file, width, height, hash_state) VALUES ($1, 0, 'checking', $2, $3, $4, $5, 'pending') RETURNING id`,
        [id, i % 5 === 0, file, img.width, img.height],
      );
      await approvePhoto(ph!.id, { by: 'testdaten', auto: true });
    }
    await fillProfile(id, i);
    ids.push(id);
    created++;
  }

  // Issue #34: Cruizy-Date-Beispielnutzer (test4 … test40) und ein paar Likes
  let dateCreated = 0;
  for (let i = 4; i <= ids.length; i++) if (await seedDateMember(ids[i - 1], i, testImage)) dateCreated++;
  if (ids.length >= 12) {
    await seedDateLikes([
      [ids[9], ids[3], 'Dein Sonntag klingt nach meinem.'],
      [ids[10], ids[3], null],
      [ids[11], ids[3], 'Welcher Podcast zuerst?'],
      [ids[4], ids[5], 'Kaffee am Rhein?'],
      [ids[6], ids[4], null],
    ]);
  }

  const placeCount = await one(`SELECT count(*)::int AS n FROM places WHERE is_test_data`);
  if (!placeCount!.n) {
    const places = [
      ['Testbar Nord', 'bar', 'Agnesviertel', 50.9512, 6.9589, { mo: [], di: [['19:00', '01:00']], mi: [['19:00', '01:00']], do: [['19:00', '02:00']], fr: [['20:00', '04:00']], sa: [['20:00', '04:00']], so: [] }],
      ['Café Beispiel', 'cafe', 'Belgisches Viertel', 50.9381, 6.9312, { mo: [['09:00', '18:00']], di: [['09:00', '18:00']], mi: [['09:00', '18:00']], do: [['09:00', '18:00']], fr: [['09:00', '20:00']], sa: [['10:00', '20:00']], so: [['10:00', '17:00']] }],
      ['Club Muster', 'club', 'Innenstadt', 50.9344, 6.9571, { fr: [['23:00', '06:00']], sa: [['23:00', '07:00']] }],
      ['Beratungsstelle Probe', 'beratung', 'Altstadt-Süd', 50.9289, 6.9543, { mo: [['10:00', '16:00']], mi: [['10:00', '16:00']], do: [['14:00', '19:00']] }],
    ] as const;
    const ids: string[] = [];
    for (const [name, kind, district, lat, lng, hours] of places) {
      const r = await one(
        `INSERT INTO places (city_id, name, kind, district, lat, lng, opening_hours, description, source, source_fetched_at, is_test_data)
         VALUES ('koeln', $1, $2, $3, $4, $5, $6, 'Erfundener Ort für den Testbetrieb.', 'Testdaten', now()::date, true) RETURNING id`,
        [name, kind, district, lat, lng, JSON.stringify(hours)],
      );
      ids.push(r!.id);
    }
    const inDays = (d: number, h: number) => new Date(Date.now() + d * 86400_000 + h * 3600_000);
    await q(
      `INSERT INTO events (place_id, city_id, title, description, starts_at, ends_at, source, status, ampel, approved_at, is_test_data) VALUES
        ($1, 'koeln', 'Spieleabend (Test)', 'Brettspiele und Getränke.', $3, $4, 'Testdaten', 'approved', 'gruen', now(), true),
        ($2, 'koeln', 'Party (Test)', 'Erfundene Veranstaltung.', $5, $6, 'Testdaten', 'approved', 'gelb', now(), true)`,
      [ids[0], ids[2], inDays(1, 2), inDays(1, 6), inDays(3, 4), inDays(3, 10)],
    );
  }
  await seedTestEvents();
  console.log(
    `Testdaten angelegt: ${created} neue Konten, ${filled} vorhandene vervollständigt, ${dateCreated} Date-Profile. Anmeldung: test1@example.invalid … test40@example.invalid / ${password}`,
  );
}

async function main() {
  if (env().OPERATION_MODE !== 'test') throw new Error('Testdaten nur im Testbetrieb (OPERATION_MODE=test).');
  await migrate(() => {});
  setOverrides(await q(`SELECT key, value FROM parameters`));
  if (process.argv.includes('--clear')) await clear();
  else await seed();
}

main()
  .then(() => closeDb())
  .catch(async (e) => {
    console.error((e as Error).message);
    await closeDb().catch(() => {});
    process.exit(1);
  });
