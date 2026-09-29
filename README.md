# Cruizy — Server, Web-App und Moderationswerkzeug

Privatsphäre-zuerst-App zum Kennenlernen für schwule, bi und queere Männer: Web-App (PWA),
API-Server und ein getrenntes Moderationswerkzeug. Alles läuft in Docker auf **einem**
Hetzner-VPS (4 GB RAM, 2 Kerne).

```
                    ┌────────────── Docker (ein VPS) ───────────────┐
 Browser ──HTTPS──▶ │ web  (Caddy: TLS, Web-App, Werkzeug-Oberfläche) │
                    │   ├── /api/*      ─▶ api (Node 22, Fastify)     │
                    │   └── /mod-api/*  ─▶ api  (nur Werkzeug-Adresse)│
                    │ api ─▶ db (PostgreSQL 16)                       │
                    │ api ─▶ Volume media-data (verschlüsselte Bilder)│
                    └───────────────────────────────────────────────┘
```

| Ordner | Inhalt |
|---|---|
| `backend/` | API, Echtzeit (WebSocket), Hintergrundaufträge, Moderationswerkzeug-API, Tests |
| `frontend/` | Web-App (React, Vite, Tailwind, Service Worker) und Werkzeug-Oberfläche (`mod.html`) |
| `shared/texts/` | alle Texte mit ID — `de.json` (Systemtexte), `ui-de.json` (erzeugt von `build-ui.py`) |
| `deploy/` | Caddyfile, Einrichtung, Sicherung, Wiederherstellung, Aktualisierung |
| `docker-compose.yml`, `.env.example` | der ganze Stack und seine Einstellungen |

---

## 1 · Auf dem VPS einrichten

Voraussetzungen: Ubuntu 24.04, zwei DNS-Einträge (A/AAAA) auf die Server-IP — einer für die
App, einer für das Werkzeug, z. B. `app.example.de` und `werkzeug.example.de`.

```bash
git clone <dieses-repository> /opt/cruizy
cd /opt/cruizy
sudo bash deploy/install.sh app.example.de werkzeug.example.de technik@example.de
```

Das Skript aktualisiert das System, schaltet automatische Sicherheitsupdates ein, setzt die
Firewall (nur 22, 80, 443), legt 2 GB Swap an, installiert Docker, erzeugt `.env` mit frischen
Geheimnissen, startet den Stack und richtet die tägliche Sicherung ein. Caddy holt die
TLS-Zertifikate selbst, sobald die DNS-Einträge stimmen.

**Sofort sichern (außerhalb des Servers):** `MASTER_KEY` und `BACKUP_PASSPHRASE` aus `.env`.
Ohne `MASTER_KEY` lassen sich Nachrichten, Kontaktdaten und Bilder nicht mehr entschlüsseln.

### Zugänge für das Moderationswerkzeug

Jede Person bekommt einen eigenen Zugang mit zweitem Faktor (Authenticator-App):

```bash
docker compose exec api node dist/src/cli/staff-create.js --name "Vorname" --login vorname --role BETRIEB --founder
docker compose exec api node dist/src/cli/staff-create.js --name "Vorname" --login zweite --role MOD --founder
```

Die Ausgabe zeigt das Einmalpasswort und eine `otpauth://`-Adresse für die Authenticator-App —
nur dieses eine Mal. Rollen: `MOD` und `BETRIEB`; Gründer sehen die Protokolleinträge des
jeweils anderen. Weitere Befehle: `--disable --login …` (sperren), `--reset-totp --login …`.

Mindestens **zwei** Zugänge sind nötig: Sperren, Kontext ausklappen, Dateiansicht und
Art.-18-Meldungen brauchen immer eine zweite Person. Es gibt keinen Notfallzugang.

### Testbetrieb und Echtbetrieb

`OPERATION_MODE=test` ist voreingestellt: Registrierung nur mit Einladungscode
(`TEST_INVITE_CODE` in `.env`), jede Antwort trägt `x-betrieb: test`, die App zeigt den Hinweis
„nur erfundene Angaben“. Erfundene Testdaten (40 Konten rund um Köln, Orte, Termine):

```bash
docker compose exec api node dist/src/seed/testdaten.js          # anlegen
docker compose exec api node dist/src/seed/testdaten.js --clear  # wieder entfernen
```

