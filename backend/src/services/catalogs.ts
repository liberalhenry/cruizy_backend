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
 * Position (Issue #13) — freiwillig, eine Angabe.
 */
export const POSITIONS = [
  { key: 'top', label: 'Top' },
  { key: 'vers_top', label: 'Vers Top' },
  { key: 'vers', label: 'Vers' },
  { key: 'vers_bottom', label: 'Vers Bottom' },
  { key: 'bottom', label: 'Bottom' },
  { key: 'keine_penetration', label: 'Keine Penetration' },
] as const;
export const POSITION_KEYS = new Set<string>(POSITIONS.map((x) => x.key));

/**
 * Körpertypen aus der Szene (Issue #13) — ENTWURF, zum Gegenlesen mit der Community.
 * Mehrfachauswahl bis P-KOERPERTYP-MAX. Dieselben Schlüssel gelten für die Filter (Issue #20).
 */
export const BODY_TYPES = [
  { key: 'twink', label: 'Twink', hint: 'jung, schlank, eher unbehaart' },
  { key: 'twunk', label: 'Twunk', hint: 'zwischen Twink und Hunk, jung und trainiert' },
  { key: 'jock', label: 'Jock', hint: 'sportlich' },
  { key: 'otter', label: 'Otter', hint: 'schlank, behaart' },
  { key: 'bear', label: 'Bear', hint: 'kräftig, behaart' },
  { key: 'cub', label: 'Cub', hint: 'jüngerer Bär' },
  { key: 'wolf', label: 'Wolf', hint: 'schlank bis sportlich, behaart' },
  { key: 'muscle', label: 'Muscle', hint: 'muskulös' },
  { key: 'daddy', label: 'Daddy', hint: 'reifer' },
  { key: 'chub', label: 'Chub', hint: 'mollig' },
  { key: 'geek', label: 'Geek', hint: '' },
  { key: 'schlank', label: 'Schlank', hint: '' },
  { key: 'durchschnitt', label: 'Durchschnittlich', hint: '' },
  { key: 'kraeftig', label: 'Kräftig', hint: '' },
] as const;
export const BODY_TYPE_KEYS = new Set<string>(BODY_TYPES.map((x) => x.key));

/**
 * Kinks und Fetische (Issue #13) — immer freiwillig, nie Pflicht, zählen nie zur
 * Profil-Vollständigkeit (Issue #29) und fließen nie in Gesprächsstarter (Issue #30).
 * Sichtbar nur, wenn die Person sie selbst einträgt. ENTWURF zum Gegenlesen.
 */
export const KINK_GROUPS = [
  {
    group: 'Kleidung und Material',
    items: [
      ['leder', 'Leder'],
      ['rubber', 'Rubber / Gummi'],
      ['sportswear', 'Sportswear'],
      ['sneaker', 'Sneaker und Socken'],
      ['uniform', 'Uniform'],
      ['underwear', 'Unterwäsche'],
      ['harness', 'Harness'],
    ],
  },
  {
    group: 'Rollen und Spiel',
    items: [
      ['dom', 'Dom'],
      ['sub', 'Sub'],
      ['switch', 'Switch'],
      ['bdsm', 'BDSM'],
      ['bondage', 'Bondage'],
      ['puppy', 'Puppy Play'],
      ['rollenspiel', 'Rollenspiel'],
      ['daddy_boy', 'Daddy / Boy'],
    ],
  },
  {
    group: 'Vorlieben',
    items: [
      ['fuesse', 'Füße'],
      ['toys', 'Toys'],
      ['fisting', 'Fisting'],
      ['ws', 'Natursekt'],
      ['edging', 'Edging'],
      ['gruppe', 'Gruppe'],
      ['voyeur', 'Voyeur'],
      ['exhibition', 'Exhibition'],
      ['cruising', 'Cruising'],
      ['massage', 'Massage'],
      ['kuscheln', 'Kuscheln'],
      ['vanilla', 'Vanilla'],
    ],
  },
] as const;
export const KINK_KEYS = new Set<string>(KINK_GROUPS.flatMap((g) => g.items.map((i) => i[0] as string)));
export function kinkName(key: string): string | null {
  for (const g of KINK_GROUPS) for (const [k, n] of g.items) if (k === key) return n;
  return null;
}
export function bodyTypeName(key: string): string | null {
  return BODY_TYPES.find((b) => b.key === key)?.label ?? null;
}
export function positionName(key: string | null): string | null {
  return POSITIONS.find((b) => b.key === key)?.label ?? null;
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
 * Gesprächsstarter (F44, FV-59, Issue #30) — ENTWURF bis A-40. Regel- und vorlagenbasiert,
 * keine generative KI, keine Daten an Dritte (AK-F44-02). Gefüllt nur mit Angaben, die das
 * Profil der Gegenseite öffentlich zeigt: Interessen, Bio, Absicht. Nie Kinks, Position,
 * Gesundheit, Religion, Politik oder Inhalte privater Alben. Keine sexuellen Inhalte.
 * Priorität: gemeinsame Interessen > Interessen der Person > Bio > Absicht > allgemein.
 */
export const STARTERS = {
  gemeinsam: [
    'Wir mögen beide {interesse} – was war dein letztes Highlight?',
    '{interesse} steht bei uns beiden im Profil. Hast du einen Tipp für mich?',
    'Noch jemand mit {interesse}! Wie bist du dazu gekommen?',
  ],
  interesse: [
    '{interesse} steht bei dir drin – wie bist du dazu gekommen?',
    'Was gefällt dir an {interesse} am meisten?',
    'Ich hab gesehen: {interesse}. Erzähl mal, was dich daran reizt.',
  ],
  bio: [
    'Deine Bio hat mich neugierig gemacht – erzähl mal mehr!',
    'Ich hab deine Beschreibung gelesen und hätte da ein paar Fragen. Darf ich?',
    'Was von dem, was in deinem Profil steht, sollte ich als Erstes wissen?',
  ],
  absicht: {
    abend: ['Du bist heute Abend unterwegs – schon einen Plan?', 'Heute Abend noch was vor? Ich überlege gerade, wohin.'],
    schreiben: ['Lust, ein bisschen zu schreiben? Wie war dein Tag?', 'Hi! Du schreibst gern – ich auch. Was beschäftigt dich gerade?'],
    absicht3: ['Hey, wie sieht dein Tag gerade aus?', 'Hi! Spontan unterwegs? Erzähl mal.'],
    absicht4: ['Hi! Wie läuft’s bei dir gerade?', 'Hey, was hast du heute noch vor?'],
  } as Record<string, string[]>,
  allgemein: [
    'Hey, wie läuft dein Tag so?',
    'Was machst du am liebsten am Wochenende?',
    'Hi! Was hat dich heute zum Lächeln gebracht?',
    'Hey, was hörst du gerade für Musik?',
    'Hi, schön dich hier zu sehen. Was treibt dich so um?',
  ],
} as const;

/**
 * Kategorien für Veranstaltungen (Issue #16) — Mehrfachauswahl bis 4. Symbole nur als Deko.
 */
export const EVENT_CATEGORIES = [
  { key: 'party', label: 'Party', icon: '🎉' },
  { key: 'club', label: 'Clubnacht', icon: '🪩' },
  { key: 'festival', label: 'Festival', icon: '🎪' },
  { key: 'konzert', label: 'Konzert', icon: '🎤' },
  { key: 'privatparty', label: 'Private Party', icon: '🏠' },
  { key: 'bar', label: 'Bar & Kneipe', icon: '🍸' },
  { key: 'essen', label: 'Essen & Brunch', icon: '🍽️' },
  { key: 'pride', label: 'CSD & Pride', icon: '🏳️‍🌈' },
  { key: 'drag', label: 'Drag & Show', icon: '👑' },
  { key: 'kultur', label: 'Kultur, Film & Lesung', icon: '🎭' },
  { key: 'stammtisch', label: 'Stammtisch & Treffen', icon: '💬' },
  { key: 'sport', label: 'Sport & Outdoor', icon: '🏃' },
  { key: 'workshop', label: 'Workshop & Talk', icon: '🧠' },
  { key: 'sauna', label: 'Sauna & Wellness', icon: '🧖' },
  { key: 'fetisch', label: 'Fetisch', icon: '⛓️' },
  { key: 'reise', label: 'Reise & Ausflug', icon: '🧳' },
  { key: 'sonstiges', label: 'Sonstiges', icon: '✨' },
] as const;
export const EVENT_CATEGORY_KEYS = new Set<string>(EVENT_CATEGORIES.map((x) => x.key));
export const EVENT_CATEGORY_MAX = 4;

/** Art des Veranstalters (Issue #16). */
export const ORGANIZER_KINDS = [
  { key: 'bar', label: 'Bar / Kneipe' },
  { key: 'club', label: 'Club' },
  { key: 'restaurant', label: 'Restaurant / Café' },
  { key: 'konzerthaus', label: 'Konzert- oder Veranstaltungshaus' },
  { key: 'sauna', label: 'Sauna' },
  { key: 'kollektiv', label: 'Kollektiv / Partyreihe' },
  { key: 'verein', label: 'Verein / Initiative' },
  { key: 'agentur', label: 'Agentur / Veranstalter' },
  { key: 'privat', label: 'Privatperson' },
] as const;
export const ORGANIZER_KIND_KEYS = new Set<string>(ORGANIZER_KINDS.map((x) => x.key));
