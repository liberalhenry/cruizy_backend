/**
 * Hintergrundaufträge — Fristen, Verfall, Löschungen, Berechnungen.
 *
 * Ein Taktgeber prüft alle 15 Sekunden, welcher Auftrag fällig ist, und führt die
 * fälligen nacheinander aus (ein Server-Prozess). Der letzte Lauf steht in job_runs —
 * ein Neustart holt Fälliges nach.
 *
 * Was hier NICHT gelöscht wird: das Zugriffsprotokoll (unveränderlich, mindestens
 * P-PROTOKOLL-DAUER), gesicherte Dateien aus Hash-Fällen (Löschen entscheidet die Behörde),
 * das Kennzahlenarchiv (unveränderlich).
 */
import { p, setOverrides } from '../config/params.js';
import { one, q } from '../db/pool.js';
import { deleteFile } from '../lib/files.js';
import { localParts } from '../lib/time.js';
import { t } from '../lib/texts.js';
import { deleteAccountNow, purgeVaultEntry } from '../services/deletion.js';
import { runExports } from '../services/export.js';
import { createNotice } from '../services/notify.js';
import { rerunPendingHashes, runPhotoChain } from '../services/photo-chain.js';
import { deleteHeldImages, deleteMessages, finalizeExit, purgeConversation } from '../modules/chat.js';
import { runCheckins } from '../modules/checkin.js';
import { purgeEventGroups, remindEvents } from '../modules/events.js';
import { purgeEventChats } from '../modules/veranstalter.js';
import { pruneTiles } from '../modules/karte.js';
import { autoPauseDate, precomputeSuggestions } from '../services/date.js';
import { computeClusters } from '../modules/places.js';
import { finalizeBlock } from '../modules/safety.js';
import { weeklySummary } from '../modules/mod/log.js';
import { closeReview } from '../modules/mod/idcheck.js';
import { discord } from '../services/discord.js';
import { sendHealthReminders } from '../modules/health.js';
import { recomputeResponseRates } from '../services/response-rate.js';

interface Job {
  name: string;
  everyS: () => number;
  run: () => Promise<unknown>;
}

const MIN = 60;
const HOUR = 3600;
const DAY = 86400;

// ───────────── Gespräche ─────────────

async function sweepExits() {
  const rows = await q(`SELECT id FROM conversations WHERE pending_exit_at IS NOT NULL AND pending_exit_at <= now() - interval '2 seconds'`);
  for (const r of rows) await finalizeExit(r.id);
}

/** Verfallende Nachrichten (F47): die kürzere Frist gewinnt (X-01). */
async function expireMessages() {
  for (;;) {
    const rows = await q(`SELECT id FROM messages WHERE expires_at IS NOT NULL AND expires_at <= now() LIMIT 500`);
    if (!rows.length) return;
    await deleteMessages(rows.map((r) => r.id));
    if (rows.length < 500) return;
  }
}

/**
 * Einmal-Bilder (Issue #26): nach dem Ansehen (plus kurzem Meldefenster) und nach
 * P-EINMAL-VERFALL ungeöffnet wird die Datei endgültig gelöscht. Die Nachricht bleibt als
 * Platzhalter („Angesehen“ / „Abgelaufen“) stehen. Gemeldete Bilder liegen als Kopie im Fall.
 */
export async function purgeOnceImages() {
  await q(
    `UPDATE messages SET once_expired_at = now()
      WHERE once AND once_viewed_at IS NULL AND once_expired_at IS NULL AND created_at < now() - make_interval(secs => $1)`,
    [p('P-EINMAL-VERFALL')],
  );
  const rows = await q(
    `SELECT pm.id, pm.file FROM private_media pm JOIN messages m ON m.media_id = pm.id
      WHERE m.once AND pm.file IS NOT NULL
        AND ((m.once_purge_at IS NOT NULL AND m.once_purge_at <= now()) OR m.once_expired_at IS NOT NULL)
      LIMIT 500`,
  );
  for (const r of rows) {
    await q(`UPDATE private_media SET file = NULL WHERE id = $1`, [r.id]);
    await deleteFile('zone2', r.file);
  }
  await q(`UPDATE messages SET once_purge_at = NULL WHERE once AND once_purge_at IS NOT NULL AND once_purge_at <= now()`);
}

