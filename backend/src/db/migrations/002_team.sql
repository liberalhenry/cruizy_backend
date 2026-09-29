-- Issue #8: Teamverwaltung im Werkzeug.
-- Ein gelöschter Zugang mit Protokolleinträgen bleibt als Zeile bestehen (das Zugriffsprotokoll
-- verweist auf ihn und ist unveränderlich) — gesperrt, ohne Anmeldedaten, Kennung freigegeben.
ALTER TABLE staff ADD COLUMN deleted_at timestamptz;
ALTER TABLE staff ADD COLUMN password_changed_at timestamptz;
