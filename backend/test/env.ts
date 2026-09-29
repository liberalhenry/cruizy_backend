/** Testumgebung — eigene Datenbank, erfundener Schlüssel, Testbetrieb. */
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export function applyTestEnv() {
  process.env.NODE_ENV = 'test';
  process.env.MASTER_KEY = Buffer.alloc(32, 9).toString('base64');
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgres://cruizy:cruizy@localhost:5432/cruizy_test';
  process.env.OPERATION_MODE = 'test';
  process.env.TEST_INVITE_CODE = 'einladung';
  process.env.COOKIE_SECURE = '0';
  process.env.CLASSIFIER = 'mock-allow';
  process.env.HASH_PROVIDER = 'mock';
  process.env.AGE_PROVIDER ??= 'mock';
  process.env.APP_URL = 'http://localhost:5173';
  process.env.MOD_URL = 'http://localhost:5174';
  process.env.DATA_DIR ??= mkdtempSync(join(tmpdir(), 'cruizy-test-'));
}
