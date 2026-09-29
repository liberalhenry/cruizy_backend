# Code-Planer — vom Funktionskatalog zum Bauplan

Stand: 24.07.2026 · Übersetzt Handbuch A (Funktionskatalog, Bauplan Phase 1a–1d, KI-Regeln Abschnitt 10) in Arbeitspakete mit Abhängigkeiten, Schnittstellen und klarer Zuordnung, wer was codet. Funktionsnummern (F…) beziehen sich auf den Katalog in Handbuch A, Abschnitt 4.

> **Hinweis vom 17.09.2026 (A-29):** Seit dem 17.09.2026 gibt es die Produktspezifikation als Vorfassung (`../50-produkt-prototyp/produktspezifikation.md`). Ihr Abschnitt 16.3 nennt Korrekturen zu AP-0, AP-2, AP-3, AP-8, AP-9 und AP-10; welche Einträge der Spezifikation je Sitzung gelten, steht in `../02-ki-aufgaben/aufgaben-entwicklung.md`. Dieser Plan bleibt bis zur Überarbeitung nach den Interviews unverändert; wo er der Spezifikation widerspricht, gilt bis dahin die Spezifikation.

## 0 · Lesehilfe — die drei Einstufungen

| Kürzel | Bedeutung |
|---|---|
| **[KI]** | Claude schreibt eigenständig, inklusive Tests und Doku. Gründer lesen die Commit-Beschreibung. |
| **[KI→R]** | Claude schreibt, markiert den Commit `PRÜFUNG ERFORDERLICH`, beschreibt was zu prüfen ist. Gründer 1 geht Zeile für Zeile durch — oder der Code wird nicht verwendet. |
| **[M]** | Menschliche Handlung: Konten, Verträge, Entscheidungen, externe Prüfungen, Freigaben. |

**Immer [KI→R], ohne Ausnahme:** alle RLS-Policies (`supabase/policies/`), alles unter `src/lib/location/` und `src/lib/media/`, Authentifizierung, Verschlüsselung, jede Migration mit Personenbezug. Begründung aus Handbuch A: Fehler in dieser Art Code sehen korrekt aus und sind es nicht — unabhängig von der Modellstärke.

## 1 · Systemarchitektur — Bausteine und Schnittstellen

*Am 20.09.2026 geändert (A-53): **Sentry entfällt** zugunsten von GlitchTip oder Bugsink im Selbstbetrieb — Fehlerberichte dieses Produkts sind potenziell Daten nach Art. 9 DSGVO und verlassen den eigenen Server nicht. Begründung: `eu-alternativen-stack.md`.*

| Baustein | Technik | Spricht mit | Kritikalität |
|---|---|---|---|
| Web-Client (PWA) | React + Vite + TypeScript, Tailwind | ausschließlich Supabase-APIs + Edge Functions | normal |
| API-Schicht | Supabase self-hosted: PostgREST + RLS | DB; Client | **hoch** (RLS = Datenschutz) |
| Edge Functions | Deno (Supabase Functions) | DB, Medien, externe Anbieter | **hoch** — hier lebt alles, was Präzision verbergen muss |
| Datenbank | PostgreSQL 17 + PostGIS | — | **hoch** |
| Realtime | Supabase Realtime (WebSocket) | Chat, Aktivitätsbänder | normal |
| Medien | S3-kompatibler Objektspeicher auf dem **Hetzner-VPS** (Supabase Storage) + imgproxy; zwei getrennte Buckets (Original verschlüsselt / öffentlich) | Bildpipeline-Function | **hoch** |
| Jobs/Queue | Redis + Worker | Absichts-Ablauf, Chat-Verfall, Bänder, Kohorten-Snapshots | normal |
| Extern | Verifizierungsanbieter (REST+Webhook) · Hash-Abgleich-API · E-Mail-Ingest für termine@ (EU) · Web Push · PostHog (self-hosted) · ~~Sentry (EU)~~ GlitchTip oder Bugsink, selbst betrieben (A-53) | Edge Functions | Verträge = [M] |

**Die eine Schnittstellenregel über allem:** Der Client erhält nie rohe Fremdkoordinaten, nie Original-Bildpfade, nie interne IDs, aus denen sich beides ableiten lässt. Alles Präzise läuft durch Edge Functions, die nur Bänder, Cluster und öffentliche Ableitungen ausgeben. (Stripe/RevenueCat kommen erst in Phase 2 — im MVP gibt es keine Bezahlfunktion.)

