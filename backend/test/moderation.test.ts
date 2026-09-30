/**
 * Abnahme moderations-backend.md, Abschnitt 14: die vier Zusagen und die Sperren aus M90.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { db, one, q } from '../src/db/pool.js';
import { setParam, clearParamOverrides } from '../src/config/params.js';
import { afterHashLock } from '../src/modules/mod/core.js';
import { localParts } from '../src/lib/time.js';
import { openHashCase } from '../src/services/photo-chain.js';
import { putFile } from '../src/lib/files.js';
import { destination } from '../src/lib/geo.js';
import { jpeg, member, staff, upload } from './helpers.js';

const KOELN = { lat: 50.9375, lng: 6.9603 };

/**
 * Liegt der Testlauf nach 21 Uhr, wird die Uhr auf 20 Uhr desselben Tages zurückgestellt —
 * nie vor, damit Sitzungen nicht als untätig gelten.
 */
function beforeLock() {
  if (!afterHashLock()) return;
  const now = new Date();
  const hour = localParts(now).hour;
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(now.getTime() - (hour - 20) * 3600_000));
}

afterEach(() => {
  vi.useRealTimers();
  clearParamOverrides();
});

async function reportedConversation() {
  const a = await member({ pos: KOELN });
  const b = await member({ pos: destination(KOELN, 0, 1) });
  const first = await a.c.post('/api/conversations', { to: b.id, text: 'eine Drohung' });
  const r = await b.c.post('/api/reports', {
    reason: 'belaestigung',
    targetId: a.id,
    context: 'gespraech',
    contextId: first.body.conversationId,
    items: [{ kind: 'message', id: first.body.messageId }],
  });
  expect(r.status).toBe(200);
  return { a, b, number: r.body.number as string, conv: first.body.conversationId as string };
}

async function hashCase() {
  const m = await member();
  const file = await putFile('zone1-original', await jpeg());
  await openHashCase({ zone: 1, accountId: m.id, file, store: 'zone1-original', hash: 'abcdef0123456789', list: 'Testliste' });
  return (await one(`SELECT id, number FROM hash_cases WHERE account_ref = $1`, [m.id]))!;
}

describe('Zusage 1 — kein Zugriff ohne Anlass', () => {
  it('keine Adresse liefert eine Liste privater Inhalte', async () => {
    const s = await staff('BETRIEB');
    for (const url of ['/mod-api/search?q=a', '/mod-api/users', '/mod-api/messages', '/mod-api/media', '/mod-api/zone2', '/mod-api/conversations']) {
      const r = await s.c.get(url);
      expect(r.status).toBe(404);
    }
  });

  it('das Bild-Token des Werkzeugs öffnet nie Zone 2', async () => {
    const s = await staff('BETRIEB');
    const { sealToken } = await import('../src/lib/crypto.js');
    const file = await putFile('zone2', await jpeg());
    const tok = sealToken({ k: 'mod', s: 'zone2', f: file, st: s.id, e: Date.now() + 60_000 });
    const r = await s.c.get(`/mod-api/img/${tok}`);
    expect(r.status).toBe(404);
  });

  it('Meldefall zeigt nur die markierten Inhalte; Kontext nur mit zweiter Person', async () => {
    const { number } = await reportedConversation();
    // Vier-Augen-Prinzip gilt für Zugänge ohne Owner-Kennzeichen (Issue #3)
    const s1 = await staff('MOD', false);
    const s2 = await staff();
    const rep = await one(`SELECT id FROM reports WHERE number = $1`, [number]);
    const open = await s1.c.post(`/mod-api/reports/${rep!.id}/open`, { reason: 'Belästigung prüfen' });
    expect(open.status).toBe(200);
    expect(open.body.items).toHaveLength(1);
    expect(JSON.stringify(open.body.items)).toContain('eine Drohung');
    // ohne Freigabe kein Kontext
    const noCtx = await s1.c.post(`/mod-api/reports/${rep!.id}/context`, { approvalId: '00000000-0000-4000-8000-000000000000', reason: 'x' });
    expect(noCtx.status).toBe(403);
    const reqCtx = await s1.c.post(`/mod-api/reports/${rep!.id}/context/request`, { reason: 'Zusammenhang unklar' });
    // die antragstellende Person kann nicht selbst freigeben
    const self = await s1.c.post(`/mod-api/approvals/${reqCtx.body.approvalId}`, { approve: true, reason: 'selbst' });
    expect(self.status).toBe(403);
    const other = await s2.c.post(`/mod-api/approvals/${reqCtx.body.approvalId}`, { approve: true, reason: 'nachvollziehbar' });
    expect(other.status).toBe(200);
    const ctx = await s1.c.post(`/mod-api/reports/${rep!.id}/context`, { approvalId: reqCtx.body.approvalId, reason: 'Zusammenhang' });
    expect(ctx.status).toBe(200);
  });
});

