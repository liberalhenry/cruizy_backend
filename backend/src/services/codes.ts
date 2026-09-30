/**
 * Einmalcodes per E-Mail oder — an Mobilnummern — über den Telegram-Bot (FV-13, Z-10, Issue #32).
 * Codes liegen nur als Hash vor, gelten P-CODE-GUELTIG und P-CODE-VERSUCHE Versuche.
 *
 * Ist der Versandweg nicht eingerichtet (kein SMTP bzw. kein Bot), geht der Code nicht hinaus:
 * Das Team bestätigt Adresse, Nummer oder neues Gerät im Werkzeug („Bestätigen“). Die App fragt
 * dann ohne Code nach (leerer Code), bis das Team bestätigt hat. Passwort-Zurücksetzen geht
 * nie über das Team — wer nicht beweisen kann, dass ihm die Adresse gehört, geht über den Support.
 */
import { p } from '../config/params.js';
import { one, q, type Queryable, db } from '../db/pool.js';
import { codeHash, safeEqual, sixDigitCode, blindIndex } from '../lib/crypto.js';
import { t } from '../lib/texts.js';
import { mailConfigured, sendMail } from '../providers/mail.js';
import { telegramActive } from '../providers/telegram.js';
import { sendToPhone, type PhoneReason } from './telegram.js';
import { hit } from '../lib/rate.js';

export type CodePurpose = 'verify_email' | 'verify_phone' | 'login_phone' | 'reset' | 'add_email' | 'add_phone';

/** Zwecke, die das Team bestätigen darf, wenn kein Versand eingerichtet ist */
export const TEAM_PURPOSES: CodePurpose[] = ['verify_email', 'verify_phone', 'add_email', 'add_phone', 'login_phone'];

export const channelOf = (purpose: CodePurpose): 'mail' | 'phone' => (purpose === 'verify_email' || purpose === 'add_email' ? 'mail' : 'phone');

/** Kann dieser Weg gerade zustellen? */
export const canDeliver = (channel: 'mail' | 'phone') => (channel === 'mail' ? mailConfigured() : telegramActive());

/** Geht ein Code dieses Zwecks gerade an das Team statt an die Person? */
export const needsTeam = (purpose: CodePurpose) => TEAM_PURPOSES.includes(purpose) && !canDeliver(channelOf(purpose));

export async function issueCode(opts: {
  accountId: string;
  purpose: CodePurpose;
  targetHash?: Buffer;
  targetEnc?: Buffer;
  client?: Queryable;
}): Promise<string> {
  const code = sixDigitCode();
  const c = opts.client ?? db();
  const team = needsTeam(opts.purpose);
  // ältere offene Codes desselben Zwecks werden ungültig
  await q(
    `UPDATE verification_codes SET consumed_at = now()
      WHERE account_id = $1 AND purpose = $2 AND consumed_at IS NULL`,
    [opts.accountId, opts.purpose],
    c,
  );
  await q(
    `INSERT INTO verification_codes (account_id, purpose, target_hash, target_enc, code_hash, expires_at, delivery)
     VALUES ($1, $2, $3, $4, $5, now() + make_interval(secs => $6), $7)`,
    [
      opts.accountId,
      opts.purpose,
      opts.targetHash ?? null,
      opts.targetEnc ?? null,
      codeHash(code, opts.accountId),
      // das Team braucht länger als eine Zustellung: dieselbe Frist wie eine Anfrage an den Support
      team ? p('P-TICKET-FRIST') : p('P-CODE-GUELTIG'),
      team ? 'team' : 'sent',
    ],
    c,
  );
  return code;
}

/**
 * Prüft einen Code. Nach P-CODE-VERSUCHE Fehlversuchen ist ein neuer Code nötig (AK-F02-03).
 * Ein leerer Code fragt nach, ob das Team bestätigt hat (nur ohne eingerichteten Versand).
 */
