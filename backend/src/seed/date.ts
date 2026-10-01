/**
 * Cruizy-Date-Beispielnutzer für die Entwicklung (Issue #34). Wird von testdaten.ts aufgerufen.
 *
 * Jedes Beispielkonto bekommt ein vollständiges, freigeschaltetes Date-Profil: Intention, drei
 * jugendfreie Testbilder (abstrakt, keine Person), Beruf, Interessen, Werte, drei Prompts, Voice-Intro
 * (ein kurzer Ton, falls ffmpeg da ist), Präferenzen, Kodex — und als „verifiziert (testdaten)“.
 * Dazu ein paar Likes, damit „Likes“ und Tagesvorschläge sofort etwas zeigen.
 */
import { p } from '../config/params.js';
import { one, q } from '../db/pool.js';
import { putFile } from '../lib/files.js';
import { audioAvailable, prepareAudio } from '../lib/audio.js';
import { prepare } from '../lib/images.js';
import { DATE_INTERESTS, DATE_PROMPTS } from '../services/catalogs.js';

const JOBS = [
  'Tischler', 'Pflegefachmann', 'Softwareentwickler', 'Grundschullehrer', 'Koch', 'Architekt', 'Physiotherapeut', 'Buchhändler',
  'Mediengestalter', 'Rettungssanitäter', 'Doktorand Biologie', 'Barista', 'Projektmanager', 'Erzieher', 'Fotograf', 'Elektriker',
];
const LOOKING = [
  'Jemanden zum Bleiben — mit dem man auch sonntags nichts vorhaben muss.',
  'Einen Mann, der Humor hat und auch mal zuhört.',
  'Etwas Ernsthaftes, gern langsam aufgebaut.',
  'Jemanden, mit dem ich Pläne schmieden und verwerfen kann.',
  'Neugier, Ehrlichkeit und gemeinsames Lachen.',
];
const ANSWERS: Record<string, string[]> = {
  sonntag: ['Lange frühstücken, dann ohne Ziel spazieren.', 'Flohmarkt am Rhein und abends Pasta.', 'Ausschlafen, Buch, Sauna.'],
  schwach: ['Frischem Brot und Käse.', 'Hunden, die mich anschauen.', 'Guter Livemusik.'],
  redflag: ['Unpünktlichkeit ohne Nachricht.', 'Wer nie nachfragt.', 'Unfreundlich zum Personal.'],
  duhastmich: ['… wenn du mir ein Lied empfiehlst, das ich nicht kenne.', '… wenn du mitkochst.', '… wenn du über dich selbst lachen kannst.'],
  zusammen: ['Eine Radtour an die Nordsee.', 'Einen Tanzkurs, obwohl wir beide nicht tanzen können.', 'Einen Garten anlegen.'],
  gluecklich: ['Sonne auf dem Balkon und ein Kaffee.', 'Zeit mit meinen Freunden.', 'Wenn etwas endlich funktioniert.'],
  freunde: ['… zuverlässig und ein bisschen chaotisch.', '… der, der immer Snacks dabei hat.', '… ehrlich, manchmal zu ehrlich.'],
  nichtverhandelbar: ['Respekt, auch wenn wir streiten.', 'Ehrlichkeit.', 'Zeit für Freunde.'],
  erstesdate: ['Spaziergang mit Kaffee zum Mitnehmen.', 'Museum und danach reden.', 'Kochen — wenn es schiefgeht, bestellen wir.'],
  zuletztgelernt: ['Sauerteig füttern.', 'Ein paar Sätze Portugiesisch.', 'Dass Pausen produktiv sind.'],
};
const MODELS = ['monogam', 'monogam', 'unsicher', 'offen', 'monogam', 'poly'];
const KIDS = ['offen', 'will', 'will_nicht', 'offen', 'hat'];
const SMOKING = ['nie', 'nie', 'gelegentlich', 'nie', 'regelmaessig'];
const ALCOHOL = ['gelegentlich', 'gern', 'nie', 'gelegentlich'];
const SPORT = ['regelmaessig', 'manchmal', 'selten', 'taeglich'];
const INTENTIONS = ['beziehung', 'kennenlernen', 'offen'];

