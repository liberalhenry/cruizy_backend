/**
 * Teamverwaltung (Issue #8) — nur für Owner, d. h. Zugänge mit Gründer-Kennzeichen.
 *
 *  * Anlegen, Ändern (Name, Rolle, Gründer), Sperren/Entsperren, neues Passwort,
 *    neuer zweiter Faktor, Löschen.
 *  * Jede Handlung steht zuerst im Zugriffsprotokoll — mit Begründung (M60).
 *  * Passwort und Schlüssel des zweiten Faktors werden nur einmal ausgegeben.
 *  * Es bleibt immer mindestens ein aktiver Owner; niemand sperrt oder löscht sich selbst.
 *  * Löschen: ohne Spuren im Protokoll wird die Zeile entfernt. Hat die Person gehandelt,
 *    bleibt die Zeile (das Protokoll verweist unveränderlich auf sie) — gesperrt, ohne
 *    Anmeldedaten, die Kennung wird frei.
 */
import { TEAMS, TEAM_KEYS } from '../../services/postfach.js';
import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { z } from 'zod';
import { one, q, type Queryable } from '../../db/pool.js';
import { encrypt, hashPassword, randomToken, verifyPassword } from '../../lib/crypto.js';
import { AppError, bad, conflict, notFound } from '../../lib/errors.js';
import { body, idParam, params } from '../../lib/http.js';
import { logged, requireStaff, type StaffCtx } from './core.js';

export const STAFF_PW_MIN = 12;
const ROLES = ['MOD', 'BETRIEB'] as const;
const reason = z.string().trim().min(5).max(1000);
const login = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9._-]{1,39}$/, 'Kennung: 2–40 Zeichen, a–z, 0–9, . _ -');

export async function requireOwner(req: Parameters<typeof requireStaff>[0]): Promise<StaffCtx> {
  const s = await requireStaff(req);
  if (!s.founder) throw new AppError(403, 'UI-MOD-RECHT', {}, 'nur_owner');
  return s;
}

export async function newTotp(loginName: string) {
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({ issuer: 'Moderation', label: loginName, secret, digits: 6, period: 30 });
  const uri = totp.toString();
  const qr = await QRCode.toDataURL(uri, { errorCorrectionLevel: 'M', margin: 1, width: 240 });
  return { base32: secret.base32, uri, qr };
}

/** Mindestens ein aktiver Owner muss bleiben. */
async function assertOtherOwner(c: Queryable, exceptId: string) {
  const r = (
    await c.query(`SELECT count(*)::int AS n FROM staff WHERE founder AND disabled_at IS NULL AND id <> $1`, [exceptId])
  ).rows[0];
  if (!r.n) throw conflict('UI-TEAM-LETZTER-OWNER', 'letzter_owner');
}

async function target(id: string) {
  const st = await one(`SELECT * FROM staff WHERE id = $1 AND deleted_at IS NULL`, [id]);
  if (!st) throw notFound();
  return st;
}

