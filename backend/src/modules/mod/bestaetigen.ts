/**
 * „Bestätigen“ und „Einrichtung“ im Werkzeug — was das Team übernimmt, solange ein Prüf- oder
 * Versandweg in der .env fehlt, dazu die Zähler für die Seitenleiste.
 *
 *  * Adressen und Nummern: Codes, die mangels SMTP bzw. Telegram-Bot nicht zugestellt werden
 *    konnten. Das Team sieht nur eine gekürzte Adresse und bestätigt oder lehnt ab; die App der
 *    Person geht danach von selbst weiter. Jede Bestätigung steht im Zugriffsprotokoll.
 *  * Einrichtung (Owner, BETRIEB): was angebunden ist, was das Team übernimmt, und das Löschen der
 *    erfundenen Beispieldaten aus dem früheren Testbetrieb.
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one, q } from '../../db/pool.js';
import { decStr } from '../../lib/crypto.js';
import { AppError, notFound } from '../../lib/errors.js';
import { body, idParam, params } from '../../lib/http.js';
import { clearTestData, countTestData } from '../../services/testdata.js';
import { setupStatus } from '../../startup.js';
import { logged, requireStaff } from './core.js';

const PURPOSE: Record<string, string> = {
  verify_email: 'E-Mail-Adresse bei der Registrierung',
  verify_phone: 'Mobilnummer bei der Registrierung',
  add_email: 'E-Mail-Adresse als zweiter Weg',
  add_phone: 'Mobilnummer als zweiter Weg',
  login_phone: 'Anmeldung auf einem neuen Gerät',
};

function mask(value: string | null, kind: 'email' | 'phone'): string {
  if (!value) return '—';
  if (kind === 'phone') return `${value.slice(0, 4)} … ${value.slice(-2)}`;
  const [local, domain] = value.split('@');
  return `${local.slice(0, 2)}…@${domain}`;
}

const caseRef = (id: string) => `K-${id.slice(0, 8).toUpperCase()}`;

export default async function bestaetigenRoutes(app: FastifyInstance) {
  /** Zähler für die Seitenleiste: was wartet wo? */
  app.get('/mod-api/nav', async (req) => {
    const s = await requireStaff(req);
    const r = await one(
      `SELECT
         (SELECT count(*)::int FROM tickets WHERE status IN ('eingegangen','in_bearbeitung')) AS postfach,
         (SELECT count(*)::int FROM tickets WHERE status IN ('eingegangen','in_bearbeitung') AND (deadline_at < now() OR category = 1)) AS postfach_rot,
         (SELECT count(*)::int FROM id_reviews WHERE decided_at IS NULL) AS pruefungen,
         (SELECT count(*)::int FROM verification_codes WHERE delivery = 'team' AND consumed_at IS NULL AND team_confirmed_at IS NULL AND expires_at > now()) AS kontakte,
         (SELECT count(*)::int FROM photos WHERE status = 'queued') AS bilder,
         (SELECT count(*)::int FROM reports WHERE status IN ('received','in_review')) AS meldungen,
         (SELECT count(*)::int FROM hash_cases WHERE status = 'open') AS hash,
         (SELECT count(*)::int FROM suspensions WHERE approved_at IS NULL AND rejected_at IS NULL AND requested_by <> $1)
           + (SELECT count(*)::int FROM mod_approvals WHERE approved_by IS NULL AND rejected_at IS NULL AND requested_by <> $1 AND created_at > now() - interval '1 day') AS freigaben,
         (SELECT count(*)::int FROM appeals WHERE decided_at IS NULL) AS widersprueche,
         (SELECT count(*)::int FROM place_claims WHERE status IN ('open','question')) AS orte,
         (SELECT count(*)::int FROM inbound_mails WHERE status = 'open') + (SELECT count(*)::int FROM events WHERE status = 'pending') AS termine,
         (SELECT count(*)::int FROM events WHERE status = 'approved' AND checked_at IS NULL AND ends_at > now()) AS veranstaltungen,
         (SELECT count(*)::int FROM organizers WHERE status = 'beantragt') AS veranstalter,
         (SELECT count(*)::int FROM date_photos WHERE status = 'queued') AS date,
         (SELECT count(*)::int FROM authority_reports WHERE sent_at IS NULL) AS art18`,
      [s.id],
    );
    return { ...r, bestaetigen: r!.pruefungen + r!.kontakte };
  });

  // ───── Adressen und Nummern ohne Versand ─────
  app.get('/mod-api/contacts', async (req) => {
    await requireStaff(req);
    const rows = await q(
      `SELECT c.id, c.purpose, c.target_enc, c.created_at, c.expires_at, a.email_enc, a.phone_enc, a.created_at AS account_since, pr.name
         FROM verification_codes c
         JOIN accounts a ON a.id = c.account_id
         LEFT JOIN profiles pr ON pr.account_id = a.id
        WHERE c.delivery = 'team' AND c.consumed_at IS NULL AND c.team_confirmed_at IS NULL AND c.expires_at > now()
        ORDER BY c.created_at`,
    );
    const done = await q(
      `SELECT c.id, c.purpose, c.team_confirmed_at, st.name AS by FROM verification_codes c LEFT JOIN staff st ON st.id = c.team_confirmed_by
        WHERE c.delivery = 'team' AND c.team_confirmed_at > now() - interval '7 days' ORDER BY c.team_confirmed_at DESC LIMIT 50`,
    );
    return {
      items: rows.map((r) => {
        const kind = r.purpose.endsWith('email') ? 'email' : 'phone';
        const raw = r.target_enc ? decStr('pii', r.target_enc, kind) : kind === 'email' ? decStr('pii', r.email_enc, 'email') : decStr('pii', r.phone_enc, 'phone');
        return {
          id: r.id,
          ref: caseRef(r.id),
          purpose: r.purpose,
          label: PURPOSE[r.purpose] ?? r.purpose,
          target: mask(raw, kind),
          name: r.name ?? null,
          accountSince: r.account_since,
          createdAt: r.created_at,
          expiresAt: r.expires_at,
          risky: r.purpose === 'login_phone',
        };
      }),
      done: done.map((d) => ({ ref: caseRef(d.id), label: PURPOSE[d.purpose] ?? d.purpose, at: d.team_confirmed_at, by: d.by ?? '—' })),
      // was das Team gerade übernimmt (ohne Geheimnisse aus der .env)
      manual: setupStatus()
        .filter((x) => x.state === 'team')
        .map((x) => ({ label: x.label, detail: x.detail })),
    };
  });

  app.post('/mod-api/contacts/:id/:decision', async (req) => {
    const s = await requireStaff(req);
    const { id, decision } = params(req, idParam.extend({ decision: z.enum(['bestaetigen', 'ablehnen']) }));
    const b = body(req, z.object({ reason: z.string().trim().min(3).max(500) }));
    const c = await one(`SELECT id, purpose FROM verification_codes WHERE id = $1 AND delivery = 'team' AND consumed_at IS NULL AND team_confirmed_at IS NULL`, [id]);
    if (!c) throw notFound();
    await logged(s, caseRef(c.id), `kontakt_${decision}_${c.purpose}`, b.reason, async (cl) => {
      if (decision === 'bestaetigen') {
        await cl.query(`UPDATE verification_codes SET team_confirmed_at = now(), team_confirmed_by = $2 WHERE id = $1`, [id, s.id]);
      } else {
        await cl.query(`UPDATE verification_codes SET consumed_at = now() WHERE id = $1`, [id]);
      }
    });
    return { ok: true };
  });

  // ───── Einrichtung ─────
  app.get('/mod-api/einrichtung', async (req) => {
    const s = await requireStaff(req);
    if (!s.founder && s.role !== 'BETRIEB') throw new AppError(403, 'UI-MOD-RECHT', {}, 'recht');
    return { setup: setupStatus(), testdata: await countTestData() };
  });

  app.post('/mod-api/einrichtung/testdaten-loeschen', async (req) => {
    const s = await requireStaff(req);
    if (!s.founder) throw new AppError(403, 'UI-MOD-RECHT', {}, 'recht');
    const b = body(req, z.object({ reason: z.string().trim().min(3).max(500) }));
    // erst der Protokolleintrag, dann das Löschen (eigene Vorgänge je Konto)
    await logged(s, 'EINRICHTUNG', 'testdaten_geloescht', b.reason, async () => null);
    return { ok: true, removed: await clearTestData() };
  });
}
