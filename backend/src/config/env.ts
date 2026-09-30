/**
 * Umgebungsvariablen. Alles, was je Installation verschieden ist (Adressen,
 * Schlüssel, Dienstleister), kommt von hier. Produktwerte (P-…) stehen in
 * params.ts und lassen sich ohne Codeänderung umstellen (AK-PA-01).
 */
import { z } from 'zod';

const bool = z
  .string()
  .optional()
  .transform((v) => v === '1' || v === 'true' || v === 'ja');

/**
 * Auswahlwert mit Übersetzung alter Werte: Die Attrappen aus dem früheren Testbetrieb gibt es nicht mehr.
 * Steht noch ein alter Wert in der .env, startet der Server trotzdem — mit dem sicheren Ersatz.
 */
function legacy<T extends string>(values: readonly [T, ...T[]], old: Record<string, T>, fallback: T) {
  return z
    .string()
    .optional()
    .transform((v) => (v && v in old ? old[v] : v || fallback))
    .pipe(z.enum(values));
}

const schema = z.object({
  NODE_ENV: z.string().default('production'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),

  /** Öffentliche Adresse der App, z. B. https://app.example.de */
  APP_URL: z.string().url().default('http://localhost:5173'),
  /** Eigene Adresse des Moderationswerkzeugs (M00: nicht unter der App-Adresse) */
  MOD_URL: z.string().url().default('http://localhost:5174'),

  DATABASE_URL: z.string().default('postgres://cruizy:cruizy@localhost:5432/cruizy_dev'),
  DATA_DIR: z.string().default('./data'),

  /** 32 Byte, Base64. Aus ihm werden alle Teilschlüssel abgeleitet (HKDF). */
  MASTER_KEY: z.string().min(40, 'MASTER_KEY fehlt oder ist zu kurz (32 Byte Base64)'),

  /** Wie die App hinter dem Proxy die Netzadresse erfährt */
  TRUST_PROXY: bool,
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((v) => v !== '0' && v !== 'false'),

  /* E-Mail über SMTP (EU-Dienst, z. B. Sweego). Leer = kein Versand; Adressen bestätigt dann das Team im Werkzeug. */
  SMTP_URL: z.string().default(''),
  MAIL_FROM: z.string().default('Benachrichtigung <no-reply@example.invalid>'),
  /**
   * Issue #9: voll = HTML-Mails mit Logo; dezent = gleiche Gestaltung ohne Logo und Namen.
   * Betreff und Vorschauzeile sind in beiden Fällen neutral (AK-F02-06).
   */
  MAIL_BRANDING: z.enum(['voll', 'dezent']).default('voll'),

  /*
   * Issue #32: Telegram-Bot statt SMS — Codes an Mobilnummern und (auf Wunsch) Mitteilungen.
   *   log     = kein Bot eingerichtet; Nummern bestätigt dann das Team im Werkzeug
   *   polling = der Server fragt Telegram selbst nach neuen Nachrichten an den Bot (Voreinstellung im Betrieb)
   *   webhook = Telegram liefert an {APP_URL}/api/telegram/webhook; TELEGRAM_WEBHOOK_SECRET ist dann Pflicht
   * TELEGRAM_BOT_NAME ist der Benutzername des Bots ohne @ (für die Links t.me/<name>).
   */
  TELEGRAM_MODE: z.enum(['log', 'polling', 'webhook']).default('log'),
  TELEGRAM_BOT_TOKEN: z.string().default(''),
  TELEGRAM_BOT_NAME: z
    .string()
    .default('')
    .transform((v) => v.trim().replace(/^@/, ''))
    .pipe(z.string().regex(/^(|[A-Za-z0-9_]{5,32})$/, 'TELEGRAM_BOT_NAME: Benutzername des Bots ohne @')),
  TELEGRAM_WEBHOOK_SECRET: z.string().default(''),
  TELEGRAM_API_URL: z.string().url().default('https://api.telegram.org'),

  /* Anmelden mit Apple (F03). Leer = Weg ausgeblendet. */
  APPLE_CLIENT_ID: z.string().default(''),
  APPLE_REDIRECT_URI: z.string().default(''),

  /* Web-Push (VAPID). Leer = Schlüssel werden beim ersten Start erzeugt und gespeichert. */
  VAPID_PUBLIC_KEY: z.string().default(''),
  VAPID_PRIVATE_KEY: z.string().default(''),
  VAPID_SUBJECT: z.string().default('mailto:technik@example.invalid'),

  /* Prüfpartner Altersprüfung (F04, Z-03) und Fotoprüfung (F06) */
  /**
   * ausweis = Ausweisbild, Auswertung des Geburtsdatums auf dem eigenen Server, unsicher → Team (Issue #7).
   *           Stufe 2 und Fotoprüfung prüft ohne Prüfpartner das Team im Werkzeug („Bestätigen“).
   * Frühere Werte (mock) gelten als ausweis.
   */
  AGE_PROVIDER: legacy(['ausweis'], { mock: 'ausweis' }, 'ausweis'),
  AGE_WEBHOOK_SECRET: z.string().default(''),

  /*
   * Issue #19: Gesichtsverifizierung für Cruizy Date über einen externen Anbieter (FaceVerificationProvider).
   * http = Anbieter über HTTP: POST multipart {selfie, reference, pose} → {match, livenessOk?, confidence?}
   * none = kein Anbieter → das Team vergleicht Selfie und erstes Foto im Werkzeug („Bestätigen“)
   * Frühere Werte (stub) gelten als none.
   */
  DATE_FACE_PROVIDER: legacy(['none', 'http'], { stub: 'none' }, 'none'),
  DATE_FACE_URL: z.string().default(''),
  DATE_FACE_HEADERS: z.string().default('{}'),

  /* Prüfkette (M-02) */
  // queue = jedes Bild prüft ein Mensch; http = selbst gehosteter Klassifikator (früher mock-allow → queue)
  CLASSIFIER: legacy(['queue', 'http'], { 'mock-allow': 'queue' }, 'queue'),
  CLASSIFIER_URL: z.string().default(''),
  // none = kein Abgleich → jedes Bild prüft ein Mensch; http = angebundener Abgleichdienst (früher mock → none)
  HASH_PROVIDER: legacy(['none', 'http'], { mock: 'none' }, 'none'),
  // Anbindung eines Abgleichdienstes: POST {hash, media?} → {hit, list}
  HASH_URL: z.string().default(''),
  HASH_HEADERS: z.string().default('{}'),
  /** Bauform der Stufe 1: hashes oder media (AK-M02-13) */
  HASH_TRANSFER: z.enum(['hash', 'media']).default('hash'),

  /* Eingang termine@ (F34): gemeinsames Geheimnis des Webhooks */
  INBOUND_MAIL_SECRET: z.string().default(''),
  // M60.05: Wochenzusammenfassung an beide Gründer (kommagetrennt)
  MOD_REPORT_MAIL: z.string().default(''),

  /* Karte: Adresse eines selbst betriebenen oder EU-Kachelservers. Leer = schematische Karte. */
  MAP_TILE_URL: z.string().default(''),
  MAP_ATTRIBUTION: z.string().default(''),
  /*
   * Issue #17: Kacheln eines EU-Kachelservers über den eigenen Server abrufen (mit Zwischenspeicher),
   * z. B. https://tile.openstreetmap.de/{z}/{x}/{y}.png (FOSSGIS e. V., Deutschland). Die Geräte
   * sprechen dann nur mit uns — der Kachelserver sieht weder Netzadressen noch Sitzungen.
   * Leer = Grundkarte ohne Kacheln (Ländergrenzen und Ortsnamen aus dem eigenen Verzeichnis).
   */
  MAP_TILE_UPSTREAM: z.string().default(''),
  MAP_TILE_UPSTREAM_ATTRIBUTION: z.string().default('© OpenStreetMap-Mitwirkende'),

  /*
   * Discord-Webhooks (Issue #6): je Kategorie ein Kanal. Leer = Kategorie aus bzw. DEFAULT.
   * Gesendet werden nie personenbezogene Daten von Nutzern (siehe services/discord.ts).
   */
  DISCORD_WEBHOOK_DEFAULT: z.string().default(''),
  DISCORD_WEBHOOK_MODERATION: z.string().default(''),
  DISCORD_WEBHOOK_MELDUNGEN: z.string().default(''),
  DISCORD_WEBHOOK_SICHERHEIT: z.string().default(''),
  DISCORD_WEBHOOK_TEAM: z.string().default(''),
  DISCORD_WEBHOOK_KONTEN: z.string().default(''),
  DISCORD_WEBHOOK_ALTERSPRUEFUNG: z.string().default(''),
  DISCORD_WEBHOOK_SYSTEM: z.string().default(''),

  /* Aktualisierung per Knopf (Issue #5): Quelle der Releases, Token nur für private Repositorys */
  UPDATE_REPO: z
    .string()
    .default('')
    .transform((v) => v.trim() || 'liberalhenry/cruizy_backend')
    .pipe(z.string().regex(/^[\w.-]+\/[\w.-]+$/, 'UPDATE_REPO: Form besitzer/repository')),
  GITHUB_TOKEN: z.string().default(''),

  LOG_LEVEL: z.string().default('info'),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Konfiguration unvollständig:\n${msg}`);
  }
  cached = parsed.data;
  return cached;
}

/** Nur für Tests: Umgebung neu einlesen. */
export function resetEnvCache() {
  cached = null;
}

