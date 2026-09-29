/**
 * Reiter „Heute“: Karte mit Personengruppen (F30), Ortsverzeichnis (F31),
 * Beanspruchen über eine Weboberfläche (FV-47, FV-48) und termine@ (F34).
 *
 * PRÜFUNG ERFORDERLICH (Personengruppen).
 *  * Personen nie als Einzelpunkt (AK-F30-01); Gruppen erst ab P-CLUSTER-MIN
 *    (AK-F30-02), Größe als Stufe (AK-F30-03), neu berechnet höchstens je
 *    P-CLUSTER-TAKT (AK-F30-06) — durch einen Hintergrundauftrag, nie je Anfrage.
 *  * Orte unterscheiden sich nur durch das Kennzeichen „vom Ort bestätigt“ —
 *    nicht durch Größe, Reihenfolge oder Hervorhebung (AK-F31-05).
 *  * An einem Ort steht nie eine Zahl anwesender Personen (AK-F31-06).
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { env } from '../config/env.js';
import { p } from '../config/params.js';
import { one, q } from '../db/pool.js';
import { requireMember } from '../lib/context.js';
import { decStr, encStr, randomToken, tokenHash } from '../lib/crypto.js';
import { bad, notFound, tooMany } from '../lib/errors.js';
import { body, idParam, ipKey, params } from '../lib/http.js';
import { band, boundingBox, distanceKm, roundToCell, type LatLng } from '../lib/geo.js';
import { nextNumber } from '../lib/numbers.js';
import { hit } from '../lib/rate.js';
import { t } from '../lib/texts.js';
import { localParts } from '../lib/time.js';
import { sendMail } from '../providers/mail.js';
import { parseEventMail } from '../services/termine-parser.js';

const DAY_KEYS = ['mo', 'di', 'mi', 'do', 'fr', 'sa', 'so'];

export function openingToday(hours: Record<string, [string, string][]> | null) {
  if (!hours || !Object.keys(hours).length) return { known: false, open: null as boolean | null, slots: [] as [string, string][] };
  const key = DAY_KEYS[localParts(new Date()).weekday - 1];
  const slots = hours[key] ?? [];
  return { known: true, open: slots.length > 0, slots };
}

async function refFor(accountId: string): Promise<{ ref: LatLng | null; own: LatLng | null }> {
  const l = await one(
    `SELECT l.cell_lat, l.cell_lng, c.lat AS clat, c.lng AS clng FROM locations l LEFT JOIN cities c ON c.id = l.city_id WHERE l.account_id = $1`,
    [accountId],
  );
  const own = l?.cell_lat != null ? { lat: l.cell_lat, lng: l.cell_lng } : null;
  const city = l?.clat != null ? { lat: l.clat, lng: l.clng } : null;
  return { ref: own ?? city, own };
}

export function clusterLevelText(level: number) {
  const stufen = p('P-CLUSTER-STUFEN') as readonly number[];
  return `ab ${stufen[Math.min(level, stufen.length) - 1]}`;
}

/** Hintergrundauftrag: Personengruppen je Gitterzelle (FV-46). */
export async function computeClusters() {
  const min = p('P-CLUSTER-MIN');
  const stufen = p('P-CLUSTER-STUFEN') as readonly number[];
  // Gezählt: Stufe außer „Aus“, nicht in einer eigenen Zone (AK-F30-05), sichtbar
  const rows = await q(
    `SELECT l.display_lat AS lat, l.display_lng AS lng FROM locations l JOIN accounts a ON a.id = l.account_id
      WHERE l.level <> 'aus' AND l.display_lat IS NOT NULL AND NOT l.in_zone AND NOT l.invisible
        AND a.status = 'active' AND a.deletion_requested_at IS NULL AND a.moderation_state <> 'suspended'
        AND a.minor_locked_at IS NULL AND a.hash_restricted_at IS NULL`,
  );
  const cells = new Map<string, { lat: number; lng: number; n: number }>();
  for (const r of rows) {
    const c = roundToCell({ lat: r.lat, lng: r.lng }, p('P-CLUSTER-ZELLE'));
    const k = `${c.lat},${c.lng}`;
    const e = cells.get(k) ?? { ...c, n: 0 };
    e.n++;
    cells.set(k, e);
  }
  await q(`DELETE FROM map_clusters`);
  for (const c of cells.values()) {
    if (c.n < min) continue;
    let level = 0;
    stufen.forEach((s, i) => {
      if (c.n >= s) level = i + 1;
    });
    if (!level) level = 1;
    await q(`INSERT INTO map_clusters (cell_lat, cell_lng, level, computed_at) VALUES ($1, $2, $3, now())`, [c.lat, c.lng, level]);
  }
}

