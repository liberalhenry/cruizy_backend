#!/usr/bin/env bash
# Einrichtung eines frischen Hetzner-VPS (Ubuntu 24.04, 4 GB RAM, 2 Kerne).
#
#   git clone <repo> /opt/cruizy && cd /opt/cruizy
#   sudo bash deploy/install.sh app.example.de werkzeug.example.de technik@example.de
#
# Was passiert: Systemupdates und automatische Sicherheitsupdates, Firewall (nur 22, 80, 443),
# Swap (2 GB), Docker, .env mit frisch erzeugten Geheimnissen, Start des Stacks.
set -euo pipefail

APP_DOMAIN="${1:-}"
MOD_DOMAIN="${2:-}"
ACME="${3:-}"
if [[ -z "$APP_DOMAIN" || -z "$MOD_DOMAIN" ]]; then
  echo "Aufruf: sudo bash deploy/install.sh <app-domain> <werkzeug-domain> [acme-email]" >&2
  exit 1
fi
if [[ $EUID -ne 0 ]]; then echo "Bitte mit sudo ausführen." >&2; exit 1; fi
cd "$(dirname "$0")/.."

echo "› Systemupdates"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y ca-certificates curl gnupg ufw unattended-upgrades fail2ban openssl
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "› Firewall"
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

echo "› Swap (hilft der Bildverarbeitung bei 4 GB RAM)"
if ! swapon --show | grep -q '/swapfile'; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl -w vm.swappiness=10
  echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf
fi

echo "› Docker"
if ! command -v docker >/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
# Container-Protokolle begrenzen
mkdir -p /etc/docker
[[ -f /etc/docker/daemon.json ]] || echo '{"log-driver":"local","log-opts":{"max-size":"10m","max-file":"3"}}' > /etc/docker/daemon.json
systemctl enable --now docker
systemctl restart docker

echo "› .env"
if [[ ! -f .env ]]; then
  cp .env.example .env
  set_var() { sed -i "s|^$1=.*|$1=$2|" .env; }
  set_var APP_ADDRESS "$APP_DOMAIN"
  set_var MOD_ADDRESS "$MOD_DOMAIN"
  set_var APP_URL "https://$APP_DOMAIN"
  set_var MOD_URL "https://$MOD_DOMAIN"
  [[ -n "$ACME" ]] && set_var ACME_EMAIL "$ACME"
  set_var POSTGRES_PASSWORD "$(openssl rand -hex 24)"
  set_var MASTER_KEY "$(openssl rand -base64 32)"
  set_var TEST_INVITE_CODE "$(openssl rand -hex 6)"
  set_var AGE_WEBHOOK_SECRET "$(openssl rand -hex 32)"
  set_var INBOUND_MAIL_SECRET "$(openssl rand -hex 32)"
  set_var BACKUP_PASSPHRASE "$(openssl rand -base64 24)"
  chmod 600 .env
  echo "  .env angelegt. MASTER_KEY und BACKUP_PASSPHRASE jetzt an einem sicheren Ort AUSSERHALB des Servers notieren!"
fi

echo "› Start"
docker compose up -d --build
docker compose ps

echo "› Tägliche Sicherung um 03:17"
CRON="17 3 * * * cd $(pwd) && bash deploy/backup.sh >> /var/log/cruizy-backup.log 2>&1"
( crontab -l 2>/dev/null | grep -v 'deploy/backup.sh' ; echo "$CRON" ) | crontab -

cat <<INFO

Fertig. Nächste Schritte:
  1. DNS: $APP_DOMAIN und $MOD_DOMAIN müssen auf diesen Server zeigen (Caddy holt dann die Zertifikate).
  2. Erste Zugänge für das Moderationswerkzeug (zwei Personen, zweiter Faktor per Authenticator-App):
       docker compose exec api node dist/src/cli/staff-create.js --name "Vorname" --login vorname --role BETRIEB --founder
  3. Testbetrieb: Einladungscode steht in .env (TEST_INVITE_CODE). Erfundene Testdaten:
       docker compose exec api node dist/src/seed/testdaten.js
  4. Werkzeug: https://$MOD_DOMAIN  ·  App: https://$APP_DOMAIN
INFO
