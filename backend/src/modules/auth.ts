/**
 * Konto und Anmeldung (F02, F03, Q-09, Z-09, Z-10).
 *
 * PRÜFUNG ERFORDERLICH (Auth).
 *
 *  * Registrierung verlangt nur E-Mail oder Mobilnummer und ein Passwort (AK-F02-01).
 *  * Gibt es die Adresse schon, ist die Antwort gleich, und es geht keine E-Mail hinaus (AK-F02-02).
 *  * Vor der Einwilligung wird außer den Anmeldedaten nichts gespeichert (AK-Q09-01).
 *  * Wiederherstellung und neues Passwort beenden alle anderen Sitzungen (FV-94).
 *  * Vertrauenspersonen: Der Server speichert weder Namen noch Kontaktwege noch Zahl (AK-Z09-04).
 */
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env, isTestMode } from '../config/env.js';
import { p } from '../config/params.js';
import { one, q, tx } from '../db/pool.js';
import {
  blindIndex,
  decStr,
  encStr,
  hashPassword,
  normalizeEmail,
  normalizePhone,
  normalizeRecoveryCode,
  openToken,
  randomToken,
  recoveryCode,
  sealToken,
  sha256,
  tokenHash,
  verifyPassword,
} from '../lib/crypto.js';
import {
  createSession,
  deviceHash,
  deviceId,
  endOtherSessions,
  endSession,
  loadAccount,
  requireSession,
  cookieOptions,
} from '../lib/context.js';
import { AppError, bad, tooMany } from '../lib/errors.js';
import { body, ipKey } from '../lib/http.js';
import { hit } from '../lib/rate.js';
import { t } from '../lib/texts.js';
import { checkCode, issueCode, lastCodeAt, mailCode, mayMail, smsCode } from '../services/codes.js';
import { createNotice } from '../services/notify.js';
import { sendMail } from '../providers/mail.js';
import { discord } from '../services/discord.js';
import { sendPush } from '../services/push.js';
import { sendSms } from '../providers/sms.js';
import { metric } from '../services/metrics.js';
import { closeAllFor } from '../services/hub.js';

export const CONSENT_PURPOSE = 'art9';
/** Textstand der Einwilligung (AK-Q09-02/03). Ändert sich mit dem Wortlaut des Anwalts. */
export const CONSENT_VERSION = 'art9-entwurf-2026-09';

const HOUR = 3600_000;

interface PendingToken {
  a: string | null; // Konto (null = es gibt schon ein Konto; Antwort sieht trotzdem gleich aus)
  k: 'verify_email' | 'verify_phone' | 'login_phone';
  e: number;
}

function pending(accountId: string | null, kind: PendingToken['k']) {
  return sealToken({ a: accountId, k: kind, e: Date.now() + p('P-KONTO-VORLAEUFIG') * 1000 } satisfies PendingToken);
}

function readPending(token: string, kind: PendingToken['k']): PendingToken {
  const tok = openToken<PendingToken>(token);
  if (!tok || tok.k !== kind || tok.e < Date.now()) throw bad('UI-CODE-FALSCH', {}, 'code_falsch');
  return tok;
}

function checkInvite(invite: string | undefined) {
  const e = env();
  if (e.OPERATION_MODE === 'test' && e.TEST_INVITE_CODE && invite !== e.TEST_INVITE_CODE) {
    throw new AppError(403, 'UI-TESTBETRIEB-EINLADUNG', {}, 'einladung_noetig');
  }
}

const password = z.string().min(1).max(512);

async function nextStep(accountId: string) {
  const a = await one(
    `SELECT a.status, a.consented_at, (pr.account_id IS NOT NULL) AS has_profile
       FROM accounts a LEFT JOIN profiles pr ON pr.account_id = a.id WHERE a.id = $1`,
    [accountId],
  );
  if (!a?.consented_at) return 'einwilligung';
  if (!a.has_profile) return 'profil';
  return 'app';
}

