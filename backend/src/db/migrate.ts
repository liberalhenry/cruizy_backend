import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './pool.js';

const here = dirname(fileURLToPath(import.meta.url));

/** Migrationen nur additiv (Arbeitsregel): neue Datei statt Änderung einer alten. */
export async function migrate(log = console.log) {
  const client = await db().connect();
  try {
    await client.query('SELECT pg_advisory_lock(424242)');
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
    const done = new Set(
      (await client.query('SELECT name FROM schema_migrations')).rows.map((r) => r.name as string),
    );
    // Beim Bauen landen die SQL-Dateien neben dem übersetzten Code (siehe Dockerfile)
    const dir = join(here, 'migrations');
    // *.down.sql sind Rückwege (migrateDown), keine Vorwärts-Migrationen
    const files = readdirSync(dir).filter((f) => f.endsWith('.sql') && !f.endsWith('.down.sql')).sort();
    for (const f of files) {
      if (done.has(f)) continue;
      const sql = readFileSync(join(dir, f), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [f]);
        await client.query('COMMIT');
        log(`Migration angewandt: ${f}`);
      } catch (e) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${f} fehlgeschlagen: ${(e as Error).message}`);
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock(424242)').catch(() => {});
    client.release();
  }
}

/**
 * Rückweg einer Migration mit eigener *.down.sql (Issue #19: „Migrationen reversibel“).
 *   npm run migrate:down -- 012_date
 */
export async function migrateDown(name: string, log = console.log) {
  const dir = join(here, 'migrations');
  const base = name.replace(/\.sql$/, '');
  const sql = readFileSync(join(dir, `${base}.down.sql`), 'utf8');
  const client = await db().connect();
  try {
    await client.query('SELECT pg_advisory_lock(424242)');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('DELETE FROM schema_migrations WHERE name = $1', [`${base}.sql`]);
    await client.query('COMMIT');
    log(`Migration zurückgenommen: ${base}.sql`);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    await client.query('SELECT pg_advisory_unlock(424242)').catch(() => {});
    client.release();
  }
}
