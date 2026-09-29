-- Cruizy — Datenmodell, Fassung 1
--
-- PRÜFUNG ERFORDERLICH (Löschbarkeit, Standort, Ablagen).
--
-- Grundsätze, die hier im Schema stecken und nicht nachträglich einbaubar sind:
--  * Standort: es gibt KEINE Spalte für eine genaue Position. Gespeichert wird
--    nur der Mittelpunkt einer Rasterzelle (F70, FV-02, AK-F70-03).
--  * Löschbarkeit: jede Tabelle mit Personenbezug hängt über ON DELETE CASCADE
--    am Konto (F68, AK-F68-08). Ausnahmen sind benannt: gesicherte Fallinhalte
--    und die gesperrte Nachlauf-Ablage (FV-97) — beide ohne Kontokennung.
--  * Kontaktdaten und Inhalte liegen verschlüsselt (bytea), Suchen laufen über
--    einen Blindindex (HMAC), nie über den Klartext.
--  * Zugriffsprotokoll und Kennzahlenarchiv sind unveränderlich (Trigger).

CREATE TABLE parameters (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid
);

CREATE TABLE app_secrets (
  key    text PRIMARY KEY,
  value  bytea NOT NULL
);

-- Startstädte für die Stadtwahl ohne Standort (FV-10, FV-39)
CREATE TABLE cities (
  id       text PRIMARY KEY,
  name     text NOT NULL,
  country  text NOT NULL,
  lat      double precision NOT NULL,
  lng      double precision NOT NULL,
  active   boolean NOT NULL DEFAULT true
);

-- ───────────────────────── Konten ─────────────────────────

CREATE TABLE accounts (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at           timestamptz NOT NULL DEFAULT now(),
  -- provisional: angelegt, Adresse/Nummer noch nicht bestätigt oder Einwilligung fehlt
  status               text NOT NULL DEFAULT 'provisional'
                         CHECK (status IN ('provisional','active')),
  primary_method       text NOT NULL CHECK (primary_method IN ('email','phone','apple')),
  email_hash           bytea UNIQUE,
  email_enc            bytea,
  email_verified_at    timestamptz,
  phone_hash           bytea UNIQUE,
  phone_enc            bytea,
  phone_verified_at    timestamptz,
  apple_sub_hash       bytea UNIQUE,
  password_hash        text,
  consented_at         timestamptz,

  -- Altersprüfung Stufe 1 (F04, FV-16: nur ja/nein, Zeitpunkt, Weg, Vorgang)
  age1_at              timestamptz,
  age1_method          text,
  age1_ref             text,
  -- Stufe 2 (Z-03)
  age2_at              timestamptz,
  age2_method          text,
  age2_ref             text,
  -- FV-17 Weg B: „nicht volljährig“ → sofort gesperrt, Löschung nach P-VOLLJAEHRIG-EINSPRUCH
  minor_locked_at      timestamptz,
  minor_delete_at      timestamptz,
  -- AK-PG-03: Altersangabe unter 18 → nichts gespeichert, weiter erst nach Altersprüfung
  age_gate_required    boolean NOT NULL DEFAULT false,

  -- Community-Vertrag (F05)
  contract_version     text,
  contract_variant     text,
  contract_at          timestamptz,

  -- Fotoprüfung (F06)
  face_check_at        timestamptz,
  face_check_photos    uuid[],

  -- Moderation (M40): Einschränkung oder Sperre, nur nach Vier-Augen-Freigabe
  moderation_state     text NOT NULL DEFAULT 'none'
                         CHECK (moderation_state IN ('none','restricted','suspended')),
  -- M-04 Stellung „Einschränkung zulässig“ (Nr. 31)
  hash_restricted_at   timestamptz,

  -- Löschung mit Karenz (F68)
  deletion_requested_at timestamptz,
  deletion_due_at       timestamptz,

  -- Wiederherstellung (Z-09)
  recovery_code_hash       text,
  recovery_code_created_at timestamptz,
  recovery_prompted_at     timestamptz,
  trusted_key_hash         text,
  trusted_key_created_at   timestamptz,

  -- Stufe-2-Authentifizierung: nur gerätegebundene Schlüssel (FV-87, Nr. 100)
  webauthn_user_id     bytea,

  last_active_at       timestamptz,
  first_visible_at     timestamptz,
  is_test_data         boolean NOT NULL DEFAULT false
);
CREATE INDEX accounts_deletion_due ON accounts (deletion_due_at) WHERE deletion_due_at IS NOT NULL;
CREATE INDEX accounts_provisional ON accounts (created_at) WHERE status = 'provisional';

