/**
 * Verschlüsselung, Blindindex, Zufallswerte.
 *
 * PRÜFUNG ERFORDERLICH.
 *
 * Aus MASTER_KEY werden per HKDF getrennte Teilschlüssel abgeleitet — je Ablage
 * einer (Zone 1, Zone 2, versiegelte Fälle, Nachrichten, Kontaktdaten …). Wer
 * einen Teilschlüssel hat, kann damit keine andere Ablage lesen (M-01:
 * getrennte, getrennt verschlüsselte Ablagen).
 */
import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes, randomInt, timingSafeEqual, createHash } from 'node:crypto';
import argon2 from 'argon2';
import { env } from '../config/env.js';

export type KeyPurpose =
  | 'pii'        // E-Mail, Mobilnummer, Kontaktangaben
  | 'messages'   // Nachrichten und Gruppennachrichten
  | 'zone1'      // Profilfotos (Original und öffentliche Fassung)
  | 'zone2'      // Bilder im Gespräch und in Alben
  | 'sealed'     // gesicherte Fallinhalte, Hash-Treffer, Nachlauf-Ablage
  | 'tickets'    // Vorgänge des Kontaktservice
  | 'location'   // Zonenmittelpunkte und Ersatzpunkte
  | 'checkin'    // hinterlegte Check-in-Nachrichten (Nr. 83 b)
  | 'export'     // Exportdateien
  | 'index'      // Blindindex (HMAC)
  | 'tokens'     // Bildadressen, Gast-Token
  | 'watermark'  // Muster des unsichtbaren Wasserzeichens
  | 'totp'       // zweiter Faktor des Moderationswerkzeugs
  | 'idcheck';   // Ausweisbilder, solange eine Altersprüfung offen ist (Issue #7)

const keyCache = new Map<KeyPurpose, Buffer>();

function master(): Buffer {
  const raw = Buffer.from(env().MASTER_KEY, 'base64');
  if (raw.length < 32) throw new Error('MASTER_KEY muss 32 Byte (Base64) lang sein');
  return raw.subarray(0, 32);
}

export function key(purpose: KeyPurpose): Buffer {
  let k = keyCache.get(purpose);
  if (!k) {
    k = Buffer.from(hkdfSync('sha256', master(), Buffer.from('cruizy-v1'), Buffer.from(purpose), 32));
    keyCache.set(purpose, k);
  }
  return k;
}

export function resetKeyCache() {
  keyCache.clear();
}

const VERSION = 1;

/** AES-256-GCM. Ausgabe: Version(1) | IV(12) | Tag(16) | Chiffrat. `aad` bindet den Wert an seinen Ort. */
export function encrypt(purpose: KeyPurpose, plain: Buffer | string, aad = ''): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(purpose), iv);
  if (aad) cipher.setAAD(Buffer.from(aad));
  const data = Buffer.isBuffer(plain) ? plain : Buffer.from(plain, 'utf8');
  const enc = Buffer.concat([cipher.update(data), cipher.final()]);
  return Buffer.concat([Buffer.from([VERSION]), iv, cipher.getAuthTag(), enc]);
}

export function decrypt(purpose: KeyPurpose, blob: Buffer, aad = ''): Buffer {
  if (blob[0] !== VERSION) throw new Error('Unbekannte Verschlüsselungsversion');
  const iv = blob.subarray(1, 13);
  const tag = blob.subarray(13, 29);
  const enc = blob.subarray(29);
  const decipher = createDecipheriv('aes-256-gcm', key(purpose), iv);
  if (aad) decipher.setAAD(Buffer.from(aad));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]);
}

export const encStr = (purpose: KeyPurpose, s: string, aad = '') => encrypt(purpose, s, aad);
export const decStr = (purpose: KeyPurpose, b: Buffer | null | undefined, aad = '') =>
  b ? decrypt(purpose, b, aad).toString('utf8') : null;

/** Blindindex: gleicher Klartext → gleicher Wert, ohne dass der Klartext gespeichert wird. */
export function blindIndex(kind: string, value: string): Buffer {
  return createHmac('sha256', key('index')).update(`${kind}:${value}`).digest();
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Mobilnummer in E.164; ohne Ländervorwahl gilt Deutschland. */
export function normalizePhone(phone: string): string | null {
  let s = phone.replace(/[\s()\-/.]/g, '');
  if (s.startsWith('00')) s = '+' + s.slice(2);
  else if (s.startsWith('0')) s = '+49' + s.slice(1);
  if (!/^\+[1-9]\d{7,14}$/.test(s)) return null;
  return s;
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function sha256(data: string | Buffer): Buffer {
  return createHash('sha256').update(data).digest();
}

export function tokenHash(token: string): Buffer {
  return createHmac('sha256', key('tokens')).update(token).digest();
}

export function safeEqual(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Sechsstelliger Code (FV-13). */
export function sixDigitCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export function codeHash(code: string, salt: string): Buffer {
  return createHmac('sha256', key('tokens')).update(`${salt}:${code}`).digest();
}

/** Passwort-Hash mit einem bewusst langsamen Verfahren (AK-F02-05). */
export async function hashPassword(pw: string): Promise<string> {
  return argon2.hash(pw, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
}

export async function verifyPassword(hash: string | null | undefined, pw: string): Promise<boolean> {
  if (!hash) {
    // gleiche Laufzeit wie bei vorhandenem Konto
    await argon2.hash(pw, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 }).catch(() => {});
    return false;
  }
  try {
    return await argon2.verify(hash, pw);
  } catch {
    return false;
  }
}

/** Wiederherstellungscode: 4 × 5 Zeichen, gut lesbar (Z-09). */
export function recoveryCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const groups: string[] = [];
  for (let g = 0; g < 4; g++) {
    let s = '';
    for (let i = 0; i < 5; i++) s += alphabet[randomInt(0, alphabet.length)];
    groups.push(s);
  }
  return groups.join('-');
}

export function normalizeRecoveryCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/(.{5})(?=.)/g, '$1-');
}

/** Opaque, verschlüsselte und befristete Token (Bildadressen, Gast). */
export function sealToken(payload: object): string {
  return encrypt('tokens', JSON.stringify(payload), 'token').toString('base64url');
}

export function openToken<T>(token: string): T | null {
  try {
    return JSON.parse(decrypt('tokens', Buffer.from(token, 'base64url'), 'token').toString('utf8')) as T;
  } catch {
    return null;
  }
}
