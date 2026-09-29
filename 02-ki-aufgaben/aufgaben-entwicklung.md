# KI-Aufgaben Entwicklung — Sitzungsprompts S0–S13 für Claude Code

Angelegt: 24.07.2026 · Arbeitsweise: `README.md` in diesem Ordner · Fachliche Grundlage: `70-entwicklung-ab-monat-4/code-planer.md` (Arbeitspakete AP-0 bis AP-15) und `claude-code-kickoff-struktur.md` (CLAUDE.md-Vorlage, Architekturregeln).

**Für jede Sitzung gilt unverändert:** Rolle = Senior-Entwickler mit Sicherheitsfokus in einem Zweierteam. Zuerst CLAUDE.md und `docs/architektur-regeln.md` des Repos lesen, dann den genannten AP-Abschnitt im Code-Planer. Eine Sitzung = eine Aufgabe = ein sauberer Commit-Stand. Sicherheitskritisches als `PRÜFUNG ERFORDERLICH` markieren mit Prüfhinweisen für Gründer 1. Kein Scope-Creep. Bei Widerspruch zur Spezifikation: fragen, nicht entscheiden. Migrationen nur additiv. Empfohlenes Modell: Fable/Opus für S1–S3 und alles Markierte, sonst frei.

## Übersicht

| Sitzung | Inhalt | Blocker | Status |
|---|---|---|---|
| S0 | Projektgerüst (Kickoff) | **nur ein verbundenes Verzeichnis** [M] — Versionsverwaltung zunächst lokal (Nr. 102, 27.09.2026) · Entwicklungsserver (**Hetzner-VPS**, Nr. 99, geändert 28.09.2026) erst ab S4 | ☐ |
| S1 | Datenmodell + Löschbarkeit (AP-1) | S0 | ☐ |
| S2 | Standortarchitektur (AP-2) | S1 | ☐ |
| S3 | Bildpipeline (AP-3) | S1 | ☐ |
| S4 | Auth + Gastmodus + Infra-Rest (AP-5, AP-0) | S1 | ☐ |
| S5 | Profil-Datenlogik + Einwilligung (AP-6a) | S4 | ☐ |
| S6 | Profil-UI + Absichten (AP-6b) | S5 | ☐ |
| S7 | Raster + Entdecken (AP-7) | S2 + S6 | ☐ |
| S8 | Chat-Kern (AP-8a) | S4, JMStV-Antwort [M] | ⏳ |
| S9 | Chat-Gates + private Alben (AP-8b) | S8 + S3 | ⏳ |
| S10 | Verifizierung + Moderation (AP-9, AP-4) | Anbieterverträge [M] | ⏳ |
| S11 | Blockieren/Melden + Datenkonto (AP-10, AP-13) | S8 | ☐ |
| S12 | „Heute" + Sicherheitszentrum (AP-12, AP-11) | S2, S7 | ☐ |
| S13 | Antwortquote + Härtungsvorbereitung (AP-14, AP-15) | S8 mit echten Beta-Daten | ⏳ |

---

### S0 · Projektgerüst ☐
**Prompt vom:** 24.07.2026 · **Wofür:** Fundament, bewusst ohne kritische Logik
**Prompt:** Führe exakt den „Ersten Arbeitsauftrag" aus `70-entwicklung-ab-monat-4/claude-code-kickoff-struktur.md` aus: Ordnerstruktur, React+Vite+TS+Tailwind, ESLint/Prettier, Vitest mit Beispieltest, .env.example, erste Migration users/profiles (kommentiert, ohne Standort-/Bildlogik), Lizenzprüfung, README. Lege zusätzlich CLAUDE.md und docs/architektur-regeln.md mit den Inhalten aus der Kickoff-Datei an sowie docs/handbuch-a.md und docs/handbuch-b.md aus den HTML-Handbüchern (konvertiert). Nicht tun: alles, was die Kickoff-Datei unter „Nicht tun" listet. Fertig: lauffähiges leeres Gerüst, ein Commit, Migration als PRÜFUNG ERFORDERLICH markiert.
**Ergänzung vom 17.09.2026 (aus A-29):** Zusätzlich die Parameterliste aus `50-produkt-prototyp/produktspezifikation.md`, Abschnitt 15, als zentrale Konfiguration anlegen — Werte sind ohne Codeänderung änderbar (AK-PA-01). Vorher dort die Abschnitte 1 bis 3 und Q-08 lesen. Regeln und Zuordnung: „Ergänzungen“ am Ende dieser Datei.
**Status:** ☐ offen (Start = Gründerentscheidung; Plan sieht Monat 4 vor)

