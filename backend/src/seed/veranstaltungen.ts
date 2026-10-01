/**
 * Testveranstaltungen (Issue #16/#17) — nur für die Entwicklung, alle Zeilen mit is_test_data.
 *  * „Cruizy Test-Party“ in Hamburg: von Cruizy selbst, empfohlen (oben), 400 Plätze, Testbilder.
 *  * Einige erfundene Veranstaltungen in anderen Städten, damit die Karte beim Herauszoomen
 *    (etwa von Hamburg Richtung München) Punkte zeigt.
 * Idempotent: legt nichts doppelt an.
 */
import sharp from 'sharp';
import { one, q } from '../db/pool.js';
import { deleteFile, putFile } from '../lib/files.js';
import { prepare } from '../lib/images.js';
import { mapPoint } from '../services/event-view.js';

/** Abstraktes Partybild: Farbverlauf, Lichtkegel, Kugeln — keine Personen, kein Text. */
async function partyImage(seed: number): Promise<Buffer> {
  const hue = (seed * 67 + 280) % 360;
  const beams = Array.from({ length: 6 }, (_, i) => {
    const x = 60 + i * 120 + (seed * 13) % 40;
    return `<polygon points="${x},0 ${x - 90},900 ${x + 90},900" fill="hsla(${(hue + i * 40) % 360},90%,70%,0.16)"/>`;
  }).join('');
  const dots = Array.from({ length: 40 }, (_, i) => {
    const cx = (i * 137 + seed * 31) % 900;
    const cy = (i * 71 + seed * 17) % 600;
    return `<circle cx="${cx}" cy="${cy}" r="${3 + (i % 5) * 2}" fill="hsla(${(hue + i * 9) % 360},100%,80%,0.6)"/>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue},70%,22%)"/><stop offset="1" stop-color="hsl(${(hue + 60) % 360},75%,12%)"/>
    </linearGradient>
    <radialGradient id="k" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff" stop-opacity="0.9"/><stop offset="1" stop-color="#ddd" stop-opacity="0.2"/></radialGradient></defs>
    <rect width="900" height="600" fill="url(#g)"/>${beams}${dots}
    <circle cx="450" cy="120" r="70" fill="url(#k)"/>
    <rect x="0" y="520" width="900" height="80" fill="rgba(0,0,0,0.35)"/>
  </svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toBuffer();
}

const inDays = (d: number, h: number) => {
  const x = new Date(Date.now() + d * 86400_000);
  x.setUTCHours(h, 0, 0, 0);
  return x;
};

export async function seedTestEvents(opts: { images?: boolean } = {}) {
  const exists = await one(`SELECT id FROM events WHERE source = 'cruizy' AND is_test_data`);
  if (exists) return exists.id as string;
  let org = await one(`SELECT id FROM organizers WHERE account_id IS NULL AND name = 'Cruizy'`);
  org ??= await one(
    `INSERT INTO organizers (name, kind, city, website, status, decided_at, is_test_data) VALUES ('Cruizy', 'agentur', 'Hamburg', NULL, 'verifiziert', now(), true) RETURNING id`,
  );
  const hh = { lat: 53.5511, lng: 9.9937 };
  const mp = mapPoint(hh, false);
  const party = await one(
    `INSERT INTO events (title, description, starts_at, ends_at, source, status, ampel, approved_at, checked_at, organizer_id, categories, capacity,
                         approval_required, cancel_until_hours, area, lat, lng, map_lat, map_lng, location_public, price, dress_code, featured, test_guests, is_test_data)
     VALUES ('Cruizy Test-Party Hamburg', $1, $2, $3, 'cruizy', 'approved', 'gruen', now(), now(), $4, '{party,club}', 400, false, 24, 'Hamburg',
             $5, $6, $7, $8, false, '12 € Abendkasse (Test)', 'Komm, wie du dich wohlfühlst', true, 137, true) RETURNING id`,
    [
      [
        'Das ist eine erfundene Veranstaltung für die Entwicklung — sie findet nicht statt.',
        '',
        'Was dich erwartet:',
        '• zwei Floors: House & Pop, dazu eine ruhige Lounge zum Reden',
        '• Awareness-Team die ganze Nacht, Garderobe, Wasser gratis',
        '• queere DJs aus Hamburg und Berlin',
        '',
        'Einlass ab 18. Bitte sag ab, wenn du doch nicht kommst — spätestens 24 Stunden vorher, dann bekommt jemand anderes deinen Platz.',
      ].join('\n'),
      inDays(12, 21),
      inDays(13, 5),
      org!.id,
      hh.lat,
      hh.lng,
      mp.lat,
      mp.lng,
    ],
  );
  if (opts.images !== false) {
    for (let i = 0; i < 3; i++) {
      const img = await prepare(await partyImage(i + 1));
      const file = await putFile('zone1-public', img.data);
      await q(`INSERT INTO event_images (event_id, file, position, width, height) VALUES ($1, $2, $3, $4, $5)`, [party!.id, file, i, img.width, img.height]);
    }
  }
  // weitere erfundene Veranstaltungen quer durch DACH (für Karte und „nah/bald“)
  const more: [string, string, number, number, string[], number, number, number | null][] = [
    ['Drag Brunch (Test)', 'München', 48.1374, 11.5755, ['essen', 'drag'], 5, 11, 60],
    ['Queerer Stammtisch (Test)', 'Berlin', 52.52, 13.405, ['stammtisch'], 2, 18, null],
    ['Open-Air-Konzert (Test)', 'Köln', 50.9375, 6.9603, ['konzert', 'festival'], 20, 17, 2000],
    ['Pride Warm-up (Test)', 'Wien', 48.2082, 16.3738, ['pride', 'party'], 30, 20, 500],
    ['Sonntagswanderung (Test)', 'Zürich', 47.3769, 8.5417, ['sport'], 9, 9, 25],
    ['Filmabend (Test)', 'Hamburg', 53.5586, 9.9646, ['kultur'], 1, 19, 40],
  ];
  for (const [title, area, lat, lng, cats, d, h, cap] of more) {
    const m = mapPoint({ lat, lng }, false);
    await q(
      `INSERT INTO events (title, description, starts_at, ends_at, source, status, ampel, approved_at, checked_at, categories, capacity, area, lat, lng, map_lat, map_lng, is_test_data)
       VALUES ($1, 'Erfundene Veranstaltung für die Entwicklung.', $2, $3, 'Testdaten', 'approved', 'gruen', now(), now(), $4, $5, $6, $7, $8, $9, $10, true)`,
      [title, inDays(d, h), inDays(d, h + 4), cats, cap, area, lat, lng, m.lat, m.lng],
    );
  }
  return party!.id as string;
}
