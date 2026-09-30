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
import { startupNotes } from './startup.js';
import { discord } from './services/discord.js';
import { appVersion } from './lib/version.js';
import { startTelegram, stopTelegram } from './services/telegram.js';

async function main() {
  const e = env();
  await migrate();
  setOverrides(await q(`SELECT key, value FROM parameters`));

  // Fehlende Prüf- und Versandwege übernimmt das Team (Werkzeug → Bestätigen); hier nur der Überblick
  const notes = startupNotes();
  if (notes.length) console.log('Einrichtung — übernimmt das Team oder ist offen:\n  · ' + notes.join('\n  · '));

  if (e.AGE_PROVIDER === 'ausweis') {
    const { ocrAvailable } = await import('./services/id-check.js');
    if (!(await ocrAvailable())) console.warn('Texterkennung (tesseract) fehlt — jede Ausweisprüfung geht an das Team.');
  }
  await initPush();
  const app = await buildApp();
  await app.listen({ port: e.PORT, host: e.HOST });
  await startJobs();
  // Issue #32: Telegram-Bot (Abholen oder Webhook)
  await startTelegram();
  discord('system', {
    title: 'Server gestartet',
    level: 'ok',
    fields: [
      { name: 'Version', value: appVersion() },
      ...(notes.length ? [{ name: 'Übernimmt das Team / offen', value: String(notes.length), inline: true }] : []),
    ],
  });

  const shutdown = async (sig: string) => {
    console.log(`${sig} — fahre herunter`);
    stopJobs();
    stopTelegram();
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
