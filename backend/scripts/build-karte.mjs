/**
 * Baut die Grundkarte ohne Dritte (Issue #17) für frontend/public/karte/:
 *   laender.json  Ländergrenzen (Natural Earth, gemeinfrei) — DACH genau, Nachbarn gröber
 *   orte.json     Orte ab 5 000 Einwohnern und Stadtteile großer Städte (GeoNames, CC BY 4.0)
 *
 * Einmalig/bei Bedarf:  npm i --no-save world-atlas@2 topojson-client@3 && node scripts/build-karte.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { feature } = require('topojson-client');
const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '../../frontend/public/karte');

const DACH = new Set(['Germany', 'Austria', 'Switzerland', 'Liechtenstein']);
const NEAR = { minLng: -6, maxLng: 26, minLat: 42, maxLat: 58 };

const r = (x, d) => Math.round(x * 10 ** d) / 10 ** d;
function simplify(ring, d) {
  const outR = [];
  for (const [x, y] of ring) {
    const p = [r(x, d), r(y, d)];
    const last = outR[outR.length - 1];
    if (!last || last[0] !== p[0] || last[1] !== p[1]) outR.push(p);
  }
  return outR.length >= 4 ? outR : null;
}
function geom(g, d) {
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  const res = polys.map((poly) => poly.map((ring) => simplify(ring, d)).filter(Boolean)).filter((p) => p.length);
  return { type: 'MultiPolygon', coordinates: res };
}
function inNear(g) {
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  return polys.some((p) => p[0].some(([x, y]) => x > NEAR.minLng && x < NEAR.maxLng && y > NEAR.minLat && y < NEAR.maxLat));
}

const fine = feature(require('world-atlas/countries-10m.json'), 'countries').features;
const coarse = feature(require('world-atlas/countries-50m.json'), 'countries').features;
const features = [];
for (const f of fine) if (DACH.has(f.properties.name)) features.push({ type: 'Feature', properties: { n: f.properties.name, d: 1 }, geometry: geom(f.geometry, 3) });
for (const f of coarse) {
  if (DACH.has(f.properties.name) || !inNear(f.geometry)) continue;
  features.push({ type: 'Feature', properties: { n: f.properties.name, d: 0 }, geometry: geom(f.geometry, 2) });
}
writeFileSync(join(out, 'laender.json'), JSON.stringify({ type: 'FeatureCollection', features }));

const tsv = readFileSync(join(here, '../verzeichnis/orte-dach.tsv'), 'utf8').split('\n').filter((l) => l && !l.startsWith('#'));
const rows = tsv.map((l) => l.split('\t')).map(([, name, , , , kind, parent, pop, lat, lng]) => ({ name, kind, parent, pop: Number(pop), lat: Number(lat), lng: Number(lng) }));
const bigCities = new Set(rows.filter((x) => x.kind === 'ort' && x.pop >= 250_000).map((x) => x.name));
// [Name, Breite, Länge, Rang] — Rang bestimmt, ab welcher Zoomstufe ein Name erscheint
const rank = (x) => (x.kind === 'stadtteil' ? 6 : x.pop >= 1_000_000 ? 0 : x.pop >= 250_000 ? 1 : x.pop >= 100_000 ? 2 : x.pop >= 30_000 ? 3 : x.pop >= 10_000 ? 4 : 5);
const places = rows
  .filter((x) => (x.kind === 'ort' && x.pop >= 5000) || (x.kind === 'stadtteil' && bigCities.has(x.parent)))
  .sort((a, b) => rank(a) - rank(b) || b.pop - a.pop)
  .map((x) => [x.name, r(x.lat, 3), r(x.lng, 3), rank(x)]);
writeFileSync(join(out, 'orte.json'), JSON.stringify(places));
console.log(`${features.length} Länder, ${places.length} Orte`);
