/**
 * Einfache Ratenbegrenzung im Arbeitsspeicher (ein Server, ein Prozess).
 * Schlüssel sind Prüfwerte, nie Netzadressen im Klartext.
 */
import { tooMany } from './errors.js';

const buckets = new Map<string, number[]>();

export function hit(bucket: string, id: string, limit: number, windowMs: number): boolean {
  const k = `${bucket}:${id}`;
  const nowMs = Date.now();
  const arr = (buckets.get(k) ?? []).filter((t) => nowMs - t < windowMs);
  if (arr.length >= limit) {
    buckets.set(k, arr);
    return false;
  }
  arr.push(nowMs);
  buckets.set(k, arr);
  return true;
}

export function limit(bucket: string, id: string, max: number, windowMs: number, textId?: string) {
  if (!hit(bucket, id, max, windowMs)) throw tooMany(textId);
}

export function resetRateLimits() {
  buckets.clear();
}

// Aufräumen, damit der Speicher nicht wächst
setInterval(() => {
  const nowMs = Date.now();
  for (const [k, arr] of buckets) {
    if (!arr.length || nowMs - arr[arr.length - 1] > 24 * 3600_000) buckets.delete(k);
  }
}, 10 * 60_000).unref();
