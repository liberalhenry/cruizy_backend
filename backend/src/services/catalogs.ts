/**
 * Kataloge, die vor der Endfassung mit Betroffenen gegengelesen werden (Nr. 13, A-40).
 * Alles hier ist ENTWURF bzw. PLATZHALTER und steht an genau dieser Stelle, damit
 * es ohne Suche im Programmtext ersetzt werden kann.
 */

/** Absichten (F14). Namen 3 und 4 sind Platzhalter bis zu den Interviews [A-19]. */
export const INTENTIONS = [
  { key: 'abend', textId: 'ST-PRO-02', default: 'abend' },
  { key: 'schreiben', textId: 'ST-PRO-03', default: 'schreiben' },
  { key: 'absicht3', textId: 'ST-PRO-04', default: '8h' },
  { key: 'absicht4', textId: 'ST-PRO-05', default: '2h' },
] as const;
export type IntentionKey = (typeof INTENTIONS)[number]['key'];

/**
 * Interessens-Merkmale (F15, FV-31) — ENTWURF. Bewusst ohne besondere
 * Kategorien (Gesundheit, Vorlieben, Herkunft); nur Freizeit und Alltag.
 */
export const TRAIT_GROUPS = [
  {
    group: 'Unterwegs',
    items: [
      [1, 'Bars und Kneipen'],
      [2, 'Clubs und Partys'],
      [3, 'Konzerte'],
      [4, 'Kino'],
      [5, 'Theater und Oper'],
      [6, 'Museen und Ausstellungen'],
      [7, 'Cafés'],
      [8, 'Reisen'],
    ],
  },
  {
    group: 'Bewegung',
    items: [
      [20, 'Fitnessstudio'],
      [21, 'Laufen'],
      [22, 'Radfahren'],
      [23, 'Schwimmen'],
      [24, 'Wandern'],
      [25, 'Yoga'],
      [26, 'Tanzen'],
      [27, 'Mannschaftssport'],
      [28, 'Sauna und Wellness'],
    ],
  },
  {
    group: 'Zu Hause',
    items: [
      [40, 'Kochen'],
      [41, 'Backen'],
      [42, 'Lesen'],
      [43, 'Serien'],
      [44, 'Videospiele'],
      [45, 'Brettspiele'],
      [46, 'Musik machen'],
      [47, 'Gärtnern'],
      [48, 'Haustiere'],
    ],
  },
  {
    group: 'Interessen',
    items: [
      [60, 'Kunst und Design'],
      [61, 'Fotografie'],
      [62, 'Mode'],
      [63, 'Technik'],
      [64, 'Politik und Gesellschaft'],
      [65, 'Natur'],
      [66, 'Sprachen'],
      [67, 'Ehrenamt'],
    ],
  },
] as const;

export const TRAIT_IDS = new Set<number>(TRAIT_GROUPS.flatMap((g) => g.items.map((i) => i[0] as number)));
export function traitName(id: number): string | null {
  for (const g of TRAIT_GROUPS) for (const [i, n] of g.items) if (i === id) return n;
  return null;
}

/**
 * Geschlechtsidentität (F16) und „Wen ich sehen möchte“ (F17) — PLATZHALTER bis
 * zum Gegenlesen (Nr. 13). Eine nicht sichtbare Angabe wirkt nirgends (FV-32).
 */
export const GENDER_CATEGORIES = [
  { key: 'mann', label: 'Mann' },
  { key: 'trans_mann', label: 'Trans Mann' },
  { key: 'nichtbinaer', label: 'Nicht-binär' },
  { key: 'genderqueer', label: 'Genderqueer' },
  { key: 'andere', label: 'Eigene Beschreibung' },
] as const;
export const GENDER_KEYS = new Set<string>(GENDER_CATEGORIES.map((g) => g.key));

/**
 * Prüfung auf ausschließende Formulierungen (F18, FV-33): selbst gehostet, nur
 * ein Hinweis, nie eine Sperre. Muster decken die häufigsten Ausschlussformeln
 * nach Herkunft, Hautfarbe, Körper, Alter und Geschlechtsausdruck ab.
 */
