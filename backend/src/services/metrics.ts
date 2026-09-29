/**
 * Kennzahlen serverseitig aus Ereignissen, die ohnehin anfallen (FV-07, Q-16).
 * Einzelereignisse gehören zum Konto und werden mit ihm gelöscht (FV-09).
 */
import { q, type Queryable, db } from '../db/pool.js';

export type MetricKind = 'user_created' | 'app_open' | 'message_sent' | 'contact' | 'first_message';

export async function metric(accountId: string, kind: MetricKind, client: Queryable = db()) {
  await q(`INSERT INTO metric_events (account_id, kind) VALUES ($1, $2)`, [accountId, kind], client);
}
