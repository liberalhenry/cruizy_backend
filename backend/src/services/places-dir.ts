/**
 * Ortsverzeichnis DE/AT/CH (Issue #18) — Dörfer, Städte, Stadtteile aus GeoNames (CC BY 4.0),
 * mitgeliefert als verzeichnis/orte-dach.tsv. Liegt im Speicher (rund 11 000 Einträge) und wird ohne
 * Dienste Dritter durchsucht — eingegebene Reiseziele verlassen den Server nicht.
 *
 * Regionen wie „Bayern“ sind bewusst nicht enthalten: „bald in der Gegend“ braucht einen Ort.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface Place {
  id: number;
  name: string;
  aliases: string[];
  country: 'DE' | 'AT' | 'CH';
  region: string;
  kind: 'ort' | 'stadtteil';
  parent: string;
  population: number;
  lat: number;
  lng: number;
  key: string;
}

let places: Place[] | null = null;
let byId: Map<number, Place> | null = null;

export function norm(s: string) {
  return s
    .toLocaleLowerCase('de-DE')
    .replace(/ß/g, 'ss')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function load(): Place[] {
  if (places) return places;
  const here = dirname(fileURLToPath(import.meta.url));
  // Quelle: backend/verzeichnis — im Container neben dist/
  const candidates = [join(here, '../../verzeichnis/orte-dach.tsv'), join(here, '../../../verzeichnis/orte-dach.tsv')];
  let raw = '';
  for (const c of candidates) {
    try {
      raw = readFileSync(c, 'utf8');
      break;
    } catch {
      /* nächster Pfad */
    }
  }
  places = raw
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const [id, name, alias, country, region, kind, parent, pop, lat, lng] = l.split('\t');
      const aliases = alias ? alias.split('|') : [];
      return {
        id: Number(id),
        name,
        aliases,
        country: country as Place['country'],
        region,
        kind: kind as Place['kind'],
        parent,
        population: Number(pop),
        lat: Number(lat),
        lng: Number(lng),
        key: [name, ...aliases, kind === 'stadtteil' ? `${parent} ${name}` : ''].map(norm).join('|'),
      };
    });
  byId = new Map(places.map((p) => [p.id, p]));
  return places;
}

export function placeById(id: number): Place | null {
  load();
  return byId!.get(id) ?? null;
}

/** Anzeigename: „Kreuzberg (Berlin)“ oder „Freising, Bayern“. */
export function placeLabel(p: Place) {
  return p.kind === 'stadtteil' && p.parent ? `${p.name} (${p.parent})` : p.name;
}

export function placeDetail(p: Place) {
  return [p.region, p.country].filter(Boolean).join(', ');
}

/**
 * Suchradius für „bald in der Gegend“: Stadtteil klein, Großstadt größer.
 * Nie eine ganze Region.
 */
export function placeRadiusKm(p: Place) {
  if (p.kind === 'stadtteil') return 5;
  if (p.population >= 500_000) return 25;
  if (p.population >= 100_000) return 15;
  if (p.population >= 20_000) return 10;
  return 6;
}

export function searchPlaces(q: string, limit = 8): Place[] {
  const needle = norm(q);
  if (needle.length < 2) return [];
  const list = load();
  const words = needle.split(' ');
  const scored: { p: Place; s: number }[] = [];
  for (const p of list) {
    const names = p.key.split('|');
    let s = -1;
    if (names.some((n) => n === needle)) s = 3;
    else if (names.some((n) => n.startsWith(needle))) s = 2;
    else if (words.every((w) => p.key.includes(w))) s = 1;
    if (s >= 0) scored.push({ p, s });
  }
  scored.sort((a, b) => b.s - a.s || b.p.population - a.p.population);
  return scored.slice(0, limit).map((x) => x.p);
}

/** Gibt es zu einer Eingabe nur Regionen (Bundesland, Kanton) statt Orten? */
export function looksLikeRegion(q: string): boolean {
  const n = norm(q);
  const regions = new Set(load().map((p) => norm(p.region)));
  ['deutschland', 'osterreich', 'schweiz', 'germany', 'austria', 'switzerland'].forEach((r) => regions.add(r));
  return regions.has(n) && !load().some((p) => norm(p.name) === n);
}
