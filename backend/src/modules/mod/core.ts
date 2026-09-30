/**
 * Moderationswerkzeug — Rahmen (M00) und Zugriffsprotokoll (M60).
 *
 * PRÜFUNG ERFORDERLICH.
 *  * Anmeldung immer mit zweitem Faktor (M00.01), höchstens 12 Stunden,
 *    Abmeldung nach 30 Minuten ohne Eingabe (M00.06).
 *  * Jede 📋-Handlung schreibt ZUERST den Protokolleintrag und führt dann aus —
 *    in derselben Transaktion. Ist das Protokoll nicht schreibbar, geschieht nichts (M60).
 *  * Einträge lassen sich von niemandem ändern oder löschen (Trigger in der Datenbank).
 */
import type { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../../config/env.js';
import { db, one, q, tx, type Queryable } from '../../db/pool.js';
import { decrypt, encrypt, randomToken, tokenHash } from '../../lib/crypto.js';
import { AppError } from '../../lib/errors.js';
import { localParts } from '../../lib/time.js';
import { actionLabel, discord } from '../../services/discord.js';

export const STAFF_COOKIE = 'msid';
export const MAX_SESSION_S = 12 * 3600;
export const IDLE_S = 30 * 60;
/** M90.01 und M90.02 — bewusst NICHT einstellbar */
export const HASH_CASES_PER_DAY = 2;
export const HASH_LOCK_HOUR = 21;

export interface StaffCtx {
  id: string;
  name: string;
  role: 'MOD' | 'BETRIEB';
  founder: boolean;
  sessionId: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    staff?: StaffCtx | null;
  }
}

export async function createStaffSession(staffId: string, reply: FastifyReply) {
  const token = randomToken(32);
  await q(
    `INSERT INTO staff_sessions (staff_id, token_hash, expires_at) VALUES ($1, $2, now() + make_interval(secs => $3))`,
    [staffId, tokenHash(token), MAX_SESSION_S],
  );
  reply.setCookie(STAFF_COOKIE, token, {
    httpOnly: true,
    secure: env().COOKIE_SECURE,
    sameSite: 'strict',
    path: '/mod-api',
    maxAge: MAX_SESSION_S,
  });
}

export async function requireStaff(req: FastifyRequest, role?: 'BETRIEB'): Promise<StaffCtx> {
  if (req.staff) {
    if (role && req.staff.role !== role) throw new AppError(403, 'UI-MOD-RECHT', {}, 'recht');
    return req.staff;
  }
  const token = req.cookies?.[STAFF_COOKIE];
  if (!token) throw new AppError(401, 'UI-MOD-ANMELDEN', {}, 'nicht_angemeldet');
  const row = await one(
    `SELECT s.id AS sid, s.last_seen_at, st.id, st.name, st.role, st.founder
       FROM staff_sessions s JOIN staff st ON st.id = s.staff_id
      WHERE s.token_hash = $1 AND s.expires_at > now() AND st.disabled_at IS NULL`,
    [tokenHash(token)],
  );
  if (!row) throw new AppError(401, 'UI-MOD-ANMELDEN', {}, 'nicht_angemeldet');
  if (Date.now() - new Date(row.last_seen_at).getTime() > IDLE_S * 1000) {
    await q(`DELETE FROM staff_sessions WHERE id = $1`, [row.sid]);
    throw new AppError(401, 'UI-MOD-ANMELDEN', {}, 'abgelaufen');
  }
  await q(`UPDATE staff_sessions SET last_seen_at = now() WHERE id = $1`, [row.sid]);
  req.staff = { id: row.id, name: row.name, role: row.role, founder: row.founder, sessionId: row.sid };
  if (role && row.role !== role) throw new AppError(403, 'UI-MOD-RECHT', {}, 'recht');
  return req.staff;
}

/**
 * Vier-Augen-Prinzip (Issue #3): Owner (Gründer) geben selbst frei, alle anderen brauchen
 * eine zweite Person. Die Datenbank prüft dasselbe (Trigger enforce_second_person).
 */
export function needsSecondPerson(s: StaffCtx): boolean {
  return !s.founder;
}

/** Protokolleintrag — muss vor der Handlung und in derselben Transaktion stehen. */
export async function logAccess(
  c: Queryable,
  staffId: string,
  caseRef: string,
  action: string,
  reason: string,
  special = false,
) {
  if (!reason || !reason.trim()) throw new AppError(400, 'UI-MOD-GRUND', {}, 'grund_fehlt');
  await c.query(`INSERT INTO access_log (staff_id, case_ref, action, reason, special) VALUES ($1, $2, $3, $4, $5)`, [
    staffId,
    caseRef,
    action,
    reason.trim(),
    special,
  ]);
}

/** Protokollierte Handlung: erst der Eintrag, dann die Wirkung — oder gar nichts. */
export async function logged<T>(
  staff: StaffCtx,
  caseRef: string,
  action: string,
  reason: string,
  fn: (c: Queryable) => Promise<T>,
  special = false,
): Promise<T> {
  const result = await tx(async (c) => {
    await logAccess(c, staff.id, caseRef, action, reason, special);
    return fn(c);
  });
  // erst nach dem Festschreiben melden — ohne Begründungstext (Issue #6)
  discord(caseRef.startsWith('team:') ? 'team' : 'moderation', {
    title: actionLabel(action),
    level: special ? 'warn' : 'info',
    fields: [
      { name: 'Vorgang', value: caseRef },
      { name: 'Person', value: staff.name },
      ...(special ? [{ name: 'Besondere Handlung', value: 'ja' }] : []),
    ],
  });
  return result;
}

export async function hashCasesToday(staffId: string): Promise<number> {
  const l = localParts(new Date());
  const r = await one(
    `SELECT count(DISTINCT case_ref)::int AS n FROM access_log
      WHERE staff_id = $1 AND action = 'hash_fall_geoeffnet'
        AND (at AT TIME ZONE 'Europe/Berlin')::date = make_date($2, $3, $4)`,
    [staffId, l.year, l.month, l.day],
  );
  return r!.n;
}

export function afterHashLock(at = new Date()): boolean {
  return localParts(at).hour >= HASH_LOCK_HOUR;
}

/** Ampel: grün bis 50 %, gelb ab 75 %, rot bei Ablauf (M85.03). Dazwischen bleibt es grün. */
export function ampel(createdAt: Date, deadline: Date): 'gruen' | 'gelb' | 'rot' {
  const total = deadline.getTime() - createdAt.getTime();
  const used = Date.now() - createdAt.getTime();
  if (used >= total) return 'rot';
  if (total > 0 && used / total >= 0.75) return 'gelb';
  return 'gruen';
}

/** Einstellungen des Werkzeugs (M90.06 Ansprechperson, M80 Portalkonto) — verschlüsselt abgelegt. */
export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  const r = await one(`SELECT value FROM app_secrets WHERE key = $1`, [`setting:${key}`]);
  if (!r) return null;
  return JSON.parse(decrypt('pii', r.value, `setting:${key}`).toString()) as T;
}

export async function setSetting(key: string, value: unknown, c: Queryable = db()) {
  await c.query(`INSERT INTO app_secrets (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`, [
    `setting:${key}`,
    encrypt('pii', JSON.stringify(value), `setting:${key}`),
  ]);
}
