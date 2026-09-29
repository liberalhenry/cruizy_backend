/**
 * Altersprüfung per Ausweisbild (Issue #7) — Auswertung auf unserem Server, kein Prüfpartner.
 *
 * Es zählt NUR das Geburtsdatum. Name, Foto, Adresse, Ausweisnummer dürfen abgedeckt sein;
 * sie werden weder gelesen noch gespeichert. Der erkannte Text verlässt diese Datei nicht.
 *
 * Wege zum Geburtsdatum, vom sichersten zum unsichersten:
 *   1. Maschinenlesbare Zone (MRZ: Rückseite Personalausweis, Passseite): Geburtsdatum UND
 *      Ablaufdatum mit gültigen Prüfziffern (ICAO 9303) → sicher.
 *   2. Beschriftetes Datum („Geburtsdatum“, „Date of birth“, „Date de naissance“ …) auf der
 *      Vorderseite, dazu genug Merkmale eines Ausweises → sicher genug.
 *   3. Alles andere — widersprüchliche Daten, kein Datum, zu wenig Ausweismerkmale → unsicher.
 *
 * Freigegeben wird automatisch nur „volljährig, sicher erkannt“. Unsicher geht an das Team,
 * und ein Ergebnis unter 18 prüft IMMER ein Mensch (die Folge — Sperre — ist zu schwer für
 * einen Lesefehler).
 */
import { execFile } from 'node:child_process';
import sharp from 'sharp';

export type Verdict = 'adult' | 'minor' | 'unsure';

export interface IdCheckResult {
  verdict: Verdict;
  /** Woher das Datum stammt */
  source: 'mrz' | 'label' | null;
  /** Begründung ohne Personenbezug — geht in die Prüfliste des Teams */
  note: string;
  /** nur für Tests und die Protokollierung: Alter in Jahren, nie das Datum */
  age?: number;
  /** Texterkennung fehlt auf dem Server — dann gleich an das Team */
  ocrUnavailable?: boolean;
}

// ───────────────────────── Datumsrechnung ─────────────────────────

export function ageOn(birth: Date, now = new Date()): number {
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const m = now.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < birth.getUTCDate())) age--;
  return age;
}

function validDate(y: number, m: number, d: number): Date | null {
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2200) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d ? dt : null;
}

// ───────────────────────── MRZ (ICAO 9303) ─────────────────────────

const WEIGHTS = [7, 3, 1];
function charValue(c: string): number {
  if (c === '<') return 0;
  if (c >= '0' && c <= '9') return c.charCodeAt(0) - 48;
  if (c >= 'A' && c <= 'Z') return c.charCodeAt(0) - 55;
  return -1;
}

export function checkDigit(s: string): number {
  let sum = 0;
  for (let i = 0; i < s.length; i++) {
    const v = charValue(s[i]);
    if (v < 0) return -1;
    sum += v * WEIGHTS[i % 3];
  }
  return sum % 10;
}

/** Typische Lesefehler in Ziffernfeldern der MRZ */
const DIGIT_FIX: Record<string, string> = { O: '0', Q: '0', D: '0', I: '1', L: '1', Z: '2', S: '5', B: '8', G: '6', T: '7' };
const fixDigits = (s: string) => s.replace(/[OQDILZSBGT]/g, (c) => DIGIT_FIX[c]);

