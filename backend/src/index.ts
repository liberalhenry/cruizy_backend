/**
 * Startpunkt: Migrationen, Parameter, Startprüfung, Web-Push, Hintergrundaufträge, Server.
 */
import { env } from './config/env.js';
import { setOverrides } from './config/params.js';
import { closeDb, q } from './db/pool.js';
import { migrate } from './db/migrate.js';
import { buildApp } from './app.js';
import { startJobs, stopJobs } from './jobs/index.js';
import { initPush } from './services/push.js';
import { startupProblems, testModeProblems } from './startup.js';
import { discord } from './services/discord.js';
import { appVersion } from './lib/version.js';

async function main() {
  const e = env();
  await migrate();
  setOverrides(await q(`SELECT key, value FROM parameters`));

  const problems = startupProblems();
  if (e.OPERATION_MODE === 'live' && problems.length) {
    console.error('Echtbetrieb nicht möglich — offen ist:\n  · ' + problems.join('\n  · '));
    process.exit(1);
  }
  if (e.OPERATION_MODE === 'test') {
    const notes = [...testModeProblems(), ...problems];
    console.log('TESTBETRIEB — nur erfundene Daten zulässig.' + (notes.length ? '\n  · ' + notes.join('\n  · ') : ''));
  }

  if (e.AGE_PROVIDER === 'ausweis') {
    const { ocrAvailable } = await import('./services/id-check.js');
    if (!(await ocrAvailable())) console.warn('Texterkennung (tesseract) fehlt — jede Ausweisprüfung geht an das Team.');
  }
  await initPush();
  const app = await buildApp();
  await app.listen({ port: e.PORT, host: e.HOST });
  await startJobs();
  discord('system', {
    title: 'Server gestartet',
    level: 'ok',
    fields: [
      { name: 'Version', value: appVersion() },
      { name: 'Betrieb', value: e.OPERATION_MODE },
      ...(problems.length ? [{ name: 'Offen für den Echtbetrieb', value: String(problems.length), inline: true }] : []),
    ],
  });

  const shutdown = async (sig: string) => {
    console.log(`${sig} — fahre herunter`);
    stopJobs();
    await app.close().catch(() => {});
    await closeDb().catch(() => {});
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
