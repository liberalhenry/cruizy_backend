import { afterAll, beforeEach } from 'vitest';
import { applyTestEnv } from './env.js';
import { installTestChecks } from './pruefkette.js';

applyTestEnv();
installTestChecks();

// Wie im Betrieb mit angebundenem Abgleich: der Schalter steht an (einzelne Tests schalten ihn um)
beforeEach(async () => {
  const { setParam } = await import('../src/config/params.js');
  setParam('P-HASH-AKTIV', true);
});

afterAll(async () => {
  const { closeDb } = await import('../src/db/pool.js');
  await closeDb();
});
