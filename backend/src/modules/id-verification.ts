/**
 * Altersprüfung per Ausweisbild (Issue #7) — der Weg der Nutzer.
 *
 *  * Vorderseite (Pflicht) und Rückseite (freiwillig, mit der maschinenlesbaren Zone) in
 *    einem Schritt. Abdecken erlaubt: Name, Foto, Adresse, Ausweisnummer.
 *  * Metadaten werden vor allem anderen entfernt (Stufe 0 der Bildaufbereitung).
 *  * Sicher volljährig → sofort bestanden, die Bilder werden nicht gespeichert.
 *  * Nichts erkannt → einmal neu fotografieren, dann Team.
 *  * Unsicher oder unter 18 → verschlüsselt in die Ablage „idcheck“ und an das Team.
 *    Mit der Entscheidung werden die Bilder gelöscht. Das Geburtsdatum wird nie gespeichert.
 */
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { p } from '../config/params.js';
import { one, q, tx } from '../db/pool.js';
import { requireSession } from '../lib/context.js';
import { AppError, bad, notFound, tooMany } from '../lib/errors.js';
import { putFile } from '../lib/files.js';
import { params, uuid } from '../lib/http.js';
import { prepare } from '../lib/images.js';
import { nextNumber } from '../lib/numbers.js';
import { hit } from '../lib/rate.js';
import { discord } from '../services/discord.js';
import { checkIdImages } from '../services/id-check.js';
import { applyResult } from './verification.js';

const MAX_FILES = 2;

async function readImages(req: FastifyRequest): Promise<Buffer[]> {
  const out: Buffer[] = [];
  const maxBytes = p('P-BILD-MAX-MB') * 1024 * 1024;
  for await (const part of req.files({ limits: { files: MAX_FILES, fileSize: maxBytes + 1 } })) {
    const buf = await part.toBuffer();
    if (part.file.truncated) throw bad('ST-FEH-10', { mb: p('P-BILD-MAX-MB') }, 'bild_zu_gross');
    out.push(buf);
  }
  if (!out.length) throw bad('UI-EINGABE-PRUEFEN', {}, 'datei_fehlt');
  return out;
}

export default async function idVerificationRoutes(app: FastifyInstance) {
  app.post('/api/verify/ausweis/:id', async (req) => {
    const a = await requireSession(req);
    if (a.status !== 'active' || !a.consented) throw new AppError(403, 'UI-EINWILLIGUNG-FEHLT', {}, 'einwilligung_fehlt');
    const { id } = params(req, z.object({ id: uuid }));
    if (!hit('ausweis', a.id, 10, 3600_000)) throw tooMany();
    const s = await one(
      `SELECT id, state, id_attempts, created_at FROM verification_sessions WHERE id = $1 AND account_id = $2 AND kind = 'age1' AND method = 'ausweis'`,
      [id, a.id],
    );
    if (!s) throw notFound();
    if (s.state !== 'pending') throw new AppError(409, 'UI-AUSWEIS-LAEUFT', {}, 'nicht_offen');

    // Stufe 0: Format prüfen, Metadaten verwerfen, neu kodieren
    const images = await Promise.all((await readImages(req)).map(async (b) => (await prepare(b)).data));
    const result = await checkIdImages(images);
    const attempts = s.id_attempts + 1;
    await q(`UPDATE verification_sessions SET id_attempts = $2 WHERE id = $1`, [id, attempts]);

    if (result.verdict === 'adult') {
      await applyResult(id, 'passed', `ausweis-auto-${result.source}`);
      discord('alterspruefung', { title: 'Altersprüfung bestanden (automatisch)', level: 'ok', fields: [{ name: 'Weg', value: result.source === 'mrz' ? 'maschinenlesbare Zone' : 'beschriftetes Datum' }] });
      return { state: 'passed' };
    }

    // Beim ersten Versuch ohne jedes erkannte Datum: lieber neu fotografieren lassen
    if (!result.source && attempts < 2) return { state: 'retry', hint: 'UI-AUSWEIS-NOCHMAL' };

    const files = await Promise.all(images.map((img) => putFile('idcheck', img)));
    const number = await tx(async (c) => {
      const number = await nextNumber('A', c);
      await c.query(
        `INSERT INTO id_reviews (number, session_id, account_id, files, auto_note, deadline_at)
         VALUES ($1, $2, $3, $4, $5, now() + make_interval(secs => $6))`,
        [number, id, a.id, files, result.note, p('P-AUSWEIS-FRIST')],
      );
      await c.query(`UPDATE verification_sessions SET state = 'review' WHERE id = $1`, [id]);
      return number as string;
    });
    discord('alterspruefung', {
      title: `Ausweis zur Prüfung: ${number}`,
      level: result.verdict === 'minor' ? 'danger' : 'warn',
      fields: [{ name: 'Grund', value: result.note }],
    });
    return { state: 'review', hours: Math.round(p('P-AUSWEIS-FRIST') / 3600) };
  });

  /** Offene Prüfung durch das Team — nur Zustand, keine Einzelheiten. */
  app.get('/api/verify/ausweis/:id', async (req) => {
    const a = await requireSession(req);
    const { id } = params(req, z.object({ id: uuid }));
    const s = await one(`SELECT state FROM verification_sessions WHERE id = $1 AND account_id = $2 AND method = 'ausweis'`, [id, a.id]);
    if (!s) throw notFound();
    return { state: s.state, hours: Math.round(p('P-AUSWEIS-FRIST') / 3600) };
  });
}