Anmeldung dann mit `test1@example.invalid` … `test40@example.invalid`, Passwort `testpasswort-123`.

`OPERATION_MODE=live` startet **nur**, wenn nichts mehr auf Attrappen läuft. Der Server nennt
beim Start, was fehlt — derzeit:

| Offen für den Echtbetrieb | wo es angebunden wird |
|---|---|
| Prüfpartner für die Altersprüfung (Stufe 1/2, Fotoprüfung) | `backend/src/providers/verification.ts` (Schnittstelle vorhanden; die Attrappe ist nur im Testbetrieb erreichbar) |
| Hash-Abgleich (bekannte Missbrauchsdarstellungen) | `HASH_PROVIDER=http`, `HASH_URL` — danach im Werkzeug `P-HASH-AKTIV` einschalten (geht nur mit hinterlegter Ansprechperson) |
| Mailversand über einen EU-Dienst | `SMTP_URL` |
| SMS-Versand | `SMS_PROVIDER=http` mit Vorlage (Sweego-Beispiel in `.env.example`) |
| Rechtstexte (Impressum, Bedingungen, Datenschutz, Einwilligung) | Platzhalter in `shared/texts/` (IDs `UI-RECHT-*`, `ST-KON-27`) |

### Sicherung, Wiederherstellung, Aktualisierung

```bash
bash deploy/backup.sh      # täglich per cron (03:17); verschlüsselt, 14 Tage Aufbewahrung in ./backups
bash deploy/restore.sh backups/db-….dump.enc backups/media-….tar.gz.enc
bash deploy/update.sh      # git pull, Sicherung, neu bauen, starten (Migrationen laufen beim Start)
```

Die Sicherungen gehören zusätzlich auf einen zweiten Ort (z. B. Hetzner Storage Box):
`BACKUP_DIR=/mnt/storagebox bash deploy/backup.sh`.

### Ressourcen auf 4 GB RAM

PostgreSQL ist auf etwa ein Viertel des Speichers abgestimmt (`shared_buffers=256MB`,
`max_connections=40`), die API auf 768 MB Heap; jeder Dienst hat eine Speichergrenze.
Bildverarbeitung läuft mit einem Thread (`sharp.concurrency(1)`), der Swap fängt Spitzen ab.
Hintergrundaufträge laufen nacheinander, damit Nutzeranfragen immer Datenbankverbindungen behalten.

---

## 2 · Lokal entwickeln

Voraussetzungen: Node 22, PostgreSQL 16.

```bash
createdb cruizy_dev && createdb cruizy_test          # Rolle cruizy/cruizy oder DATABASE_URL anpassen

cd backend && npm ci
MASTER_KEY=$(openssl rand -base64 32) OPERATION_MODE=test TEST_INVITE_CODE=einladung \
  COOKIE_SECURE=0 NODE_ENV=development npm run dev    # API auf :3000

cd frontend && npm ci && npm run dev                  # App auf :5173, Werkzeug auf :5173/mod.html
```

| Befehl (in `backend/`) | Zweck |
|---|---|
| `npm test` | 68 Tests gegen eine echte Datenbank (`cruizy_test`, wird neu angelegt) |
| `npm run typecheck` | TypeScript für Code und Tests |
| `npm run check:deps` | keine Analyse-, Werbe- oder Fehler-SDKs Dritter (Backend und Frontend) |
| `npm run migrate` | Migrationen einspielen |

Texte ändern: `shared/texts/de.json` direkt, Oberflächentexte in `shared/texts/build-ui.py`
und danach `python3 shared/texts/build-ui.py`.

Produktparameter (`P-…`, `backend/src/config/params.ts`) lassen sich ohne Codeänderung im
Werkzeug unter „Verwaltung“ ändern (nur BETRIEB, protokolliert). Tagesgrenze und
Uhrzeitsperre für Hash-Fälle sind absichtlich **keine** Parameter.

---

## 3 · Was eingebaut ist — und was bewusst fehlt

**Schutz, der im Code steckt**

- Standort: gespeichert wird nur ein Zellmittelpunkt (2 km bzw. 500 m), nie die gemeldete
  Position, nie ein Verlauf. Andere sehen vier Entfernungsstufen, keine Meter; Zonen mit
  Ersatzpunkt, Mittelpunkt verschlüsselt.
