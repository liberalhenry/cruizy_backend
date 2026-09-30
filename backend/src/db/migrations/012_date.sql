-- Issue #19: Cruizy Date — ernsthaftes Kennenlernen als zweiter Bereich auf demselben Konto.
-- Rückweg: 012_date.down.sql (npm run migrate:down -- 012_date). Die Hauptfunktionen bleiben unverändert.

-- Zugang und Einstellungen. Ohne Zeile: kein Date-Mitglied.
CREATE TABLE date_access (
  account_id        uuid PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  status            text NOT NULL DEFAULT 'onboarding'
                      CHECK (status IN ('onboarding','aktiv','pausiert','gesperrt')),
  step              text NOT NULL DEFAULT 'intention',
  intention         text CHECK (intention IN ('beziehung','kennenlernen','offen')),
  code_accepted_at  timestamptz,
  -- DSGVO Art. 9: ausdrückliche Einwilligung, nur Ergebnis und Zeitpunkt — nie Selfie oder Gesichtsmerkmale
  biometric_consent_at timestamptz,
  verified_at       timestamptz,
  verification_provider text,
  verification_result   text,
  paused_at         timestamptz,
  auto_paused       boolean NOT NULL DEFAULT false,
  suspended_at      timestamptz,
  suspended_reason  text,
  suspended_by      uuid,
  badge_in_grid     boolean NOT NULL DEFAULT true,
  likes_seen_at     timestamptz,
  nsfw_receive      text NOT NULL DEFAULT 'freigabe' CHECK (nsfw_receive IN ('ja','nein','freigabe')),
  last_active_at    timestamptz NOT NULL DEFAULT now(),
  activated_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX date_access_status ON date_access (status);

-- „Date ausblenden“ gilt auch ohne Mitgliedschaft (nur die Navigation)
ALTER TABLE profiles ADD COLUMN date_hidden boolean NOT NULL DEFAULT false;

CREATE TABLE date_waitlist (
  account_id  uuid PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  city_id     text REFERENCES cities(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE date_profiles (
  account_id        uuid PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  job               text,
  employer          text,
  interests         text[] NOT NULL DEFAULT '{}',
  looking_for       text CHECK (looking_for IS NULL OR char_length(looking_for) <= 500),
  relationship_model text,
  kids              text,
  smoking           text,
  alcohol           text,
  sport             text,
  religion          text,
  politics          text,
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- eigene Galerie, getrennt vom Raster; immer jugendfrei geprüft
CREATE TABLE date_photos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  file        text NOT NULL,
  position    smallint NOT NULL DEFAULT 0,
  status      text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','approved','rejected')),
  width       integer,
  height      integer,
  created_at  timestamptz NOT NULL DEFAULT now(),
  decided_at  timestamptz
);
CREATE INDEX date_photos_account ON date_photos (account_id, position);

CREATE TABLE date_prompts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  prompt_key  text NOT NULL,
  answer      text NOT NULL CHECK (char_length(answer) BETWEEN 1 AND 300),
  position    smallint NOT NULL DEFAULT 0,
  UNIQUE (account_id, prompt_key)
);

CREATE TABLE date_audio (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  kind        text NOT NULL CHECK (kind IN ('intro','prompt')),
  prompt_key  text,
  file        text NOT NULL,
  duration_ms integer NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, kind)
);

CREATE TABLE date_preferences (
  account_id   uuid PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  age_min      smallint NOT NULL DEFAULT 18,
  age_max      smallint NOT NULL DEFAULT 99,
  distance_km  integer NOT NULL DEFAULT 100,
  -- Deal-Breaker: {"smoking": ["regelmaessig"], "kids": ["nein"], "model": ["offen"]}
  dealbreakers jsonb NOT NULL DEFAULT '{}'
);

-- Likes nur auf ein konkretes Element (Foto, Prompt, Audio), optional mit Kommentar
CREATE TABLE date_likes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id     uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  to_id       uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  target_kind text NOT NULL CHECK (target_kind IN ('foto','prompt','audio')),
  target_id   uuid NOT NULL,
  comment     text CHECK (comment IS NULL OR char_length(comment) <= 150),
  super       boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_id, to_id)
);
CREATE INDEX date_likes_to ON date_likes (to_id, created_at);

-- übersprungen (für „zurückholen“ und damit sie nicht wieder vorgeschlagen werden)
CREATE TABLE date_passes (
  from_id    uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  to_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (from_id, to_id)
);

CREATE TABLE date_matches (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_low        uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_high       uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  like_low_id     uuid REFERENCES date_likes(id) ON DELETE SET NULL,
  like_high_id    uuid REFERENCES date_likes(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  -- lag das Gespräch schon vor dem Match vor? Dann bleibt es beim Auflösen bestehen.
  conversation_existed boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  seen_low_at     timestamptz,
  seen_high_at    timestamptz,
  ended_at        timestamptz,
  ended_by        uuid,
  CHECK (user_low < user_high)
);
CREATE UNIQUE INDEX date_matches_pair ON date_matches (user_low, user_high) WHERE ended_at IS NULL;
CREATE INDEX date_matches_conv ON date_matches (conversation_id) WHERE ended_at IS NULL;

-- Tagesvorschläge, vorberechnet (Hintergrundauftrag) oder beim ersten Abruf des Tages
CREATE TABLE date_daily_suggestions (
  account_id   uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  day          date NOT NULL,
  candidate_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  position     smallint NOT NULL,
  score        real NOT NULL,
  acted        text CHECK (acted IN ('like','pass')),
  PRIMARY KEY (account_id, day, candidate_id)
);
CREATE INDEX date_daily_day ON date_daily_suggestions (day);

-- NSFW in Date-Chats: Einwilligung je Gespräch und empfangender Person
CREATE TABLE nsfw_consent (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  recipient_id    uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  state           text NOT NULL CHECK (state IN ('erlaubt','abgelehnt')),
  decided_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, recipient_id)
);
ALTER TABLE messages ADD COLUMN nsfw boolean NOT NULL DEFAULT false;
-- Entscheidung der empfangenden Person zu diesem Bild: 'angesehen' | 'abgelehnt'
ALTER TABLE messages ADD COLUMN nsfw_decision text CHECK (nsfw_decision IN ('angesehen','abgelehnt'));
