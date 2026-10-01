/**
 * Prüfkette, Stufen 1 und 2 (M-02) — als Steckplätze.
 *
 * PRÜFUNG ERFORDERLICH.
 *
 * Stufe 1 (Hash-Abgleich): Schnittstelle, die Hash- UND Medienübermittlung
 * abbildet; die Bauform steht in HASH_TRANSFER, nicht im Programmtext
 * (AK-M02-13). Schalter P-HASH-AKTIV: aus → Zustand „Hash-Prüfung ausstehend“
 * (AK-M02-10), und kein Betrieb mit echten Menschen (AK-M02-11, siehe startup).
 *
 * Stufe 2 (Klassifikator): selbst gehostet; Ergebnis ist eine Weiche, keine
 * Entscheidung. Ohne Klassifikator („queue“) geht jedes öffentliche Bild an
 * einen Menschen — die sichere Voreinstellung. Ohne Hash-Abgleich ebenso: Dann
 * ersetzt der Blick des Teams den fehlenden Abgleich (services/photo-chain.ts).
 */
import sharp from 'sharp';
import { env } from '../config/env.js';
import { p } from '../config/params.js';

export interface HashInput {
  hash: string;
  media?: Buffer;
}
export interface HashResult {
  hit: boolean;
  list?: string;
}

export interface HashMatcher {
  name: string;
  check(input: HashInput): Promise<HashResult>;
}

let matcherOverride: HashMatcher | null = null;
let classifierOverride: ((img: Buffer) => Promise<number | null>) | null = null;
/** Für Tests: eigenen Abgleich bzw. Klassifikator einsetzen (null = wieder aus der Konfiguration). */
export function setHashMatcher(m: HashMatcher | null) {
  matcherOverride = m;
}
export function setClassifier(fn: ((img: Buffer) => Promise<number | null>) | null) {
  classifierOverride = fn;
}

export function hashMatcher(): HashMatcher | null {
  if (!p('P-HASH-AKTIV')) return null;
  if (matcherOverride) return matcherOverride;
  const e = env();
  if (e.HASH_PROVIDER === 'http' && e.HASH_URL) return httpMatcher;
  return null;
}

/** Steckplatz für einen angebundenen Abgleichdienst (Zugangsweg nach hash-abgleich-zugangswege.md). */
const httpMatcher: HashMatcher = {
  name: 'http',
  async check(input) {
    const e = env();
    let headers: Record<string, string> = {};
    try {
      headers = JSON.parse(e.HASH_HEADERS);
    } catch {
      headers = {};
    }
    const res = await fetch(e.HASH_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({ hash: input.hash, media: input.media ? input.media.toString('base64') : undefined }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`Abgleichdienst antwortet mit ${res.status}`);
    const j = (await res.json()) as { hit?: boolean; list?: string };
    return { hit: !!j.hit, list: j.list };
  },
};

/** Ist ein Abgleich tatsächlich angebunden (unabhängig vom Schalter)? */
export function hashProviderConfigured(): boolean {
  if (matcherOverride) return true;
  const e = env();
  return e.HASH_PROVIDER === 'http' && !!e.HASH_URL;
}

/** Wahrnehmungs-Hash (dHash, 64 Bit) — lokal berechnet, nicht rückrechenbar. */
export async function perceptualHash(img: Buffer): Promise<string> {
  const { data } = await sharp(img).greyscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  let bits = 0n;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const left = data[y * 9 + x];
      const right = data[y * 9 + x + 1];
      bits = (bits << 1n) | (left > right ? 1n : 0n);
    }
  }
  return bits.toString(16).padStart(16, '0');
}

export async function runHashCheck(img: Buffer): Promise<{ state: 'checked' | 'pending'; hit: boolean; hash: string; list?: string }> {
  const hash = await perceptualHash(img);
  const matcher = hashMatcher();
  if (!matcher) return { state: 'pending', hit: false, hash };
  const input: HashInput = env().HASH_TRANSFER === 'media' ? { hash, media: img } : { hash };
  try {
    const r = await matcher.check(input);
    return { state: 'checked', hit: r.hit, hash, list: r.list };
  } catch {
    // Dienst nicht erreichbar: „Hash-Prüfung ausstehend“, der Nachlauf holt es nach
    return { state: 'pending', hit: false, hash };
  }
}

/** Klassifikator. null = kein Wert → Warteschlange für einen Menschen. */
export async function classify(img: Buffer): Promise<number | null> {
  if (classifierOverride) return classifierOverride(img);
  const e = env();
  if (e.CLASSIFIER === 'http' && e.CLASSIFIER_URL) {
    try {
      const res = await fetch(e.CLASSIFIER_URL, {
        method: 'POST',
        headers: { 'content-type': 'image/jpeg' },
        body: new Uint8Array(img),
        signal: AbortSignal.timeout(Math.max(p('P-PRUEFKETTE'), 2000)),
      });
      if (!res.ok) return null;
      const j = (await res.json()) as { score?: number };
      return typeof j.score === 'number' ? j.score : null;
    } catch {
      return null;
    }
  }
  return null;
}
