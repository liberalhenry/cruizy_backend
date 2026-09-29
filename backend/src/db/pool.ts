import pg from 'pg';
import { env } from '../config/env.js';

// timestamptz als Date, bigint (count) als Zahl
pg.types.setTypeParser(20, (v) => Number(v));

let pool: pg.Pool | null = null;

export function db(): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: env().DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30_000,
    });
    pool.on('error', (err) => {
      console.error('Datenbankverbindung abgebrochen:', err.message);
    });
  }
  return pool;
}

export type Queryable = pg.Pool | pg.PoolClient;

export async function q<T extends pg.QueryResultRow = any>(
  text: string,
  params: unknown[] = [],
  client: Queryable = db(),
): Promise<T[]> {
  const res = await client.query<T>(text, params as any[]);
  return res.rows;
}

export async function one<T extends pg.QueryResultRow = any>(
  text: string,
  params: unknown[] = [],
  client: Queryable = db(),
): Promise<T | null> {
  const rows = await q<T>(text, params, client);
  return rows[0] ?? null;
}

/** Führt fn in einer Transaktion aus. */
export async function tx<T>(fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await db().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