## 2 · Abhängigkeitsgraph — was blockiert was

```
AP-0 Infrastruktur
 └─ AP-1 Datenmodell + Löschbarkeit
     ├─ AP-2 Standortarchitektur ──────────┐
     ├─ AP-3 Bildpipeline ── AP-4 Moderation│
     └─ AP-5 Auth/Gastmodus                │
         └─ AP-6 Profil ───────────────────┤
             ├─ AP-7 Raster/Entdecken ◄────┘   (braucht AP-2 + AP-6)
             └─ AP-8 Chat ◄── AP-3 (private Alben)
                 ├─ AP-9 Verifizierung & Gates   ◄── [M] JMStV + Anbietervertrag
                 ├─ AP-10 Blockieren/Melden ◄── AP-4
                 └─ AP-14 Antwortquote (zuletzt — braucht echte Chatdaten)
 AP-12 „Heute" ◄── AP-2 (Karte) + AP-6
 AP-11 Sicherheitszentrum ◄── AP-8 + AP-12 (Treffpunkt braucht Ortsverzeichnis)
 AP-13 Datenkonto ◄── AP-1 (macht Kaskaden sichtbar)
 AP-15 Härtung/Beta ◄── alles
```

**Kritischer Pfad:** AP-0 → 1 → 2 → 7 (Raster sichtbar) und parallel AP-0 → 1 → 3 → 4 (kein Bild ohne Hash-Check). ~~Die beiden externen Blocker mit Vorlaufzeit: Hash-Abgleich-Zugang (Zulassung dauert Monate — **sofort beantragen [M]**) und die JMStV-Antwort (bestimmt AP-9-Architektur).~~

> **Geändert am 27.09.2026 (zweite Beschlussrunde):** **Keiner der beiden externen Punkte blockiert den Bau.**
>
> - **Hash-Abgleich-Zugang** — beantragt wird **nach** dem Bau (Nr. 98, Weg b). AP-3 und AP-4 werden mit Steckplatz gebaut. Was gesperrt ist, ist jeder **Betrieb mit echten Menschen**: Testphase wie öffentlicher Start, per Sperre im Code (AK-M02-11). Wartezeit bei Project Arachnid nach Erfahrungsberichten Tage bis Wochen.
> - **JMStV-Antwort (K1)** — der Anwalt kommt **nach** dem Bau. **AP-9 wird auf einer Annahme gebaut**: Zone 1 verlangt keine geschlossene Benutzergruppe. Damit ein anderer Ausgang billig bleibt, wird die Altersprüfung als **Schranke im Anmeldeweg** mit dem Parameter `P-PRUEFUNG-VOR-EINTRITT` gebaut — **beide Stellungen** werden umgesetzt und geprüft —, und die Zonenregeln stehen als **Daten in einer Tabelle**, nicht als Bedingungen im Code.
> - **Prüfanbieter der Altersprüfung** — bekommt denselben Steckplatz wie der Hash-Abgleich, damit AP-9 ohne Vertrag prüfbar ist.

## 3 · Arbeitspakete im Detail

### AP-0 · Infrastruktur und Bauumgebung (Phase 1a)
**Funktionen:** Grundlage für alle · **Voraussetzung:** [M] **Hetzner-VPS mit Ubuntu** (geändert 28.09.2026, vorher hosttech) — nur **Entwicklung, Prüfläufe und Staging**, ausschließlich mit erfundenen Daten (Nr. 99), Standort Falkenstein, Nürnberg oder Helsinki; Einrichtung nach `server-einrichtung-hetzner.md`; der Produktionsserver kommt später (Nr. 103) · Domain **als Konfigurationswert** (Nr. 102) · Secrets
[KI→R] Provisionierung: Supabase self-hosted (Docker), PostGIS, Redis, imgproxy, getrennte S3-Buckets, Backup + geprobter Restore. [KI] CI, ESLint/Prettier, Vitest, Lizenzprüfung (`npm run license-check`), PostHog-Anbindung und Fehlerprotokolle über GlitchTip oder Bugsink im Selbstbetrieb (~~Sentry-EU~~, A-53), CI-Check gegen verbotene SDKs (US-Tracker-Liste).
**Fertig, wenn:** Gerüst deployt, Tests laufen, Restore einmal durchgespielt, Kohorten-Event „user_created" feuert ins leere System.

