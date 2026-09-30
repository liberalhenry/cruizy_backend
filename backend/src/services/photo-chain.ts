/**
 * Prüfkette für öffentliche Profilfotos, Zone 1 (M-02).
 *
 * PRÜFUNG ERFORDERLICH.
 *
 *   Stufe 0  Aufbereitung (in images.prepare, vor dem Speichern)
 *   Stufe 1  Hash-Abgleich — Treffer: Bild gesperrt, versiegelter Fall, kein Text (M-04)
 *   Stufe 2  Klassifikator — Weiche: frei · abgelehnt · Warteschlange
 *   Stufe 3  Mensch (Moderationswerkzeug M10)
 *
 * Geprüft wird IMMER das Original, bevor eine öffentliche Fassung entsteht (AK-M02-01).
 * Der Klassifikatorwert wird nach der Entscheidung gelöscht (AK-M02-08).
 */
import { p } from '../config/params.js';
import { one, q, tx } from '../db/pool.js';
import { deleteFile, getFile, putFile, copyFile } from '../lib/files.js';
import { blurredVersion, clearVersion } from '../lib/images.js';
import { nextNumber } from '../lib/numbers.js';
import { classify, runHashCheck } from '../providers/checks.js';
import { emit } from './hub.js';
import { sendPush } from './push.js';
import { t } from '../lib/texts.js';
import { discord } from './discord.js';

export type ChainOutcome = 'approved' | 'queued' | 'rejected' | 'blocked';

export async function runPhotoChain(photoId: string): Promise<ChainOutcome> {
  const ph = await one(`SELECT * FROM photos WHERE id = $1`, [photoId]);
  if (!ph) throw new Error('Foto fehlt');
  const original = await getFile('zone1-original', ph.original_file);

  // Stufe 1
  const hash = await runHashCheck(original);
  if (hash.hit) {
    await openHashCase({ zone: 1, accountId: ph.account_id, file: ph.original_file, store: 'zone1-original', hash: hash.hash, list: hash.list ?? 'unbekannt' });
    await q(`UPDATE photos SET status = 'blocked', hash_state = 'checked', decided_at = now(), decided_by = 'hash', decided_auto = true WHERE id = $1`, [photoId]);
    return 'blocked';
  }
  await q(`UPDATE photos SET hash_state = $2 WHERE id = $1`, [photoId, hash.state]);

  // Stufe 2
  const score = await classify(original);
  if (score === null || (score >= p('P-KLASS-UNTEN') && score <= p('P-KLASS-OBEN'))) {
    await q(`UPDATE photos SET status = 'queued', queued_at = now(), classifier_score = $2 WHERE id = $1`, [photoId, score]);
    return 'queued';
  }
  if (score > p('P-KLASS-OBEN')) {
    await rejectPhoto(photoId, { reason: 'ST-FEH-13', area: null, by: 'klassifikator', auto: true });
    return 'rejected';
  }
  await approvePhoto(photoId, { by: 'klassifikator', auto: true });
  return 'approved';
}

/** Freigabe: öffentliche Fassung aus dem geprüften Original erzeugen (Ablage B). */
export async function approvePhoto(photoId: string, opts: { by: string; auto: boolean }) {
  const ph = await one(`SELECT * FROM photos WHERE id = $1`, [photoId]);
  if (!ph) return;
  const original = await getFile('zone1-original', ph.original_file);
  const pub = ph.blurred ? await blurredVersion(original) : await clearVersion(original);
  const pubId = await putFile('zone1-public', pub);
  await q(
    `UPDATE photos SET status = 'approved', public_file = $2, decided_at = now(), decided_by = $3, decided_auto = $4,
            classifier_score = NULL, queued_at = NULL WHERE id = $1`,
    [photoId, pubId, opts.by, opts.auto],
  );
  if (ph.public_file) await deleteFile('zone1-public', ph.public_file);
  emit(ph.account_id, 'foto', { id: photoId, status: 'approved' });
  sendPush(ph.account_id, 'photo', { title: t('ST-PUSH-13'), url: '/ich/profil' }).catch(() => {});
}

export async function rejectPhoto(
  photoId: string,
  opts: { reason: string; area: { x: number; y: number; w: number; h: number } | null; by: string; auto: boolean },
) {
  const ph = await one(`SELECT account_id, public_file FROM photos WHERE id = $1`, [photoId]);
  if (!ph) return;
  await q(
    `UPDATE photos SET status = 'rejected', rejection_reason = $2, rejection_area = $3, decided_at = now(),
            decided_by = $4, decided_auto = $5, classifier_score = NULL, queued_at = NULL, public_file = NULL WHERE id = $1`,
    [photoId, opts.reason, opts.area ? JSON.stringify(opts.area) : null, opts.by, opts.auto],
  );
  if (ph.public_file) await deleteFile('zone1-public', ph.public_file);
  emit(ph.account_id, 'foto', { id: photoId, status: 'rejected' });
}

