/** Altersprüfung per Ausweisbild (Issue #7): nur das Geburtsdatum, unsicher → Team. */
import { readdirSync } from 'node:fs';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { resetEnvCache } from '../src/config/env.js';
import { one, q } from '../src/db/pool.js';
import { storeDir } from '../src/lib/files.js';
import { JOBS } from '../src/jobs/index.js';
import { checkDigit, evaluateText, labeledBirthDates, ocrAvailable, parseMrz } from '../src/services/id-check.js';
import { member, multipart, staff } from './helpers.js';

const NOW = new Date(Date.UTC(2026, 8, 29));
const yymmdd = (d: Date) => d.toISOString().slice(2, 10).replace(/-/g, '');
const withCheck = (s: string) => `${s}${checkDigit(s)}`;

/** Zeile 2 einer TD1-MRZ (Personalausweis) */
function td1Line2(birth: Date, expiry: Date) {
  return `${withCheck(yymmdd(birth))}<${withCheck(yymmdd(expiry))}D<<<<<<<<<<<<<4`;
}

describe('Auswertung des Texts (ohne Texterkennung)', () => {
  it('Prüfziffern nach ICAO 9303', () => {
    expect(checkDigit('640812')).toBe(5);
    expect(checkDigit('201031')).toBe(5);
    expect(checkDigit('270228')).toBe(3);
  });

  it('MRZ Personalausweis (TD1) und Pass (TD3), auch mit typischen Lesefehlern', () => {
    const td1 = 'IDD<<T220001293<<<<<<<<<<<<<<<\n6408125<2010315D<<<<<<<<<<<<<4\nMUSTERMANN<<ERIKA<<<<<<<<<<<<<';
    expect(parseMrz(td1, NOW)[0].birth.toISOString().slice(0, 10)).toBe('1964-08-12');
    const td3 = 'P<D<<MUSTERMANN<<ERIKA<<<<<<<<<<<<<<<<<<<<<<\nC01X00T478D<<6408125F2702283<<<<<<<<<<<<<<<4';
    expect(parseMrz(td3, NOW)[0].birth.toISOString().slice(0, 10)).toBe('1964-08-12');
    // O statt 0, « statt <, Leerzeichen
    expect(parseMrz('64O8125 «2O10315D«««««««««««««4', NOW)).toHaveLength(1);
    // falsche Prüfziffer → nichts
    expect(parseMrz('6408124<2010315D<<<<<<<<<<<<<4', NOW)).toHaveLength(0);
  });

  it('beschriftetes Geburtsdatum; „Geburtsort“ und „Gültig bis“ zählen nicht', () => {
    const text = 'Geburtsdatum / Date of birth\n12.08.1990\nGeburtsort / Place of birth\n\nGültig bis / Date of expiry\n01.03.2019';
    const d = labeledBirthDates(text);
    expect(d.map((x) => x.toISOString().slice(0, 10))).toEqual(['1990-08-12']);
    // Monatsnamen wie im Pass
    expect(labeledBirthDates('Date of birth / Date de naissance\n12 AUG/AOÛ 1990')[0].toISOString().slice(0, 10)).toBe('1990-08-12');
  });

  it('volljährig und sicher → freigegeben, der Name spielt keine Rolle', () => {
    const r = evaluateText('BUNDESREPUBLIK DEUTSCHLAND\nPERSONALAUSWEIS\nName ████\nGeburtsdatum\n12.08.1990\nGültig bis 01.03.2031', NOW);
    expect(r).toMatchObject({ verdict: 'adult', source: 'label' });
    expect(evaluateText(`IDD<<T220001293<<<<<<<<<<<<<<<\n${td1Line2(new Date(Date.UTC(1990, 7, 12)), new Date(Date.UTC(2031, 2, 1)))}`, NOW)).toMatchObject({
      verdict: 'adult',
      source: 'mrz',
    });
  });

  it('unter 18 → nie automatisch gesperrt, sondern an das Team', () => {
    const birth = new Date(Date.UTC(2010, 0, 1));
    expect(evaluateText(td1Line2(birth, new Date(Date.UTC(2030, 0, 1))), NOW).verdict).toBe('minor');
  });

  it('unsicher: kein Datum, zu wenig Ausweismerkmale, widersprüchliche Daten', () => {
    expect(evaluateText('Einkaufszettel: Milch, Brot', NOW).verdict).toBe('unsure');
    expect(evaluateText('Geburtsdatum 12.08.1990', NOW).verdict).toBe('unsure');
    const two = `PERSONALAUSWEIS\nGeburtsdatum 12.08.1990\n${td1Line2(new Date(Date.UTC(1985, 1, 2)), new Date(Date.UTC(2031, 2, 1)))}`;
    expect(evaluateText(two, NOW)).toMatchObject({ verdict: 'unsure', note: 'mehrere verschiedene Geburtsdaten erkannt' });
  });
});

