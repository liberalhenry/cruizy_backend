/**
 * Anmeldung per Sitzungs-Cookie und die Zustände eines Kontos.
 *
 * PRÜFUNG ERFORDERLICH (Auth).
 *
 * Kontozustände (4.0, Nr. 64):
 *   Gast (Stufe 1 nicht bestanden) → lesen, eigenes Profil, kein Schreiben/Buchen
 *   Geprüft (Stufe 1 bestanden)    → alles Übrige
 *   Identifiziert (Stufe 2)         → zusätzlich Zone-2-Medien, wenn der Schalter an ist
 */
import type { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../config/env.js';
import { p } from '../config/params.js';
import { one, q } from '../db/pool.js';
import { AppError, forbidden, unauthorized } from './errors.js';
import { blindIndex, randomToken, tokenHash } from './crypto.js';
import { localDateString } from './time.js';

export const SESSION_COOKIE = 'sid';
export const DEVICE_COOKIE = 'did';

export interface AccountCtx {
  id: string;
  sessionId: string;
  status: 'provisional' | 'active';
  consented: boolean;
  hasProfile: boolean;
  age1: boolean;
  age2: boolean;
  minorLocked: boolean;
  ageGate: boolean;
  moderationState: 'none' | 'restricted' | 'suspended';
  hashRestricted: boolean;
  deletionPending: boolean;
  reauthAt: Date;
  stage2AuthAt: Date | null;
  primaryMethod: 'email' | 'phone' | 'apple';
}

declare module 'fastify' {
  interface FastifyRequest {
    account?: AccountCtx | null;
  }
}

export function cookieOptions(maxAgeS: number) {
  return {
    httpOnly: true,
    secure: env().COOKIE_SECURE,
    sameSite: 'strict' as const,
    path: '/',
    maxAge: maxAgeS,
  };
}

export async function createSession(accountId: string, reply: FastifyReply): Promise<string> {
  const token = randomToken(32);
  const ttl = p('P-SITZUNG-DAUER');
  const row = await one<{ id: string }>(
    `INSERT INTO device_sessions (account_id, token_hash, expires_at)
     VALUES ($1, $2, now() + make_interval(secs => $3)) RETURNING id`,
    [accountId, tokenHash(token), ttl],
  );
  reply.setCookie(SESSION_COOKIE, token, cookieOptions(ttl));
  return row!.id;
}

export async function endSession(req: FastifyRequest, reply: FastifyReply) {
  const token = req.cookies[SESSION_COOKIE];
  if (token) await q('DELETE FROM device_sessions WHERE token_hash = $1', [tokenHash(token)]);
  reply.clearCookie(SESSION_COOKIE, { path: '/' });
}

/** FV-94: Wiederherstellung und neues Passwort beenden alle anderen Sitzungen. */
export async function endOtherSessions(accountId: string, keepSessionId?: string) {
  await q('DELETE FROM device_sessions WHERE account_id = $1 AND ($2::uuid IS NULL OR id <> $2)', [
    accountId,
    keepSessionId ?? null,
  ]);
}

export function deviceId(req: FastifyRequest, reply: FastifyReply): string {
  let d = req.cookies[DEVICE_COOKIE];
  if (!d || d.length < 20) {
    d = randomToken(18);
    reply.setCookie(DEVICE_COOKIE, d, cookieOptions(5 * 365 * 86400));
  }
  return d;
}

export function deviceHash(d: string) {
  return blindIndex('device', d);
}

export async function loadAccount(req: FastifyRequest): Promise<AccountCtx | null> {
  if (req.account !== undefined) return req.account;
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return (req.account = null);
  const row = await one(
    `SELECT s.id AS session_id, s.last_seen_at, s.reauth_at, s.stage2_auth_at, s.opened_day,
            a.id, a.status, a.consented_at, a.age1_at, a.age2_at, a.minor_locked_at, a.age_gate_required,
            a.moderation_state, a.hash_restricted_at, a.deletion_requested_at, a.primary_method,
            (pr.account_id IS NOT NULL) AS has_profile
       FROM device_sessions s
       JOIN accounts a ON a.id = s.account_id
       LEFT JOIN profiles pr ON pr.account_id = a.id
      WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [tokenHash(token)],
  );
  if (!row) return (req.account = null);
  // gleitende Gültigkeit, höchstens einmal je Minute schreiben
  if (Date.now() - new Date(row.last_seen_at).getTime() > 60_000) {
    const today = localDateString(new Date());
    const firstToday = !row.opened_day || localDateString(new Date(row.opened_day)) !== today;
    await q(
      `UPDATE device_sessions SET last_seen_at = now(), expires_at = now() + make_interval(secs => $2),
              opened_day = CASE WHEN $3 THEN current_date ELSE opened_day END
        WHERE id = $1`,
      [row.session_id, p('P-SITZUNG-DAUER'), firstToday],
    );
    if (firstToday && row.consented_at) {
      // Kennzahl „App geöffnet“ je Tag (Q-16) — serverseitig, ohne Gerätespeicher (FV-07)
      await q(
        `INSERT INTO metric_events (account_id, kind)
         SELECT $1, 'app_open' WHERE NOT EXISTS (
           SELECT 1 FROM metric_events WHERE account_id = $1 AND kind = 'app_open' AND at > now() - interval '20 hours')`,
        [row.id],
      );
    }
  }
  const acc: AccountCtx = {
    id: row.id,
    sessionId: row.session_id,
    status: row.status,
    consented: !!row.consented_at,
    hasProfile: row.has_profile,
    age1: !!row.age1_at,
    age2: !!row.age2_at,
    minorLocked: !!row.minor_locked_at,
    ageGate: !!row.age_gate_required,
    moderationState: row.moderation_state,
    hashRestricted: !!row.hash_restricted_at,
    deletionPending: !!row.deletion_requested_at,
    reauthAt: new Date(row.reauth_at),
    stage2AuthAt: row.stage2_auth_at ? new Date(row.stage2_auth_at) : null,
    primaryMethod: row.primary_method,
  };
  req.account = acc;
  return acc;
}

/** Irgendeine gültige Sitzung (auch vorläufiges Konto). */
export async function requireSession(req: FastifyRequest): Promise<AccountCtx> {
  const a = await loadAccount(req);
  if (!a) throw unauthorized();
  return a;
}

export interface MemberOpts {
  /** Schreibende Handlung gegenüber anderen (Nachricht, Zusage …) */
  write?: boolean;
  /** Auch während der Löschkarenz erlaubt (Datenkonto, Mitteilungen) */
  allowDeletionPending?: boolean;
  /** Auch bei Sperre erlaubt (Mitteilungen, Widerspruch) */
  allowSuspended?: boolean;
}

/** Vollwertiges Konto: bestätigt, eingewilligt, Profil angelegt. */
export async function requireMember(req: FastifyRequest, opts: MemberOpts = {}): Promise<AccountCtx> {
  const a = await requireSession(req);
  if (a.status !== 'active' || !a.consented) throw new AppError(403, 'UI-EINWILLIGUNG-FEHLT', {}, 'einwilligung_fehlt');
  if (a.minorLocked) throw new AppError(403, 'ST-VER-13', {}, 'gesperrt_minderjaehrig');
  if (a.ageGate && !a.age1 && !opts.allowDeletionPending) throw new AppError(403, 'UI-ALTER-UNTER-18', {}, 'alterspruefung_vor_nutzung');
  if (a.moderationState === 'suspended' && !opts.allowSuspended) throw new AppError(403, 'UI-KONTO-GESPERRT', {}, 'konto_gesperrt');
  if (!a.hasProfile && !opts.allowDeletionPending) throw new AppError(403, 'UI-PROFIL-FEHLT', {}, 'profil_fehlt');
  if (a.deletionPending && !opts.allowDeletionPending && opts.write) {
    throw new AppError(403, 'ST-DAT-12', {}, 'loeschung_laeuft');
  }
  if (opts.write && (a.moderationState === 'restricted' || a.hashRestricted)) {
    throw new AppError(403, 'UI-KONTO-EINGESCHRAENKT', {}, 'konto_eingeschraenkt');
  }
  // P-PRUEFUNG-VOR-EINTRITT (K1): Altersprüfung schon vor dem ersten Zugang
  if (p('P-PRUEFUNG-VOR-EINTRITT') && !a.age1 && !opts.allowDeletionPending) {
    throw new AppError(403, 'ST-CV-00', {}, 'pruefung_vor_eintritt');
  }
  return a;
}

/**
 * Schranke vor Schreiben und Buchen (Nr. 64, AK-F04-01, AK-F04-11, AK-F05-03).
 * Der Client öffnet daraufhin den gebündelten Ablauf (ST-CV-00).
 */
export async function requireCleared(req: FastifyRequest): Promise<AccountCtx> {
  const a = await requireMember(req, { write: true });
  if (!a.age1) throw new AppError(403, 'ST-FEST-01', {}, 'alterspruefung_noetig');
  const c = await one(`SELECT contract_version FROM accounts WHERE id = $1`, [a.id]);
  if (!c?.contract_version) throw new AppError(403, 'ST-CV-01', {}, 'vertrag_noetig');
  return a;
}

export function isForbidden(e: unknown) {
  return e instanceof AppError && e.status === 403;
}

export { forbidden };
