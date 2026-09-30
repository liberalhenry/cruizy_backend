/**
 * Datenexport (F68, FV-76): alle personenbezogenen Daten des Kontos als
 * verschlüsselte ZIP-Datei (AES-256), Passwort wählt die Person. Öffnen lässt
 * sie sich mit gängigen Programmen (7-Zip, Keka, macOS-Archivprogramm ab 7-Zip-Format).
 *
 * PRÜFUNG ERFORDERLICH — Vollständigkeit gegen das Datenmodell (AK-F68-02):
 * Jede Tabelle mit Kontobezug steht in EXPORT_SECTIONS; ein Test prüft das
 * gegen die Datenbank (test/export-vollstaendigkeit.test.ts).
 */
import archiver from 'archiver';
import { PassThrough } from 'node:stream';
import { p } from '../config/params.js';
import { one, q } from '../db/pool.js';
import { decStr, decrypt } from '../lib/crypto.js';
import { getFile, putFile } from '../lib/files.js';
import { traitName } from './catalogs.js';
import { templatesOf } from '../modules/templates.js';

// archiver-zip-encrypted registriert das Format „zip-encrypted“
// eslint-disable-next-line @typescript-eslint/no-require-imports
import zipEncrypted from 'archiver-zip-encrypted';
let registered = false;
function ensureFormat() {
  if (!registered) {
    archiver.registerFormat('zip-encrypted', zipEncrypted as never);
    registered = true;
  }
}

/**
 * Tabellen mit Kontobezug und wie sie in den Export gehen. Neue Tabellen mit
 * Kontobezug brechen den Vollständigkeitstest, bis sie hier stehen.
 */
export const EXPORT_SECTIONS: Record<string, string> = {
  accounts: 'konto',
  device_sessions: 'sitzungen',
  known_devices: 'geraete',
  verification_codes: 'nicht exportiert: nur Prüfwerte laufender Codes (kurzlebig)',
  consents: 'einwilligungen',
  recovery_attempts: 'wiederherstellung',
  verification_sessions: 'pruefungen',
  id_reviews: 'pruefungen (Ausweis: nur Zeitpunkt und Ergebnis; Bilder werden mit der Entscheidung gelöscht)',
  webauthn_credentials: 'schluessel',
  webauthn_challenges: 'nicht exportiert: kurzlebige Anfrage',
  profiles: 'profil',
  bookmarks: 'merkliste',
  photos: 'fotos',
  locations: 'standort',
  zones: 'zonen',
  blocks: 'blockierungen',
  conversations: 'gespraeche',
  media_grants: 'gespraeche',
  private_media: 'album / gespraeche',
  messages: 'gespraeche',
  face_unlocks: 'gespraeche',
  album_shares: 'album',
  first_message_stats: 'antwortquote',
  push_subscriptions: 'mitteilungen_geraete',
  push_bundles: 'nicht exportiert: Zeitpunkt der letzten Mitteilung je Absender (15 Minuten)',
  notices: 'mitteilungen',
  event_rsvps: 'zusagen',
  event_group_messages: 'gruppennachrichten',
  checkins: 'check_in',
  reports: 'meldungen',
  appeals: 'widersprueche',
  suspensions: 'moderation',
  tickets: 'hilfe_vorgaenge',
  feedback: 'rueckmeldungen',
  exports: 'nicht exportiert: dieser Export selbst',
  entitlements: 'berechtigungen',
  metric_events: 'kennzahlen_ereignisse',
  deletion_vault: 'nicht exportiert: gesperrte Ablage, für niemanden zugänglich (FV-97)',
  grid_snapshots: 'nicht exportiert: Reihenfolge einer Rastersitzung (nur Kennungen, höchstens 6 Stunden)',
  message_templates: 'vorlagen',
  albums: 'alben',
  profile_visits: 'profilbesuche',
  health_reminders: 'test_erinnerung',
  health_profile: 'gesundheitsangaben',
};

