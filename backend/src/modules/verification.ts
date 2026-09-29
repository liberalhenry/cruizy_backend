/**
 * Altersprüfung Stufe 1 (F04), Community-Vertrag (F05), Erklärbildschirm an
 * der Schwelle (F09), Stufe 2 (Z-03) und Fotoprüfung (F06).
 *
 * PRÜFUNG ERFORDERLICH (Anbieter- und Auth-nah).
 *
 *  * Die Prüfung startet vor der ersten Nachricht oder Buchung, nie bei der
 *    Registrierung (AK-F04-01/02).
 *  * Gespeichert werden nur Ergebnis, Zeitpunkt, Weg und Vorgangskennung (AK-F04-04).
 *  * Nicht korrekt signierte oder schon verarbeitete Rückmeldungen ändern
 *    keinen Zustand (AK-F04-05).
 *  * Stufe 2 bestätigt sich je Sitzung mit einem gerätegebundenen Schlüssel;
 *    synchronisierte Passkeys werden abgelehnt (FV-87 Weg B, Nr. 69/100).
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { env } from '../config/env.js';
import { p } from '../config/params.js';
import { one, q, tx } from '../db/pool.js';
import { loadAccount, requireSession, type AccountCtx } from '../lib/context.js';
import { randomToken } from '../lib/crypto.js';
import { AppError, bad, notFound, tooMany } from '../lib/errors.js';
import { body, params, uuid } from '../lib/http.js';
import { provider, signWebhook, verifyWebhookSignature, type VerificationKind } from '../providers/verification.js';
import { stage2Required, stage2State } from '../services/stage2.js';
import { emit } from '../services/hub.js';
import { releaseHeldForStage2 } from './chat.js';

/** Textstand des Community-Vertrags (FV-18). Ändert sich mit dem Wortlaut. */
export const CONTRACT_VERSION = 'cv-entwurf-2026-09';
export const CONTRACT_VARIANT = 'A';
export const CONTRACT_LINES: Record<string, string[]> = {
  A: ['ST-CV-03', 'ST-CV-04', 'ST-CV-05', 'ST-CV-06'],
  B: ['ST-CV-13', 'ST-CV-14', 'ST-CV-15', 'ST-CV-16'],
};

async function requireConsented(req: Parameters<typeof requireSession>[0]): Promise<AccountCtx> {
  const a = await requireSession(req);
  if (a.status !== 'active' || !a.consented) throw new AppError(403, 'UI-EINWILLIGUNG-FEHLT', {}, 'einwilligung_fehlt');
  return a;
}

export async function applyResult(sessionId: string, result: string, providerRef: string | null) {
  return tx(async (c) => {
    // Nur ein offener Vorgang ändert einen Zustand (Wiederholung wird verworfen)
    const s = (
      await c.query(`SELECT * FROM verification_sessions WHERE id = $1 AND state = 'pending' FOR UPDATE`, [sessionId])
    ).rows[0];
    if (!s) return false;
    const state = ['passed', 'failed', 'unclear', 'minor', 'cancelled'].includes(result) ? result : 'failed';
    await c.query(`UPDATE verification_sessions SET state = $2, provider_ref = $3, finished_at = now() WHERE id = $1`, [
      sessionId,
      state,
      providerRef,
    ]);
    if (s.kind === 'age1' || s.kind === 'age2') {
      if (state === 'passed') {
        if (s.kind === 'age1') {
          await c.query(
            `UPDATE accounts SET age1_at = now(), age1_method = $2, age1_ref = $3, age_gate_required = false,
                    minor_locked_at = NULL, minor_delete_at = NULL WHERE id = $1`,
            [s.account_id, s.method, providerRef],
          );
        } else {
          // AK-Z03-09: Stufe 2 über eine Identifizierung umfasst Stufe 1
          await c.query(
            `UPDATE accounts SET age2_at = now(), age2_method = $2, age2_ref = $3,
                    age1_at = COALESCE(age1_at, now()), age1_method = COALESCE(age1_method, $2), age1_ref = COALESCE(age1_ref, $3),
                    age_gate_required = false, minor_locked_at = NULL, minor_delete_at = NULL WHERE id = $1`,
            [s.account_id, s.method, providerRef],
          );
        }
      } else if (state === 'minor' && s.method !== 'selfie') {
        // FV-17 Weg B: sofort gesperrt, Löschung nach P-VOLLJAEHRIG-EINSPRUCH, Einspruch per Ausweis möglich
        await c.query(
          `UPDATE accounts SET minor_locked_at = now(), minor_delete_at = now() + make_interval(secs => $2)
            WHERE id = $1 AND age1_at IS NULL`,
          [s.account_id, p('P-VOLLJAEHRIG-EINSPRUCH')],
        );
      } else if (state === 'minor') {
        // Eine Schätzung unter der Schwelle ist kein solches Ergebnis → Ausweisweg (FV-17, AK-F04-06)
        await c.query(`UPDATE verification_sessions SET state = 'unclear' WHERE id = $1`, [sessionId]);
      }
    }
    if (s.kind === 'face' && state === 'passed') {
      const photos = (
        await c.query(`SELECT id FROM photos WHERE account_id = $1 AND status = 'approved'`, [s.account_id])
      ).rows.map((r) => r.id);
      await c.query(`UPDATE accounts SET face_check_at = now(), face_check_photos = $2 WHERE id = $1`, [s.account_id, photos]);
    }
    emit(s.account_id, 'pruefung', { id: sessionId });
    return true;
  });
}