const TARGETS =
  '(asiat\\w*|schwarz\\w*|araber\\w*|türk\\w*|tuerk\\w*|ausländer\\w*|auslaender\\w*|latino\\w*|inder\\w*|afrikaner\\w*|dick\\w*|fett\\w*|mollig\\w*|chubb\\w*|fat\\w*|feminine?\\w*|femme?s?|tunt\\w*|tucken?|weibliche?\\w*|alte[nrs]?\\b|ältere?\\w*|aeltere?\\w*|opas?|old\\b|dünne?\\w*|duenne?\\w*|behindert\\w*|trans(en|männer|frauen|leute)?\\b|asians?|blacks?|arabs?|fems?|fats?|queens?)';
const PATTERNS = [
  new RegExp(`\\b(keine|kein|no|nicht|never|nie)\\s+(\\w+\\s+)?${TARGETS}`, 'iu'),
  new RegExp(`\\bnur\\s+(\\w+\\s+)?(wei(ß|ss)e?\\w*|deutsche?\\w*|europäer\\w*|europaeer\\w*|schlanke?\\w*|sportliche?\\w*|junge?\\w*|maskuline?\\w*|masc\\w*)`, 'iu'),
  new RegExp(`\\b(only|just)\\s+(\\w+\\s+)?(whites?|white guys|masc\\w*|fit|slim|young)\\b`, 'iu'),
  /\bmasc\s*4\s*masc\b/iu,
  /\bsorry,?\s+(keine|no)\b/iu,
];

export function hasExclusionaryPhrase(text: string): boolean {
  const s = text.normalize('NFC');
  return PATTERNS.some((re) => re.test(s));
}

/** Namen: Buchstaben aller Schriften, Ziffern, Leerzeichen, Bindestrich, Punkt, Apostroph (FV-22). */
export function validName(name: string, max: number): boolean {
  const n = name.trim();
  if (n.length < 1 || [...n].length > max) return false;
  if (!/^[\p{L}\p{M}\p{N} .'’-]+$/u.test(n)) return false;
  // AK-PG-01: keine Internetadresse, keine Telefonnummer
  if (/(www\.|https?|\.(de|com|net|org|at|ch)\b)/i.test(n)) return false;
  if ((n.match(/\d/g) ?? []).length >= 6) return false;
  return true;
}

/**
 * Eisbrecher-Vorlagen (F44, FV-59) — ENTWURF bis A-40. Feste Vorlagen, gefüllt
 * nur mit strukturierten Angaben, die das Profil der Gegenseite sichtbar zeigt.
 * Keine generative KI (AK-F44-02).
 */
export const ICEBREAKERS = {
  merkmal: [
    'Hey {name}, ich sehe, du magst auch {merkmal}. Was gefällt dir daran am meisten?',
    '{merkmal} steht bei uns beiden im Profil. Hast du einen Tipp für mich?',
    'Hi {name}, {merkmal} — wie bist du dazu gekommen?',
  ],
  absicht: [
    'Hi {name}, du bist gerade bei „{absicht}“. Ich auch. Wie sieht dein Tag aus?',
    'Hey {name}, „{absicht}“ passt bei mir gerade auch. Lust, ein bisschen zu schreiben?',
  ],
  ort: [
    'Hi {name}, warst du schon mal im {ort}? Ich überlege, da mal hinzugehen.',
    'Hey {name}, kennst du {ort}? Wäre ein guter Ort für einen ersten Kaffee.',
  ],
  allgemein: [
    'Hi {name}, schön, dich hier zu sehen. Wie läuft dein Tag?',
    'Hey {name}, was hat dich heute zum Lächeln gebracht?',
    'Hallo {name}, ich wollte einfach mal Hallo sagen.',
    'Hi {name}, was machst du am liebsten an einem freien Abend?',
  ],
} as const;
