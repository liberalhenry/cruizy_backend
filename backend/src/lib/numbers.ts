import type { Queryable } from '../db/pool.js';
import { db } from '../db/pool.js';

/**
 * Fall- und Vorgangsnummern: Präfix, Jahr, laufende Nummer (FV-91).
 * Kein Datum genauer als das Jahr, keine Kontokennung, keine Kategorie.
 *   H = Hilfe und Kontakt · M = Meldung · E = Einspruch/Widerspruch · T = Hash-Treffer · O = Ort
 */
export async function nextNumber(prefix: 'H' | 'M' | 'E' | 'T' | 'O', client: Queryable = db()): Promise<string> {
  const year = new Date().getUTCFullYear();
  const r = await client.query(
    `INSERT INTO counters (kind, year, value) VALUES ($1, $2, 1)
     ON CONFLICT (kind, year) DO UPDATE SET value = counters.value + 1
     RETURNING value`,
    [prefix, year],
  );
  const n = r.rows[0].value as number;
  // Die Zahl beginnt nicht bei 1, damit sie nichts über die Menge verrät
  const scrambled = (n * 7919 + 104729) % 1_000_000;
  return `${prefix}-${year}-${String(scrambled).padStart(6, '0')}`;
}
