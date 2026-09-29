# Änderungen

Alle nennenswerten Änderungen stehen hier. Format nach [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
Versionsnummern nach [Semantic Versioning](https://semver.org/lang/de/):
**MAJOR** bei inkompatiblen Änderungen, **MINOR** bei neuen Funktionen, **PATCH** bei Fehlerbehebungen.

Neue Version: `node scripts/version.mjs minor` (bzw. `patch`/`major`), Einträge unter der neuen Überschrift
ergänzen, auf `main` mergen — der Workflow `CI` legt Tag und GitHub-Release an. Einspielen auf dem Server:
Werkzeug → „Aktualisierung“ (Owner) oder `bash deploy/update.sh`.

## [Unveröffentlicht]

## [0.2.0] – 2026-09-29

### Neu
- **Aktualisierung per Knopf** (#5): Owner spielen im Werkzeug unter „Aktualisierung“ ein GitHub-Release ein.
  Der neue Dienst `updater` sichert, baut, startet, prüft Gesundheit und Version und fällt bei einem Fehler
  automatisch auf den letzten stabilen Stand zurück. Jeder Lauf mit Protokoll und Fehlertext im Werkzeug,
  in `deploy/logs/` und im Discord-Kanal „System“. Releases entstehen automatisch beim Merge auf `main`.
- **Altersprüfung per Ausweisfoto** (#7): nur das Geburtsdatum zählt, Name und Foto dürfen abgedeckt sein.
  Auswertung lokal (Tesseract, maschinenlesbare Zone mit Prüfziffern oder beschriftetes Datum); sicher
  volljährig → sofort frei ohne gespeichertes Bild; unsicher oder unter 18 → Prüfung durch das Team im
  Werkzeug, danach werden die Bilder gelöscht. Neue Voreinstellung `AGE_PROVIDER=ausweis`.
- **Teamverwaltung** (#8): Owner legen Zugänge an (Einmalpasswort, QR-Code für den zweiten Faktor), ändern
  Name, Rolle und Owner-Status, sperren, setzen Passwort oder zweiten Faktor neu und löschen Zugänge.
  „Mein Zugang“ zum Ändern des eigenen Passworts.
- **Discord-Webhooks** (#6): nachvollziehbare Ereignisse je Kategorie in eigene Kanäle
  (`DISCORD_WEBHOOK_*`) — ohne personenbezogene Daten von Nutzern und ohne Begründungstexte.
- **HTML-Mails und Corporate Design** (#9): neues Logo, Leitfaden in `shared/brand/`, alle Mails als HTML
  mit Text-Alternative; Diskretion von Betreff und Vorschauzeile bleibt; `MAIL_BRANDING=dezent`.

### Behoben
- Profil bearbeiten: die Dauer einer Absicht („Wie lange?“) ließ sich nicht einstellen — die Auswahl
  sprang immer auf den Standardwert zurück (#4).

## [0.1.0] – 2026-09-28

### Neu
- Erste Fassung: API, Echtzeit, Hintergrundaufträge, Web-App (PWA), Moderationswerkzeug, Docker-Betrieb.
