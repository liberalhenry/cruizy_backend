/**
 * Datenkonto (F68), Löschung ohne Rückstände, Exportvollständigkeit (AK-F68-02),
 * Bildauslieferung nur an die berechtigte Person, Hintergrundaufträge.
 */
import { describe, expect, it } from 'vitest';
import { one, q } from '../src/db/pool.js';
import { destination } from '../src/lib/geo.js';
import { JOBS, computeResponseBands } from '../src/jobs/index.js';
import { deleteAccountNow } from '../src/services/deletion.js';
import { EXPORT_SECTIONS, runExports } from '../src/services/export.js';
import { jpeg, member, upload } from './helpers.js';

const KOELN = { lat: 50.9375, lng: 6.9603 };
const run = (name: string) => JOBS.find((j) => j.name === name)!.run();

/** Alle Spalten, die per Fremdschlüssel auf accounts(id) zeigen. */
async function accountColumns() {
  return q<{ table_name: string; column_name: string }>(
    `SELECT kcu.table_name, kcu.column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
       JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'accounts' AND ccu.column_name = 'id' AND tc.table_schema = 'public'`,
  );
}

describe('Export', () => {
  it('jede Tabelle mit Kontobezug steht im Export-Verzeichnis (AK-F68-02)', async () => {
    const cols = await accountColumns();
    const tables = [...new Set(cols.map((c) => c.table_name))];
    const missing = tables.filter((t) => !(t in EXPORT_SECTIONS));
    expect(missing).toEqual([]);
  });

  it('erstellt eine verschlüsselte ZIP-Datei; Herunterladen nur nach frischer Anmeldung', async () => {
    const m = await member({ pos: KOELN });
    const r = await m.c.post('/api/data/export', { password: 'export-passwort-1' });
    expect(r.status).toBe(200);
    let exp = null;
    for (let i = 0; i < 100; i++) {
      await runExports();
      exp = await one(`SELECT status, password_enc FROM exports WHERE account_id = $1`, [m.id]);
      if (exp!.status === 'ready') break;
      await new Promise((r) => setTimeout(r, 100));
    }
    expect(exp!.status).toBe('ready');
    expect(exp!.password_enc).toBeNull();
    await q(`UPDATE device_sessions SET reauth_at = now() - interval '1 hour' WHERE account_id = $1`, [m.id]);
    const stale = await m.c.get('/api/data/export/download');
    expect(stale.status).toBe(401);
    await q(`UPDATE device_sessions SET reauth_at = now() WHERE account_id = $1`, [m.id]);
    const dl = await m.c.get('/api/data/export/download');
    expect(dl.status).toBe(200);
    expect(dl.raw.subarray(0, 2).toString()).toBe('PK');
    // AES-verschlüsselte Einträge: Kompressionsmethode 99 im lokalen Kopf
    expect(dl.raw.readUInt16LE(8)).toBe(99);
  });
});

describe('Löschung', () => {
  it('nach der Karenz bleibt keine Zeile mit Kontobezug zurück', async () => {
    const a = await member({ pos: KOELN });
    const b = await member({ pos: destination(KOELN, 0, 1) });
    await upload(a.c, '/api/photos', await jpeg());
    const conv = await a.c.post('/api/conversations', { to: b.id, text: 'Hallo' });
    await b.c.post(`/api/conversations/${conv.body.conversationId}/messages`, { text: 'Hi' });
    await a.c.post(`/api/bookmarks/${b.id}`);
    await a.c.post('/api/feedback', { text: 'Rückmeldung', wantsReply: true });
    const del = await a.c.post('/api/data/delete');
    expect(del.status).toBe(200);
    await q(`UPDATE accounts SET deletion_due_at = now() - interval '1 minute' WHERE id = $1`, [a.id]);
    await run('deletions');
    for (const c of await accountColumns()) {
      const r = await one(`SELECT count(*)::int AS n FROM ${c.table_name} WHERE ${c.column_name} = $1`, [a.id]);
      expect({ table: c.table_name, column: c.column_name, n: r!.n }).toEqual({ table: c.table_name, column: c.column_name, n: 0 });
    }
    // Fotos auf der Platte sind weg
    const files = await q(`SELECT original_file FROM photos WHERE account_id = $1`, [a.id]);
    expect(files).toHaveLength(0);
    // Die Gegenseite erhält eine gesperrte Nachlauf-Ablage ohne Kennung des gelöschten Kontos (FV-97)
    const vault = await one(`SELECT payload_enc FROM deletion_vault WHERE counterpart_id = $1`, [b.id]);
    expect(vault).toBeTruthy();
    expect(Buffer.from(vault!.payload_enc).toString('utf8')).not.toContain(a.id);
  });

  it('Abbruch in der Karenz stellt den Zustand her (AK-F68-06)', async () => {
    const a = await member();
    await a.c.post('/api/data/delete');
    const c = await a.c.post('/api/data/delete/cancel', {});
    expect(c.status).toBe(200);
    const acc = await one(`SELECT deletion_due_at FROM accounts WHERE id = $1`, [a.id]);
    expect(acc!.deletion_due_at).toBeNull();
  });

  it('vorläufige Konten verschwinden nach P-KONTO-VORLAEUFIG', async () => {
    const r = await one(`INSERT INTO accounts (primary_method, created_at) VALUES ('email', now() - interval '2 days') RETURNING id`);
    await run('provisional');
    expect(await one(`SELECT 1 FROM accounts WHERE id = $1`, [r!.id])).toBeNull();
  });

  it('Löschen eines Kontos mit Meldungen nullt nur die Bezüge — der Fall bleibt (X-09)', async () => {
    const a = await member();
    const b = await member();
    const r = await b.c.post('/api/reports', { reason: 'fake', targetId: a.id, context: 'profil' });
    expect(r.status).toBe(200);
    await deleteAccountNow(a.id);
    const rep = await one(`SELECT target_id FROM reports WHERE number = $1`, [r.body.number]);
    expect(rep).toBeTruthy();
    expect(rep!.target_id).toBeNull();
  });
});

