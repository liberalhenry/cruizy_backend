/** Hilfen für die Tests: App, Sitzungen mit Keksdose, Mitglieder und Moderationskonten. */
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import * as OTPAuth from 'otpauth';
import { buildApp } from '../src/app.js';
import { clearParamOverrides } from '../src/config/params.js';
import { one, q } from '../src/db/pool.js';
import { blindIndex, encrypt, hashPassword, normalizeEmail } from '../src/lib/crypto.js';
import { resetRateLimits } from '../src/lib/rate.js';
import { CONSENT_VERSION } from '../src/modules/auth.js';
import { acceptPosition } from '../src/modules/location.js';
import { CONTRACT_VERSION } from '../src/modules/verification.js';
import { sentMails } from '../src/providers/mail.js';

let appPromise: Promise<FastifyInstance> | null = null;

export async function testApp(): Promise<FastifyInstance> {
  appPromise ??= (async () => {
    clearParamOverrides();
    const app = await buildApp();
    await app.ready();
    return app;
  })();
  return appPromise;
}

export interface Res {
  status: number;
  body: any;
  headers: Record<string, unknown>;
  raw: Buffer;
}

export class Client {
  cookies: Record<string, string> = {};
  constructor(public app: FastifyInstance) {}

  async req(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: string, payload?: unknown, headers: Record<string, string> = {}): Promise<Res> {
    const cookie = Object.entries(this.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
    const res = await this.app.inject({
      method,
      url,
      payload: payload as any,
      headers: { 'x-cruizy': '1', ...(cookie ? { cookie } : {}), ...headers },
    });
    for (const c of res.cookies as { name: string; value: string; maxAge?: number; expires?: Date }[]) {
      if (!c.value || (c.maxAge !== undefined && c.maxAge <= 0) || (c.expires && c.expires.getTime() < Date.now())) delete this.cookies[c.name];
      else this.cookies[c.name] = c.value;
    }
    let body: any = null;
    try {
      body = res.body ? JSON.parse(res.body) : null;
    } catch {
      body = res.body;
    }
    return { status: res.statusCode, body, headers: res.headers as Record<string, unknown>, raw: res.rawPayload };
  }
  get(url: string) {
    return this.req('GET', url);
  }
  post(url: string, body: unknown = {}) {
    return this.req('POST', url, body);
  }
  put(url: string, body: unknown = {}) {
    return this.req('PUT', url, body);
  }
  patch(url: string, body: unknown = {}) {
    return this.req('PATCH', url, body);
  }
  del(url: string) {
    return this.req('DELETE', url);
  }
}

export function lastCode(to: string): string {
  const m = [...sentMails].reverse().find((x) => x.to === to);
  if (!m) throw new Error(`keine Mail an ${to}`);
  const code = /\b(\d{6})\b/.exec(m.text)?.[1];
  if (!code) throw new Error('kein Code in der Mail');
  return code;
}

export interface Member {
  c: Client;
  id: string;
  email: string;
  password: string;
}

/** Ein vollständiges Mitglied über die echten Schnittstellen: Registrierung, Code, Einwilligung, Profil. */
export async function member(
  opts: { name?: string; pos?: { lat: number; lng: number }; level?: 'grob' | 'nah' | 'aus'; age1?: boolean } = {},
): Promise<Member> {
  const app = await testApp();
  resetRateLimits();
  const c = new Client(app);
  const email = `t-${randomUUID()}@example.invalid`;
  const password = 'ein-langes-testpasswort';
  const r = await c.post('/api/auth/register', { method: 'email', email, password });
  if (r.status !== 200) throw new Error(`Registrierung: ${r.status} ${JSON.stringify(r.body)}`);
  const v = await c.post('/api/auth/verify', { token: r.body.token, code: lastCode(email) });
  if (v.status !== 200) throw new Error(`Bestätigung: ${v.status} ${JSON.stringify(v.body)}`);
  const cs = await c.post('/api/auth/consent', { accept: true, version: CONSENT_VERSION });
  if (cs.status !== 200) throw new Error(`Einwilligung: ${cs.status}`);
  const pr = await c.post('/api/profile', { name: opts.name ?? 'Tester' });
  if (pr.status !== 200) throw new Error(`Profil: ${pr.status} ${JSON.stringify(pr.body)}`);
  const acc = await one(`SELECT id FROM accounts WHERE email_hash = $1`, [blindIndex('email', normalizeEmail(email))]);
  const id = acc!.id as string;
  if (opts.age1 !== false) {
    await q(`UPDATE accounts SET age1_at = now(), age1_method = 'test', contract_version = $2, contract_variant = 'A', contract_at = now() WHERE id = $1`, [
      id,
      CONTRACT_VERSION,
    ]);
  }
  if (opts.level) await q(`UPDATE locations SET level = $2 WHERE account_id = $1`, [id, opts.level]);
  if (opts.pos) await acceptPosition(id, opts.pos, { force: true });
  return { c, id, email, password };
}

export interface Staff {
  c: Client;
  id: string;
  login: string;
  secret: string;
}

export async function staff(role: 'MOD' | 'BETRIEB' = 'MOD', founder = true): Promise<Staff> {
  const app = await testApp();
  const id = randomUUID();
  const login = `mod-${id.slice(0, 8)}`;
  const secret = new OTPAuth.Secret({ size: 20 }).base32;
  await q(`INSERT INTO staff (id, name, login, role, founder, password_hash, totp_secret_enc) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
    id,
    `Person ${login}`,
    login,
    role,
    founder,
    await hashPassword('mod-passwort-lang'),
    encrypt('totp', secret, `staff:${id}`),
  ]);
  const c = new Client(app);
  resetRateLimits();
  const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(secret), digits: 6, period: 30 }).generate();
  const r = await c.post('/mod-api/login', { login, password: 'mod-passwort-lang', totp });
  if (r.status !== 200) throw new Error(`Moderationsanmeldung: ${r.status} ${JSON.stringify(r.body)}`);
  return { c, id, login, secret };
}

/** Ein kleines JPEG ohne Personenbezug. */
export async function jpeg(opts: { w?: number; h?: number; color?: string; exif?: boolean } = {}): Promise<Buffer> {
  const sharp = (await import('sharp')).default;
  let img = sharp({ create: { width: opts.w ?? 600, height: opts.h ?? 800, channels: 3, background: opts.color ?? '#3a7' } }).jpeg();
  if (opts.exif) {
    img = img.withExif({ IFD0: { Make: 'Testkamera', Model: 'Geheim', Artist: 'Name im Bild' }, IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '50/1 56/1 15/1' } } as never);
  }
  return img.toBuffer();
}

/** Mehrteiliger Upload für app.inject. */
export function multipart(file: Buffer, fields: Record<string, string> = {}, filename = 'bild.jpg') {
  const boundary = `----t${randomUUID()}`;
  const parts: Buffer[] = [];
  for (const [k, v] of Object.entries(fields)) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
  }
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: image/jpeg\r\n\r\n`));
  parts.push(file);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));
  return { payload: Buffer.concat(parts), headers: { 'content-type': `multipart/form-data; boundary=${boundary}` } };
}

export async function upload(c: Client, url: string, file: Buffer, fields: Record<string, string> = {}) {
  const m = multipart(file, fields);
  return c.req('POST', url, m.payload, m.headers);
}

/** PLUS für 7 Tage — früher über den Testbetrieb, jetzt direkt in der Datenbank. */
export async function grantPlus(accountId: string) {
  await q(`INSERT INTO entitlements (account_id, tier, source, valid_until) VALUES ($1, 'plus', 'test', now() + interval '7 days')`, [accountId]);
}
export async function endPlus(accountId: string) {
  await q(`DELETE FROM entitlements WHERE account_id = $1 AND source = 'test'`, [accountId]);
}