async function upcomingEvents(placeIds: string[] | null, ref: LatLng | null, accountId: string) {
  const rows = await q(
    `SELECT e.id, e.title, e.starts_at, e.ends_at, e.status, e.place_id, pl.name AS place_name, pl.lat, pl.lng,
            EXISTS (SELECT 1 FROM event_rsvps r WHERE r.event_id = e.id AND r.account_id = $1) AS mine
       FROM events e LEFT JOIN places pl ON pl.id = e.place_id
      WHERE e.status IN ('approved','cancelled') AND e.ends_at > now() AND e.starts_at < now() + interval '8 days'
        AND ($2::uuid[] IS NULL OR e.place_id = ANY($2))
        -- M75.03: rote Veranstaltungen nur für Konten mit Altersprüfung
        AND (e.ampel <> 'rot' OR EXISTS (SELECT 1 FROM accounts a WHERE a.id = $1 AND a.age1_at IS NOT NULL))
      ORDER BY e.starts_at LIMIT 200`,
    [accountId, placeIds],
  );
  const out = [];
  for (const e of rows) {
    if (ref && e.lat != null && distanceKm(ref, { lat: e.lat, lng: e.lng }) > 60) continue;
    let count: number | null = null;
    if (e.mine) {
      // FV-50: die Zahl der Zusagen sehen nur Zusagende — ohne blockierte Personen (AK-X06-01)
      const c = await one(
        `SELECT count(*)::int AS n FROM event_rsvps r WHERE r.event_id = $1 AND NOT EXISTS (
           SELECT 1 FROM blocks b WHERE b.revoked_at IS NULL AND ((b.blocker_id = $2 AND b.blocked_id = r.account_id) OR (b.blocker_id = r.account_id AND b.blocked_id = $2)))`,
        [e.id, accountId],
      );
      count = c!.n;
    }
    out.push({
      id: e.id,
      title: e.title,
      startsAt: e.starts_at,
      endsAt: e.ends_at,
      cancelled: e.status === 'cancelled',
      place: e.place_id ? { id: e.place_id, name: e.place_name } : null,
      band: ref && e.lat != null ? band(distanceKm(ref, { lat: e.lat, lng: e.lng })) : null,
      rsvp: e.mine,
      count,
    });
  }
  return out;
}