describe('Bildauslieferung', () => {
  it('eine Bildadresse gilt nur für die Person, für die sie ausgestellt wurde', async () => {
    const owner = await member({ pos: KOELN });
    await upload(owner.c, '/api/photos', await jpeg());
    const viewer = await member({ pos: destination(KOELN, 90, 1) });
    const other = await member({ pos: destination(KOELN, 180, 1) });
    const prof = await viewer.c.get(`/api/profiles/${owner.id}`);
    expect(prof.status).toBe(200);
    const url = JSON.stringify(prof.body).match(/\/api\/img\/[A-Za-z0-9_-]+/)?.[0];
    expect(url).toBeTruthy();
    const mine = await viewer.c.get(url!);
    expect(mine.status).toBe(200);
    expect(String(mine.headers['content-type'])).toContain('image/jpeg');
    const stolen = await other.c.get(url!);
    expect(stolen.status).toBe(404);
  });
});

describe('Hintergrundaufträge', () => {
  it('Absicht läuft still ab (F15)', async () => {
    const m = await member();
    await m.c.put('/api/profile/intention', { key: 'abend' });
    await q(`UPDATE profiles SET intention_expires_at = now() - interval '1 minute' WHERE account_id = $1`, [m.id]);
    await run('intentions');
    const pr = await one(`SELECT intention, intention_expired_at FROM profiles WHERE account_id = $1`, [m.id]);
    expect(pr!.intention).toBeNull();
    expect(pr!.intention_expired_at).not.toBeNull();
    const notes = await one(`SELECT count(*)::int AS n FROM notices WHERE account_id = $1`, [m.id]);
    expect(notes!.n).toBe(0);
  });

  it('Antwortquote: Band erst ab P-AQ-MIN gewerteten Erstnachrichten, nie als Zahl (F19)', async () => {
    const target = await member({ pos: KOELN });
    const senders = [];
    for (let i = 0; i < 6; i++) senders.push(await member({ pos: destination(KOELN, i * 60, 1) }));
    const convs: string[] = [];
    for (const s of senders) convs.push((await s.c.post('/api/conversations', { to: target.id, text: 'Hallo' })).body.conversationId);
    // antwortet auf 4 von 6
    for (const c of convs.slice(0, 4)) await target.c.post(`/api/conversations/${c}/messages`, { text: 'Hi' });
    // unbeantwortete Erstnachrichten: Frist abgelaufen
    await q(`UPDATE first_message_stats SET deadline_at = now() - interval '1 minute' WHERE recipient_id = $1 AND answered_at IS NULL`, [target.id]);
    await computeResponseBands();
    const pr = await one(`SELECT response_band FROM profiles WHERE account_id = $1`, [target.id]);
    expect(pr!.response_band).toBe(1); // 4/6 ≥ 0,6
    const view = await senders[0].c.get(`/api/profiles/${target.id}`);
    expect(JSON.stringify(view.body)).not.toMatch(/0\.6|66|4\/6|answered|counted/);
  });
});
