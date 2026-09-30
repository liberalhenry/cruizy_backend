/**
 * Öffentliche Angaben für die Web-App: Betriebsart, Parameter, die die
 * Oberfläche braucht, Kataloge und die veröffentlichten Moderationszeiten
 * (AK-M05-03: dieselben Werte wie in der Konfiguration).
 */
import { botLink } from '../services/telegram.js';
import type { FastifyInstance } from 'fastify';
import { env } from '../config/env.js';
import { p } from '../config/params.js';
import { mapConfig } from './karte.js';
import { BODY_TYPES, EVENT_CATEGORIES, EVENT_CATEGORY_MAX, GENDER_CATEGORIES, INTENTIONS, KINK_GROUPS, ORGANIZER_KINDS, POSITIONS, TRAIT_GROUPS } from '../services/catalogs.js';
import { allowedDurations } from '../services/intentions.js';
import { vapidPublicKey } from '../services/push.js';
import { CONSENT_VERSION } from './auth.js';
import { CONTRACT_LINES, CONTRACT_VARIANT, CONTRACT_VERSION } from './verification.js';

const hours = (s: number) => Math.round(s / 3600);

export default async function publicRoutes(app: FastifyInstance) {
  app.get('/api/config', async () => {
    const e = env();
    return {
      mode: e.OPERATION_MODE,
      inviteRequired: e.OPERATION_MODE === 'test' && !!e.TEST_INVITE_CODE,
      apple: !!(e.APPLE_CLIENT_ID && e.APPLE_REDIRECT_URI),
      telegramBot: botLink(),
      vapidKey: vapidPublicKey(),
      consentVersion: CONSENT_VERSION,
      contract: { version: CONTRACT_VERSION, lines: CONTRACT_LINES[CONTRACT_VARIANT] },
      stage2: p('P-STUFE2-SCHALTER'),
      zone2Check: p('P-ZONE2-ABGLEICH'),
      beforeEntry: p('P-PRUEFUNG-VOR-EINTRITT'),
      map: mapConfig(),
      params: {
        guestMinutes: Math.round(p('P-GAST-DAUER') / 60),
        nameMax: p('P-NAME-MAX'),
        pwMin: p('P-PW-MIN'),
        codeResendS: p('P-CODE-NEU-SENDEN'),
        messageMax: p('P-NACHRICHT-MAX'),
        imageMaxMb: p('P-BILD-MAX-MB'),
        albumMax: p('P-ALBUM-MAX'),
        albumsMax: p('P-ALBEN-MAX'),
        templatesMax: p('P-VORLAGEN-MAX'),
        templateChars: p('P-VORLAGE-ZEICHEN'),
        onceSeconds: p('P-EINMAL-ANZEIGE'),
        onceDays: Math.round(p('P-EINMAL-VERFALL') / 86400),
        voiceMaxS: p('P-SPRACHE-MAX'),
        traitsMax: p('P-MERKMALE-MAX'),
        photosMax: p('P-FOTOS-MAX'),
        gridMin: p('P-RASTER-MIN'),
        gridStages: p('P-RASTER-STUFEN'),
        searchMaxKm: p('P-SUCHE-MAX-KM'),
        searchMinChars: p('P-SUCHE-MIN-ZEICHEN'),
        freeTextMax: p('P-FREITEXT-MAX'),
        bodyTypesMax: p('P-KOERPERTYP-MAX'),
        kinksMax: p('P-KINKS-MAX'),
        blockBarS: p('P-BLOCK-LEISTE'),
        blockHours: hours(p('P-BLOCK-RUECKNAHME')),
        pinLength: p('P-PIN-LAENGE'),
        pinTries: p('P-PIN-VERSUCHE'),
        hideMs: p('P-VERSTECKEN-ZEIT'),
        // Issue #37: Dauer einer Datenfreigabe für das Support-Team
        supportReleaseS: p('P-SUPPORT-FREIGABE'),
        checkin: [p('P-CHECKIN-ERSTE'), p('P-CHECKIN-ZWEITE'), p('P-CHECKIN-DRITTE')].map((s) => Math.round(s / 60)),
        checkinGraceMin: Math.round(p('P-CHECKIN-FRIST') / 60),
        archiveHours: hours(p('P-ARCHIV')),
        disappearHours: hours(p('P-VERFALL')),
        zonesMax: p('P-ZONEN-MAX'),
        zoneRadius: p('P-ZONE-RADIUS'),
        substMinKm: p('P-ERSATZPUNKT-MIN-KM'),
        substMaxKm: p('P-ERSATZPUNKT-MAX-KM'),
        clusterMin: p('P-CLUSTER-MIN'),
        clusterLevels: p('P-CLUSTER-STUFEN'),
        exportHours: hours(p('P-EXPORT-DAUER')),
        exportDays: Math.round(p('P-EXPORT-BEREIT') / 86400),
        graceDays: Math.round(p('P-KARENZ') / 86400),
        vaultDays: Math.round(p('P-LOESCH-NACHLAUF') / 86400),
        recoveryWaitHours: hours(p('P-WHR-WARTEFRIST')),
        ticketMax: p('P-TICKET-MAX'),
        filterLatencyMs: p('P-ZAEHLER-LATENZ'),
        weeklyKm: p('P-WOCHENAKTIV-KM'),
        responseMin: p('P-AQ-MIN'),
        healthFields: p('P-GESUNDHEITSFELDER'),
        visitorsDays: p('P-BESUCHE-TAGE'),
        responseDays: Math.round(p('P-AQ-ZEITRAUM') / 86400),
        responseHours: Math.round(p('P-AQ-FRIST') / 3600),
        quiet: p('P-RUHEZEIT'),
        symbolsMin: p('P-SYMBOLE-MIN'),
        colors: p('P-INITIALE-FARBEN'),
        mediaRequestDays: Math.round(p('P-BILD-ANFRAGE-FRIST') / 86400),
        authPauseMin: Math.round(p('P-AUTH-PAUSE') / 60),
        writeDays: Math.round(p('P-ABSICHT-SCHREIBEN') / 86400),
      },
      intentions: INTENTIONS.map((i) => ({ key: i.key, textId: i.textId, default: i.default, durations: allowedDurations(i.key) })),
      traits: TRAIT_GROUPS.map((g) => ({ group: g.group, items: g.items.map(([id, name]) => ({ id, name })) })),
      genders: GENDER_CATEGORIES,
      positions: POSITIONS,
      bodyTypes: BODY_TYPES,
      kinks: KINK_GROUPS.map((g) => ({ group: g.group, items: g.items.map(([key, name]) => ({ key, name })) })),
      events: {
        categories: EVENT_CATEGORIES,
        categoryMax: EVENT_CATEGORY_MAX,
        organizerKinds: ORGANIZER_KINDS,
        monthsAhead: p('P-VERANSTALTUNG-MONATE'),
        images: p('P-VERANSTALTUNG-BILDER'),
        textMax: p('P-VERANSTALTUNG-TEXT'),
        radius: p('P-VERANSTALTUNG-RADIUS'),
        radii: p('P-VERANSTALTUNG-RADIEN'),
        cancelMaxHours: p('P-ABSAGEFRIST-MAX'),
      },
    };
  });

  /** Öffentliche Seite mit den Zeiten der Moderation (M-05, AK-M05-03). */
  app.get('/api/public/moderation-times', async () => ({
    pruefkette_ms: p('P-PRUEFKETTE'),
    graubereich_tagsueber_std: hours(p('P-FRIST-GRAU-TAG')),
    graubereich_gesamt_std: hours(p('P-FRIST-GRAU')),
    tagsueber: p('P-TAGSUEBER'),
    meldung_entscheidung_std: hours(p('P-FRIST-MELDUNG')),
    einspruch_bild_std: hours(p('P-FRIST-EINSPRUCH-BILD')),
    widerspruch_std: hours(p('P-FRIST-WIDERSPRUCH')),
    hash_abgleich_aktiv: p('P-HASH-AKTIV'),
    zone2_abgleich: p('P-ZONE2-ABGLEICH'),
  }));
}
