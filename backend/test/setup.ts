import { afterAll } from 'vitest';
import { applyTestEnv } from './env.js';

applyTestEnv();

afterAll(async () => {
  const { closeDb } = await import('../src/db/pool.js');
  await closeDb();
});