/** Archiv (F46): beendete Gespräche nach P-ARCHIV bei beiden gelöscht. */
async function purgeArchive() {
  const rows = await q(`SELECT id FROM conversations WHERE state = 'ended' AND ended_at < now() - make_interval(secs => $1) LIMIT 200`, [p('P-ARCHIV')]);
  for (const r of rows) await purgeConversation(r.id);
}

/** Blockierungen (F61): nach P-BLOCK-RUECKNAHME endgültig. */
async function finalizeBlocks() {
  const rows = await q(
    `SELECT id FROM blocks WHERE revoked_at IS NULL AND NOT finalized_done
        AND (final_at IS NOT NULL OR (revocable_until IS NOT NULL AND revocable_until <= now())) LIMIT 200`,
  );
  for (const r of rows) await finalizeBlock(r.id);
}

/** Bildanfragen (FV-96): unbeantwortet nach P-BILD-ANFRAGE-FRIST → abgelehnt, wartende Bilder gelöscht. */
async function expireMediaRequests() {
  const rows = await q(
    `UPDATE media_grants SET state = 'denied', decided_at = now()
      WHERE state = 'pending' AND requested_at < now() - make_interval(secs => $1)
      RETURNING conversation_id, recipient_id`,
    [p('P-BILD-ANFRAGE-FRIST')],
  );
  for (const r of rows) {
    const c = await one(`SELECT user_low, user_high FROM conversations WHERE id = $1`, [r.conversation_id]);
    if (!c) continue;
    const sender = c.user_low === r.recipient_id ? c.user_high : c.user_low;
    await deleteHeldImages(r.conversation_id, sender);
  }
}

/** Zurückgehaltene Bilder (FV-86): nach P-HALTEN gelöscht, der Absender erfährt davon nichts. */
async function purgeHeld() {
  const rows = await q(
    `SELECT id FROM messages WHERE delivery IN ('held_stage2','dropped') AND created_at < now() - make_interval(secs => $1) LIMIT 500`,
    [p('P-HALTEN')],
  );
  await deleteMessages(rows.map((r) => r.id));
}

// ───────────── Profil ─────────────

/** Absicht (F15): läuft still ab — ohne Mitteilung. */
async function expireIntentions() {
  await q(
    `UPDATE profiles SET intention = NULL, intention_started_at = NULL, intention_expires_at = NULL, intention_expired_at = now()
      WHERE intention IS NOT NULL AND intention_expires_at IS NOT NULL AND intention_expires_at <= now()`,
  );
}

/** Antwortquote (F19, Issue #24): täglich und stündlich für abgelaufene Fristen. */
export async function computeResponseBands() {
  await recomputeResponseRates();
}

async function purgeProvisional() {
  const rows = await q(`SELECT id FROM accounts WHERE status = 'provisional' AND created_at < now() - make_interval(secs => $1) LIMIT 200`, [p('P-KONTO-VORLAEUFIG')]);
  for (const r of rows) await deleteAccountNow(r.id, { vault: false });
}

/** Issue #7: unentschiedene Ausweisprüfungen — spätestens nach P-AUSWEIS-AUFBEWAHRUNG sind die Bilder weg. */
async function expireIdReviews() {
  const rows = await q(`SELECT id FROM id_reviews WHERE decided_at IS NULL AND created_at < now() - make_interval(secs => $1) LIMIT 100`, [p('P-AUSWEIS-AUFBEWAHRUNG')]);
  for (const r of rows) await closeReview(r.id, 'abgelaufen', null);
}

/** Löschung nach der Karenz (F68) und nach FV-17 (nicht volljährig). */
async function runDeletions() {
  const due = await q(`SELECT id FROM accounts WHERE deletion_due_at IS NOT NULL AND deletion_due_at <= now() LIMIT 50`);
  for (const r of due) await deleteAccountNow(r.id);
  const minors = await q(`SELECT id FROM accounts WHERE minor_locked_at IS NOT NULL AND minor_delete_at IS NOT NULL AND minor_delete_at <= now() LIMIT 50`);
  for (const r of minors) await deleteAccountNow(r.id);
  if (due.length + minors.length) {
    discord('konten', { title: 'Konten endgültig gelöscht', level: 'info', fields: [{ name: 'nach Karenz', value: String(due.length) }, { name: 'nicht volljährig', value: String(minors.length) }] });
  }
}

