import { describe, expect, it } from 'vitest';
import { one, q } from '../src/db/pool.js';
import { destination } from '../src/lib/geo.js';
import { JOBS } from '../src/jobs/index.js';
import { finalizeExit } from '../src/modules/chat.js';
import { jpeg, member, upload } from './helpers.js';

const KOELN = { lat: 50.9375, lng: 6.9603 };

async function pairUp() {
  const a = await member({ name: 'Anna', pos: KOELN });
  const b = await member({ name: 'Bert', pos: destination(KOELN, 10, 1) });
  return { a, b };
}

async function runJob(name: string) {
  const j = JOBS.find((x) => x.name === name)!;
  await j.run();
}

describe('Gespräche', () => {
  it('ohne Altersprüfung kein Schreiben (Nr. 64)', async () => {
    const a = await member({ age1: false });
    const b = await member();
    const r = await a.c.post('/api/conversations', { to: b.id, text: 'Hallo' });
    expect(r.status).toBe(403);
    expect(r.body.code).toBe('alterspruefung_noetig');
  });

  it('Erstkontakt nur Text — Bilder erst, wenn beide geschrieben haben (AK-F43-01/03)', async () => {
    const { a, b } = await pairUp();
    const first = await a.c.post('/api/conversations', { to: b.id, text: 'Hallo!' });
    expect(first.status).toBe(200);
    const conv = first.body.conversationId;
    const img = await jpeg();
    const early = await upload(a.c, `/api/conversations/${conv}/images`, img);
    expect(early.status).toBe(403);
    expect(early.body.code).toBe('erstkontakt_nur_text');
    await b.c.post(`/api/conversations/${conv}/messages`, { text: 'Hi zurück' });
    const later = await upload(a.c, `/api/conversations/${conv}/images`, img);
    expect(later.status).toBe(200);
    const m = await one(`SELECT delivery FROM messages WHERE id = $1`, [later.body.messageId]);
    expect(m!.delivery).toBe('sent');
  });

  it('Nachrichten liegen verschlüsselt in der Datenbank', async () => {
    const { a, b } = await pairUp();
    const r = await a.c.post('/api/conversations', { to: b.id, text: 'streng geheimer Satz' });
    const m = await one(`SELECT body_enc FROM messages WHERE id = $1`, [r.body.messageId]);
    expect(Buffer.from(m!.body_enc).toString('utf8')).not.toContain('streng geheimer Satz');
    const view = await b.c.get(`/api/conversations/${r.body.conversationId}`);
    expect(JSON.stringify(view.body.messages)).toContain('streng geheimer Satz');
  });

  it('höflicher Ausstieg: fünf Sekunden rückgängig, danach fester Text und Ende (F45)', async () => {
    const { a, b } = await pairUp();
    const r = await a.c.post('/api/conversations', { to: b.id, text: 'Hallo' });
    const conv = r.body.conversationId;
    const ex = await b.c.post(`/api/conversations/${conv}/exit`);
    expect(ex.status).toBe(200);
    const undo = await b.c.del(`/api/conversations/${conv}/exit`);
    expect(undo.status).toBe(200);
    await b.c.post(`/api/conversations/${conv}/exit`);
    await q(`UPDATE conversations SET pending_exit_at = now() - interval '1 second' WHERE id = $1`, [conv]);
    expect(await finalizeExit(conv)).toBe(true);
    const c = await one(`SELECT state, ended_by FROM conversations WHERE id = $1`, [conv]);
    expect(c!.state).toBe('ended');
    expect(c!.ended_by).toBe(b.id);
    const more = await a.c.post(`/api/conversations/${conv}/messages`, { text: 'noch was' });
    expect(more.status).toBe(409);
    // Ausstieg zählt als Antwort (AK-F45-04)
    const fm = await one(`SELECT answered_at FROM first_message_stats WHERE conversation_id = $1`, [conv]);
    expect(fm!.answered_at).not.toBeNull();
  });

  it('Archiv: nach P-ARCHIV bei beiden gelöscht, samt Bildern (F46)', async () => {
    const { a, b } = await pairUp();
    const r = await a.c.post('/api/conversations', { to: b.id, text: 'Hallo' });
    const conv = r.body.conversationId;
    await b.c.post(`/api/conversations/${conv}/messages`, { text: 'Hi' });
    const img = await upload(a.c, `/api/conversations/${conv}/images`, await jpeg());
    const media = await one(`SELECT media_id FROM messages WHERE id = $1`, [img.body.messageId]);
    await q(`UPDATE conversations SET state = 'ended', ended_by = $2, ended_at = now() - interval '25 hours' WHERE id = $1`, [conv, a.id]);
    await runJob('archive');
    expect(await one(`SELECT 1 FROM conversations WHERE id = $1`, [conv])).toBeNull();
    expect(await one(`SELECT 1 FROM private_media WHERE id = $1`, [media!.media_id])).toBeNull();
  });

  it('verfallende Nachrichten verschwinden nach Ablauf (F47)', async () => {
    const { a, b } = await pairUp();
    const r = await a.c.post('/api/conversations', { to: b.id, text: 'Hallo' });
    await q(`UPDATE messages SET expires_at = now() - interval '1 second' WHERE id = $1`, [r.body.messageId]);
    await runJob('messages_expiry');
    expect(await one(`SELECT 1 FROM messages WHERE id = $1`, [r.body.messageId])).toBeNull();
  });

  it('Blockieren: rücknehmbar, danach endgültig — dann ist das Gespräch weg (F61)', async () => {
    const { a, b } = await pairUp();
    const r = await a.c.post('/api/conversations', { to: b.id, text: 'Hallo' });
    const blk = await b.c.post('/api/blocks', { targetId: a.id });
    expect(blk.body.revocableUntil).toBeTruthy();
    // blockierte Person kann nicht mehr schreiben
    const w = await a.c.post(`/api/conversations/${r.body.conversationId}/messages`, { text: 'hallo?' });
    expect(w.status).toBe(404);
    await q(`UPDATE blocks SET revocable_until = now() - interval '1 second' WHERE id = $1`, [blk.body.id]);
    await runJob('blocks');
    expect(await one(`SELECT 1 FROM conversations WHERE id = $1`, [r.body.conversationId])).toBeNull();
  });
});

