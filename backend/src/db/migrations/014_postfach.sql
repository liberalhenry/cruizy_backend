-- Postfach im Werkzeug — nur additiv.
-- Jede Meldung, jeder Widerspruch und jede Rückmeldung mit Antwortwunsch bekommt ein Ticket; darüber
-- schreibt das Team mit der Person. Tickets gehören einem Team; die erste Antwort ist innerhalb von
-- P-TICKET-FRIST (24 h) fällig, danach 24 h ab der letzten Nachricht der Person.

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS team text NOT NULL DEFAULT 'support';
ALTER TABLE tickets ADD CONSTRAINT tickets_team_check CHECK (team IN ('support','moderation','technik','datenschutz','abrechnung'));
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'anfrage';
ALTER TABLE tickets ADD CONSTRAINT tickets_kind_check CHECK (kind IN ('anfrage','meldung','widerspruch','rueckmeldung'));
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS report_id uuid REFERENCES reports(id) ON DELETE SET NULL;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS appeal_id uuid REFERENCES appeals(id) ON DELETE SET NULL;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS feedback_id uuid REFERENCES feedback(id) ON DELETE SET NULL;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS first_response_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS tickets_report ON tickets (report_id) WHERE report_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS tickets_appeal ON tickets (appeal_id) WHERE appeal_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS tickets_feedback ON tickets (feedback_id) WHERE feedback_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS tickets_team_status ON tickets (team, status, deadline_at);

-- bestehende Anfragen: Team nach Kategorie, erste Antwort aus dem Verlauf
UPDATE tickets SET team = CASE category
    WHEN 1 THEN 'moderation' WHEN 2 THEN 'moderation' WHEN 4 THEN 'abrechnung' WHEN 5 THEN 'technik'
    WHEN 6 THEN 'datenschutz' WHEN 8 THEN 'moderation' WHEN 9 THEN 'datenschutz' ELSE 'support' END;
UPDATE tickets t SET first_response_at = (SELECT min(m.created_at) FROM ticket_messages m WHERE m.ticket_id = t.id AND m.author = 'team');

-- Verlauf: interne Notizen des Teams und Systemeinträge (Weitergabe an ein anderes Team)
ALTER TABLE ticket_messages DROP CONSTRAINT IF EXISTS ticket_messages_author_check;
ALTER TABLE ticket_messages ADD CONSTRAINT ticket_messages_author_check CHECK (author IN ('person','team','system'));
ALTER TABLE ticket_messages ADD COLUMN IF NOT EXISTS internal boolean NOT NULL DEFAULT false;

-- Teams, denen eine Person im Werkzeug angehört (Filter „Meine Teams“ im Postfach)
ALTER TABLE staff ADD COLUMN IF NOT EXISTS teams text[] NOT NULL DEFAULT '{}';

-- Sperre aus einem Ticket heraus (Bezug: Fallnummer H-…), z. B. bei Anfragen ohne Meldung
ALTER TABLE suspensions ADD COLUMN IF NOT EXISTS ticket_id uuid REFERENCES tickets(id) ON DELETE SET NULL;

-- Reihenfolge im Verlauf auch innerhalb einer Transaktion (Weitergabe + Notiz)
ALTER TABLE ticket_messages ALTER COLUMN created_at SET DEFAULT clock_timestamp();