/** Zeilen normalisieren: Großbuchstaben, ohne Leerraum, «‹ und Co. als Füllzeichen */
function mrzLines(text: string): string[] {
  return text
    .toUpperCase()
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, '').replace(/[«‹<(\[{]/g, '<'))
    .filter((l) => l.length >= 24 && (l.match(/</g)?.length ?? 0) >= 2);
}

export interface MrzDates {
  birth: Date;
  expiry: Date;
}

/**
 * Sucht in den MRZ-Zeilen das Muster  GGGGGG P S AAAAAA P  (Geburt, Prüfziffer, Geschlecht,
 * Ablauf, Prüfziffer) — gleich in TD1 (Ausweis, Zeile 2) und TD3 (Pass, Zeile 2).
 * Nur wenn BEIDE Prüfziffern stimmen, gilt das Ergebnis.
 */
export function parseMrz(text: string, now = new Date()): MrzDates[] {
  const out: MrzDates[] = [];
  for (const raw of mrzLines(text)) {
    // Geschlecht darf als M, F, X oder < gelesen werden; K/« sind oft falsch gelesene <
    const line = raw.replace(/K(?=[<K]*$)/g, '<');
    for (let i = 0; i + 15 <= line.length; i++) {
      const seg = line.slice(i, i + 15);
      const birthS = fixDigits(seg.slice(0, 6));
      const cb = fixDigits(seg[6]);
      const sex = seg[7];
      const expS = fixDigits(seg.slice(8, 14));
      const ce = fixDigits(seg[14]);
      if (!/^\d{6}$/.test(birthS) || !/^\d{6}$/.test(expS) || !/^\d$/.test(cb) || !/^\d$/.test(ce)) continue;
      if (!/[MFX<K]/.test(sex)) continue;
      if (checkDigit(birthS) !== Number(cb) || checkDigit(expS) !== Number(ce)) continue;
      const yy = Number(birthS.slice(0, 2));
      const cur = now.getUTCFullYear() % 100;
      const birthYear = yy > cur ? 1900 + yy : 2000 + yy;
      const birth = validDate(birthYear, Number(birthS.slice(2, 4)), Number(birthS.slice(4, 6)));
      const ey = Number(expS.slice(0, 2));
      const expiry = validDate(2000 + ey, Number(expS.slice(2, 4)), Number(expS.slice(4, 6)));
      if (!birth || !expiry || birth > now) continue;
      out.push({ birth, expiry });
    }
  }
  return out;
}

// ───────────────────────── Beschriftete Daten (Vorderseite) ─────────────────────────

const MONTHS: Record<string, number> = {
  JAN: 1, JANV: 1, FEB: 2, FEV: 2, FÉV: 2, MAR: 3, MÄR: 3, MAER: 3, MARS: 3, APR: 4, AVR: 4, MAI: 5, MAY: 5, JUN: 6, JUIN: 6,
  JUL: 7, JUIL: 7, AUG: 8, AOU: 8, AOÛ: 8, SEP: 9, SEPT: 9, OKT: 10, OCT: 10, NOV: 11, DEZ: 12, DEC: 12, DÉC: 12,
};

interface FoundDate {
  date: Date;
  index: number;
}

export function findDates(text: string): FoundDate[] {
  const out: FoundDate[] = [];
  // 12.05.1990 · 12 05 1990 · 12/05/1990 · 12-05-1990
  for (const m of text.matchAll(/(?<!\d)(\d{1,2})\s?[.\/\-\s]\s?(\d{1,2})\s?[.\/\-\s]\s?((?:19|20)\d{2})(?!\d)/g)) {
    const d = validDate(Number(m[3]), Number(m[2]), Number(m[1]));
    if (d) out.push({ date: d, index: m.index! });
  }
  // 12 MAI 1990 · 12 MAY/MAI 1990 · 12 JUIN 90 (zweistellige Jahre nur mit Monatsnamen)
  for (const m of text.toUpperCase().matchAll(/(?<!\d)(\d{1,2})\.?\s+([A-ZÄÉÛ]{3,5})(?:\s*\/\s*[A-ZÄÉÛ]{3,5})*\.?\s+((?:19|20)?\d{2})(?!\d)/g)) {
    const mon = MONTHS[m[2]];
    if (!mon) continue;
    let y = Number(m[3]);
    if (m[3].length === 2) y += y > new Date().getUTCFullYear() % 100 ? 1900 : 2000;
    const d = validDate(y, mon, Number(m[1]));
    if (d) out.push({ date: d, index: m.index! });
  }
  return out.sort((a, b) => a.index - b.index);
}

/** Beschriftungen eines Geburtsdatums — ausdrücklich NICHT „Geburtsort“/„Place of birth“ */
const BIRTH_LABEL =
  /(geburtsdatum|geburtstag|geb\.|geboren\s*am|date\s*of\s*birth|date\s*de\s*naissance|fecha\s*de\s*nacimiento|data\s*di\s*nascita|geboortedatum|data\s*urodzenia|do[gğ]um\s*tarihi|datum\s*narozen|datum\s*ro[đd]enja|születési\s*idő)/gi;
/** Beschriftungen anderer Daten auf einem Ausweis */
const OTHER_DATE_LABEL = /(g[üu]ltig|expiry|expiration|valid|ausstell|issue|d[ée]livr|emission|scadenza|caducidad)/gi;

function lastMatch(re: RegExp, s: string): number {
  let pos = -1;
  for (const m of s.matchAll(re)) pos = m.index!;
  return pos;
}

/**
 * Geburtsdatum = ein Datum, vor dem (bis 90 Zeichen, dieselbe oder vorige Zeilen) eine
 * Geburtsdatums-Beschriftung steht und keine andere Datumsbeschriftung näher liegt.
 * Andere Beschriftungen dazwischen (Staatsangehörigkeit …) stören nicht — Texterkennung
 * liest Spalten oft durcheinander.
 */
export function labeledBirthDates(text: string): Date[] {
  const dates = findDates(text);
  return dates
    .filter((f, i) => {
      const prev = i > 0 ? dates[i - 1].index : -1;
      const start = Math.max(0, f.index - 90, prev + 1);
      const win = text.slice(start, f.index);
      const birth = lastMatch(BIRTH_LABEL, win);
      return birth >= 0 && birth > lastMatch(OTHER_DATE_LABEL, win);
    })
    .map((f) => f.date);
}

// ───────────────────────── Merkmale eines Ausweises ─────────────────────────

const FEATURES: RegExp[] = [
  /personalausweis|identity\s*card|carte\s*d.?identit|identiteitskaart|dowód|carta\s*d.?identit|documento\s*de\s*identidad|kimlik/i,
  /reisepass|passport|passeport|pasaporte|passaporto|paspoort/i,
  /bundesrepublik|deutschland|republi[kc]|kingdom|royaume|republique|république|federal|europ/i,
  /staatsangeh|nationalit|citizenship/i,
  /g[üu]ltig\s*bis|date\s*of\s*expiry|expiry|expiration|date\s*d.?expiration|valid\s*until/i,
  /geburtsort|place\s*of\s*birth|lieu\s*de\s*naissance/i,
  /ausstellungsdatum|date\s*of\s*issue|d[ée]livr|beh[öo]rde|authority|autorit/i,
  /\b(ID|P)[<A-Z]{1,2}[A-Z<]{3}/, // Anfang einer MRZ-Zeile (IDD<<…, P<D<<…)
];

export function documentFeatures(text: string): number {
  return FEATURES.filter((re) => re.test(text)).length;
}

// ───────────────────────── Entscheidung ─────────────────────────

const ADULT = 18;
const MAX_AGE = 110;

export function evaluateText(text: string, now = new Date()): IdCheckResult {
  const mrz = parseMrz(text, now);
  const labeled = labeledBirthDates(text).filter((d) => d <= now);
  const features = documentFeatures(text) + (mrz.length ? 1 : 0);

  const sameDay = (a: Date, b: Date) => a.getTime() === b.getTime();
  const births = [...mrz.map((m) => m.birth), ...labeled];
  const distinct = births.filter((d, i) => births.findIndex((x) => sameDay(x, d)) === i);

  if (!births.length) {
    return { verdict: 'unsure', source: null, note: features >= 2 ? 'Ausweis erkannt, Geburtsdatum nicht lesbar' : 'kein Ausweis und kein Geburtsdatum erkannt' };
  }
  if (distinct.length > 1) {
    return { verdict: 'unsure', source: mrz.length ? 'mrz' : 'label', note: 'mehrere verschiedene Geburtsdaten erkannt' };
  }
  const birth = distinct[0];
  const age = ageOn(birth, now);
  const source = mrz.length ? 'mrz' : 'label';
  if (age > MAX_AGE) return { verdict: 'unsure', source, note: 'Geburtsdatum unplausibel', age };
  if (age < ADULT) {
    // Ein Mensch schaut immer drauf, bevor ein Konto deswegen gesperrt wird
    return { verdict: 'minor', source, note: 'Geburtsdatum ergibt unter 18 — bitte bestätigen', age };
  }
  if (source === 'mrz') return { verdict: 'adult', source, note: 'maschinenlesbare Zone mit gültigen Prüfziffern', age };
  if (features >= 2) return { verdict: 'adult', source, note: `beschriftetes Geburtsdatum, ${features} Ausweismerkmale`, age };
  return { verdict: 'unsure', source, note: `Geburtsdatum erkannt, aber zu wenige Ausweismerkmale (${features})`, age };
}

// ───────────────────────── Texterkennung (Tesseract, lokal) ─────────────────────────

let chain: Promise<unknown> = Promise.resolve();
/** Eine Erkennung nach der anderen — schont Speicher und Kerne (4 GB, 2 Kerne). */
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.catch(() => {});
  return next;
}