describe('Zusage 2 — jeder Zugriff protokolliert, nichts löschbar', () => {
  it('Protokolleinträge lassen sich weder ändern noch löschen', async () => {
    const { number } = await reportedConversation();
    const s = await staff();
    const rep = await one(`SELECT id FROM reports WHERE number = $1`, [number]);
    await s.c.post(`/mod-api/reports/${rep!.id}/open`, { reason: 'Prüfung' });
    const entry = await one(`SELECT id FROM access_log WHERE staff_id = $1 ORDER BY id DESC LIMIT 1`, [s.id]);
    expect(entry).toBeTruthy();
    await expect(q(`UPDATE access_log SET reason = 'geändert' WHERE id = $1`, [entry!.id])).rejects.toThrow(/Unveränderliche/);
    await expect(q(`DELETE FROM access_log WHERE id = $1`, [entry!.id])).rejects.toThrow(/Unveränderliche/);
    await expect(q(`TRUNCATE access_log`)).rejects.toThrow(/Unveränderliche/);
  });

  it('ohne Begründung wird nicht gehandelt', async () => {
    const { number } = await reportedConversation();
    const s = await staff();
    const rep = await one(`SELECT id FROM reports WHERE number = $1`, [number]);
    const r = await s.c.post(`/mod-api/reports/${rep!.id}/open`, { reason: '   ' });
    expect(r.status).toBe(400);
    const st = await one(`SELECT status FROM reports WHERE id = $1`, [rep!.id]);
    expect(st!.status).toBe('received');
  });

  it('ist das Protokoll nicht schreibbar, wird der Inhalt nicht geöffnet', async () => {
    const { number } = await reportedConversation();
    const s = await staff();
    const rep = await one(`SELECT id FROM reports WHERE number = $1`, [number]);
    await db().query(`CREATE OR REPLACE FUNCTION block_log() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Protokoll nicht erreichbar'; END $$`);
    await db().query(`CREATE TRIGGER access_log_down BEFORE INSERT ON access_log FOR EACH ROW EXECUTE FUNCTION block_log()`);
    try {
      const r = await s.c.post(`/mod-api/reports/${rep!.id}/open`, { reason: 'Prüfung' });
      expect(r.status).toBe(500);
      expect(r.body.items).toBeUndefined();
      const st = await one(`SELECT status FROM reports WHERE id = $1`, [rep!.id]);
      expect(st!.status).toBe('received');
    } finally {
      await db().query(`DROP TRIGGER access_log_down ON access_log`);
    }
  });

  it('eine angestellte Moderationskraft sieht nur die eigenen Einträge; Gründer sehen sich gegenseitig', async () => {
    const f1 = await staff('MOD', true);
    const f2 = await staff('MOD', true);
    const emp = await staff('MOD', false);
    const { number } = await reportedConversation();
    const rep = await one(`SELECT id FROM reports WHERE number = $1`, [number]);
    await f1.c.post(`/mod-api/reports/${rep!.id}/open`, { reason: 'Gründer 1' });
    await emp.c.post(`/mod-api/reports/${rep!.id}/open`, { reason: 'Angestellt' });
    const seenByF2 = (await f2.c.get('/mod-api/log')).body.items.map((x: { reason: string }) => x.reason);
    expect(seenByF2).toContain('Gründer 1');
    expect(seenByF2).not.toContain('Angestellt');
    const seenByEmp = (await emp.c.get('/mod-api/log')).body.items.map((x: { reason: string }) => x.reason);
    expect(seenByEmp).toContain('Angestellt');
    expect(seenByEmp).not.toContain('Gründer 1');
  });

  it('Export nur für BETRIEB, und der Export steht selbst im Protokoll', async () => {
    const mod = await staff('MOD');
    const betrieb = await staff('BETRIEB');
    expect((await mod.c.post('/mod-api/log/export', { reason: 'Quartalsprüfung durchführen' })).status).toBe(403);
    const r = await betrieb.c.post('/mod-api/log/export', { reason: 'Quartalsprüfung durchführen' });
    expect(r.status).toBe(200);
    expect(String(r.body)).toContain('protokoll_exportiert');
  });
});