describe('Bilder (Stufe 0)', () => {
  it('entfernt alle Metadaten vor dem Speichern (AK-F72-01)', async () => {
    const { prepare } = await import('../src/lib/images.js');
    const sharp = (await import('sharp')).default;
    const withExif = await jpeg({ exif: true });
    expect((await sharp(withExif).metadata()).exif).toBeTruthy();
    const out = await prepare(withExif);
    const meta = await sharp(out.data).metadata();
    expect(meta.exif).toBeUndefined();
    expect(meta.xmp).toBeUndefined();
    expect(out.data.includes(Buffer.from('Testkamera'))).toBe(false);
  });

  it('weist nicht lesbare Dateien ab', async () => {
    const { prepare } = await import('../src/lib/images.js');
    await expect(prepare(Buffer.from('kein Bild'))).rejects.toMatchObject({ textId: 'ST-FEH-11' });
  });

  it('unsichtbares Wasserzeichen erkennt den Empfänger', async () => {
    const { applyWatermark, detectWatermark } = await import('../src/lib/images.js');
    const sharp = (await import('sharp')).default;
    const base = await sharp({ create: { width: 480, height: 640, channels: 3, background: '#808080' } })
      .composite([{ input: Buffer.from('<svg width="480" height="640"><circle cx="240" cy="300" r="150" fill="#a55"/></svg>') }])
      .jpeg({ quality: 92 })
      .toBuffer();
    const marked = await applyWatermark(base, 'empfaenger-b');
    const found = await detectWatermark(marked, ['empfaenger-a', 'empfaenger-b', 'empfaenger-c']);
    expect(found?.id ?? found).toBe('empfaenger-b');
  });

  it('Profilfoto: Original bleibt privat, freigegeben wird eine neue Fassung', async () => {
    const m = await member();
    const r = await upload(m.c, '/api/photos', await jpeg({ exif: true }));
    expect(r.status).toBe(200);
    const ph = await one(`SELECT status, original_file, public_file FROM photos WHERE account_id = $1`, [m.id]);
    expect(ph!.status).toBe('approved');
    expect(ph!.public_file).toBeTruthy();
    expect(ph!.public_file).not.toBe(ph!.original_file);
  });
});
