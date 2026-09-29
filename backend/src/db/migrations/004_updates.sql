-- Issue #5: Aktualisierung per Knopf im Werkzeug.
-- Die API legt nur einen Auftrag an; ausgeführt wird er vom Dienst „updater“ (deploy/updater),
-- der als einziger Zugriff auf Docker hat. Jeder Lauf mit Protokoll, Fehler und Rückfall.
CREATE TABLE update_runs (
  id              bigserial PRIMARY KEY,
  target_version  text NOT NULL CHECK (target_version ~ '^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$'),
  from_version    text NOT NULL,
  requested_by    uuid NOT NULL REFERENCES staff(id),
  requested_at    timestamptz NOT NULL DEFAULT now(),
  status          text NOT NULL DEFAULT 'angefordert'
                  CHECK (status IN ('angefordert','laeuft','erfolgreich','fehlgeschlagen','zurueckgerollt','rueckfall_fehlgeschlagen','abgebrochen')),
  started_at      timestamptz,
  finished_at     timestamptz,
  stable_commit   text,
  log             text NOT NULL DEFAULT '',
  error           text
);
-- höchstens ein offener Auftrag
CREATE UNIQUE INDEX update_runs_one_open ON update_runs ((true)) WHERE status IN ('angefordert','laeuft');

-- Lebenszeichen des Updaters (eine Zeile)
CREATE TABLE update_agent (
  id            boolean PRIMARY KEY DEFAULT true CHECK (id),
  last_seen_at  timestamptz NOT NULL,
  version       text,
  git_commit    text
);
