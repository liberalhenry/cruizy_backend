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
nur dieses eine Mal. Rollen: `MOD` und `BETRIEB`; Gründer (**Owner**) sehen die Protokolleinträge
des jeweils anderen. Weitere Befehle: `--disable --login …` (sperren), `--reset-totp --login …`.

**Teamverwaltung im Werkzeug:** Den ersten Owner legt der Befehl oben an; danach verwalten Owner
das Team unter **„Team“** — Zugänge anlegen (Einmalpasswort und QR-Code für die Authenticator-App),
Name, Rolle und Owner-Status ändern, sperren, neues Passwort oder neuen zweiten Faktor ausstellen,
löschen. Jede Änderung braucht eine Begründung und steht im Zugriffsprotokoll; es bleibt immer
mindestens ein aktiver Owner. Unter **„Mein Zugang“** ändert jede Person ihr eigenes Passwort.

**Vier-Augen-Prinzip:** Für MOD- und BETRIEB-Zugänge ohne Owner-Kennzeichen brauchen Sperren,
Kontext ausklappen, Dateiansicht und Art.-18-Meldungen eine zweite Person. **Owner** handeln dabei
ohne zweite Person; jede solche Handlung steht als „ohne zweite Person“ im Zugriffsprotokoll. Die
Regel steht zusätzlich in der Datenbank (Trigger `enforce_second_person`). Es gibt keinen Notfallzugang.

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
| Stufe 2 und Fotoprüfung über einen Prüfpartner (Stufe 1 läuft über das Ausweisfoto, siehe unten) | `backend/src/providers/verification.ts` (Schnittstelle vorhanden; die Attrappe ist nur im Testbetrieb erreichbar) |
| Hash-Abgleich (bekannte Missbrauchsdarstellungen) | `HASH_PROVIDER=http`, `HASH_URL` — danach im Werkzeug `P-HASH-AKTIV` einschalten (geht nur mit hinterlegter Ansprechperson) |
| Mailversand über einen EU-Dienst | `SMTP_URL` |
| SMS-Versand | `SMS_PROVIDER=http` mit Vorlage (Sweego-Beispiel in `.env.example`) |
| Rechtstexte (Impressum, Bedingungen, Datenschutz, Einwilligung) | Platzhalter in `shared/texts/` (IDs `UI-RECHT-*`, `ST-KON-27`) |

### Altersprüfung per Ausweisfoto

`AGE_PROVIDER=ausweis` (Voreinstellung): Die Person fotografiert ihren Ausweis — Vorderseite, auf Wunsch
auch die Rückseite. **Nur das Geburtsdatum zählt**; Name, Foto, Adresse und Nummer dürfen abgedeckt sein.
Der Server liest das Datum selbst (Tesseract im API-Abbild, kein Dritter) — aus der maschinenlesbaren Zone
mit gültigen Prüfziffern oder aus einem beschrifteten Datum, wenn genug Merkmale eines Ausweises erkennbar
sind. Sicher volljährig → sofort frei, kein Bild wird gespeichert. Unsicher oder unter 18 → das Bild liegt
verschlüsselt bereit und ein Mensch entscheidet im Werkzeug unter **„Altersprüfung“**; danach, spätestens
nach `P-AUSWEIS-AUFBEWAHRUNG` (7 Tage), wird es gelöscht. Ein Ergebnis unter 18 entscheidet immer ein Mensch.
**Vor dem Echtbetrieb:** die Datenschutzerklärung um die Verarbeitung des Ausweisfotos ergänzen.

### Discord

Nachvollziehbare Ereignisse gehen auf Wunsch an Discord — je Kategorie ein eigener Kanal
(`DISCORD_WEBHOOK_MODERATION`, `_MELDUNGEN`, `_SICHERHEIT`, `_TEAM`, `_KONTEN`, `_ALTERSPRUEFUNG`, `_SYSTEM`,
Rückfall `_DEFAULT`; Beschreibung in `.env.example`). Gesendet werden nie personenbezogene Daten von Nutzern
und nie Begründungstexte — nur Art, Fallnummer, handelnde Person aus dem Team und Zeit.

