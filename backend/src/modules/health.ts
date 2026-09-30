/**
 * Freiwillige Test-Erinnerung (Issue #25) und vorbereitete Gesundheitsfelder.
 *
 * PRÜFUNG ERFORDERLICH — Art. 9 DSGVO (rechtlich zu prüfen).
 *  * Kein Gesundheitsstatus im Profil. Gespeichert werden NUR Intervall, Datum der nächsten
 *    Erinnerung, Zeitpunkt der Einwilligung und die Kanäle — getrennt vom Profil.
 *  * Ausschalten löscht alles sofort (auch die erzeugten Hinweise im Mitteilungsbereich).
 *  * Keine Verwendung für Sortierung, Matching, Werbung oder Statistik.
 *  * Push verrät nichts: „Du hast eine Erinnerung.“ — den Inhalt gibt es erst in der App.
 *  * Gesundheitsfelder (PrEP, letzter Test) hinter P-GESUNDHEITSFELDER, Voreinstellung aus:
 *    dann weder über die Oberfläche noch über die Schnittstelle erreichbar.
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { p } from '../config/params.js';
import { one, q } from '../db/pool.js';
import { requireMember } from '../lib/context.js';
import { AppError, bad, notFound } from '../lib/errors.js';
import { countryOf } from '../lib/geo.js';
import { body } from '../lib/http.js';
import { t } from '../lib/texts.js';
import { inHourWindow } from '../lib/time.js';
import { createNotice } from '../services/notify.js';

function addMonths(from: Date, months: number) {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d;
}

async function linkFor(accountId: string): Promise<{ country: 'DE' | 'AT' | 'CH'; url: string }> {
  const l = await one(`SELECT cell_lat, cell_lng FROM locations WHERE account_id = $1`, [accountId]);
  const c = (l?.cell_lat != null ? countryOf({ lat: l.cell_lat, lng: l.cell_lng }) : null) ?? 'DE';
  const links = p('P-TESTSTELLEN') as Record<string, string>;
  return { country: c, url: links[c] ?? links.DE };
}

/** Hintergrundauftrag: fällige Erinnerungen — außerhalb der Ruhezeit, je Termin einmal. */
export async function sendHealthReminders(nowD = new Date()) {
  const rows = await q(
    `SELECT h.*, pr.quiet_from, pr.quiet_to FROM health_reminders h JOIN profiles pr ON pr.account_id = h.account_id
      WHERE h.next_at <= $1 AND (h.sent_for IS NULL OR h.sent_for <> h.next_at) LIMIT 500`,
    [nowD],
  );
  for (const r of rows) {
    // Ruhezeiten aus den Push-Regeln gelten auch hier — dann später erneut
    if (inHourWindow(nowD, r.quiet_from, r.quiet_to)) continue;
    const { url } = await linkFor(r.account_id);
    if (r.in_app) {
      await createNotice(r.account_id, 'test_erinnerung', t('UI-TEST-TITEL'), t('UI-TEST-TEXT'), url, undefined, {
        push: r.push,
        pushTitle: t('UI-TEST-PUSH'),
        url: '/ich/gesundheit',
      });
    } else if (r.push) {
      const { sendPush } = await import('../services/push.js');
      await sendPush(r.account_id, 'notice', { title: t('UI-TEST-PUSH'), url: '/ich/gesundheit', tag: 'erinnerung' });
    }
    await q(`UPDATE health_reminders SET sent_for = next_at WHERE account_id = $1`, [r.account_id]);
  }
}

