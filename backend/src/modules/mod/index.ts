/**
 * Moderationswerkzeug: Anmeldung, Rahmen, Bildauslieferung und alle Bildschirme.
 * Liegt unter /mod-api und antwortet im Betrieb nur unter der eigenen Adresse (M00, „nicht verlinkt“).
 */
import type { FastifyInstance } from 'fastify';
import * as OTPAuth from 'otpauth';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { one, q } from '../../db/pool.js';
import { decrypt, openToken, sealToken, verifyPassword } from '../../lib/crypto.js';
import { AppError, bad, tooMany } from '../../lib/errors.js';
import { getFile, type Store } from '../../lib/files.js';
import { body, ipKey, params } from '../../lib/http.js';
import { hit } from '../../lib/rate.js';
import { discord } from '../../services/discord.js';
import { appVersion } from '../../lib/version.js';
import { STAFF_COOKIE, afterHashLock, createStaffSession, hashCasesToday, requireStaff, HASH_CASES_PER_DAY } from './core.js';
import queueRoutes from './queue.js';
import reportRoutes from './reports.js';
import hashRoutes from './hash.js';
import suspensionRoutes from './suspensions.js';
import appealRoutes from './appeals.js';
import logRoutes from './log.js';
import placeRoutes from './places.js';
import art18Routes from './art18.js';
import ticketRoutes from './tickets.js';
import overviewRoutes from './overview.js';
import teamRoutes from './team.js';
import idcheckRoutes from './idcheck.js';
import updateRoutes from './updates.js';

export function modImgUrl(store: Store, file: string, staffId: string, mime?: 'audio/mp4') {
  return `/mod-api/img/${sealToken({ k: 'mod', s: store, f: file, st: staffId, e: Date.now() + 5 * 60_000, ...(mime ? { m: mime } : {}) })}`;
}

export default async function modRoutes(app: FastifyInstance) {
  await app.register(async (mod) => {
    // Nur unter der eigenen Adresse erreichbar (Betrieb)
    mod.addHook('onRequest', async (req) => {
      const e = env();
      if (e.NODE_ENV !== 'production') return;
      const modHost = new URL(e.MOD_URL).host;
      const host = (req.headers['x-forwarded-host'] as string) ?? req.headers.host;
      if (host !== modHost) throw new AppError(404, 'UI-NICHT-VERFUEGBAR', {}, 'nicht_gefunden');
    });

    mod.post('/mod-api/login', async (req, reply) => {
      const b = body(req, z.object({ login: z.string().max(100), password: z.string().max(500), totp: z.string().max(10) }));
      if (!hit('mod-login', ipKey(req), 10, 3600_000)) {
        discord('sicherheit', { title: 'Werkzeug: zu viele Anmeldeversuche', level: 'danger', description: 'Anmeldungen von dieser Netzadresse sind für eine Stunde gesperrt.' });
        throw tooMany();
      }
      const st = await one(`SELECT * FROM staff WHERE login = $1 AND disabled_at IS NULL`, [b.login.trim().toLowerCase()]);
      const pwOk = await verifyPassword(st?.password_hash, b.password);
      // Issue #6: fehlgeschlagene Anmeldungen melden — die eingegebene Kennung nur, wenn es sie gibt
      const failed = (why: string) =>
        discord('sicherheit', { title: 'Werkzeug: Anmeldung fehlgeschlagen', level: 'warn', fields: [{ name: 'Grund', value: why }, { name: 'Zugang', value: st ? st.name : 'unbekannte Kennung' }] });
      if (!st || !pwOk) {
        failed(st ? 'Passwort falsch' : 'Kennung unbekannt oder gesperrt');
        throw bad('UI-ANMELDUNG-FALSCH', {}, 'anmeldung_falsch');
      }
      // M00.01: zweiter Faktor immer, ohne Ausnahme
      const secret = decrypt('totp', st.totp_secret_enc, `staff:${st.id}`).toString();
      const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(secret), digits: 6, period: 30 });
      if (totp.validate({ token: b.totp.replace(/\s/g, ''), window: 1 }) === null) {
        failed('zweiter Faktor falsch');
        throw bad('UI-ANMELDUNG-FALSCH', {}, 'anmeldung_falsch');
      }
      await createStaffSession(st.id, reply);
      discord('team', { title: 'Werkzeug: angemeldet', level: 'ok', fields: [{ name: 'Person', value: st.name }, { name: 'Rolle', value: `${st.role}${st.founder ? ' · Owner' : ''}` }] });
      return { ok: true };
    });

    mod.post('/mod-api/logout', async (req, reply) => {
      const token = req.cookies[STAFF_COOKIE];
      if (token) {
        const { tokenHash } = await import('../../lib/crypto.js');
        await q(`DELETE FROM staff_sessions WHERE token_hash = $1`, [tokenHash(token)]);
      }
      reply.clearCookie(STAFF_COOKIE, { path: '/mod-api' });
      return { ok: true };
    });

    mod.get('/mod-api/me', async (req) => {
      const s = await requireStaff(req);
      const others = await q(`SELECT id, name, role FROM staff WHERE disabled_at IS NULL AND id <> $1 ORDER BY name`, [s.id]);
      return {
        staff: { id: s.id, name: s.name, role: s.role, founder: s.founder },
        others,
        hashToday: await hashCasesToday(s.id),
        hashLimit: HASH_CASES_PER_DAY,
        hashLocked: afterHashLock(),
        mode: env().OPERATION_MODE,
        version: appVersion(),
      };
    });

    mod.get('/mod-api/img/:token', async (req, reply) => {
      const s = await requireStaff(req);
      const { token } = params(req, z.object({ token: z.string().max(2000) }));
      const tok = openToken<{ k: string; s: Store; f: string; st: string; e: number; m?: string }>(token);
      if (!tok || tok.k !== 'mod' || tok.st !== s.id || tok.e < Date.now()) return reply.status(404).send();
      // Zone 2 ist für das Werkzeug nicht lesbar — nur Kopien im Fall („sealed“) und Zone 1 (AK-M01-04/05)
      // „idcheck“: Ausweisbilder einer offenen Altersprüfung (Issue #7)
      if (!['sealed', 'zone1-original', 'tickets', 'idcheck'].includes(tok.s)) return reply.status(404).send();
      // gelöscht (z. B. Ausweisbild nach der Entscheidung) → nicht mehr vorhanden
      const data = await getFile(tok.s, tok.f).catch(() => null);
      if (!data) return reply.status(404).send();
      // gemeldete Sprachnachricht (Issue #28)
      reply.header('content-type', tok.m === 'audio/mp4' ? 'audio/mp4' : 'image/jpeg');
      reply.header('cache-control', 'no-store');
      return reply.send(data);
    });

    await mod.register(queueRoutes);
    await mod.register(reportRoutes);
    await mod.register(hashRoutes);
    await mod.register(suspensionRoutes);
    await mod.register(appealRoutes);
    await mod.register(logRoutes);
    await mod.register(placeRoutes);
    await mod.register(art18Routes);
    await mod.register(ticketRoutes);
    await mod.register(overviewRoutes);
    await mod.register(teamRoutes);
    await mod.register(idcheckRoutes);
    await mod.register(updateRoutes);
  });
}
