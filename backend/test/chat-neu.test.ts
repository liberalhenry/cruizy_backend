/**
 * Chat-Erweiterungen: ungelesen (#14), Vorlagen (#21), Alben (#23), Einmal-Bilder (#26),
 * Sprachnachrichten (#28), Gesprächsstarter (#30).
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { setParam } from '../src/config/params.js';
import { one, q } from '../src/db/pool.js';
import { destination } from '../src/lib/geo.js';
import { audioAvailable } from '../src/lib/audio.js';
import { purgeOnceImages } from '../src/jobs/index.js';
import { buildStarters, purgeConversation } from '../src/modules/chat.js';
import { STARTERS } from '../src/services/catalogs.js';
import { jpeg, member, multipart, upload, type Client } from './helpers.js';

const KOELN = { lat: 50.9375, lng: 6.9603 };

async function talking() {
  const a = await member({ name: 'Anna', pos: KOELN });
  const b = await member({ name: 'Bert', pos: destination(KOELN, 10, 1) });
  const first = await a.c.post('/api/conversations', { to: b.id, text: 'Hallo!' });
  const conv = first.body.conversationId as string;
  return { a, b, conv };
}

async function bothWrote() {
  const t = await talking();
  await t.b.c.post(`/api/conversations/${t.conv}/messages`, { text: 'Hi zurück' });
  return t;
}

function tone(seconds: number, format: 'webm' | 'mp4' = 'webm', meta = false): Buffer {
  const dir = mkdtempSync(join(tmpdir(), 'ton-'));
  const out = join(dir, `a.${format === 'webm' ? 'webm' : 'm4a'}`);
  const codec = format === 'webm' ? ['-c:a', 'libopus'] : ['-c:a', 'aac'];
  execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', `sine=frequency=440:duration=${seconds}`,
    ...(meta ? ['-metadata', 'title=Geheimer Titel', '-metadata', 'artist=Name'] : []),
    ...codec, '-y', out,
  ]);
  const data = readFileSync(out);
  rmSync(dir, { recursive: true, force: true });
  return data;
}

async function uploadAudio(c: Client, url: string, data: Buffer, fields: Record<string, string> = {}) {
  const m = multipart(data, fields, 'sprache.webm');
  return c.req('POST', url, m.payload, m.headers);
}

describe('Ungelesen (#14)', () => {
  it('zählt ungelesene Gespräche und Anfragen — nur für einen selbst', async () => {
    const { a, b, conv } = await talking();
    let u = await b.c.get('/api/conversations/unread');
    expect(u.body).toEqual({ conversations: 0, requests: 1 });
    const list = await b.c.get('/api/conversations');
    expect(list.body.conversations.find((c: { id: string }) => c.id === conv).unread).toBe(1);
    await b.c.get(`/api/conversations/${conv}`); // Öffnen = gelesen
    u = await b.c.get('/api/conversations/unread');
    expect(u.body).toEqual({ conversations: 0, requests: 0 });
    await b.c.post(`/api/conversations/${conv}/messages`, { text: 'Antwort' });
    await b.c.post(`/api/conversations/${conv}/messages`, { text: 'noch eine' });
    const ua = await a.c.get('/api/conversations/unread');
    expect(ua.body.conversations).toBe(1);
    const la = await a.c.get('/api/conversations');
    const sum = la.body.conversations.find((c: { id: string }) => c.id === conv);
    expect(sum.unread).toBe(2);
    // keine Lesebestätigung: die Gegenseite erfährt nichts über den Lesestand
    expect(JSON.stringify(la.body)).not.toMatch(/read_at|readAt|gelesen/);
    await a.c.post(`/api/conversations/${conv}/read`);
    expect((await a.c.get('/api/conversations/unread')).body.conversations).toBe(0);
  });
});

describe('Vorlagen (#21)', () => {
  it('anlegen, bearbeiten, löschen — verschlüsselt, begrenzt', async () => {
    const m = await member();
    const r = await m.c.post('/api/templates', { text: 'Bin gerade unterwegs, melde mich später 😊' });
    expect(r.status).toBe(200);
    const row = await one(`SELECT text_enc FROM message_templates WHERE id = $1`, [r.body.id]);
    expect(Buffer.from(row!.text_enc).toString('utf8')).not.toContain('unterwegs');
    expect((await m.c.patch(`/api/templates/${r.body.id}`, { text: 'Neuer Text 🌈' })).status).toBe(200);
    const list = await m.c.get('/api/templates');
    expect(list.body.templates.map((x: { text: string }) => x.text)).toEqual(['Neuer Text 🌈']);
    setParam('P-VORLAGEN-MAX', 2);
    await m.c.post('/api/templates', { text: 'zwei' });
    const third = await m.c.post('/api/templates', { text: 'drei' });
    expect(third.status).toBe(400);
    expect(third.body.code).toBe('vorlagen_max');
    setParam('P-VORLAGEN-MAX', 20);
    expect((await m.c.del(`/api/templates/${r.body.id}`)).status).toBe(200);
    expect((await m.c.post('/api/templates', { text: '   ' })).status).toBe(400);
  });

  it('Emojis gehen ganz normal durch den Chat', async () => {
    const { b, conv } = await talking();
    const r = await b.c.post(`/api/conversations/${conv}/messages`, { text: '👋🏽 Hallo! 🏳️‍🌈' });
    expect(r.status).toBe(200);
    const c = await b.c.get(`/api/conversations/${conv}`);
    expect(c.body.messages.at(-1).text).toBe('👋🏽 Hallo! 🏳️‍🌈');
  });
});

describe('Alben (#23)', () => {
  it('bis zu 10 Alben; im Chat wird genau das geteilte Album sichtbar', async () => {
    const { a, b, conv } = await bothWrote();
    const ids: string[] = [];
    for (let i = 0; i < 10; i++) {
      const r = await a.c.post('/api/albums', { name: `Album ${i + 1}` });
      expect(r.status).toBe(200);
      ids.push(r.body.id);
    }
    const eleventh = await a.c.post('/api/albums', { name: 'zu viel' });
    expect(eleventh.body.code).toBe('alben_max');
    const img1 = await upload(a.c, `/api/albums/${ids[0]}/images`, await jpeg({ color: '#a33' }));
    const img2 = await upload(a.c, `/api/albums/${ids[1]}/images`, await jpeg({ color: '#33a' }));
    expect(img1.status).toBe(200);
    expect(img2.status).toBe(200);
    const off = await a.c.post('/api/album/offer', { conversationId: conv, albumId: ids[0] });
    expect(off.status).toBe(200);
    expect((await b.c.post(`/api/album/shares/${off.body.shareId}/answer`, { accept: true })).status).toBe(200);
    const view = await b.c.get(`/api/album/shares/${off.body.shareId}`);
    expect(view.body.name).toBe('Album 1');
    expect(view.body.images).toHaveLength(1);
    expect((await b.c.get(view.body.images[0].url)).status).toBe(200);
    // Bild aus Album 2 bleibt verschlossen, auch mit einer Adresse
    const own2 = await a.c.get(`/api/albums/${ids[1]}`);
    const { imgUrl } = await import('../src/services/media-tokens.js');
    expect((await b.c.get(imgUrl('album', own2.body.images[0].id, b.id))).status).toBe(404);
    // Album löschen beendet die Freigabe
    expect((await a.c.del(`/api/albums/${ids[0]}`)).status).toBe(200);
    expect((await b.c.get(view.body.images[0].url)).status).toBe(404);
  });
});

describe('Einmal-Bilder (#26)', () => {
  it('Erstkontakt-Regel gilt auch hier', async () => {
    const { a, conv } = await talking();
    const r = await upload(a.c, `/api/conversations/${conv}/images`, await jpeg(), { once: 'true' });
    expect(r.status).toBe(403);
    expect(r.body.code).toBe('erstkontakt_nur_text');
  });

  it('genau einmal abrufbar, danach gelöscht; Absender sieht „angesehen“', async () => {
    const { a, b, conv } = await bothWrote();
    const s = await upload(a.c, `/api/conversations/${conv}/images`, await jpeg(), { once: 'true' });
    expect(s.status).toBe(200);
    const list = await b.c.get(`/api/conversations/${conv}`);
    const msg = list.body.messages.find((m: { id: string }) => m.id === s.body.messageId);
    expect(msg.once.state).toBe('neu');
    expect(msg.image).toBeNull();
    const open = await b.c.post(`/api/conversations/${conv}/messages/${msg.id}/open`);
    expect(open.status).toBe(200);
    expect(open.body.seconds).toBe(10);
    const img = await b.c.get(open.body.url);
    expect(img.status).toBe(200);
    expect(img.headers['content-type']).toBe('image/jpeg');
    expect((await b.c.get(open.body.url)).status).toBe(404); // einmalige Adresse
    expect((await b.c.post(`/api/conversations/${conv}/messages/${msg.id}/open`)).status).toBe(410);
    const senderView = await a.c.get(`/api/conversations/${conv}`);
    expect(senderView.body.messages.find((m: { id: string }) => m.id === msg.id).once.state).toBe('angesehen');
    // nach dem Meldefenster endgültig gelöscht
    await q(`UPDATE messages SET once_purge_at = now() - interval '1 second' WHERE id = $1`, [msg.id]);
    await purgeOnceImages();
    const pm = await one(`SELECT pm.file FROM messages m JOIN private_media pm ON pm.id = m.media_id WHERE m.id = $1`, [msg.id]);
    expect(pm!.file).toBeNull();
  });

  it('ungeöffnet nach 7 Tagen abgelaufen; eine Meldung vorher sichert eine Kopie', async () => {
    const { a, b, conv } = await bothWrote();
    const s1 = await upload(a.c, `/api/conversations/${conv}/images`, await jpeg(), { once: 'true' });
    const s2 = await upload(a.c, `/api/conversations/${conv}/images`, await jpeg({ color: '#f00' }), { once: 'true' });
    const rep = await b.c.post('/api/reports', { reason: 'nacktbilder', targetId: a.id, context: 'gespraech', contextId: conv, items: [{ kind: 'message', id: s2.body.messageId }] });
    expect(rep.status).toBe(200);
    const item = await one(`SELECT ri.kind, ri.sealed_file FROM report_items ri JOIN reports r ON r.id = ri.report_id WHERE r.number = $1 AND ri.kind = 'einmal_bild'`, [rep.body.number]);
    expect(item!.sealed_file).toBeTruthy();
    await q(`UPDATE messages SET created_at = now() - interval '8 days' WHERE id = ANY($1)`, [[s1.body.messageId, s2.body.messageId]]);
    await purgeOnceImages();
    const v = await b.c.get(`/api/conversations/${conv}`);
    expect(v.body.messages.find((m: { id: string }) => m.id === s1.body.messageId).once.state).toBe('abgelaufen');
    expect((await b.c.post(`/api/conversations/${conv}/messages/${s1.body.messageId}/open`)).status).toBe(410);
  });
});

describe.skipIf(!(await audioAvailable()))('Sprachnachrichten (#28)', () => {
  it('erst nach der ersten Antwort, abschaltbar beim Empfänger', async () => {
    const { a, b, conv } = await talking();
    const early = await uploadAudio(a.c, `/api/conversations/${conv}/audio`, tone(1));
    expect(early.status).toBe(403);
    expect(early.body.code).toBe('erstkontakt_nur_text');
    await b.c.post(`/api/conversations/${conv}/messages`, { text: 'Antwort' });
    await b.c.patch('/api/profile', { settings: { voiceReceive: false } });
    const off = await uploadAudio(a.c, `/api/conversations/${conv}/audio`, tone(1));
    expect(off.body.code).toBe('sprache_aus');
    const info = await a.c.get(`/api/conversations/${conv}`);
    expect(info.body.voiceAllowed).toBe(false);
    expect(info.body.voiceBlocked).toBe('aus');
  });

  it('wandelt in AAC/MP4 ohne Metadaten, spielt mit Range-Anfragen, Grenze der Länge', async () => {
    const { a, b, conv } = await bothWrote();
    const r = await uploadAudio(a.c, `/api/conversations/${conv}/audio`, tone(2, 'webm', true));
    expect(r.status).toBe(200);
    expect(r.body.durationMs).toBeGreaterThan(1500);
    const v = await b.c.get(`/api/conversations/${conv}`);
    const m = v.body.messages.find((x: { id: string }) => x.id === r.body.messageId);
    expect(m.kind).toBe('audio');
    const full = await b.c.get(m.audio.url);
    expect(full.status).toBe(200);
    expect(full.headers['content-type']).toBe('audio/mp4');
    const part = await b.c.req('GET', m.audio.url, undefined, { range: 'bytes=0-99' });
    expect(part.status).toBe(206);
    expect(part.raw.length).toBe(100);
    // keine Metadaten aus der Aufnahme
    const dir = mkdtempSync(join(tmpdir(), 'pr-'));
    const f = join(dir, 'x.m4a');
    (await import('node:fs')).writeFileSync(f, full.raw);
    const meta = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format_tags', '-of', 'json', f]).toString();
    rmSync(dir, { recursive: true, force: true });
    expect(meta).not.toContain('Geheimer Titel');
    expect(meta).not.toContain('Name');
    // Safari-Aufnahme (MP4/AAC) geht ebenso
    expect((await uploadAudio(a.c, `/api/conversations/${conv}/audio`, tone(1, 'mp4'))).status).toBe(200);
    setParam('P-SPRACHE-MAX', 2);
    const long = await uploadAudio(a.c, `/api/conversations/${conv}/audio`, tone(5, 'mp4'));
    expect(long.status).toBe(400);
    expect(long.body.code).toBe('audio_zu_lang');
    setParam('P-SPRACHE-MAX', 320);
    // mit dem Gespräch gelöscht
    const pm = await one(`SELECT pm.id FROM messages m JOIN private_media pm ON pm.id = m.media_id WHERE m.id = $1`, [r.body.messageId]);
    await purgeConversation(conv);
    expect(await one(`SELECT 1 FROM private_media WHERE id = $1`, [pm!.id])).toBeNull();
  });
});

describe('Gesprächsstarter (#30)', () => {
  it('Priorität: gemeinsame Interessen, dann Interessen, Bio, Absicht — keine doppelten Quellen', () => {
    const s = buildStarters({ mine: [1, 20], theirs: [1, 42], bio: 'Ich koche gern und lese viel.', intention: 'abend' }, () => 0);
    expect(s).toHaveLength(3);
    expect(s[0]).toContain('Bars und Kneipen'); // gemeinsam (1)
    expect(s[1]).toContain('Lesen'); // nur bei der Person (42)
    expect(STARTERS.bio).toContain(s[2]);
  });

  it('Rückfall bei leerem Profil: mindestens zwei allgemeine Vorschläge; nie sensible Angaben', async () => {
    const s = buildStarters({ mine: [], theirs: [], bio: '', intention: null });
    expect(s.length).toBeGreaterThanOrEqual(2);
    for (const x of s) expect(STARTERS.allgemein).toContain(x);
    const a = await member({ pos: KOELN });
    const b = await member({ pos: KOELN });
    await b.c.patch('/api/profile', { kinks: ['leder', 'fisting'], position: 'bottom', traits: [1] });
    const r = await a.c.get(`/api/icebreakers/${b.id}`);
    expect(r.body.suggestions.length).toBeGreaterThanOrEqual(2);
    const txt = JSON.stringify(r.body).toLowerCase();
    expect(txt).not.toContain('leder');
    expect(txt).not.toContain('fisting');
    expect(txt).not.toContain('bottom');
    // nur im leeren Chat
    await a.c.post('/api/conversations', { to: b.id, text: 'Hallo' });
    expect((await a.c.get(`/api/icebreakers/${b.id}`)).body.suggestions).toEqual([]);
  });
});
