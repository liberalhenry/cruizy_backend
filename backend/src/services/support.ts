/**
 * Support-Portal (Issue #37): Datenfreigabe für das Team.
 *
 *  * Das Team bittet in einem Vorgang um Einsicht in Konto-, Profil- oder Diagnosedaten — mit Begründung.
 *  * Sichtbar wird davon erst etwas, wenn die Person in der App zustimmt. Die Freigabe gilt
 *    P-SUPPORT-FREIGABE, lässt sich jederzeit widerrufen und endet mit dem Abschluss des Vorgangs.
 *  * Diagnosedaten schickt das Gerät erst bei der Freigabe; sie liegen verschlüsselt und werden beim
 *    Ablauf, Widerruf oder Abschluss gelöscht.
 *  * Kontaktdaten erscheinen nur gekürzt; Nachrichten, Fotos, Standort und Ausweisbilder gehören nie dazu.
 */
import { p } from '../config/params.js';
import { one, q } from '../db/pool.js';
import { decStr, encStr } from '../lib/crypto.js';

export const SCOPES = ['konto', 'profil', 'diagnose'] as const;
export type Scope = (typeof SCOPES)[number];

export interface DataRequestView {
  id: string;
  scope: Scope[];
  reason: string;
  status: 'offen' | 'freigegeben' | 'abgelehnt' | 'widerrufen' | 'abgelaufen';
  createdAt: Date;
  decidedAt: Date | null;
  expiresAt: Date | null;
}

export function viewRequest(r: Record<string, any>): DataRequestView {
  return {
    id: r.id,
    scope: r.scope,
    reason: r.reason,
    status: r.status,
    createdAt: r.created_at,
    decidedAt: r.decided_at,
    expiresAt: r.expires_at,
  };
}

export async function requestsFor(ticketId: string): Promise<DataRequestView[]> {
  const rows = await q(`SELECT * FROM support_data_requests WHERE ticket_id = $1 ORDER BY created_at`, [ticketId]);
  return rows.map(viewRequest);
}

/** Beim Abschluss eines Vorgangs: offene und laufende Freigaben enden, Diagnosedaten werden gelöscht. */
export async function endRequestsOf(ticketId: string) {
  await q(
    `UPDATE support_data_requests SET status = 'abgelaufen', diagnostics_enc = NULL, expires_at = COALESCE(LEAST(expires_at, now()), now())
      WHERE ticket_id = $1 AND status IN ('offen','freigegeben')`,
    [ticketId],
  );
}

/** Hintergrundauftrag: unbeantwortete Anfragen und abgelaufene Freigaben beenden. */
export async function expireDataRequests() {
  await q(
    `UPDATE support_data_requests SET status = 'abgelaufen', diagnostics_enc = NULL
      WHERE (status = 'offen' AND created_at < now() - make_interval(secs => $1))
         OR (status = 'freigegeben' AND expires_at <= now())`,
    [p('P-SUPPORT-ANFRAGE-OFFEN')],
  );
}

export function sealDiagnostics(requestId: string, data: unknown): Buffer {
  return encStr('tickets', JSON.stringify(data), `diagnose:${requestId}`);
}

function mask(value: string | null, kind: 'email' | 'phone'): string | null {
  if (!value) return null;
  if (kind === 'phone') return `${value.slice(0, 3)} … ${value.slice(-2)}`;
  const [local, domain] = value.split('@');
  return `${local.slice(0, 1)}…@${domain}`;
}

/** Was das Team nach der Freigabe sieht — je Bereich. */
export async function releasedData(req: { id: string; account_id: string; scope: Scope[]; diagnostics_enc: Buffer | null }) {
  const id = req.account_id;
  const out: Record<string, unknown> = {};
  if (req.scope.includes('konto')) {
    const a = await one(`SELECT * FROM accounts WHERE id = $1`, [id]);
    if (a) {
      const sessions = await one(`SELECT count(*)::int AS n, max(last_seen_at) AS last FROM device_sessions WHERE account_id = $1`, [id]).catch(() => null);
      const devices = await one(`SELECT count(*)::int AS n FROM known_devices WHERE account_id = $1`, [id]);
      const push = await one(`SELECT count(*)::int AS n FROM push_subscriptions WHERE account_id = $1`, [id]);
      const ent = await q(`SELECT tier, source, valid_until FROM entitlements WHERE account_id = $1 AND valid_until > now()`, [id]);
      const tg = await one(`SELECT 1 FROM telegram_chats WHERE account_id = $1 OR (phone_hash IS NOT NULL AND phone_hash = $2)`, [id, a.phone_hash ?? null]);
      out.konto = {
        angelegt: a.created_at,
        status: a.status,
        anmeldeweg: a.primary_method,
        email: mask(decStr('pii', a.email_enc, 'email'), 'email'),
        emailBestaetigt: !!a.email_verified_at,
        nummer: mask(decStr('pii', a.phone_enc, 'phone'), 'phone'),
        nummerBestaetigt: !!a.phone_verified_at,
        eingewilligt: a.consented_at,
        altersgeprueft: !!a.age1_at,
        stufe2: !!a.age2_at,
        moderation: a.moderation_state,
        loeschungGeplant: a.deletion_due_at,
        wiederherstellungscode: !!a.recovery_code_hash,
        sitzungen: sessions?.n ?? null,
        zuletztAktiv: sessions?.last ?? null,
        bekannteGeraete: devices!.n,
        pushGeraete: push!.n,
        telegramVerbunden: !!tg,
        abo: ent.map((e) => ({ stufe: e.tier, quelle: e.source, bis: e.valid_until })),
      };
    }
  }
  if (req.scope.includes('profil')) {
    const pr = await one(`SELECT * FROM profiles WHERE account_id = $1`, [id]);
    if (pr) {
      const photos = await q(`SELECT status, count(*)::int AS n FROM photos WHERE account_id = $1 GROUP BY status`, [id]);
      const loc = await one(`SELECT level, city_id, updated_at FROM locations WHERE account_id = $1`, [id]).catch(() => null);
      const date = await one(`SELECT status, verified_at, activated_at FROM date_access WHERE account_id = $1`, [id]).catch(() => null);
      out.profil = {
        name: pr.name,
        alter: pr.age ?? null,
        absicht: pr.intention ?? null,
        fotos: Object.fromEntries(photos.map((x) => [x.status, x.n])),
        standortStufe: loc?.level ?? null,
        standortAktualisiert: loc?.updated_at ?? null,
        einstellungen: {
          sortierung: pr.sort_mode,
          medien: pr.media_receive,
          push: pr.push_enabled,
          ruhezeit: `${pr.quiet_from}–${pr.quiet_to}`,
          mitteilungenPerMail: pr.notify_email,
          mitteilungenPerTelegram: pr.notify_telegram,
          namenssuche: pr.name_searchable,
        },
        date: date ? { status: date.status, verifiziert: !!date.verified_at, aktiv: date.activated_at } : null,
      };
    }
  }
  if (req.scope.includes('diagnose')) {
    out.diagnose = req.diagnostics_enc ? JSON.parse(decStr('tickets', req.diagnostics_enc, `diagnose:${req.id}`) ?? 'null') : null;
  }
  return out;
}