function tesseract(png: Buffer, psm: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      'tesseract',
      ['stdin', 'stdout', '-l', 'deu+eng', '--psm', String(psm)],
      { timeout: 45_000, maxBuffer: 4 * 1024 * 1024, env: { ...process.env, OMP_THREAD_LIMIT: '1' } },
      (err, stdout) => (err ? reject(err) : resolve(stdout)),
    );
    child.stdin?.end(png);
  });
}

let available: boolean | null = null;
export async function ocrAvailable(): Promise<boolean> {
  if (available !== null) return available;
  available = await new Promise<boolean>((resolve) => execFile('tesseract', ['--version'], { timeout: 10_000 }, (err) => resolve(!err)));
  return available;
}

async function variants(image: Buffer): Promise<Buffer[]> {
  const base = sharp(image, { failOn: 'error', limitInputPixels: 60_000_000 }).rotate().resize({ width: 2000, height: 2000, fit: 'inside' }).grayscale().normalise();
  return [await base.clone().sharpen().png().toBuffer(), await base.clone().threshold(150).png().toBuffer()];
}

/** Liest den Text eines Ausweisbilds — mehrere Aufbereitungen und Drehungen, bis ein Datum sicher ist. */
export async function readDocument(image: Buffer): Promise<string> {
  return serial(async () => {
    const texts: string[] = [];
    const [soft, hard] = await variants(image);
    for (const angle of [0, 90, 270, 180]) {
      const rot = angle ? await sharp(soft).rotate(angle).png().toBuffer() : soft;
      texts.push(await tesseract(rot, 11));
      const joined = texts.join('\n');
      const r = evaluateText(joined);
      if (r.verdict !== 'unsure' || r.source) break;
      if (angle === 0) {
        texts.push(await tesseract(soft, 6));
        texts.push(await tesseract(hard, 6));
        const r2 = evaluateText(texts.join('\n'));
        if (r2.verdict !== 'unsure' || r2.source) break;
      }
    }
    return texts.join('\n');
  });
}

export async function checkIdImages(images: Buffer[], now = new Date()): Promise<IdCheckResult> {
  if (!(await ocrAvailable())) return { verdict: 'unsure', source: null, note: 'Texterkennung auf dem Server nicht verfügbar', ocrUnavailable: true };
  const texts: string[] = [];
  for (const img of images) texts.push(await readDocument(img));
  // der Text bleibt hier — zurück geht nur das Ergebnis
  return evaluateText(texts.join('\n'), now);
}
