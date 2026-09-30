/**
 * Mitteilungsbereich (Z-01). Der Inhalt einer Sicherheitsmitteilung steht nur
 * hier; die Push-Mitteilung sagt nur, dass es etwas gibt (ST-PUSH-10).
 */
import { one, type Queryable, db } from '../db/pool.js';
import { t } from '../lib/texts.js';
import { emit } from './hub.js';
import { sendPush } from './push.js';

export type NoticeKind =
  | 'meldung_entscheidung'
  | 'entscheidung_betroffen'
  | 'export_bereit'
  | 'export_fehler'
  | 'foto'
  | 'widerspruch'
  | 'sperre'
  | 'wiederherstellung'
  | 'checkin'
  | 'hilfe_antwort'
  | 'rueckmeldung_antwort'
  | 'sicherheit'
  | 'ort'
  | 'alterspruefung'
  | 'test_erinnerung'
  | 'veranstaltung'
  | 'date';

export async function createNotice(
  accountId: string,
  kind: NoticeKind,
  title: string,
  body: string,
  ref: string | null = null,
  client: Queryable = db(),
  opts: { push?: boolean; pushTitle?: string; url?: string } = {},
) {
  const row = await one(
    `INSERT INTO notices (account_id, kind, title, body, ref) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [accountId, kind, title, body, ref],
    client,
  );
  emit(accountId, 'mitteilung', { id: row!.id });
  // neutrale Mitteilung ohne Inhalt, unter Beachtung der Ruhezeit
  if (opts.push !== false) {
    sendPush(accountId, 'notice', { title: opts.pushTitle ?? t('ST-PUSH-10'), url: opts.url ?? '/ich/mitteilungen', tag: 'mitteilung' }).catch(() => {});
  }
  return row!.id as string;
}
