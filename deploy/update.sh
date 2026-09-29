#!/usr/bin/env bash
# Aktualisieren von Hand auf ein Release — derselbe Ablauf wie der Knopf im Werkzeug
# (Sicherung, Gesundheitsprüfung, Rückfall bei Fehler).
#   bash deploy/update.sh          → neuestes Release (höchster Tag vX.Y.Z)
#   bash deploy/update.sh 1.2.3    → bestimmte Version
set -euo pipefail
cd "$(dirname "$0")/.."
VERSION="${1:-}"
if [[ -z "$VERSION" ]]; then
  git fetch --tags --force origin
  VERSION="$(git tag -l 'v*' --sort=-v:refname | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | head -1 | sed 's/^v//')"
  [[ -n "$VERSION" ]] || { echo "Kein Release gefunden."; exit 1; }
fi
cp deploy/update-run.sh /tmp/cruizy-update-run.sh   # das Skript ändert sich beim Auschecken
exec bash /tmp/cruizy-update-run.sh "$VERSION"
