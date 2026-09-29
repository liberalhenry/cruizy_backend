-- Issue #7: Altersprüfung per Ausweisbild, ausgewertet auf dem eigenen Server.
-- Ist die Auswertung unsicher, prüft ein Mensch aus dem Team. Gespeichert wird nur,
-- solange die Prüfung offen ist (verschlüsselt, Ablage „idcheck“); mit der Entscheidung
-- werden die Bilder gelöscht. Das Geburtsdatum selbst wird nie gespeichert.

ALTER TABLE verification_sessions DROP CONSTRAINT IF EXISTS verification_sessions_state_check;
ALTER TABLE verification_sessions ADD CONSTRAINT verification_sessions_state_check
  CHECK (state IN ('pending','review','passed','failed','unclear','minor','cancelled','timeout'));

-- Versuche je Vorgang: der erste unlesbare Versuch darf wiederholt werden, bevor ein Mensch prüft
ALTER TABLE verification_sessions ADD COLUMN id_attempts smallint NOT NULL DEFAULT 0;

CREATE TABLE id_reviews (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number       text NOT NULL UNIQUE,
  session_id   uuid NOT NULL REFERENCES verification_sessions(id) ON DELETE CASCADE,
  account_id   uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  -- Dateikennungen in der Ablage „idcheck“; nach der Entscheidung leer
  files        text[] NOT NULL DEFAULT '{}',
  -- warum die Auswertung unsicher war — ohne Personenbezug
  auto_note    text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  deadline_at  timestamptz NOT NULL,
  decided_at   timestamptz,
  decided_by   uuid REFERENCES staff(id),
  decision     text CHECK (decision IN ('volljaehrig','minderjaehrig','unlesbar','abgelaufen'))
);
CREATE INDEX id_reviews_open ON id_reviews (created_at) WHERE decided_at IS NULL;
