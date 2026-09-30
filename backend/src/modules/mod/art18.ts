/**
 * M80 · Meldung nach Art. 18 DSA — vier Pflichtangaben, ein Knopf, zwei Menschen.
 *  * Pflichtangaben aus dem Fall vorbelegt (M80.01); fehlende rot, eine fehlende IP
 *    verhindert die Meldung nicht (M80.03).
 *  * Der Sachverhaltstext muss gelesen und bestätigt werden (M80.02).
 *  * Gegenzeichnung durch eine andere Person (M80.04) — ein Owner zeichnet auch den eigenen
 *    Entwurf, gekennzeichnet im Protokoll (Issue #3). Die Datenbank prüft dieselbe Regel.
 *  * Absenden nur BETRIEB, nur nach Gegenzeichnung (M80.05); Vorgangsnummer der Behörde Pflicht (M80.06).
 *  * Nachträge statt Zurückziehen (M80.07). Eine Meldung wird nie gelöscht.
 *
 * Das Absenden selbst geschieht über das Portal der Behörde — das Werkzeug hält fest,
 * dass und wann gemeldet wurde, und mit welcher Vorgangsnummer.
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one, q } from '../../db/pool.js';
import { decStr } from '../../lib/crypto.js';
import { AppError, bad, conflict, notFound } from '../../lib/errors.js';
import { body, idParam, params } from '../../lib/http.js';
import { getSetting, logged, needsSecondPerson, requireStaff, setSetting } from './core.js';

async function caseFor(ref: string) {
  const r = await one(`SELECT id, number, created_at, target_id, reason, context FROM reports WHERE number = $1`, [ref.trim()]);
  if (r) return { kind: 'meldung' as const, id: r.id as string, number: r.number as string, createdAt: new Date(r.created_at), accountId: r.target_id as string | null, detail: `Meldegrund: ${r.reason}; Kontext: ${r.context}`, ipEnc: null };
  const h = await one(`SELECT id, number, created_at, account_ref, list_name, zone, ip_enc FROM hash_cases WHERE number = $1`, [ref.trim()]);
  if (h) return { kind: 'hash' as const, id: h.id as string, number: h.number as string, createdAt: new Date(h.created_at), accountId: h.account_ref as string | null, detail: `Treffer gegen Liste ${h.list_name}, Zone ${h.zone}`, ipEnc: h.ip_enc as Buffer | null };
  return null;
}

async function accountData(accountId: string | null) {
  if (!accountId) return null;
  const a = await one(`SELECT id, created_at, email_enc, phone_enc, primary_method FROM accounts WHERE id = $1`, [accountId]);
  if (!a) return null;
  return {
    id: a.id as string,
    createdAt: a.created_at as Date,
    email: decStr('pii', a.email_enc, 'email'),
    phone: decStr('pii', a.phone_enc, 'phone'),
  };
}

function draftText(cs: NonNullable<Awaited<ReturnType<typeof caseFor>>>, acc: Awaited<ReturnType<typeof accountData>>, ip: string | null) {
  return [
    'Meldung nach Art. 18 DSA',
    '',
    `Eigene Vorgangsnummer: ${cs.number}`,
    `Sachverhalt: Auf unserer Plattform wurde ein Inhalt festgestellt, der den Verdacht einer Straftat begründet, die eine Gefahr für das Leben oder die Sicherheit einer Person darstellt. ${cs.detail}.`,
    `Zeitpunkt der Veröffentlichung/Feststellung: ${cs.createdAt.toISOString()}`,
    `Konto-ID: ${acc?.id ?? '— fehlt —'}`,
    `Nutzerangaben: ${acc ? [acc.email && `E-Mail ${acc.email}`, acc.phone && `Telefon ${acc.phone}`, `angelegt ${new Date(acc.createdAt).toISOString()}`].filter(Boolean).join(', ') : '— fehlt —'}`,
    `IP-Adresse: ${ip ?? '— nicht vorhanden —'}`,
    '',
    'Der Inhalt ist gesichert und gesperrt. Er wird bis zu einer Entscheidung der Behörde nicht gelöscht.',
  ].join('\n');
}

export default async function art18Routes(app: FastifyInstance) {
  app.get('/mod-api/art18', async (req) => {
    await requireStaff(req);
    const rows = await q(
      `SELECT ar.id, ar.drafted_at, ar.countersigned_at, ar.sent_at, ar.authority_ref, ar.confirmed_text, ar.drafted_by,
              COALESCE(r.number, h.number) AS case_ref, COALESCE(r.created_at, h.created_at) AS case_at,
              d.name AS drafted_name, cs.name AS countersigned_name, se.name AS sent_name
         FROM authority_reports ar
         LEFT JOIN reports r ON r.id = ar.report_id LEFT JOIN hash_cases h ON h.id = ar.hash_case_id
         JOIN staff d ON d.id = ar.drafted_by LEFT JOIN staff cs ON cs.id = ar.countersigned_by LEFT JOIN staff se ON se.id = ar.sent_by
        ORDER BY ar.sent_at NULLS FIRST, ar.drafted_at DESC LIMIT 200`,
    );
    const portal = await getSetting<{ registered: boolean }>('bka_portal');
    return {
      // Nr. 72: das Portalkonto gehört in die Startvorbereitung, nicht in den Ernstfall
      portalReady: !!portal?.registered,
      items: rows.map((r) => ({
        id: r.id,
        caseRef: r.case_ref,
        draftedBy: r.drafted_name,
        draftedAt: r.drafted_at,
        confirmedText: r.confirmed_text,
        countersignedBy: r.countersigned_name,
        sentBy: r.sent_name,
        sentAt: r.sent_at,
        authorityRef: r.authority_ref,
        // M80.08: „gemeldet nach …“ — intern, Ziel unter 24 Stunden
        elapsedMinutes: Math.round(((r.sent_at ? new Date(r.sent_at) : new Date()).getTime() - new Date(r.case_at).getTime()) / 60000),
      })),
    };
  });

  /** M80.01: Entwurf aus dem Fall — Pflichtangaben vorbelegt. */
  app.post('/mod-api/art18', async (req) => {
    const s = await requireStaff(req);
    const b = body(req, z.object({ caseRef: z.string().trim().min(3).max(40), reason: z.string().trim().min(5).max(1000) }));
    const cs = await caseFor(b.caseRef);
    if (!cs) throw bad('UI-MOD-BEZUG-FEHLT', {}, 'bezug_fehlt');
    const existing = await one(
      `SELECT id FROM authority_reports WHERE (report_id = $1 OR hash_case_id = $2) AND sent_at IS NULL`,
      [cs.kind === 'meldung' ? cs.id : null, cs.kind === 'hash' ? cs.id : null],
    );
    if (existing) throw conflict('UI-MOD-ENTWURF-VORHANDEN');
    const acc = await accountData(cs.accountId);
    const ip = cs.ipEnc ? decStr('pii', cs.ipEnc, 'ip') : null;
    const content = draftText(cs, acc, ip);
    return logged(s, cs.number, 'art18_entwurf', b.reason, async (c) => {
      const row = (
        await c.query(
          `INSERT INTO authority_reports (report_id, hash_case_id, content, drafted_by) VALUES ($1, $2, $3, $4) RETURNING id`,
          [cs.kind === 'meldung' ? cs.id : null, cs.kind === 'hash' ? cs.id : null, content, s.id],
        )
      ).rows[0];
      return {
        id: row.id,
        content,
        missing: { account: !acc, userData: !acc || (!acc.email && !acc.phone), ip: !ip },
      };
    }, true);
  });

  app.get('/mod-api/art18/:id', async (req) => {
    await requireStaff(req);
    const { id } = params(req, idParam);
    const ar = await one(`SELECT * FROM authority_reports WHERE id = $1`, [id]);
    if (!ar) throw notFound();
    return {
      id: ar.id,
      content: ar.content,
      confirmedText: ar.confirmed_text,
      draftedBy: ar.drafted_by,
      countersignedBy: ar.countersigned_by,
      sentAt: ar.sent_at,
      authorityRef: ar.authority_ref,
      addenda: ar.addenda,
      missingIp: /IP-Adresse: — nicht vorhanden —/.test(ar.content),
    };
  });

  /** M80.02: gelesen und bestätigt — Änderungen am Text nur vor der Gegenzeichnung. */
  app.post('/mod-api/art18/:id/confirm', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ content: z.string().min(50).max(20000), read: z.literal(true) }));
    const ar = await one(`SELECT id, countersigned_at, report_id, hash_case_id FROM authority_reports WHERE id = $1`, [id]);
    if (!ar || ar.countersigned_at) throw notFound();
    await logged(s, `art18:${id}`, 'art18_text_bestaetigt', 'Sachverhalt gelesen und bestätigt', async (c) => {
      await c.query(`UPDATE authority_reports SET content = $2, confirmed_text = true WHERE id = $1`, [id, b.content]);
    }, true);
    return { ok: true };
  });

  /** M80.04: Gegenzeichnung — nie der eigene Entwurf. */
  app.post('/mod-api/art18/:id/countersign', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ reason: z.string().trim().min(3).max(1000) }));
    const ar = await one(`SELECT * FROM authority_reports WHERE id = $1 AND countersigned_at IS NULL`, [id]);
    if (!ar) throw notFound();
    const self = ar.drafted_by === s.id;
    if (self && needsSecondPerson(s)) throw new AppError(403, 'UI-MOD-EIGENER-ANTRAG', {}, 'eigener_antrag');
    if (!ar.confirmed_text) throw bad('UI-MOD-TEXT-BESTAETIGEN', {}, 'text_bestaetigen');
    await logged(s, `art18:${id}`, self ? 'art18_gegengezeichnet_ohne_zweite_person' : 'art18_gegengezeichnet', b.reason, async (c) => {
      await c.query(`UPDATE authority_reports SET countersigned_by = $2, countersigned_at = now() WHERE id = $1 AND (drafted_by <> $2 OR $3)`, [
        id,
        s.id,
        !needsSecondPerson(s),
      ]);
    }, true);
    return { ok: true };
  });

  /** M80.05/06: abgesendet — nur BETRIEB, nur nach Gegenzeichnung, mit Vorgangsnummer der Behörde. */
  app.post('/mod-api/art18/:id/sent', async (req) => {
    const s = await requireStaff(req, 'BETRIEB');
    const { id } = params(req, idParam);
    const b = body(req, z.object({ authorityRef: z.string().trim().min(3).max(100), reason: z.string().trim().min(3).max(1000).default('Meldung über das Portal abgesendet') }));
    const ar = await one(`SELECT * FROM authority_reports WHERE id = $1 AND sent_at IS NULL`, [id]);
    if (!ar) throw notFound();
    if (!ar.countersigned_at) throw new AppError(403, 'UI-MOD-ZWEITE-PERSON', {}, 'gegenzeichnung_fehlt');
    await logged(s, `art18:${id}`, 'art18_abgesendet', `${b.reason} · Vorgangsnummer ${b.authorityRef}`, async (c) => {
      await c.query(`UPDATE authority_reports SET sent_by = $2, sent_at = now(), authority_ref = $3 WHERE id = $1`, [id, s.id, b.authorityRef]);
      if (ar.hash_case_id) await c.query(`UPDATE hash_cases SET status = 'reported' WHERE id = $1`, [ar.hash_case_id]);
      if (ar.report_id) await c.query(`INSERT INTO report_events (report_id, status, note) VALUES ($1, 'an_behoerde', $2)`, [ar.report_id, b.authorityRef]);
    }, true);
    return { ok: true };
  });

  /** M80.07: Nachtrag an dieselbe Stelle — eine Meldung wird nie stillschweigend zurückgezogen. */
  app.post('/mod-api/art18/:id/addendum', async (req) => {
    const s = await requireStaff(req, 'BETRIEB');
    const { id } = params(req, idParam);
    const b = body(req, z.object({ text: z.string().trim().min(10).max(5000) }));
    const ar = await one(`SELECT id FROM authority_reports WHERE id = $1 AND sent_at IS NOT NULL`, [id]);
    if (!ar) throw notFound();
    await logged(s, `art18:${id}`, 'art18_nachtrag', b.text.slice(0, 500), async (c) => {
      await c.query(`UPDATE authority_reports SET addenda = addenda || $2::jsonb WHERE id = $1`, [id, JSON.stringify([{ at: new Date().toISOString(), by: s.name, text: b.text }])]);
    }, true);
    return { ok: true };
  });

  /** Nr. 72: Portalkonto als eingerichtet vermerken (Startvorbereitung). */
  app.post('/mod-api/art18/portal', async (req) => {
    const s = await requireStaff(req, 'BETRIEB');
    const b = body(req, z.object({ registered: z.boolean() }));
    await logged(s, 'einstellung:bka_portal', 'portalkonto_vermerkt', b.registered ? 'eingerichtet' : 'nicht eingerichtet', async (c) => {
      await setSetting('bka_portal', { registered: b.registered, at: new Date().toISOString() }, c);
    });
    return { ok: true };
  });
}
