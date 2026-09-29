/**
 * Echtzeit-Verbindung (F41: Zustellung innerhalb von P-CHAT-LATENZ).
 * Der Client meldet nur „aktiv“, solange die App im Vordergrund ist (FV-35) —
 * nie, dass er Nachrichten angezeigt hat oder tippt (AK-F52-03).
 */
import type { FastifyInstance } from 'fastify';
import { loadAccount } from '../lib/context.js';
import { touchActivity } from '../services/activity.js';
import { addSocket, removeSocket } from '../services/hub.js';

export default async function realtimeRoutes(app: FastifyInstance) {
  app.get('/api/ws', { websocket: true }, async (socket, req) => {
    const acc = await loadAccount(req);
    if (!acc || !acc.consented) {
      socket.close(4001, 'nicht angemeldet');
      return;
    }
    addSocket(acc.id, socket);
    socket.send(JSON.stringify({ e: 'hallo', d: {} }));
    socket.on('message', (raw: Buffer | string) => {
      let msg: { e?: string };
      try {
        msg = JSON.parse(String(raw));
      } catch {
        return;
      }
      if (msg.e === 'aktiv') touchActivity(acc.id).catch(() => {});
      if (msg.e === 'ping') socket.send(JSON.stringify({ e: 'pong', d: {} }));
    });
    socket.on('close', () => removeSocket(acc.id, socket));
  });
}