export async function checkCode(accountId: string, purpose: CodePurpose, code: string) {
  if (code === '') return teamConfirmed(accountId, purpose);
  const row = await one(
    `SELECT id, code_hash, attempts, expires_at, target_hash, target_enc FROM verification_codes
      WHERE account_id = $1 AND purpose = $2 AND consumed_at IS NULL
      ORDER BY created_at DESC LIMIT 1`,
    [accountId, purpose],
  );
  if (!row) return { ok: false as const, reason: 'kein_code' };
  if (new Date(row.expires_at) < new Date()) return { ok: false as const, reason: 'abgelaufen' };
  if (row.attempts >= p('P-CODE-VERSUCHE')) return { ok: false as const, reason: 'zu_viele' };
  const ok = /^\d{6}$/.test(code) && safeEqual(codeHash(code, accountId), row.code_hash);
  if (!ok) {
    await q('UPDATE verification_codes SET attempts = attempts + 1 WHERE id = $1', [row.id]);
    return { ok: false as const, reason: 'falsch' };
  }
  await q('UPDATE verification_codes SET consumed_at = now() WHERE id = $1', [row.id]);
  return { ok: true as const, targetHash: row.target_hash as Buffer | null, targetEnc: row.target_enc as Buffer | null };
}

async function teamConfirmed(accountId: string, purpose: CodePurpose) {
  const row = await one(
    `UPDATE verification_codes SET consumed_at = now()
      WHERE id = (SELECT id FROM verification_codes
                   WHERE account_id = $1 AND purpose = $2 AND consumed_at IS NULL AND delivery = 'team'
                     AND team_confirmed_at IS NOT NULL AND expires_at > now()
                   ORDER BY created_at DESC LIMIT 1)
      RETURNING target_hash, target_enc`,
    [accountId, purpose],
  );
  if (!row) return { ok: false as const, reason: 'wartet' };
  return { ok: true as const, targetHash: row.target_hash as Buffer | null, targetEnc: row.target_enc as Buffer | null };
}

export async function lastCodeAt(accountId: string, purpose: CodePurpose): Promise<Date | null> {
  const row = await one(
    `SELECT max(created_at) AS at FROM verification_codes WHERE account_id = $1 AND purpose = $2`,
    [accountId, purpose],
  );
  return row?.at ? new Date(row.at) : null;
}

/** Versandbegrenzung je Ziel: höchstens eine E-Mail in P-RESET-SPERRE (AK-F02-07). */
export async function mayMail(target: string, purpose: string, windowS: number): Promise<boolean> {
  const th = blindIndex('send', target);
  const recent = await one(
    `SELECT 1 FROM send_log WHERE target_hash = $1 AND purpose = $2 AND sent_at > now() - make_interval(secs => $3)`,
    [th, purpose, windowS],
  );
  if (recent) return false;
  await q('INSERT INTO send_log (target_hash, purpose) VALUES ($1, $2)', [th, purpose]);
  return true;
}

/** P-SMS-SPERRE: 60 s Abstand, höchstens 5 Codes am Tag je Nummer (AK-Z10-06) — gilt für Telegram weiter. */
export async function maySms(phone: string): Promise<boolean> {
  const { abstand, proTag } = p('P-SMS-SPERRE');
  const th = blindIndex('send', phone);
  const r = await one(
    `SELECT count(*) FILTER (WHERE sent_at > now() - make_interval(secs => $2)) AS recent,
            count(*) FILTER (WHERE sent_at > now() - interval '1 day') AS day
       FROM send_log WHERE target_hash = $1 AND purpose = 'sms'`,
    [th, abstand],
  );
  if (Number(r?.recent) > 0 || Number(r?.day) >= proTag) return false;
  await q(`INSERT INTO send_log (target_hash, purpose) VALUES ($1, 'sms')`, [th]);
  return true;
}

export async function mailCode(to: string, code: string) {
  const minuten = Math.round(p('P-CODE-GUELTIG') / 60);
  await sendMail({
    to,
    subject: t('ST-MAIL-02'),
    preheader: t('ST-MAIL-03'),
    text: t('ST-MAIL-04', { code, minuten }),
    design: { heading: t('ST-MAIL-02'), code },
  });
}

/** Code an eine Mobilnummer über den Telegram-Bot (Issue #32). Ist die Nummer nicht verbunden, wartet er dort. */
export async function phoneCode(to: string, code: string, reason: PhoneReason) {
  if (!(await maySms(to))) return false;
  await sendToPhone(to, t('ST-SMS-02', { code }), reason);
  return true;
}

export function perIpLimit(bucket: string, ipHashHex: string, max: number, windowMs: number) {
  return hit(bucket, ipHashHex, max, windowMs);
}
