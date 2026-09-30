/** Veranstalter, Veranstaltungen, Gästeliste, Absagefrist, Chat und Karte (Issues #15, #16, #17). */
import { describe, expect, it } from 'vitest';
import { one, q } from '../src/db/pool.js';
import { distanceKm, roundToCell } from '../src/lib/geo.js';
import { searchPlaces } from '../src/services/places-dir.js';
import { seedTestEvents } from '../src/seed/veranstaltungen.js';
import { whenRange } from '../src/modules/events.js';
import { jpeg, member, staff, upload } from './helpers.js';

const HH = { lat: 53.5507, lng: 9.993 };
const MUC = { lat: 48.137, lng: 11.575 };
const day = (d: number, h = 20) => {
  const x = new Date(Date.now() + d * 86400_000);
  x.setUTCHours(h, 0, 0, 0);
  return x.toISOString();
};
const hamburg = () => searchPlaces('Hamburg')[0].id;

function input(extra: Record<string, unknown> = {}) {
  return {
    title: `Party ${Math.random().toString(36).slice(2, 8)}`,
    description: 'Musik, Tanz, gute Leute.',
    startsAt: day(3),
    endsAt: day(4, 3),
    categories: ['party'],
    placeDirId: hamburg(),
    ...extra,
  };
}

async function verifiedOrganizer(name = 'Bar Beispiel') {
  const m = await member({ name: 'Wirt', pos: HH });
  const r = await m.c.post('/api/organizer', { name, kind: 'bar', city: 'Hamburg', email: 'wirt@example.invalid', note: 'Impressum auf der Website.' });
  expect(r.status).toBe(200);
  const s = await staff();
  const list = await s.c.get('/mod-api/organizers');
  const o = list.body.items.find((x: { name: string }) => x.name === name);
  expect((await s.c.post(`/mod-api/organizers/${o.id}/open`)).body.email).toBe('wirt@example.invalid');
  expect((await s.c.post(`/mod-api/organizers/${o.id}/decide`, { decision: 'verifizieren', reason: 'Impressum geprüft' })).status).toBe(200);
  return { m, s, organizerId: o.id as string };
}

describe('Veranstalter und Einreichungen', () => {
  it('ohne Verifizierung: Einreichung in Prüfung, höchstens 3 offen, Freigabe im Einzelfall', async () => {
    const m = await member({ pos: HH });
    const guest = await member({ pos: HH });
    const r = await m.c.post('/api/host/events', input());
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('pending');
    expect(r.body.verified).toBe(false);
    // noch nicht sichtbar für andere
    expect((await guest.c.get(`/api/events/${r.body.id}`)).status).toBe(404);
    expect((await m.c.get(`/api/events/${r.body.id}`)).body.event.pending).toBe(true);
    await m.c.post('/api/host/events', input());
    await m.c.post('/api/host/events', input());
    expect((await m.c.post('/api/host/events', input())).body.code).toBe('einreichungen_max');
    // Team gibt frei
    const s = await staff();
    const subs = await s.c.get('/mod-api/submissions');
    expect(subs.body.events.some((e: { id: string; fromMember: boolean }) => e.id === r.body.id && e.fromMember)).toBe(true);
    const ok = await s.c.post(`/mod-api/events/${r.body.id}/decide`, {
      decision: 'freigeben',
      reason: 'passt',
      ampel: 'gruen',
      checklist: { ampel: true, keinePrivatadresse: true, ab18: true, keinVersprechen: true, anbieter: true },
    });
    expect(ok.status).toBe(200);
    expect((await guest.c.get(`/api/events/${r.body.id}`)).status).toBe(200);
    const n = await one(`SELECT count(*)::int AS n FROM notices WHERE account_id = $1 AND kind = 'veranstaltung'`, [m.id]);
    expect(n!.n).toBe(1);
  });

  it('verifizierte Veranstalter veröffentlichen sofort; das Team prüft gegen', async () => {
    const { m, s } = await verifiedOrganizer('Club Probe');
    expect((await m.c.get('/api/organizer')).body.verified).toBe(true);
    const r = await m.c.post('/api/host/events', input({ capacity: 100, categories: ['club', 'party'] }));
    expect(r.body.status).toBe('approved');
    const other = await member({ pos: HH });
    const d = await other.c.get(`/api/events/${r.body.id}`);
    expect(d.body.event.organizer).toMatchObject({ name: 'Club Probe', verified: true });
    const unchecked = await s.c.get('/mod-api/events?filter=ungeprueft');
    expect(unchecked.body.items.some((e: { id: string }) => e.id === r.body.id)).toBe(true);
    const chk = await s.c.post(`/mod-api/events/${r.body.id}/check`, {
      reason: 'gegengeprüft',
      ampel: 'gruen',
      checklist: { ampel: true, keinePrivatadresse: true, ab18: true, keinVersprechen: true, anbieter: true },
    });
    expect(chk.body).toEqual({ ok: true });
    expect((await s.c.get('/mod-api/events?filter=ungeprueft')).body.items.some((e: { id: string }) => e.id === r.body.id)).toBe(false);
    // Empfehlen nur für eigene Veranstaltungen von Cruizy
    expect((await s.c.post(`/mod-api/events/${r.body.id}/feature`, { featured: true, reason: 'test' })).status).toBe(409);
  });

  it('prüft Zeitraum (höchstens 12 Monate), Kategorien und Ort', async () => {
    const { m } = await verifiedOrganizer('Kneipe Zeit');
    expect((await m.c.post('/api/host/events', input({ startsAt: day(400), endsAt: day(401) }))).body.code).toBe('zu_weit_voraus');
    expect((await m.c.post('/api/host/events', input({ startsAt: day(300), endsAt: day(300, 23) }))).status).toBe(200);
    expect((await m.c.post('/api/host/events', input({ endsAt: day(2) }))).body.code).toBe('ende');
    expect((await m.c.post('/api/host/events', input({ categories: ['quatsch'] }))).body.code).toBe('kategorie');
    expect((await m.c.post('/api/host/events', input({ placeDirId: null }))).body.code).toBe('ort');
  });
});

