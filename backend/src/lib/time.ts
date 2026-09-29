/**
 * Zeit in der Ortszeit (Europe/Berlin, P-ZEITZONE). Keine Bibliothek nötig:
 * Intl liefert die Ortszeit-Bestandteile, daraus lassen sich Wandzeiten bauen.
 */
import { p } from '../config/params.js';

export interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 1 = Montag … 7 = Sonntag
}

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function fmt(tz: string) {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'short',
      hourCycle: 'h23',
    });
    fmtCache.set(tz, f);
  }
  return f;
}

const WD: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

export function localParts(d: Date, tz = p('P-ZEITZONE')): LocalParts {
  const parts = Object.fromEntries(fmt(tz).formatToParts(d).map((x) => [x.type, x.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: WD[parts.weekday as string] ?? 1,
  };
}

/** Versatz der Zeitzone zu UTC in Minuten für einen Zeitpunkt. */
function offsetMinutes(d: Date, tz: string): number {
  const l = localParts(d, tz);
  const asUtc = Date.UTC(l.year, l.month - 1, l.day, l.hour, l.minute);
  return Math.round((asUtc - Math.floor(d.getTime() / 60000) * 60000) / 60000);
}

/** Zeitpunkt zu einer Ortszeit (Jahr, Monat, Tag, Stunde) — sommerzeitfest. */
export function fromLocal(year: number, month: number, day: number, hour: number, minute = 0, tz = p('P-ZEITZONE')): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const off1 = offsetMinutes(guess, tz);
  const first = new Date(guess.getTime() - off1 * 60000);
  const off2 = offsetMinutes(first, tz);
  return off1 === off2 ? first : new Date(guess.getTime() - off2 * 60000);
}

/** Nächster Zeitpunkt „Stunde h Ortszeit“, der mindestens `minAheadMs` in der Zukunft liegt. */
export function nextLocalHour(now: Date, hour: number, minAheadMs = 0, tz = p('P-ZEITZONE')): Date {
  const l = localParts(now, tz);
  for (let add = 0; add < 4; add++) {
    const base = new Date(Date.UTC(l.year, l.month - 1, l.day + add));
    const cand = fromLocal(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate(), hour, 0, tz);
    if (cand.getTime() - now.getTime() >= minAheadMs) return cand;
  }
  return new Date(now.getTime() + 24 * 3600_000);
}

export function sameLocalDay(a: Date, b: Date, tz = p('P-ZEITZONE')): boolean {
  const x = localParts(a, tz);
  const y = localParts(b, tz);
  return x.year === y.year && x.month === y.month && x.day === y.day;
}

export function localDateString(d: Date, tz = p('P-ZEITZONE')): string {
  const l = localParts(d, tz);
  return `${l.year}-${String(l.month).padStart(2, '0')}-${String(l.day).padStart(2, '0')}`;
}

/** ISO-Kalenderwoche, z. B. „2026-W40“ (F19: Wertung je Kalenderwoche). */
export function isoWeek(d: Date, tz = p('P-ZEITZONE')): string {
  const l = localParts(d, tz);
  const date = new Date(Date.UTC(l.year, l.month - 1, l.day));
  const dayNum = l.weekday;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Liegt die Ortszeit im Fenster [von, bis) — über Mitternacht erlaubt (z. B. 23–8 Uhr). */
export function inHourWindow(d: Date, von: number, bis: number, tz = p('P-ZEITZONE')): boolean {
  const h = localParts(d, tz).hour;
  return von <= bis ? h >= von && h < bis : h >= von || h < bis;
}

export const addSeconds = (d: Date, s: number) => new Date(d.getTime() + s * 1000);
export const now = () => new Date();