CREATE TABLE device_sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  token_hash      bytea NOT NULL UNIQUE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  last_seen_at    timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL,
  -- Zeitpunkt der letzten Passwort-/Code-Eingabe in dieser Sitzung (Export, FV-76)
  reauth_at       timestamptz NOT NULL DEFAULT now(),
  -- Stufe-2-Authentifizierung in dieser Sitzung (Z-03, FV-87)
  stage2_auth_at  timestamptz,
  -- Tag der letzten Zählung für „App geöffnet“ (Q-16)
  opened_day      date
);
CREATE INDEX device_sessions_account ON device_sessions (account_id);

-- Bekannte Geräte (Z-10: SMS-Code bei Anmeldung auf einem neuen Gerät)
CREATE TABLE known_devices (
  account_id   uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  device_hash  bytea NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, device_hash)
);

-- Einmalcodes (E-Mail, SMS, Passwort) — nur als Hash
CREATE TABLE verification_codes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   uuid REFERENCES accounts(id) ON DELETE CASCADE,
  purpose      text NOT NULL CHECK (purpose IN ('verify_email','verify_phone','login_phone','reset','add_email','add_phone')),
  target_hash  bytea,
  target_enc   bytea,
  code_hash    bytea NOT NULL,
  attempts     int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  consumed_at  timestamptz
);
CREATE INDEX verification_codes_account ON verification_codes (account_id, purpose);

-- Versandbegrenzung je Ziel (P-RESET-SPERRE, P-SMS-SPERRE) — nur Prüfwert, kein Klartext
CREATE TABLE send_log (
  target_hash  bytea NOT NULL,
  purpose      text NOT NULL,
  sent_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX send_log_target ON send_log (target_hash, purpose, sent_at);

-- Einwilligungen, versioniert (Q-09)
CREATE TABLE consents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  purpose       text NOT NULL,
  text_version  text NOT NULL,
  granted_at    timestamptz NOT NULL DEFAULT now(),
  revoked_at    timestamptz
);
CREATE INDEX consents_account ON consents (account_id);

-- Wiederherstellung über eine Vertrauensperson (Z-09, Nr. 95, Nr. 100)
CREATE TABLE recovery_attempts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  token_hash    bytea NOT NULL UNIQUE,
  started_at    timestamptz NOT NULL DEFAULT now(),
  due_at        timestamptz NOT NULL,
  cancelled_at  timestamptz,
  completed_at  timestamptz
);

-- Vorgänge beim Prüfpartner (F04 Stufe 1, Z-03 Stufe 2, F06 Fotoprüfung).
-- Gespeichert wird nur Ergebnis, Weg, Zeitpunkt und Vorgangskennung (AK-F04-04).
CREATE TABLE verification_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  kind          text NOT NULL CHECK (kind IN ('age1','age2','face')),
  method        text NOT NULL,
  state         text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','passed','failed','unclear','minor','cancelled','timeout')),
  provider_ref  text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  finished_at   timestamptz
);
CREATE INDEX verification_sessions_account ON verification_sessions (account_id, kind, created_at);