### S1 · Datenmodell + Löschbarkeit ☐
**Prompt vom:** 24.07.2026 · **Wofür:** AP-1 — „nachträglich eine der teuersten Umbauten"
**Prompt:** Lies Code-Planer AP-1 und Handbuch A Teil III (Datenschutz-Pflichten). Baue: Migrationen für users, profiles, consents (Art.-9-Einwilligungen versioniert: Zweck, Textstand, Zeitstempel, Widerruf), device_sessions; Löschkaskaden über alle Tabellen mit Personenbezug (ON DELETE + Cleanup-Function für Storage-Referenzen); Edge Function `export_user_data` (vollständiges JSON aller personenbezogenen Daten); Kohorten-Eventschema in PostHog (user_created, activation, retention-Marker) + monatlicher Archiv-Job. Tests: Löschtest beweist null verwaiste Zeilen inkl. Storage-Verweise; Export-Vollständigkeitstest (jede PII-Spalte gegen Schema-Introspektion). Alles `PRÜFUNG ERFORDERLICH`. Fertig: beide Tests grün, Prüfnotiz für Gründer 1 geschrieben.
**Ergänzung vom 17.09.2026 (aus A-29):** Vorher in `50-produkt-prototyp/produktspezifikation.md` F68, Q-08, Q-09 und Q-16 lesen; deren Akzeptanzkriterien werden Tests (Regeln am Ende dieser Datei). Kennzahlen entstehen serverseitig, Monatsarchive enthalten nur Summen je Kohorte (FV-07, FV-09).
**Status:** ☐ offen

### S2 · Standortarchitektur ☐
**Prompt vom:** 24.07.2026 · **Wofür:** AP-2 — Kernpunkt 1 der Architekturregeln, Trilateration konstruktiv unmöglich
**Prompt:** Lies Code-Planer AP-2, Architekturregeln §1, Handbuch A F70/F69/F60/F25. Baue: PostGIS-Spalte `precise_location` mit RLS deny-all für jede Client-Rolle; Edge Function `discovery` — Eingabe: eigene Position + Filter, Ausgabe: ausschließlich Entfernungsbänder (< 1 km · 1–3 km · 3–10 km · > 10 km) und auf 10 km gerundeter Radius, Zielgröße ~100 Profile, Obergrenze 150 km; Zonen-Tabelle (Verschleierungszonen, eine gratis — Abo-Logik nur als Feld vorbereiten); Genauigkeitsstufen-API für die Kopfzeile. Tests: Property-Test „keine Response enthält Zahl präziser als Band"; Trilaterations-Szenariotest (3 versetzte Anfragen ergeben keine Position genauer als das Band); RLS-Test als anonymer/authentifizierter Client. Komplett `PRÜFUNG ERFORDERLICH` — Prüffrage aus CLAUDE.md in der Commit-Nachricht beantworten.
**Ergänzung vom 17.09.2026 (aus A-29):** Vorher in `50-produkt-prototyp/produktspezifikation.md` F25, F60, F69, F70, Q-02 und Q-08 lesen; deren Akzeptanzkriterien werden Tests. **Abweichung vom Prompt:** Eine Spalte `precise_location` gibt es nicht — der Server rundet jede Position sofort auf den Mittelpunkt einer Rasterzelle und speichert nur diesen; die genaue Position bleibt im Arbeitsspeicher (FV-02, AK-F70-03). Die Zahl kostenloser Zonen ist ein Parameter, ihre Wirkung hängt an Nr. 48 (FV-70).
**Status:** ☐ offen

