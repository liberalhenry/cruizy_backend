-- Chat-Erweiterungen (Issues #14, #21, #23, #26, #28, #30)

-- #14: eigener Lesestand je Gespräch. Nur für die Person selbst — die Gegenseite erfährt nie,
-- ob oder wann gelesen wurde (keine Lesebestätigung, F52 bleibt gewahrt).
ALTER TABLE conversations ADD COLUMN low_read_at timestamptz;
ALTER TABLE conversations ADD COLUMN high_read_at timestamptz;
UPDATE conversations SET low_read_at = last_message_at, high_read_at = last_message_at;

-- #21: vorformulierte Nachrichten
CREATE TABLE message_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  text_enc    bytea NOT NULL,
  position    smallint NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX message_templates_account ON message_templates (account_id, position);

-- #23: bis zu 10 private Alben je Konto
CREATE TABLE albums (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name        text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 40),
  position    smallint NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX albums_owner ON albums (owner_id, position);
ALTER TABLE private_media ADD COLUMN album_id uuid REFERENCES albums(id) ON DELETE CASCADE;
ALTER TABLE album_shares ADD COLUMN album_id uuid REFERENCES albums(id) ON DELETE CASCADE;
-- Bestand: das bisherige eine Album wird „Album 1“
INSERT INTO albums (owner_id, name)
  SELECT owner_id, 'Album 1' FROM (
    SELECT owner_id FROM private_media WHERE kind = 'album'
    UNION SELECT owner_id FROM album_shares) o;
UPDATE private_media pm SET album_id = a.id FROM albums a WHERE pm.kind = 'album' AND a.owner_id = pm.owner_id;
UPDATE album_shares s SET album_id = a.id FROM albums a WHERE a.owner_id = s.owner_id;
CREATE INDEX private_media_album ON private_media (album_id, position) WHERE album_id IS NOT NULL;

-- #26 Einmal-Bilder und #28 Sprachnachrichten
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_kind_check;
ALTER TABLE messages ADD CONSTRAINT messages_kind_check
  CHECK (kind IN ('text','image','exit','system','place','album_offer','audio'));
ALTER TABLE messages ADD COLUMN once boolean NOT NULL DEFAULT false;
ALTER TABLE messages ADD COLUMN once_viewed_at timestamptz;
ALTER TABLE messages ADD COLUMN once_expired_at timestamptz;
-- Datei eines angesehenen Einmal-Bilds: bis zur Löschung (kurz danach) für eine Meldung aus dem Anzeigefenster
ALTER TABLE messages ADD COLUMN once_purge_at timestamptz;
ALTER TABLE messages ADD COLUMN duration_ms int;
CREATE INDEX messages_once_purge ON messages (once_purge_at) WHERE once_purge_at IS NOT NULL;
CREATE INDEX messages_once_open ON messages (created_at) WHERE once AND once_viewed_at IS NULL AND once_expired_at IS NULL;

ALTER TABLE private_media DROP CONSTRAINT IF EXISTS private_media_kind_check;
ALTER TABLE private_media ADD CONSTRAINT private_media_kind_check CHECK (kind IN ('chat','album','audio'));
ALTER TABLE private_media ALTER COLUMN file DROP NOT NULL;
ALTER TABLE private_media ADD COLUMN mime text;

-- Einstellungen: Sprachnachrichten empfangen (#28), Gesprächsstarter anzeigen (#30)
ALTER TABLE profiles ADD COLUMN voice_receive boolean NOT NULL DEFAULT true;
ALTER TABLE profiles ADD COLUMN starters_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE profiles ADD COLUMN once_hint_seen boolean NOT NULL DEFAULT false;
-- Einmal-Bild: die signierte Adresse gilt genau einmal
ALTER TABLE messages ADD COLUMN once_served_at timestamptz;