-- Gerätegebundene Schlüssel für Stufe 2 (FV-87 Weg B: nicht synchronisiert)
CREATE TABLE webauthn_credentials (
  id             bytea PRIMARY KEY,
  account_id     uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  public_key     bytea NOT NULL,
  counter        bigint NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE webauthn_challenges (
  account_id  uuid PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  challenge   text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ───────────────────────── Profil ─────────────────────────

CREATE TABLE profiles (
  account_id              uuid PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  name                    text NOT NULL,
  -- FV-23 Weg B: nur die Zahl, kein Geburtsmonat, kein Geburtsdatum; unter 18 wird nie gespeichert
  age                     smallint CHECK (age IS NULL OR (age >= 18 AND age <= 120)),
  age_set_at              timestamptz,
  age_prompted_at         timestamptz,
  photo_mode              text NOT NULL DEFAULT 'initial' CHECK (photo_mode IN ('photo','initial')),
  initial_color           text NOT NULL,
  intention               text CHECK (intention IN ('abend','schreiben','absicht3','absicht4')),
  intention_started_at    timestamptz,
  intention_expires_at    timestamptz,
  last_intention          text,
  last_intention_duration text,
  renewal_dismissed_until timestamptz,
  intention_expired_at    timestamptz,
  traits                  smallint[] NOT NULL DEFAULT '{}',
  gender_category         text,
  gender_text             text,
  gender_visible          boolean NOT NULL DEFAULT false,
  see_groups              text[] NOT NULL DEFAULT '{}',
  free_text               text NOT NULL DEFAULT '' CHECK (char_length(free_text) <= 400),
  free_text_flagged       boolean NOT NULL DEFAULT false,
  free_text_checked       boolean NOT NULL DEFAULT true,
  response_rate_enabled   boolean NOT NULL DEFAULT true,
  response_band           smallint CHECK (response_band IN (1,2,3)),
  response_band_at        timestamptz,
  -- Einstellungen
  sort_mode               text NOT NULL DEFAULT 'naehe' CHECK (sort_mode IN ('naehe','antwortquote','neu','absicht')),
  media_receive           text NOT NULL DEFAULT 'nach_antwort' CHECK (media_receive IN ('nach_antwort','bestaetigung','immer')),
  disappearing_default    boolean NOT NULL DEFAULT false,
  push_enabled            boolean NOT NULL DEFAULT true,
  push_preview            boolean NOT NULL DEFAULT false,
  quiet_from              smallint NOT NULL DEFAULT 23,
  quiet_to                smallint NOT NULL DEFAULT 8,
  checkin_effect          text NOT NULL DEFAULT 'nichts' CHECK (checkin_effect IN ('nichts','benachrichtigen')),
  filters                 jsonb NOT NULL DEFAULT '{}',
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- Merkliste (F21) — privat
CREATE TABLE bookmarks (
  owner_id    uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  target_id   uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, target_id)
);

-- Profilfotos (F10, F11) — Zone 1
CREATE TABLE photos (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id       uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  position         smallint NOT NULL DEFAULT 0,
  status           text NOT NULL DEFAULT 'checking'
                     CHECK (status IN ('checking','queued','approved','rejected','blocked')),
  blurred          boolean NOT NULL DEFAULT false,
  -- Ablage A (Original, verschlüsselt) und Ablage B (öffentliche Fassung) — Dateikennungen zufällig, nicht ableitbar
  original_file    text NOT NULL,
  public_file      text,
  width            int,
  height           int,
  -- Stufe 1: 'checked' oder 'pending' („Hash-Prüfung ausstehend“, AK-M02-10)
  hash_state       text NOT NULL DEFAULT 'pending' CHECK (hash_state IN ('checked','pending')),
  -- Klassifikatorwert nur bis zur Entscheidung (AK-M02-08)
  classifier_score real,
  queued_at        timestamptz,
  rejection_reason text,
  rejection_area   jsonb,
  decided_at       timestamptz,
  decided_by       text,
  decided_auto     boolean,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX photos_account ON photos (account_id, position);
CREATE INDEX photos_queue ON photos (queued_at) WHERE status = 'queued';

-- ───────────────────────── Standort ─────────────────────────

-- Eine Zeile je Konto. KEINE genaue Position — nur Zellmittelpunkte (F70).
CREATE TABLE locations (
  account_id    uuid PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  level         text NOT NULL DEFAULT 'grob' CHECK (level IN ('grob','nah','aus')),
  city_id       text REFERENCES cities(id),
  -- eigener gerundeter Ort (für die eigene Suche, AK-F60-10)
  cell_lat      double precision,
  cell_lng      double precision,
  -- was andere sehen: gerundeter Ort oder Ersatzpunkt (AK-F60-07)
  display_lat   double precision,
  display_lng   double precision,
  approx        boolean NOT NULL DEFAULT false,   -- „ungefährer Ort“ (ST-STO-41)
  invisible     boolean NOT NULL DEFAULT false,   -- Zone mit Wirkung U
  in_zone       boolean NOT NULL DEFAULT false,
  country       text,
  updated_at    timestamptz
);
CREATE INDEX locations_display ON locations (display_lat, display_lng) WHERE display_lat IS NOT NULL;

-- Standortzonen (F60) — Mittelpunkt und Ersatzpunkt nur als Rasterzelle, verschlüsselt (AK-F60-13)
CREATE TABLE zones (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  label        text,
  center_enc   bytea NOT NULL,
  radius_km    real NOT NULL,
  effect       text NOT NULL CHECK (effect IN ('ersatzpunkt','unsichtbar')),
  subst_enc    bytea,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX zones_account ON zones (account_id);

-- Personengruppen der Karte (F30) — nur Summen je Gitterzelle ab P-CLUSTER-MIN
CREATE TABLE map_clusters (
  cell_lat     double precision NOT NULL,
  cell_lng     double precision NOT NULL,
  level        smallint NOT NULL,
  computed_at  timestamptz NOT NULL,
  PRIMARY KEY (cell_lat, cell_lng)
);

-- ───────────────────────── Sperren ─────────────────────────

CREATE TABLE blocks (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id       uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  blocked_id       uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  revocable_until  timestamptz,
  final_at         timestamptz,
  revoked_at       timestamptz,
  finalized_done   boolean NOT NULL DEFAULT false
);
CREATE INDEX blocks_pair ON blocks (blocker_id, blocked_id);
CREATE INDEX blocks_blocked ON blocks (blocked_id);

-- ───────────────────────── Gespräche ─────────────────────────

CREATE TABLE conversations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_low            uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_high           uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  initiator_id        uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at          timestamptz NOT NULL DEFAULT now(),
  last_message_at     timestamptz NOT NULL DEFAULT now(),
  low_text_at         timestamptz,
  high_text_at        timestamptz,
  state               text NOT NULL DEFAULT 'open' CHECK (state IN ('open','ended')),
  ended_by            uuid REFERENCES accounts(id) ON DELETE CASCADE,
  ended_at            timestamptz,
  pending_exit_by     uuid REFERENCES accounts(id) ON DELETE CASCADE,
  pending_exit_at     timestamptz,
  disappearing_by     uuid REFERENCES accounts(id) ON DELETE CASCADE,
  disappearing_since  timestamptz,
  from_outside        boolean NOT NULL DEFAULT false,
  CHECK (user_low < user_high),
  UNIQUE (user_low, user_high)
);
CREATE INDEX conversations_low ON conversations (user_low);
CREATE INDEX conversations_high ON conversations (user_high);

-- Bildfreigabe je Empfänger (F43, FV-57, FV-96)
CREATE TABLE media_grants (
  conversation_id  uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  recipient_id     uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  state            text NOT NULL CHECK (state IN ('pending','allowed','denied')),
  requested_at     timestamptz NOT NULL DEFAULT now(),
  decided_at       timestamptz,
  PRIMARY KEY (conversation_id, recipient_id)
);

-- Bilder in Zone 2 (Gespräch und Album) — eigene Ablage, kein Klassifikator (M-01)
CREATE TABLE private_media (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  kind         text NOT NULL CHECK (kind IN ('chat','album')),
  file         text NOT NULL,
  width        int,
  height       int,
  hash_state   text NOT NULL DEFAULT 'pending' CHECK (hash_state IN ('checked','pending','skipped')),
  position     smallint NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX private_media_owner ON private_media (owner_id, kind);

CREATE TABLE messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id        uuid REFERENCES accounts(id) ON DELETE CASCADE,
  kind             text NOT NULL CHECK (kind IN ('text','image','exit','system','place','album_offer')),
  body_enc         bytea,
  media_id         uuid REFERENCES private_media(id) ON DELETE CASCADE,
  place_id         uuid,
  ref_id           uuid,
  system_code      text,
  -- 'sent' zugestellt · 'held_request' wartet hinter einer Bildanfrage (FV-96) ·
  -- 'held_stage2' wartet auf Stufe 2 der empfangenden Person (FV-86) · 'dropped' wird nie zugestellt
  delivery         text NOT NULL DEFAULT 'sent' CHECK (delivery IN ('sent','held_request','held_stage2','dropped')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  expires_at       timestamptz,
  client_ref       text
);
CREATE INDEX messages_conv ON messages (conversation_id, created_at);
CREATE INDEX messages_expiry ON messages (expires_at) WHERE expires_at IS NOT NULL;
CREATE UNIQUE INDEX messages_client_ref ON messages (conversation_id, sender_id, client_ref) WHERE client_ref IS NOT NULL;

-- Ein-Tipp-Freischaltung des Gesichts (F12)
CREATE TABLE face_unlocks (
  conversation_id  uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  owner_id         uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  viewer_id        uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  revoked_at       timestamptz,
  PRIMARY KEY (conversation_id, owner_id)
);

-- Private Alben (F48): Angebot und Annahme
CREATE TABLE album_shares (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  owner_id         uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  viewer_id        uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  state            text NOT NULL CHECK (state IN ('offered','accepted','declined','ended')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  decided_at       timestamptz,
  ended_at         timestamptz
);
CREATE INDEX album_shares_viewer ON album_shares (viewer_id, owner_id);

-- Antwortquote (F19): je empfangener Erstnachricht nur Wertung, keine Inhalte
CREATE TABLE first_message_stats (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  recipient_id     uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  sender_id        uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  received_at      timestamptz NOT NULL,
  iso_week         text NOT NULL,
  counted          boolean NOT NULL,
  answered_at      timestamptz,
  deadline_at      timestamptz NOT NULL,
  UNIQUE (conversation_id, recipient_id)
);
CREATE INDEX fms_recipient ON first_message_stats (recipient_id, received_at);

-- ───────────────────────── Mitteilungen ─────────────────────────

CREATE TABLE push_subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  session_id  uuid REFERENCES device_sessions(id) ON DELETE CASCADE,
  endpoint    text NOT NULL UNIQUE,
  p256dh      text NOT NULL,
  auth        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Bündelung: höchstens eine Mitteilung je Absender in P-PUSH-BUENDEL (AK-Q06-03)
CREATE TABLE push_bundles (
  recipient_id  uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  sender_id     uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  sent_at       timestamptz NOT NULL,
  PRIMARY KEY (recipient_id, sender_id)
);

-- Mitteilungsbereich für Sicherheitsmitteilungen (Z-01)
CREATE TABLE notices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  kind            text NOT NULL,
  title           text NOT NULL,
  body            text NOT NULL,
  ref             text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  first_shown_at  timestamptz,
  read_at         timestamptz
);
CREATE INDEX notices_account ON notices (account_id, created_at DESC);

-- ───────────────────────── Orte und Ereignisse ─────────────────────────

CREATE TABLE places (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id           text REFERENCES cities(id),
  name              text NOT NULL,
  kind              text NOT NULL,
  district          text,
  address           text,
  lat               double precision NOT NULL,
  lng               double precision NOT NULL,
  opening_hours     jsonb NOT NULL DEFAULT '{}',
  website           text,
  impressum_domain  text,
  description       text,
  source            text NOT NULL,
  source_fetched_at date NOT NULL,
  claimed_at        timestamptz,
  tool_account      boolean NOT NULL DEFAULT false,
  removed_at        timestamptz,
  no_relist         boolean NOT NULL DEFAULT false,
  is_test_data      boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE place_claims (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number            text NOT NULL UNIQUE,
  place_id          uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  kind              text NOT NULL CHECK (kind IN ('claim','removal')),
  contact_name_enc  bytea NOT NULL,
  role              text,
  email_enc         bytea NOT NULL,
  email_domain      text NOT NULL,
  proof_note_enc    bytea,
  verify_token_hash bytea,
  email_verified_at timestamptz,
  status            text NOT NULL DEFAULT 'waiting_email'
                      CHECK (status IN ('waiting_email','open','question','confirmed','rejected','withdrawn')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  deadline_at       timestamptz,
  decided_at        timestamptz,
  decided_by        uuid,
  decision_note     text,
  delete_after      timestamptz
);

CREATE TABLE events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id        uuid REFERENCES places(id) ON DELETE SET NULL,
  city_id         text REFERENCES cities(id),
  title           text NOT NULL,
  description     text NOT NULL DEFAULT '',
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz NOT NULL,
  source          text NOT NULL,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  -- M75.03: vom Menschen bestätigte Ampel; rot = in der App nur für verifizierte Konten
  ampel           text NOT NULL DEFAULT 'gruen' CHECK (ampel IN ('gruen','gelb','rot')),
  submitted_by_domain text,
  cancel_note     text,
  approved_by     uuid,
  approved_at     timestamptz,
  reminded_at     timestamptz,
  group_purged_at timestamptz,
  is_test_data    boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX events_time ON events (starts_at) WHERE status = 'approved';

CREATE TABLE event_rsvps (
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  account_id  uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, account_id)
);

-- Temporäre Ereignisgruppen (F33) — nur Text
CREATE TABLE event_group_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  sender_id   uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  body_enc    bytea NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX egm_event ON event_group_messages (event_id, created_at);

-- Eingang termine@ (F34): Vorschlag für die Freigabeliste; Mail nach P-MAIL-AUFBEWAHRUNG gelöscht
CREATE TABLE inbound_mails (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_enc     bytea NOT NULL,
  from_domain  text,
  subject_enc  bytea,
  body_enc     bytea,
  received_at  timestamptz NOT NULL DEFAULT now(),
  parsed       jsonb NOT NULL DEFAULT '{}',
  place_hint   uuid REFERENCES places(id) ON DELETE SET NULL,
  status       text NOT NULL DEFAULT 'open' CHECK (status IN ('open','approved','discarded')),
  event_id     uuid REFERENCES events(id) ON DELETE SET NULL,
  delete_after timestamptz NOT NULL
);

-- ───────────────────────── Sicherheit ─────────────────────────

-- Check-in (F55): der Server kennt nur, DASS einer läuft, und die Fragezeitpunkte.
-- Ausnahme „Hinterlegen“ (Nr. 83 b): verschlüsselte Nachricht bis zum Ende.
CREATE TABLE checkins (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  starts_at       timestamptz NOT NULL,
  q1_at           timestamptz NOT NULL,
  q2_at           timestamptz NOT NULL,
  q3_at           timestamptz NOT NULL,
  deadline_at     timestamptz NOT NULL,
  asked           smallint NOT NULL DEFAULT 0,
  effect          text NOT NULL CHECK (effect IN ('nichts','benachrichtigen')),
  deposit_enc     bytea,
  relay_requested_at timestamptz,
  single          boolean NOT NULL DEFAULT false,
  delete_at       timestamptz NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ───────────────────────── Meldungen und Moderation ─────────────────────────

-- Meldefälle (F62, M-03). reporter_id/target_id werden bei Kontolöschung genullt,
-- der Fall bleibt (X-09). Inhalte liegen als Kopie in report_items.
CREATE TABLE reports (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number               text NOT NULL UNIQUE,
  reporter_id          uuid REFERENCES accounts(id) ON DELETE SET NULL,
  reporter_contact_enc bytea,
  reason               text NOT NULL,
  description_enc      bytea,
  target_id            uuid REFERENCES accounts(id) ON DELETE SET NULL,
  target_ref           text,
  context              text NOT NULL,
  context_id           uuid,
  priority             boolean NOT NULL DEFAULT false,
  status               text NOT NULL DEFAULT 'received' CHECK (status IN ('received','in_review','decided','closed')),
  decision             text,
  decision_reason      text,
  decided_by           uuid,
  decided_at           timestamptz,
  deadline_at          timestamptz NOT NULL,
  closed_at            timestamptz,
  retention_until      timestamptz,
  also_blocked         boolean NOT NULL DEFAULT false,
  from_web             boolean NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now(),
  -- gelöschtes Gespräch aus der Nachlauf-Ablage (FV-97)
  vault_request        boolean NOT NULL DEFAULT false
);
CREATE INDEX reports_status ON reports (status, deadline_at);

CREATE TABLE report_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id     uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  kind          text NOT NULL,
  snapshot_enc  bytea,
  sealed_file   text,
  original_ref  uuid,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE report_events (
  id          bigserial PRIMARY KEY,
  report_id   uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  status      text NOT NULL,
  note        text,
  at          timestamptz NOT NULL DEFAULT now()
);

-- Einspruch (Bild, 48 h) und Widerspruch (jede andere Entscheidung, 72 h) — FV-81
CREATE TABLE appeals (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number              text NOT NULL UNIQUE,
  account_id          uuid REFERENCES accounts(id) ON DELETE CASCADE,
  kind                text NOT NULL CHECK (kind IN ('bild','entscheidung')),
  photo_id            uuid REFERENCES photos(id) ON DELETE SET NULL,
  report_id           uuid REFERENCES reports(id) ON DELETE SET NULL,
  suspension_id       uuid,
  text_enc            bytea NOT NULL,
  original_decider    uuid,
  original_auto       boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  deadline_at         timestamptz NOT NULL,
  decided_by          uuid,
  decided_at          timestamptz,
  outcome             text CHECK (outcome IN ('bleibt','aufgehoben','abgemildert')),
  answer              text,
  our_error           boolean NOT NULL DEFAULT false
);

-- Kontosperre mit Freigabe durch zwei Personen (M40)
CREATE TABLE suspensions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id         uuid REFERENCES accounts(id) ON DELETE SET NULL,
  action             text NOT NULL CHECK (action IN ('restrict','suspend','suspend_delete','lift')),
  reason             text NOT NULL,
  report_id          uuid REFERENCES reports(id) ON DELETE SET NULL,
  hash_case_id       uuid,
  requested_by       uuid NOT NULL,
  requested_at       timestamptz NOT NULL DEFAULT now(),
  approved_by        uuid,
  approved_at        timestamptz,
  rejected_by        uuid,
  rejected_at        timestamptz,
  rejection_reason   text,
  CHECK (approved_by IS NULL OR approved_by <> requested_by)
);

-- Hash-Treffer (M-04, M30): versiegelt, ohne Vorschaubild
CREATE TABLE hash_cases (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number           text NOT NULL UNIQUE,
  zone             smallint NOT NULL,
  account_ref      uuid,
  sealed_file      text NOT NULL,
  hash_value       text NOT NULL,
  list_name        text NOT NULL,
  ip_enc           bytea,
  status           text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reported','false_positive','closed')),
  assigned_to      uuid,
  created_at       timestamptz NOT NULL DEFAULT now(),
  deadline_at      timestamptz NOT NULL
);

-- Meldung nach Art. 18 DSA (M80)
CREATE TABLE authority_reports (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id         uuid REFERENCES reports(id) ON DELETE SET NULL,
  hash_case_id      uuid REFERENCES hash_cases(id) ON DELETE SET NULL,
  content           text NOT NULL,
  confirmed_text    boolean NOT NULL DEFAULT false,
  drafted_by        uuid NOT NULL,
  drafted_at        timestamptz NOT NULL DEFAULT now(),
  countersigned_by  uuid,
  countersigned_at  timestamptz,
  sent_by           uuid,
  sent_at           timestamptz,
  authority_ref     text,
  addenda           jsonb NOT NULL DEFAULT '[]',
  CHECK (countersigned_by IS NULL OR countersigned_by <> drafted_by)
);

-- Gesperrte Nachlauf-Ablage nach der Kontolöschung (FV-97) — ohne Kontokennung
-- des gelöschten Kontos; zugänglich nur über einen Meldefall der Gegenseite.
CREATE TABLE deletion_vault (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  counterpart_id  uuid REFERENCES accounts(id) ON DELETE CASCADE,
  payload_enc     bytea NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  purge_at        timestamptz NOT NULL,
  report_id       uuid REFERENCES reports(id) ON DELETE SET NULL
);

-- ───────────────────────── Hilfe und Kontakt (F75) ─────────────────────────

CREATE TABLE tickets (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number           text NOT NULL UNIQUE,
  category         smallint NOT NULL CHECK (category BETWEEN 1 AND 10),
  pot              text NOT NULL CHECK (pot IN ('missbrauch','hilfe','datenschutz','behoerden')),
  account_id       uuid REFERENCES accounts(id) ON DELETE SET NULL,
  had_account      boolean NOT NULL DEFAULT false,
  text_enc         bytea NOT NULL,
  attachment_file  text,
  reply_way        text NOT NULL CHECK (reply_way IN ('app','email')),
  email_enc        bytea,
  related_ref      text,
  status           text NOT NULL DEFAULT 'eingegangen'
                     CHECK (status IN ('eingegangen','in_bearbeitung','beantwortet','abgeschlossen')),
  priority         boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  deadline_at      timestamptz NOT NULL,
  deadline_history jsonb NOT NULL DEFAULT '[]',
  assigned_to      uuid,
  closed_reason    text,
  closed_at        timestamptz,
  delete_after     timestamptz
);

CREATE TABLE ticket_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author      text NOT NULL CHECK (author IN ('person','team')),
  staff_id    uuid,
  body_enc    bytea NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Rückmeldefeld (Z-07): Konto-Kennung nur, wenn eine Antwort gewünscht ist
CREATE TABLE feedback (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   uuid REFERENCES accounts(id) ON DELETE CASCADE,
  text_enc     bytea NOT NULL,
  wants_reply  boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  answered_at  timestamptz
);

-- ───────────────────────── Datenkonto (F68) ─────────────────────────

CREATE TABLE exports (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  status        text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','ready','failed')),
  password_enc  bytea,
  requested_at  timestamptz NOT NULL DEFAULT now(),
  ready_at      timestamptz,
  expires_at    timestamptz,
  file          text,
  attempts      smallint NOT NULL DEFAULT 0
);

-- Nutzungsberechtigung (Abo, später Codes) — hier nur die Grundlage (Z-05, Phase 2)
CREATE TABLE entitlements (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  tier         text NOT NULL CHECK (tier IN ('plus','pro')),
  source       text NOT NULL,
  valid_until  timestamptz NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ───────────────────────── Gastmodus ─────────────────────────

-- Netzadresse nur als Prüfwert und nur P-GAST-PAUSE lang (F01)
CREATE TABLE guest_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash     bytea NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX guest_sessions_ip ON guest_sessions (ip_hash, created_at);

-- ───────────────────────── Kennzahlen (Q-16) ─────────────────────────

-- Einzelereignisse gehören zum Konto und werden mit ihm gelöscht (FV-09)
CREATE TABLE metric_events (
  id          bigserial PRIMARY KEY,
  account_id  uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  kind        text NOT NULL,
  at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX metric_events_kind ON metric_events (kind, at);
CREATE INDEX metric_events_account ON metric_events (account_id, kind, at);

-- Monatsarchiv: nur Summen je Kohorte, unveränderlich (AK-Q16-01)
CREATE TABLE metrics_archive (
  month       text PRIMARY KEY,
  data        jsonb NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ───────────────────────── Moderationswerkzeug ─────────────────────────

CREATE TABLE staff (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  login            text NOT NULL UNIQUE,
  role             text NOT NULL CHECK (role IN ('MOD','BETRIEB')),
  founder          boolean NOT NULL DEFAULT false,
  password_hash    text NOT NULL,
  totp_secret_enc  bytea NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  disabled_at      timestamptz
);

CREATE TABLE staff_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id      uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  token_hash    bytea NOT NULL UNIQUE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL
);

-- Zugriffsprotokoll (M60): nur Anfügen. Ändern und Löschen verhindert ein Trigger — für jede Rolle.
CREATE TABLE access_log (
  id         bigserial PRIMARY KEY,
  staff_id   uuid NOT NULL REFERENCES staff(id),
  at         timestamptz NOT NULL DEFAULT now(),
  case_ref   text NOT NULL,
  action     text NOT NULL,
  reason     text NOT NULL CHECK (char_length(reason) > 0),
  special    boolean NOT NULL DEFAULT false
);
CREATE INDEX access_log_at ON access_log (at DESC);

CREATE FUNCTION forbid_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Unveränderliche Tabelle %: % ist nicht erlaubt', TG_TABLE_NAME, TG_OP;
END $$;

CREATE TRIGGER access_log_immutable BEFORE UPDATE OR DELETE ON access_log
  FOR EACH ROW EXECUTE FUNCTION forbid_change();
CREATE TRIGGER access_log_no_truncate BEFORE TRUNCATE ON access_log
  FOR EACH STATEMENT EXECUTE FUNCTION forbid_change();
CREATE TRIGGER metrics_archive_immutable BEFORE UPDATE OR DELETE ON metrics_archive
  FOR EACH ROW EXECUTE FUNCTION forbid_change();

-- Freigaben durch eine zweite Person (M20.03 Kontext, M30.08 Datei ansehen)
CREATE TABLE mod_approvals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind          text NOT NULL CHECK (kind IN ('kontext','datei')),
  ref           uuid NOT NULL,
  requested_by  uuid NOT NULL REFERENCES staff(id),
  reason        text NOT NULL CHECK (char_length(reason) > 0),
  approved_by   uuid REFERENCES staff(id),
  approved_at   timestamptz,
  rejected_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (approved_by IS NULL OR approved_by <> requested_by)
);

-- Quartalsdurchsicht und Gesprächserinnerung (M90)
CREATE TABLE staff_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id   uuid NOT NULL REFERENCES staff(id),
  kind       text NOT NULL,
  ref        text,
  at         timestamptz NOT NULL DEFAULT now()
);

-- Laufnummern für Fall- und Vorgangsnummern (FV-91): je Art und Jahr
CREATE TABLE counters (
  kind   text NOT NULL,
  year   int NOT NULL,
  value  int NOT NULL,
  PRIMARY KEY (kind, year)
);

-- Hintergrundaufträge: letzter Lauf
CREATE TABLE job_runs (
  name      text PRIMARY KEY,
  last_run  timestamptz NOT NULL
);

INSERT INTO cities (id, name, country, lat, lng) VALUES
  ('koeln', 'Köln', 'DE', 50.9375, 6.9603),
  ('duesseldorf', 'Düsseldorf', 'DE', 51.2277, 6.7735),
  ('bonn', 'Bonn', 'DE', 50.7374, 7.0982),
  ('berlin', 'Berlin', 'DE', 52.5200, 13.4050),
  ('hamburg', 'Hamburg', 'DE', 53.5511, 9.9937),
  ('muenchen', 'München', 'DE', 48.1351, 11.5820),
  ('frankfurt', 'Frankfurt am Main', 'DE', 50.1109, 8.6821),
  ('wien', 'Wien', 'AT', 48.2082, 16.3738),
  ('zuerich', 'Zürich', 'CH', 47.3769, 8.5417);
