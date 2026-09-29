/**
 * Stufe 2 der Altersprüfung (Z-03). Beide Stellungen des Schalters sind gebaut (Nr. 1).
 *
 * PRÜFUNG ERFORDERLICH.
 *
 *  * Schalter aus → keine Funktion verlangt mehr als Stufe 1 (AK-Z03-01).
 *  * Schalter an → jedes Bild in Zone 2 verlangt Stufe 2, in beide Richtungen
 *    (FV-85), und vor dem ersten Zugriff je Sitzung sowie nach P-AUTH-PAUSE eine
 *    Bestätigung mit dem gerätegebundenen Schlüssel (FV-87, AK-Z03-07).
 *  * Text verlangt nie Stufe 2 (AK-Z03-11).
 */
import { p } from '../config/params.js';
import { q } from '../db/pool.js';
import type { AccountCtx } from '../lib/context.js';

export function stage2Required(): boolean {
  return !!p('P-STUFE2-SCHALTER');
}

/** Darf diese Sitzung jetzt Medien in Zone 2 sehen oder senden? */
export async function stage2Satisfied(acc: AccountCtx): Promise<boolean> {
  if (!stage2Required()) return true;
  if (!acc.age2) return false;
  if (!acc.stage2AuthAt) return false;
  const age = Date.now() - acc.stage2AuthAt.getTime();
  if (age > p('P-AUTH-PAUSE') * 1000) return false;
  // Aktivität verlängert die Pause
  if (age > 60_000) await q(`UPDATE device_sessions SET stage2_auth_at = now() WHERE id = $1`, [acc.sessionId]);
  return true;
}

export type Stage2State = 'nicht_noetig' | 'pruefung_noetig' | 'bestaetigung_noetig' | 'offen';

export function stage2State(acc: AccountCtx): Stage2State {
  if (!stage2Required()) return 'nicht_noetig';
  if (!acc.age2) return 'pruefung_noetig';
  if (!acc.stage2AuthAt || Date.now() - acc.stage2AuthAt.getTime() > p('P-AUTH-PAUSE') * 1000) return 'bestaetigung_noetig';
  return 'offen';
}