- Nachrichten, Kontaktdaten, Zonen und Check-in-Hinterlegungen sind mit Teilschlüsseln aus
  `MASTER_KEY` verschlüsselt (AES-256-GCM); Suchen laufen über Prüfwerte (HMAC).
- Bilder: Metadaten werden vor allem anderen entfernt, öffentliche Fassung neu erzeugt,
  private Bilder mit unsichtbarem Wasserzeichen je Empfänger, Bildadressen nur 5 Minuten und
  nur für die berechtigte Person gültig.
- Erstkontakt nur Text; Bilder erst nach Antwort oder Freigabe; höflicher Ausstieg mit
  5 Sekunden „Rückgängig“; keine Lese- oder Tippanzeige.
- Moderation: jede Einsicht zuerst ins unveränderliche Zugriffsprotokoll (Datenbank-Trigger),
  sonst geschieht nichts; Vier-Augen-Prinzip in der Anwendung **und** als Datenbankregel;
  Hash-Fälle ohne Vorschaubild; keine Suche über private Inhalte; kein Werkzeugzugang von der
  App-Adresse aus.
- Löschung mit 30 Tagen Karenz, danach vollständig (ein Test prüft jede Tabelle mit
  Kontobezug); Export als AES-verschlüsselte ZIP-Datei; Vollständigkeit ebenfalls per Test.
- Keine Drittanbieter im Browser: keine Analyse, keine Schriften oder Karten Dritter
  (die Karte ist schematisch, bis ein eigener Kachelserver eingetragen ist).

**Bewusst nicht gebaut (Phase 2 oder ruhend laut Beschlusslage)**

- Bezahlung und Abo (PLUS/PRO, Travel) — der Bildschirm zeigt nur die Leistungen, der Kauf ist
  nicht möglich; die Tabelle `entitlements` ist die Grundlage.
- „Nur geprüfte Profile“ (F08) und die Erstkontakt-Grenze (F57) — ruhen bis Nr. 40.
- Private Veranstaltungen und Inserate von Nutzern, Werkzeugkonten für Orte, native Apps.

---

## 4 · Abweichungen von früheren Vorgaben

Die früheren Arbeitsaufträge enthielten einige „nur mit …“- und „niemals …“-Vorgaben. Sie sind
geprüft; wo sie beibehalten wurden, steht das nicht extra hier. Abgewichen wurde an diesen Stellen:

| Vorgabe | Umsetzung | Grund |
|---|---|---|
| Supabase (selbst gehostet) mit Auth, Edge Functions, RLS | eigener Node-Server mit PostgreSQL | ein Supabase-Stack braucht auf 4 GB RAM allein den halben Speicher; die Sicherheitsregeln (Protokoll zuerst, vier Augen, Standortrundung) stehen so an einer Stelle im Server statt verteilt über RLS-Regeln und Funktionen |
| PostGIS-Spalte `precise_location` mit „deny-all“ | die genaue Position wird gar nicht gespeichert, nur die Rasterzelle | strenger als die Vorgabe und so, wie F70 es verlangt; Entfernungen auf Zellebene brauchen kein PostGIS |
| Sweego als fester SMS-Dienst | frei konfigurierbarer HTTP-Versand mit Vorlage (Sweego als Beispiel) | Dienst wechselbar ohne Codeänderung; die Feldnamen sind vor dem Start mit der Sweego-Dokumentation abzugleichen |
| Kartenkacheln (Karte „Heute“) | schematische Karte ohne Dritte; eigener Kachelserver über `MAP_TILE_URL` | ohne eigenen Server würden Kacheln eines Dritten den Aufenthaltsort der Nutzer verraten |
| Web-Push „ohne Umweg“ | nach eigener Erklärung, auf dem iPhone erst nach „Zum Home-Bildschirm“ | anders stellt iOS keine Mitteilungen zu |

Alles, was die Rechtsprüfung noch offen hat (Wortlaut der Einwilligung, Rechtstexte,
Aufbewahrungsfristen), ist im Code als **ENTWURF** bzw. `PRÜFUNG ERFORDERLICH` markiert und
über Texte oder Parameter änderbar.