### Sicherung und Wiederherstellung

```bash
bash deploy/backup.sh      # täglich per cron (03:17); verschlüsselt, 14 Tage Aufbewahrung in ./backups
bash deploy/restore.sh backups/db-….dump.enc backups/media-….tar.gz.enc
```

### Versionen und Aktualisierung

Versionen folgen **Semantic Versioning** (`VERSION`, `CHANGELOG.md`): MAJOR bei inkompatiblen
Änderungen, MINOR bei neuen Funktionen, PATCH bei Fehlerbehebungen. Neue Version:
`node scripts/version.mjs minor` (bzw. `patch`/`major`), Changelog ergänzen, auf `main` mergen — der
Workflow `CI` testet und legt Tag `vX.Y.Z` und das GitHub-Release an.

**Einspielen per Knopf:** Werkzeug → **„Aktualisierung“** (nur Owner). Der Dienst `updater` — der einzige
mit Zugriff auf Docker, ohne offenen Port — holt den Auftrag ab und führt `deploy/update-run.sh` aus:
Release holen → Sicherung → bauen → starten → Gesundheit **und** Version prüfen. Scheitert ein Schritt,
geht es automatisch zurück auf den vorherigen Stand. Das Protokoll jedes Laufs steht im Werkzeug, in
`deploy/logs/update-<nr>.log` und (falls eingerichtet) im Discord-Kanal „System“. Bei einem privaten
Repository `GITHUB_TOKEN` (nur Leserecht auf Inhalte) in `.env` eintragen.

```bash
bash deploy/update.sh          # von Hand: neuestes Release — derselbe Ablauf mit Rückfall
bash deploy/update.sh 0.2.0    # bestimmte Version
docker compose up -d --build updater   # nur nötig, wenn sich deploy/updater/Dockerfile ändert
```

Migrationen sind nur additiv — nach einem Rückfall läuft der alte Stand mit dem neueren Schema weiter.

Die Sicherungen gehören zusätzlich auf einen zweiten Ort (z. B. Hetzner Storage Box):
`BACKUP_DIR=/mnt/storagebox bash deploy/backup.sh`.

### Ressourcen auf 4 GB RAM

PostgreSQL ist auf etwa ein Viertel des Speichers abgestimmt (`shared_buffers=256MB`,
`max_connections=40`), die API auf 768 MB Heap; jeder Dienst hat eine Speichergrenze.
Bildverarbeitung läuft mit einem Thread (`sharp.concurrency(1)`), der Swap fängt Spitzen ab.
Hintergrundaufträge laufen nacheinander, damit Nutzeranfragen immer Datenbankverbindungen behalten.

---

## 2 · Lokal entwickeln

Voraussetzungen: Node 22, PostgreSQL 16, für die Ausweisprüfung `tesseract-ocr` und `tesseract-ocr-deu`.

```bash
createdb cruizy_dev && createdb cruizy_test          # Rolle cruizy/cruizy oder DATABASE_URL anpassen

cd backend && npm ci
MASTER_KEY=$(openssl rand -base64 32) OPERATION_MODE=test TEST_INVITE_CODE=einladung \
  COOKIE_SECURE=0 NODE_ENV=development npm run dev    # API auf :3000

cd frontend && npm ci && npm run dev                  # App auf :5173, Werkzeug auf :5173/mod.html
```

| Befehl (in `backend/`) | Zweck |
|---|---|
| `npm test` | Tests gegen eine echte Datenbank (`cruizy_test`, wird neu angelegt); die Ausweis-Tests brauchen `tesseract-ocr` + `tesseract-ocr-deu` |
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
  sonst geschieht nichts; Vier-Augen-Prinzip für Nicht-Owner in der Anwendung **und** als Datenbankregel;
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
