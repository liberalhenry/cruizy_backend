-- Kein Testbetrieb mehr: Fehlt ein Prüfweg in der .env, bestätigt das Team im Werkzeug („Bestätigen“).
--
--  * id_reviews nimmt neben dem Ausweis (Stufe 1) auch Stufe 2, die Fotoprüfung und die
--    Gesichtsverifizierung von Cruizy Date auf. Die Bilder liegen verschlüsselt in der Ablage
--    „idcheck“ und werden mit der Entscheidung gelöscht.
--  * Codes, die mangels Mail- oder Telegram-Versand nicht zugestellt werden können, bestätigt
--    das Team (verification_codes.delivery = 'team').

ALTER TABLE id_reviews ADD COLUMN kind text NOT NULL DEFAULT 'age1' CHECK (kind IN ('age1','age2','face','date_face'));
-- die Geste, die auf dem Selfie zu sehen sein soll (Schlüssel aus DATE_POSES)
ALTER TABLE id_reviews ADD COLUMN pose text;
-- Cruizy Date hat keinen Prüfvorgang in verification_sessions
ALTER TABLE id_reviews ALTER COLUMN session_id DROP NOT NULL;
ALTER TABLE id_reviews DROP CONSTRAINT IF EXISTS id_reviews_decision_check;
ALTER TABLE id_reviews ADD CONSTRAINT id_reviews_decision_check
  CHECK (decision IN ('volljaehrig','minderjaehrig','unlesbar','abgelaufen','passt','passt_nicht'));
CREATE INDEX id_reviews_kind_open ON id_reviews (kind, created_at) WHERE decided_at IS NULL;

ALTER TABLE verification_sessions ADD COLUMN pose text;

ALTER TABLE verification_codes ADD COLUMN delivery text NOT NULL DEFAULT 'sent' CHECK (delivery IN ('sent','team'));
ALTER TABLE verification_codes ADD COLUMN team_confirmed_at timestamptz;
ALTER TABLE verification_codes ADD COLUMN team_confirmed_by uuid REFERENCES staff(id) ON DELETE SET NULL;
CREATE INDEX verification_codes_team_open ON verification_codes (created_at)
  WHERE delivery = 'team' AND consumed_at IS NULL AND team_confirmed_at IS NULL;
