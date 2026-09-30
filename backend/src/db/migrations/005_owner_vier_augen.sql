-- Issue #3: Owner (Zugänge mit Gründer-Kennzeichen) brauchen keine zweite Person.
-- Alle anderen Zugänge (MOD/BETRIEB ohne Gründer-Kennzeichen) bleiben an das
-- Vier-Augen-Prinzip gebunden — weiterhin auch als Regel in der Datenbank.
--
-- Bisher verbot eine CHECK-Regel „freigebende Person = antragstellende Person“ ausnahmslos.
-- Jetzt prüft ein Trigger dasselbe und erlaubt die Selbstfreigabe nur einem aktiven Owner.

ALTER TABLE suspensions DROP CONSTRAINT IF EXISTS suspensions_check;
ALTER TABLE mod_approvals DROP CONSTRAINT IF EXISTS mod_approvals_check;
ALTER TABLE authority_reports DROP CONSTRAINT IF EXISTS authority_reports_check;

CREATE FUNCTION enforce_second_person() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  approver  uuid;
  requester uuid;
BEGIN
  IF TG_TABLE_NAME = 'authority_reports' THEN
    approver := NEW.countersigned_by;
    requester := NEW.drafted_by;
  ELSE
    approver := NEW.approved_by;
    requester := NEW.requested_by;
  END IF;
  IF approver IS NOT NULL AND approver = requester
     AND NOT EXISTS (SELECT 1 FROM staff WHERE id = requester AND founder AND disabled_at IS NULL) THEN
    RAISE EXCEPTION 'Vier-Augen-Prinzip (%): nur ein Owner darf ohne zweite Person freigeben', TG_TABLE_NAME;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER suspensions_second_person BEFORE INSERT OR UPDATE ON suspensions
  FOR EACH ROW EXECUTE FUNCTION enforce_second_person();
CREATE TRIGGER mod_approvals_second_person BEFORE INSERT OR UPDATE ON mod_approvals
  FOR EACH ROW EXECUTE FUNCTION enforce_second_person();
CREATE TRIGGER authority_reports_second_person BEFORE INSERT OR UPDATE ON authority_reports
  FOR EACH ROW EXECUTE FUNCTION enforce_second_person();