### AP-1 · Datenmodell-Kern und Löschbarkeit (F68-Basis)
[KI→R] Migrationen: `users`, `profiles`, `consents` (Art.-9-Einwilligungen versioniert mit Zeitstempel), Löschkaskaden über alle Personenbezug-Tabellen, Export-Function (vollständiges JSON), Kohortenerfassung ab Tag 1 mit monatlichem Archiv-Job [KI].
**Fertig, wenn:** Löschtest hinterlässt null verwaiste Zeilen; Export enthält jede personenbezogene Spalte; Migrationen nur additiv.

### AP-2 · Standortarchitektur (F70, F69, F60, Basis für F25) — sicherheitskritisch
[KI→R] PostGIS-Spalten mit RLS „deny all" für Clients; Edge Function `discovery` gibt ausschließlich die vier Entfernungsbänder und auf 10 km gerundete Radien aus; Zonen-Modell (eine gratis); Kopfzeilen-Status-API (Genauigkeitsstufe, F69).
**Testpflicht:** Property-Test „keine Ausgabe verlässt den Server präziser als ein Band"; expliziter Trilaterations-Testfall (drei Anfragen von versetzten Positionen dürfen keine Schnittmenge kleiner als das Band ergeben).
**Fertig, wenn:** Die Prüffrage aus CLAUDE.md mit Testbeleg beantwortet ist.

### AP-3 · Bildpipeline (F72, F10, F11, F12, F13) — sicherheitskritisch
[KI→R] Upload-Function: EXIF-Entfernung → Original verschlüsselt in Bucket A (nicht ableitbare IDs) → 32×42-Zwischenstufe → Hochskalierung → Bucket B (öffentlich); Ein-Tipp-Freischaltung mit Wasserzeichen, Rücknahme nur vorwärts (F12); [KI] farbige Initiale (F13), Upload-UI mit konkretem Ablehnungsgrund + Bildbereich (F10).
**Testpflicht:** Nachweis, dass die öffentliche Fassung nicht rückrechenbar ist (Frequenzanalyse-Test); Korrelationstest der Pfade/IDs zwischen Bucket A und B.

### AP-4 · Moderations-Grundgerüst (F62-Backend, Hash-Abgleich, NSFW-Vorfilter)
[M] Anbieterwahl und Verträge; Hash-Abgleich-Zugang beantragen (sofort — lange Zulassung). [KI→R] Anbindung: Prüfung läuft **immer auf dem Original vor Veröffentlichung**, Warteschlange, Sperrpfad. [KI] Internes Moderations-Backend (Fälle, Fristen, Entscheidungsgründe), NSFW-Vorfilter als Vorschlag — Entscheidung trifft ein Mensch [M].
**Eiserne Regel:** Kein Bild geht ohne Hash-Check live — die einzige Position mit strafrechtlicher Folge für die Geschäftsführung.

### AP-5 · Auth, Konto, Gastmodus (F1, F2, F3)
[KI→R] Supabase-Auth-Konfiguration, E-Mail-Registrierung ohne Klarnamen-/Telefonpflicht, Anmelden mit Apple inkl. „E-Mail verbergen" (Web-OAuth in der PWA), Session-Handling, Rate-Limits. [KI] Gastmodus: 3 Minuten, nur Lesen, ausschließlich unkenntliche Fotos.

### AP-6 · Profil und Einwilligung (F14–F18, F20, F21, F16)
[KI] Formulare und Feldlogik: Absicht mit Ablauf + Nachtruhe 4–10 Uhr (Worker), Interessen, „Wen ich sehen möchte" (nur Positivauswahl, wirkt nur auf eigene Ansicht), Freitext 400 Zeichen mit Prüfung auf ausschließende Formulierungen (als Speicher-Hinweis, nicht als Zensur), Aktivitätsbänder statt Onlinepunkt, Merkliste ohne Benachrichtigung. [KI→R] Art.-9-Einwilligungsfluss (Registrierung offenbart die Orientierung — nur ausdrückliche Einwilligung trägt). [M] Taxonomie-Texte (F16) vor dem Bau von Betroffenen gegenlesen lassen (bezahlt, budgetiert).

### AP-7 · Raster und Entdecken (F23–F27, F29, Wirkung von F8/F17)
[KI→R] Discovery-Query (läuft über die AP-2-Function). [KI] UI: Raster 3 Spalten, vier benannte, sichtbar umschaltbare Sortierungen, elastisches Raster (~100 Profile, sichtbar getrennt nach Nähe/Ferne, max 150 km), Positivfilter (max. 2 gleichzeitig, Echtzeit-Trefferzähler), Wochenaktive-Zuschaltung bei < 20 Profilen im 10-km-Umkreis, leerer Zustand mit fester Ersatzreihenfolge — nie ein leeres Raster.
**Performance-Budget:** < 1,2 s bis zum ersten Raster auf dem vier Jahre alten Android aus dem Gerätepool [KI misst, M bestätigt am Gerät].