// ───────────────────────── Ablauf mit Texterkennung ─────────────────────────

function card(lines: string, extra = '') {
  return sharp(
    Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="630"><rect width="1000" height="630" rx="30" fill="#e9eef2"/>${lines}${extra}</svg>`),
  )
    .jpeg()
    .toBuffer();
}
const txt = (x: number, y: number, s: string, size = 26, family = 'DejaVu Sans') =>
  `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}">${s.replace(/</g, '&lt;')}</text>`;

function front(birth: string) {
  return card(
    txt(40, 60, 'BUNDESREPUBLIK DEUTSCHLAND', 30) +
      txt(40, 95, 'PERSONALAUSWEIS / IDENTITY CARD', 22) +
      txt(340, 150, 'Name / Surname', 16) +
      // Name abgedeckt
      '<rect x="340" y="160" width="400" height="40" fill="#111"/>' +
      txt(340, 240, 'Geburtsdatum / Date of birth', 16) +
      txt(340, 270, birth, 28) +
      txt(340, 420, 'Gültig bis / Date of expiry', 16) +
      txt(340, 450, '01.03.2031', 28),
    '<rect x="40" y="130" width="260" height="330" fill="#9aa"/>',
  );
}

const ocr = await ocrAvailable();

describe.skipIf(!ocr)('Ablauf: Ausweis hochladen (Issue #7)', () => {
  beforeAll(() => {
    process.env.AGE_PROVIDER = 'ausweis';
    resetEnvCache();
  });
  afterAll(() => {
    process.env.AGE_PROVIDER = 'mock';
    resetEnvCache();
  });

  async function startCheck(m: Awaited<ReturnType<typeof member>>) {
    const st = await m.c.get('/api/verify/state');
    expect(st.body.methods.age1).toEqual(['ausweis']);
    const r = await m.c.post('/api/verify/start', { kind: 'age1', method: 'ausweis' });
    expect(r.status).toBe(200);
    expect(r.body.url).toBe(`/pruefung/ausweis?s=${r.body.sessionId}`);
    return r.body.sessionId as string;
  }

  async function send(m: Awaited<ReturnType<typeof member>>, sid: string, img: Buffer) {
    const mp = multipart(img);
    return m.c.req('POST', `/api/verify/ausweis/${sid}`, mp.payload, mp.headers);
  }

  it('sicher volljährig: sofort bestanden, kein Bild bleibt liegen', async () => {
    const m = await member({ age1: false });
    const sid = await startCheck(m);
    const before = readdirSync(storeDir('idcheck')).length;
    const r = await send(m, sid, await front('12.08.1990'));
    expect(r.status).toBe(200);
    expect(r.body.state).toBe('passed');
    const acc = await one(`SELECT age1_at, age1_method FROM accounts WHERE id = $1`, [m.id]);
    expect(acc!.age1_at).not.toBeNull();
    expect(acc!.age1_method).toBe('ausweis');
    expect(readdirSync(storeDir('idcheck')).length).toBe(before);
    // gespeichert ist weder ein Datum noch ein Text aus dem Ausweis
    const s = await one(`SELECT * FROM verification_sessions WHERE id = $1`, [sid]);
    expect(JSON.stringify(s)).not.toContain('1990');
  });

  it('unlesbar: erst neu fotografieren, dann prüft das Team — Entscheidung löscht die Bilder', async () => {
    const m = await member({ age1: false });
    const sid = await startCheck(m);
    const blank = await card(txt(40, 300, 'Urlaubsfoto', 40));
    const r1 = await send(m, sid, blank);
    expect(r1.body.state).toBe('retry');
    const r2 = await send(m, sid, blank);
    expect(r2.body.state).toBe('review');
    expect((await m.c.get(`/api/verify/session/${sid}`)).body.state).toBe('review');
    expect((await m.c.get('/api/verify/state')).body.review).toBe(true);

    const rev = await one(`SELECT id, number, files FROM id_reviews WHERE session_id = $1`, [sid]);
    expect(rev!.files).toHaveLength(1);
    const s = await staff('MOD', false);
    const list = await s.c.get('/mod-api/id-reviews');
    expect(list.body.items.some((x: any) => x.id === rev!.id)).toBe(true);
    const open = await s.c.post(`/mod-api/id-reviews/${rev!.id}/open`, {});
    expect(open.body.images[0]).toMatch(/^\/mod-api\/img\//);
    const img = await s.c.get(open.body.images[0]);
    expect(img.status).toBe(200);
    expect((await one(`SELECT 1 FROM access_log WHERE staff_id = $1 AND case_ref = $2 AND action = 'ausweis_geoeffnet'`, [s.id, rev!.number]))).toBeTruthy();

    const d = await s.c.post(`/mod-api/id-reviews/${rev!.id}/decide`, { decision: 'volljaehrig', reason: 'Datum lesbar, 1990' });
    expect(d.status).toBe(200);
    const after = await one(`SELECT files, decision FROM id_reviews WHERE id = $1`, [rev!.id]);
    expect(after).toMatchObject({ files: [], decision: 'volljaehrig' });
    expect(readdirSync(storeDir('idcheck'))).not.toContain(rev!.files[0]);
    expect((await one(`SELECT age1_at FROM accounts WHERE id = $1`, [m.id]))!.age1_at).not.toBeNull();
    expect(await one(`SELECT 1 FROM notices WHERE account_id = $1 AND kind = 'alterspruefung'`, [m.id])).toBeTruthy();
    // das Bild ist weg — auch über eine alte Adresse
    expect((await s.c.get(open.body.images[0])).status).toBe(404);
  });

  it('unter 18 erkannt: kein automatisches Ergebnis; erst das Team sperrt', async () => {
    const m = await member({ age1: false });
    const sid = await startCheck(m);
    const r = await send(m, sid, await front('01.01.2012'));
    expect(r.body.state).toBe('review');
    expect((await one(`SELECT minor_locked_at FROM accounts WHERE id = $1`, [m.id]))!.minor_locked_at).toBeNull();
    const rev = await one(`SELECT id FROM id_reviews WHERE session_id = $1`, [sid]);
    const s = await staff('MOD', false);
    await s.c.post(`/mod-api/id-reviews/${rev!.id}/decide`, { decision: 'minderjaehrig', reason: 'Geburtsjahr 2012' });
    expect((await one(`SELECT minor_locked_at FROM accounts WHERE id = $1`, [m.id]))!.minor_locked_at).not.toBeNull();
  });

  it('nicht entschieden: nach der Aufbewahrungsfrist sind die Bilder gelöscht', async () => {
    const m = await member({ age1: false });
    const sid = await startCheck(m);
    const blank = await card(txt(40, 300, 'Nichts', 40));
    await send(m, sid, blank);
    await send(m, sid, blank);
    const rev = await one(`SELECT id, files FROM id_reviews WHERE session_id = $1`, [sid]);
    await q(`UPDATE id_reviews SET created_at = now() - interval '30 days' WHERE id = $1`, [rev!.id]);
    await JOBS.find((j) => j.name === 'id_reviews')!.run();
    expect(await one(`SELECT decision, files FROM id_reviews WHERE id = $1`, [rev!.id])).toMatchObject({ decision: 'abgelaufen', files: [] });
    expect(readdirSync(storeDir('idcheck'))).not.toContain(rev!.files[0]);
    expect((await m.c.get(`/api/verify/session/${sid}`)).body.state).toBe('failed');
  });
});
