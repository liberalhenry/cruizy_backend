/**
 * Terminparser für termine@ (F34, FV-52) — selbst gehostet, regelbasiert,
 * nur ein Vorschlag. Ein Mensch prüft, korrigiert und gibt frei (AK-F34-01).
 */
import { fromLocal, localParts } from '../lib/time.js';

const MONTHS: Record<string, number> = {
  januar: 1, jan: 1, februar: 2, feb: 2, märz: 3, maerz: 3, mär: 3, mrz: 3, april: 4, apr: 4, mai: 5, juni: 6, jun: 6,
  juli: 7, jul: 7, august: 8, aug: 8, september: 9, sep: 9, sept: 9, oktober: 10, okt: 10, november: 11, nov: 11, dezember: 12, dez: 12,
};

export interface ParsedEvent {
  title: string | null;
  start: string | null; // ISO
  end: string | null;
  dateFound: boolean;
  timeFound: boolean;
}

export function parseEventMail(subject: string, text: string, nowD = new Date()): ParsedEvent {
  const hay = `${subject}\n${text}`;
  const today = localParts(nowD);
  let day: number | null = null;
  let month: number | null = null;
  let year: number | null = null;

  const numeric = /\b(\d{1,2})\.(\d{1,2})\.(\d{2,4})?/.exec(hay);
  const named = new RegExp(`\\b(\\d{1,2})\\.?\\s*(${Object.keys(MONTHS).join('|')})\\.?\\s*(\\d{4})?`, 'i').exec(hay);
  if (numeric && Number(numeric[2]) >= 1 && Number(numeric[2]) <= 12) {
    day = Number(numeric[1]);
    month = Number(numeric[2]);
    year = numeric[3] ? Number(numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3]) : null;
  } else if (named) {
    day = Number(named[1]);
    month = MONTHS[named[2].toLowerCase()];
    year = named[3] ? Number(named[3]) : null;
  }
  if (day && month && !year) {
    year = today.year;
    if (month < today.month || (month === today.month && day < today.day)) year += 1;
  }

  let startH: number | null = null;
  let startM = 0;
  let endH: number | null = null;
  let endM = 0;
  const range = /\b(\d{1,2})[:.](\d{2})\s*(?:uhr)?\s*(?:-|–|bis)\s*(\d{1,2})[:.](\d{2})/i.exec(hay);
  const single = /\b(?:ab|um|beginn:?|einlass:?)?\s*(\d{1,2})(?:[:.](\d{2}))?\s*uhr\b/i.exec(hay);
  const clock = /\b(\d{1,2}):(\d{2})\b/.exec(hay);
  if (range) {
    startH = Number(range[1]);
    startM = Number(range[2]);
    endH = Number(range[3]);
    endM = Number(range[4]);
  } else if (single) {
    startH = Number(single[1]);
    startM = single[2] ? Number(single[2]) : 0;
  } else if (clock) {
    startH = Number(clock[1]);
    startM = Number(clock[2]);
  }
  if (startH !== null && (startH > 23 || startM > 59)) startH = null;

  let start: Date | null = null;
  let end: Date | null = null;
  if (day && month && year) {
    start = fromLocal(year, month, day, startH ?? 20, startH !== null ? startM : 0);
    if (endH !== null) {
      end = fromLocal(year, month, day, endH, endM);
      if (end <= start) end = new Date(end.getTime() + 24 * 3600_000);
    } else {
      end = new Date(start.getTime() + 4 * 3600_000);
    }
  }
  const title = (subject || text.split('\n').find((l) => l.trim().length > 3) || '').replace(/^(fwd?|wg|aw|re):\s*/i, '').trim().slice(0, 120) || null;
  return {
    title,
    start: start?.toISOString() ?? null,
    end: end?.toISOString() ?? null,
    dateFound: !!(day && month),
    timeFound: startH !== null,
  };
}
