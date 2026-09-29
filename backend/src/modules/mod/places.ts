/**
 * M70 · Beanspruchung von Orten und M75 · Freigabe von Veranstaltungen und Orten.
 *  * Geprüft wird von einem Menschen, binnen P-BEANSPRUCHEN-PRUEFUNG (M70.01).
 *  * Der Domainabgleich ist ein Hinweis, keine Entscheidung (M70.03).
 *  * Zwei Beanspruchungen für denselben Ort: erst nach Rückfrage bei beiden (M70, Zustände).
 *  * Keine bezahlte Hervorhebung — dafür gibt es keine Schaltfläche (Nr. 65, Nr. 91).
 *  * Freigabe nur mit allen fünf Prüfpunkten (M75.02); Ampel vom Menschen bestätigt (M75.03).
 *  * Die Adresse einer privaten Veranstaltung sieht niemand — sie steht nicht in der Einreichung.
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one, q } from '../../db/pool.js';
import { decStr } from '../../lib/crypto.js';
import { AppError, bad, conflict, notFound } from '../../lib/errors.js';
import { body, idParam, params, query, uuid } from '../../lib/http.js';
import { t } from '../../lib/texts.js';
import { sendMail } from '../../providers/mail.js';
import { ampel, logged, requireStaff } from './core.js';

const CHECKLIST = z.object({
  ampel: z.literal(true),
  keinePrivatadresse: z.literal(true),
  ab18: z.literal(true),
  keinVersprechen: z.literal(true),
  anbieter: z.literal(true),
});

const RETURN_REASONS = ['Ampel nicht eingehalten', 'Privatadresse im Text', 'Altersgrenze fehlt', 'Versprechen nicht haltbar', 'Anbieterangaben unvollständig', 'Angaben unklar'];

const eventFields = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().max(2000).default(''),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  placeId: uuid.nullable().optional(),
  cityId: z.string().max(40).nullable().optional(),
  ampel: z.enum(['gruen', 'gelb', 'rot']),
});

const hoursSchema = z.record(z.enum(['mo', 'di', 'mi', 'do', 'fr', 'sa', 'so']), z.array(z.tuple([z.string().regex(/^\d{2}:\d{2}$/), z.string().regex(/^\d{2}:\d{2}$/)])));

const placeFields = z.object({
  name: z.string().trim().min(2).max(120),
  kind: z.string().trim().min(2).max(40),
  cityId: z.string().max(40).nullable().optional(),
  district: z.string().max(80).nullable().optional(),
  address: z.string().max(200).nullable().optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  openingHours: hoursSchema.default({}),
  website: z.string().url().max(300).nullable().optional(),
  impressumDomain: z.string().max(200).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  source: z.string().trim().min(2).max(300),
  sourceFetchedAt: z.coerce.date(),
});

export default async function placeModRoutes(app: FastifyInstance) {
  // ───────────── M70 Beanspruchung ─────────────
  app.get('/mod-api/claims', async (req) => {
    await requireStaff(req);
    const rows = await q(
      `SELECT c.id, c.number, c.kind, c.status, c.created_at, c.deadline_at, c.email_domain, pl.id AS place_id, pl.name, pl.impressum_domain,
              (SELECT count(*)::int FROM place_claims c2 WHERE c2.place_id = c.place_id AND c2.status IN ('open','question') AND c2.id <> c.id) AS others
         FROM place_claims c JOIN places pl ON pl.id = c.place_id
        WHERE c.status IN ('open','question') ORDER BY c.deadline_at ASC`,
    );
    return {
      items: rows.map((r) => ({
        id: r.id,
        number: r.number,
        kind: r.kind,
        status: r.status,
        place: { id: r.place_id, name: r.name },
        createdAt: r.created_at,
        deadlineAt: r.deadline_at,
        ampel: r.deadline_at ? ampel(new Date(r.created_at), new Date(r.deadline_at)) : 'gruen',
        // M70.03: Hinweis, nicht Entscheidung
        domainMatches: !!r.impressum_domain && r.impressum_domain === r.email_domain,
        competing: r.others,
      })),
    };
  });

  app.get('/mod-api/claims/:id', async (req) => {
    await requireStaff(req);
    const { id } = params(req, idParam);
    const c = await one(
      `SELECT c.*, pl.name AS place_name, pl.impressum_domain, pl.website, pl.address FROM place_claims c JOIN places pl ON pl.id = c.place_id WHERE c.id = $1`,
      [id],
    );
    if (!c) throw notFound();
    return {
      id: c.id,
      number: c.number,
      kind: c.kind,
      status: c.status,
      place: { id: c.place_id, name: c.place_name, website: c.website, address: c.address, impressumDomain: c.impressum_domain },
      contact: { name: decStr('pii', c.contact_name_enc, 'claim'), role: c.role, email: decStr('pii', c.email_enc, 'claim') },
      proof: decStr('pii', c.proof_note_enc, 'claim'),
      domainMatches: !!c.impressum_domain && c.impressum_domain === c.email_domain,
      createdAt: c.created_at,
      deadlineAt: c.deadline_at,
      decisionNote: c.decision_note,
    };
  });

  /** M70.04: bestätigen · ablehnen · Rückfrage stellen. */
  app.post('/mod-api/claims/:id/decide', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(
      req,
      z.object({
        decision: z.enum(['bestaetigen', 'ablehnen', 'rueckfrage']),
        reason: z.string().trim().min(5).max(2000),
        message: z.string().trim().max(2000).optional(),
      }),
    );
    const c = await one(`SELECT * FROM place_claims WHERE id = $1 AND status IN ('open','question')`, [id]);
    if (!c) throw notFound();
    if (b.decision === 'bestaetigen') {
      // zwei Beanspruchungen → erst Rückfrage bei beiden
      const competing = await q(`SELECT number FROM place_claims WHERE place_id = $1 AND status IN ('open','question') AND id <> $2`, [c.place_id, id]);
      if (competing.length) {
        const asked = await q(
          `SELECT DISTINCT case_ref FROM access_log WHERE action = 'beanspruchung_rueckfrage' AND case_ref = ANY($1)`,
          [[c.number, ...competing.map((x) => x.number)]],
        );
        if (asked.length < competing.length + 1) throw conflict('UI-MOD-ERST-RUECKFRAGE');
      }
    }
    if (b.decision === 'rueckfrage' && !b.message) throw bad('UI-EINGABE-PRUEFEN');
    const email = decStr('pii', c.email_enc, 'claim');
    await logged(s, c.number, `beanspruchung_${b.decision}`, b.reason, async (tx) => {
      if (b.decision === 'rueckfrage') {
        await tx.query(`UPDATE place_claims SET status = 'question', decision_note = $2 WHERE id = $1`, [id, b.message]);
        return;
      }
      const status = b.decision === 'bestaetigen' ? 'confirmed' : 'rejected';
      await tx.query(
        `UPDATE place_claims SET status = $2, decided_at = now(), decided_by = $3, decision_note = $4, delete_after = now() + interval '1 year' WHERE id = $1`,
        [id, status, s.id, b.message ?? b.reason],
      );
      if (status === 'confirmed' && c.kind === 'claim') {
        await tx.query(`UPDATE places SET claimed_at = now() WHERE id = $1`, [c.place_id]);
      }
      if (status === 'confirmed' && c.kind === 'removal') {
        // FV-48: entfernt und nicht wieder aufgenommen
        await tx.query(`UPDATE places SET removed_at = now(), no_relist = true, claimed_at = NULL WHERE id = $1`, [c.place_id]);
      }
    });
    if (email) {
      const text =
        b.decision === 'rueckfrage'
          ? t('UI-MAIL-ORT-RUECKFRAGE', { nummer: c.number, frage: b.message ?? '' })
          : b.decision === 'bestaetigen'
            ? t(c.kind === 'claim' ? 'UI-MAIL-ORT-BESTAETIGT' : 'UI-MAIL-ORT-ENTFERNT', { nummer: c.number })
            : t('UI-MAIL-ORT-ABGELEHNT', { nummer: c.number, grund: b.message ?? b.reason });
      await sendMail({ to: email, subject: t('UI-MAIL-ORT-BETREFF', { nummer: c.number }), text });
    }
    return { ok: true };
  });

  /** M70.06: Widerruf — jederzeit, mit Grund. */
  app.post('/mod-api/places/:id/revoke-claim', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ reason: z.string().trim().min(5).max(2000) }));
    const pl = await one(`SELECT id, name FROM places WHERE id = $1 AND claimed_at IS NOT NULL`, [id]);
    if (!pl) throw notFound();
    await logged(s, `ort:${id}`, 'beanspruchung_widerrufen', b.reason, async (c) => {
      await c.query(`UPDATE places SET claimed_at = NULL WHERE id = $1`, [id]);
      await c.query(`UPDATE place_claims SET status = 'withdrawn', decision_note = $2 WHERE place_id = $1 AND status = 'confirmed'`, [id, b.reason]);
    });
    return { ok: true };
  });

  // ───────────── M75 Freigabe ─────────────
  app.get('/mod-api/submissions', async (req) => {
    await requireStaff(req);
    const mails = await q(`SELECT id, from_domain, received_at, parsed, place_hint FROM inbound_mails WHERE status = 'open' ORDER BY received_at ASC`);
    const events = await q(
      `SELECT e.id, e.title, e.starts_at, e.created_at, e.source, pl.name AS place_name FROM events e LEFT JOIN places pl ON pl.id = e.place_id
        WHERE e.status = 'pending' ORDER BY (e.starts_at < now() + interval '48 hours') DESC, e.created_at ASC`,
    );
    return {
      mails: mails.map((m) => ({ id: m.id, domain: m.from_domain, receivedAt: m.received_at, suggestion: m.parsed, placeHint: m.place_hint })),
      events: events.map((e) => ({ id: e.id, title: e.title, startsAt: e.starts_at, createdAt: e.created_at, source: e.source, place: e.place_name, soon: new Date(e.starts_at).getTime() < Date.now() + 48 * 3600_000 })),
      returnReasons: RETURN_REASONS,
    };
  });

  app.post('/mod-api/submissions/mail/:id/open', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const m = await one(`SELECT * FROM inbound_mails WHERE id = $1`, [id]);
    if (!m) throw notFound();
    return logged(s, `termine:${id}`, 'einreichung_geoeffnet', 'Prüfung Einreichung', async () => ({
      id: m.id,
      from: decStr('tickets', m.from_enc, 'mail'),
      subject: decStr('tickets', m.subject_enc, 'mail'),
      text: decStr('tickets', m.body_enc, 'mail'),
      suggestion: m.parsed,
      placeHint: m.place_hint,
      status: m.status,
    }));
  });

  /** M75.04–06 für termine@: freigeben (legt die Veranstaltung an), zurückgeben, ablehnen. */
  app.post('/mod-api/submissions/mail/:id/decide', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(
      req,
      z.object({
        decision: z.enum(['freigeben', 'zurueckgeben', 'ablehnen']),
        reason: z.string().trim().min(3).max(2000),
        checklist: CHECKLIST.optional(),
        event: eventFields.optional(),
        returnReason: z.string().max(200).optional(),
      }),
    );
    const m = await one(`SELECT * FROM inbound_mails WHERE id = $1 AND status = 'open'`, [id]);
    if (!m) throw notFound();
    if (b.decision === 'freigeben') {
      if (!b.checklist) throw new AppError(400, 'UI-MOD-PRUEFLISTE', {}, 'pruefliste');
      if (!b.event) throw bad('UI-EINGABE-PRUEFEN');
      if (b.event.endsAt <= b.event.startsAt) throw bad('UI-EINGABE-PRUEFEN');
    }
    const from = decStr('tickets', m.from_enc, 'mail');
    const eventId = await logged(s, `termine:${id}`, `einreichung_${b.decision}`, b.reason, async (c) => {
      if (b.decision === 'freigeben') {
        const e = b.event!;
        const row = (
          await c.query(
            `INSERT INTO events (place_id, city_id, title, description, starts_at, ends_at, source, status, ampel, submitted_by_domain, approved_by, approved_at)
             VALUES ($1, $2, $3, $4, $5, $6, 'termine@', 'approved', $7, $8, $9, now()) RETURNING id`,
            [e.placeId ?? m.place_hint ?? null, e.cityId ?? null, e.title, e.description, e.startsAt, e.endsAt, e.ampel, m.from_domain, s.id],
          )
        ).rows[0];
        await c.query(`UPDATE inbound_mails SET status = 'approved', event_id = $2 WHERE id = $1`, [id, row.id]);
        return row.id as string;
      }
      await c.query(`UPDATE inbound_mails SET status = 'discarded' WHERE id = $1`, [id]);
      return null;
    });
    if (from && b.decision === 'zurueckgeben') {
      await sendMail({ to: from.replace(/^.*<([^>]+)>.*$/, '$1'), subject: t('UI-MAIL-TERMIN-BETREFF'), text: t('ST-EVT-10', { grund: b.returnReason ?? b.reason }) });
    }
    return { ok: true, eventId };
  });

  /** Eingereichte Veranstaltungen (z. B. von einem bestätigten Ort) — derselbe Weg. */
  app.post('/mod-api/events/:id/decide', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(
      req,
      z.object({
        decision: z.enum(['freigeben', 'zurueckgeben', 'ablehnen']),
        reason: z.string().trim().min(3).max(2000),
        checklist: CHECKLIST.optional(),
        ampel: z.enum(['gruen', 'gelb', 'rot']).optional(),
      }),
    );
    const e = await one(`SELECT id FROM events WHERE id = $1 AND status = 'pending'`, [id]);
    if (!e) throw notFound();
    if (b.decision === 'freigeben' && (!b.checklist || !b.ampel)) throw new AppError(400, 'UI-MOD-PRUEFLISTE', {}, 'pruefliste');
    await logged(s, `veranstaltung:${id}`, `veranstaltung_${b.decision}`, b.reason, async (c) => {
      if (b.decision === 'freigeben') await c.query(`UPDATE events SET status = 'approved', ampel = $2, approved_by = $3, approved_at = now() WHERE id = $1`, [id, b.ampel, s.id]);
      else await c.query(`UPDATE events SET status = 'rejected', cancel_note = $2 WHERE id = $1`, [id, b.reason]);
    });
    return { ok: true };
  });

  /** Redaktionell angelegte Veranstaltung — ebenfalls nur mit Prüfliste. */
  app.post('/mod-api/events', async (req) => {
    const s = await requireStaff(req);
    const b = body(req, z.object({ event: eventFields, checklist: CHECKLIST, reason: z.string().trim().min(3).max(500), source: z.string().max(300).default('redaktionell') }));
    if (b.event.endsAt <= b.event.startsAt) throw bad('UI-EINGABE-PRUEFEN');
    const id = await logged(s, 'veranstaltung:neu', 'veranstaltung_angelegt', b.reason, async (c) => {
      const e = b.event;
      const row = (
        await c.query(
          `INSERT INTO events (place_id, city_id, title, description, starts_at, ends_at, source, status, ampel, approved_by, approved_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved', $8, $9, now()) RETURNING id`,
          [e.placeId ?? null, e.cityId ?? null, e.title, e.description, e.startsAt, e.endsAt, b.source, e.ampel, s.id],
        )
      ).rows[0];
      return row.id as string;
    });
    return { id };
  });

  /** Absage einer freigegebenen Veranstaltung (sichtbar als „abgesagt“). */
  app.post('/mod-api/events/:id/cancel', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ reason: z.string().trim().min(3).max(500), note: z.string().max(300).optional() }));
    await logged(s, `veranstaltung:${id}`, 'veranstaltung_abgesagt', b.reason, async (c) => {
      const r = await c.query(`UPDATE events SET status = 'cancelled', cancel_note = $2 WHERE id = $1 AND status = 'approved'`, [id, b.note ?? null]);
      if (!r.rowCount) throw notFound();
    });
    return { ok: true };
  });

  // ───────────── Ortsverzeichnis (redaktionell, F31) ─────────────
  app.get('/mod-api/places', async (req) => {
    await requireStaff(req);
    const qs = query(req, z.object({ city: z.string().max(40).optional() }));
    const rows = await q(
      `SELECT id, name, kind, city_id, district, claimed_at, removed_at, source, source_fetched_at FROM places
        WHERE ($1::text IS NULL OR city_id = $1) ORDER BY removed_at NULLS FIRST, name LIMIT 500`,
      [qs.city ?? null],
    );
    return { items: rows };
  });

  app.post('/mod-api/places', async (req) => {
    const s = await requireStaff(req);
    const b = body(req, z.object({ place: placeFields, reason: z.string().trim().min(3).max(500) }));
    const pl = b.place;
    const blocked = await one(`SELECT 1 FROM places WHERE no_relist AND lower(name) = lower($1) AND abs(lat - $2) < 0.002 AND abs(lng - $3) < 0.002`, [pl.name, pl.lat, pl.lng]);
    if (blocked) throw conflict('UI-MOD-ORT-GESPERRT');
    const id = await logged(s, 'ort:neu', 'ort_angelegt', b.reason, async (c) => {
      const row = (
        await c.query(
          `INSERT INTO places (city_id, name, kind, district, address, lat, lng, opening_hours, website, impressum_domain, description, source, source_fetched_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
          [pl.cityId ?? null, pl.name, pl.kind, pl.district ?? null, pl.address ?? null, pl.lat, pl.lng, JSON.stringify(pl.openingHours), pl.website ?? null, pl.impressumDomain?.toLowerCase() ?? null, pl.description ?? null, pl.source, pl.sourceFetchedAt],
        )
      ).rows[0];
      return row.id as string;
    });
    return { id };
  });

  app.patch('/mod-api/places/:id', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ place: placeFields.partial(), reason: z.string().trim().min(3).max(500) }));
    const map: Record<string, string> = {
      name: 'name', kind: 'kind', cityId: 'city_id', district: 'district', address: 'address', lat: 'lat', lng: 'lng', openingHours: 'opening_hours',
      website: 'website', impressumDomain: 'impressum_domain', description: 'description', source: 'source', sourceFetchedAt: 'source_fetched_at',
    };
    const sets: string[] = [];
    const vals: unknown[] = [id];
    for (const [k, v] of Object.entries(b.place)) {
      if (v === undefined || !map[k]) continue;
      vals.push(k === 'openingHours' ? JSON.stringify(v) : v);
      sets.push(`${map[k]} = $${vals.length}`);
    }
    if (!sets.length) return { ok: true };
    await logged(s, `ort:${id}`, 'ort_geaendert', b.reason, async (c) => {
      const r = await c.query(`UPDATE places SET ${sets.join(', ')} WHERE id = $1`, vals);
      if (!r.rowCount) throw notFound();
    });
    return { ok: true };
  });

  app.post('/mod-api/places/:id/remove', async (req) => {
    const s = await requireStaff(req);
    const { id } = params(req, idParam);
    const b = body(req, z.object({ reason: z.string().trim().min(3).max(500), noRelist: z.boolean().default(false) }));
    await logged(s, `ort:${id}`, 'ort_entfernt', b.reason, async (c) => {
      const r = await c.query(`UPDATE places SET removed_at = now(), no_relist = $2 WHERE id = $1 AND removed_at IS NULL`, [id, b.noRelist]);
      if (!r.rowCount) throw notFound();
    });
    return { ok: true };
  });
}