/** Ein kurzer, leiser Ton als WAV — wird wie jede Aufnahme in AAC/MP4 umgewandelt. */
function toneWav(seconds: number, hz: number): Buffer {
  const rate = 16000;
  const n = Math.round(seconds * rate);
  const b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0);
  b.writeUInt32LE(36 + n * 2, 4);
  b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(rate, 24);
  b.writeUInt32LE(rate * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write('data', 36);
  b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.sin((2 * Math.PI * hz * i) / rate) * 6000 * Math.min(1, i / 800, (n - i) / 800)), 44 + i * 2);
  return b;
}

const pick = <T>(list: readonly T[], i: number) => list[i % list.length];

/**
 * Legt für ein Testkonto ein vollständiges Date-Profil an. Gibt false zurück, wenn es schon eines hat.
 * image(seed) liefert ein jugendfreies Testbild.
 */
export async function seedDateMember(accountId: string, i: number, image: (seed: number) => Promise<Buffer>): Promise<boolean> {
  const exists = await one(`SELECT 1 FROM date_access WHERE account_id = $1`, [accountId]);
  if (exists) return false;
  await q(
    `INSERT INTO date_access (account_id, status, step, intention, code_accepted_at, biometric_consent_at, verified_at,
                              verification_provider, verification_result, activated_at, last_active_at, created_at)
     VALUES ($1, 'aktiv', 'fertig', $2, now(), now(), now(), 'testdaten', 'bestanden', now(), now() - make_interval(hours => $3), now() - make_interval(days => $4))`,
    [accountId, pick(INTENTIONS, i), i % 30, 1 + (i % 20)],
  );
  const interests = [0, 7, 13, 19].map((o) => pick(DATE_INTERESTS, i * 3 + o));
  await q(
    `INSERT INTO date_profiles (account_id, job, interests, looking_for, relationship_model, kids, smoking, alcohol, sport)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [accountId, pick(JOBS, i), [...new Set(interests)], pick(LOOKING, i), pick(MODELS, i), pick(KIDS, i), pick(SMOKING, i), pick(ALCOHOL, i), pick(SPORT, i)],
  );
  const [, maxPhotos] = p('P-DATE-FOTOS') as readonly number[];
  for (let k = 0; k < Math.min(3, maxPhotos); k++) {
    const img = await prepare(await image(1000 + i * 7 + k));
    const file = await putFile('zone1-public', img.data);
    await q(`INSERT INTO date_photos (account_id, file, position, status, width, height, decided_at) VALUES ($1, $2, $3, 'approved', $4, $5, now())`, [
      accountId,
      file,
      k,
      img.width,
      img.height,
    ]);
  }
  for (let k = 0; k < 3; k++) {
    const prompt = pick(DATE_PROMPTS, i + k * 3);
    await q(`INSERT INTO date_prompts (account_id, prompt_key, answer, position) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`, [
      accountId,
      prompt.key,
      pick(ANSWERS[prompt.key] ?? ['Frag mich beim ersten Date.'], i),
      k,
    ]);
  }
  if (await audioAvailable()) {
    const audio = await prepareAudio(toneWav(3, 330 + (i % 8) * 40), { maxSeconds: p('P-DATE-VOICE-MAX'), maxMb: 5 }).catch(() => null);
    if (audio) {
      const file = await putFile('zone2', audio.data);
      await q(`INSERT INTO date_audio (account_id, kind, file, duration_ms) VALUES ($1, 'intro', $2, $3)`, [accountId, file, audio.durationMs]);
    }
  }
  await q(`INSERT INTO date_preferences (account_id, age_min, age_max, distance_km, dealbreakers) VALUES ($1, 18, 99, 150, '{}')`, [accountId]);
  return true;
}

/** Ein paar Likes unter den Beispielnutzern — mit Kommentar, auf das erste Foto. */
export async function seedDateLikes(pairs: [from: string, to: string, comment: string | null][]) {
  for (const [from, to, comment] of pairs) {
    const ph = await one(`SELECT id FROM date_photos WHERE account_id = $1 AND status = 'approved' ORDER BY position LIMIT 1`, [to]);
    if (!ph) continue;
    await q(
      `INSERT INTO date_likes (from_id, to_id, target_kind, target_id, comment) VALUES ($1, $2, 'foto', $3, $4) ON CONFLICT (from_id, to_id) DO NOTHING`,
      [from, to, ph.id, comment],
    );
  }
}