export async function collectExport(accountId: string) {
  const acc = await one(`SELECT * FROM accounts WHERE id = $1`, [accountId]);
  if (!acc) throw new Error('Konto fehlt');
  const prof = await one(`SELECT * FROM profiles WHERE account_id = $1`, [accountId]);
  const files: { name: string; data: Buffer }[] = [];

  const photos = await q(`SELECT * FROM photos WHERE account_id = $1 AND status <> 'blocked' ORDER BY position`, [accountId]);
  for (const [i, ph] of photos.entries()) {
    files.push({ name: `fotos/foto-${i + 1}.jpg`, data: await getFile('zone1-original', ph.original_file) });
  }
  const albumRows = await q(`SELECT * FROM albums WHERE owner_id = $1 ORDER BY position, created_at`, [accountId]);
  const alben = [];
  for (const [ai, al] of albumRows.entries()) {
    const imgs = await q(`SELECT * FROM private_media WHERE album_id = $1 ORDER BY position, created_at`, [al.id]);
    const list = [];
    for (const [i, m] of imgs.entries()) {
      const name = `alben/${ai + 1}/bild-${i + 1}.jpg`;
      files.push({ name, data: await getFile('zone2', m.file) });
      list.push({ datei: name, hochgeladen: m.created_at });
    }
    alben.push({ name: al.name, angelegt: al.created_at, bilder: list });
  }

  const convs = await q(`SELECT * FROM conversations WHERE user_low = $1 OR user_high = $1 ORDER BY created_at`, [accountId]);
  const conversations = [];
  for (const [ci, c] of convs.entries()) {
    const msgs = await q(
      `SELECT m.*, pm.file FROM messages m LEFT JOIN private_media pm ON pm.id = m.media_id
        WHERE m.conversation_id = $1 AND m.sender_id = $2 AND (m.expires_at IS NULL OR m.expires_at > now()) ORDER BY m.created_at`,
      [c.id, accountId],
    );
    const own = [];
    for (const [mi, m] of msgs.entries()) {
      let bild: string | null = null;
      if (m.kind === 'image' && m.file) {
        bild = `gespraeche/${ci + 1}/bild-${mi + 1}.jpg`;
        files.push({ name: bild, data: await getFile('zone2', m.file) });
      }
      // Issue #28: eigene Sprachnachrichten als .m4a
      if (m.kind === 'audio' && m.file) {
        bild = `gespraeche/${ci + 1}/sprache-${mi + 1}.m4a`;
        files.push({ name: bild, data: await getFile('zone2', m.file) });
      }
      own.push({
        art: m.kind,
        text: m.body_enc ? decStr('messages', m.body_enc, `msg:${c.id}`) : null,
        systemhinweis: m.system_code,
        [m.kind === 'audio' ? 'sprachnachricht' : 'bild']: bild,
        einmal_bild: m.once || undefined,
        dauer_s: m.duration_ms ? Math.round(m.duration_ms / 1000) : undefined,
        gesendet: m.created_at,
        verfaellt: m.expires_at,
      });
    }
    conversations.push({
      nummer: ci + 1,
      begonnen: c.created_at,
      von_dir_begonnen: c.initiator_id === accountId,
      zustand: c.state,
      beendet_am: c.ended_at,
      verfallende_nachrichten: !!c.disappearing_by,
      // AF-09 offen: Nachrichten der Gegenseite sind nicht enthalten (FV-76)
      deine_nachrichten: own,
    });
  }

  const zones = (await q(`SELECT * FROM zones WHERE account_id = $1`, [accountId])).map((z) => ({
    bezeichnung: z.label,
    mittelpunkt_rasterzelle: JSON.parse(decrypt('location', z.center_enc, `zone:${accountId}`).toString()),
    radius_km: z.radius_km,
    wirkung: z.effect,
    ersatzpunkt_rasterzelle: z.subst_enc ? JSON.parse(decrypt('location', z.subst_enc, `zone:${accountId}`).toString()) : null,
    angelegt: z.created_at,
  }));

  const data = {
    hinweis:
      'Export aller personenbezogenen Daten deines Kontos (Art. 15 und 20 DSGVO). Nachrichten der anderen Person sind nicht enthalten, solange die Rechtsfrage AF-09 offen ist.',
    erstellt: new Date().toISOString(),
    konto: {
      angelegt: acc.created_at,
      anmeldeweg: acc.primary_method,
      email: decStr('pii', acc.email_enc, 'email'),
      email_bestaetigt: acc.email_verified_at,
      mobilnummer: decStr('pii', acc.phone_enc, 'phone'),
      mobilnummer_bestaetigt: acc.phone_verified_at,
      mit_apple_verbunden: !!acc.apple_sub_hash,
      einwilligung_erteilt: acc.consented_at,
      alterspruefung_stufe1: acc.age1_at ? { am: acc.age1_at, weg: acc.age1_method, vorgang: acc.age1_ref } : null,
      alterspruefung_stufe2: acc.age2_at ? { am: acc.age2_at, weg: acc.age2_method, vorgang: acc.age2_ref } : null,
      community_vertrag: acc.contract_version ? { fassung: acc.contract_version, satz: acc.contract_variant, am: acc.contract_at } : null,
      fotopruefung: acc.face_check_at,
      moderation: acc.moderation_state,
      loeschung_beantragt: acc.deletion_requested_at,
      loeschung_am: acc.deletion_due_at,
      wiederherstellungscode_vorhanden: !!acc.recovery_code_hash,
      vertrauenspersonen_schluessel_vorhanden: !!acc.trusted_key_hash,
      zuletzt_aktiv: acc.last_active_at,
    },
    profil: prof
      ? {
          name: prof.name,
          alter: prof.age,
          anzeige: prof.photo_mode,
          farbe: prof.initial_color,
          absicht: prof.intention ? { absicht: prof.intention, seit: prof.intention_started_at, bis: prof.intention_expires_at } : null,
          merkmale: (prof.traits as number[]).map((t) => traitName(t)),
          geschlechtsidentitaet: { kategorie: prof.gender_category, beschreibung: prof.gender_text, sichtbar: prof.gender_visible },
          wen_ich_sehen_moechte: prof.see_groups,
          freitext: prof.free_text,
          groesse_cm: prof.height_cm,
          gewicht_kg: prof.weight_kg,
          position: prof.position,
          koerpertypen: prof.body_types,
          kinks: prof.kinks,
          in_namenssuche_auffindbar: prof.name_searchable,
          antwortquote: {
            eingeschaltet: prof.response_rate_enabled,
            stufe: ({ 1: 'Antwortet fast immer', 2: 'Antwortet meistens', 3: 'Antwortet oft' } as Record<number, string>)[prof.response_band] ?? null,
            prozent: prof.response_pct === null ? null : Math.round(prof.response_pct * 100),
            gezaehlte_unterhaltungen: prof.response_counted,
            zeitraum_tage: Math.round(p('P-AQ-ZEITRAUM') / 86400),
            berechnet: prof.response_band_at,
          },
          einstellungen: {
            sortierung: prof.sort_mode,
            bilder_empfangen: prof.media_receive,
            verfallende_nachrichten_voreinstellung: prof.disappearing_default,
            mitteilungen: prof.push_enabled,
            vorschau: prof.push_preview,
            ruhezeit: `${prof.quiet_from}–${prof.quiet_to} Uhr`,
            check_in_wirkung: prof.checkin_effect,
            filter: prof.filters,
            raster_radius_km: prof.grid_radius_km,
            raster_erweitern: prof.grid_expand,
            sprachnachrichten_empfangen: prof.voice_receive,
            gespraechsstarter: prof.starters_enabled,
          },
        }
      : null,
    fotos: photos.map((ph, i) => ({ datei: `fotos/foto-${i + 1}.jpg`, status: ph.status, unkenntlich: ph.blurred, hochgeladen: ph.created_at, ablehnung: ph.rejection_reason })),
    standort: await one(`SELECT level AS stufe, city_id AS stadt, cell_lat AS rasterzelle_breite, cell_lng AS rasterzelle_laenge, updated_at AS aktualisiert FROM locations WHERE account_id = $1`, [accountId]),
    zonen: zones,
    einwilligungen: await q(`SELECT purpose AS zweck, text_version AS textstand, granted_at AS erteilt, revoked_at AS widerrufen FROM consents WHERE account_id = $1`, [accountId]),
    pruefungen: await q(`SELECT kind AS art, method AS weg, state AS ergebnis, created_at AS begonnen, finished_at AS beendet FROM verification_sessions WHERE account_id = $1`, [accountId]),
    geraeteschluessel: (await q(`SELECT created_at FROM webauthn_credentials WHERE account_id = $1`, [accountId])).map((r) => ({ eingerichtet: r.created_at })),
    sitzungen: await q(`SELECT created_at AS angemeldet, last_seen_at AS zuletzt FROM device_sessions WHERE account_id = $1`, [accountId]),
    bekannte_geraete: (await one(`SELECT count(*)::int AS n FROM known_devices WHERE account_id = $1`, [accountId]))!.n,
    wiederherstellung: await q(`SELECT started_at AS angestossen, due_at AS frist, cancelled_at AS abgebrochen, completed_at AS abgeschlossen FROM recovery_attempts WHERE account_id = $1`, [accountId]),
    merkliste: (await one(`SELECT count(*)::int AS n FROM bookmarks WHERE owner_id = $1`, [accountId]))!.n,
    blockierungen: await q(`SELECT created_at AS am, revocable_until AS ruecknehmbar_bis, final_at AS endgueltig, revoked_at AS zurueckgenommen FROM blocks WHERE blocker_id = $1`, [accountId]),
    gespraeche: conversations,
    alben,
    vorlagen: (await templatesOf(accountId)).map((x) => x.text),
    // Issue #27: wen ich besucht habe und wer mich besucht hat (ohne bestehende Blockierungen)
    profilbesuche: {
      von_dir: await q(
        `SELECT pr.name, v.visited_at AS am FROM profile_visits v JOIN profiles pr ON pr.account_id = v.target_id
          WHERE v.visitor_id = $1 AND NOT EXISTS (SELECT 1 FROM blocks b WHERE b.revoked_at IS NULL
            AND ((b.blocker_id = $1 AND b.blocked_id = v.target_id) OR (b.blocker_id = v.target_id AND b.blocked_id = $1)))
          ORDER BY v.visited_at DESC`,
        [accountId],
      ),
      bei_dir: await q(
        `SELECT pr.name, v.visited_at AS am FROM profile_visits v JOIN profiles pr ON pr.account_id = v.visitor_id
          WHERE v.target_id = $1 AND NOT EXISTS (SELECT 1 FROM blocks b WHERE b.revoked_at IS NULL
            AND ((b.blocker_id = $1 AND b.blocked_id = v.visitor_id) OR (b.blocker_id = v.visitor_id AND b.blocked_id = $1)))
          ORDER BY v.visited_at DESC`,
        [accountId],
      ),
      unsichtbar_stoebern: prof?.invisible_browsing ?? false,
    },
    // Issue #25: nur Intervall, nächste Erinnerung, Einwilligung
    test_erinnerung: await one(`SELECT interval_months AS intervall_monate, next_at AS naechste_erinnerung, consented_at AS einwilligung FROM health_reminders WHERE account_id = $1`, [accountId]),
    gesundheitsangaben: await one(`SELECT prep, last_test AS letzter_test, consented_at AS einwilligung FROM health_profile WHERE account_id = $1`, [accountId]),
    album_freigaben: await q(`SELECT state AS zustand, created_at AS angeboten, ended_at AS beendet FROM album_shares WHERE owner_id = $1`, [accountId]),
    gesicht_freigeschaltet: await q(`SELECT created_at AS am, revoked_at AS zurueckgenommen FROM face_unlocks WHERE owner_id = $1`, [accountId]),
    bildanfragen: await q(`SELECT state AS zustand, requested_at AS angefragt, decided_at AS entschieden FROM media_grants WHERE recipient_id = $1`, [accountId]),
    antwortquote_wertung: await q(`SELECT received_at AS eingegangen, deadline_at AS frist, answered_at AS beantwortet, excluded AS ausgenommen FROM first_message_stats WHERE recipient_id = $1`, [accountId]),
    mitteilungen: await q(`SELECT title AS titel, body AS text, ref AS nummer, created_at AS am, first_shown_at AS angezeigt FROM notices WHERE account_id = $1`, [accountId]),
    mitteilungen_geraete: (await one(`SELECT count(*)::int AS n FROM push_subscriptions WHERE account_id = $1`, [accountId]))!.n,
    zusagen: await q(`SELECT e.title AS ereignis, e.starts_at AS beginn, r.created_at AS zugesagt FROM event_rsvps r JOIN events e ON e.id = r.event_id WHERE r.account_id = $1`, [accountId]),
    gruppennachrichten: (await q(`SELECT event_id, body_enc, created_at FROM event_group_messages WHERE sender_id = $1`, [accountId])).map((g) => ({
      text: decStr('messages', g.body_enc, `grp:${g.event_id}`),
      am: g.created_at,
    })),
    check_in: await one(`SELECT starts_at AS beginn, effect AS wirkung FROM checkins WHERE account_id = $1`, [accountId]),
    meldungen: await q(`SELECT number AS fallnummer, reason AS grund, status, decision AS entscheidung, created_at AS am FROM reports WHERE reporter_id = $1`, [accountId]),
    widersprueche: (await q(`SELECT number, kind, text_enc, created_at, outcome, answer FROM appeals WHERE account_id = $1`, [accountId])).map((x) => ({
      nummer: x.number,
      art: x.kind,
      text: decStr('tickets', x.text_enc, 'appeal'),
      am: x.created_at,
      ergebnis: x.outcome,
      antwort: x.answer,
    })),
    moderation: await q(`SELECT action AS massnahme, reason AS grund, approved_at AS wirksam FROM suspensions WHERE account_id = $1 AND approved_at IS NOT NULL`, [accountId]),
    hilfe_vorgaenge: await Promise.all(
      (await q(`SELECT * FROM tickets WHERE account_id = $1`, [accountId])).map(async (tk) => ({
        nummer: tk.number,
        kategorie: tk.category,
        text: decStr('tickets', tk.text_enc, 'ticket'),
        status: tk.status,
        am: tk.created_at,
        verlauf: (await q(`SELECT author, body_enc, created_at FROM ticket_messages WHERE ticket_id = $1 ORDER BY created_at`, [tk.id])).map((m) => ({
          von: m.author === 'team' ? 'Team' : 'du',
          text: decStr('tickets', m.body_enc, 'ticket'),
          am: m.created_at,
        })),
      })),
    ),
    rueckmeldungen: (await q(`SELECT text_enc, created_at FROM feedback WHERE account_id = $1`, [accountId])).map((f) => ({ text: decStr('tickets', f.text_enc, 'feedback'), am: f.created_at })),
    berechtigungen: await q(`SELECT tier AS stufe, source AS herkunft, valid_until AS bis FROM entitlements WHERE account_id = $1`, [accountId]),
    kennzahlen_ereignisse: await q(`SELECT kind AS art, at AS am FROM metric_events WHERE account_id = $1 ORDER BY at`, [accountId]),
  };
  return { data, files };
}