### S3 · Bildpipeline ☐
**Prompt vom:** 24.07.2026 · **Wofür:** AP-3 — Kernpunkt 2: Information zerstören, nicht verdecken
**Prompt:** Lies Code-Planer AP-3, Architekturregeln §2, Handbuch A F72/F10/F11/F12/F13. Baue: Upload-Edge-Function — EXIF-Strip vor jeder Verarbeitung → Original verschlüsselt in Bucket A (UUIDs ohne Ableitbarkeit) → 32×42-Downscale → Upscale auf Zielgröße → Bucket B; Freischaltungs-Tabelle (Ein-Tipp pro Gespräch, Wasserzeichen-Overlay mit Empfänger-Kennung, Rücknahme wirkt nur vorwärts); farbige Initiale als Fallback; Ablehnungs-Datenmodell (Grund + Bildbereich-Koordinaten). Moderations-Hook als Interface vorbereiten (Anbindung in S10): Prüfung IMMER auf Original vor Bucket-B-Erzeugung, Veröffentlichung blockiert bis Hook-Antwort. Tests: EXIF-Test, Frequenzanalyse-Nachweis der Unumkehrbarkeit (dokumentieren), ID-Korrelationstest A↔B, „kein Original je an Client"-RLS-Test. Komplett `PRÜFUNG ERFORDERLICH`.
**Ergänzung vom 17.09.2026 (aus A-29):** Vorher in `50-produkt-prototyp/produktspezifikation.md` F10, F11, F12, F13, F48, F72, M-01 und Q-08 lesen; deren Akzeptanzkriterien werden Tests. **Abweichung vom Prompt:** Das Wasserzeichen ist unsichtbar und trägt eine Kennung der empfangenden Person — kein sichtbares Overlay; Bildadressen gelten nur kurz (FV-27, `P-BILDLINK-GUELTIG`).
**Status:** ☐ offen

### S4 · Auth, Gastmodus, Infra-Rest ☐
**Prompt vom:** 24.07.2026 · **Wofür:** AP-5 + AP-0-Abschluss
**Prompt:** Lies Code-Planer AP-5. Baue: Supabase-Auth-Konfiguration (E-Mail-Registrierung ohne Klarname/Telefonpflicht, Double-Opt-in), Anmelden mit Apple über Web-OAuth inkl. „E-Mail verbergen"-Kompatibilität (Relay-Adressen sauber behandeln), Session-/Refresh-Handling, Rate-Limits auf Auth-Endpunkte, Gastmodus: 3-Minuten-Token, read-only, ausschließlich Bucket-B-Bilder in zusätzlicher Unkenntlich-Stufe. Sentry-EU- und PostHog-Anbindung komplettieren, Backup-Restore-Runbook in docs/. Auth-Teile `PRÜFUNG ERFORDERLICH`. Fertig: E2E-Test Registrierung→Login→Gast-Ablauf grün.
**Ergänzung vom 17.09.2026 (aus A-29):** Vorher in `50-produkt-prototyp/produktspezifikation.md` F01, F02, F03, F71, Z-04, Q-10 und Q-11 lesen; deren Akzeptanzkriterien werden Tests. **Abweichung vom Prompt:** ~~Sentry nur mit einer dokumentierten Entscheidung nach Nr. 58 (Q-08)~~ **seit 20.09.2026 (A-53, Grundsatz G-01): kein Sentry** — Fehlerprotokolle mit GlitchTip oder Bugsink im Selbstbetrieb; PostHog misst im Client nur mit Einwilligung (FV-07). Gäste sehen keine Namen, keine Antwortquote und kein Aktivitätsband (FV-11); bei Apple wird kein Name angefordert (FV-14).
**Status:** ☐ offen