### AP-8 · Chat (F41–F48, F57, F44)
[KI] Realtime-Chat unbegrenzt, zwei Postfächer (Anfragen: keine Push, keine Zählmarke), Eisbrecher aus festen Vorlagen — **keine generative KI**, Entwurf ins Textfeld statt Direktversand, höflicher Ausstieg (ein Tipp, fester Text, 5 s Rückgängig), 24-Stunden-Archiv, verfallende Chats (Worker, Vorrang vor Archiv), private Alben-UI.
[KI→R] Serverseitig: Medien-Gate „Erstkontakt nur Text bis zur ersten Antwort", Erstkontakt-Limit unverifizierter Konten (max. 5/24 h), beidseitige Album-Freigabe (nutzt AP-3-Wasserzeichen).
**Testpflicht (Handbuch A, „Wechselwirkungen"):** Archiv × verfallende Chats, Blockieren × Archiv, Eisbrecher × Antwortquote.

### AP-9 · Verifizierung und Gates (F4, F5, F6, F9) — Blocker: [M]
Wartet auf: JMStV-Antwort des Anwalts + Verifizierungsanbieter-Vertrag (Trichtertest mit dreien).
[KI→R] Anbieter-API und Webhooks, Auslösung **vor der ersten Nachricht** (nicht bei Registrierung), Fotoechtheit-Selfie-Flow. [KI] Community-Vertrag (vier einzeln zu bestätigende Zeilen, gebündelt mit Altersprüfung), Erklärbildschirm für Unverifizierte.
**Architekturauflage (JMStV-Fallback):** Prüfstufen als Konfiguration bauen — einfache 18+-Prüfung ↔ härtere Stufe je Funktionsbereich (z. B. private Alben) umschaltbar, ohne Umbau. Zusätzlich EUDI-Wallet/EU-Mini-Wallet als künftigen Prüfweg in der Anbieterabstraktion vorsehen.

### AP-10 · Blockieren und Melden (F61, F62)
[KI→R] Blockliste serverseitig unveränderlich, überlebt Updates und Neuinstallation, sofort wirksam, 24 h rücknehmbar, zweite Sperre endgültig — mit **expliziter Testabdeckung** (nicht verhandelbar laut Handbuch A). [KI] Melden mit Fallnummer, Statusverlauf, begründete Rückmeldung an alle Betroffenen (Art. 16–17 DSA). [M] Prozess: keine Sperre ohne menschliche Prüfmöglichkeit, Widerspruch binnen 72 h (Art. 22 DSGVO).

### AP-11 · Sicherheitszentrum (F54–F56, F58, F59, F63)
[KI→R] Treffen-Check-in: Adresse und Zeit verschlüsselt, für die Gegenseite unsichtbar. [KI] Sicherheitszentrum aus jedem Chat mit einem Tipp, vollständig kostenlos; Treffpunkt vorschlagen (verbindet AP-12-Verzeichnis und Check-in); Schnellverstecken und Tarnung im Rahmen der PWA-Grenzen (Abschnitt 5); Bildschirmfoto-Hinweis mit offen benannter Web-Grenze.

### AP-12 · Reiter „Heute" (F30–F34)
[KI→R] Karte: Personen nur als serverseitig berechnete grobe Cluster — nie ein Einzelpin. [KI] Ortsverzeichnis mit Claiming (Prüfung über Impressum-Domain, Freigabe-Tooling; die Freigabe binnen 24 h ist [M]), Ereignisse mit Zusagen (sichtbar nur für Zusagende), temporäre Ereignisgruppen (öffnet 2 h vorher, verschwindet 24 h danach — Worker), termine@-Ingest: E-Mail-Webhook + Parser (Regex/Heuristik, selbst gehostet, Vorschlag → menschliche Bestätigung [M]).

### AP-13 · Datenkonto sichtbar (F68, F71)
[KI→R] Export und Löschung mit je einem Tipp, 30 Tage Karenz (baut auf AP-1); [KI] „Kein Werbe-Tracking"-Nachweis: CI-Check gegen SDK-Verbotsliste, Analytik ausschließlich selbst gehostet.

### AP-14 · Antwortquote (F19) — bewusst zuletzt
[KI] Bänder-Berechnung: erste 20 Erstnachrichten je Woche, höflicher Ausstieg zählt als Antwort, Frist 7 Tage, drei Bänder statt Zahl, abschaltbar (dann symmetrisch). Formel-Review durch beide Gründer [M] — diese Kennzahl formt das Nutzerverhalten der ganzen App.

### AP-15 · Härtung und Beta (Phase 1d)
[KI] WCAG-AA-Durchgang, vollständige VoiceOver/TalkBack-Beschriftungen inkl. Rasterkacheln, Offline-Cache (letztes Raster + Chats lesbar), Wechselwirkungs- und Lasttests, Startzeit-Messung. [M] Externer Penetrationstest (Schwerpunkt AP-2/AP-3), Barrierefreiheitsprüfung durch Betroffene, 150 Testnutzer aus einem Kölner Viertel. **Die eine Beta-Zahl: Wiederkehr an Tag 7.**

## 4 · Sitzungsplan für Claude Code (Reihenfolge verbindlich)

| Sitzung | Inhalt | Prüfaufwand Gründer 1 |
|---|---|---|
| S0 | Kickoff-Gerüst — Auftrag liegt fertig in `claude-code-kickoff-struktur.md` | gering (1 Migration) |
| S1 | AP-1 Datenmodell, Löschkaskaden, Export, Kohorten | **hoch** — Migrationen |
| S2 | AP-2 Standortarchitektur | **hoch** — Zeile für Zeile |
| S3 | AP-3 Bildpipeline | **hoch** — Zeile für Zeile |
| S4 | AP-5 Auth/Gastmodus + AP-0-Rest (Monitoring, Backups) | mittel |
| S5–S6 | AP-6 Profil + Einwilligungsfluss | mittel (Consent-Fluss) |
| S7 | AP-7 Raster/Entdecken | mittel (Query) |
| S8–S9 | AP-8 Chat inkl. Gates | mittel–hoch |
| S10 | AP-9 Verifizierung (nach JMStV-Antwort + Anbieterwahl) + AP-4-Anbindung | **hoch** |
| S11 | AP-10 Blockieren/Melden + AP-13 Datenkonto | **hoch** — RLS |
| S12 | AP-12 „Heute" + AP-11 Sicherheitszentrum | mittel |
| S13 | AP-14 Antwortquote + AP-15-Vorbereitung | gering |

Regeln je Sitzung: eine klar umrissene Aufgabe, ein sauberer Commit-Stand, `PRÜFUNG ERFORDERLICH` wo nötig, kein Scope-Creep über den Sitzungsauftrag hinaus. Für PRÜFUNG-Sitzungen realistisch 2–4 h menschliche Review-Zeit einplanen — das gehört in den Wochenplan von Gründer 1.

## 4a · Der zweite Strang — Web und nativ

*Ergänzt am 20.09.2026 aus den Beschlüssen Nr. 47, 73 und 76.*

Beschlossen ist, **beide Plattformen zu bauen**. Der vollständige Plan steht in `bauplan-zwei-plattformen.md`; hier nur, was den Sitzungsplan oben ändert:

- **Vier zusätzliche Sitzungen S14 bis S17** (Capacitor-Hülle · die drei Schutzfunktionen je Betriebssystem · Store-Unterlagen · Belegprüfung in Phase 2) — **+29 Prozent** auf die vierzehn oben.
- **Reihenfolge: Web vollständig fertig, dann nativ.** Nicht parallel.
- **Abschnitt 5 unten ist an zwei Stellen zu optimistisch** und wird dort korrigiert: „Back Tap" lässt sich von einer iOS-App **nicht auslösen**, und der Wechsel des iOS-Symbols zeigt einen **Systemhinweis**.
- **Die acht Lücken aus A-46** (Umgebungen, Sicherung, Geheimnisse, Überwachung, Last, Rücknahme, Phase 2/3, Abnahme) sind dort Arbeitspaketen zugeordnet; **L1 wird AP-0b und liegt vor S1.**
- **Stack-Änderungen aus A-53:** Sentry raus (GlitchTip oder Bugsink selbst betrieben), RevenueCat raus (Belegprüfung selbst gebaut), dazu eine Bereinigungsregel für Fehlerberichte.

## 5 · PWA-Realitätscheck — ehrlich, bevor gebaut wird

Drei Sicherheitsfunktionen aus dem Katalog setzen native Fähigkeiten voraus, die eine PWA nicht hat. Das ist kein Argument gegen die PWA (Apples Richtlinie 1.1.4 bleibt der entscheidende Grund dafür), aber es muss offen benannt werden — gegenüber Nutzern und im eigenen Plan:

| Funktion | Native (Phase 2) | PWA-Fassung (MVP) |
|---|---|---|
| F58 Schnellverstecken (Doppeltipp Geräterückseite) | iOS BackTap / Android-Geste | Ersatzgeste in der App (z. B. Dreifachtipp aufs Logo) → harmlose Ansicht, Rückkehr per PIN |
| F59 Symbol/Name tarnen (4 Alternativen) | App-Icon-Wechsel | Ein neutrales Manifest-Icon/-Name als Installationsstandard; echte Alternativen erst nativ |
| F63 Bildschirmfoto-Warnung/-Sperre | Android FLAG_SECURE erzwingbar | Web: weder erkennbar noch verhinderbar → nur Hinweistext. Wird offen benannt (steht so schon in Handbuch A) |
| Push | voll | Web Push auf iOS erst nach „Zum Home-Bildschirm hinzufügen" — das Onboarding muss diesen Schritt aktiv erklären |

## 6 · Vorentscheidungen, die Code blockieren — alle [M]

| # | Entscheidung | Blockiert | Bis wann |
|---|---|---|---|
| 1 | JMStV-Antwort des Fachanwalts (**K1**, seit Nr. 88 als Einzelmandat vorgezogen) | AP-9-Architektur, private Alben (AP-8) | vor S8, ideal vor S1 |
| 2 | ~~Hash-Abgleich-Zugang beantragen~~ **Entschieden am 27.09.2026: wird später beantragt.** Gebaut wird Stufe 1 als **Steckplatz** (Schnittstelle, Zustand „Hash-Prüfung ausstehend", Schalter `P-HASH-AKTIV`); der öffentliche Start bleibt technisch gesperrt, solange der Schalter aus ist. Was in der Testphase gilt → **Nr. 98** | AP-4 ist damit **nicht** mehr blockiert | vor dem öffentlichen Start, nicht vor S3 |
| 3 | Verifizierungsanbieter (Trichtertest mit dreien) — der Vertrag ist seit **Nr. 97** schließbar, weil die GmbH vor T0 entsteht | AP-9 | vor S10 |
| 4 | Endgültiger Name + Domain | Manifest, Apple-Sign-in-Konfiguration | vor S4 |
| 5 | **Hetzner-VPS**, Ubuntu 24.04 LTS, Standort in der EU (Nr. 99, geändert 28.09.2026) — Einrichtung: `server-einrichtung-hetzner.md`; Auftragsverarbeitungsvertrag erst vor dem ersten echten Menschen, Apple-Developer-Konto, E-Mail-Ingest-Anbieter (EU) | AP-0, AP-12 | **vor S4** bzw. S12 |
| 6 | Gerätepool kaufen (altes Android, älteres iPhone) | Performance-Budgets AP-7/AP-15 | Monat 1 (budgetiert: 1.500 €) |

## 7 · Was ich beim Coden ausdrücklich nicht tue

Keine Migration löschen oder überschreiben, keine neue US-Cloud-Abhängigkeit, keine generativen Nutzerinhalte (Eisbrecher sind feste Vorlagen), keine Testdaten in Produktion, kein Zugriff auf echte Nutzerdaten, keine stillschweigende Abweichung von Handbuch A — bei Widerspruch: Rückfrage. Vollständig: `01-steuerung/ki-arbeitsteilung.md`.

## 8 · Startbereitschaft

**S0 (Gerüst) kann ich jederzeit bauen** — es implementiert bewusst keine kritische Logik und endet mit einem lauffähigen, leeren Grundgerüst (Auftrag: `claude-code-kickoff-struktur.md`). *Berichtigt am 27.09.2026 (A-61, A-67): Nach Beschluss Nr. 73 wird **vor T0** gebaut; die Sitzungen liegen in den Fenstern V1 bis V3. Der Satz „erst ab Monat 4" folgte dem Bauplan aus Handbuch A und gilt nicht mehr.* Vollständiger Startplan: `start-der-code-phase.md`. S1–S3 brauchen zusätzlich nur ein Repo und einen Staging-Server — **und die beiden Festlegungen FV-23 und FV-77**, weil S1 das Datenmodell anlegt. Ab S8 wird die JMStV-Antwort zur harten Grenze.