export async function buildExportZip(accountId: string, password: string): Promise<Buffer> {
  ensureFormat();
  const { data, files } = await collectExport(accountId);
  const archive = archiver.create('zip-encrypted' as never, { zlib: { level: 8 }, encryptionMethod: 'aes256', password } as never);
  const out = new PassThrough();
  const chunks: Buffer[] = [];
  out.on('data', (c: Buffer) => chunks.push(c));
  const done = new Promise<void>((resolve, reject) => {
    out.on('end', () => resolve());
    archive.on('error', reject);
  });
  archive.pipe(out);
  archive.append(JSON.stringify(data, null, 2), { name: 'daten.json' });
  archive.append(
    'Diese Datei enthält alle Daten deines Kontos, auch Nachrichten und Fotos.\nSpeichere sie dort, wo sonst niemand hinschaut.\n',
    { name: 'LIES-MICH.txt' },
  );
  for (const f of files) archive.append(f.data, { name: f.name });
  await archive.finalize();
  await done;
  return Buffer.concat(chunks);
}

export async function runExports() {
  for (let i = 0; i < 3; i++) {
    // atomar übernehmen — zwei gleichzeitige Läufe greifen nie denselben Auftrag
    const job = await one(
      `UPDATE exports SET status = 'running', attempts = attempts + 1
        WHERE id = (SELECT id FROM exports WHERE status = 'queued' OR (status = 'failed' AND attempts < 3)
                     ORDER BY requested_at LIMIT 1 FOR UPDATE SKIP LOCKED)
        RETURNING *`,
    );
    if (!job) return;
    try {
      const password = decrypt('export', job.password_enc, `export:${job.id}`).toString();
      const zip = await buildExportZip(job.account_id, password);
      const file = await putFile('exports', zip);
      await q(
        `UPDATE exports SET status = 'ready', file = $2, password_enc = NULL, ready_at = now(), expires_at = now() + make_interval(secs => $3) WHERE id = $1`,
        [job.id, file, p('P-EXPORT-BEREIT')],
      );
      const { createNotice } = await import('./notify.js');
      const { t } = await import('../lib/texts.js');
      await createNotice(job.account_id, 'export_bereit', t('ST-DAT-01'), t('ST-DAT-05', { tage: Math.round(p('P-EXPORT-BEREIT') / 86400) }));
    } catch (e) {
      await q(`UPDATE exports SET status = 'failed' WHERE id = $1`, [job.id]);
      console.error('Export fehlgeschlagen', (e as Error).message);
    }
  }
}
