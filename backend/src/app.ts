import Fastify, { LogController, type FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import websocket from '@fastify/websocket';
import { ZodError } from 'zod';
import { env } from './config/env.js';
import { p } from './config/params.js';
import { AppError } from './lib/errors.js';
import { discord } from './services/discord.js';

import authRoutes from './modules/auth.js';
import guestRoutes from './modules/guest.js';
import publicRoutes from './modules/public.js';
import profileRoutes from './modules/profile.js';
import photoRoutes from './modules/photos.js';
import mediaRoutes from './modules/media.js';
import locationRoutes from './modules/location.js';
import discoveryRoutes from './modules/discovery.js';
import verificationRoutes from './modules/verification.js';
import idVerificationRoutes from './modules/id-verification.js';
import chatRoutes from './modules/chat.js';
import albumRoutes from './modules/album.js';
import safetyRoutes from './modules/safety.js';
import reportRoutes from './modules/reports.js';
import noticeRoutes from './modules/notices.js';
import checkinRoutes from './modules/checkin.js';
import placeRoutes from './modules/places.js';
import eventRoutes from './modules/events.js';
import dataRoutes from './modules/data-account.js';
import helpRoutes from './modules/help.js';
import pushRoutes from './modules/push.js';
import realtimeRoutes from './modules/realtime.js';
import modRoutes from './modules/mod/index.js';

export async function buildApp(): Promise<FastifyInstance> {
  const e = env();
  const app = Fastify({
    trustProxy: e.TRUST_PROXY,
    bodyLimit: 2 * 1024 * 1024,
    // Bild-Token sind länger als die Vorgabe von 100 Zeichen
    routerOptions: { maxParamLength: 2048 },
    // Keine Netzadressen und keine Bild-Token im Protokoll (Datenminimierung)
    logger:
      e.NODE_ENV === 'test'
        ? false
        : {
            level: e.LOG_LEVEL,
            serializers: {
              req: (r) => ({ method: r.method, url: String(r.url).split('?')[0].replace(/\/img\/[^/]+/, '/img/…') }),
              res: (r) => ({ statusCode: r.statusCode }),
            },
          },
    // im Betrieb keine Zeile je Anfrage (Datenminimierung)
    logController: new LogController({ disableRequestLogging: e.NODE_ENV === 'production' }),
  });

  await app.register(cookie);
  await app.register(multipart, {
    limits: { fileSize: p('P-BILD-MAX-MB') * 1024 * 1024 + 1, files: 1, fields: 10 },
  });
  await app.register(websocket, { options: { maxPayload: 64 * 1024 } });

  // Kennzeichnung des Testbetriebs (AK-M02-11): jede Antwort sagt, dass nur erfundene Daten zulässig sind.
  app.addHook('onSend', async (_req, reply) => {
    reply.header('x-betrieb', e.OPERATION_MODE);
    reply.header('cache-control', reply.getHeader('cache-control') ?? 'no-store');
    reply.header('referrer-policy', 'no-referrer');
    reply.header('x-content-type-options', 'nosniff');
  });

  // Schutz vor fremd ausgelösten Anfragen: schreibende Aufrufe brauchen den eigenen Kopf.
  app.addHook('onRequest', async (req) => {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return;
    const url = req.url;
    if (url.startsWith('/api/pruefpartner-') || url.startsWith('/api/eingang/') || url.startsWith('/api/verify/webhook')) return;
    if (url.startsWith('/api/auth/apple/callback')) return;
    if (req.headers['x-cruizy'] !== '1') throw new AppError(403, 'ST-FEH-02', {}, 'fehlender_kopf');
  });

  app.setErrorHandler((err, req, reply) => {
    if (err instanceof AppError) {
      return reply.status(err.status).send({ fehler: err.textId, vars: err.vars, code: err.code ?? null });
    }
    if (err instanceof ZodError) {
      return reply.status(400).send({ fehler: 'UI-EINGABE-PRUEFEN', vars: {}, code: 'eingabe', felder: err.issues.map((i) => i.path.join('.')) });
    }
    const status = (err as { statusCode?: number }).statusCode ?? 500;
    if (status === 413 || (err as { code?: string }).code === 'FST_REQ_FILE_TOO_LARGE') {
      return reply.status(413).send({ fehler: 'ST-FEH-10', vars: { mb: p('P-BILD-MAX-MB') }, code: 'bild_zu_gross' });
    }
    if (status >= 400 && status < 500) {
      return reply.status(status).send({ fehler: 'UI-EINGABE-PRUEFEN', vars: {}, code: 'anfrage' });
    }
    const er = err as Error;
    if (e.NODE_ENV === 'test' && process.env.TEST_SHOW_ERRORS) console.error(er);
    req.log.error({ err: { message: er.message, stack: er.stack } }, 'Serverfehler');
    // Issue #6: nur Methode, Routenmuster und Fehlerart — keine Meldungstexte, keine Parameter
    discord('system', { title: 'Serverfehler (500)', level: 'danger', fields: [{ name: 'Route', value: `${req.method} ${req.routeOptions?.url ?? '?'}` }, { name: 'Art', value: er.name ?? 'Error' }] });
    return reply.status(500).send({ fehler: 'ST-FEH-02', vars: {}, code: 'server' });
  });

  app.get('/api/gesund', async () => ({ ok: true }));

  await app.register(publicRoutes);
  await app.register(authRoutes);
  await app.register(guestRoutes);
  await app.register(profileRoutes);
  await app.register(photoRoutes);
  await app.register(mediaRoutes);
  await app.register(locationRoutes);
  await app.register(discoveryRoutes);
  await app.register(verificationRoutes);
  await app.register(idVerificationRoutes);
  await app.register(chatRoutes);
  await app.register(albumRoutes);
  await app.register(safetyRoutes);
  await app.register(reportRoutes);
  await app.register(noticeRoutes);
  await app.register(checkinRoutes);
  await app.register(placeRoutes);
  await app.register(eventRoutes);
  await app.register(dataRoutes);
  await app.register(helpRoutes);
  await app.register(pushRoutes);
  await app.register(realtimeRoutes);
  await app.register(modRoutes);

  return app;
}