### S5 · Profil-Datenlogik + Einwilligung ☐
**Prompt vom:** 24.07.2026 · **Wofür:** AP-6a — Art.-9-Kern
**Prompt:** Lies Code-Planer AP-6, Handbuch A F14–F21. Baue Datenlogik + APIs: Absicht mit Ablauf (vier Absichten, Zeitfenster, stiller Rückfall auf „Offen", Nachtruhe 4–10 Uhr — Worker), Interessens-Merkmale strukturiert (Eisbrecher-Grundlage), Geschlechtsidentität (Selbstbeschreibung, Sichtbarkeits-Flag, Art.-9-Behandlung — Taxonomie-Texte als Platzhalter bis [M]-Gegenlesen), „Wen ich sehen möchte" (nur Positivauswahl, wirkt nur auf eigene Ansicht), Freitext 400 Zeichen mit Speicher-Prüfung auf ausschließende Formulierungen (Hinweis, keine Blockade), Aktivitätsbänder-Berechnung (5 Stufen, kein Onlinepunkt), Merkliste privat. Einwilligungsfluss gegen consents-Tabelle aus S1 (`PRÜFUNG ERFORDERLICH`). Tests: Absichts-Ablauf inkl. Nachtruhe-Kante, Sichtbarkeitsmatrix.
**Ergänzung vom 17.09.2026 (aus A-29):** Vorher in `50-produkt-prototyp/produktspezifikation.md` Abschnitt 5.0 (Name und Alter), F14 bis F18, F20, F21 und Q-09 lesen; deren Akzeptanzkriterien werden Tests. Ergänzungen zum Prompt: ein freiwilliges Altersfeld, unter 18 wird nichts gespeichert (FV-23); „Nachtruhe“ heißt nur, dass zwischen 4 und 10 Uhr keine Erneuerungsleiste erscheint — Abläufe finden trotzdem statt (FV-30); eine nicht sichtbare Geschlechtsidentität wirkt nirgends, auch nicht auf „Wen ich sehen möchte“ (FV-32).
**Status:** ☐ offen

### S6 · Profil-UI + Onboarding ☐
**Prompt vom:** 24.07.2026 · **Wofür:** AP-6b
**Prompt:** Baue die UI zu S5 nach Mikro-UX-Tabelle Handbuch A (44-pt-Ziele, Hauptaktionen unteres Drittel, dynamische Schriftgrößen bis „sehr groß", WCAG AA, VoiceOver/TalkBack-Labels von Anfang an): Profil-Editor (8 Fotos-Slots mit Upload-Status aus S3, privates Profilbild-Toggle, Initiale-Fallback), fremde Profilansicht (Kachel-Detail: Foto, Name, Entfernungsband, Absicht, Antwortquote-Band-Platzhalter), Onboarding mit kontextuellen Rechteabfragen (nie auf Vorrat), Systemtexte aus `50-produkt-prototyp/systemtexte-ENTWURF.md` (A-14) einbinden, Platzhalter wo leer. Bewegung 150–200 ms ease-out, Haptik nur an den drei erlaubten Stellen. Fertig: Storybook/Screens-Doku + Screenshot-Satz für Gründer-Review.
**Ergänzung vom 17.09.2026 (aus A-29):** Vorher in `50-produkt-prototyp/produktspezifikation.md` Abschnitt 3 (Rahmen), Abschnitt 5.0, F14 bis F18, F20, F21 sowie Q-06, Q-07, Q-13, Q-14 und Q-15 lesen; deren Akzeptanzkriterien werden Tests. Texte kommen weiter aus A-14; dessen Korrekturliste steht in der Spezifikation, Abschnitt 16.3.
**Status:** ☐ offen

### S7 · Raster + Entdecken ☐
**Prompt vom:** 24.07.2026 · **Wofür:** AP-7 — das erste sichtbare Produkt
**Prompt:** Lies Code-Planer AP-7, Handbuch A F23–F29. Baue: Raster 3 Spalten (Kachel: Foto, Name, Entfernungsband, Absicht, Antwortquote-Band), vier sichtbar benannte, umschaltbare Sortierungen, elastisches Raster (sichtbar getrennt „In deiner Nähe" / „Etwas weiter weg"), Positivfilter Entfernung/Absicht/Alter (max. 2 gleichzeitig, Echtzeit-Trefferzähler), Wochenaktive-Zuschaltung < 20 Profile/10 km, leerer Zustand mit fester Ersatzreihenfolge (nie leeres Raster), Offline-Cache letztes Raster. Query ausschließlich über S2-`discovery` (Query-Änderungen dort = `PRÜFUNG ERFORDERLICH`). Performance: First-Grid < 1,2 s auf Referenz-Android messen (Lighthouse/WebPageTest-Budget in CI). Fertig: Budget-Test in CI, Screenshot-Review.
**Ergänzung vom 17.09.2026 (aus A-29):** Vorher in `50-produkt-prototyp/produktspezifikation.md` F17, F23 bis F27, F29 und Q-03 lesen; deren Akzeptanzkriterien werden Tests. **Abweichung vom Prompt:** Die Abschnittsnamen im Raster kommen aus der Systemtext-Bibliothek (ST-STO-14), nicht aus diesem Prompt. Der Altersfilter erfasst nur Profile mit freiwilliger Altersangabe (FV-23); die Oberfläche sagt das.
**Status:** ☐ offen

### S8 · Chat-Kern ⏳
**Prompt vom:** 24.07.2026 · **Wofür:** AP-8a · **Blocker:** ⏳ JMStV-Antwort sollte vorliegen (bestimmt Gate-Architektur ab S9)
**Prompt:** Lies Code-Planer AP-8, Handbuch A F41–F47. Baue: Realtime-Chat unbegrenzt (auch gratis, keine Limits), zwei Postfächer (Erstnachrichten in „Anfragen": keine Push, keine Zählmarke), höflicher Ausstieg (ein Tipp, fester Text aus Systemtexten, beidseitige Ablage, 5 s Rückgängig statt Bestätigungsdialog), 24-h-Archiv (Wiedereröffnung beidseitig sichtbar, keine Rücknahme zugestellter Nachrichten), verfallende Chats optional 24 h beidseitig (Worker; Vorrang vor Archiv), Push gebündelt (max. 1/Absender/15 Min, Ruhezeiten 23–8 Uhr, ohne Absender/Vorschau standardmäßig, Anfragen nie). RLS je Konversation `PRÜFUNG ERFORDERLICH`. Tests: die drei Wechselwirkungen aus dem Code-Planer als Integrationstests.
**Ergänzung vom 17.09.2026 (aus A-29):** Vorher in `50-produkt-prototyp/produktspezifikation.md` F41, F42, F45, F46, F47 und X-01 lesen; deren Akzeptanzkriterien werden Tests. **Abweichung vom Prompt:** Hier lässt sich nur X-01 (Archiv × verfallende Chats) testen — Eisbrecher entstehen in S9, Blockieren in S11, die Antwortquote in S13. Alle Wechselwirkungen laufen in Phase 1d als Integrationstests (AP-15, Spezifikation Abschnitt 14).
**Status:** ⏳ bis JMStV-Antwort

### S9 · Chat-Gates + private Alben ⏳
**Prompt vom:** 24.07.2026 · **Wofür:** AP-8b · **Blocker:** ⏳ S8 + JMStV-Antwort (Alben-Prüfstufe!)
**Prompt:** Baue serverseitig (`PRÜFUNG ERFORDERLICH`): Medien-Gate „Erstkontakt nur Text" (Bild/Sprache/Video hart gesperrt bis erste Antwort der Gegenseite — Server erzwingt, UI erklärt), Erstkontakt-Verlangsamung neuer unverifizierter Konten (max. 5 Erstnachrichten/24 h), private Alben mit beidseitiger Freigabe (S3-Wasserzeichen, Bildschirmfoto-Hinweis, Prüfstufen-Konfiguration je JMStV-Ergebnis: einfache Stufe vs. härtere Stufe als Config-Flag), Eisbrecher aus festen Vorlagen + strukturierten Merkmalen (Entwurf ins Textfeld, kein Direktversand, keine generative KI — Vorlagenkatalog als Datenstruktur, Texte aus A-14). Tests: Gate-Umgehungsversuche (API direkt), Limit-Reset-Kanten.
**Ergänzung vom 17.09.2026 (aus A-29):** Vorher in `50-produkt-prototyp/produktspezifikation.md` F12, F43, F44, F48, F57, F63 und Z-03 lesen; deren Akzeptanzkriterien werden Tests. **Abweichung vom Prompt:** Bilder im Gespräch gehören wie private Alben zu Zone 2 und verlangen bei eingeschaltetem Schalter Stufe 2; im Zustand „nur Stufe 1“ erscheinen empfangene Bilder als geschlossene Kachel, der Absender erfährt davon nichts (FV-85, FV-86). Das Wasserzeichen ist unsichtbar (FV-27). Videonachrichten gibt es im MVP nicht (FV-58).
**Status:** ⏳ bis S8 + JMStV

### S10 · Verifizierung + Moderations-Anbindung ⏳
**Prompt vom:** 24.07.2026 · **Wofür:** AP-9 + AP-4 · **Blocker:** ⏳ Verifizierungsanbieter-Vertrag (A-07), Hash-Abgleich-Zugang (A-08), JMStV
**Prompt:** Lies Code-Planer AP-9/AP-4, Handbuch A F4–F9. Baue (`PRÜFUNG ERFORDERLICH` für alles Anbieter- und Auth-nahe): Anbieterabstraktion `verification/` mit Provider-Interface (Selfie-Schätzung, eID, künftig EUDI-Wallet — konfigurierbare Stufen je Funktionsbereich), Webhook-Verarbeitung mit Signaturprüfung, Auslösung vor der ersten Nachricht (nicht bei Registrierung), Community-Vertrag (vier einzeln zu bestätigende Zeilen, gebündelt mit Altersprüfung), Fotoechtheit-Flow (freiwillig, sichtbar belohnt), Erklärbildschirm für Unverifizierte, „Nur Verifizierte"-Filter (kostenlos, standardmäßig an, 2 Tipps abschaltbar, keine Plattformsperre). Hash-Abgleich-Hook aus S3 produktiv anbinden: Prüfung auf Original vor jeder Veröffentlichung, Sperrpfad, Moderations-Backend (Fallliste, Fristen, Entscheidung IMMER durch Mensch). Tests: kein Bild ohne Hook-Antwort sichtbar; Webhook-Replay-Schutz.
**Ergänzung vom 17.09.2026 (aus A-29):** Vorher in `50-produkt-prototyp/produktspezifikation.md` Abschnitt 4.0, F04, F05, F06, F08, F09, F10, Z-03 und M-01 bis M-10 lesen; deren Akzeptanzkriterien werden Tests. **Abweichung vom Prompt:** Stufe 2 gilt auch für Bilder im Gespräch (FV-85). Was „verifiziert“ heißt, ist offen (Nr. 64): Kriterien mit [A] oder [B] gelten nur im jeweiligen Modell, die Sitzung entscheidet das nicht selbst. Zone 2 bekommt den Schalter für den Abgleich in beiden Stellungen (M-09, Nr. 30).
**Status:** ⏳ bis Verträge + JMStV

### S11 · Blockieren, Melden, Datenkonto ☐
**Prompt vom:** 24.07.2026 · **Wofür:** AP-10 + AP-13
**Prompt:** Lies Code-Planer AP-10/AP-13, Handbuch A F61/F62/F68/F71. Baue (`PRÜFUNG ERFORDERLICH` für RLS/Löschpfade): Blockliste serverseitig unveränderlich (überlebt Update/Reinstall, sofort wirksam, 24 h rücknehmbar, zweite Sperre endgültig) mit expliziter Testabdeckung inkl. „Block wirkt in Raster, Chat, Heute, Alben"; Melden mit Fallnummer, Statusverlauf, begründeter Rückmeldung an beide Seiten, Widerspruchsweg aus der App (72-h-Frist als Prozessfeld); Datenkonto-UI: Export und Löschung je ein Tipp, 30 Tage Karenz mit Abbruchmöglichkeit, klare Statusanzeige; CI-Check „verbotene SDK-Liste" scharf schalten. Tests: Blocklisten-Suite, Lösch-Karenz-Kanten, Export-Download-Flow.
**Ergänzung vom 17.09.2026 (aus A-29):** Vorher in `50-produkt-prototyp/produktspezifikation.md` F61, F62, F68, F71, Z-01 und X-02 lesen; deren Akzeptanzkriterien werden Tests. **Abweichung vom Prompt:** zwei Widerspruchsfristen statt einer — 48 Stunden für den Einspruch gegen eine Bildablehnung, 72 Stunden für jeden anderen Widerspruch (FV-81). Meldungen gehen auch ohne Konto über ein Webformular (FV-72); der Export ist verschlüsselt, das Herunterladen verlangt eine erneute Anmeldung (FV-76).
**Status:** ☐ offen

### S12 · „Heute" + Sicherheitszentrum ☐
**Prompt vom:** 24.07.2026 · **Wofür:** AP-12 + AP-11 — die Differenzierung
**Prompt:** Lies Code-Planer AP-12/AP-11, Handbuch A F30–F34, F54–F59, F63. Baue: Karte mit ausschließlich serverseitig berechneten Personen-Clustern (nie Einzelpin — Clusterfunktion `PRÜFUNG ERFORDERLICH`), Ortsverzeichnis (Datenmodell nach Ortslisten-Schema, Claiming-Flow mit Impressum-Domain-Mailprüfung + manueller Freigabe-Queue), Ereignisse mit Zusagen (sichtbar nur für Zusagende), temporäre Ereignisgruppen (öffnen 2 h vorher, verschwinden 24 h danach — Worker), termine@-Ingest (E-Mail-Webhook, Parser als Vorschlag in Freigabe-Queue); Sicherheitszentrum: aus jedem Chat ein Tipp, Check-in (Adresse/Zeit clientseitig verschlüsselt, für Gegenseite unsichtbar — `PRÜFUNG ERFORDERLICH`), Treffpunkt-Vorschlag aus Verzeichnis, PWA-Schnellverstecken (Ersatzgeste + PIN-Rückkehr, Grenzen dokumentiert), Bildschirmfoto-Hinweistext. Tests: Cluster-Mindestgröße (k-Anonymität), Claiming-Missbrauchsfälle.
**Ergänzung vom 17.09.2026 (aus A-29):** Vorher in `50-produkt-prototyp/produktspezifikation.md` F30 bis F34, F54 bis F56, F58, F59, F63, Z-01, Q-04 und Q-14 lesen; deren Akzeptanzkriterien werden Tests. Hinweise zum Prompt: Der Check-in wird in Fassung 1 gebaut — nur Nachfragen, keine automatische Handlung — bis Nr. 66 entschieden ist (FV-65). Keine bezahlte Hervorhebung von Orten vor Nr. 65. Personengruppen auf der Karte erst ab `P-CLUSTER-MIN` (FV-46).
**Status:** ☐ offen

### S13 · Antwortquote + Härtungsvorbereitung ⏳
**Prompt vom:** 24.07.2026 · **Wofür:** AP-14 + AP-15-Zulieferung · **Blocker:** ⏳ echte Beta-Chatdaten
**Prompt:** Baue die Antwortquote (F19) exakt nach Handbuch A: Bewertungsbasis erste 20 Erstnachrichten je Woche, höflicher Ausstieg zählt als Antwort, 7-Tage-Frist, drei Bänder (nie eine Zahl), abschaltbar mit symmetrischer Folge; Formel-Dokument für Gründer-Review [M] vor Aktivierung. Danach Härtungsvorbereitung: WCAG-AA-Audit-Durchlauf mit Findings-Liste, Offline-Verhalten testen, Lasttest-Skript Raster+Chat, Pen-Test-Briefing-Dokument (Scope: Standort- und Bildarchitektur zuerst) für den externen Tester [M], Wechselwirkungs-Regressionssuite komplettieren. Fertig: Beta-Readiness-Checkliste mit Ampeln.
**Ergänzung vom 17.09.2026 (aus A-29):** Vorher in `50-produkt-prototyp/produktspezifikation.md` F19 und Abschnitt 14 (X-01 bis X-22) lesen; die Kriterien von F19 werden Tests, jede Wechselwirkung wird ein Integrationstest (AP-15). Die Rechenregel der Antwortquote steht in FV-34.
**Status:** ⏳ bis Beta-Daten

---

## Ergänzungen (neue Ideen hier anfügen — Format siehe README)

### Ergänzung vom 17.09.2026 (aus A-29) · gilt für S0 bis S13
**Wofür:** Seit dem 17.09.2026 liegt die Produktspezifikation als Vorfassung vor: `50-produkt-prototyp/produktspezifikation.md`. Sie beschreibt jede Funktion mit Ablauf, Fehler- und Randfällen, Daten, Rechtsbezug und Akzeptanzkriterien in der Form „Wenn … dann …“. Gebaut und getestet wird gegen sie — sonst entscheidet der Code, was das Produkt ist.
**Regeln für jede Sitzung:**
1. **Fassung prüfen.** Die Vorfassung wird nach den Interviews (A-19) überarbeitet. Liegt zum Sitzungsbeginn eine neuere Fassung vor, gilt diese. Stellen mit der Marke [A-19] sind bis zur Endfassung nicht endgültig.
2. **Lesen.** Vor dem Bau die Einträge aus der Tabelle unten lesen, dazu Abschnitt 1 (Quellenrang und Begriffe), Abschnitt 2 (produktweite Anforderungen Q-01 bis Q-16), Abschnitt 13 (Streichliste) und die Parameter in Abschnitt 15.
3. **Abbruchfälle werden Testfälle.** `50-produkt-prototyp/nutzerablaeufe.md` (A-30) beschreibt die zehn Abläufe mit ihren Abbruchfällen (AB-01-A1 bis AB-10-A5). Jede Sitzung nimmt die Abbruchfälle ihrer Abläufe als Testfälle auf — der Fehlerfall ist der Ablauf.
4. **Kriterien werden Tests.** Jedes Akzeptanzkriterium der eigenen Einträge wird zu mindestens einem automatisierten Test, der die Kennung im Namen trägt (etwa `AK-F61-03`). Was sich nur von Hand prüfen lässt, steht als Prüfauftrag in der Commit-Beschreibung. Fertig ist eine Sitzung erst, wenn jedes Kriterium, das ihren Teil betrifft, als Test grün ist oder als Prüfauftrag benannt ist; Kriterien zum Teil einer anderen Sitzung übernimmt jene.
5. **Werte aus der Konfiguration.** Zahlenwerte kommen aus der zentralen Parameterliste, nie fest aus dem Code (AK-PA-01).
6. **Offenes nicht entscheiden.** Die Marken [A] und [B] sind seit Nr. 64 (19.09.2026) entfallen — entfallene Kriterien stehen durchgestrichen da und werden nicht gebaut; F08, F57 und X-14 folgen nach Nr. 40. Stellen mit „⚠ W-nn“ oder „folgt nach Nr. …“ hängen an anderen offenen Entscheidungen. Die Sitzung baut, was die Spezifikation für diesen Fall vorsieht, und meldet den Rest.
7. **Abweichungen benennen.** Die bekannten Abweichungen zwischen den Prompts oben und der Spezifikation stehen in deren Abschnitt 16.3 und im jeweiligen Sitzungsblock; dort gilt die Spezifikation. Fällt eine weitere auf, wird sie vor dem Bau gemeldet und nicht still aufgelöst. Handbuch A geht beiden vor.

| Sitzung | Arbeitspaket | Einträge der Spezifikation | außerdem |
|---|---|---|---|
| S0 | Gerüst | — | Abschnitte 1 bis 3, Q-08; Parameterliste aus Abschnitt 15 als Konfiguration |
| S1 | AP-1 | F68 (Grundlage) | Q-08, Q-09, Q-16 |
| S2 | AP-2 | F25 (Grundlage), F60, F69, F70 | Q-02, Q-08 |
| S3 | AP-3 | F10, F11, F12, F13, F48 (Grundlage), F72 | M-01, Q-08 |
| S4 | AP-5, AP-0 | F01, F02, F03, F71 | Z-04, Q-10, Q-11 |
| S5 | AP-6, Datenlogik | 5.0, F14, F15, F16, F17, F18, F20, F21 | Q-09 |
| S6 | AP-6, Oberfläche | 5.0, F14, F15, F16, F17, F18, F20, F21 | Abschnitt 3, Q-06, Q-07, Q-13, Q-14, Q-15 |
| S7 | AP-7 | F17, F23, F24, F25, F26, F27, F29 | Q-03 |
| S8 | AP-8, Kern | F41, F42, F45, F46, F47 | X-01 |
| S9 | AP-8, Schranken und Alben | F12, F43, F44, F48, F57, F63 | Z-03 (Bilder im Gespräch) |
| S10 | AP-9, AP-4 | 4.0, F04, F05, F06, F08, F09, F10 | Z-03, M-01 bis M-10 |
| S11 | AP-10, AP-13 | F61, F62, F68, F71 | Z-01, X-02 |
| S12 | AP-12, AP-11 | F30, F31, F32, F33, F34, F54, F55, F56, F58, F59, F63 | Z-01, Q-04, Q-14 |
| S13 | AP-14, AP-15 | F19 | X-01 bis X-22 als Integrationstests |

Noch ohne Arbeitspaket: Z-02 (Statusseite, Phase 1d) und Z-07 (Rückmeldefeld, Phase 1b) — vor dem Bau einer Sitzung zuordnen. Die 18 Funktionen der Phasen 2 und 3 sowie Z-05, Z-06 und Z-08 haben noch keine Sitzung.
