/**
 * Check-in (F55, Nr. 66, 83, 84; check-in-konzept.md).
 *
 * PRÜFUNG ERFORDERLICH.
 *  * Der Server kennt nur: Konto, Beginn, Zeitpunkte der Fragen, die vorher
 *    eingestellte Wirkung (AK-F55-16). Ort, Gegenüber, Vertrauenspersonen und Text
 *    liegen verschlüsselt nur auf dem Gerät.
 *  * Ausnahme „Hinterlegen“ (Nr. 83 b): nur nach ausdrücklicher Wahl liegt die
 *    Nachricht für die Dauer des Check-ins verschlüsselt hier (AK-F55-18).
 *  * „Durchreichen“ (Voreinstellung): das Gerät schickt Empfänger und Text zur
 *    fälligen Minute; der Server reicht sie weiter und speichert nichts (AK-F55-14).
 *  * Die App löst nie von sich aus einen Notruf aus (AK-F55-13).
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { p } from '../config/params.js';
import { one, q } from '../db/pool.js';
import { requireMember } from '../lib/context.js';
import { decrypt, encrypt, normalizePhone } from '../lib/crypto.js';
import { AppError, bad, notFound } from '../lib/errors.js';
import { body, idParam, params } from '../lib/http.js';
import { countryOf } from '../lib/geo.js';
import { t } from '../lib/texts.js';
import { sendMail } from '../providers/mail.js';
import { sendToPhone } from '../services/telegram.js';
import { createNotice } from '../services/notify.js';
import { sendPush } from '../services/push.js';

// Issue #32: „sms“ bleibt als Kennung für Mobilnummern (ältere Geräte); zugestellt wird über den Telegram-Bot
const recipientSchema = z.object({ kind: z.enum(['sms', 'telegram', 'email']), to: z.string().min(3).max(254) });
const relaySchema = z.object({ recipients: z.array(recipientSchema).min(1).max(10), text: z.string().min(1).max(600) });

/** AK-F55-15: weder Absender noch Text nennen Produktnamen oder Anlass. */
function neutral(text: string) {
  return text.replace(/cruizy/gi, '').replace(/check-?in/gi, '').trim();
}

export async function deliverRelay(msg: z.infer<typeof relaySchema>) {
  const text = neutral(msg.text);
  for (const r of msg.recipients) {
    if (r.kind === 'sms' || r.kind === 'telegram') {
      const phone = normalizePhone(r.to);
      if (phone) await sendToPhone(phone, text, 'checkin');
    } else if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.to)) {
      // an Dritte: immer die neutrale Fassung — kein Logo, kein Name (AK-F55-15)
      await sendMail({ to: r.to, subject: t('UI-CHECKIN-MAIL-BETREFF'), text, design: { variant: 'neutral' } });
    }
  }
}

export async function endCheckin(id: string) {
  const r = await one(`DELETE FROM checkins WHERE id = $1 RETURNING account_id`, [id]);
  if (r) await q(`DELETE FROM notices WHERE account_id = $1 AND kind = 'checkin'`, [r.account_id]);
}