export default async function verificationRoutes(app: FastifyInstance) {
  app.get('/api/verify/state', async (req) => {
    const a = await requireConsented(req);
    const acc = await one(
      `SELECT age1_at, age2_at, contract_version, contract_at, face_check_at, minor_locked_at, minor_delete_at, age_gate_required
         FROM accounts WHERE id = $1`,
      [a.id],
    );
    const prov = provider();
    return {
      age1: !!acc.age1_at,
      age2: !!acc.age2_at,
      contract: acc.contract_version === CONTRACT_VERSION,
      contractSigned: !!acc.contract_version,
      contractVersion: CONTRACT_VERSION,
      contractLines: CONTRACT_LINES[CONTRACT_VARIANT],
      methods: { age1: prov.methods('age1'), age2: prov.methods('age2'), face: prov.methods('face') },
      stage2: stage2State(a),
      stage2Required: stage2Required(),
      facePassed: !!acc.face_check_at,
      minorLocked: !!acc.minor_locked_at,
      minorDeleteAt: acc.minor_delete_at,
      ageGate: acc.age_gate_required,
      provider: prov.name,
    };
  });

  app.post('/api/verify/start', async (req) => {
    const a = await requireConsented(req);
    const b = body(req, z.object({ kind: z.enum(['age1', 'age2', 'face']), method: z.string().max(20), faceConsent: z.boolean().optional() }));
    const prov = provider();
    if (!prov.methods(b.kind).includes(b.method)) throw bad('UI-EINGABE-PRUEFEN', {}, 'weg');
    if (a.moderationState === 'suspended') throw new AppError(403, 'UI-KONTO-GESPERRT');
    if (b.kind === 'age1') {
      if (a.age1) throw bad('ST-VER-12', {}, 'schon_geprueft'); // AK-F04-10
      // FV-17: Einspruch nur mit dem Ausweis
      if (a.minorLocked && b.method !== 'eid') throw new AppError(403, 'ST-VER-13', {}, 'nur_ausweis');
    }
    if (b.kind === 'age2' && a.age2) throw bad('UI-STUFE2-SCHON', {}, 'schon_geprueft');
    if (b.kind === 'face') {
      // AK-F06-01: ausdrückliche Einwilligung in den biometrischen Abgleich
      if (!b.faceConsent) throw bad('UI-FOTOPRUEFUNG-EINWILLIGUNG', {}, 'einwilligung');
      const ph = await one(`SELECT count(*)::int AS n FROM photos WHERE account_id = $1 AND status = 'approved'`, [a.id]);
      if (!ph!.n) throw bad('UI-FOTOPRUEFUNG-FOTO', {}, 'kein_foto');
      const tries = await one(
        `SELECT count(*)::int AS n FROM verification_sessions WHERE account_id = $1 AND kind = 'face' AND created_at > now() - interval '1 day'`,
        [a.id],
      );
      if (tries!.n >= p('P-FOTOPRUEF-VERSUCHE')) throw tooMany('UI-FOTOPRUEFUNG-VERSUCHE');
    }
    if (a.minorLocked && b.kind !== 'age1') throw new AppError(403, 'ST-VER-13');
    const s = await one(
      `INSERT INTO verification_sessions (account_id, kind, method) VALUES ($1, $2, $3) RETURNING id`,
      [a.id, b.kind, b.method],
    );
    let start;
    try {
      start = await prov.start(s!.id, b.kind as VerificationKind, b.method);
    } catch {
      await q(`UPDATE verification_sessions SET state = 'failed', finished_at = now() WHERE id = $1`, [s!.id]);
      throw new AppError(503, 'ST-FEH-42', {}, 'pruefpartner');
    }
    return { sessionId: s!.id, url: start.url };
  });

  app.get('/api/verify/session/:id', async (req) => {
    const a = await requireSession(req);
    const { id } = params(req, z.object({ id: uuid }));
    const s = await one(`SELECT id, kind, method, state, created_at FROM verification_sessions WHERE id = $1 AND account_id = $2`, [id, a.id]);
    if (!s) throw notFound();
    if (s.state === 'pending' && Date.now() - new Date(s.created_at).getTime() > p('P-PRUEF-TIMEOUT') * 1000) {
      await q(`UPDATE verification_sessions SET state = 'timeout', finished_at = now() WHERE id = $1 AND state = 'pending'`, [id]);
      s.state = 'timeout';
    }
    // AK-F04-06: kein geschätztes Alter, nur der Zustand
    return { id: s.id, kind: s.kind, method: s.method, state: s.state };
  });

  app.post('/api/verify/contract', async (req) => {
    const a = await requireConsented(req);
    const b = body(req, z.object({ version: z.string(), lines: z.array(z.literal(true)).length(4) }));
    const acc = await one(`SELECT age1_at FROM accounts WHERE id = $1`, [a.id]);
    if (!acc?.age1_at) throw new AppError(403, 'ST-FEST-01', {}, 'alterspruefung_noetig');
    if (b.version !== CONTRACT_VERSION) throw bad('UI-EINGABE-PRUEFEN', {}, 'textstand');
    // AK-F05-04: Zeitpunkt, Textversion und Satzfassung
    await q(`UPDATE accounts SET contract_version = $2, contract_variant = $3, contract_at = now() WHERE id = $1`, [
      a.id,
      CONTRACT_VERSION,
      CONTRACT_VARIANT,
    ]);
    return { ok: true };
  });

  // ───── Webhook des Prüfpartners: roher Text für die Signaturprüfung ─────
  await app.register(async (scope) => {
    scope.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, raw, done) => done(null, raw));
    scope.post('/api/verify/webhook', async (req, reply) => {
      const raw = String(req.body ?? '');
      if (!verifyWebhookSignature(raw, req.headers['x-signature'] as string | undefined)) {
        return reply.status(401).send({ ok: false });
      }
      let msg: { session?: string; result?: string; ref?: string; ts?: number };
      try {
        msg = JSON.parse(raw);
      } catch {
        return reply.status(400).send({ ok: false });
      }
      if (!msg.session || !msg.result || !msg.ts || Math.abs(Date.now() - msg.ts) > 5 * 60_000) {
        return reply.status(400).send({ ok: false });
      }
      const changed = await applyResult(msg.session, msg.result, msg.ref ?? null);
      if (changed) await afterVerification(msg.session);
      return { ok: true, changed };
    });
  });

  // ───── Attrappe des Prüfpartners (nur Testbetrieb) ─────
  app.get('/api/pruefpartner-attrappe/:id', async (req, reply) => {
    provider(); // wirft im Echtbetrieb
    const { id } = params(req, z.object({ id: uuid }));
    const s = await one(`SELECT kind, method, state FROM verification_sessions WHERE id = $1`, [id]);
    if (!s) return reply.status(404).send('Nicht gefunden');
    const choices =
      s.kind === 'face'
        ? [['passed', 'Fotos passen zur Person'], ['failed', 'Fotos passen nicht'], ['cancelled', 'Abbrechen']]
        : [
            ['passed', 'Volljährig'],
            ...(s.method === 'selfie' ? [['unclear', 'Schätzung nicht eindeutig']] : [['minor', 'Nicht volljährig']]),
            ['failed', 'Prüfung klappt nicht'],
            ['cancelled', 'Abbrechen'],
          ];
    reply.header('content-type', 'text/html; charset=utf-8');
    reply.header('cache-control', 'no-store');
    return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Prüfpartner (Attrappe)</title><style>body{font-family:system-ui,sans-serif;background:#12151b;color:#e8ecf2;max-width:32rem;margin:2rem auto;padding:1rem}
button{display:block;width:100%;min-height:48px;margin:.5rem 0;border-radius:12px;border:1px solid #3a4150;background:#1c212b;color:#e8ecf2;font-size:1rem}
.note{background:#2a2410;border:1px solid #6b5a1b;padding:.75rem;border-radius:12px}</style></head><body>
<p class="note">Testbetrieb: Diese Seite stellt einen Prüfpartner nach. Es wird nichts geprüft und nichts gespeichert außer dem gewählten Ergebnis.</p>
<h1>${s.kind === 'face' ? 'Fotoprüfung' : s.kind === 'age2' ? 'Stufe 2' : 'Altersprüfung'} · ${s.method === 'eid' ? 'Online-Ausweis' : 'Selfie'}</h1>
<form method="post">${choices.map(([v, l]) => `<button name="result" value="${v}">${l}</button>`).join('')}</form></body></html>`;
  });

  await app.register(async (scope) => {
    scope.addContentTypeParser('application/x-www-form-urlencoded', { parseAs: 'string' }, (_req, raw, done) =>
      done(null, Object.fromEntries(new URLSearchParams(String(raw)))),
    );
    scope.post('/api/pruefpartner-attrappe/:id', async (req, reply) => {
      provider();
      const { id } = params(req, z.object({ id: uuid }));
      const result = String((req.body as Record<string, string>)?.result ?? 'cancelled');
      // Wie ein echter Anbieter: Ergebnis signiert an den Webhook
      const raw = JSON.stringify({ session: id, result, ref: `attrappe-${randomToken(6)}`, ts: Date.now() });
      const res = await app.inject({
        method: 'POST',
        url: '/api/verify/webhook',
        headers: { 'content-type': 'application/json', 'x-signature': signWebhook(raw) },
        payload: raw,
      });
      if (res.statusCode !== 200) return reply.status(500).send('Fehler');
      return reply.redirect(`${env().APP_URL}/pruefung/fertig?s=${id}`);
    });
  });

  // ───── Stufe 2: gerätegebundener Schlüssel (FV-87 Weg B) ─────
  const rp = () => {
    const u = new URL(env().APP_URL);
    return { rpID: u.hostname, origin: u.origin };
  };

  app.post('/api/verify/stage2/key/options', async (req) => {
    const a = await requireConsented(req);
    if (!a.age2) throw new AppError(403, 'ST-VER-41', {}, 'stufe2_noetig');
    const acc = await one(`SELECT webauthn_user_id FROM accounts WHERE id = $1`, [a.id]);
    let userId: Buffer = acc?.webauthn_user_id;
    if (!userId) {
      userId = Buffer.from(randomToken(16));
      await q(`UPDATE accounts SET webauthn_user_id = $2 WHERE id = $1`, [a.id, userId]);
    }
    const existing = await q(`SELECT id FROM webauthn_credentials WHERE account_id = $1`, [a.id]);
    if (existing.length) {
      const opts = await generateAuthenticationOptions({
        rpID: rp().rpID,
        allowCredentials: existing.map((c) => ({ id: Buffer.from(c.id).toString('base64url') })),
        userVerification: 'required',
      });
      await q(
        `INSERT INTO webauthn_challenges (account_id, challenge) VALUES ($1, $2)
         ON CONFLICT (account_id) DO UPDATE SET challenge = $2, created_at = now()`,
        [a.id, opts.challenge],
      );
      return { mode: 'auth', options: opts };
    }
    const opts = await generateRegistrationOptions({
      rpName: 'Bestätigung',
      rpID: rp().rpID,
      userName: 'konto',
      userID: new Uint8Array(userId),
      attestationType: 'none',
      authenticatorSelection: { residentKey: 'discouraged', userVerification: 'required', authenticatorAttachment: 'platform' },
    });
    await q(
      `INSERT INTO webauthn_challenges (account_id, challenge) VALUES ($1, $2)
       ON CONFLICT (account_id) DO UPDATE SET challenge = $2, created_at = now()`,
      [a.id, opts.challenge],
    );
    return { mode: 'register', options: opts };
  });

  app.post('/api/verify/stage2/key', async (req) => {
    const a = await requireConsented(req);
    const b = body(req, z.object({ mode: z.enum(['register', 'auth']), response: z.any() }));
    const ch = await one(`DELETE FROM webauthn_challenges WHERE account_id = $1 AND created_at > now() - interval '5 minutes' RETURNING challenge`, [a.id]);
    if (!ch) throw bad('UI-SCHLUESSEL-ABGELAUFEN', {}, 'challenge');
    const { rpID, origin } = rp();
    if (b.mode === 'register') {
      const v = await verifyRegistrationResponse({
        response: b.response,
        expectedChallenge: ch.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: true,
      }).catch(() => null);
      if (!v?.verified || !v.registrationInfo) throw bad('UI-SCHLUESSEL-FEHLER', {}, 'schluessel');
      // Nr. 69/100: keine synchronisierten Passkeys — nur Schlüssel, die das Gerät nicht verlassen
      if (v.registrationInfo.credentialDeviceType === 'multiDevice' || v.registrationInfo.credentialBackedUp) {
        throw bad('UI-SCHLUESSEL-SYNC', {}, 'synchronisiert');
      }
      const cred = v.registrationInfo.credential;
      await q(`INSERT INTO webauthn_credentials (id, account_id, public_key, counter) VALUES ($1, $2, $3, $4)`, [
        Buffer.from(cred.id, 'base64url'),
        a.id,
        Buffer.from(cred.publicKey),
        cred.counter,
      ]);
    } else {
      const credId = Buffer.from(String(b.response?.id ?? ''), 'base64url');
      const cred = await one(`SELECT * FROM webauthn_credentials WHERE id = $1 AND account_id = $2`, [credId, a.id]);
      if (!cred) throw bad('UI-SCHLUESSEL-FEHLER');
      const v = await verifyAuthenticationResponse({
        response: b.response,
        expectedChallenge: ch.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: true,
        credential: { id: credId.toString('base64url'), publicKey: new Uint8Array(cred.public_key), counter: Number(cred.counter) },
      }).catch(() => null);
      if (!v?.verified) throw bad('UI-SCHLUESSEL-FEHLER', {}, 'schluessel');
      if (v.authenticationInfo.credentialBackedUp) throw bad('UI-SCHLUESSEL-SYNC', {}, 'synchronisiert');
      await q(`UPDATE webauthn_credentials SET counter = $2 WHERE id = $1`, [credId, v.authenticationInfo.newCounter]);
    }
    await q(`UPDATE device_sessions SET stage2_auth_at = now() WHERE id = $1`, [a.sessionId]);
    const fresh = await loadAccountFresh(req);
    if (fresh) await releaseHeldForStage2(fresh.id);
    return { ok: true };
  });
}

async function loadAccountFresh(req: Parameters<typeof loadAccount>[0]) {
  req.account = undefined;
  return loadAccount(req);
}

/** Nach einer bestandenen Prüfung: Wirkungen, die an ihr hängen. */
async function afterVerification(sessionId: string) {
  const s = await one(`SELECT account_id, kind, state FROM verification_sessions WHERE id = $1`, [sessionId]);
  if (s?.state === 'passed' && s.kind === 'age2') await releaseHeldForStage2(s.account_id);
}
