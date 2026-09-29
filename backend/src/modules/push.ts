import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { q } from '../db/pool.js';
import { requireMember } from '../lib/context.js';
import { body } from '../lib/http.js';
import { vapidPublicKey } from '../services/push.js';

/** Web-Push-Anmeldung — erst nach der eigenen Erklärung (S14) beim ersten Senden (AK-Q06-07/08). */
export default async function pushRoutes(app: FastifyInstance) {
  app.get('/api/push/key', async () => ({ key: vapidPublicKey() }));

  app.post('/api/push/subscribe', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true, allowSuspended: true });
    const b = body(
      req,
      z.object({
        endpoint: z.string().url().max(1000),
        keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }),
      }),
    );
    await q(
      `INSERT INTO push_subscriptions (account_id, session_id, endpoint, p256dh, auth) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (endpoint) DO UPDATE SET account_id = $1, session_id = $2, p256dh = $4, auth = $5`,
      [a.id, a.sessionId, b.endpoint, b.keys.p256dh, b.keys.auth],
    );
    return { ok: true };
  });

  app.post('/api/push/unsubscribe', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true, allowSuspended: true });
    const b = body(req, z.object({ endpoint: z.string().max(1000) }));
    await q(`DELETE FROM push_subscriptions WHERE account_id = $1 AND endpoint = $2`, [a.id, b.endpoint]);
    return { ok: true };
  });
}
