/**
 * Systemtexte mit ID (Q-15) — dieselben Dateien wie im Server.
 * t('ST-KON-01') oder t('UI-…', { name: 'Kai' }).
 */
import de from '@texts/de.json';
import ui from '@texts/ui-de.json';

type TextFile = Record<string, { t: string; s: string }>;
const all: Record<string, string> = {};
for (const f of [de as TextFile, ui as TextFile]) for (const [k, v] of Object.entries(f)) all[k] = v.t;

export function t(id: string, vars: Record<string, string | number | null | undefined> = {}): string {
  const s = all[id];
  if (s === undefined) {
    if (import.meta.env.DEV) console.warn(`Text ${id} fehlt`);
    return id;
  }
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : `{${k}}`));
}

export function has(id: string) {
  return id in all;
}

/** Texte mit Auswahl „A · B · C“ (z. B. ST-CHK-04) als Liste. */
export function parts(id: string): string[] {
  return t(id)
    .split('·')
    .map((x) => x.trim())
    .filter(Boolean);
}

/** Entfernt Schaltflächen-Markierungen wie „[Zulassen]“ aus Entwurfstexten. */
export function plain(id: string, vars: Record<string, string | number> = {}) {
  return t(id, vars).replace(/\s*\[[^\]]+\]/g, '').trim();
}

export function bracketed(id: string): string[] {
  return [...t(id).matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]);
}

export const BAND_TEXT: Record<number, string> = { 1: 'ST-STO-10', 2: 'ST-STO-11', 3: 'ST-STO-12', 4: 'ST-STO-13' };
export const ACTIVITY_TEXT: Record<number, string> = { 1: 'ST-STO-20', 2: 'ST-STO-21', 3: 'ST-STO-22', 4: 'ST-STO-23', 5: 'ST-STO-24' };
export const RESPONSE_TEXT: Record<number, string> = { 1: 'ST-PRO-10', 2: 'ST-PRO-11', 3: 'ST-PRO-12' };
export const INTENTION_TEXT: Record<string, string> = { abend: 'ST-PRO-02', schreiben: 'ST-PRO-03', absicht3: 'ST-PRO-04', absicht4: 'ST-PRO-05' };

export function fmtDate(d: string | Date | null | undefined, withTime = false) {
  if (!d) return '';
  const x = new Date(d);
  return x.toLocaleString('de-DE', withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' });
}

export function fmtTime(d: string | Date) {
  return new Date(d).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

/** Zeitangabe für Gesprächslisten: heute Uhrzeit, sonst Datum. */
export function fmtWhen(d: string | Date) {
  const x = new Date(d);
  const now = new Date();
  if (x.toDateString() === now.toDateString()) return fmtTime(x);
  return x.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}
