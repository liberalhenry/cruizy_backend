-- Issue #16: Veranstalter (B2B), Veranstaltungen mit Kategorien, Plätzen, Bildern, Gästeliste,
-- Absagefrist und Chat zwischen Veranstalter und angenommenen Gästen. Issue #17: Lage auf der Karte.

-- Als Veranstalter verifizierte Konten: nur sie veröffentlichen direkt. Alle anderen reichen ein;
-- das Team entscheidet im Einzelfall.
CREATE TABLE organizers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      uuid UNIQUE REFERENCES accounts(id) ON DELETE CASCADE, -- NULL = Cruizy selbst
  name            text NOT NULL,
  kind            text NOT NULL,
  city            text,
  website         text,
  contact_email_enc bytea,
  note_enc        bytea,
  status          text NOT NULL DEFAULT 'beantragt' CHECK (status IN ('beantragt','verifiziert','abgelehnt','entzogen')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  decided_at      timestamptz,
  decided_by      uuid,
  decision_note   text,
  is_test_data    boolean NOT NULL DEFAULT false
);

ALTER TABLE events ADD COLUMN host_id uuid REFERENCES accounts(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN organizer_id uuid REFERENCES organizers(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN categories text[] NOT NULL DEFAULT '{}';
ALTER TABLE events ADD COLUMN capacity integer CHECK (capacity IS NULL OR capacity > 0);
ALTER TABLE events ADD COLUMN approval_required boolean NOT NULL DEFAULT false;
ALTER TABLE events ADD COLUMN cancel_until_hours integer NOT NULL DEFAULT 0 CHECK (cancel_until_hours >= 0);
-- Lage: genau nur bei öffentlichen Orten (Club, Konzerthaus …). Sonst ein ungefährer Punkt,
-- die Adresse sehen nur angenommene Gäste.
ALTER TABLE events ADD COLUMN address text;
ALTER TABLE events ADD COLUMN area text;
ALTER TABLE events ADD COLUMN lat double precision;
ALTER TABLE events ADD COLUMN lng double precision;
ALTER TABLE events ADD COLUMN map_lat double precision;
ALTER TABLE events ADD COLUMN map_lng double precision;
ALTER TABLE events ADD COLUMN location_public boolean NOT NULL DEFAULT false;
ALTER TABLE events ADD COLUMN price text;
ALTER TABLE events ADD COLUMN dress_code text;
ALTER TABLE events ADD COLUMN featured boolean NOT NULL DEFAULT false;
ALTER TABLE events ADD COLUMN checked_at timestamptz;
ALTER TABLE events ADD COLUMN checked_by uuid;
ALTER TABLE events ADD COLUMN review_note text;
ALTER TABLE events ADD COLUMN updated_at timestamptz;
CREATE INDEX events_host ON events (host_id);
CREATE INDEX events_map ON events (map_lat, map_lng) WHERE status = 'approved';

CREATE TABLE event_images (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  file        text NOT NULL,
  position    smallint NOT NULL DEFAULT 0,
  width       integer,
  height      integer,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX event_images_event ON event_images (event_id, position);

-- Gästeliste: angefragt → angenommen/abgelehnt; abgesagt (von Gast) bleibt als Zahl für den Veranstalter
ALTER TABLE event_rsvps ADD COLUMN status text NOT NULL DEFAULT 'angenommen'
  CHECK (status IN ('angefragt','angenommen','abgelehnt','abgesagt'));
ALTER TABLE event_rsvps ADD COLUMN decided_at timestamptz;
ALTER TABLE event_rsvps ADD COLUMN cancelled_at timestamptz;
ALTER TABLE event_rsvps ADD COLUMN note text;
-- zusätzliche Test-Zusagen ohne Konto (nur Testveranstaltung, nie echte Personen)
ALTER TABLE events ADD COLUMN test_guests integer NOT NULL DEFAULT 0;

-- Chat Veranstalter ↔ angenommener Gast: eigener Bereich, getrennt von privaten Chats
CREATE TABLE event_chats (
  event_id        uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_id        uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  host_read_at    timestamptz,
  guest_read_at   timestamptz,
  last_message_at timestamptz,
  PRIMARY KEY (event_id, guest_id)
);
CREATE TABLE event_chat_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL,
  guest_id    uuid NOT NULL,
  sender_id   uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  body_enc    bytea NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (event_id, guest_id) REFERENCES event_chats(event_id, guest_id) ON DELETE CASCADE
);
CREATE INDEX ecm_thread ON event_chat_messages (event_id, guest_id, created_at);
