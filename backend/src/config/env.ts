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

  /**
   * test = nur erfundene Testdaten, Registrierung nur mit Einladungscode.
   * live = Betrieb mit echten Menschen. Nur zulässig, wenn der Hash-Abgleich
   * angebunden ist (P-HASH-AKTIV) — AK-M02-11, Nr. 98 Weg (b).
   */
  OPERATION_MODE: z.enum(['test', 'live']).default('test'),
  TEST_INVITE_CODE: z.string().default(''),

  /** Wie die App hinter dem Proxy die Netzadresse erfährt */
  TRUST_PROXY: bool,
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((v) => v !== '0' && v !== 'false'),

  /* E-Mail über SMTP (EU-Dienst, z. B. Sweego). Leer = Ausgabe ins Protokoll (nur Testbetrieb). */
  SMTP_URL: z.string().default(''),
  MAIL_FROM: z.string().default('Benachrichtigung <no-reply@example.invalid>'),
  /**
   * Issue #9: voll = HTML-Mails mit Logo; dezent = gleiche Gestaltung ohne Logo und Namen.
   * Betreff und Vorschauzeile sind in beiden Fällen neutral (AK-F02-06).
   */
  MAIL_BRANDING: z.enum(['voll', 'dezent']).default('voll'),

  /*
   * SMS: 'log' (nur Testbetrieb) oder 'http' — ein beliebiger EU-Versanddienst per
   * JSON-POST. Vorlage für Sweego (api.sweego.io/send) steht in .env.example;
   * {to}, {text} und {sender} werden ersetzt. So lässt sich der Dienst ohne
   * Codeänderung wechseln.
   */
  SMS_PROVIDER: z.enum(['log', 'http']).default('log'),
  SMS_HTTP_URL: z.string().default(''),
  SMS_HTTP_HEADERS: z.string().default('{}'),
  SMS_HTTP_BODY: z.string().default(''),
  SMS_SENDER: z.string().default('Info'),

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
   * mock    = Attrappe eines Prüfpartners, nur im Testbetrieb.
   */
  AGE_PROVIDER: z.enum(['ausweis', 'mock']).default('ausweis'),
  AGE_WEBHOOK_SECRET: z.string().default(''),

  /* Prüfkette (M-02) */
  CLASSIFIER: z.enum(['queue', 'http', 'mock-allow']).default('queue'),
  CLASSIFIER_URL: z.string().default(''),
  HASH_PROVIDER: z.enum(['none', 'mock', 'http']).default('none'),
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

export const isTestMode = () => env().OPERATION_MODE === 'test';
