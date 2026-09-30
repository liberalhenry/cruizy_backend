-- Issue #22: Raster mit eigenem Radius, stufenweiser Erweiterung, stabiler Reihenfolge je Sitzung.
-- Issue #20: Namenssuche mit Einstellung, ob man darüber gefunden werden möchte.
ALTER TABLE profiles ADD COLUMN grid_radius_km smallint NOT NULL DEFAULT 10 CHECK (grid_radius_km BETWEEN 1 AND 1000);
ALTER TABLE profiles ADD COLUMN grid_expand boolean NOT NULL DEFAULT true;
ALTER TABLE profiles ADD COLUMN name_searchable boolean NOT NULL DEFAULT true;

-- Reihenfolge einer Rastersitzung (Seed): nur Kennungen und Abschnitt, höchstens einige Stunden alt.
-- Damit erscheint beim Nachladen kein Profil doppelt und keins wird übersprungen.
CREATE TABLE grid_snapshots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  ids         uuid[] NOT NULL,
  sections    smallint[] NOT NULL,
  meta        jsonb NOT NULL DEFAULT '{}'
);
CREATE INDEX grid_snapshots_account ON grid_snapshots (account_id, created_at DESC);

-- Namenssuche: Präfix und Teilwort, ohne Groß-/Kleinschreibung
CREATE INDEX profiles_name_lower ON profiles (lower(name) text_pattern_ops);

-- Issue #18: Travel-Modus — Bezugspunkt fürs Stöbern an einem anderen Ort. Gespeichert wird nur
-- der Mittelpunkt des gewählten Ortes aus dem Ortsverzeichnis (öffentlich bekannt), nie die eigene Position.
ALTER TABLE locations ADD COLUMN travel_lat double precision;
ALTER TABLE locations ADD COLUMN travel_lng double precision;
ALTER TABLE locations ADD COLUMN travel_place text;
ALTER TABLE locations ADD COLUMN travel_since timestamptz;
