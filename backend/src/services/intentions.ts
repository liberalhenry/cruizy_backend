/**
 * Absicht mit Ablauf (F14, FV-29, FV-30).
 *
 * Die Person wählt die Dauer aus P-ABSICHT-DAUERN; vorausgewählt ist der
 * bisherige Wert der Absicht. Eine Absicht ohne Ablauf gibt es nicht (AK-F14-07).
 * Hinweis zum Widerspruch in der Spezifikation: Der Standardwert von „Nur
 * schreiben“ (P-ABSICHT-SCHREIBEN, 7 Tage) ist länger als „dieses Wochenende“;
 * er bleibt als eigener, vorausgewählter Eintrag bestehen (AK-F14-06) — die
 * frei wählbaren Einträge sind durch den größten Listeneintrag begrenzt.
 */
import { p } from '../config/params.js';
import { fromLocal, inHourWindow, localParts, nextLocalHour } from '../lib/time.js';
import { INTENTIONS, type IntentionKey } from './catalogs.js';

const HOUR = 3600_000;

export type Duration = '1h' | '2h' | '4h' | '8h' | 'morgen' | 'wochenende' | 'abend' | 'schreiben';

export function durationEnd(d: Duration, nowD = new Date()): Date {
  switch (d) {
    case '1h':
      return new Date(nowD.getTime() + HOUR);
    case '2h':
      return new Date(nowD.getTime() + 2 * HOUR);
    case '4h':
      return new Date(nowD.getTime() + 4 * HOUR);
    case '8h':
      return new Date(nowD.getTime() + 8 * HOUR);
    case 'abend':
    case 'morgen':
      // bis zum nächsten Morgen, P-ABSICHT-ABEND Uhr (Ortszeit), mindestens eine Stunde
      return nextLocalHour(nowD, p('P-ABSICHT-ABEND'), HOUR);
    case 'wochenende': {
      // bis Montag früh nach dem kommenden Wochenende
      const l = localParts(nowD);
      const daysToMonday = (8 - l.weekday) % 7 || 7;
      const base = new Date(Date.UTC(l.year, l.month - 1, l.day + daysToMonday));
      return fromLocal(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate(), p('P-ABSICHT-ABEND'), 0);
    }
    case 'schreiben':
      return new Date(nowD.getTime() + p('P-ABSICHT-SCHREIBEN') * 1000);
  }
}

export function defaultDuration(key: IntentionKey): Duration {
  return INTENTIONS.find((i) => i.key === key)!.default as Duration;
}

/** Zulässige Dauern für eine Absicht: die Liste plus ihr Standardwert. */
export function allowedDurations(key: IntentionKey): Duration[] {
  const list = [...(p('P-ABSICHT-DAUERN') as readonly string[])] as Duration[];
  const def = defaultDuration(key);
  return list.includes(def) ? list : [def, ...list];
}

export function computeExpiry(key: IntentionKey, duration: Duration | undefined, nowD = new Date()): { end: Date; duration: Duration } {
  const d = duration ?? defaultDuration(key);
  if (!allowedDurations(key).includes(d)) throw new Error('Dauer nicht zulässig');
  const end = durationEnd(d, nowD);
  if (d !== defaultDuration(key)) {
    const list = (p('P-ABSICHT-DAUERN') as readonly string[]) as Duration[];
    const cap = Math.max(...list.map((x) => durationEnd(x, nowD).getTime()));
    if (end.getTime() > cap) return { end: new Date(cap), duration: d };
  }
  return { end, duration: d };
}

/** FV-30: zwischen 4 und 10 Uhr erscheint die Erneuerungsleiste nicht. */
export function renewalQuiet(nowD = new Date()): boolean {
  return inHourWindow(nowD, 4, 10);
}
