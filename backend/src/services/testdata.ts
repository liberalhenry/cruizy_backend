/**
 * Erfundene Beispieldaten aus dem früheren Testbetrieb (Spalte is_test_data) — zählen und löschen.
 * Im Werkzeug unter „Einrichtung“ (Owner); in der Entwicklung auch über `npm run seed:test -- --clear`.
 */
import { one, q } from '../db/pool.js';
import { deleteFile } from '../lib/files.js';
import { deleteAccountNow } from './deletion.js';

export async function countTestData() {
  const r = await one(
    `SELECT (SELECT count(*)::int FROM accounts WHERE is_test_data) AS konten,
            (SELECT count(*)::int FROM places WHERE is_test_data) AS orte,
            (SELECT count(*)::int FROM events WHERE is_test_data) AS termine,
            (SELECT count(*)::int FROM organizers WHERE is_test_data) AS veranstalter`,
  );
  return { konten: r!.konten as number, orte: r!.orte as number, termine: r!.termine as number, veranstalter: r!.veranstalter as number };
}

export async function clearTestData() {
  const before = await countTestData();
  const rows = await q(`SELECT id FROM accounts WHERE is_test_data`);
  for (const r of rows) await deleteAccountNow(r.id, { vault: false });
  const files = await q(`SELECT ei.file FROM event_images ei JOIN events e ON e.id = ei.event_id WHERE e.is_test_data`);
  for (const f of files) await deleteFile('zone1-public', f.file);
  await q(`DELETE FROM events WHERE is_test_data`);
  await q(`DELETE FROM organizers WHERE is_test_data`);
  await q(`DELETE FROM places WHERE is_test_data`);
  return before;
}