export default async function healthRoutes(app: FastifyInstance) {
  app.get('/api/health/reminder', async (req) => {
    const a = await requireMember(req);
    const r = await one(`SELECT * FROM health_reminders WHERE account_id = $1`, [a.id]);
    const link = await linkFor(a.id);
    return {
      active: !!r,
      intervalMonths: r?.interval_months ?? 3,
      nextAt: r?.next_at ?? null,
      due: !!r && new Date(r.next_at) <= new Date(),
      push: r?.push ?? true,
      inApp: r?.in_app ?? true,
      consentedAt: r?.consented_at ?? null,
      link,
      profileFields: p('P-GESUNDHEITSFELDER'),
    };
  });

  /** Einschalten oder ändern — nur mit ausdrücklicher Einwilligung. */
  app.put('/api/health/reminder', async (req) => {
    const a = await requireMember(req);
    const b = body(
      req,
      z.object({
        intervalMonths: z.union([z.literal(1), z.literal(3), z.literal(6)]),
        consent: z.literal(true),
        push: z.boolean().default(true),
        inApp: z.boolean().default(true),
      }),
    );
    if (!b.push && !b.inApp) throw bad('UI-TEST-KANAL', {}, 'kein_kanal');
    const cur = await one(`SELECT interval_months, next_at FROM health_reminders WHERE account_id = $1`, [a.id]);
    const next = !cur || cur.interval_months !== b.intervalMonths ? addMonths(new Date(), b.intervalMonths) : cur.next_at;
    await q(
      `INSERT INTO health_reminders (account_id, interval_months, next_at, push, in_app, consented_at) VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (account_id) DO UPDATE SET interval_months = $2, next_at = $3, push = $4, in_app = $5`,
      [a.id, b.intervalMonths, next, b.push, b.inApp],
    );
    return { ok: true, nextAt: next };
  });

  /** „Ich war gerade testen“ / „Erledigt“: Zähler beginnt neu. */
  app.post('/api/health/reminder/done', async (req) => {
    const a = await requireMember(req);
    const r = await one(`SELECT interval_months FROM health_reminders WHERE account_id = $1`, [a.id]);
    if (!r) throw notFound();
    const next = addMonths(new Date(), r.interval_months);
    await q(`UPDATE health_reminders SET next_at = $2 WHERE account_id = $1`, [a.id, next]);
    return { ok: true, nextAt: next };
  });

  app.post('/api/health/reminder/snooze', async (req) => {
    const a = await requireMember(req);
    const r = await one(
      `UPDATE health_reminders SET next_at = now() + interval '7 days' WHERE account_id = $1 RETURNING next_at`,
      [a.id],
    );
    if (!r) throw notFound();
    return { ok: true, nextAt: r.next_at };
  });

  /** Ausschalten: alle Angaben sofort gelöscht. */
  app.delete('/api/health/reminder', async (req) => {
    const a = await requireMember(req);
    await q(`DELETE FROM health_reminders WHERE account_id = $1`, [a.id]);
    await q(`DELETE FROM notices WHERE account_id = $1 AND kind = 'test_erinnerung'`, [a.id]);
    return { ok: true };
  });

  // ───── vorbereitet, deaktiviert: optionale Gesundheitsangaben ─────
  const flagOn = () => {
    if (!p('P-GESUNDHEITSFELDER')) throw new AppError(404, 'UI-NICHT-VERFUEGBAR', {}, 'nicht_gefunden');
  };

  app.get('/api/health/profile', async (req) => {
    flagOn();
    const a = await requireMember(req);
    const r = await one(`SELECT prep, last_test, consented_at FROM health_profile WHERE account_id = $1`, [a.id]);
    return { prep: r?.prep ?? null, lastTest: r?.last_test ?? null, consentedAt: r?.consented_at ?? null };
  });

  app.put('/api/health/profile', async (req) => {
    flagOn();
    const a = await requireMember(req);
    const b = body(
      req,
      z.object({
        consent: z.literal(true),
        prep: z.enum(['ja', 'nein']).nullable(),
        lastTest: z.string().regex(/^\d{4}-\d{2}$/).nullable(),
      }),
    );
    if (b.prep === null && b.lastTest === null) {
      await q(`DELETE FROM health_profile WHERE account_id = $1`, [a.id]);
      return { ok: true };
    }
    await q(
      `INSERT INTO health_profile (account_id, prep, last_test, consented_at) VALUES ($1, $2, $3, now())
       ON CONFLICT (account_id) DO UPDATE SET prep = $2, last_test = $3`,
      [a.id, b.prep, b.lastTest],
    );
    return { ok: true };
  });

  app.delete('/api/health/profile', async (req) => {
    flagOn();
    const a = await requireMember(req);
    await q(`DELETE FROM health_profile WHERE account_id = $1`, [a.id]);
    return { ok: true };
  });
}