export default async function teamRoutes(app: FastifyInstance) {
  app.get('/mod-api/team', async (req) => {
    await requireOwner(req);
    const rows = await q(
      `SELECT st.id, st.name, st.login, st.role, st.founder, st.teams, st.created_at, st.disabled_at, st.password_changed_at,
              (SELECT max(last_seen_at) FROM staff_sessions ss WHERE ss.staff_id = st.id) AS last_seen_at,
              (SELECT max(at) FROM access_log l WHERE l.staff_id = st.id) AS last_action_at
         FROM staff st WHERE st.deleted_at IS NULL
        ORDER BY st.disabled_at IS NOT NULL, st.founder DESC, st.name`,
    );
    return {
      items: rows.map((r) => ({
        id: r.id,
        name: r.name,
        login: r.login,
        role: r.role,
        founder: r.founder,
        teams: r.teams,
        createdAt: r.created_at,
        disabledAt: r.disabled_at,
        lastSeenAt: r.last_seen_at,
        lastActionAt: r.last_action_at,
        passwordChangedAt: r.password_changed_at,
      })),
      passwordMin: STAFF_PW_MIN,
      // Postfach: Teams, denen Personen angehören
      teams: TEAMS,
    };
  });

  app.post('/mod-api/team', async (req) => {
    const s = await requireOwner(req);
    const b = body(
      req,
      z.object({ name: z.string().trim().min(2).max(80), login, role: z.enum(ROLES), founder: z.boolean().default(false), reason }),
    );
    if (await one(`SELECT 1 FROM staff WHERE login = $1`, [b.login])) throw conflict('UI-TEAM-KENNUNG-VERGEBEN', 'kennung_vergeben');
    const id = randomUUID();
    const password = randomToken(18);
    const t = await newTotp(b.login);
    await logged(s, `team:${b.login}`, 'team_angelegt', `${b.reason} · Rolle ${b.role}${b.founder ? ', Owner' : ''}`, async (c) => {
      await c.query(
        `INSERT INTO staff (id, name, login, role, founder, password_hash, totp_secret_enc) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, b.name, b.login, b.role, b.founder, await hashPassword(password), encrypt('totp', t.base32, `staff:${id}`)],
      );
    }, true);
    // nur jetzt sichtbar
    return { id, login: b.login, password, totp: { uri: t.uri, secret: t.base32, qr: t.qr } };
  });

  app.patch('/mod-api/team/:id', async (req) => {
    const s = await requireOwner(req);
    const { id } = params(req, idParam);
    const b = body(
      req,
      z.object({
        name: z.string().trim().min(2).max(80).optional(),
        role: z.enum(ROLES).optional(),
        founder: z.boolean().optional(),
        teams: z.array(z.enum(TEAM_KEYS)).max(TEAM_KEYS.length).optional(),
        reason,
      }),
    );
    const st = await target(id);
    const changes: string[] = [];
    if (b.name !== undefined && b.name !== st.name) changes.push(`Name „${st.name}“ → „${b.name}“`);
    if (b.role !== undefined && b.role !== st.role) changes.push(`Rolle ${st.role} → ${b.role}`);
    if (b.founder !== undefined && b.founder !== st.founder) changes.push(b.founder ? 'wird Owner' : 'ist nicht mehr Owner');
    const teams = b.teams ? [...new Set(b.teams)].sort() : undefined;
    if (teams && teams.join(',') !== [...(st.teams ?? [])].sort().join(',')) changes.push(`Teams: ${teams.join(', ') || 'keine'}`);
    if (!changes.length) return { ok: true, changed: false };
    await logged(s, `team:${st.login}`, 'team_geaendert', `${b.reason} · ${changes.join(', ')}`, async (c) => {
      if (b.founder === false && st.founder) await assertOtherOwner(c, id);
      await c.query(
        `UPDATE staff SET name = COALESCE($2, name), role = COALESCE($3, role), founder = COALESCE($4, founder), teams = COALESCE($5, teams) WHERE id = $1`,
        [id, b.name ?? null, b.role ?? null, b.founder ?? null, teams ?? null],
      );
      // neue Rechte gelten ab der nächsten Anmeldung
      if (b.role !== undefined || b.founder !== undefined) await c.query(`DELETE FROM staff_sessions WHERE staff_id = $1`, [id]);
    }, true);
    return { ok: true, changed: true };
  });

  app.post('/mod-api/team/:id/disable', async (req) => {
    const s = await requireOwner(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ reason }));
    if (id === s.id) throw bad('UI-TEAM-NICHT-SELBST', {}, 'selbst');
    const st = await target(id);
    if (st.disabled_at) return { ok: true };
    await logged(s, `team:${st.login}`, 'team_gesperrt', b.reason, async (c) => {
      if (st.founder) await assertOtherOwner(c, id);
      await c.query(`UPDATE staff SET disabled_at = now() WHERE id = $1`, [id]);
      await c.query(`DELETE FROM staff_sessions WHERE staff_id = $1`, [id]);
    }, true);
    return { ok: true };
  });

  app.post('/mod-api/team/:id/enable', async (req) => {
    const s = await requireOwner(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ reason }));
    const st = await target(id);
    if (!st.disabled_at) return { ok: true };
    await logged(s, `team:${st.login}`, 'team_entsperrt', b.reason, async (c) => {
      await c.query(`UPDATE staff SET disabled_at = NULL WHERE id = $1`, [id]);
    }, true);
    return { ok: true };
  });

  app.post('/mod-api/team/:id/password', async (req) => {
    const s = await requireOwner(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ reason }));
    const st = await target(id);
    const password = randomToken(18);
    await logged(s, `team:${st.login}`, 'team_passwort_neu', b.reason, async (c) => {
      await c.query(`UPDATE staff SET password_hash = $2, password_changed_at = NULL WHERE id = $1`, [id, await hashPassword(password)]);
      await c.query(`DELETE FROM staff_sessions WHERE staff_id = $1`, [id]);
    }, true);
    return { password };
  });

  app.post('/mod-api/team/:id/totp', async (req) => {
    const s = await requireOwner(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ reason }));
    const st = await target(id);
    const t = await newTotp(st.login);
    await logged(s, `team:${st.login}`, 'team_zweiter_faktor_neu', b.reason, async (c) => {
      await c.query(`UPDATE staff SET totp_secret_enc = $2 WHERE id = $1`, [id, encrypt('totp', t.base32, `staff:${id}`)]);
      await c.query(`DELETE FROM staff_sessions WHERE staff_id = $1`, [id]);
    }, true);
    return { totp: { uri: t.uri, secret: t.base32, qr: t.qr } };
  });

  app.post('/mod-api/team/:id/delete', async (req) => {
    const s = await requireOwner(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ reason }));
    if (id === s.id) throw bad('UI-TEAM-NICHT-SELBST', {}, 'selbst');
    const st = await target(id);
    const mode = await logged(s, `team:${st.login}`, 'team_geloescht', b.reason, async (c) => {
      if (st.founder && !st.disabled_at) await assertOtherOwner(c, id);
      await c.query(`DELETE FROM staff_sessions WHERE staff_id = $1`, [id]);
      // ganz entfernen, wenn nichts auf den Zugang verweist …
      await c.query('SAVEPOINT team_loeschen');
      try {
        await c.query(`DELETE FROM staff WHERE id = $1`, [id]);
        await c.query('RELEASE SAVEPOINT team_loeschen');
        return 'entfernt' as const;
      } catch (e) {
        if ((e as { code?: string }).code !== '23503') throw e;
        await c.query('ROLLBACK TO SAVEPOINT team_loeschen');
      }
      // … sonst bleibt die Zeile für das Protokoll: gesperrt, ohne Anmeldedaten, Kennung frei
      await c.query(
        `UPDATE staff SET deleted_at = now(), disabled_at = COALESCE(disabled_at, now()), login = $2, password_hash = $3, totp_secret_enc = $4
          WHERE id = $1`,
        [id, `geloescht-${id.slice(0, 8)}`, await hashPassword(randomToken(24)), encrypt('totp', randomToken(20), `staff:${id}`)],
      );
      return 'aufbewahrt' as const;
    }, true);
    return { ok: true, mode };
  });

  /** Eigenes Passwort ändern — für jede Person im Team (z. B. nach dem Einmalpasswort). */
  app.post('/mod-api/me/password', async (req) => {
    const s = await requireStaff(req);
    const b = body(req, z.object({ current: z.string().max(500), next: z.string().min(STAFF_PW_MIN).max(500) }));
    const st = await one(`SELECT password_hash FROM staff WHERE id = $1`, [s.id]);
    if (!(await verifyPassword(st?.password_hash, b.current))) throw bad('UI-ANMELDUNG-FALSCH', {}, 'passwort_falsch');
    if (b.current === b.next) throw bad('UI-TEAM-PASSWORT-GLEICH', {}, 'gleich');
    await logged(s, `team:${s.id}`, 'eigenes_passwort_geaendert', 'Passwort selbst geändert', async (c) => {
      await c.query(`UPDATE staff SET password_hash = $2, password_changed_at = now() WHERE id = $1`, [s.id, await hashPassword(b.next)]);
      await c.query(`DELETE FROM staff_sessions WHERE staff_id = $1 AND id <> $2`, [s.id, s.sessionId]);
    });
    return { ok: true };
  });
}
