#!/usr/bin/env bash
# Wiederherstellung aus einer Sicherung von deploy/backup.sh.
#   bash deploy/restore.sh backups/db-20261001-031700.dump.enc backups/media-20261001-031700.tar.gz.enc
# ACHTUNG: überschreibt die Datenbank und die Mediendateien.
set -euo pipefail
cd "$(dirname "$0")/.."
# nur die benötigte Angabe aus .env lesen (die Datei ist kein Shell-Skript)
BACKUP_PASSPHRASE="${BACKUP_PASSPHRASE:-$(grep -E '^BACKUP_PASSPHRASE=' .env | cut -d= -f2-)}"
export BACKUP_PASSPHRASE
DB_FILE="${1:?Datenbanksicherung angeben}"
MEDIA_FILE="${2:-}"
read -r -p "Datenbank und Medien werden überschrieben. Weiter? (ja) " ok
[[ "$ok" == "ja" ]] || exit 1
docker compose stop api
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass env:BACKUP_PASSPHRASE -in "$DB_FILE" \
  | docker compose exec -T db pg_restore -U cruizy -d cruizy --clean --if-exists --no-owner
if [[ -n "$MEDIA_FILE" ]]; then
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass env:BACKUP_PASSPHRASE -in "$MEDIA_FILE" \
    | docker run --rm -i -v cruizy_media-data:/data alpine sh -c 'rm -rf /data/* && tar -C /data -xzf -'
fi
docker compose start api
echo "Wiederhergestellt."