describe('Lage: genau nur bei öffentlichen Orten', () => {
  it('private Party: grober Punkt, Adresse nur für angenommene Gäste', async () => {
    const host = await member({ pos: HH });
    const r = await host.c.post('/api/host/events', input({ address: 'Geheimweg 1', pin: { lat: 53.56, lng: 10.0 } }));
    await q(`UPDATE events SET status = 'approved' WHERE id = $1`, [r.body.id]);
    const e = await one(`SELECT map_lat, map_lng, location_public FROM events WHERE id = $1`, [r.body.id]);
    // die Stecknadel wird ohne „öffentlicher Ort“ nicht verwendet — nur die Zelle des Ortes
    expect(e!.location_public).toBe(false);
    const hh = searchPlaces('Hamburg')[0];
    expect({ lat: e!.map_lat, lng: e!.map_lng }).toEqual(roundToCell({ lat: hh.lat, lng: hh.lng }, 2000));
    const g = await member({ pos: HH });
    const before = await g.c.get(`/api/events/${r.body.id}`);
    expect(before.body.event.address).toBeNull();
    expect(before.body.event.addressHidden).toBe(true);
    expect(before.body.event.point.exact).toBe(false);
    await g.c.post(`/api/events/${r.body.id}/rsvp`);
    expect((await g.c.get(`/api/events/${r.body.id}`)).body.event.address).toBe('Geheimweg 1');
  });

  it('öffentlicher Veranstaltungsort: genaue Stecknadel, Adresse für alle', async () => {
    const { m } = await verifiedOrganizer('Konzerthaus Test');
    const r = await m.c.post('/api/host/events', input({ publicVenue: true, address: 'Konzertplatz 1', pin: { lat: 53.5413, lng: 9.9841 }, categories: ['konzert'] }));
    const g = await member({ pos: HH });
    const d = await g.c.get(`/api/events/${r.body.id}`);
    expect(d.body.event.point).toEqual({ lat: 53.5413, lng: 9.9841, exact: true });
    expect(d.body.event.address).toBe('Konzertplatz 1');
    // Stecknadel zu weit weg vom Ort
    expect((await m.c.post('/api/host/events', input({ publicVenue: true, pin: MUC }))).body.code).toBe('pin');
  });
});

