/**
 * Mitteilungen per Web-Push (Q-06).
 *  * gebündelt: höchstens eine je Absender in P-PUSH-BUENDEL (AK-Q06-03)
 *  * Ruhezeit 23–8 Uhr voreingestellt (AK-Q06-04) — außer Check-in-Rückfragen
 *  * ohne Namen, Vorschau und Produktnamen, solange die Person das nicht ändert (AK-Q06-06)
 *  * nie für Anfragen (AK-Q06-05) — das entscheidet der Aufrufer
 */
import webpush from 'web-push';
import { env } from '../config/env.js';
import { p } from '../config/params.js';
import { one, q } from '../db/pool.js';
import { decrypt, encrypt } from '../lib/crypto.js';
import { inHourWindow } from '../lib/time.js';

let configured = false;
let publicKey = '';

export async function initPush() {
  const e = env();
  let pub = e.VAPID_PUBLIC_KEY;
  let priv = e.VAPID_PRIVATE_KEY;
  if (!pub || !priv) {
    const row = await one(`SELECT value FROM app_secrets WHERE key = 'vapid'`);
    if (row) {
      const j = JSON.parse(decrypt('pii', row.value, 'vapid').toString());
      pub = j.pub;
      priv = j.priv;
    } else {
      const k = webpush.generateVAPIDKeys();
      pub = k.publicKey;
      priv = k.privateKey;
      await q(`INSERT INTO app_secrets (key, value) VALUES ('vapid', $1) ON CONFLICT (key) DO NOTHING`, [
        encrypt('pii', JSON.stringify({ pub, priv }), 'vapid'),
      ]);
    }
  }
  webpush.setVapidDetails(e.VAPID_SUBJECT, pub, priv);
  publicKey = pub;
  configured = true;
}

export function vapidPublicKey() {
  return publicKey;
}

export type PushKind = 'message' | 'notice' | 'checkin' | 'event' | 'photo';

export interface PushPayload {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
}

/** Für Tests einsehbar */
export const sentPushes: { accountId: string; payload: PushPayload; kind: PushKind }[] = [];

export async function sendPush(accountId: string, kind: PushKind, payload: PushPayload, senderId?: string): Promise<boolean> {
  const prof = await one(
    `SELECT push_enabled, quiet_from, quiet_to FROM profiles WHERE account_id = $1`,
    [accountId],
  );
  if (!prof || !prof.push_enabled) return false;
  const nowD = new Date();
  if (kind !== 'checkin' && inHourWindow(nowD, prof.quiet_from, prof.quiet_to)) return false;
  if (kind === 'message' && senderId) {
    const r = await one(
      `INSERT INTO push_bundles (recipient_id, sender_id, sent_at) VALUES ($1, $2, now())
       ON CONFLICT (recipient_id, sender_id) DO UPDATE SET sent_at = now()
         WHERE push_bundles.sent_at < now() - make_interval(secs => $3)
       RETURNING 1 AS ok`,
      [accountId, senderId, p('P-PUSH-BUENDEL')],
    );
    if (!r) return false;
  }
  const subs = await q(`SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE account_id = $1`, [accountId]);
  if (!subs.length) return false;
  sentPushes.push({ accountId, payload, kind });
  if (sentPushes.length > 500) sentPushes.shift();
  if (!configured || env().NODE_ENV === 'test') return true;
  const body = JSON.stringify({ ...payload, kind });
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, {
          TTL: kind === 'checkin' ? 600 : 3600,
          urgency: kind === 'checkin' ? 'high' : 'normal',
        });
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await q('DELETE FROM push_subscriptions WHERE id = $1', [s.id]);
      }
    }),
  );
  return true;
}
