/**
 * Ereignisse an Discord-Webhooks (Issue #6) — je Kategorie ein eigener Kanal.
 *
 * Einstellungen (.env): DISCORD_WEBHOOK_<KATEGORIE>; fehlt eine Kategorie, gilt
 * DISCORD_WEBHOOK_DEFAULT; ist beides leer, wird für diese Kategorie nichts gesendet.
 *
 * Datenschutz — Discord ist ein Dienst außerhalb der EU:
 *  * KEINE personenbezogenen Daten der Nutzer: keine Namen, E-Mail-Adressen, Telefonnummern,
 *    Konto-Kennungen, Netzadressen, Inhalte, Nachrichten oder Bilder.
 *  * KEINE Begründungstexte aus dem Zugriffsprotokoll (sie können Personenbezug haben).
 *  * Gesendet werden nur: Art des Ereignisses, Fall-/Vorgangsnummer, Name der handelnden
 *    Person aus dem Team, Zeitpunkt, Betriebsart und einfache Zähl- oder Zustandswerte.
 *
 * Versand im Hintergrund, der Reihe nach, mit Wiederholung bei 429/5xx. Ein Fehler beim
 * Versand ändert nie den Ablauf in der App — er landet nur im Serverprotokoll.
 */
import { env } from '../config/env.js';

export const DISCORD_CATEGORIES = ['moderation', 'meldungen', 'sicherheit', 'team', 'konten', 'alterspruefung', 'system'] as const;
export type DiscordCategory = (typeof DISCORD_CATEGORIES)[number];
export type DiscordLevel = 'info' | 'ok' | 'warn' | 'danger';

export interface DiscordEvent {
  title: string;
  description?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
  level?: DiscordLevel;
}

const COLOR: Record<DiscordLevel, number> = {
  info: 0x5aa9ff, // Akzent aus dem Corporate Design
  ok: 0x5fd0a4,
  warn: 0xf0b429,
  danger: 0xff6b6b,
};

const LABEL: Record<DiscordCategory, string> = {
  moderation: 'Moderation',
  meldungen: 'Meldungen',
  sicherheit: 'Sicherheit',
  team: 'Team',
  konten: 'Konten',
  alterspruefung: 'Altersprüfung',
  system: 'System',
};

type Transport = (url: string, payload: unknown) => Promise<{ status: number; retryAfterMs?: number }>;

const defaultTransport: Transport = async (url, payload) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8000),
  });
  let retryAfterMs: number | undefined;
  if (res.status === 429) {
    const j = (await res.json().catch(() => null)) as { retry_after?: number } | null;
    retryAfterMs = Math.ceil((j?.retry_after ?? Number(res.headers.get('retry-after') ?? 1)) * 1000);
  }
  return { status: res.status, retryAfterMs };
};

let transport: Transport = defaultTransport;
/** Nur für Tests: Versand abfangen. */
export function setDiscordTransport(t: Transport | null) {
  transport = t ?? defaultTransport;
}

export function webhookFor(cat: DiscordCategory): string {
  const e = env();
  const own: Record<DiscordCategory, string> = {
    moderation: e.DISCORD_WEBHOOK_MODERATION,
    meldungen: e.DISCORD_WEBHOOK_MELDUNGEN,
    sicherheit: e.DISCORD_WEBHOOK_SICHERHEIT,
    team: e.DISCORD_WEBHOOK_TEAM,
    konten: e.DISCORD_WEBHOOK_KONTEN,
    alterspruefung: e.DISCORD_WEBHOOK_ALTERSPRUEFUNG,
    system: e.DISCORD_WEBHOOK_SYSTEM,
  };
  return own[cat] || e.DISCORD_WEBHOOK_DEFAULT;
}

const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
// Erwähnungen wie @everyone unschädlich machen
const clean = (s: string) => s.replace(/@(everyone|here)/g, '@​$1');

export function buildPayload(cat: DiscordCategory, ev: DiscordEvent) {
  const e = env();
  return {
    username: 'Cruizy',
    allowed_mentions: { parse: [] as string[] },
    embeds: [
      {
        title: cut(clean(ev.title), 256),
        description: ev.description ? cut(clean(ev.description), 2000) : undefined,
        color: COLOR[ev.level ?? 'info'],
        fields: (ev.fields ?? []).slice(0, 20).map((f) => ({ name: cut(clean(f.name), 256), value: cut(clean(f.value || '—'), 1024), inline: f.inline ?? true })),
        footer: { text: `${LABEL[cat]} · ${e.OPERATION_MODE === 'live' ? 'Echtbetrieb' : 'Testbetrieb'} · ${new URL(e.APP_URL).host}` },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

const queue: { url: string; payload: unknown; tries: number }[] = [];
let running = false;
const MAX_QUEUE = 500;

async function drain() {
  if (running) return;
  running = true;
  try {
    while (queue.length) {
      const job = queue[0];
      let res: { status: number; retryAfterMs?: number };
      try {
        res = await transport(job.url, job.payload);
      } catch {
        res = { status: 0 };
      }
      if (res.status >= 200 && res.status < 300) {
        queue.shift();
        continue;
      }
      job.tries++;
      const retry = (res.status === 429 || res.status === 0 || res.status >= 500) && job.tries < 4;
      if (!retry) {
        queue.shift();
        console.error(`Discord-Webhook: Versand fehlgeschlagen (Status ${res.status})`);
        continue;
      }
      await new Promise((r) => setTimeout(r, Math.min(res.retryAfterMs ?? 1000 * 2 ** job.tries, 30_000)).unref?.());
    }
  } finally {
    running = false;
  }
}

/** Ereignis melden — kehrt sofort zurück, wirft nie. */
export function discord(cat: DiscordCategory, ev: DiscordEvent): void {
  try {
    const url = webhookFor(cat);
    if (!url) return;
    if (queue.length >= MAX_QUEUE) queue.shift();
    queue.push({ url, payload: buildPayload(cat, ev), tries: 0 });
    void drain();
  } catch (e) {
    console.error('Discord-Webhook:', (e as Error).message);
  }
}

/** Nur für Tests: warten, bis die Warteschlange leer ist. */
export async function discordFlush() {
  for (let i = 0; i < 200 && (queue.length || running); i++) await new Promise((r) => setTimeout(r, 5));
}

/** Lesbare Bezeichnung einer Handlung aus dem Zugriffsprotokoll. */
export function actionLabel(action: string): string {
  return action.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
}
