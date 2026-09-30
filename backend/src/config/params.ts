/**
 * Zentrale Parameterliste (Spezifikation, Abschnitt 15).
 *
 * AK-PA-01: Jeder Wert lässt sich ohne Codeänderung ändern — über die Tabelle
 * `parameters` (Moderationswerkzeug, nur Rolle BETRIEB, protokolliert). Werte
 * aus Handbuch A und A-37 ändern sich nur mit einer Entscheidung der Gründer;
 * deshalb steht die Quelle bei jedem Wert.
 *
 * Einheiten: Zeitspannen in Sekunden (Suffix _s im Kommentar), Strecken in
 * Metern oder Kilometern wie angegeben.
 */

export interface ParamDef<T = unknown> {
  wert: T;
  quelle: string;
  einheit?: string;
  /** Phase 2/3 — schon benannt, im MVP ohne Wirkung */
  spaeter?: boolean;
}

const MIN = 60;
const STD = 3600;
const TAG = 86400;

export const PARAMETER = {
  'P-GAST-DAUER': { wert: 3 * MIN, einheit: 's', quelle: 'Handbuch A (F01)' },
  'P-GAST-PAUSE': { wert: 24 * STD, einheit: 's', quelle: 'FV-12' },
  'P-GAST-JE-NETZ': { wert: 10, einheit: 'Gastsitzungen je Netzadresse in P-GAST-PAUSE', quelle: 'FV-12, FV-90' },
  'P-NAME-MAX': { wert: 20, einheit: 'Zeichen', quelle: 'FV-22, A-15' },
  'P-CODE-GUELTIG': { wert: 15 * MIN, einheit: 's', quelle: 'FV-13' },
  'P-CODE-VERSUCHE': { wert: 5, quelle: 'FV-13' },
  'P-CODE-NEU-SENDEN': { wert: 60, einheit: 's', quelle: 'A-15 (S03.08)' },
  'P-KONTO-VORLAEUFIG': { wert: 24 * STD, einheit: 's', quelle: 'FV-13' },
  'P-PW-MIN': { wert: 12, einheit: 'Zeichen', quelle: 'FV-13' },
  'P-RESET-SPERRE': { wert: 15 * MIN, einheit: 's', quelle: 'FV-13' },
  'P-PRUEF-TIMEOUT': { wert: 10 * MIN, einheit: 's', quelle: 'FV-90' },
  'P-AUSWEIS-FRIST': { wert: 24 * STD, einheit: 's', quelle: 'Issue #7: Prüfung eines Ausweisbilds durch das Team' },
  'P-AUSWEIS-AUFBEWAHRUNG': { wert: 7 * TAG, einheit: 's', quelle: 'Issue #7: spätestens dann werden unentschiedene Ausweisbilder gelöscht' },
  'P-AUSWEIS-VERSUCHE': { wert: 5, einheit: 'Ausweis-Prüfungen je Tag', quelle: 'Issue #7' },
  'P-FOTOPRUEF-VERSUCHE': { wert: 3, einheit: 'je Tag', quelle: 'FV-19' },
  'P-HALTEN': { wert: 72 * STD, einheit: 's', quelle: 'FV-21' },
  'P-BILD-FORMATE': { wert: ['jpeg', 'png', 'heif', 'webp'], quelle: 'FV-24' },
  'P-BILD-MAX-MB': { wert: 20, einheit: 'MB', quelle: 'FV-24' },
  'P-BILDLINK-GUELTIG': { wert: 5 * MIN, einheit: 's', quelle: 'FV-27' },
  'P-INITIALE-FARBEN': {
    // acht Flächenfarben; mit weißer Schrift jeweils Kontrast ≥ 4,5:1 (WCAG AA, AK-F13-02)
    wert: ['#1f5fa8', '#3b4cc0', '#6a3fb5', '#8a2f6e', '#a3342f', '#8a5300', '#2f6b3a', '#1d6b73'],
    quelle: 'FV-28',
  },
  'P-ABSICHT-ABEND': { wert: 4, einheit: 'Uhrzeit (Stunde) des nächsten Morgens', quelle: 'FV-29, [A-19]' },
  'P-ABSICHT-SCHREIBEN': { wert: 7 * TAG, einheit: 's', quelle: 'FV-29, [A-19]' },
  'P-ABSICHT-DAUERN': {
    wert: ['1h', '2h', '4h', '8h', 'morgen', 'wochenende'],
    quelle: 'Nr. 68 (27.09.2026)',
  },
  'P-MERKMALE-MAX': { wert: 10, quelle: 'FV-31' },
  'P-AQ-JE-WOCHE': { wert: 20, quelle: 'Handbuch A (F19)' },
  'P-AQ-FRIST': { wert: 7 * TAG, einheit: 's', quelle: 'Handbuch A (F19)' },
  'P-AQ-MIN': { wert: 5, quelle: 'FV-34' },
  'P-AQ-ZEITRAUM': { wert: 28 * TAG, einheit: 's', quelle: 'FV-34' },
  'P-AQ-GRENZE-1': { wert: 0.6, quelle: 'FV-34 (Nr. 68, Weg B), [A-19]' },
  'P-AQ-GRENZE-2': { wert: 0.2, quelle: 'FV-34 (Nr. 68, Weg B), [A-19]' },
  'P-AKTIV-JETZT': { wert: 5 * MIN, einheit: 's', quelle: 'FV-35' },
  'P-AKTIV-TAKT': { wert: 1 * MIN, einheit: 's', quelle: 'FV-35' },
  'P-NEU-TAGE': { wert: 14, einheit: 'Tage', quelle: 'FV-40' },
  'P-RASTER-ZIEL': { wert: 100, einheit: 'Profile', quelle: 'Handbuch A (F25)' },
  'P-RASTER-MAX-KM': { wert: 150, einheit: 'km', quelle: 'Handbuch A (F25)' },
  'P-ZAEHLER-LATENZ': { wert: 300, einheit: 'ms', quelle: 'FV-90' },
  'P-WOCHENAKTIV-SCHWELLE': { wert: 20, einheit: 'Profile im Umkreis von 10 km', quelle: 'Handbuch A (F27)' },
  'P-WOCHENAKTIV-KM': { wert: 50, einheit: 'km', quelle: 'Handbuch A (F27)' },
  'P-REISE-VORLAUF': { wert: 14 * TAG, einheit: 's', quelle: 'Handbuch A (F28)', spaeter: true },
  'P-CLUSTER-ZELLE': { wert: 1000, einheit: 'm', quelle: 'FV-46' },
  'P-CLUSTER-MIN': { wert: 10, einheit: 'Personen (Testphase: 5)', quelle: 'FV-46 (Nr. 68, Weg A)' },
  'P-CLUSTER-STUFEN': { wert: [10, 25, 50], quelle: 'FV-46' },
  'P-CLUSTER-TAKT': { wert: 15 * MIN, einheit: 's', quelle: 'FV-46' },
  'P-BEANSPRUCHEN-PRUEFUNG': { wert: 24 * STD, einheit: 's', quelle: 'Handbuch A (Abschnitt 3)' },
  'P-EREIGNIS-ERINNERUNG': { wert: 2 * STD, einheit: 's', quelle: 'FV-50' },
  'P-GRUPPE-OFFEN': { wert: 2 * STD, einheit: 's', quelle: 'Handbuch A (F33)' },
  'P-GRUPPE-ENDE': { wert: 24 * STD, einheit: 's', quelle: 'Handbuch A (F33)' },
  'P-MAIL-AUFBEWAHRUNG': { wert: 30 * TAG, einheit: 's', quelle: 'FV-52' },
  'P-AUSLASTUNG-MAU': { wert: 5000, quelle: 'Handbuch A (F35)', spaeter: true },
  'P-PORTAL-ORTE': { wert: 10, quelle: 'Handbuch A (F39)', spaeter: true },
  'P-ORTSKANAL-TAKT': { wert: 7 * TAG, einheit: 's', quelle: 'Handbuch A (F40)', spaeter: true },
  'P-NACHRICHT-MAX': { wert: 2000, einheit: 'Zeichen', quelle: 'FV-54' },
  'P-CHAT-LATENZ': { wert: 1000, einheit: 'ms', quelle: 'FV-54' },
  'P-ARCHIV': { wert: 24 * STD, einheit: 's', quelle: 'Handbuch A (F46)' },
  'P-VERFALL': { wert: 24 * STD, einheit: 's', quelle: 'Handbuch A (F47)' },
  'P-ALBUM-MAX': { wert: 30, einheit: 'Bilder', quelle: 'FV-63' },
  'P-ORTSFREIGABE': { wert: 60 * MIN, einheit: 's', quelle: 'Handbuch A (F50)', spaeter: true },
  'P-VIDEO-WIEDERVORLAGE': { wert: 40000, einheit: 'MAU', quelle: 'Handbuch A (F53)' },
  'P-BOOST-WIEDERVORLAGE': { wert: 50000, einheit: 'MAU', quelle: 'Handbuch A (Streichliste)' },
  'P-E2EE-MAU': { wert: 15000, einheit: 'MAU', quelle: 'Handbuch A (F74)', spaeter: true },
  'P-CHECKIN-ERSTE': { wert: 15 * MIN, einheit: 's', quelle: 'Nr. 66' },
  'P-CHECKIN-ZWEITE': { wert: 30 * MIN, einheit: 's', quelle: 'Nr. 66' },
  'P-CHECKIN-DRITTE': { wert: 60 * MIN, einheit: 's', quelle: 'Nr. 66' },
  'P-CHECKIN-FRIST': { wert: 10 * MIN, einheit: 's nach der dritten Frage', quelle: 'check-in-konzept.md (Vorschlag)' },
  'P-CHECKIN-LOESCHUNG': { wert: 24 * STD, einheit: 's nach Beginn', quelle: 'FV-65' },
  'P-ERSTKONTAKT-LIMIT': { wert: 5, einheit: 'Erstnachrichten in 24 h', quelle: 'Handbuch A (F57) — ruht bis Nr. 40', spaeter: true },
  'P-PIN-LAENGE': { wert: 4, einheit: 'Ziffern', quelle: 'FV-68' },
  'P-PIN-VERSUCHE': { wert: 5, quelle: 'FV-68' },
  'P-VERSTECKEN-ZEIT': { wert: 1000, einheit: 'ms', quelle: 'FV-90' },
  'P-SYMBOLE-MIN': { wert: 4, quelle: 'Handbuch A (F59)' },
  'P-ZONEN-MAX': { wert: 5, einheit: 'für alle gleich', quelle: 'Nr. 48 (Vorschlag)' },
  'P-ERSATZPUNKT-MAX-KM': { wert: 30, einheit: 'km', quelle: 'Nr. 48' },
  'P-ERSATZPUNKT-MIN-KM': { wert: 2, einheit: 'km', quelle: 'beschlossen 26.09.2026 (Teil 4)' },
  'P-CODE-NACHFRAGE': { wert: 7 * TAG, einheit: 's nach dem Anlegen', quelle: 'Nr. 69' },
  'P-WIEDERHERSTELLUNG-SCHWELLE': { wert: 1, quelle: 'Nr. 86' },
  'P-WHR-WARTEFRIST': { wert: 72 * STD, einheit: 's', quelle: 'Nr. 95' },
  'P-PRUEFUNG-VOR-EINTRITT': { wert: false, quelle: 'Annahme zu K1 (27.09.2026) — beide Stellungen gebaut' },
  'P-BILD-EMPFANG': { wert: 'nach_antwort', einheit: 'nach_antwort | bestaetigung | immer', quelle: 'Nr. 68' },
  'P-BILD-ANFRAGE-FRIST': { wert: 7 * TAG, einheit: 's', quelle: 'Vorschlag 27.09.2026' },
  'P-LOESCH-NACHLAUF': { wert: 14 * TAG, einheit: 's', quelle: 'Vorschlag 27.09.2026' },
  'P-VOLLJAEHRIG-EINSPRUCH': { wert: 7 * TAG, einheit: 's', quelle: 'Nr. 68, FV-17 Weg B, Vorbehalt K6' },
  'P-ALTER-NACHFRAGE': { wert: 365 * TAG, einheit: 's', quelle: 'Nr. 68, FV-23 Weg B' },
  'P-HASH-AKTIV': { wert: false, quelle: 'Beschluss 27.09.2026 — solange aus, kein Betrieb mit echten Menschen' },
  'P-UNTERSTUETZEN-MIN': { wert: 3, einheit: '€ im Monat', quelle: 'Nr. 67', spaeter: true },
  'P-VERANSTALTUNG-LOESCHUNG': { wert: 7 * TAG, einheit: 's', quelle: 'Nr. 82 (Vorschlag)', spaeter: true },
  'P-FREIGABE-VERTRAUEN': { wert: 5, quelle: 'Nr. 74 (Vorschlag)', spaeter: true },
  'P-SMS-SPERRE': { wert: { abstand: 60, proTag: 5 }, einheit: 's / Codes je Tag', quelle: 'Z-10 (Vorschlag)' },
  'P-ZONE-RADIUS': { wert: { min: 1, max: 5 }, einheit: 'km', quelle: 'FV-70' },
  'P-BLOCK-RUECKNAHME': { wert: 24 * STD, einheit: 's', quelle: 'Handbuch A (F61)' },
  'P-BLOCK-LEISTE': { wert: 10, einheit: 's', quelle: 'A-15 (S71.02)' },
  'P-ALARM-STORNO': { wert: 10, einheit: 's', quelle: 'FV-90', spaeter: true },
  'P-KARENZ': { wert: 30 * TAG, einheit: 's', quelle: 'Handbuch A (F68)' },
  'P-EXPORT-DAUER': { wert: 24 * STD, einheit: 's', quelle: 'FV-76' },
  'P-EXPORT-BEREIT': { wert: 7 * TAG, einheit: 's', quelle: 'FV-76' },
  'P-ZELLE-GROB': { wert: 2000, einheit: 'm', quelle: 'FV-01' },
  'P-ZELLE-NAH': { wert: 500, einheit: 'm', quelle: 'FV-01' },
  'P-STANDORT-TAKT': { wert: 60, einheit: 's', quelle: 'FV-02' },
  'P-STANDORT-SPRUNG-KMH': { wert: 1000, einheit: 'km/h', quelle: 'FV-02 („unplausible Sprünge“), FV-90' },
  'P-STATUS-GUTSCHRIFT': { wert: 30 * MIN, einheit: 's', quelle: 'Handbuch A (F73)', spaeter: true },
  'P-KLASS-UNTEN': { wert: 0.2, quelle: 'A-37 — in der Beta zu kalibrieren' },
  'P-KLASS-OBEN': { wert: 0.85, quelle: 'A-37 — in der Beta zu kalibrieren' },
  'P-PRUEFKETTE': { wert: 500, einheit: 'ms', quelle: 'A-37' },
  'P-FRIST-GRAU-TAG': { wert: 2 * STD, einheit: 's', quelle: 'A-37' },
  'P-FRIST-GRAU': { wert: 12 * STD, einheit: 's', quelle: 'A-37' },
  'P-TAGSUEBER': { wert: { von: 8, bis: 22 }, einheit: 'Uhr, Ortszeit Deutschland', quelle: 'FV-80' },
  'P-FRIST-MELDUNG': { wert: 24 * STD, einheit: 's', quelle: 'A-37' },
  'P-FRIST-EINSPRUCH-BILD': { wert: 48 * STD, einheit: 's', quelle: 'A-37' },
  'P-FRIST-WIDERSPRUCH': { wert: 72 * STD, einheit: 's', quelle: 'Handbuch A (Art. 22 DSGVO)' },
  'P-TREFFER-PRUEFUNG': { wert: 24 * STD, einheit: 's', quelle: 'FV-79' },
  'P-FALL-AUFBEWAHRUNG': { wert: 183 * TAG, einheit: 's (6 Monate)', quelle: 'FV-78' },
  'P-PROTOKOLL-DAUER': { wert: 365 * TAG, einheit: 's (mindestens 12 Monate)', quelle: 'A-37' },
  'P-AUTH-PAUSE': { wert: 30 * MIN, einheit: 's', quelle: 'FV-87' },
  'P-BEZAHL-MAU': { wert: 5000, quelle: 'Handbuch A (Bauplan Phase 2)', spaeter: true },
  'P-BEZAHL-PAUSE': { wert: 30 * TAG, einheit: 's', quelle: 'Handbuch A (Prinzip 1)', spaeter: true },

  /* Schalter, die an offenen Entscheidungen hängen — beide Stellungen gebaut */
  'P-STUFE2-SCHALTER': { wert: false, quelle: 'Nr. 1 (Z-03) — aus = keine Prüfung über Stufe 1 hinaus' },
  'P-ZONE2-ABGLEICH': { wert: false, quelle: 'Nr. 30 (M-09) — Hash-Abgleich in Zone 2' },
  'P-TREFFER-EINSCHRAENKUNG': { wert: false, quelle: 'Nr. 31 (M-04) — vorläufige Kontoeinschränkung bei Treffer' },

  /* Technische Werte ohne Grundlage in den Handbüchern (FV-90) */
  'P-ZEITZONE': { wert: 'Europe/Berlin', quelle: 'FV-80' },
  'P-RUHEZEIT': { wert: { von: 23, bis: 8 }, einheit: 'Uhr', quelle: 'Handbuch A (Mikro-UX)' },
  'P-PUSH-BUENDEL': { wert: 15 * MIN, einheit: 's je Absender', quelle: 'Handbuch A (Mikro-UX)' },
  'P-SITZUNG-DAUER': { wert: 30 * TAG, einheit: 's ohne Nutzung', quelle: 'FV-90' },
  'P-NEU-ANMELDUNG-EXPORT': { wert: 10 * MIN, einheit: 's (erneute Anmeldung vor dem Download)', quelle: 'FV-76, FV-90' },
  'P-TICKET-MAX': { wert: 4000, einheit: 'Zeichen', quelle: 'kontaktservice-und-tickets.md' },
  'P-TICKET-FRIST': { wert: 72 * STD, einheit: 's', quelle: 'F75 (Obergrenze 72 h)' },
  'P-TICKET-FRIST-DATENSCHUTZ': { wert: 30 * TAG, einheit: 's', quelle: 'Art. 12 Abs. 3 DSGVO' },
  'P-TICKET-AUFBEWAHRUNG': { wert: { hilfe: 90 * TAG, missbrauch: 365 * TAG }, einheit: 's nach Abschluss', quelle: 'D17 (Vorschlag)' },
  'P-ANMELDE-VERSUCHE': { wert: 10, einheit: 'Fehlversuche je Stunde und Netz', quelle: 'FV-90' },
  'P-REGISTRIERUNGEN-JE-NETZ': { wert: 20, einheit: 'je Tag', quelle: 'F02 (Begrenzung je Netzadresse), FV-90' },
} as const satisfies Record<string, ParamDef>;

