/** Einmal je Testlauf: Schema der Testdatenbank neu anlegen. */
import pg from 'pg';
import { applyTestEnv } from './env.js';

export default async function () {
  applyTestEnv();
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
  await client.end();
  const { migrate } = await import('../src/db/migrate.js');
  const { closeDb } = await import('../src/db/pool.js');
  await migrate(() => {});
  await closeDb();
}
