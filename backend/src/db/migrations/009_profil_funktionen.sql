-- #24 Antwortquote: Prozentwert nur für die Person selbst; Stufe (1 fast immer, 2 meistens, 3 oft) öffentlich.
ALTER TABLE profiles ADD COLUMN response_pct real;
ALTER TABLE profiles ADD COLUMN response_counted int;
ALTER TABLE first_message_stats ADD COLUMN first_message_id uuid;
-- Ausschlussgrund beim Eingang (z. B. 'pause' — Cruizy Date pausiert)
ALTER TABLE first_message_stats ADD COLUMN excluded text;
-- bisherige Bänder (1 oft … 3 selten) passen nicht zur neuen Bedeutung → neu berechnen
UPDATE profiles SET response_band = NULL, response_band_at = NULL;

-- #27 Profilbesucher: ein Eintrag je Besucher, Profil und Tag; nach 30 Tagen gelöscht
CREATE TABLE profile_visits (
  visitor_id  uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  target_id   uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  day         date NOT NULL,
  visited_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (visitor_id, target_id, day)
);
CREATE INDEX profile_visits_target ON profile_visits (target_id, visited_at DESC);
ALTER TABLE profiles ADD COLUMN invisible_browsing boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN visitors_seen_at timestamptz;

-- #25 Test-Erinnerung: getrennt vom Profil, nur Intervall, nächste Erinnerung, Einwilligung
CREATE TABLE health_reminders (
  account_id      uuid PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  interval_months smallint NOT NULL CHECK (interval_months IN (1, 3, 6)),
  next_at         timestamptz NOT NULL,
  push            boolean NOT NULL DEFAULT true,
  in_app          boolean NOT NULL DEFAULT true,
  consented_at    timestamptz NOT NULL,
  sent_for        timestamptz
);
CREATE INDEX health_reminders_due ON health_reminders (next_at);

-- #25 vorbereitet, deaktiviert (Parameter P-GESUNDHEITSFELDER): freiwillige Gesundheitsangaben
CREATE TABLE health_profile (
  account_id    uuid PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  prep          text CHECK (prep IN ('ja','nein')),
  last_test     text CHECK (last_test ~ '^[0-9]{4}-[0-9]{2}$'),
  consented_at  timestamptz NOT NULL
);

-- #29 Einmaliger Hinweis zur Vollständigkeit nach der Registrierung
ALTER TABLE profiles ADD COLUMN completeness_hint_at timestamptz;
