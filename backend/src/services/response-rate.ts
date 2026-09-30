/**
 * Antwortquote (F19, Issue #24) — belohnt, bestraft nicht öffentlich.
 *
 *  * Basis: Unterhaltungen der letzten P-AQ-ZEITRAUM, die eine ANDERE Person begonnen hat.
 *  * Beantwortet: Antwort oder höfliche Absage innerhalb von P-AQ-FRIST nach der ersten Nachricht.
 *  * Nicht gezählt: blockierte oder gemeldete Absender, gesperrte oder gelöschte Konten, erste
 *    Nachricht vor Fristende zurückgezogen (gelöscht/verfallen), Eingang während einer Pause,
 *    Massennachrichten (mehr als P-AQ-MASSEN.anzahl neue Unterhaltungen in P-AQ-MASSEN.sekunden),
 *    laufende Fristen.
 *  * Unter P-AQ-MIN gezählten Unterhaltungen: keine Quote.
 *  * Stufen mit Hysterese: aufsteigen sofort, absteigen erst P-AQ-HYSTERESE unter der Grenze.
 *  * Öffentlich nur die Stufe, nie der Prozentwert (der steht nur im eigenen Profil).
 */
import { p } from '../config/params.js';
import { q } from '../db/pool.js';

export type Stage = 1 | 2 | 3 | null;

/** Stufe aus Quote und bisheriger Stufe (Hysterese). */
export function stageFor(pct: number | null, prev: Stage): Stage {
  if (pct === null) return null;
  const [s1, s2, s3] = p('P-AQ-STUFEN') as readonly number[];
  const h = p('P-AQ-HYSTERESE');
  const thr: Record<1 | 2 | 3, number> = { 1: s1, 2: s2, 3: s3 };
  const plain: Stage = pct >= s1 ? 1 : pct >= s2 ? 2 : pct >= s3 ? 3 : null;
  // die bisherige Stufe bleibt, solange die Quote nicht mehr als h unter ihrer Grenze liegt
  const kept: Stage = prev && pct >= thr[prev] - h ? prev : null;
  if (plain === null) return kept;
  if (kept === null) return plain;
  return (Math.min(plain, kept) as 1 | 2 | 3);
}

/** Zählt gewertete und beantwortete Unterhaltungen je Empfänger (alle oder eine Person). */
export async function responseCounts(accountId?: string) {
  const massen = p('P-AQ-MASSEN') as { anzahl: number; sekunden: number };
  return q<{ recipient_id: string; counted: number; answered: number }>(
    `SELECT f.recipient_id, count(*)::int AS counted,
            count(*) FILTER (WHERE f.answered_at IS NOT NULL AND f.answered_at <= f.deadline_at)::int AS answered
       FROM first_message_stats f
       JOIN accounts s ON s.id = f.sender_id
      WHERE f.received_at > now() - make_interval(secs => $1)
        AND ($2::uuid IS NULL OR f.recipient_id = $2)
        AND f.excluded IS NULL
        -- Frist läuft noch und unbeantwortet → noch nicht gewertet
        AND (f.answered_at IS NOT NULL OR f.deadline_at <= now())
        -- gesperrte oder zur Löschung vorgemerkte Absender (gelöschte fallen per Kaskade heraus)
        AND s.moderation_state <> 'suspended' AND s.deletion_requested_at IS NULL
        -- vom Empfänger blockiert oder gemeldet
        AND NOT EXISTS (SELECT 1 FROM blocks b WHERE b.blocker_id = f.recipient_id AND b.blocked_id = f.sender_id AND b.revoked_at IS NULL)
        AND NOT EXISTS (SELECT 1 FROM reports r WHERE r.reporter_id = f.recipient_id AND r.target_id = f.sender_id)
        -- erste Nachricht vor Fristende zurückgezogen (gelöscht oder verfallen) und unbeantwortet
        AND (f.answered_at IS NOT NULL OR f.first_message_id IS NULL
             OR EXISTS (SELECT 1 FROM messages m WHERE m.id = f.first_message_id))
        -- Massennachrichten: der Absender begann um diese Zeit mehr als N neue Unterhaltungen
        AND (SELECT count(*) FROM first_message_stats g
              WHERE g.sender_id = f.sender_id
                AND g.received_at BETWEEN f.received_at - make_interval(secs => $3) AND f.received_at + make_interval(secs => $3)) <= $4
      GROUP BY f.recipient_id`,
    [p('P-AQ-ZEITRAUM'), accountId ?? null, massen.sekunden, massen.anzahl],
  );
}

/** Berechnet Quote und Stufe neu (Hintergrundauftrag; nach jeder Antwort für die antwortende Person). */
export async function recomputeResponseRates(accountId?: string) {
  const counts = await responseCounts(accountId);
  const byId = new Map(counts.map((c) => [c.recipient_id, c]));
  const rows = await q<{ account_id: string; response_band: Stage; response_pct: number | null; response_counted: number | null }>(
    `SELECT account_id, response_band, response_pct, response_counted FROM profiles WHERE ($1::uuid IS NULL OR account_id = $1)
       AND (response_band IS NOT NULL OR response_pct IS NOT NULL OR account_id = ANY($2::uuid[]))`,
    [accountId ?? null, counts.map((c) => c.recipient_id)],
  );
  for (const r of rows) {
    const c = byId.get(r.account_id);
    const counted = c?.counted ?? 0;
    const pct = counted >= p('P-AQ-MIN') ? c!.answered / counted : null;
    const band = stageFor(pct, r.response_band);
    if (band === r.response_band && pct === r.response_pct && counted === r.response_counted) continue;
    await q(
      `UPDATE profiles SET response_band = $2, response_pct = $3, response_counted = $4, response_band_at = now() WHERE account_id = $1`,
      [r.account_id, band, pct, counted],
    );
  }
  // Datenminimierung: nichts über den Zeitraum plus Frist hinaus
  if (!accountId) {
    await q(`DELETE FROM first_message_stats WHERE received_at < now() - make_interval(secs => $1) - make_interval(secs => $2)`, [
      p('P-AQ-ZEITRAUM'),
      p('P-AQ-FRIST'),
    ]);
  }
}
