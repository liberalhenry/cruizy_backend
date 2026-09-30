/**
 * Mitteilungsbereich (Z-01). Der Inhalt einer Sicherheitsmitteilung steht nur
 * hier; die Push-Mitteilung sagt nur, dass es etwas gibt (ST-PUSH-10).
 */
import { one, type Queryable, db } from '../db/pool.js';
import { t } from '../lib/texts.js';
import { emit } from './hub.js';
import { sendPush } from './push.js';
import { forwardNotice, track } from './notice-forward.js';

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
  | 'date'
  | 'hilfe_freigabe';

/**
 * Issue #36: Ziel in der App, zu dem eine Mitteilung per Knopf springt. Ausdrücklich
 * übergeben (opts.url) gilt vor dem Ziel, das sich aus Art und Nummer ergibt.
 */
export function noticeTarget(kind: string, ref: string | null, url?: string | null): string | null {
  if (url && url !== '/ich/mitteilungen') return url;
  switch (kind) {
    case 'checkin':
      return ref ? `/sicherheit/check-in?frage=${encodeURIComponent(ref)}` : '/ich/check-in';
    case 'meldung_entscheidung':
    case 'entscheidung_betroffen':
    case 'widerspruch':
    case 'sperre':
    case 'foto':
      return '/ich/meldungen';
    case 'export_bereit':
    case 'export_fehler':
      return '/ich/daten';
    case 'hilfe_antwort':
    case 'hilfe_freigabe':
      return ref ? `/ich/hilfe?vorgang=${encodeURIComponent(ref)}` : '/ich/hilfe';
    case 'test_erinnerung':
      return '/ich/gesundheit';
    case 'alterspruefung':
      return '/pruefung';
    case 'sicherheit':
      return '/ich/sicherheit';
    case 'date':
      return '/date';
    case 'veranstaltung':
      if (ref?.startsWith('veranstaltung:')) return `/ereignisse/${ref.slice('veranstaltung:'.length)}`;
      return '/veranstalter';
    default:
      return null;
  }
}

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
    `INSERT INTO notices (account_id, kind, title, body, ref, url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [accountId, kind, title, body, ref, opts.url && opts.url !== '/ich/mitteilungen' ? opts.url : null],
    client,
  );
  emit(accountId, 'mitteilung', { id: row!.id });
  // Issue #35: auf Wunsch zusätzlich per E-Mail oder Telegram
  forwardNotice(accountId, { kind, title, body, target: noticeTarget(kind, ref, opts.url) });
  // neutrale Mitteilung ohne Inhalt, unter Beachtung der Ruhezeit
  if (opts.push !== false) {
    track(sendPush(accountId, 'notice', { title: opts.pushTitle ?? t('ST-PUSH-10'), url: opts.url ?? '/ich/mitteilungen', tag: 'mitteilung' }));
  }
  return row!.id as string;
}