/** Nachlauf-Ablage (FV-97): nach P-LOESCH-NACHLAUF gelöscht, außer sie hängt an einem Meldefall. */
async function purgeVault() {
  const rows = await q(`SELECT id FROM deletion_vault WHERE purge_at <= now() AND report_id IS NULL LIMIT 200`);
  for (const r of rows) await purgeVaultEntry(r.id);
}

async function exportsJob() {
  // hängengebliebene Läufe (Neustart) wieder freigeben
  await q(`UPDATE exports SET status = 'failed' WHERE status = 'running' AND requested_at < now() - interval '1 hour'`);
  await runExports();
  const failed = await q(`UPDATE exports SET status = 'failed', attempts = 99 WHERE status = 'failed' AND attempts = 3 RETURNING account_id`);
  for (const f of failed) await createNotice(f.account_id, 'export_fehler', t('ST-DAT-01'), t('UI-EXPORT-FEHLER'));
  const expired = await q(`DELETE FROM exports WHERE (expires_at IS NOT NULL AND expires_at <= now()) OR (status = 'failed' AND requested_at < now() - interval '7 days') RETURNING file`);
  for (const e of expired) await deleteFile('exports', e.file);
}

async function timeoutVerifications() {
  await q(`UPDATE verification_sessions SET state = 'timeout', finished_at = now() WHERE state = 'pending' AND created_at < now() - make_interval(secs => $1)`, [p('P-PRUEF-TIMEOUT')]);
}

/** Aufräumen kurzlebiger Hilfsdaten. */
async function housekeeping() {
  await q(`DELETE FROM verification_codes WHERE expires_at < now() - interval '1 day'`);
  await q(`DELETE FROM send_log WHERE sent_at < now() - interval '7 days'`);
  await q(`DELETE FROM webauthn_challenges WHERE created_at < now() - interval '1 hour'`);
  await q(`DELETE FROM device_sessions WHERE expires_at < now()`);
  await q(`DELETE FROM staff_sessions WHERE expires_at < now() OR last_seen_at < now() - interval '1 day'`);
  await q(`DELETE FROM recovery_attempts WHERE (completed_at IS NOT NULL OR cancelled_at IS NOT NULL) AND started_at < now() - interval '30 days'`);
  await q(`DELETE FROM guest_sessions WHERE created_at < now() - make_interval(secs => $1)`, [p('P-GAST-PAUSE')]);
  await q(`DELETE FROM push_bundles WHERE sent_at < now() - interval '1 day'`);
  await q(`DELETE FROM mod_approvals WHERE created_at < now() - interval '30 days'`);
  await q(`DELETE FROM inbound_mails WHERE delete_after <= now()`);
  await q(`DELETE FROM place_claims WHERE (delete_after <= now()) OR (status = 'waiting_email' AND created_at < now() - interval '7 days')`);
  // Einzelereignisse der Kennzahlen: nach dem Monatsarchiv nicht länger als 13 Monate
  await q(`DELETE FROM metric_events WHERE at < now() - interval '400 days'`);
  // Issue #27: Profilbesuche nur P-BESUCHE-TAGE; ohne Premium kein „Unsichtbar stöbern“
  await q(`DELETE FROM profile_visits WHERE visited_at < now() - make_interval(days => $1)`, [p('P-BESUCHE-TAGE')]);
  await q(`UPDATE profiles pr SET invisible_browsing = false WHERE invisible_browsing AND NOT EXISTS (
             SELECT 1 FROM entitlements e WHERE e.account_id = pr.account_id AND e.valid_until > now())`);
  // Issue #18: vergangene Reisen
  await q(`DELETE FROM trips WHERE to_date < current_date - 1`);
  // Issue #22: Reihenfolgen der Rastersitzungen
  await q(`DELETE FROM grid_snapshots WHERE created_at < now() - interval '6 hours'`);
}

/** Aufbewahrung von Vorgängen (P-TICKET-AUFBEWAHRUNG) und Meldefällen (P-FALL-AUFBEWAHRUNG, FV-78). */
async function retention() {
  const tickets = await q(`DELETE FROM tickets WHERE delete_after IS NOT NULL AND delete_after <= now() RETURNING attachment_file`);
  for (const tk of tickets) await deleteFile('tickets', tk.attachment_file);
  const reports = await q(
    `SELECT id FROM reports r WHERE status = 'closed' AND retention_until IS NOT NULL AND retention_until <= now()
        AND NOT EXISTS (SELECT 1 FROM authority_reports ar WHERE ar.report_id = r.id)
        AND NOT EXISTS (SELECT 1 FROM appeals a WHERE a.report_id = r.id AND a.decided_at IS NULL) LIMIT 200`,
  );
  for (const r of reports) {
    const files = await q(`SELECT sealed_file FROM report_items WHERE report_id = $1 AND sealed_file IS NOT NULL`, [r.id]);
    await q(`DELETE FROM reports WHERE id = $1`, [r.id]);
    for (const f of files) await deleteFile('sealed', f.sealed_file);
  }
}

