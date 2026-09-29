/**
 * Legt ein Konto für das Moderationswerkzeug an (M00).
 *
 *   npm run staff:create -- --name "Vorname" --login vorname --role BETRIEB --founder
 *
 * Gibt das Einmalpasswort und die Adresse für die Authenticator-App aus — beides
 * nur dieses eine Mal. Rollen: MOD oder BETRIEB. Gründer sehen die Protokolleinträge
 * des jeweils anderen (M60.03).
 *
 * Weitere Befehle:
 *   --disable --login name     Zugang sperren (Einträge bleiben erhalten)
 *   --reset-totp --login name  neuen zweiten Faktor ausstellen
 */
import { randomUUID } from 'node:crypto';
import * as OTPAuth from 'otpauth';
import { encrypt, hashPassword, randomToken } from '../lib/crypto.js';
import { closeDb, one, q } from '../db/pool.js';
import { migrate } from '../db/migrate.js';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return undefined;
  const v = process.argv[i + 1];
  return v && !v.startsWith('--') ? v : '';
}

function newTotp(login: string) {
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({ issuer: 'Moderation', label: login, secret, digits: 6, period: 30 });
  return { base32: secret.base32, uri: totp.toString() };
}

async function main() {
  await migrate(() => {});
  const login = (arg('login') ?? '').trim().toLowerCase();
  if (!login) throw new Error('--login fehlt');

  if (arg('disable') !== undefined) {
    const r = await one(`UPDATE staff SET disabled_at = now() WHERE login = $1 RETURNING id`, [login]);
    if (!r) throw new Error('Kein Zugang mit diesem Namen');
    await q(`DELETE FROM staff_sessions WHERE staff_id = $1`, [r.id]);
    console.log(`Zugang ${login} gesperrt.`);
    return;
  }

  if (arg('reset-totp') !== undefined) {
    const r = await one(`SELECT id FROM staff WHERE login = $1`, [login]);
    if (!r) throw new Error('Kein Zugang mit diesem Namen');
    const t = newTotp(login);
    await q(`UPDATE staff SET totp_secret_enc = $2 WHERE id = $1`, [r.id, encrypt('totp', t.base32, `staff:${r.id}`)]);
    await q(`DELETE FROM staff_sessions WHERE staff_id = $1`, [r.id]);
    console.log(`Neuer zweiter Faktor für ${login}:\n  ${t.uri}\n  (Schlüssel: ${t.base32})`);
    return;
  }

  const name = (arg('name') ?? '').trim();
  const role = (arg('role') ?? 'MOD').toUpperCase();
  const founder = arg('founder') !== undefined;
  if (!name) throw new Error('--name fehlt');
  if (role !== 'MOD' && role !== 'BETRIEB') throw new Error('--role muss MOD oder BETRIEB sein');

  const id = randomUUID();
  const password = process.env.STAFF_PASSWORD || randomToken(18);
  const t = newTotp(login);
  await q(
    `INSERT INTO staff (id, name, login, role, founder, password_hash, totp_secret_enc) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, name, login, role, founder, await hashPassword(password), encrypt('totp', t.base32, `staff:${id}`)],
  );
  console.log(`Zugang angelegt: ${name} (${login}), Rolle ${role}${founder ? ', Gründer' : ''}`);
  console.log(`Passwort (nur jetzt sichtbar): ${password}`);
  console.log(`Zweiter Faktor — in die Authenticator-App übernehmen:\n  ${t.uri}\n  (Schlüssel: ${t.base32})`);
}

main()
  .then(() => closeDb())
  .catch(async (e) => {
    console.error((e as Error).message);
    await closeDb().catch(() => {});
    process.exit(1);
  });
