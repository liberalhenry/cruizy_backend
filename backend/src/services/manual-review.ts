/**
 * Prüfung durch das Team, wo kein Prüfpartner angebunden ist (Werkzeug → „Bestätigen“).
 *
 *  * Stufe 2: Ausweis und Selfie mit Geste — volljährig und dieselbe Person?
 *  * Fotoprüfung (F06): Selfie mit Geste — passt es zu den Profilfotos?
 *  * Cruizy Date: Selfie mit Geste — passt es zum ersten Date-Foto?
 *
 * Die Bilder liegen verschlüsselt in der Ablage „idcheck“, nur bis zur Entscheidung
 * (spätestens P-AUSWEIS-AUFBEWAHRUNG). Gespeichert bleiben Ergebnis, Zeitpunkt und wer entschieden hat.
 */
import { p } from '../config/params.js';
import { tx } from '../db/pool.js';
import { putFile } from '../lib/files.js';
import { nextNumber } from '../lib/numbers.js';
import { DATE_POSES } from './catalogs.js';
import { discord } from './discord.js';

export type ManualKind = 'age2' | 'face' | 'date_face';

export const poseLabel = (key: string | null | undefined) => DATE_POSES.find((x) => x.key === key)?.label ?? null;

const TITLE: Record<ManualKind, string> = {
  age2: 'Stufe 2 zur Prüfung',
  face: 'Fotoprüfung zur Prüfung',
  date_face: 'Cruizy Date: Selfie zur Prüfung',
};

export async function openManualReview(opts: {
  kind: ManualKind;
  sessionId: string | null;
  accountId: string;
  images: Buffer[];
  pose: string | null;
  note: string;
}): Promise<string> {
  const files = await Promise.all(opts.images.map((img) => putFile('idcheck', img)));
  const number = await tx(async (c) => {
    const number = await nextNumber('B', c);
    await c.query(
      `INSERT INTO id_reviews (number, kind, session_id, account_id, files, auto_note, pose, deadline_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now() + make_interval(secs => $8))`,
      [number, opts.kind, opts.sessionId, opts.accountId, files, opts.note, opts.pose, p('P-AUSWEIS-FRIST')],
    );
    if (opts.sessionId) await c.query(`UPDATE verification_sessions SET state = 'review' WHERE id = $1`, [opts.sessionId]);
    return number as string;
  });
  discord('alterspruefung', { title: `${TITLE[opts.kind]}: ${number}`, level: 'warn' });
  return number;
}