describe('Zusage 3 — Vier-Augen-Prinzip bei Sperren', () => {
  it('Antrag und Freigabe mit derselben Kennung scheitern — auch über zwei Sitzungen, auch als BETRIEB', async () => {
    const { a, number } = await reportedConversation();
    const s = await staff('BETRIEB', false);
    const req = await s.c.post('/mod-api/suspensions', { action: 'suspend', reason: 'wiederholte Drohungen im Gespräch', caseRef: number });
    expect(req.status).toBe(200);
    const self = await s.c.post(`/mod-api/suspensions/${req.body.id}/approve`, { reason: 'selbst' });
    expect(self.status).toBe(403);
    // zweite Sitzung derselben Person
    const { Client, testApp } = await import('./helpers.js');
    const OTPAuth = await import('otpauth');
    const c2 = new Client(await testApp());
    const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(s.secret), digits: 6, period: 30 }).generate();
    await c2.post('/mod-api/login', { login: s.login, password: 'mod-passwort-lang', totp });
    expect((await c2.post(`/mod-api/suspensions/${req.body.id}/approve`, { reason: 'zweite Sitzung' })).status).toBe(403);
    // auch die Datenbank lässt es nicht zu
    await expect(q(`UPDATE suspensions SET approved_by = requested_by, approved_at = now() WHERE id = $1`, [req.body.id])).rejects.toThrow();
    const acc = await one(`SELECT moderation_state FROM accounts WHERE id = $1`, [a.id]);
    expect(acc!.moderation_state).toBe('none');
  });

  it('ohne Bezug keine Sperre', async () => {
    const s = await staff();
    const r = await s.c.post('/mod-api/suspensions', { action: 'suspend', reason: 'ohne Fall geht das nicht', caseRef: 'M-2026-000000' });
    expect(r.status).toBe(400);
    expect(r.body.code).toBe('bezug_fehlt');
  });

  it('die zweite Person gibt frei — erst dann wirkt die Sperre; Mitteilung mit Widerspruchsweg', async () => {
    const { a, number } = await reportedConversation();
    const s1 = await staff('MOD', false);
    const s2 = await staff();
    const req = await s1.c.post('/mod-api/suspensions', { action: 'restrict', reason: 'Drohung im Erstkontakt', caseRef: number });
    const ok = await s2.c.post(`/mod-api/suspensions/${req.body.id}/approve`, { reason: 'nachvollzogen' });
    expect(ok.status).toBe(200);
    const acc = await one(`SELECT moderation_state FROM accounts WHERE id = $1`, [a.id]);
    expect(acc!.moderation_state).toBe('restricted');
    const notice = await one(`SELECT body FROM notices WHERE account_id = $1 AND kind = 'sperre'`, [a.id]);
    expect(notice!.body).toContain('Drohung im Erstkontakt');
    // eingeschränkt: lesen ja, senden nein
    const b = await member();
    const w = await a.c.post('/api/conversations', { to: b.id, text: 'hallo' });
    expect(w.status).toBe(403);
  });

  it('abgelehnte Freigabe bleibt im Fall; derselbe Grund taugt nicht für einen neuen Anlauf', async () => {
    const { number } = await reportedConversation();
    const s1 = await staff('MOD', false);
    const s2 = await staff();
    const req = await s1.c.post('/mod-api/suspensions', { action: 'suspend', reason: 'zu hart für den Anlass', caseRef: number });
    const rej = await s2.c.post(`/mod-api/suspensions/${req.body.id}/reject`, { reason: 'Einschränkung reicht hier aus' });
    expect(rej.status).toBe(200);
    const row = await one(`SELECT rejection_reason FROM suspensions WHERE id = $1`, [req.body.id]);
    expect(row!.rejection_reason).toBe('Einschränkung reicht hier aus');
    const again = await s1.c.post('/mod-api/suspensions', { action: 'suspend', reason: 'zu hart für den Anlass', caseRef: number });
    expect(again.status).toBe(400);
  });

  it('Widerspruch entscheidet nie die Person, die gesperrt hat (M50.04)', async () => {
    const { a, number } = await reportedConversation();
    const s1 = await staff('MOD', false);
    const s2 = await staff();
    const s3 = await staff();
    const req = await s1.c.post('/mod-api/suspensions', { action: 'suspend', reason: 'Drohung, zweiter Vorfall', caseRef: number });
    await s2.c.post(`/mod-api/suspensions/${req.body.id}/approve`, { reason: 'ok' });
    const ap = await a.c.post('/api/appeals', { suspensionId: req.body.id, text: 'Das war ein Missverständnis, bitte prüft das.' });
    expect(ap.status).toBe(200);
    const appeal = await one(`SELECT id FROM appeals WHERE number = $1`, [ap.body.number]);
    const answer = 'Wir haben die Nachricht noch einmal gelesen und halten sie für eine Drohung.';
    const own = await s1.c.post(`/mod-api/appeals/${appeal!.id}/decide`, { outcome: 'bleibt', answer });
    expect(own.status).toBe(403);
    const other = await s3.c.post(`/mod-api/appeals/${appeal!.id}/decide`, { outcome: 'aufgehoben', answer, ourError: true });
    expect(other.status).toBe(200);
    const acc = await one(`SELECT moderation_state FROM accounts WHERE id = $1`, [a.id]);
    expect(acc!.moderation_state).toBe('none');
  });
});