async function finishLogin(req: FastifyRequest, reply: FastifyReply, accountId: string) {
  await createSession(accountId, reply);
  const d = deviceId(req, reply);
  await q(`INSERT INTO known_devices (account_id, device_hash) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [
    accountId,
    deviceHash(d),
  ]);
  return { next: await nextStep(accountId) };
}

async function findByIdentifier(identifier: string) {
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) {
    const email = normalizeEmail(trimmed);
    return {
      kind: 'email' as const,
      value: email,
      row: await one(`SELECT * FROM accounts WHERE email_hash = $1`, [blindIndex('email', email)]),
    };
  }
  const phone = normalizePhone(trimmed);
  if (!phone) return { kind: 'invalid' as const, value: '', row: null };
  return { kind: 'phone' as const, value: phone, row: await one(`SELECT * FROM accounts WHERE phone_hash = $1`, [blindIndex('phone', phone)]) };
}

export default async function authRoutes(app: FastifyInstance) {
  // ───────────── Registrierung (F02, Z-10) ─────────────
  app.post('/api/auth/register', async (req) => {
    const b = body(
      req,
      z.object({
        method: z.enum(['email', 'phone']),
        email: z.string().email().max(254).optional(),
        phone: z.string().max(32).optional(),
        password,
        invite: z.string().optional(),
      }),
    );
    checkInvite(b.invite);
    if (b.password.length < p('P-PW-MIN')) throw bad('UI-PASSWORT-KURZ', { zahl: p('P-PW-MIN') }, 'passwort_kurz');
    if (!hit('register', ipKey(req), p('P-REGISTRIERUNGEN-JE-NETZ'), 24 * HOUR)) throw tooMany();

    if (b.method === 'email') {
      if (!b.email) throw bad('UI-EINGABE-PRUEFEN');
      const email = normalizeEmail(b.email);
      const h = blindIndex('email', email);
      const existing = await one(`SELECT id, status, email_verified_at FROM accounts WHERE email_hash = $1`, [h]);
      if (existing && existing.email_verified_at) {
        // AK-F02-02: gleiche Antwort, keine E-Mail
        return { token: pending(null, 'verify_email'), next: 'code' };
      }
      const pwHash = await hashPassword(b.password);
      let accountId: string;
      if (existing) {
        accountId = existing.id;
        await q(`UPDATE accounts SET password_hash = $2 WHERE id = $1`, [accountId, pwHash]);
      } else {
        const row = await one(
          `INSERT INTO accounts (primary_method, email_hash, email_enc, password_hash, is_test_data)
           VALUES ('email', $1, $2, $3, $4) RETURNING id`,
          [h, encStr('pii', email, 'email'), pwHash, isTestMode()],
        );
        accountId = row!.id;
      }
      const last = await lastCodeAt(accountId, 'verify_email');
      if (!last || Date.now() - last.getTime() > p('P-CODE-NEU-SENDEN') * 1000) {
        const code = await issueCode({ accountId, purpose: 'verify_email' });
        await mailCode(email, code);
      }
      return { token: pending(accountId, 'verify_email'), next: 'code' };
    }

    if (!b.phone) throw bad('UI-EINGABE-PRUEFEN');
    const phone = normalizePhone(b.phone);
    if (!phone) throw bad('UI-NUMMER-UNGUELTIG', {}, 'nummer_ungueltig');
    const h = blindIndex('phone', phone);
    const existing = await one(`SELECT id, phone_verified_at FROM accounts WHERE phone_hash = $1`, [h]);
    if (existing && existing.phone_verified_at) return { token: pending(null, 'verify_phone'), next: 'code' };
    const pwHash = await hashPassword(b.password);
    let accountId: string;
    if (existing) {
      accountId = existing.id;
      await q(`UPDATE accounts SET password_hash = $2 WHERE id = $1`, [accountId, pwHash]);
    } else {
      const row = await one(
        `INSERT INTO accounts (primary_method, phone_hash, phone_enc, password_hash, is_test_data)
         VALUES ('phone', $1, $2, $3, $4) RETURNING id`,
        [h, encStr('pii', phone, 'phone'), pwHash, isTestMode()],
      );
      accountId = row!.id;
    }
    const code = await issueCode({ accountId, purpose: 'verify_phone' });
    await smsCode(phone, code, 'anlegen');
    return { token: pending(accountId, 'verify_phone'), next: 'code' };
  });

  app.post('/api/auth/verify', async (req, reply) => {
    const b = body(req, z.object({ token: z.string(), code: z.string().max(12) }));
    const tok = openToken<PendingToken>(b.token);
    if (!tok || (tok.k !== 'verify_email' && tok.k !== 'verify_phone') || tok.e < Date.now()) {
      throw bad('UI-CODE-FALSCH', {}, 'code_falsch');
    }
    if (!tok.a) throw bad('UI-CODE-FALSCH', {}, 'code_falsch');
    const res = await checkCode(tok.a, tok.k, b.code.trim());
    if (!res.ok) {
      if (res.reason === 'abgelaufen' || res.reason === 'zu_viele') throw bad('UI-CODE-NEU', {}, 'code_neu_noetig');
      throw bad('UI-CODE-FALSCH', {}, 'code_falsch');
    }
    const col = tok.k === 'verify_email' ? 'email_verified_at' : 'phone_verified_at';
    await q(`UPDATE accounts SET ${col} = now() WHERE id = $1`, [tok.a]);
    return finishLogin(req, reply, tok.a);
  });

  app.post('/api/auth/resend', async (req) => {
    const b = body(req, z.object({ token: z.string() }));
    const tok = openToken<PendingToken>(b.token);
    if (!tok || tok.e < Date.now()) throw bad('UI-CODE-FALSCH');
    if (!tok.a) return { ok: true };
    const last = await lastCodeAt(tok.a, tok.k);
    if (last && Date.now() - last.getTime() < p('P-CODE-NEU-SENDEN') * 1000) {
      throw tooMany('UI-CODE-WARTEN');
    }
    const acc = await one(`SELECT email_enc, phone_enc FROM accounts WHERE id = $1`, [tok.a]);
    if (!acc) return { ok: true };
    const code = await issueCode({ accountId: tok.a, purpose: tok.k });
    if (tok.k === 'verify_email') await mailCode(decStr('pii', acc.email_enc, 'email')!, code);
    else await smsCode(decStr('pii', acc.phone_enc, 'phone')!, code, tok.k === 'login_phone' ? 'neues_geraet' : 'anlegen');
    return { ok: true };
  });

  // ───────────── Anmelden ─────────────
  app.post('/api/auth/login', async (req, reply) => {
    const b = body(req, z.object({ identifier: z.string().max(254), password }));
    const ik = ipKey(req);
    if (!hit('login', ik, p('P-ANMELDE-VERSUCHE'), HOUR)) throw tooMany();
    const found = await findByIdentifier(b.identifier);
    const ok = await verifyPassword(found.row?.password_hash, b.password);
    if (!found.row || !ok) throw bad('UI-ANMELDUNG-FALSCH', {}, 'anmeldung_falsch');
    const acc = found.row;
    if (acc.minor_locked_at && acc.minor_delete_at && new Date(acc.minor_delete_at) < new Date()) {
      throw bad('UI-ANMELDUNG-FALSCH', {}, 'anmeldung_falsch');
    }
    if (found.kind === 'email' && !acc.email_verified_at) {
      const code = await issueCode({ accountId: acc.id, purpose: 'verify_email' });
      await mailCode(found.value, code);
      return { next: 'code', token: pending(acc.id, 'verify_email') };
    }
    if (found.kind === 'phone') {
      if (!acc.phone_verified_at) {
        const code = await issueCode({ accountId: acc.id, purpose: 'verify_phone' });
        await smsCode(found.value, code, 'anlegen');
        return { next: 'code', token: pending(acc.id, 'verify_phone') };
      }
      // Z-10: SMS-Code bei der Anmeldung auf einem neuen Gerät
      const d = deviceId(req, reply);
      const known = await one(`SELECT 1 FROM known_devices WHERE account_id = $1 AND device_hash = $2`, [acc.id, deviceHash(d)]);
      if (!known) {
        const code = await issueCode({ accountId: acc.id, purpose: 'login_phone' });
        await smsCode(found.value, code, 'neues_geraet');
        return { next: 'geraet', token: pending(acc.id, 'login_phone') };
      }
    }
    return finishLogin(req, reply, acc.id);
  });

  app.post('/api/auth/device-code', async (req, reply) => {
    const b = body(req, z.object({ token: z.string(), code: z.string().max(12) }));
    const tok = readPending(b.token, 'login_phone');
    if (!tok.a) throw bad('UI-CODE-FALSCH');
    const res = await checkCode(tok.a, 'login_phone', b.code.trim());
    if (!res.ok) throw bad(res.reason === 'falsch' ? 'UI-CODE-FALSCH' : 'UI-CODE-NEU', {}, 'code_falsch');
    return finishLogin(req, reply, tok.a);
  });

  app.post('/api/auth/logout', async (req, reply) => {
    const a = await loadAccount(req);
    await endSession(req, reply);
    if (a) closeAllFor(a.id);
    return { ok: true };
  });

  // ───────────── Passwort vergessen (S03.10) ─────────────
  app.post('/api/auth/reset/request', async (req) => {
    const b = body(req, z.object({ identifier: z.string().max(254) }));
    if (!hit('reset', ipKey(req), 20, HOUR)) throw tooMany();
    const found = await findByIdentifier(b.identifier);
    if (found.row) {
      if (found.kind === 'email' && found.row.email_verified_at) {
        // AK-F02-07: höchstens eine E-Mail in P-RESET-SPERRE
        if (await mayMail(found.value, 'reset', p('P-RESET-SPERRE'))) {
          const token = randomToken(24);
          await q(`UPDATE verification_codes SET consumed_at = now() WHERE account_id = $1 AND purpose = 'reset' AND consumed_at IS NULL`, [found.row.id]);
          await q(
            `INSERT INTO verification_codes (account_id, purpose, code_hash, expires_at)
             VALUES ($1, 'reset', $2, now() + make_interval(secs => $3))`,
            [found.row.id, tokenHash(token), p('P-CODE-GUELTIG')],
          );
          const link = `${env().APP_URL}/passwort?token=${token}`;
          await sendMail({
            to: found.value,
            subject: t('ST-MAIL-05'),
            text: t('ST-MAIL-06', { minuten: Math.round(p('P-CODE-GUELTIG') / 60), link }),
            design: { heading: t('ST-MAIL-05'), action: { label: t('ST-MAIL-05'), url: link } },
          });
        }
      } else if (found.kind === 'phone' && found.row.phone_verified_at) {
        const code = await issueCode({ accountId: found.row.id, purpose: 'reset' });
        await smsCode(found.value, code, 'wiederherstellung');
      }
    }
    // gleiche Antwort in jedem Fall
    return { ok: true, weg: found.kind === 'phone' ? 'sms' : 'mail' };
  });

  app.post('/api/auth/reset/complete', async (req, reply) => {
    const b = body(
      req,
      z.object({ token: z.string().optional(), identifier: z.string().optional(), code: z.string().optional(), password }),
    );
    if (b.password.length < p('P-PW-MIN')) throw bad('UI-PASSWORT-KURZ', { zahl: p('P-PW-MIN') }, 'passwort_kurz');
    if (!hit('reset-complete', ipKey(req), 20, HOUR)) throw tooMany();
    let accountId: string | null = null;
    if (b.token) {
      const row = await one(
        `SELECT id, account_id FROM verification_codes
          WHERE purpose = 'reset' AND code_hash = $1 AND consumed_at IS NULL AND expires_at > now()`,
        [tokenHash(b.token)],
      );
      if (row) {
        accountId = row.account_id;
        await q(`UPDATE verification_codes SET consumed_at = now() WHERE id = $1`, [row.id]);
      }
    } else if (b.identifier && b.code) {
      const found = await findByIdentifier(b.identifier);
      if (found.row) {
        const res = await checkCode(found.row.id, 'reset', b.code.trim());
        if (res.ok) accountId = found.row.id;
      }
    }
    if (!accountId) throw bad('UI-LINK-UNGUELTIG', {}, 'link_ungueltig');
    await q(`UPDATE accounts SET password_hash = $2 WHERE id = $1`, [accountId, await hashPassword(b.password)]);
    await endOtherSessions(accountId);
    closeAllFor(accountId);
    return finishLogin(req, reply, accountId);
  });

  // ───────────── Wiederherstellungscode (Z-09, Weg 1) ─────────────
  app.post('/api/auth/recover/code', async (req, reply) => {
    const b = body(req, z.object({ identifier: z.string().max(254), code: z.string().max(40), password }));
    if (b.password.length < p('P-PW-MIN')) throw bad('UI-PASSWORT-KURZ', { zahl: p('P-PW-MIN') }, 'passwort_kurz');
    if (!hit('recover', ipKey(req), 10, HOUR)) throw tooMany();
    const found = await findByIdentifier(b.identifier);
    const ok = found.row?.recovery_code_hash
      ? await verifyPassword(found.row.recovery_code_hash, normalizeRecoveryCode(b.code))
      : await verifyPassword(null, b.code);
    if (!found.row || !ok) throw bad('UI-CODE-FALSCH', {}, 'code_falsch');
    const accountId = found.row.id;
    const fresh = recoveryCode();
    await q(
      `UPDATE accounts SET password_hash = $2, recovery_code_hash = $3, recovery_code_created_at = now() WHERE id = $1`,
      [accountId, await hashPassword(b.password), await hashPassword(fresh)],
    );
    await endOtherSessions(accountId);
    closeAllFor(accountId);
    const res = await finishLogin(req, reply, accountId);
    return { ...res, recoveryCode: fresh };
  });

  // ───────────── Vertrauenspersonen (Z-09, Weg 4; Nr. 86, 95, 100) ─────────────
  app.post('/api/auth/trusted-key', async (req) => {
    const a = await requireSession(req);
    const acc = await one(`SELECT email_verified_at, phone_verified_at FROM accounts WHERE id = $1`, [a.id]);
    // AK-Z09-14: ohne hinterlegten Weg niemand, den wir warnen könnten
    if (!acc?.email_verified_at && !acc?.phone_verified_at) throw bad('ST-WHR-08', {}, 'zweiter_weg_noetig');
    const k = randomToken(24);
    await q(`UPDATE accounts SET trusted_key_hash = $2, trusted_key_created_at = now() WHERE id = $1`, [a.id, await hashPassword(k)]);
    // Der Schlüssel wird einmal ausgegeben; wer ihn bekommt, erfahren wir nie (AK-Z09-04).
    return { key: k };
  });

  app.delete('/api/auth/trusted-key', async (req) => {
    const a = await requireSession(req);
    await q(`UPDATE accounts SET trusted_key_hash = NULL, trusted_key_created_at = NULL WHERE id = $1`, [a.id]);
    await q(`UPDATE recovery_attempts SET cancelled_at = now() WHERE account_id = $1 AND completed_at IS NULL AND cancelled_at IS NULL`, [a.id]);
    return { ok: true };
  });

  app.post('/api/auth/recover/trusted/start', async (req) => {
    const b = body(req, z.object({ identifier: z.string().max(254), key: z.string().max(100) }));
    if (!hit('recover-trusted', ipKey(req), 10, HOUR)) throw tooMany();
    const found = await findByIdentifier(b.identifier);
    const ok = found.row?.trusted_key_hash
      ? await verifyPassword(found.row.trusted_key_hash, b.key.trim())
      : await verifyPassword(null, b.key);
    if (!found.row || !ok) throw bad('UI-SCHLUESSEL-FALSCH', {}, 'schluessel_falsch');
    const accountId = found.row.id;
    const token = randomToken(24);
    const due = new Date(Date.now() + p('P-WHR-WARTEFRIST') * 1000);
    await q(`UPDATE recovery_attempts SET cancelled_at = now() WHERE account_id = $1 AND completed_at IS NULL AND cancelled_at IS NULL`, [accountId]);
    const att = await one(
      `INSERT INTO recovery_attempts (account_id, token_hash, due_at) VALUES ($1, $2, $3) RETURNING id`,
      [accountId, tokenHash(token), due],
    );
    // AK-Z09-13: Benachrichtigung ausschließlich an die Person selbst — Gerät und E-Mail
    await createNotice(accountId, 'wiederherstellung', t('UI-WHR-TITEL'), t('ST-WHR-07'), att!.id);
    await sendPush(accountId, 'notice', { title: t('ST-PUSH-10'), url: '/ich/mitteilungen' });
    if (found.row.email_verified_at && found.row.email_enc) {
      const cancelToken = sealToken({ r: att!.id, c: 1, e: due.getTime() });
      await sendMail({
        to: decStr('pii', found.row.email_enc, 'email')!,
        subject: t('ST-MAIL-07'),
        preheader: t('ST-MAIL-08'),
        text: `${t('ST-WHR-07')}\n\n${env().APP_URL}/wiederherstellung-abbrechen?t=${cancelToken}`,
        design: {
          heading: t('ST-MAIL-07'),
          action: { label: t('UI-MAIL-WHR-ABBRECHEN'), url: `${env().APP_URL}/wiederherstellung-abbrechen?t=${cancelToken}` },
        },
      });
    }
    return { token, dueAt: due.toISOString() };
  });

  app.get('/api/auth/recover/trusted/status', async (req) => {
    const token = String((req.query as { token?: string }).token ?? '');
    const r = await one(`SELECT due_at, cancelled_at, completed_at FROM recovery_attempts WHERE token_hash = $1`, [tokenHash(token)]);
    if (!r || r.cancelled_at || r.completed_at) return { state: 'beendet' }; // AK-Z09-12: nicht, wer abgebrochen hat
    return { state: new Date(r.due_at) <= new Date() ? 'bereit' : 'wartet', dueAt: r.due_at };
  });

  app.post('/api/auth/recover/trusted/cancel', async (req) => {
    const b = body(req, z.object({ cancelToken: z.string().optional(), attemptId: z.string().uuid().optional() }));
    if (b.cancelToken) {
      const tok = openToken<{ r: string; c: number }>(b.cancelToken);
      if (!tok?.r) throw bad('UI-LINK-UNGUELTIG');
      await q(`UPDATE recovery_attempts SET cancelled_at = now() WHERE id = $1 AND completed_at IS NULL`, [tok.r]);
      return { ok: true };
    }
    const a = await requireSession(req);
    await q(
      `UPDATE recovery_attempts SET cancelled_at = now()
        WHERE account_id = $1 AND completed_at IS NULL AND cancelled_at IS NULL AND ($2::uuid IS NULL OR id = $2)`,
      [a.id, b.attemptId ?? null],
    );
    return { ok: true };
  });

  app.post('/api/auth/recover/trusted/complete', async (req, reply) => {
    const b = body(req, z.object({ token: z.string(), password }));
    if (b.password.length < p('P-PW-MIN')) throw bad('UI-PASSWORT-KURZ', { zahl: p('P-PW-MIN') }, 'passwort_kurz');
    const r = await one(
      `SELECT id, account_id, due_at FROM recovery_attempts
        WHERE token_hash = $1 AND cancelled_at IS NULL AND completed_at IS NULL`,
      [tokenHash(b.token)],
    );
    // AK-Z09-10: vor Ablauf der Wartefrist kein Zugang
    if (!r || new Date(r.due_at) > new Date()) throw bad('UI-WARTEFRIST', {}, 'wartefrist');
    await tx(async (c) => {
      await c.query(`UPDATE recovery_attempts SET completed_at = now() WHERE id = $1`, [r.id]);
      await c.query(`UPDATE accounts SET password_hash = $2 WHERE id = $1`, [r.account_id, await hashPassword(b.password)]);
    });
    await endOtherSessions(r.account_id);
    closeAllFor(r.account_id);
    return finishLogin(req, reply, r.account_id);
  });

  // ───────────── Einwilligung (Q-09, S04) ─────────────
  app.get('/api/auth/consent', async () => ({ version: CONSENT_VERSION, textId: 'ST-KON-27' }));

  app.post('/api/auth/consent', async (req) => {
    const a = await requireSession(req);
    const b = body(req, z.object({ accept: z.literal(true), version: z.string() }));
    if (b.version !== CONSENT_VERSION) throw bad('UI-EINWILLIGUNG-NEU', {}, 'textstand');
    const before = await one(`SELECT consented_at, recovery_code_hash FROM accounts WHERE id = $1`, [a.id]);
    if (before?.consented_at) return { ok: true, recoveryCode: null, next: await nextStep(a.id) };
    const code = before?.recovery_code_hash ? null : recoveryCode();
    await tx(async (c) => {
      await c.query(`INSERT INTO consents (account_id, purpose, text_version) VALUES ($1, $2, $3)`, [
        a.id,
        CONSENT_PURPOSE,
        CONSENT_VERSION,
      ]);
      await c.query(`UPDATE accounts SET consented_at = now(), status = 'active' WHERE id = $1`, [a.id]);
      if (code) {
        await c.query(`UPDATE accounts SET recovery_code_hash = $2, recovery_code_created_at = now() WHERE id = $1`, [
          a.id,
          await hashPassword(code),
        ]);
      }
    });
    await metric(a.id, 'user_created');
    // Issue #6: nur, dass es ein neues Konto gibt, und über welchen Weg
    discord('konten', { title: 'Neues Konto', level: 'ok', fields: [{ name: 'Weg', value: a.primaryMethod }] });
    // AK-Z09-01: der Code wird genau einmal angezeigt und nur als Prüfwert gespeichert
    return { ok: true, recoveryCode: code, next: 'profil' };
  });

  /** „Nicht einwilligen“ — die bis dahin erfassten Anmeldedaten werden gelöscht (AK-Q09-01). */
  app.post('/api/auth/decline', async (req, reply) => {
    const a = await requireSession(req);
    if (a.consented) throw bad('UI-EINGABE-PRUEFEN');
    await endSession(req, reply);
    await q(`DELETE FROM accounts WHERE id = $1 AND consented_at IS NULL`, [a.id]);
    return { ok: true };
  });

  // Nachfrage nach sieben Tagen (AK-Z09-02)
  app.post('/api/auth/recovery-prompt', async (req) => {
    const a = await requireSession(req);
    const b = body(req, z.object({ answer: z.enum(['gesichert', 'neu']) }));
    await q(`UPDATE accounts SET recovery_prompted_at = now() WHERE id = $1`, [a.id]);
    if (b.answer === 'neu') {
      const code = recoveryCode();
      await q(`UPDATE accounts SET recovery_code_hash = $2, recovery_code_created_at = now() WHERE id = $1`, [a.id, await hashPassword(code)]);
      return { recoveryCode: code };
    }
    return { ok: true };
  });

  app.post('/api/auth/recovery-code/new', async (req) => {
    const a = await requireSession(req);
    const b = body(req, z.object({ password }));
    const acc = await one(`SELECT password_hash FROM accounts WHERE id = $1`, [a.id]);
    if (acc?.password_hash && !(await verifyPassword(acc.password_hash, b.password))) throw bad('UI-ANMELDUNG-FALSCH');
    const code = recoveryCode();
    await q(`UPDATE accounts SET recovery_code_hash = $2, recovery_code_created_at = now(), recovery_prompted_at = now() WHERE id = $1`, [
      a.id,
      await hashPassword(code),
    ]);
    return { recoveryCode: code };
  });

  // ───────────── Zugang sichern: zweiter Weg (Z-09 Weg 2, Z-10) ─────────────
  app.post('/api/auth/add/email', async (req) => {
    const a = await requireSession(req);
    const b = body(req, z.object({ email: z.string().email().max(254) }));
    const email = normalizeEmail(b.email);
    const h = blindIndex('email', email);
    const taken = await one(`SELECT id FROM accounts WHERE email_hash = $1 AND id <> $2`, [h, a.id]);
    if (!taken) {
      const code = await issueCode({ accountId: a.id, purpose: 'add_email', targetHash: h, targetEnc: encStr('pii', email, 'email') });
      await mailCode(email, code);
    }
    return { ok: true };
  });

  app.post('/api/auth/add/phone', async (req) => {
    const a = await requireSession(req);
    const b = body(req, z.object({ phone: z.string().max(32) }));
    const phone = normalizePhone(b.phone);
    if (!phone) throw bad('UI-NUMMER-UNGUELTIG');
    const h = blindIndex('phone', phone);
    const taken = await one(`SELECT id FROM accounts WHERE phone_hash = $1 AND id <> $2`, [h, a.id]);
    if (!taken) {
      const code = await issueCode({ accountId: a.id, purpose: 'add_phone', targetHash: h, targetEnc: encStr('pii', phone, 'phone') });
      await smsCode(phone, code, 'anlegen');
    }
    return { ok: true };
  });

  app.post('/api/auth/add/confirm', async (req) => {
    const a = await requireSession(req);
    const b = body(req, z.object({ kind: z.enum(['email', 'phone']), code: z.string().max(12) }));
    const purpose = b.kind === 'email' ? 'add_email' : 'add_phone';
    const res = await checkCode(a.id, purpose, b.code.trim());
    if (!res.ok || !res.targetHash) throw bad('UI-CODE-FALSCH', {}, 'code_falsch');
    try {
      if (b.kind === 'email') {
        await q(`UPDATE accounts SET email_hash = $2, email_enc = $3, email_verified_at = now() WHERE id = $1`, [a.id, res.targetHash, res.targetEnc]);
      } else {
        await q(`UPDATE accounts SET phone_hash = $2, phone_enc = $3, phone_verified_at = now() WHERE id = $1`, [a.id, res.targetHash, res.targetEnc]);
      }
    } catch {
      throw bad('UI-CODE-FALSCH', {}, 'belegt');
    }
    return { ok: true };
  });

  app.post('/api/auth/password', async (req) => {
    const a = await requireSession(req);
    const b = body(req, z.object({ old: password.optional(), new: password }));
    if (b.new.length < p('P-PW-MIN')) throw bad('UI-PASSWORT-KURZ', { zahl: p('P-PW-MIN') }, 'passwort_kurz');
    const acc = await one(`SELECT password_hash FROM accounts WHERE id = $1`, [a.id]);
    if (acc?.password_hash && !(await verifyPassword(acc.password_hash, b.old ?? ''))) throw bad('UI-ANMELDUNG-FALSCH');
    await q(`UPDATE accounts SET password_hash = $2 WHERE id = $1`, [a.id, await hashPassword(b.new)]);
    await q(`UPDATE device_sessions SET reauth_at = now() WHERE id = $1`, [a.sessionId]);
    await endOtherSessions(a.id, a.sessionId);
    return { ok: true };
  });

  /** Erneute Anmeldung für den Export-Download (FV-76, AK-F68-03). */
  app.post('/api/auth/reauth', async (req) => {
    const a = await requireSession(req);
    const b = body(req, z.object({ password }));
    if (!hit('reauth', a.id, 10, HOUR)) throw tooMany();
    const acc = await one(`SELECT password_hash FROM accounts WHERE id = $1`, [a.id]);
    if (!(await verifyPassword(acc?.password_hash, b.password))) throw bad('UI-ANMELDUNG-FALSCH', {}, 'anmeldung_falsch');
    await q(`UPDATE device_sessions SET reauth_at = now() WHERE id = $1`, [a.sessionId]);
    return { ok: true };
  });

  // ───────────── Anmelden mit Apple (F03) ─────────────
  const appleJwks = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

  app.get('/api/auth/apple/start', async (req, reply) => {
    const e = env();
    if (!e.APPLE_CLIENT_ID || !e.APPLE_REDIRECT_URI) throw bad('UI-APPLE-AUS', {}, 'apple_aus');
    const invite = String((req.query as { invite?: string }).invite ?? '');
    const state = randomToken(16);
    const nonce = randomToken(16);
    reply.setCookie('apple_flow', sealToken({ state, nonce, invite, e: Date.now() + 10 * 60_000 }), {
      ...cookieOptions(600),
      sameSite: 'none', // Apple sendet per form_post von fremder Adresse zurück
      secure: true,
    });
    const url = new URL('https://appleid.apple.com/auth/authorize');
    url.searchParams.set('client_id', e.APPLE_CLIENT_ID);
    url.searchParams.set('redirect_uri', e.APPLE_REDIRECT_URI);
    url.searchParams.set('response_type', 'code id_token');
    url.searchParams.set('response_mode', 'form_post');
    // AK-F03-01 / FV-14: nur die E-Mail, kein Name
    url.searchParams.set('scope', 'email');
    url.searchParams.set('state', state);
    url.searchParams.set('nonce', sha256(nonce).toString('hex'));
    return reply.redirect(url.toString());
  });

  app.post('/api/auth/apple/callback', async (req, reply) => {
    const e = env();
    const b = req.body as { id_token?: string; state?: string; error?: string };
    const flow = openToken<{ state: string; nonce: string; invite: string; e: number }>(req.cookies['apple_flow'] ?? '');
    reply.clearCookie('apple_flow', { path: '/' });
    const back = (path: string) => reply.redirect(`${e.APP_URL}${path}`);
    // Abbruch im Apple-Dialog → zurück ohne Fehlermeldung
    if (!b?.id_token || b.error) return back('/anmelden');
    if (!flow || flow.e < Date.now() || flow.state !== b.state) return back('/anmelden?fehler=apple');
    let payload: Record<string, unknown>;
    try {
      // AK-F03-04: das Token wird geprüft, bevor der Client als angemeldet gilt
      const res = await jwtVerify(b.id_token, appleJwks, { issuer: 'https://appleid.apple.com', audience: e.APPLE_CLIENT_ID });
      payload = res.payload as Record<string, unknown>;
    } catch {
      return back('/anmelden?fehler=apple');
    }
    if (payload.nonce !== sha256(flow.nonce).toString('hex')) return back('/anmelden?fehler=apple');
    const sub = String(payload.sub);
    const subHash = blindIndex('apple', sub);
    let acc = await one(`SELECT id FROM accounts WHERE apple_sub_hash = $1`, [subHash]);
    if (!acc) {
      if (e.OPERATION_MODE === 'test' && e.TEST_INVITE_CODE && flow.invite !== e.TEST_INVITE_CODE) {
        return back('/anmelden?fehler=einladung');
      }
      const email = typeof payload.email === 'string' ? normalizeEmail(payload.email) : null;
      const emailHash = email ? blindIndex('email', email) : null;
      const clash = emailHash ? await one(`SELECT id FROM accounts WHERE email_hash = $1`, [emailHash]) : null;
      acc = await one(
        `INSERT INTO accounts (primary_method, apple_sub_hash, email_hash, email_enc, email_verified_at, is_test_data)
         VALUES ('apple', $1, $2, $3, CASE WHEN $2::bytea IS NULL THEN NULL ELSE now() END, $4) RETURNING id`,
        [subHash, clash ? null : emailHash, clash || !email ? null : encStr('pii', email, 'email'), isTestMode()],
      );
    }
    const res = await finishLogin(req, reply, acc!.id);
    return back(res.next === 'app' ? '/' : `/start/${res.next}`);
  });
}

export async function smsArt34(phone: string) {
  await sendSms({ to: phone, text: t('ST-SMS-01'), reason: 'art34' });
}
