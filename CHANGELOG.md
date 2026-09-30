# Änderungen

Alle nennenswerten Änderungen stehen hier. Format nach [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
Versionsnummern nach [Semantic Versioning](https://semver.org/lang/de/):
**MAJOR** bei inkompatiblen Änderungen, **MINOR** bei neuen Funktionen, **PATCH** bei Fehlerbehebungen.

Neue Version: `node scripts/version.mjs minor` (bzw. `patch`/`major`), Einträge unter der neuen Überschrift
ergänzen, auf `main` mergen — der Workflow `CI` legt Tag und GitHub-Release an. Einspielen auf dem Server:
Werkzeug → „Aktualisierung“ (Owner) oder `bash deploy/update.sh`.

## [Unveröffentlicht]

## [0.3.0] – 2026-09-30

### Neu
- **Cruizy Date** (#19): eigener Bereich für ernsthaftes Kennenlernen auf demselben Konto. Landing mit
  Hinweis „nur echtes Dating“, Regionen mit Warteliste, Onboarding (Intention, 3–6 jugendfreie Fotos,
  Gesichtsverifizierung per Selfie mit zufälliger Pose über `FaceVerificationProvider` – nur Ergebnis und
  Zeitpunkt gespeichert, Art.-9-Einwilligung –, Beruf, Prompts, Voice-Intro, Interessen, Werte,
  Präferenzen mit Deal-Breakern, Date-Kodex). Tagesvorschläge nach Kompatibilität, Likes nur auf ein
  Element mit Kommentar, Match → Date-Chat im bestehenden Chat (bestehende Gespräche werden markiert),
  NSFW in Date-Chats nur nach Freigabe mit serverseitiger Unschärfe, Date-Zeichen im Raster nur für
  Date-Mitglieder, Date-Sperre nach berechtigten Meldungen (Hauptkonto bleibt), Auto-Pause, Pausieren,
  Verlassen, Premium-Schalter, Feature-Schalter `P-DATE-AKTIV`, reversible Migration (`migrate:down`).
- **Veranstalter und Veranstaltungen** (#16): Verifizierung als Veranstalter, Einreichung ohne
  Verifizierung zur Prüfung, Kategorien, Plätze, Bilder, Absagefrist, Gäste-Annahme, Gästeliste, Chat
  Veranstalter ↔ Gast als eigener Reiter, Mod-Panel für Anträge, Einreichungen und Gegenprüfung,
  empfohlene Cruizy-Testparty in Hamburg (Testbetrieb).
- **Heute neu** (#15): Umkreis, Kategorien, Zeitraum, „bald“ oder „nah“, empfohlene Veranstaltungen,
  Datumsgruppen, geöffnete Orte als Karussell, Haftungshinweis.
- **Karte ohne US-Dienste** (#17): eigener oder vermittelter EU-Kachelserver (`MAP_TILE_UPSTREAM`,
  Zwischenspeicher), sonst Grundkarte aus Natural Earth und GeoNames; Punkte beim Herauszoomen gebündelt,
  genaue Lage nur bei öffentlichen Orten.
- **Travel und Reisen** (#18): Travel-Modus mit Ortsverzeichnis (DE/AT/CH), Punkt verschieben bis 20 km,
  Reisen mit „Bald in der Gegend“.
- **Verstecken** (#11): Tarn-Apps Notizen, Rechner, Wetter, Kalender mit passenden Symbolen, App-Sperre per PIN.
- **Profil** (#13): Bearbeiten direkt aus dem Profil, Größe, Gewicht, Position, Körpertypen, Kinks
  freiwillig, Freitext bis 2000 Zeichen, bis 20 Fotos; Mini-Profilbild im Reiter „Ich“.
- **Raster und Suche** (#20, #22): Namenssuche, Filter, Radius, stabile Sortierung mit Nachladen.
- **Chat** (#14, #21, #23, #26, #28, #30): ungelesen markiert, Vorlagen und Emojis, bis zu 10 private
  Alben, Einmal-Bilder, Sprachnachrichten, Gesprächsstarter.
- **Profilfunktionen** (#24, #25, #27, #29): Antwortquote, Test-Erinnerung, Profilbesucher (Premium),
  Profil-Vollständigkeit.

### Geändert
- **Entfernungen** (#12): 1–10 km genau, ab 15 km in 5er-, ab 100 km in 10er-Schritten.
- Sicherheitsrichtlinie: Mikrofon für die eigene Seite erlaubt (Sprachnachrichten, Voice-Intro).

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

### Geändert
- **Owner brauchen keine zweite Person** (#3): Sperren, Kontext ausklappen, Dateiansicht und
  Art.-18-Gegenzeichnung wirken bei Owner-Zugängen sofort und stehen als „ohne zweite Person“ im
  Zugriffsprotokoll. Für alle anderen Zugänge gilt das Vier-Augen-Prinzip weiter — auch als Datenbankregel.

### Behoben
- Profil bearbeiten: die Dauer einer Absicht („Wie lange?“) ließ sich nicht einstellen — die Auswahl
  sprang immer auf den Standardwert zurück (#4).

## [0.1.0] – 2026-09-28

### Neu
- Erste Fassung: API, Echtzeit, Hintergrundaufträge, Web-App (PWA), Moderationswerkzeug, Docker-Betrieb.