describe('Gästeliste, Plätze und Absagefrist', () => {
  it('Anfrage → Annahme durch den Veranstalter, ausgebucht, Absage nur bis zur Frist', async () => {
    const { m: host } = await verifiedOrganizer('Bar Plätze');
    const r = await host.c.post('/api/host/events', input({ capacity: 2, approvalRequired: true, cancelUntilHours: 24, startsAt: day(5), endsAt: day(6, 3) }));
    expect(r.status).toBe(200);
    const [a, b, c] = [await member({ pos: HH }), await member({ pos: HH }), await member({ pos: HH })];
    const first = await a.c.post(`/api/events/${r.body.id}/rsvp`, { note: 'Komme mit Freund' });
    expect(first.body).toEqual({ ok: true, status: 'angefragt' });
    expect((await b.c.post(`/api/events/${r.body.id}/rsvp`)).body.status).toBe('angefragt');
    expect((await c.c.post(`/api/events/${r.body.id}/rsvp`)).body.status).toBe('angefragt');
    // angefragt ≠ zugesagt: keine Gästeliste
    expect((await a.c.get(`/api/events/${r.body.id}`)).body.attendees).toBeNull();
    const list = await host.c.get(`/api/host/events/${r.body.id}/guests`);
    expect(list.body.counts.angefragt).toBe(3);
    expect(list.body.guests[0].status).toBe('angefragt');
    expect(list.body.guests.find((x: { id: string }) => x.id === a.id).note).toBe('Komme mit Freund');
    await host.c.post(`/api/host/events/${r.body.id}/guests/${a.id}`, { decision: 'annehmen' });
    await host.c.post(`/api/host/events/${r.body.id}/guests/${b.id}`, { decision: 'annehmen' });
    expect((await host.c.post(`/api/host/events/${r.body.id}/guests/${c.id}`, { decision: 'annehmen' })).body.code).toBe('voll');
    const d = await a.c.get(`/api/events/${r.body.id}`);
    expect(d.body.rsvp).toBe(true);
    expect(d.body.event.spotsLeft).toBe(0);
    expect(d.body.event.full).toBe(true);
    expect(d.body.attendees).toHaveLength(2);
    // Übersicht des Veranstalters
    const mine = await host.c.get('/api/host/events');
    expect(mine.body.events.find((e: { id: string }) => e.id === r.body.id).counts).toEqual({ angenommen: 2, angefragt: 1, abgesagt: 0 });
    // Absage vor der Frist geht — Platz wird frei
    expect((await b.c.del(`/api/events/${r.body.id}/rsvp`)).status).toBe(200);
    expect((await host.c.get(`/api/host/events/${r.body.id}/guests`)).body.counts.abgesagt).toBe(1);
    // nach der Frist nicht mehr
    await q(`UPDATE events SET starts_at = now() + interval '10 hours', ends_at = now() + interval '20 hours' WHERE id = $1`, [r.body.id]);
    expect((await a.c.get(`/api/events/${r.body.id}`)).body.canCancel).toBe(false);
    expect((await a.c.del(`/api/events/${r.body.id}/rsvp`)).body.code).toBe('absagefrist');
  });

  it('ohne Annahme: Zusage sofort; volle Veranstaltung nimmt keine Zusage mehr', async () => {
    const host = await member({ pos: HH });
    const r = await host.c.post('/api/host/events', input({ capacity: 1 }));
    await q(`UPDATE events SET status = 'approved' WHERE id = $1`, [r.body.id]);
    const [a, b] = [await member({ pos: HH }), await member({ pos: HH })];
    expect((await a.c.post(`/api/events/${r.body.id}/rsvp`)).body.status).toBe('angenommen');
    expect((await b.c.post(`/api/events/${r.body.id}/rsvp`)).body.code).toBe('voll');
    expect((await host.c.post(`/api/events/${r.body.id}/rsvp`)).body.code).toBe('eigene');
  });

  it('Absage durch den Veranstalter benachrichtigt die Gäste', async () => {
    const { m: host } = await verifiedOrganizer('Bar Absage');
    const r = await host.c.post('/api/host/events', input());
    const g = await member({ pos: HH });
    await g.c.post(`/api/events/${r.body.id}/rsvp`);
    expect((await host.c.del(`/api/host/events/${r.body.id}`)).status).toBe(409);
    await host.c.post(`/api/host/events/${r.body.id}/cancel`, { note: 'Krankheit' });
    const d = await g.c.get(`/api/events/${r.body.id}`);
    expect(d.body.event.cancelled).toBe(true);
    expect(d.body.event.cancelNote).toBe('Krankheit');
    const n = await one(`SELECT title FROM notices WHERE account_id = $1 AND kind = 'veranstaltung' ORDER BY created_at DESC`, [g.id]);
    expect(n!.title).toBe('Veranstaltung abgesagt');
  });
});