describe('Zusage 4 — keine Vorschaubilder bei Hash-Treffern', () => {
  it('die Fallansicht enthält keinen Bildverweis; Dateiansicht nur mit Grund und zweiter Person', async () => {
    const hc = await hashCase();
    const s1 = await staff('MOD', false);
    const s2 = await staff();
    beforeLock();
    const open = await s1.c.post(`/mod-api/hash-cases/${hc.id}/open`, { reason: 'Treffer prüfen' });
    expect(open.status).toBe(200);
    expect(JSON.stringify(open.body)).not.toMatch(/img|image|bild|preview|vorschau/i);
    const noReason = await s1.c.post(`/mod-api/hash-cases/${hc.id}/view/request`, { reason: '' });
    expect(noReason.status).toBe(400);
    const noSecond = await s1.c.post(`/mod-api/hash-cases/${hc.id}/view`, { approvalId: '00000000-0000-4000-8000-000000000000', reason: 'ansehen' });
    expect(noSecond.status).toBe(403);
    const rq = await s1.c.post(`/mod-api/hash-cases/${hc.id}/view/request`, { reason: 'Falschtreffer ausschließen, Liste meldet Abweichung' });
    await s2.c.post(`/mod-api/approvals/${rq.body.approvalId}`, { approve: true, reason: 'nachvollziehbar' });
    const view = await s1.c.post(`/mod-api/hash-cases/${hc.id}/view`, { approvalId: rq.body.approvalId, reason: 'Abgleich' });
    expect(view.status).toBe(200);
    expect(view.body.image).toMatch(/^\/mod-api\/img\//);
  });

  it('höchstens zwei Hash-Fälle je Person und Tag — der dritte ist gesperrt (M90.01)', async () => {
    const s = await staff();
    const cases = [await hashCase(), await hashCase(), await hashCase()];
    beforeLock();
    expect((await s.c.post(`/mod-api/hash-cases/${cases[0].id}/open`, { reason: 'eins' })).status).toBe(200);
    expect((await s.c.post(`/mod-api/hash-cases/${cases[1].id}/open`, { reason: 'zwei' })).status).toBe(200);
    const third = await s.c.post(`/mod-api/hash-cases/${cases[2].id}/open`, { reason: 'drei' });
    expect(third.status).toBe(403);
    expect(third.body.code).toBe('tagesgrenze');
  });

  it('keiner nach 21 Uhr (M90.02)', async () => {
    expect(afterHashLock(new Date('2026-10-01T19:30:00Z'))).toBe(true); // 21:30 in Berlin (Sommerzeit)
    expect(afterHashLock(new Date('2026-12-01T20:05:00Z'))).toBe(true); // 21:05 in Berlin (Winterzeit)
    expect(afterHashLock(new Date('2026-10-01T18:59:00Z'))).toBe(false); // 20:59
    expect(afterHashLock(new Date('2026-10-01T22:30:00Z'))).toBe(false); // 00:30 am nächsten Tag
  });

  it('ohne Ansprechperson lässt sich der Hash-Abgleich nicht einschalten (M90.06)', async () => {
    const s = await staff('BETRIEB');
    await q(`DELETE FROM app_secrets WHERE key = 'setting:ansprechperson'`);
    const r = await s.c.put('/mod-api/params/P-HASH-AKTIV', { value: true, reason: 'Anbindung steht' });
    expect(r.status).toBe(409);
    expect(r.body.code).toBe('ansprechperson_fehlt');
    await s.c.put('/mod-api/settings/contact', { name: 'Vertrauensperson', phone: '+49 30 000000' });
    const ok = await s.c.put('/mod-api/params/P-HASH-AKTIV', { value: true, reason: 'Anbindung steht' });
    expect(ok.status).toBe(200);
    await q(`DELETE FROM parameters WHERE key = 'P-HASH-AKTIV'`);
  });
});

describe('Warteschlange Zone 1', () => {
  it('Graubereich geht an einen Menschen; Klassifikatorwert als Zahl nur für BETRIEB', async () => {
    const { resetEnvCache } = await import('../src/config/env.js');
    process.env.CLASSIFIER = 'queue';
    resetEnvCache();
    try {
      const m = await member();
      const up = await upload(m.c, '/api/photos', await jpeg());
      expect(up.body.status).toBe('queued');
      const mod = await staff('MOD');
      const list = await mod.c.get('/mod-api/queue');
      const item = list.body.items.find((x: { id: string }) => x.id === up.body.id);
      expect(item).toBeTruthy();
      expect(item.score).toBeUndefined();
      const dec = await mod.c.post(`/mod-api/queue/${up.body.id}/decide`, { decision: 'freigeben', reason: 'unbedenklich' });
      expect(dec.status).toBe(200);
      const ph = await one(`SELECT status, classifier_score FROM photos WHERE id = $1`, [up.body.id]);
      expect(ph!.status).toBe('approved');
      expect(ph!.classifier_score).toBeNull(); // AK-M02-08
    } finally {
      process.env.CLASSIFIER = 'mock-allow';
      resetEnvCache();
    }
  });

  it('Hash-Treffer beim Hochladen: Bild gesperrt, Fall versiegelt, Anzeige „in Prüfung“', async () => {
    setParam('P-HASH-AKTIV', true);
    const { mockHashList, perceptualHash } = await import('../src/providers/checks.js');
    const { prepare } = await import('../src/lib/images.js');
    const img = await jpeg({ color: '#123456' });
    mockHashList.add(await perceptualHash((await prepare(img)).data));
    const m = await member();
    const up = await upload(m.c, '/api/photos', img);
    expect(up.body.status).toBe('queued');
    const ph = await one(`SELECT status, public_file FROM photos WHERE id = $1`, [up.body.id]);
    expect(ph!.status).toBe('blocked');
    expect(ph!.public_file).toBeNull();
    expect(await one(`SELECT 1 FROM hash_cases WHERE account_ref = $1`, [m.id])).toBeTruthy();
    mockHashList.clear();
  });
});

describe('Issue #3 — Owner brauchen keine zweite Person', () => {
  it('Sperre durch einen Owner wirkt sofort; das Protokoll kennzeichnet „ohne zweite Person“', async () => {
    const { a, number } = await reportedConversation();
    const owner = await staff('MOD', true);
    const r = await owner.c.post('/mod-api/suspensions', { action: 'restrict', reason: 'Drohung im Erstkontakt, eindeutig', caseRef: number });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ state: 'wirksam', selfApproved: true });
    expect((await one(`SELECT moderation_state FROM accounts WHERE id = $1`, [a.id]))!.moderation_state).toBe('restricted');
    const su = await one(`SELECT requested_by, approved_by FROM suspensions WHERE id = $1`, [r.body.id]);
    expect(su!.approved_by).toBe(owner.id);
    expect(su!.requested_by).toBe(owner.id);
    const log = await one(`SELECT 1 FROM access_log WHERE staff_id = $1 AND action = 'sperre_freigegeben_restrict_ohne_zweite_person'`, [owner.id]);
    expect(log).toBeTruthy();
    expect(await one(`SELECT 1 FROM notices WHERE account_id = $1 AND kind = 'sperre'`, [a.id])).toBeTruthy();
  });

  it('Kontext ausklappen: ein Owner braucht keine Freigabe, ein MOD weiter schon', async () => {
    const { number } = await reportedConversation();
    const rep = await one(`SELECT id FROM reports WHERE number = $1`, [number]);
    const owner = await staff('BETRIEB', true);
    const req = await owner.c.post(`/mod-api/reports/${rep!.id}/context/request`, { reason: 'Zusammenhang unklar' });
    expect(req.body.approved).toBe(true);
    const ctx = await owner.c.post(`/mod-api/reports/${rep!.id}/context`, { approvalId: req.body.approvalId, reason: 'Zusammenhang' });
    expect(ctx.status).toBe(200);
    expect(await one(`SELECT 1 FROM access_log WHERE staff_id = $1 AND action = 'kontext_ohne_zweite_person'`, [owner.id])).toBeTruthy();

    const mod = await staff('MOD', false);
    const mreq = await mod.c.post(`/mod-api/reports/${rep!.id}/context/request`, { reason: 'Zusammenhang unklar' });
    expect(mreq.body.approved).toBe(false);
    expect((await mod.c.post(`/mod-api/reports/${rep!.id}/context`, { approvalId: mreq.body.approvalId, reason: 'x' })).status).toBe(403);
  });

  it('Datei ansehen (Hash-Fall): ein Owner ohne zweite Person', async () => {
    const hc = await hashCase();
    const owner = await staff('BETRIEB', true);
    beforeLock();
    await owner.c.post(`/mod-api/hash-cases/${hc.id}/open`, { reason: 'Treffer prüfen' });
    const rq = await owner.c.post(`/mod-api/hash-cases/${hc.id}/view/request`, { reason: 'Falschtreffer ausschließen, Liste meldet Abweichung' });
    expect(rq.body.approved).toBe(true);
    const view = await owner.c.post(`/mod-api/hash-cases/${hc.id}/view`, { approvalId: rq.body.approvalId, reason: 'Abgleich' });
    expect(view.status).toBe(200);
  });

  it('Art. 18: ein Owner zeichnet den eigenen Entwurf gegen, ein MOD nicht', async () => {
    const { number } = await reportedConversation();
    const owner = await staff('BETRIEB', true);
    const d = await owner.c.post('/mod-api/art18', { caseRef: number, reason: 'Verdacht auf Gefahr für Leib und Leben' });
    const text = d.body.content as string;
    await owner.c.post(`/mod-api/art18/${d.body.id}/confirm`, { content: text, read: true });
    expect((await owner.c.post(`/mod-api/art18/${d.body.id}/countersign`, { reason: 'geprüft' })).status).toBe(200);
    expect((await one(`SELECT countersigned_by FROM authority_reports WHERE id = $1`, [d.body.id]))!.countersigned_by).toBe(owner.id);

    const { number: n2 } = await reportedConversation();
    const mod = await staff('BETRIEB', false);
    const d2 = await mod.c.post('/mod-api/art18', { caseRef: n2, reason: 'Verdacht auf Gefahr für Leib und Leben' });
    await mod.c.post(`/mod-api/art18/${d2.body.id}/confirm`, { content: d2.body.content, read: true });
    expect((await mod.c.post(`/mod-api/art18/${d2.body.id}/countersign`, { reason: 'selbst' })).status).toBe(403);
  });

  it('die Datenbank erlaubt die Selbstfreigabe nur einem aktiven Owner', async () => {
    const { number } = await reportedConversation();
    const mod = await staff('MOD', false);
    const r = await mod.c.post('/mod-api/suspensions', { action: 'suspend', reason: 'wiederholte Drohungen im Gespräch', caseRef: number });
    await expect(q(`UPDATE suspensions SET approved_by = requested_by, approved_at = now() WHERE id = $1`, [r.body.id])).rejects.toThrow(/Vier-Augen/);
    // wird die Person zum Owner, ist es erlaubt; gesperrte Owner nicht
    await q(`UPDATE staff SET founder = true, disabled_at = now() WHERE id = $1`, [mod.id]);
    await expect(q(`UPDATE suspensions SET approved_by = requested_by, approved_at = now() WHERE id = $1`, [r.body.id])).rejects.toThrow(/Vier-Augen/);
    await q(`UPDATE staff SET disabled_at = NULL WHERE id = $1`, [mod.id]);
    await q(`UPDATE suspensions SET approved_by = requested_by, approved_at = now() WHERE id = $1`, [r.body.id]);
  });
});