export type ParamKey = keyof typeof PARAMETER;
type ParamValue<K extends ParamKey> = (typeof PARAMETER)[K]['wert'] extends boolean
  ? boolean
  : (typeof PARAMETER)[K]['wert'] extends number
    ? number
    : (typeof PARAMETER)[K]['wert'] extends string
      ? string
      : (typeof PARAMETER)[K]['wert'];

const overrides = new Map<string, unknown>();

/** Aktueller Wert eines Parameters (Überschreibung aus der Datenbank vor Vorgabe). */
export function p<K extends ParamKey>(key: K): ParamValue<K> {
  if (overrides.has(key)) return overrides.get(key) as ParamValue<K>;
  return PARAMETER[key].wert as ParamValue<K>;
}

export function setOverrides(rows: { key: string; value: unknown }[]) {
  overrides.clear();
  for (const r of rows) {
    if (r.key in PARAMETER) overrides.set(r.key, r.value);
  }
}

/** Nur für Tests. */
export function setParam<K extends ParamKey>(key: K, value: ParamValue<K>) {
  overrides.set(key, value);
}
export function clearParamOverrides() {
  overrides.clear();
}

export function allParams() {
  return Object.entries(PARAMETER).map(([key, def]) => ({
    key,
    vorgabe: def.wert,
    wert: overrides.has(key) ? overrides.get(key) : def.wert,
    quelle: def.quelle,
    einheit: (def as ParamDef).einheit ?? null,
    spaeter: (def as ParamDef).spaeter ?? false,
  }));
}
