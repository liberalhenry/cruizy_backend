/**
 * Zuletzt aktiv (F20): Zeitpunkt nur auf dem Server, höchstens einmal je
 * P-AKTIV-TAKT geschrieben (FV-35). Clients erhalten nur das Band.
 */
import { p } from '../config/params.js';
import { q } from '../db/pool.js';

const lastWrite = new Map<string, number>();

export async function touchActivity(accountId: string) {
  const nowMs = Date.now();
  const last = lastWrite.get(accountId) ?? 0;
  if (nowMs - last < p('P-AKTIV-TAKT') * 1000) return;
  lastWrite.set(accountId, nowMs);
  await q(
    `UPDATE accounts SET last_active_at = now()
      WHERE id = $1 AND (last_active_at IS NULL OR last_active_at < now() - make_interval(secs => $2))`,
    [accountId, p('P-AKTIV-TAKT')],
  );
}

export function forgetActivity(accountId: string) {
  lastWrite.delete(accountId);
}
