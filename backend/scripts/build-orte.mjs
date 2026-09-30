#!/usr/bin/env node
/**
 * Erzeugt verzeichnis/orte-dach.tsv — das Ortsverzeichnis für Travel und „bald in der Gegend“ (Issue #18)
 * und die Stadtwahl. Quelle: GeoNames (CC BY 4.0, https://www.geonames.org), aufbereitet im
 * npm-Paket „all-the-cities“ (Orte ab 1000 Einwohnern, mit Stadtteilen).
 *
 *   cd backend && npm i --no-save all-the-cities && node scripts/build-orte.mjs
 *
 * Spalten: id, name, weitere Namen (|), Land, Region, Art (ort|stadtteil), gehört zu, Einwohner, Breite, Länge
 */
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const cities = require('all-the-cities');

const REGION = {
  DE: { '01': 'Baden-Württemberg', '02': 'Bayern', '03': 'Bremen', '04': 'Hamburg', '05': 'Hessen', '06': 'Niedersachsen', '07': 'Nordrhein-Westfalen', '08': 'Rheinland-Pfalz', '09': 'Saarland', '10': 'Schleswig-Holstein', '11': 'Brandenburg', '12': 'Mecklenburg-Vorpommern', '13': 'Sachsen', '14': 'Sachsen-Anhalt', '15': 'Thüringen', '16': 'Berlin' },
  AT: { '01': 'Burgenland', '02': 'Kärnten', '03': 'Niederösterreich', '04': 'Oberösterreich', '05': 'Salzburg', '06': 'Steiermark', '07': 'Tirol', '08': 'Vorarlberg', '09': 'Wien' },
  CH: { AG: 'Aargau', AI: 'Appenzell Innerrhoden', AR: 'Appenzell Ausserrhoden', BE: 'Bern', BL: 'Basel-Landschaft', BS: 'Basel-Stadt', FR: 'Freiburg', GE: 'Genf', GL: 'Glarus', GR: 'Graubünden', JU: 'Jura', LU: 'Luzern', NE: 'Neuenburg', NW: 'Nidwalden', OW: 'Obwalden', SG: 'St. Gallen', SH: 'Schaffhausen', SO: 'Solothurn', SZ: 'Schwyz', TG: 'Thurgau', TI: 'Tessin', UR: 'Uri', VD: 'Waadt', VS: 'Wallis', ZG: 'Zug', ZH: 'Zürich' },
};
// Namen, die GeoNames englisch führt → deutsch, der englische bleibt als weiterer Name
const DEUTSCH = { Munich: 'München', Vienna: 'Wien', Cologne: 'Köln', Nuremberg: 'Nürnberg', Brunswick: 'Braunschweig', Hanover: 'Hannover', Geneva: 'Genf', Lucerne: 'Luzern', Zurich: 'Zürich', Basle: 'Basel', 'Sankt Gallen': 'St. Gallen' };

const km = (a, b) => {
  const r = (d) => (d * Math.PI) / 180;
  const h = Math.sin(r(b[1] - a[1]) / 2) ** 2 + Math.cos(r(a[1])) * Math.cos(r(b[1])) * Math.sin(r(b[0] - a[0]) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};

const all = cities.filter((c) => ['DE', 'AT', 'CH'].includes(c.country) && c.featureCode !== 'PPLH' && c.featureCode !== 'PPLH');
const towns = all.filter((c) => c.featureCode !== 'PPLX');
const rows = [];
for (const c of all) {
  const name = DEUTSCH[c.name] ?? c.name;
  const alias = new Set([c.name !== name ? c.name : null, ...(c.altName || '').split(',').filter((x) => x && x.length > 2 && x !== name)].filter(Boolean));
  let parent = '';
  const kind = c.featureCode === 'PPLX' ? 'stadtteil' : 'ort';
  if (kind === 'stadtteil') {
    // „Bochum-Hordel“ → Bochum; sonst die nächstgelegene größere Stadt in 20 km
    const prefix = towns.find((t) => t.country === c.country && c.name.startsWith(`${t.name}-`) && km(c.loc.coordinates, t.loc.coordinates) < 30);
    let best = prefix ?? null;
    let bestD = Infinity;
    if (!best) {
      for (const t of towns) {
        if (t.country !== c.country || t.population < Math.max(c.population, 50000)) continue;
        const d = km(c.loc.coordinates, t.loc.coordinates);
        if (d < 20 && d < bestD) {
          best = t;
          bestD = d;
        }
      }
    }
    parent = best ? DEUTSCH[best.name] ?? best.name : '';
  }
  const [lng, lat] = c.loc.coordinates;
  rows.push([c.cityId, name, [...alias].join('|'), c.country, REGION[c.country]?.[c.adminCode] ?? '', kind, parent, c.population, lat.toFixed(5), lng.toFixed(5)]);
}
rows.sort((a, b) => b[7] - a[7]);
const out = resolve(dirname(fileURLToPath(import.meta.url)), '../verzeichnis/orte-dach.tsv');
writeFileSync(out, '# Ortsverzeichnis DE/AT/CH — Quelle: GeoNames (CC BY 4.0), erzeugt mit scripts/build-orte.mjs\n' + rows.map((r) => r.join('\t')).join('\n') + '\n');
console.log(`${rows.length} Orte → ${out}`);