/** Fotos, deren Prüfkette durch einen Neustart unterbrochen wurde. */
async function resumePhotoChains() {
  const rows = await q(`SELECT id FROM photos WHERE status = 'checking' AND created_at < now() - interval '5 minutes' LIMIT 20`);
  for (const r of rows) await runPhotoChain(r.id).catch(() => {});
}

async function pendingHashes() {
  if (p('P-HASH-AKTIV')) await rerunPendingHashes();
}

// ───────────── Kennzahlen (Q-16) ─────────────

/** Monatsarchiv: nur Summen je Kohorte, unveränderlich (AK-Q16-01). */
export async function archiveMonth(nowD = new Date()) {
  const l = localParts(nowD);
  const prevYear = l.month === 1 ? l.year - 1 : l.year;
  const prevMonth = l.month === 1 ? 12 : l.month - 1;
  const key = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
  const exists = await one(`SELECT 1 FROM metrics_archive WHERE month = $1`, [key]);
  if (exists) return;
  const start = `${key}-01`;
  const [sums] = await q(
    `WITH r AS (SELECT ($1::date AT TIME ZONE 'Europe/Berlin') AS s, (($1::date + interval '1 month') AT TIME ZONE 'Europe/Berlin') AS e)
     SELECT
       (SELECT count(DISTINCT account_id)::int FROM metric_events, r WHERE kind = 'app_open' AND at >= r.s AND at < r.e) AS mau,
       (SELECT count(*)::int FROM metric_events, r WHERE kind = 'user_created' AND at >= r.s AND at < r.e) AS neu,
       (SELECT count(*)::int FROM metric_events, r WHERE kind = 'message_sent' AND at >= r.s AND at < r.e) AS nachrichten,
       (SELECT count(*)::int FROM metric_events, r WHERE kind = 'contact' AND at >= r.s AND at < r.e) AS kontakte,
       (SELECT count(*)::int FROM metric_events, r WHERE kind = 'first_message' AND at >= r.s AND at < r.e) AS erstnachrichten`,
    [start],
  );
  // Kohorten: aktive Konten dieses Monats nach Anmeldemonat
  const cohorts = await q(
    `WITH r AS (SELECT ($1::date AT TIME ZONE 'Europe/Berlin') AS s, (($1::date + interval '1 month') AT TIME ZONE 'Europe/Berlin') AS e),
          active AS (SELECT DISTINCT account_id FROM metric_events, r WHERE kind = 'app_open' AND at >= r.s AND at < r.e),
          born AS (SELECT account_id, to_char(min(at) AT TIME ZONE 'Europe/Berlin', 'YYYY-MM') AS cohort FROM metric_events WHERE kind = 'user_created' GROUP BY account_id)
     SELECT born.cohort, count(*)::int AS aktiv FROM active JOIN born USING (account_id) GROUP BY born.cohort ORDER BY born.cohort`,
    [start],
  );
  await q(`INSERT INTO metrics_archive (month, data) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [key, JSON.stringify({ ...sums, kohorten: cohorts })]);
}

async function weekly() {
  const l = localParts(new Date());
  if (l.weekday !== 1) return; // montags
  const done = await one(`SELECT 1 FROM staff_notes WHERE kind = 'wochenbericht' AND at > now() - interval '6 days'`);
  if (!done) await weeklySummary();
}

async function reloadParams() {
  const rows = await q(`SELECT key, value FROM parameters`);
  setOverrides(rows);
}

// ───────────── Taktgeber ─────────────

const JOBS: Job[] = [
  { name: 'checkins', everyS: () => 30, run: runCheckins },
  { name: 'exits', everyS: () => MIN, run: sweepExits },
  { name: 'messages_expiry', everyS: () => MIN, run: expireMessages },
  { name: 'once_images', everyS: () => MIN, run: purgeOnceImages },
  { name: 'health_reminders', everyS: () => 15 * MIN, run: () => sendHealthReminders() },
  { name: 'archive', everyS: () => 5 * MIN, run: purgeArchive },
  { name: 'blocks', everyS: () => MIN, run: finalizeBlocks },
  { name: 'intentions', everyS: () => MIN, run: expireIntentions },
  { name: 'media_requests', everyS: () => 10 * MIN, run: expireMediaRequests },
  { name: 'held', everyS: () => 10 * MIN, run: purgeHeld },
  { name: 'response_bands', everyS: () => HOUR, run: computeResponseBands },
  { name: 'provisional', everyS: () => 10 * MIN, run: purgeProvisional },
  { name: 'deletions', everyS: () => 10 * MIN, run: runDeletions },
  { name: 'vault', everyS: () => HOUR, run: purgeVault },
  { name: 'exports', everyS: () => MIN, run: exportsJob },
  { name: 'verifications', everyS: () => 10 * MIN, run: timeoutVerifications },
  { name: 'clusters', everyS: () => p('P-CLUSTER-TAKT'), run: computeClusters },
  { name: 'event_reminders', everyS: () => 5 * MIN, run: remindEvents },
  { name: 'event_groups', everyS: () => HOUR, run: purgeEventGroups },
  { name: 'event_chats', everyS: () => 6 * HOUR, run: purgeEventChats },
  { name: 'map_tiles', everyS: () => 24 * HOUR, run: pruneTiles },
  // Issue #19: Tagesvorschläge nach Mitternacht vorberechnen, Auto-Pause nach Inaktivität
  { name: 'date_suggestions', everyS: () => HOUR, run: precomputeSuggestions },
  { name: 'date_autopause', everyS: () => 6 * HOUR, run: autoPauseDate },
  { name: 'housekeeping', everyS: () => HOUR, run: housekeeping },
  { name: 'retention', everyS: () => 6 * HOUR, run: retention },
  { name: 'id_reviews', everyS: () => HOUR, run: expireIdReviews },
  { name: 'photo_chains', everyS: () => 5 * MIN, run: resumePhotoChains },
  { name: 'pending_hashes', everyS: () => 6 * HOUR, run: pendingHashes },
  { name: 'metrics_archive', everyS: () => 6 * HOUR, run: archiveMonth },
  { name: 'weekly_summary', everyS: () => 6 * HOUR, run: weekly },
  { name: 'params', everyS: () => MIN, run: reloadParams },
];

const lastRun = new Map<string, number>();
let ticking = false;
let timer: NodeJS.Timeout | null = null;

/**
 * Fällige Aufträge laufen NACHEINANDER. So belegt der Taktgeber höchstens eine
 * Verbindung zusätzlich, und die Anfragen der Nutzer behalten den Rest des Pools.
 * (Gleichzeitige Aufträge mit gehaltener Sperrverbindung können den Pool leerlaufen lassen.)
 */
async function tick() {
  if (ticking) return;
  ticking = true;
  try {
    for (const job of JOBS) {
      const last = lastRun.get(job.name) ?? 0;
      if (Date.now() - last < job.everyS() * 1000) continue;
      lastRun.set(job.name, Date.now());
      await runOne(job);
    }
  } finally {
    ticking = false;
  }
}

async function runOne(job: Job) {
  try {
    await job.run();
    await q(`INSERT INTO job_runs (name, last_run) VALUES ($1, now()) ON CONFLICT (name) DO UPDATE SET last_run = now()`, [job.name]);
  } catch (e) {
    console.error(`Auftrag ${job.name} fehlgeschlagen:`, (e as Error).message);
    discord('system', { title: `Hintergrundauftrag fehlgeschlagen: ${job.name}`, level: 'danger', description: (e as Error).name });
  }
}

export async function startJobs() {
  const rows = await q(`SELECT name, last_run FROM job_runs`);
  for (const r of rows) lastRun.set(r.name, new Date(r.last_run).getTime());
  // Minutenaufträge nach dem Start sofort; seltene nach ihrem Takt
  for (const j of JOBS) if (j.everyS() <= 10 * MIN) lastRun.delete(j.name);
  timer = setInterval(() => tick().catch(() => {}), 15_000);
  timer.unref();
  // der erste Durchlauf blockiert den Start nicht
  tick().catch(() => {});
}

export function stopJobs() {
  if (timer) clearInterval(timer);
  timer = null;
}

export { JOBS };