/** Hintergrundauftrag: Fragen stellen, Frist prüfen, vorher eingestellte Wirkung auslösen. */
export async function runCheckins() {
  const rows = await q(`SELECT * FROM checkins WHERE delete_at > now()`);
  const nowMs = Date.now();
  for (const c of rows) {
    const times = [c.q1_at, c.q2_at, c.q3_at].map((d: Date) => new Date(d).getTime());
    const due = c.single ? (c.asked < 1 && nowMs >= times[0] ? 1 : 0) : times.filter((x) => nowMs >= x).length;
    if (due > c.asked) {
      await q(`UPDATE checkins SET asked = $2 WHERE id = $1`, [c.id, due]);
      // AK-F55-03: neutrale Frage; bei ausgeschalteten Mitteilungen steht sie im Mitteilungsbereich
      await q(`DELETE FROM notices WHERE account_id = $1 AND kind = 'checkin'`, [c.account_id]);
      await createNotice(c.account_id, 'checkin', t('ST-CHK-03'), t('UI-CHECKIN-FRAGE-TEXT'), c.id);
      await sendPush(c.account_id, 'checkin', { title: t('ST-CHK-03'), url: `/sicherheit/check-in?frage=${c.id}`, tag: `chk:${c.id}` });
      continue;
    }
    const lastAsked = c.single ? c.asked >= 1 : c.asked >= 3;
    if (lastAsked && nowMs >= new Date(c.deadline_at).getTime()) {
      // AK-F55-10: genau die vorher eingestellte Wirkung
      if (c.effect === 'nichts') {
        await endCheckin(c.id);
      } else if (c.deposit_enc) {
        const msg = JSON.parse(decrypt('checkin', c.deposit_enc, `chk:${c.id}`).toString());
        await deliverRelay(msg).catch(() => {});
        await endCheckin(c.id);
      } else if (!c.relay_requested_at) {
        // Durchreichen: das Gerät wird geweckt und schickt Empfänger und Text (Nr. 83 a)
        await q(`UPDATE checkins SET relay_requested_at = now() WHERE id = $1`, [c.id]);
        await sendPush(c.account_id, 'checkin', { title: t('UI-CHECKIN-WEITERREICHEN'), url: `/sicherheit/check-in?weiter=${c.id}`, tag: `relay:${c.id}` });
      }
    }
  }
  // Spätestens nach P-CHECKIN-LOESCHUNG vergisst der Server den Zeitplan
  const old = await q(`SELECT id FROM checkins WHERE delete_at <= now()`);
  for (const o of old) await endCheckin(o.id);
}

