#!/usr/bin/env bash
# Aktualisiert auf ein Release (Git-Tag vX.Y.Z) — mit Sicherung, Gesundheitsprüfung und Rückfall.
# Läuft im Dienst „updater“ (Knopf im Werkzeug) oder von Hand über deploy/update.sh.
#
#   bash deploy/update-run.sh 1.2.3
#
# Ablauf: Release holen → sichern → auschecken → bauen → starten → prüfen (gesund UND neue
# Version). Scheitert ein Schritt nach dem Auschecken, geht es zurück auf den Stand davor.
# Datenbank-Migrationen sind nur additiv — der alte Stand läuft mit dem neueren Schema weiter;
# die Sicherung von vorher liegt in ./backups (deploy/restore.sh).
#
# Rückgabe: 0 aktualisiert · 3 abgebrochen, nichts geändert · 10 fehlgeschlagen, zurückgefallen
#           20 fehlgeschlagen UND Rückfall fehlgeschlagen (Handarbeit nötig)
set -uo pipefail

VERSION="${1:-}"
SEMVER='^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$'
if [[ ! "$VERSION" =~ $SEMVER ]]; then echo "Ungültige Version: '$VERSION'"; exit 3; fi
TAG="v$VERSION"
cd "${REPO_DIR:-$(dirname "$0")/..}" || exit 3
git config --global --add safe.directory "$(pwd)" >/dev/null 2>&1 || true

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"; }
step() { echo; log "── $* ──"; }

PREV_COMMIT="$(git rev-parse HEAD)"
PREV_VERSION="$(cat VERSION 2>/dev/null || echo unbekannt)"
log "Stand vorher: $PREV_VERSION (${PREV_COMMIT:0:12})"
log "Ziel: $TAG"

# ───── 1. Release holen (ohne Token in der Adresse — er stünde sonst im Protokoll) ─────
step "Release holen"
GIT_AUTH=()
if [[ -n "${GITHUB_TOKEN:-}" ]]; then
  B64="$(printf 'x-access-token:%s' "$GITHUB_TOKEN" | base64 | tr -d '\n')"
  GIT_AUTH=(-c "http.https://github.com/.extraheader=AUTHORIZATION: basic $B64")
fi
SOURCE=origin
[[ -n "${UPDATE_REPO:-}" ]] && SOURCE="https://github.com/${UPDATE_REPO}.git"
if ! git "${GIT_AUTH[@]}" fetch --force --no-tags "$SOURCE" "refs/tags/$TAG:refs/tags/$TAG"; then
  log "Release $TAG nicht abrufbar — nichts geändert."
  exit 3
fi
TAG_VERSION="$(git show "$TAG:VERSION" 2>/dev/null | tr -d '[:space:]')"
if [[ "$TAG_VERSION" != "$VERSION" ]]; then
  log "Die Datei VERSION im Release sagt '$TAG_VERSION', erwartet '$VERSION' — nichts geändert."
  exit 3
fi

# ───── 2. Sicherung ─────
step "Sicherung"
if ! bash deploy/backup.sh; then
  log "Sicherung fehlgeschlagen — ohne Sicherung keine Aktualisierung. Nichts geändert."
  exit 3
fi

# ───── Hilfen ─────
build_and_start() {
  docker compose build api web && docker compose up -d --no-deps db api web
}

# gesund = Docker-Gesundheitsprüfung der API „healthy“, Oberfläche läuft, erwartete Version
wait_healthy() {
  local expect="$1" cid status v
  for _ in $(seq 1 60); do
    sleep 5
    cid="$(docker compose ps -q api 2>/dev/null)"
    [[ -z "$cid" ]] && continue
    status="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$cid" 2>/dev/null)"
    [[ "$status" == "unhealthy" ]] && { log "API meldet unhealthy."; docker compose logs --tail 40 api; return 1; }
    [[ "$status" != "healthy" ]] && continue
    [[ -z "$(docker compose ps -q --status running web 2>/dev/null)" ]] && continue
    if [[ -n "$expect" ]]; then
      v="$(docker compose exec -T api cat /app/VERSION 2>/dev/null | tr -d '[:space:]')"
      [[ "$v" != "$expect" ]] && { log "Laufende Version '$v', erwartet '$expect'."; return 1; }
    fi
    log "Gesund${expect:+ — Version $expect}."
    return 0
  done
  log "Zeitüberschreitung: API nach 5 Minuten nicht gesund."
  docker compose logs --tail 60 api
  return 1
}

rollback() {
  step "RÜCKFALL auf $PREV_VERSION (${PREV_COMMIT:0:12})"
  git -c advice.detachedHead=false checkout --force "$PREV_COMMIT" || return 1
  build_and_start || return 1
  wait_healthy ""
}

# ───── 3. Auschecken, bauen, starten, prüfen ─────
step "Auschecken $TAG"
if ! git -c advice.detachedHead=false checkout --force "$TAG"; then
  log "Auschecken fehlgeschlagen — nichts geändert."
  exit 3
fi

step "Bauen und starten"
if build_and_start && wait_healthy "$VERSION"; then
  step "Aufräumen"
  docker image prune -f >/dev/null 2>&1 || true
  mkdir -p deploy/logs
  echo "$VERSION $(git rev-parse HEAD) $(date -u +%Y-%m-%dT%H:%M:%SZ)" > deploy/logs/stabil
  log "Aktualisiert: $PREV_VERSION → $VERSION"
  exit 0
fi

log "Aktualisierung auf $VERSION fehlgeschlagen."
if rollback; then
  log "Zurück auf $PREV_VERSION — der Betrieb läuft weiter."
  exit 10
fi
log "RÜCKFALL FEHLGESCHLAGEN — bitte von Hand eingreifen: docker compose ps, docker compose logs api."
exit 20
