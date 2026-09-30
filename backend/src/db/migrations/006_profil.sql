-- Issue #13: Profil bearbeiten — Größe, Gewicht, Position, Körpertyp, Kinks (freiwillig),
-- Freitext bis 2000 Zeichen. Bis zu 20 Fotos regelt der Parameter P-FOTOS-MAX.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_free_text_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_free_text_check CHECK (char_length(free_text) <= 2000);

ALTER TABLE profiles ADD COLUMN height_cm smallint CHECK (height_cm IS NULL OR height_cm BETWEEN 120 AND 230);
ALTER TABLE profiles ADD COLUMN weight_kg smallint CHECK (weight_kg IS NULL OR weight_kg BETWEEN 35 AND 250);
ALTER TABLE profiles ADD COLUMN position text
  CHECK (position IS NULL OR position IN ('top','vers_top','vers','vers_bottom','bottom','keine_penetration'));
-- Schlüssel aus den Katalogen in services/catalogs.ts
ALTER TABLE profiles ADD COLUMN body_types text[] NOT NULL DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN kinks text[] NOT NULL DEFAULT '{}';

CREATE INDEX profiles_body_types ON profiles USING gin (body_types);
CREATE INDEX profiles_kinks ON profiles USING gin (kinks);
