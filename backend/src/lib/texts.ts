/**
 * Systemtexte mit ID (Q-15, AK-Q15-01). Quelle: shared/texts/de.json —
 * dieselbe Datei, aus der die Web-App liest.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type TextFile = Record<string, { t: string; s: string }>;
let cache: Record<string, string> | null = null;

function findTextsDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    process.env.TEXTS_DIR,
    resolve(here, '../../../shared/texts'),
    resolve(here, '../../../../shared/texts'),
    resolve(process.cwd(), '../shared/texts'),
    resolve(process.cwd(), 'shared/texts'),
  ].filter(Boolean) as string[];
  for (const c of candidates) if (existsSync(join(c, 'de.json'))) return c;
  throw new Error('Textdatei shared/texts/de.json nicht gefunden');
}

function load(): Record<string, string> {
  if (cache) return cache;
  const dir = findTextsDir();
  const out: Record<string, string> = {};
  for (const f of ['de.json', 'ui-de.json']) {
    const p = join(dir, f);
    if (!existsSync(p)) continue;
    const data = JSON.parse(readFileSync(p, 'utf8')) as TextFile;
    for (const [k, v] of Object.entries(data)) out[k] = v.t;
  }
  cache = out;
  return out;
}

export function t(id: string, vars: Record<string, string | number> = {}): string {
  const s = load()[id];
  if (s === undefined) throw new Error(`Text ${id} fehlt in der Textdatei`);
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export function hasText(id: string) {
  return id in load();
}