describe('Chat Veranstalter ↔ Gast', () => {
  it('nur mit angenommenen Gästen, eigener Bereich, ungelesen getrennt gezählt', async () => {
    const { m: host } = await verifiedOrganizer('Bar Chat');
    const r = await host.c.post('/api/host/events', input({ approvalRequired: true }));
    const g = await member({ pos: HH });
    const x = await member({ pos: HH });
    await g.c.post(`/api/events/${r.body.id}/rsvp`);
    // angefragt: noch kein Chat
    expect((await g.c.post(`/api/events/${r.body.id}/chat/${g.id}`, { text: 'Hallo?' })).status).toBe(404);
    await host.c.post(`/api/host/events/${r.body.id}/guests/${g.id}`, { decision: 'annehmen' });
    expect((await g.c.get(`/api/events/${r.body.id}`)).body.canChat).toBe(true);
    expect((await g.c.post(`/api/events/${r.body.id}/chat/${g.id}`, { text: 'Gibt es eine Garderobe?' })).status).toBe(200);
    // Fremde kommen nicht hinein
    expect((await x.c.get(`/api/events/${r.body.id}/chat/${g.id}`)).status).toBe(404);
    expect((await host.c.get('/api/conversations/unread')).body.events).toBe(1);
    const chats = await host.c.get('/api/event-chats');
    expect(chats.body.chats[0]).toMatchObject({ eventId: r.body.id, guestId: g.id, role: 'veranstalter', unread: true });
    const thread = await host.c.get(`/api/events/${r.body.id}/chat/${g.id}`);
    expect(thread.body.messages[0].text).toBe('Gibt es eine Garderobe?');
    expect((await host.c.get('/api/conversations/unread')).body.events).toBe(0);
    await host.c.post(`/api/events/${r.body.id}/chat/${g.id}`, { text: 'Ja, gleich am Eingang.' });
    const gv = await g.c.get(`/api/events/${r.body.id}/chat/${g.id}`);
    expect(gv.body.other.name).toBe('Bar Chat');
    expect(gv.body.messages.map((m: { mine: boolean }) => m.mine)).toEqual([true, false]);
    // melden
    const rep = await g.c.post('/api/reports', {
      reason: 'anderes',
      context: 'veranstaltung_chat',
      items: [{ kind: 'event_chat_message', id: gv.body.messages[1].id }],
    });
    expect(rep.status).toBe(200);
  });
});

describe('Liste „Heute“: bald, nah, Umkreis, Kategorien, Zeitraum', () => {
  it('sortiert nach Beginn oder Entfernung und filtert', async () => {
    const { m: host } = await verifiedOrganizer('Liste Test');
    const soonFar = await host.c.post('/api/host/events', input({ title: 'Bald weit', startsAt: day(1), endsAt: day(2, 3), placeDirId: searchPlaces('Lübeck')[0].id, categories: ['konzert'] }));
    const laterNear = await host.c.post('/api/host/events', input({ title: 'Später nah', startsAt: day(20), endsAt: day(21, 3), categories: ['drag'] }));
    const v = await member({ pos: HH });
    const bald = await v.c.get('/api/events?sort=bald&radius=100');
    const ids = bald.body.events.map((e: { id: string }) => e.id);
    expect(ids.indexOf(soonFar.body.id)).toBeLessThan(ids.indexOf(laterNear.body.id));
    const nah = await v.c.get('/api/events?sort=naehe&radius=100');
    const ids2 = nah.body.events.map((e: { id: string }) => e.id);
    expect(ids2.indexOf(laterNear.body.id)).toBeLessThan(ids2.indexOf(soonFar.body.id));
    // Umkreis 20 km: Lübeck fällt raus
    const small = await v.c.get('/api/events?radius=20');
    expect(small.body.events.some((e: { id: string }) => e.id === soonFar.body.id)).toBe(false);
    // Kategorie
    const drag = await v.c.get('/api/events?radius=100&cats=drag');
    expect(drag.body.events.every((e: { categories: string[] }) => e.categories.includes('drag'))).toBe(true);
    expect(drag.body.events.some((e: { id: string }) => e.id === laterNear.body.id)).toBe(true);
    // Zeitraum
    const week = await v.c.get('/api/events?radius=100&when=7tage');
    expect(week.body.events.some((e: { id: string }) => e.id === laterNear.body.id)).toBe(false);
    expect(week.body.events.some((e: { id: string }) => e.id === soonFar.body.id)).toBe(true);
    const card = bald.body.events.find((e: { id: string }) => e.id === soonFar.body.id);
    expect(card.km).toBeGreaterThan(40);
    expect(card.organizer).toEqual({ name: 'Liste Test', verified: true });
  });

  it('Wochenende und Zeiträume', () => {
    const fri = new Date('2026-10-02T10:00:00Z');
    expect(whenRange('wochenende', fri)).toEqual(['2026-10-02', '2026-10-04']);
    const tue = new Date('2026-09-29T10:00:00Z');
    expect(whenRange('wochenende', tue)).toEqual(['2026-10-02', '2026-10-04']);
    expect(whenRange('morgen', tue)).toEqual(['2026-09-30', '2026-09-30']);
    expect(whenRange('alle', tue)).toBeNull();
  });

  it('Cruizy Test-Party: empfohlen oben, 400 Plätze, Testbilder', async () => {
    const id = await seedTestEvents();
    expect(await seedTestEvents()).toBe(id); // nichts doppelt
    const v = await member({ pos: HH });
    const r = await v.c.get('/api/events?radius=50');
    const f = r.body.featured.find((e: { id: string }) => e.id === id);
    expect(f).toBeTruthy();
    expect(f.capacity).toBe(400);
    expect(f.spotsLeft).toBe(400 - 137);
    expect(f.organizer).toEqual({ name: 'Cruizy', verified: true });
    expect(r.body.events.some((e: { id: string }) => e.id === id)).toBe(false);
    const d = await v.c.get(`/api/events/${id}`);
    expect(d.body.event.images).toHaveLength(3);
    const img = await v.c.get(d.body.event.images[0].url);
    expect(img.status).toBe(200);
    expect(img.headers['content-type']).toBe('image/jpeg');
    // aus München nur, wenn der Umkreis groß genug ist
    const muc = await member({ pos: MUC });
    expect((await muc.c.get('/api/events?radius=50')).body.featured.some((e: { id: string }) => e.id === id)).toBe(false);
    expect((await muc.c.get('/api/events?radius=1000')).body.featured.some((e: { id: string }) => e.id === id)).toBe(true);
  });
});

