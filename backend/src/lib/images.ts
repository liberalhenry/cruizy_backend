/**
 * Bildaufbereitung (F11, F12, F48, F72, M-02 Stufe 0).
 *
 * PRÜFUNG ERFORDERLICH — Kernpunkt „Information zerstören, nicht verdecken“.
 *
 *  * Stufe 0: Format und Größe prüfen, EXIF-Ausrichtung anwenden, ALLE
 *    Metadaten verwerfen (Ort, Gerät, Zeit), neu kodieren (AK-F72-01/02).
 *    Lässt sich ein Format nicht sicher dekodieren, wird es abgewiesen (AK-F72-03).
 *  * Unkenntliche Fassung: über eine Zwischenstufe von höchstens 32×42 Bildpunkten
 *    und erst danach vergrößert — mehr Information als 32×42 Punkte trägt sie
 *    nicht (AK-F11-01/02).
 *  * Unsichtbares Wasserzeichen mit der Kennung der empfangenden Person
 *    (AK-F12-03, AK-F48-03): ein schwaches, schlüsselabhängiges ±-Muster je
 *    8×8-Block auf der Helligkeit. Es übersteht erneutes JPEG-Kodieren und lässt
 *    sich durch Korrelation einer Person aus einer Kandidatenliste zuordnen.
 */
import sharp, { type Metadata } from 'sharp';
import { createHmac } from 'node:crypto';
import { p } from '../config/params.js';
import { bad } from './errors.js';
import { key } from './crypto.js';

sharp.concurrency(1);
sharp.cache(false);

export const BLUR_W = 32;
export const BLUR_H = 42;
export const DISPLAY_W = 720;
export const DISPLAY_H = 945; // Hochformat 32:42

const FORMAT_MAP: Record<string, string> = { jpeg: 'jpeg', jpg: 'jpeg', png: 'png', webp: 'webp', heif: 'heif', heic: 'heif' };

export interface Prepared {
  data: Buffer;
  width: number;
  height: number;
}

/** Stufe 0 der Prüfkette. Gibt ein neu kodiertes JPEG ohne Metadaten zurück. */
export async function prepare(input: Buffer): Promise<Prepared> {
  const maxBytes = p('P-BILD-MAX-MB') * 1024 * 1024;
  if (input.length > maxBytes) throw bad('ST-FEH-10', { mb: p('P-BILD-MAX-MB') }, 'bild_zu_gross');
  const allowed = (p('P-BILD-FORMATE') as readonly string[]).map((f) => FORMAT_MAP[f] ?? f);
  let meta: Metadata;
  try {
    meta = await sharp(input, { failOn: 'error', limitInputPixels: 60_000_000 }).metadata();
  } catch {
    throw bad('ST-FEH-11', { formate: 'JPEG, PNG, WebP' }, 'format_unbekannt');
  }
  const fmt = FORMAT_MAP[meta.format ?? ''] ?? meta.format;
  if (!fmt || !allowed.includes(fmt) || (meta.pages ?? 1) > 1) {
    throw bad('ST-FEH-11', { formate: 'JPEG, PNG, WebP' }, 'format_unbekannt');
  }
  try {
    const { data, info } = await sharp(input, { failOn: 'error', limitInputPixels: 60_000_000 })
      .rotate() // EXIF-Ausrichtung anwenden, bevor die Metadaten verschwinden
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .toColorspace('srgb')
      .flatten({ background: '#000000' })
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });
    // Gegenprobe: keine Metadaten im Ergebnis
    const check = await sharp(data).metadata();
    if (check.exif || check.xmp || check.iptc || check.icc) {
      throw new Error('Metadaten nicht entfernt');
    }
    return { data, width: info.width, height: info.height };
  } catch (e) {
    if ((e as { textId?: string }).textId) throw e;
    // Lässt sich ein Bild nicht sicher neu kodieren, wird es abgewiesen (AK-F72-03)
    throw bad('ST-FEH-11', { formate: 'JPEG, PNG, WebP' }, 'format_unbekannt');
  }
}

/** Unkenntliche Fassung über die 32×42-Zwischenstufe (F11). */
export async function blurredVersion(original: Buffer): Promise<Buffer> {
  const tiny = await sharp(original)
    .resize(BLUR_W, BLUR_H, { fit: 'cover', position: 'attention', kernel: 'cubic' })
    .raw()
    .toBuffer({ resolveWithObject: true });
  // Ab hier gibt es nur noch 32×42 Bildpunkte — alles Weitere ist Vergrößerung.
  return sharp(tiny.data, { raw: { width: tiny.info.width, height: tiny.info.height, channels: tiny.info.channels } })
    .resize(DISPLAY_W, DISPLAY_H, { kernel: 'cubic' })
    .blur(6)
    .jpeg({ quality: 80 })
    .toBuffer();
}