export default async function checkinRoutes(app: FastifyInstance) {
  app.post('/api/checkins', async (req) => {
    // AK-F55-08: ohne Abo; AK-F55-19: ohne laufendes Gespräch erreichbar
    const a = await requireMember(req, { allowDeletionPending: true });
    const b = body(
      req,
      z.object({
        startsAt: z.string().datetime().optional(),
        effect: z.enum(['nichts', 'benachrichtigen']).default('nichts'),
        deposit: relaySchema.optional(),
      }),
    );
    if (b.deposit && b.effect !== 'benachrichtigen') throw bad('UI-EINGABE-PRUEFEN');
    const start = b.startsAt ? new Date(b.startsAt) : new Date();
    if (start.getTime() < Date.now() - 60_000 || start.getTime() > Date.now() + 24 * 3600_000) throw bad('UI-CHECKIN-ZEIT', {}, 'zeit');
    const at = (s: number) => new Date(start.getTime() + s * 1000);
    await q(`DELETE FROM checkins WHERE account_id = $1`, [a.id]);
    const q3 = at(p('P-CHECKIN-DRITTE'));
    const row = await one(
      `INSERT INTO checkins (account_id, starts_at, q1_at, q2_at, q3_at, deadline_at, effect, delete_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        a.id,
        start,
        at(p('P-CHECKIN-ERSTE')),
        at(p('P-CHECKIN-ZWEITE')),
        q3,
        new Date(q3.getTime() + p('P-CHECKIN-FRIST') * 1000),
        b.effect,
        at(p('P-CHECKIN-LOESCHUNG')),
      ],
    );
    if (b.deposit) {
      await q(`UPDATE checkins SET deposit_enc = $2 WHERE id = $1`, [row!.id, encrypt('checkin', JSON.stringify(b.deposit), `chk:${row!.id}`)]);
    }
    return { id: row!.id, questions: [at(p('P-CHECKIN-ERSTE')), at(p('P-CHECKIN-ZWEITE')), q3] };
  });

  app.get('/api/checkins/current', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    const c = await one(`SELECT id, starts_at, q1_at, q2_at, q3_at, deadline_at, asked, effect, deposit_enc IS NOT NULL AS deposit, relay_requested_at, single FROM checkins WHERE account_id = $1`, [a.id]);
    if (!c) return { checkin: null };
    return {
      checkin: {
        id: c.id,
        startsAt: c.starts_at,
        questions: c.single ? [c.q1_at] : [c.q1_at, c.q2_at, c.q3_at],
        deadlineAt: c.deadline_at,
        asked: c.asked,
        effect: c.effect,
        deposit: c.deposit,
        relayRequested: !!c.relay_requested_at,
      },
    };
  });

  app.post('/api/checkins/:id/answer', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    const { id } = params(req, idParam);
    const b = body(req, z.object({ answer: z.enum(['ja', 'nein']), again: z.boolean().optional() }));
    const c = await one(`SELECT * FROM checkins WHERE id = $1 AND account_id = $2`, [id, a.id]);
    if (!c) throw notFound();
    if (b.answer === 'ja' && b.again) {
      // ST-CHK-05: in P-CHECKIN-ZWEITE noch einmal fragen — eine einzelne Frage
      const qAt = new Date(Date.now() + p('P-CHECKIN-ZWEITE') * 1000);
      await q(
        `UPDATE checkins SET single = true, asked = 0, q1_at = $2, q2_at = $2, q3_at = $2, deadline_at = $3, relay_requested_at = NULL WHERE id = $1`,
        [id, qAt, new Date(qAt.getTime() + p('P-CHECKIN-FRIST') * 1000)],
      );
      await q(`DELETE FROM notices WHERE account_id = $1 AND kind = 'checkin'`, [a.id]);
      return { ok: true, next: qAt };
    }
    // „Ja“ beendet ohne Wirkung; „Nein“ öffnet beim Gerät den Hilfe-Bildschirm (AK-F55-06)
    await endCheckin(id);
    return { ok: true, help: b.answer === 'nein' };
  });

  app.delete('/api/checkins/:id', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    const { id } = params(req, idParam);
    const c = await one(`SELECT id FROM checkins WHERE id = $1 AND account_id = $2`, [id, a.id]);
    if (!c) throw notFound();
    await endCheckin(id);
    return { ok: true };
  });

  /** Durchreichen: nur zur fälligen Zeit, nichts wird gespeichert (AK-F55-14). */
  app.post('/api/checkins/:id/relay', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    const { id } = params(req, idParam);
    const b = body(req, relaySchema);
    const c = await one(`SELECT * FROM checkins WHERE id = $1 AND account_id = $2`, [id, a.id]);
    if (!c || c.effect !== 'benachrichtigen' || c.deposit_enc) throw notFound();
    if (Date.now() < new Date(c.deadline_at).getTime()) throw new AppError(409, 'UI-EINGABE-PRUEFEN', {}, 'nicht_faellig');
    await deliverRelay(b);
    await endCheckin(id);
    return { ok: true };
  });

  /** Notrufwege nach Aufenthaltsland (AK-F55-17) — Land aus der gerundeten Position, nicht gespeichert. */
  app.get('/api/checkins/help', async (req) => {
    const a = await requireMember(req, { allowDeletionPending: true, allowSuspended: true });
    const l = await one(
      `SELECT l.cell_lat, l.cell_lng, c.country FROM locations l LEFT JOIN cities c ON c.id = l.city_id WHERE l.account_id = $1`,
      [a.id],
    );
    const country = l?.cell_lat != null ? countryOf({ lat: l.cell_lat, lng: l.cell_lng }) : ((l?.country as 'DE' | 'AT' | 'CH' | null) ?? null);
    const numbers: { number: string; textId: string; silentApp?: string }[] = [];
    if (country === 'DE') numbers.push({ number: '110', textId: 'ST-CHK-12', silentApp: 'nora' });
    if (country === 'AT') numbers.push({ number: '133', textId: 'ST-CHK-12', silentApp: 'dec112' });
    if (country === 'CH') numbers.push({ number: '117', textId: 'ST-CHK-12' });
    numbers.push({ number: '112', textId: 'ST-CHK-18' }); // 112 immer
    return { country, numbers, victimLine: country === 'DE' ? '116 006' : null };
  });
}
