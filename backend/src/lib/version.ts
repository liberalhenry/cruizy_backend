/**
 * Versionsstand der Installation (Issue #5) — Semantic Versioning, Quelle ist die Datei
 * VERSION in der Wurzel des Repositorys. Das Docker-Abbild bringt sie unter /app/VERSION mit.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

let cached: string | null = null;

export function appVersion(): string {
  if (cached) return cached;
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [resolve(here, '../../../VERSION'), resolve(here, '../../../../VERSION'), resolve(process.cwd(), '../VERSION'), resolve(process.cwd(), 'VERSION')];
  for (const c of candidates) {
    if (existsSync(c)) {
      const v = readFileSync(c, 'utf8').trim();
      if (SEMVER.test(v)) return (cached = v);
    }
  }
  return (cached = '0.0.0');
}

export const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;

/** Vergleich nach SemVer 2.0.0 (Build-Metadaten zählen nicht). < 0: a älter als b. */
export function compareVersions(a: string, b: string): number {
  const pa = SEMVER.exec(a.replace(/^v/, ''));
  const pb = SEMVER.exec(b.replace(/^v/, ''));
  if (!pa || !pb) throw new Error(`Keine gültige Version: ${!pa ? a : b}`);
  for (let i = 1; i <= 3; i++) {
    const d = Number(pa[i]) - Number(pb[i]);
    if (d) return Math.sign(d);
  }
  const ra = pa[4];
  const rb = pb[4];
  if (!ra && !rb) return 0;
  if (!ra) return 1; // ohne Vorabkennung ist neuer
  if (!rb) return -1;
  const xa = ra.split('.');
  const xb = rb.split('.');
  for (let i = 0; i < Math.max(xa.length, xb.length); i++) {
    if (xa[i] === undefined) return -1;
    if (xb[i] === undefined) return 1;
    const na = /^\d+$/.test(xa[i]);
    const nb = /^\d+$/.test(xb[i]);
    if (na && nb && Number(xa[i]) !== Number(xb[i])) return Math.sign(Number(xa[i]) - Number(xb[i]));
    if (na !== nb) return na ? -1 : 1;
    if (xa[i] !== xb[i]) return xa[i] < xb[i] ? -1 : 1;
  }
  return 0;
}
