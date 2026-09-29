#!/usr/bin/env bash
# Verschlüsselte Sicherung: Datenbank (pg_dump) und Mediendateien. Aufbewahrung 14 Tage.
# Die Dateien sind mit BACKUP_PASSPHRASE verschlüsselt; die Inhalte sind zusätzlich mit
# MASTER_KEY verschlüsselt. Beides getrennt vom Server aufbewahren.
#   bash deploy/backup.sh            → ./backups/
#   BACKUP_DIR=/mnt/box bash deploy/backup.sh
set -euo pipefail
cd "$(dirname "$0")/.."
# nur die benötigte Angabe aus .env lesen (die Datei ist kein Shell-Skript)
BACKUP_PASSPHRASE="${BACKUP_PASSPHRASE:-$(grep -E '^BACKUP_PASSPHRASE=' .env | cut -d= -f2-)}"
export BACKUP_PASSPHRASE
: "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE fehlt in .env}"
DIR="${BACKUP_DIR:-$(pwd)/backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DIR"
chmod 700 "$DIR"

docker compose exec -T db pg_dump -U cruizy -d cruizy -Fc \
  | openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass env:BACKUP_PASSPHRASE \
  > "$DIR/db-$STAMP.dump.enc"

docker run --rm -v cruizy_media-data:/data:ro alpine tar -C /data -czf - . \
  | openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass env:BACKUP_PASSPHRASE \
  > "$DIR/media-$STAMP.tar.gz.enc"

find "$DIR" -name 'db-*.dump.enc' -mtime +14 -delete
find "$DIR" -name 'media-*.tar.gz.enc' -mtime +14 -delete
echo "Sicherung fertig: $DIR/*-$STAMP.*"
