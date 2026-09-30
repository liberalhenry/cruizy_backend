/**
 * Getrennte, verschlüsselte Ablagen (M-01, A-37 Abschnitt 6).
 *
 * PRÜFUNG ERFORDERLICH.
 *
 * Jede Ablage hat ein eigenes Verzeichnis und einen eigenen Schlüssel. Datei-
 * kennungen sind Zufallswerte (UUID v4) und nicht aus anderen Kennungen
 * ableitbar (AK-F11-03). Das Moderationswerkzeug bekommt keinen Zugriff auf die
 * Ablage „zone2“; es liest nur Kopien in „sealed“, die über einen Fall entstehen.
 */
import { mkdirSync } from 'node:fs';
import { readFile, rm, writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { decrypt, encrypt, type KeyPurpose } from './crypto.js';

export type Store = 'zone1-original' | 'zone1-public' | 'zone2' | 'sealed' | 'exports' | 'tickets' | 'idcheck';

const storeKey: Record<Store, KeyPurpose> = {
  'zone1-original': 'zone1',
  'zone1-public': 'zone1',
  zone2: 'zone2',
  sealed: 'sealed',
  exports: 'export',
  tickets: 'tickets',
  idcheck: 'idcheck',
};

function dir(store: Store) {
  const d = join(env().DATA_DIR, 'media', store);
  mkdirSync(d, { recursive: true });
  return d;
}

function path(store: Store, id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new Error('Ungültige Dateikennung');
  return join(dir(store), id);
}

export async function putFile(store: Store, data: Buffer): Promise<string> {
  const id = randomUUID();
  const p = path(store, id);
  const tmp = `${p}.tmp`;
  await writeFile(tmp, encrypt(storeKey[store], data, `${store}:${id}`));
  await rename(tmp, p);
  return id;
}

export async function getFile(store: Store, id: string): Promise<Buffer> {
  const blob = await readFile(path(store, id));
  return decrypt(storeKey[store], blob, `${store}:${id}`);
}

export async function deleteFile(store: Store, id: string | null | undefined) {
  if (!id) return;
  await rm(path(store, id), { force: true });
}

/** Kopie in eine andere Ablage (z. B. gemeldetes Bild → versiegelter Fall). */
export async function copyFile(from: Store, id: string, to: Store): Promise<string> {
  return putFile(to, await getFile(from, id));
}

export function storeDir(store: Store) {
  return dir(store);
}
