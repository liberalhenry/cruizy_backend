# Änderungen

Alle nennenswerten Änderungen stehen hier. Format nach [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
Versionsnummern nach [Semantic Versioning](https://semver.org/lang/de/):
**MAJOR** bei inkompatiblen Änderungen, **MINOR** bei neuen Funktionen, **PATCH** bei Fehlerbehebungen.

Jeder auf `main` gemergte Pull Request wird zum Release. Einträge unter „Unveröffentlicht“ sammeln; die Stufe
steuert ein Label am Pull Request (`major`, `minor`, `patch` — ohne Label `patch`, `kein-release` lässt ihn aus).
Wer die Version selbst setzen will: `node scripts/version.mjs minor` (bzw. `patch`/`major`) im Pull Request. Einspielen auf dem Server:
Werkzeug → „Aktualisierung“ (Owner) oder `bash deploy/update.sh`.

## [Unveröffentlicht]

## [0.6.0] – 2026-09-30

### Geändert
- **Neue Gestaltung der App („Nachtstadt“):** eigene Schriften (Bricolage Grotesque für Überschriften, Figtree
  für Text), im Paket mitgeliefert — kein Abruf bei Dritten. Tiefer Hintergrund mit leichtem Lichtschimmer von
  oben und feinem Korn; Knöpfe, Karten, Eingabefelder, Schalter und Hinweise mit mehr Tiefe; Reiterleiste als
  schwebende Leiste; größere Titel auf den Reitern; Blätter fahren von unten ein; Rasterkacheln erscheinen
  nacheinander; Chat-Blasen mit Richtung; Schrittanzeige als Balken; Gast-Einstieg mit Radar um den eigenen
  Punkt; Profilkarte unter „Ich“ als Kopfbereich. Die Tarnansicht bleibt unverändert, weniger Bewegung wird
  weiter beachtet. Das Werkzeug übernimmt die Bausteine, behält aber seine Schrift.
- Profilfotos: Fortschrittsbalken oben und Tippen links/rechts zum Blättern.

### Behoben
- Profil: der Hinweis „Geprüft, aber ohne Gesicht …“ lag über der Seitenzahl „1 von 4“.

## [0.5.0] – 2026-09-30

### Neu
- **Postfach im Werkzeug** (neue Startseite): alle Meldungen, Widersprüche/Einsprüche, Rückmeldungen mit
  Antwortwunsch und Anfragen an den Support untereinander — sortiert nach Vorrang und Restfrist, Filter nach
  Team und „Team ist dran / Person ist dran / erledigt“, Suche nach H- oder M-Nummer, dazu „Weitere Aufgaben“
  (Warteschlange, Freigaben, Termine …). Jede Meldung, jeder Widerspruch und jede Rückmeldung mit
  Antwortwunsch bekommt ein Ticket.
- **Ticket-Ansicht:** links ein Chat mit der Person (wie ein Messenger; interne Notizen nur fürs Team,
  Vorlagen, Enter sendet), rechts die Aktionen: Frist, Übernehmen, an ein Team weitergeben (mit Notiz),
  Kategorie, Abschließen, Meldung ansehen und entscheiden, Widerspruch entscheiden, Zugriff auf Daten
  anfragen, Person sperren oder einschränken (auch mit Bezug auf das Ticket selbst).
- **Teams:** Allgemeiner Support, Moderation & Sicherheit, Technik, Datenschutz & Recht, Abo & Zahlung.
  Anfragen ohne Anlass landen im allgemeinen Support und werden von dort weitergegeben; mit Anlass direkt
  im zuständigen Team. Owner ordnen Personen unter „Team“ ihren Teams zu („Meine Teams“ im Postfach).
- **Antwortfrist:** erste Antwort binnen 24 Std., danach 24 Std. ab der letzten Nachricht der Person;
  solange die Person dran ist, läuft keine Frist (`P-TICKET-FRIST`).

### Geändert
- **Owner handeln überall allein und ohne Begründung.** Fehlt die Begründung, steht „Ohne Begründung
  (Owner)“ im Zugriffsprotokoll; Betroffene lesen stattdessen einen neutralen Satz. Neu dabei: eine
  Meldung mit „eingeschränkt/gesperrt“ wirkt bei Owner sofort (bisher wartete sie auf eine zweite Person),
  Owner verwerfen eigene Sperranträge und entscheiden Widersprüche auch gegen eigene Entscheidungen
  (Protokoll: „ohne zweite Person“). Für alle anderen bleiben Begründung und zweite Person Pflicht.
- Hilfe in der App: der Anlass ist freiwillig („Allgemeine Frage“); Meldungen und Widersprüche erscheinen
  mit Betreff im Postfach der Person. „Kontaktservice“ im Werkzeug ist im Postfach aufgegangen.

### Behoben
- `deploy/update.sh` von Hand brach mit „not a git repository“ ab: das Skript lief als Kopie in `/tmp`
  und suchte das Repository dort. Der Knopf im Werkzeug war nicht betroffen.

## [0.4.0] – 2026-09-30

### Neu
- **Telegram-Bot statt SMS** (#32): Codes an Telefonnummern (neues Gerät, Passwort vergessen, zweiter Weg)
  und Check-in-Nachrichten gehen über einen Telegram-Bot. Die Nummer wird im Bot mit „Nummer teilen“
  verbunden — nur die eigene (Telegram bestätigt sie); Codes an eine noch nicht verbundene Nummer warten
  verschlüsselt, bis sie verbunden ist. `/stop` trennt alles. Betrieb per Abholen (`polling`, ohne offenen
  Eingang) oder Webhook mit Geheimnis. Gespeichert werden nur die verschlüsselte Chat-Kennung und Blindindizes.
- **Mitteilungen per E-Mail oder Telegram** (#35): jede Mitteilung auf Wunsch zusätzlich per Mail und/oder
  Telegram (Verbinden per Einmal-Link aus den Einstellungen). Voreinstellung: aus und ohne Inhalt — nur ein
  Hinweis mit Link in die App; Inhalt nur auf ausdrücklichen Wunsch, Sicherheitsmitteilungen nie mit Inhalt.
- **Support-Portal** (#37): „Dem Support-Team schreiben“ direkt unter „Ich“, Postfach mit Verlauf und
  „Neu“-Markierung, Antworten nur in der App; auf Wunsch Hinweis per E-Mail (ohne Inhalt). Im Werkzeug kann
  das Team um **Datenfreigabe** bitten (Konto-, Profil-, Diagnosedaten) — sichtbar erst nach Zustimmung der
  Person, befristet (`P-SUPPORT-FREIGABE`, 7 Tage), jederzeit widerrufbar, endet mit dem Abschluss; jede
  Einsicht im Zugriffsprotokoll. Diagnosedaten liefert das Gerät erst bei der Freigabe.
- **Cruizy-Date-Beispielnutzer und vollständige Profile** (#34): `npm run seed:test` füllt alle 40
  Testprofile vollständig (4 Fotos, Text, Maße, Körpertyp, Position, Interessen, Absicht, Fotoprüfung) —
  auch schon vorhandene — und legt für test4 … test40 fertige Date-Profile samt Likes an.

### Geändert
- **Mitteilungen** (#36): kein Download als Textdatei mehr; stattdessen führt ein Knopf dorthin, wo es
  weitergeht (Meldungen, Veranstaltung, Chat, Hilfe-Vorgang, Datenkopie …).
- **Verstecken** (#38): zurück in die App in jeder Tarnung gleich wie beim Verstecken — dreimal schnell
  oben tippen (oder zweimal Escape), dann die PIN; ohne PIN sofort. Vor dem Verstecken zeigt die App, wie
  es zurückgeht.
- **Heute** (#39): Aufbau wie „Nähe“ und „Chats“ — Liste/Karte, Standort und Eintragen als Symbole in der
  Kopfzeile, eine Chip-Reihe (Umkreis, Filter mit Zähler, Sortierung, aktive Filter zum Entfernen),
  Zeitraum und Kategorien im Filterblatt; nur noch der kühle Akzent statt Gold.
- **Release nach jedem Merge:** Jeder auf `main` gemergte Pull Request erzeugt ein Release. Hat er die
  Version nicht selbst erhöht, erhöht der Workflow sie (Label `major`/`minor`/`patch`, ohne Label `patch`;
  `kein-release` lässt ihn aus), legt den Versionscommit auf `main` ab und nimmt den Titel ins Changelog,
  wenn unter „Unveröffentlicht“ nichts steht.
- Hilfe: mit Konto steht die Antwort des Teams immer in der App; „per E-Mail“ heißt nur noch „Hinweis
  per E-Mail“. Ohne Konto bleibt die Antwort per E-Mail.

### Behoben
- Werkzeug → Cruizy Date: Date-Fotos wurden nicht angezeigt (#33). Dazu: alle Date-Fotos je Mitglied im
  Mitgliederblatt, Name in der Prüfliste, Date-Fotos als Kopie im Fall bei Date-Meldungen.
- Vorgang schließen im Werkzeug schlug fehl (Aufbewahrungsfrist wurde falsch übergeben).
- Push zu neuen Veranstaltungen führte auf eine Adresse, die es nicht gibt.

### Beim Einspielen beachten
- `SMS_*` entfällt. Für Codes an Telefonnummern einen Bot bei @BotFather anlegen und in `.env`
  `TELEGRAM_MODE=polling`, `TELEGRAM_BOT_TOKEN` und `TELEGRAM_BOT_NAME` eintragen (siehe `.env.example`).
  Ohne Bot landen diese Codes nur im Protokoll; der Echtbetrieb startet dann nicht.
- Migration `013_v040` ist additiv.

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
