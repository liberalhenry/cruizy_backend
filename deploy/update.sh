#!/usr/bin/env bash
# Aktualisieren: neuen Stand holen, sichern, neu bauen, starten. Migrationen laufen beim Start.
set -euo pipefail
cd "$(dirname "$0")/.."
git pull --ff-only
bash deploy/backup.sh
docker compose up -d --build
docker image prune -f
docker compose ps