/** Umschalten „unkenntlich“ (F11): die jeweils andere Fassung wird aus dem Original neu erzeugt, die alte gelöscht. */
export async function regeneratePublic(photoId: string) {
  const ph = await one(`SELECT * FROM photos WHERE id = $1`, [photoId]);
  if (!ph || ph.status !== 'approved') return;
  const original = await getFile('zone1-original', ph.original_file);
  const pub = ph.blurred ? await blurredVersion(original) : await clearVersion(original);
  const pubId = await putFile('zone1-public', pub);
  await q(`UPDATE photos SET public_file = $2 WHERE id = $1`, [photoId, pubId]);
  await deleteFile('zone1-public', ph.public_file);
}

/** Hash-Treffer: versiegelter Fall ohne Vorschaubild (M-04, M30). */
export async function openHashCase(opts: {
  zone: 1 | 2;
  accountId: string;
  file: string;
  store: 'zone1-original' | 'zone2';
  hash: string;
  list: string;
}) {
  const sealed = await copyFile(opts.store, opts.file, 'sealed');
  const number = await tx(async (c) => {
    const number = await nextNumber('T', c);
    await c.query(
      `INSERT INTO hash_cases (number, zone, account_ref, sealed_file, hash_value, list_name, deadline_at)
       VALUES ($1, $2, $3, $4, $5, $6, now() + make_interval(secs => $7))`,
      [number, opts.zone, opts.accountId, sealed, opts.hash, opts.list, p('P-TREFFER-PRUEFUNG')],
    );
    // Nr. 31: vorläufige Einschränkung nur in der Stellung „zulässig“ (AK-M04-03/04)
    if (p('P-TREFFER-EINSCHRAENKUNG')) {
      await c.query(`UPDATE accounts SET hash_restricted_at = now() WHERE id = $1`, [opts.accountId]);
    }
    return number as string;
  });
  // Issue #6: nur Fallnummer, Zone und Liste — kein Hashwert, kein Konto, kein Bild
  discord('sicherheit', { title: `Hash-Treffer ${number}`, level: 'danger', fields: [{ name: 'Zone', value: String(opts.zone) }, { name: 'Liste', value: opts.list }] });
}

/**
 * Nachlauf, sobald der Hash-Abgleich angebunden ist (AK-M02-12):
 * alle Bilder mit „Hash-Prüfung ausstehend“ werden abgeglichen.
 */
export async function rerunPendingHashes(): Promise<{ checked: number; hits: number }> {
  const rows = await q(`SELECT id, account_id, original_file FROM photos WHERE hash_state = 'pending' AND status IN ('approved','queued','checking')`);
  let hits = 0;
  for (const r of rows) {
    const img = await getFile('zone1-original', r.original_file);
    const h = await runHashCheck(img);
    if (h.state !== 'checked') break;
    if (h.hit) {
      hits++;
      await openHashCase({ zone: 1, accountId: r.account_id, file: r.original_file, store: 'zone1-original', hash: h.hash, list: h.list ?? 'unbekannt' });
      const ph = await one(`SELECT public_file FROM photos WHERE id = $1`, [r.id]);
      await q(`UPDATE photos SET status = 'blocked', hash_state = 'checked', public_file = NULL WHERE id = $1`, [r.id]);
      await deleteFile('zone1-public', ph?.public_file);
    } else {
      await q(`UPDATE photos SET hash_state = 'checked' WHERE id = $1`, [r.id]);
    }
  }
  const media = await q(`SELECT id, owner_id, file FROM private_media WHERE hash_state = 'pending'`);
  for (const m of media) {
    const img = await getFile('zone2', m.file);
    const h = await runHashCheck(img);
    if (h.state !== 'checked') break;
    if (h.hit) {
      hits++;
      await openHashCase({ zone: 2, accountId: m.owner_id, file: m.file, store: 'zone2', hash: h.hash, list: h.list ?? 'unbekannt' });
      await q(`UPDATE messages SET delivery = 'dropped' WHERE media_id = $1`, [m.id]);
    }
    await q(`UPDATE private_media SET hash_state = 'checked' WHERE id = $1`, [m.id]);
  }
  return { checked: rows.length + media.length, hits };
}