/** Freie Fassung für das Profil (ohne Unschärfe), Hochformat. */
export async function clearVersion(original: Buffer): Promise<Buffer> {
  return sharp(original)
    .resize(DISPLAY_W, DISPLAY_H, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
}

/** Bild im Gespräch oder Album: Seitenverhältnis bleibt, höchstens 1280 px. */
export async function privateVersion(original: Buffer): Promise<Buffer> {
  return sharp(original).resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer();
}

/** Stark verkleinerte Fassung für Gäste: zusätzliche Unkenntlich-Stufe (Code-Planer AP-5). */
export async function guestVersion(blurredOrClear: Buffer): Promise<Buffer> {
  const tiny = await sharp(blurredOrClear).resize(12, 16, { fit: 'cover' }).raw().toBuffer({ resolveWithObject: true });
  return sharp(tiny.data, { raw: { width: tiny.info.width, height: tiny.info.height, channels: tiny.info.channels } })
    .resize(240, 315, { kernel: 'cubic' })
    .blur(8)
    .jpeg({ quality: 70 })
    .toBuffer();
}

// ───────────── Unsichtbares Wasserzeichen ─────────────

const BLOCK = 8;
const AMPLITUDE = 3;

function patternFor(recipientId: string, blocksX: number, blocksY: number): Int8Array {
  const seed = createHmac('sha256', key('watermark')).update(recipientId).digest();
  const out = new Int8Array(blocksX * blocksY);
  // xorshift128 aus dem Schlüssel
  let a = seed.readUInt32LE(0) | 1,
    b = seed.readUInt32LE(4) | 1,
    c = seed.readUInt32LE(8) | 1,
    d = seed.readUInt32LE(12) | 1;
  for (let i = 0; i < out.length; i++) {
    const t = a ^ (a << 11);
    a = b;
    b = c;
    c = d;
    d = (d ^ (d >>> 19) ^ (t ^ (t >>> 8))) >>> 0;
    out[i] = d & 1 ? 1 : -1;
  }
  return out;
}

export async function applyWatermark(img: Buffer, recipientId: string): Promise<Buffer> {
  const { data, info } = await sharp(img).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const bx = Math.floor(width / BLOCK);
  const by = Math.floor(height / BLOCK);
  const pat = patternFor(recipientId, bx, by);
  for (let y = 0; y < by * BLOCK; y++) {
    const rowBlock = Math.floor(y / BLOCK) * bx;
    for (let x = 0; x < bx * BLOCK; x++) {
      const s = pat[rowBlock + Math.floor(x / BLOCK)] * AMPLITUDE;
      const i = (y * width + x) * channels;
      for (let ch = 0; ch < 3; ch++) {
        const v = data[i + ch] + s;
        data[i + ch] = v < 0 ? 0 : v > 255 ? 255 : v;
      }
    }
  }
  return sharp(data, { raw: { width, height, channels } }).jpeg({ quality: 92 }).toBuffer();
}

/**
 * Ordnet ein weitergegebenes Bild einer Person aus der Kandidatenliste zu
 * (nur im Moderationsfall). Rückgabe: beste Kennung und Korrelationsmaß.
 */
export async function detectWatermark(
  img: Buffer,
  candidates: string[],
  size?: { width: number; height: number },
): Promise<{ id: string | null; score: number; scores: Record<string, number> }> {
  let pipeline = sharp(img).greyscale();
  if (size) pipeline = pipeline.resize(size.width, size.height, { fit: 'fill' });
  const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
  const bx = Math.floor(info.width / BLOCK);
  const by = Math.floor(info.height / BLOCK);
  // Mittelwert je Block, dann Hochpass (Block minus Mittel seiner Nachbarn)
  const means = new Float64Array(bx * by);
  for (let yb = 0; yb < by; yb++) {
    for (let xb = 0; xb < bx; xb++) {
      let sum = 0;
      for (let y = yb * BLOCK; y < (yb + 1) * BLOCK; y++) {
        for (let x = xb * BLOCK; x < (xb + 1) * BLOCK; x++) sum += data[y * info.width + x];
      }
      means[yb * bx + xb] = sum / (BLOCK * BLOCK);
    }
  }
  const resid = new Float64Array(bx * by);
  for (let yb = 0; yb < by; yb++) {
    for (let xb = 0; xb < bx; xb++) {
      let s = 0,
        n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const yy = yb + dy,
            xx = xb + dx;
          if (yy < 0 || xx < 0 || yy >= by || xx >= bx) continue;
          s += means[yy * bx + xx];
          n++;
        }
      }
      resid[yb * bx + xb] = means[yb * bx + xb] - (n ? s / n : 0);
    }
  }
  const scores: Record<string, number> = {};
  let best: string | null = null;
  let bestScore = -Infinity;
  for (const c of candidates) {
    const pat = patternFor(c, bx, by);
    let dot = 0;
    for (let i = 0; i < resid.length; i++) dot += resid[i] * pat[i];
    const score = dot / Math.sqrt(resid.length);
    scores[c] = score;
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return { id: best, score: bestScore, scores };
}