export default async function placeRoutes(app: FastifyInstance) {
  app.get('/api/today', async (req) => {
    const a = await requireMember(req);
    const { ref, own } = await refFor(a.id);
    const box = ref ? boundingBox(ref, 40) : null;
    const places = await q(
      `SELECT id, name, kind, district, lat, lng, opening_hours, claimed_at, tool_account FROM places
        WHERE removed_at IS NULL ${box ? 'AND lat BETWEEN $1 AND $2 AND lng BETWEEN $3 AND $4' : ''} ORDER BY name`,
      box ? [box.minLat, box.maxLat, box.minLng, box.maxLng] : [],
    );
    const clusters = box
      ? await q(`SELECT cell_lat, cell_lng, level FROM map_clusters WHERE cell_lat BETWEEN $1 AND $2 AND cell_lng BETWEEN $3 AND $4`, [
          box.minLat,
          box.maxLat,
          box.minLng,
          box.maxLng,
        ])
      : [];
    const events = await upcomingEvents(null, ref, a.id);
    return {
      hasRef: !!ref,
      mapTiles: env().MAP_TILE_URL || null,
      mapAttribution: env().MAP_ATTRIBUTION || null,
      center: ref ? roundToCell(ref, 2000) : null,
      // Orte sind öffentliche Betriebe — ihre Lage darf auf der Karte stehen
      places: places.map((pl) => {
        const oh = openingToday(pl.opening_hours);
        return {
          id: pl.id,
          name: pl.name,
          kind: pl.kind,
          district: pl.district,
          lat: pl.lat,
          lng: pl.lng,
          confirmed: !!pl.claimed_at,
          paidTool: pl.tool_account, // Kennzeichnung nach AK-F31-08, ohne Einfluss auf die Reihenfolge
          openToday: oh.open,
          hoursToday: oh.slots,
          band: own ? band(distanceKm(own, { lat: pl.lat, lng: pl.lng })) : null,
        };
      }),
      // AK-F30-01/03: nur Gruppen am Zellmittelpunkt, Größe als Stufe
      clusters: clusters.map((c) => ({ lat: c.cell_lat, lng: c.cell_lng, level: c.level, label: clusterLevelText(c.level) })),
      events,
    };
  });

  app.get('/api/places/:id', async (req) => {
    const a = await requireMember(req);
    const { id } = params(req, idParam);
    const pl = await one(`SELECT * FROM places WHERE id = $1 AND removed_at IS NULL`, [id]);
    if (!pl) throw notFound();
    const { own } = await refFor(a.id);
    const oh = openingToday(pl.opening_hours);
    return {
      place: {
        id: pl.id,
        name: pl.name,
        kind: pl.kind,
        district: pl.district,
        address: pl.address,
        website: pl.website,
        description: pl.description,
        lat: pl.lat,
        lng: pl.lng,
        confirmed: !!pl.claimed_at,
        paidTool: pl.tool_account,
        openingHours: pl.opening_hours,
        openToday: oh.open,
        hoursToday: oh.slots,
        source: pl.source,
        sourceDate: pl.source_fetched_at,
        band: own ? band(distanceKm(own, { lat: pl.lat, lng: pl.lng })) : null,
      },
      events: await upcomingEvents([pl.id], null, a.id),
    };
  });

  // ───── Weboberfläche außerhalb der App: Ort beanspruchen oder entfernen lassen (FV-47, FV-48) ─────
  app.get('/api/public/places/:id', async (req) => {
    const { id } = params(req, idParam);
    const pl = await one(`SELECT id, name, district, address, claimed_at FROM places WHERE id = $1 AND removed_at IS NULL`, [id]);
    if (!pl) throw notFound();
    return { place: { id: pl.id, name: pl.name, district: pl.district, address: pl.address, confirmed: !!pl.claimed_at } };
  });

  app.post('/api/public/places/:id/claim', async (req) => {
    const { id } = params(req, idParam);
    const b = body(
      req,
      z.object({
        kind: z.enum(['claim', 'removal']),
        name: z.string().min(2).max(100),
        role: z.string().max(100).optional(),
        email: z.string().email().max(254),
        note: z.string().max(2000).optional(),
      }),
    );
    if (!hit('claim', ipKey(req), 10, 3600_000)) throw tooMany();
    const pl = await one(`SELECT id, name FROM places WHERE id = $1 AND removed_at IS NULL`, [id]);
    if (!pl) throw notFound();
    const token = randomToken(24);
    const number = await nextNumber('O');
    const domain = b.email.split('@')[1].toLowerCase();
    await q(
      `INSERT INTO place_claims (number, place_id, kind, contact_name_enc, role, email_enc, email_domain, proof_note_enc, verify_token_hash, delete_after)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now() + interval '1 year')`,
      [
        number,
        id,
        b.kind,
        encStr('pii', b.name, 'claim'),
        b.role ?? null,
        encStr('pii', b.email, 'claim'),
        domain,
        b.note ? encStr('pii', b.note, 'claim') : null,
        tokenHash(token),
      ],
    );
    await sendMail({
      to: b.email,
      subject: t('UI-MAIL-ORT-BETREFF', { nummer: number }),
      text: t('UI-MAIL-ORT-TEXT', { link: `${env().APP_URL}/orte/bestaetigen?token=${token}`, nummer: number }),
    });
    return { number };
  });

  app.post('/api/public/claims/verify', async (req) => {
    const b = body(req, z.object({ token: z.string().max(100) }));
    const r = await one(
      `UPDATE place_claims SET email_verified_at = now(), status = 'open', verify_token_hash = NULL,
              deadline_at = now() + make_interval(secs => $2)
        WHERE verify_token_hash = $1 AND status = 'waiting_email' RETURNING number`,
      [tokenHash(b.token), p('P-BEANSPRUCHEN-PRUEFUNG')],
    );
    if (!r) throw bad('UI-LINK-UNGUELTIG', {}, 'link_ungueltig');
    return { number: r.number, hours: Math.round(p('P-BEANSPRUCHEN-PRUEFUNG') / 3600) };
  });

  // ───── termine@ (F34): Webhook des EU-Maildienstes ─────
  app.post('/api/eingang/termine', async (req, reply) => {
    const secret = env().INBOUND_MAIL_SECRET;
    const given = (req.headers['x-inbound-secret'] as string) ?? (req.query as { s?: string }).s;
    if (!secret || given !== secret) return reply.status(401).send({ ok: false });
    const b = body(req, z.object({ from: z.string().max(320), subject: z.string().max(500).default(''), text: z.string().max(100_000).default('') }));
    // AK-F34-04: Bilder werden nie übernommen — es wird nur der Text gelesen
    const parsed = parseEventMail(b.subject, b.text);
    const domain = /@([^>\s]+)/.exec(b.from)?.[1]?.toLowerCase() ?? null;
    const hint = domain ? await one(`SELECT id FROM places WHERE impressum_domain = $1 AND removed_at IS NULL`, [domain]) : null;
    await q(
      `INSERT INTO inbound_mails (from_enc, from_domain, subject_enc, body_enc, parsed, place_hint, delete_after)
       VALUES ($1, $2, $3, $4, $5, $6, now() + make_interval(secs => $7))`,
      [
        encStr('tickets', b.from, 'mail'),
        domain,
        encStr('tickets', b.subject, 'mail'),
        encStr('tickets', b.text.slice(0, 20000), 'mail'),
        JSON.stringify(parsed),
        hint?.id ?? null,
        p('P-MAIL-AUFBEWAHRUNG'),
      ],
    );
    return { ok: true };
  });
}

export { decStr };
