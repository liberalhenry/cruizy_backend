/**
 * Nutzungsberechtigungen (Z-05, Phase 2). Im MVP gibt es keinen Kauf; die
 * Tabelle trägt Berechtigungen, die das Moderationswerkzeug (BETRIEB) für
 * Tests vergeben kann. Schutzfunktionen fragen den Abo-Status NIE ab (Q-04,
 * AK-Q04-01) — erlaubt ist die Abfrage nur in: Zonen-Wirkung „unsichtbar“
 * (Komfort nach Nr. 48) und Ersatzpunkt über 30 km (Travel, Nr. 77/85).
 */
import { one } from '../db/pool.js';

export async function hasTier(accountId: string, tier: 'plus' | 'pro'): Promise<boolean> {
  const tiers = tier === 'plus' ? ['plus', 'pro'] : ['pro'];
  const r = await one(
    `SELECT 1 FROM entitlements WHERE account_id = $1 AND tier = ANY($2) AND valid_until > now() LIMIT 1`,
    [accountId, tiers],
  );
  return !!r;
}