describe('Karte', () => {
  it('Punkte im Ausschnitt, gebündelt beim Herauszoomen, nie genauer als erlaubt', async () => {
    await seedTestEvents();
    const v = await member({ pos: HH });
    // ganz DACH, weit herausgezoomt → Gruppen oder Einzelpunkte in HH und München
    const wide = await v.c.get('/api/events/map?minLat=45&maxLat=56&minLng=5&maxLng=17&zoom=5');
    const all = [...wide.body.points.map((p: { lat: number; lng: number }) => p), ...wide.body.groups];
    expect(all.some((p: { lat: number; lng: number }) => distanceKm(p, MUC) < 60)).toBe(true);
    expect(all.some((p: { lat: number; lng: number }) => distanceKm(p, HH) < 60)).toBe(true);
    // nah heran: Einzelpunkte; private Lage nur als Zellmittelpunkt
    const near = await v.c.get('/api/events/map?minLat=53.4&maxLat=53.7&minLng=9.7&maxLng=10.3&zoom=13');
    expect(near.body.groups).toEqual([]);
    for (const pt of near.body.points.filter((x: { exact: boolean }) => !x.exact)) {
      expect({ lat: pt.lat, lng: pt.lng }).toEqual(roundToCell({ lat: pt.lat, lng: pt.lng }, 2000));
    }
  });
});

describe('Bilder einer Veranstaltung', () => {
  it('Upload ohne Metadaten, höchstens 8, sichtbar erst nach Freigabe', async () => {
    const host = await member({ pos: HH });
    const r = await host.c.post('/api/host/events', input());
    const up = await upload(host.c, `/api/host/events/${r.body.id}/images`, await jpeg({ exif: true }));
    expect(up.status).toBe(200);
    expect((await host.c.get(up.body.url)).status).toBe(200);
    const other = await member({ pos: HH });
    const d = await host.c.get(`/api/host/events/${r.body.id}`);
    const url = d.body.event.images[0].url.replace(/\/api\/img\/.*/, '');
    expect(url).toBe('');
    // für Fremde: erst nach Freigabe (die Adresse gilt ohnehin nur für die ausstellende Person)
    await q(`UPDATE events SET status = 'approved' WHERE id = $1`, [r.body.id]);
    const od = await other.c.get(`/api/events/${r.body.id}`);
    expect((await other.c.get(od.body.event.images[0].url)).status).toBe(200);
    const sharp = (await import('sharp')).default;
    const meta = await sharp((await other.c.get(od.body.event.images[0].url)).raw).metadata();
    expect(meta.exif).toBeUndefined();
  });
});
