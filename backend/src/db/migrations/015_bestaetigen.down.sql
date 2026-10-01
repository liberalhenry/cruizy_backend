-- Rückweg zu 015_bestaetigen.sql. Offene Team-Prüfungen der neuen Arten vorher entscheiden oder löschen.
DROP INDEX IF EXISTS verification_codes_team_open;
ALTER TABLE verification_codes DROP COLUMN IF EXISTS team_confirmed_by;
ALTER TABLE verification_codes DROP COLUMN IF EXISTS team_confirmed_at;
ALTER TABLE verification_codes DROP COLUMN IF EXISTS delivery;
ALTER TABLE verification_sessions DROP COLUMN IF EXISTS pose;
DELETE FROM id_reviews WHERE kind <> 'age1';
DROP INDEX IF EXISTS id_reviews_kind_open;
ALTER TABLE id_reviews DROP CONSTRAINT IF EXISTS id_reviews_decision_check;
UPDATE id_reviews SET decision = 'abgelaufen' WHERE decision IN ('passt','passt_nicht');
ALTER TABLE id_reviews ADD CONSTRAINT id_reviews_decision_check CHECK (decision IN ('volljaehrig','minderjaehrig','unlesbar','abgelaufen'));
ALTER TABLE id_reviews ALTER COLUMN session_id SET NOT NULL;
ALTER TABLE id_reviews DROP COLUMN IF EXISTS pose;
ALTER TABLE id_reviews DROP COLUMN IF EXISTS kind;
