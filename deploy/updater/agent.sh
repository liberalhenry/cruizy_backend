#!/usr/bin/env bash
# Dienst „updater“ (Issue #5): holt Aufträge aus update_runs ab und führt sie mit
# deploy/update-run.sh aus. Einziger Dienst mit Zugriff auf Docker; kein offener Port.
# Die API legt nur Aufträge an — mit einer Versionsnummer, die hier noch einmal geprüft wird.
set -uo pipefail
: "${DATABASE_URL:?DATABASE_URL fehlt}"
REPO_DIR="${REPO_DIR:-/repo}"
cd "$REPO_DIR" || exit 1
git config --global --add safe.directory "$REPO_DIR" >/dev/null 2>&1 || true
mkdir -p deploy/logs
SEMVER='^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$'

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"; }
# SQL über stdin, damit psql-Variablen (:'name') sicher eingesetzt werden
sql() { psql "$DATABASE_URL" -X -q -A -t -v ON_ERROR_STOP=1 "$@"; }

heartbeat() {
  sql -v v="$(cat VERSION 2>/dev/null)" -v c="$(git rev-parse --short=12 HEAD 2>/dev/null)" >/dev/null 2>&1 <<'SQL' || true
INSERT INTO update_agent (id, last_seen_at, version, git_commit) VALUES (true, now(), :'v', :'c')
ON CONFLICT (id) DO UPDATE SET last_seen_at = now(), version = EXCLUDED.version, git_commit = EXCLUDED.git_commit;
SQL
}

push_log() {
  local id="$1" file="$2"
  sql -v id="$id" -v log="$(tail -c 60000 "$file")" >/dev/null 2>&1 <<'SQL' || true
UPDATE update_runs SET log = :'log' WHERE id = :'id';
SQL
}

discord() {
  local url="${DISCORD_WEBHOOK_SYSTEM:-${DISCORD_WEBHOOK_DEFAULT:-}}" color="$2"
  [[ -z "$url" ]] && return 0
  jq -n --arg t "$1" --argjson c "$color" --arg d "${3:-}" \
    '{username:"Cruizy", allowed_mentions:{parse:[]}, embeds:[{title:$t, description:$d, color:$c, footer:{text:"System · updater"}}]}' |
    curl -fsS -m 10 -H 'content-type: application/json' -d @- "$url" >/dev/null 2>&1 || true
}

run_update() {
  local id="$1" version="$2" file="deploy/logs/update-$1.log" rc status err
  if [[ ! "$version" =~ $SEMVER ]]; then
    sql -v id="$id" >/dev/null <<'SQL'
UPDATE update_runs SET status = 'fehlgeschlagen', finished_at = now(), error = 'ungültige Versionsnummer' WHERE id = :'id';
SQL
    return
  fi
  log "Auftrag $id: Aktualisierung auf $version"
  discord "Aktualisierung auf $version gestartet" 5942015
  # Das Skript ändert sich beim Auschecken — eine Kopie ausführen
  cp deploy/update-run.sh /tmp/update-run.sh
  REPO_DIR="$REPO_DIR" bash /tmp/update-run.sh "$version" >"$file" 2>&1 &
  local pid=$!
  while kill -0 "$pid" 2>/dev/null; do
    push_log "$id" "$file"
    heartbeat
    sleep 5
  done
  wait "$pid"
  rc=$?
  case "$rc" in
    0) status=erfolgreich ;;
    10) status=zurueckgerollt ;;
    20) status=rueckfall_fehlgeschlagen ;;
    *) status=fehlgeschlagen ;;
  esac
  err=""
  if [[ "$rc" != 0 ]]; then
    # Ursache zuerst (die ersten Zeilen ab dem ersten Fehler), dann das Ende des Laufs
    err="$(grep -m1 -A 12 -E 'unhealthy|Zeitüberschreitung|Laufende Version|nicht abrufbar|fehlgeschlagen|Ungültige Version|VERSION im Release' "$file")"
    err="${err}"$'\n…\n'"$(grep -v '^\s*$' "$file" | tail -n 3)"
  fi
  # Die Datenbank kann während des Neustarts kurz weg sein — bis zu 5 Minuten nachfassen
  for _ in $(seq 1 60); do
    if sql -v id="$id" -v st="$status" -v log="$(tail -c 60000 "$file")" -v err="$err" -v c="$(git rev-parse HEAD)" >/dev/null 2>&1 <<'SQL'
UPDATE update_runs SET status = :'st', finished_at = now(), log = :'log', error = NULLIF(:'err', ''),
       stable_commit = CASE WHEN :'st' = 'erfolgreich' THEN :'c' ELSE stable_commit END
 WHERE id = :'id';
SQL
    then break; fi
    sleep 5
  done
  log "Auftrag $id: $status (Rückgabe $rc) — Protokoll: $file"
  case "$status" in
    erfolgreich) discord "Aktualisiert auf $version" 6279332 ;;
    zurueckgerollt) discord "Aktualisierung auf $version fehlgeschlagen — zurück auf den letzten stabilen Stand" 15774761 "$(echo "$err" | tail -n 8)" ;;
    *) discord "Aktualisierung auf $version: $status — bitte prüfen" 16739179 "$(echo "$err" | tail -n 8)" ;;
  esac
  # neuen Stand des Updaters selbst übernehmen
  exec bash -c "cp '$REPO_DIR/deploy/updater/agent.sh' /tmp/agent.sh && exec bash /tmp/agent.sh"
}

log "Updater bereit ($(cat VERSION 2>/dev/null || echo '?'))."
# Ein Lauf, der beim Neustart des Updaters noch „läuft“, ist abgerissen
sql >/dev/null 2>&1 <<'SQL' || true
UPDATE update_runs SET status = 'fehlgeschlagen', finished_at = now(), error = 'Updater wurde während des Laufs neu gestartet — Stand bitte prüfen'
 WHERE status = 'laeuft';
SQL
while true; do
  heartbeat
  job="$(sql 2>/dev/null <<'SQL'
UPDATE update_runs SET status = 'laeuft', started_at = now()
 WHERE id = (SELECT id FROM update_runs WHERE status = 'angefordert' ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED)
RETURNING id || ' ' || target_version;
SQL
)"
  if [[ -n "$job" ]]; then run_update ${job}; fi
  sleep 10
done
