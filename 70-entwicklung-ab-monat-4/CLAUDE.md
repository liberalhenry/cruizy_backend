# CLAUDE.md

> **Wo diese Datei hingehört:** in die **Wurzel des Code-Verzeichnisses** (`cruizy-code/CLAUDE.md`). Claude Code lädt sie bei **jeder** Sitzung automatisch.
> **Die hier im Projektordner liegende Fassung ist die gepflegte.** Ändert sich etwas, ändert es sich hier zuerst; die Kopie im Code-Verzeichnis wird danach ersetzt.
> **Stand: 28.09.2026 · Aufgabe A-72 · Grundlage: Beschlüsse Nr. 1 bis 103, Spezifikation A-29, Moderationsarchitektur A-37, Code-Planer, Handbuch A und B.**

---

## 0 · Was Cruizy ist

Cruising- und Verbindungs-App für **schwule, bisexuelle und queere Männer** im **DACH-Raum**. Arbeitstitel „Cruizy" (Name endgültig erst nach den Interviews, Nr. 5).

**Gründer:** Henry Luca Kurz, Nicolas Greulich. Rechtsform **GmbH**, gegründet etwa **drei Monate vor T0** (Nr. 97). **T0 = Anfang Juli**, Bestfall 2028, Planungsfall 2029 (Nr. 45).

**Der Unterschied zu den bestehenden Anbietern ist kein Funktionsumfang, sondern eine Haltung:** keine gekaufte Sichtbarkeit, keine exakten Koordinaten, keine Werbung, kein US-Auftragsverarbeiter, und alles, was versprochen wird, steht als prüfbares Kriterium in der Spezifikation. Wer hier Code schreibt, schreibt gegen diese Haltung, nicht nur gegen ein Lastenheft.

---

## 1 · Die Reihenfolge, in der gearbeitet wird

**Beschlossen am 27.09.2026: erst alles fertig bauen, dann prüfen lassen.**

Der Bau läuft vollständig ohne Hash-Abgleich, ohne Anwalt und ohne Steuerberater durch. Erst wenn der Code steht, gehen Produkt und Unterlagen zu allen Prüfstellen:

**Fachanwalt → Korrekturen am Code → Code-Prüfung (18.900 €) → Hash-Anbieter und Prüfanbieter → GmbH gegründet → Produktionsserver → Testphase mit 200 Personen → Markt.**

Diese Reihenfolge ist nicht beliebig: Eine Code-Prüfung vor den Rechtskorrekturen prüft Code, der danach geändert wird.

> ### ⚠ Was daraus für dich folgt
>
> **Zwei Dinge werden auf einer Annahme gebaut**, weil die zuständige Prüfstelle erst später kommt. Beide sind so gebaut, dass ein anderer Ausgang eine Umstellung ist und kein Umbau. **Ändere daran nichts ohne Rückfrage** — siehe Abschnitt 5.

---

## 2 · Stack — nicht verhandelbar

| | |
|---|---|
| **Frontend** | React + Vite + TypeScript als **PWA**. Das ist das Hauptprodukt. React Native / Capacitor folgt in Phase 2 — **jetzt nicht anfangen** |
| **Styling** | Tailwind CSS |
| **Backend** | **Supabase, selbst gehostet.** Niemals Supabase Cloud, niemals Firebase, kein Google-/AWS-/Meta-SDK |
| **Datenbank** | **PostgreSQL 17 + PostGIS** |
| **Bildverarbeitung** | imgproxy (selbst betrieben) |
| **Test** | Vitest · **Lint** ESLint + Prettier |
| **Entwicklungsserver** | **Hetzner-VPS, Ubuntu 24.04 LTS**, Standort **Falkenstein, Nürnberg oder Helsinki** — niemals Ashburn, Hillsboro oder Singapur. Einrichtung: `docs/server-einrichtung-hetzner.md` |
| **Produktionsserver** | offen → **Nr. 103**, fällig vor dem ersten echten Menschen |

### Befehle

```text
npm run dev             Entwicklungsserver
npm test                Tests
npm run lint            Linting
npm run license-check   vor jedem Commit — meldet Copyleft-Konflikte in Abhängigkeiten
```

---

## 3 · Die vier Architekturpunkte, die nicht nachrüstbar sind

Ausführlich in `docs/architektur-regeln.md`. Sie müssen stehen, **bevor** irgendeine Funktion gebaut wird — nachträglich eingebaut heißt: die halbe Anwendung wird umgeschrieben.

### 3.1 Serverseitige Standortunschärfe

Der Client bekommt **niemals** eine exakte Fremdkoordinate. Exakte Koordinaten liegen nur serverseitig zur Berechnung; ausgeliefert wird ausschließlich ein **Entfernungsband**: `< 1 km` · `1–3 km` · `3–10 km` · `> 10 km`. Radien werden auf 10 km gerundet.

**Trilateration muss konstruktiv unmöglich sein, nicht erschwert.** Pflichttest: Drei Anfragen von versetzten Positionen dürfen keine Schnittmenge kleiner als ein Band ergeben.

**Prüffrage vor jedem Commit in diesem Bereich:** *Verlässt an irgendeiner Stelle eine Zahl mit mehr Präzision als ein Entfernungsband den Server?*

### 3.2 Bildaufbereitung — Information zerstören, nicht verdecken

Ein Gaußscher Weichzeichner mit kleinem Radius ist umkehrbar und deshalb **verboten**. Stattdessen:

1. Upload → **EXIF sofort entfernen** → Original **verschlüsselt** ablegen, nie an Clients ausliefern
2. Öffentliche Fassung: Original auf ca. **32 × 42 Pixel** herunterrechnen, dann auf Zielgröße hochskalieren. Die hohe Bildfrequenz ist danach physisch weg
3. Öffentliche und private Fassung liegen unter **getrennten, nicht voneinander ableitbaren** Pfaden und IDs
4. Moderationsprüfung läuft **immer auf dem Original**, nie auf der unkenntlichen Fassung

### 3.3 Löschbarkeit und Export von Anfang an

Jede Tabelle mit Personenbezug braucht **ab der ersten Migration**: eine Löschfunktion, die kaskadiert statt Datenleichen zu hinterlassen, und einen Exportpfad, der alle Daten einer Person maschinenlesbar ausgibt. **Nicht als späteres Feature.**

Abnahme für AP-1: Löschtest hinterlässt **null** verwaiste Zeilen; Export enthält **jede** personenbezogene Spalte.

### 3.4 Kein US-Auftragsverarbeiter (Grundsatz G-01)

> *„Cruizy hält nicht das gesetzliche Mindestmaß des Datenschutzes ein, sondern strebt an, es zu übertreffen. Auftragsverarbeiter mit Sitz oder Datenhaltung in den Vereinigten Staaten von Amerika werden nicht eingesetzt."*

Gilt für Hosting, Datenbank, Medienspeicher, Analytik, Fehlerprotokolle, Chat-Infrastruktur, Authentifizierung. **Vor jeder neuen Abhängigkeit prüfen: Wo sitzt der Anbieter, wo liegen die Daten.** Im Zweifel nachfragen statt installieren.

Ein Ausweichen ist zulässig, wenn eine notwendige Funktion nachweislich nicht anders zu erbringen ist — als **begründete, dokumentierte, befristete Einzelentscheidung** mit der Pflicht, sie bei erster Gelegenheit zurückzunehmen. Das entscheidest **nicht du allein**.

---

## 4 · Sicherheitskritischer Code — Freigabepflicht

Änderungen in diesen Bereichen sind sicherheitskritisch:

```text
supabase/policies/        Row Level Security
src/lib/location/         Standortberechnung
src/lib/media/            Bildpipeline
supabase/functions/       Bildverarbeitung, Hash-Anbindung
```

**Markiere solche Commits als `PRÜFUNG ERFORDERLICH`** und schreibe in zwei Sätzen, was ein Mensch prüfen muss. **Auch wenn alle Tests grün sind.** Grund: Fehler in dieser Art Code sehen oft korrekt aus und sind es nicht — unabhängig davon, wie stark das Modell ist.

---

## 5 · Die zwei Annahmen, auf denen gebaut wird

### 5.1 Die Altersschranke — K1 ist vertagt

**Die Annahme:** Der öffentliche Bereich (Zone 1) löst die Pflicht zur **geschlossenen Benutzergruppe** nach § 4 Abs. 2 JMStV **nicht** aus; nur Zone 2 verlangt eine Altersprüfung.

**Wird sie verworfen,** verlangt *jeder* Zugang eine Prüfung **vor** dem Eintritt: Der Gastzustand fällt weg, die Prüfung wandert an den Anfang des Anmeldewegs, Zone 1 und Zone 2 fallen zusammen.

**Deshalb wird so gebaut:**

| | |
|---|---|
| 1 | Die Altersprüfung ist eine **Schranke im Anmeldeweg**, gesteuert über **`P-PRUEFUNG-VOR-EINTRITT`**. **Beide Stellungen werden gebaut und geprüft**, nicht nur die angenommene |
| 2 | **Zonenregeln sind Daten in einer Tabelle**, keine Bedingungen im Programmtext |
| 3 | Der **Prüfanbieter hängt an einer Schnittstelle mit Attrappe** — S10 ist ohne Vertrag baubar und prüfbar |

### 5.2 Der Hash-Abgleich — Steckplatz statt Anbieter

Der Zugang zu den Hash-Listen wird **nach dem Bau** beantragt (Nr. 98, Weg b).

| | |
|---|---|
| Gebaut wird | die **vollständige** Prüfkette. Stufe 1 als **Schnittstelle mit Attrappe** |
| Schalter | **`P-HASH-AKTIV`**, Voreinstellung **aus** |
| Zustand | jedes in dieser Zeit freigegebene Bild trägt **„Hash-Prüfung ausstehend"**, dauerhaft abfragbar, mit Nachlauf bei Anbindung |
| **Harte Sperre** | Solange der Schalter aus ist, lässt sich **kein Betrieb mit echten Menschen** freigeben — Testphase **und** öffentlicher Start (**AK-M02-11**). Die Sperre steht **im Code**, nicht in einer Absprache. **Entferne sie nicht.** |
| Zwei Bauformen | Die Schnittstelle bildet **Hash-Übermittlung und Medien-Übermittlung** ab (AK-M02-13), weil offen ist, was der Anbieter verlangt. Die Wahl steht in einer Einstellung |
| Treffer-Weg | wird **gebaut und mit Testdaten geprüft**, obwohl er nicht auslösen kann |

---

## 6 · Das System in Kurzform

### 6.1 Kontozustände

| Zustand | Was geht | Was nicht |
|---|---|---|
| **Gast** — Stufe 1 nicht bestanden | App öffnen, umsehen, mit Konto das eigene Profil | schreiben, buchen |
| **Geprüft** — Stufe 1 bestanden | alles Übrige | — |
| **Identifiziert** — *offen, Nr. 40* | der private explizite Bereich (Z-03) | — |

**Die Schranke ist hart:** Ohne bestandene Stufe 1 wird nichts gesendet und nichts gebucht. „Später" schickt nichts ab. „Geprüft" heißt **Stufe 1 der Altersprüfung** — die Fotoprüfung (F06) bleibt ein freiwilliges Zeichen und wird **nie** zur Bedingung.

### 6.2 Die drei Moderationszonen (M-01)

| | **Zone 1 — öffentlich** | **Zone 2 — privat** | **Zone 3 — gemeldet** |
|---|---|---|---|
| Was | Profilbilder im Raster, samt Originalen unkenntlicher Fotos | Bilder im Gespräch und in privaten Alben | alles Gemeldete |
| Klassifikator | ja | **nein** | nein — ein Mensch schaut |
| Hash-Abgleich | ja | nur bei eingeschaltetem Schalter (M-09) | ja |
| Menschliche Prüfung | nur der Graubereich | **nie ohne Anlass** | immer |
| Rechtlich | Hosting öffentlicher Inhalte | interpersonelle Kommunikation | Art. 16 DSA |

### 6.3 Die Prüfkette (M-02)

`Dateityp und Größe` → `EXIF entfernen` → `neu kodieren` → `Original verschlüsselt ablegen` → **`Stufe 1 Hash`** → **`Stufe 2 Klassifikator`** → **`Stufe 3 Mensch`** (nur Graubereich) → `Freigabe`

Zusammen unter **`P-PRUEFKETTE`** = 500 ms. Klassifikator **auf eigenen Servern** — kein Bild verlässt dafür die Infrastruktur (AK-M02-07). Klassifikatorwerte werden **nach der Entscheidung gelöscht** (AK-M02-08).

### 6.4 Zusatzanforderungen

`Z-01` Sicherheitsmitteilungen · `Z-02` Statusseite · `Z-03` Altersprüfung Stufe 2 · `Z-04` iPhone-Installation · `Z-05` Abo · `Z-06` Codes · `Z-07` Rückmeldefeld · `Z-08` Unterstützer-Beitrag · `Z-09` Wiederherstellung · `Z-10` Anmeldung mit Mobilnummer

### 6.5 Wiederherstellung des Zugangs (Z-09)

Das Konto kennt **weder Telefonnummer noch Klarnamen noch Geburtsdatum** — bewusst.

| Weg | Pflicht |
|---|---|
| **Wiederherstellungscode** — beim Anlegen, einmal angezeigt, nur als Prüfwert gespeichert | jeder bekommt ihn |
| **Zweiter Anmeldeweg** — E-Mail oder Mobilnummer | freiwillig |
| **Vertrauensperson** — eine genügt (`P-WIEDERHERSTELLUNG-SCHWELLE` = 1) | freiwillig |
| **Zahlungsbeleg** — still im Hintergrund | nur für Zahlende |
| **Synchronisierte Passkeys** (iCloud, Google) | **nie** — G-01, Nr. 69, Nr. 100 |

**Gerätegebundene Schlüssel sind ein Anmeldeweg, kein Wiederherstellungsweg** — ist das Gerät weg, ist der Schlüssel weg.

**Schutz bei Schwelle 1 (Nr. 95, Nr. 100):** `P-WHR-WARTEFRIST` (72 h) zwischen Anstoß und Übergabe · Abbruchrecht in der Frist · benachrichtigt wird **nur die Person selbst** (altes Gerät + hinterlegte Adresse), **keine weitere Vertrauensperson** · ohne Empfänger wird der Weg **gar nicht angeboten**.

**Der Server speichert weder Namen noch Kontaktwege noch die Zahl der Vertrauenspersonen** (AK-Z09-04, Nr. 86). Jede erhält eine vollständige, verschlüsselte Kopie des Schlüssels — übergeben über die eigene Nachrichten-App der Person, nicht über uns.

---

## 7 · Was ausdrücklich **nicht** gebaut wird

Vollständig in Abschnitt 13 der Spezifikation. **Diese Liste ist kein Backlog.**

| Nie | |
|---|---|
| Sozialer Feed · Stories · Wischmechanik | falsche Produktlogik, doppelte Moderationslast |
| „Wer hat mich angesehen"-Zähler | eine Zahl anzeigen und das Auflösen verkaufen |
| **Ausschlussfilter** nach Ethnie, Körperform, HIV-Status | dokumentierter Diskriminierungsschwerpunkt |
| **Werbung** im Raster oder Chat | meistgenannte Einzelbeschwerde der Auswertung |
| KI-Chatbot, KI-Profiltexte | Echtheit ist das gesamte Vertrauensversprechen |
| Serien, Punkte, Stufen | erzeugt zwanghafte Nutzung |
| **Anmelden mit Google oder Meta** | würde die Nutzung gegenüber einem Werbekonzern offenlegen |
| **Exakte Personen-Pins** | bekannter Schwachpunkt kartenbasierter Anbieter |
| Öffentliche Gruppen und Foren · Escort-Bereich | Belästigung, Store-Richtlinien |
| **Lesebestätigung** | erzeugt Antwortdruck und verrät Anwesenheit |
| Profilaufruf-Statistiken als Bezahlköder · Nachrichtenlimits · grüner Onlinepunkt | Handbuch A |
| Boosts (ab 50.000 MAU wiedervorlegen) · Videoanrufe (ab 40.000 MAU) | vertagt, nicht gestrichen |

**In der Moderation nie:** Klassifikator in Zone 2 · Stichproben in privaten Chats · Durchsuchbarkeit von Zone 2 im Backend · Vorschaubilder bei Hash-Treffern · **automatische Kontosperre** (Art. 22 DSGVO) · Moderationsdienstleister außerhalb der EU · Speicherung von Klassifikatorwerten nach der Entscheidung.

---

## 8 · Parameter

**Alle Stellschrauben stehen in Abschnitt 15 der Spezifikation** — derzeit **109 Stück**, jede mit Vorgabewert, Begründung und Fundstelle. Sie gehören in **eine Konfigurationstabelle**, nicht verstreut als Konstanten in den Code.

Die für den Bau wichtigsten:

| Parameter | Vorgabe | Wofür |
|---|---|---|
| `P-PRUEFUNG-VOR-EINTRITT` | **aus** (ANNAHME zu K1) | Altersprüfung vor dem Zugang oder erst vor Zone 2 |
| `P-HASH-AKTIV` | **aus** | Stufe 1 der Prüfkette; sperrt jeden Betrieb mit echten Menschen |
| `P-PRUEFKETTE` | 500 ms | Obergrenze der Stufen 0 bis 2 |
| `P-ZELLE-GROB` / `P-ZELLE-NAH` | 2 × 2 km / 500 × 500 m | Rasterzellen der Standortarchitektur |
| `P-ERSATZPUNKT-MAX-KM` / `-MIN-KM` | 30 km / 2 km | Ersatzpunkt bei Wirkung E |
| `P-ZONEN-MAX` | 5, für alle gleich | Zonen je Konto |
| `P-BILD-EMPFANG` | „Nach der ersten Antwort“ | drei Stellungen: Antwort · Bestätigung · immer |
| `P-LOESCH-NACHLAUF` | 14 Tage | gesperrter Speicher nach der Kontolöschung |
| `P-VOLLJAEHRIG-EINSPRUCH` | 7 Tage | Einspruchsfrist, ⚠ unter Vorbehalt von K6 |
| `P-ALTER-NACHFRAGE` | 12 Monate | danach fragt die App einmal nach |
| `P-WHR-WARTEFRIST` | 72 Stunden | Wiederherstellung über Vertrauensperson |
| `P-ABSICHT-DAUERN` | 1 h · 2 h · 4 h · 8 h · bis morgen früh · dieses Wochenende | freie Wahl, größter Eintrag ist die Obergrenze |
| `P-NACHRICHT-MAX` | 2.000 Zeichen | |
| `P-KARENZ` | 30 Tage | |

---

## 9 · Ordnerstruktur

```text
cruizy-code/
├── CLAUDE.md               diese Datei
├── apps/web/               React + Vite PWA
│   └── src/
│       ├── features/       auth, profile, discovery, today, chat, safety
│       ├── lib/            location/ media/ supabase/   ← sicherheitskritisch
│       └── components/
├── supabase/
│   ├── migrations/         nur hinzufügen — nie löschen, nie überschreiben
│   ├── policies/           Row Level Security, dokumentiert
│   └── functions/          Bildverarbeitung, Hash-Anbindung
├── packages/shared/        geteilte Typen für die spätere native App
├── docs/                   siehe unten
└── scripts/
```

**In `docs/` gehören** (ablegen, nicht neu schreiben): `handbuch-a.md` · `handbuch-b.md` · `produktspezifikation.md` · `moderationsarchitektur.md` · `systemtexte.md` · `nutzerablaeufe.md` · `architektur-regeln.md` · `server-einrichtung-hetzner.md`. Claude Code liest sie **nur bei Bedarf**, nicht in jeder Sitzung.

---

## 10 · Der Bauplan

**16 Arbeitspakete:** AP-0 Infrastruktur · AP-1 Datenmodell und Löschbarkeit · AP-2 Standortarchitektur · AP-3 Bildpipeline · AP-4 Moderations-Grundgerüst · AP-5 Auth und Gastmodus · AP-6 Profil und Einwilligung · AP-7 Raster und Entdecken · AP-8 Chat · AP-9 Verifizierung und Schranken · AP-10 Blockieren und Melden · AP-11 Sicherheitszentrum · AP-12 Reiter „Heute" · AP-13 Datenkonto · AP-14 Antwortquote · AP-15 Härtung und Beta.

**Kritischer Pfad:** `AP-0 → 1 → 2 → 7` (Raster sichtbar) und parallel `AP-0 → 1 → 3 → 4` (kein Bild ohne Prüfkette).

### Sitzungen und ihre Voraussetzungen

| Sitzung | Inhalt | Braucht vorher |
|---|---|---|
| **S0** | Gerüst, leere Anwendung, Ordner | nichts |
| **S1** | Datenmodell, Löschkaskaden, Export | nichts — FV-23 und FV-77 sind entschieden |
| **S2** | Standortarchitektur | nichts |
| **S3** | Bildpipeline mit Steckplatz | nichts |
| **S4** | Anmeldung, Gastmodus, Sicherungen | **Entwicklungsserver** · Domain als Konfigurationswert · Mail- und SMS-Versand |
| **S5–S6** | Profil, Einwilligungsfluss | Vertrauenspersonen nach Nr. 100 |
| **S7** | Raster, Entdecken | nichts |
| **S8–S9** | Gespräche mit allen Schranken | auf der K1-Annahme, **beide** Stellungen bauen |
| **S10** | Verifizierung | nichts — Prüfanbieter als Attrappe |
| **S11** | Blockieren, Melden, Datenkonto | nichts |
| **S12** | „Heute", Sicherheitszentrum | Nr. 101 (redaktionelle Einträge) · Store-Konten |
| **S13** | Antwortquote, Härtung | nichts |

---

## 11 · Der Entwicklungsserver

**Hetzner-VPS, Ubuntu 24.04 LTS, Standort in der EU.** Einrichtung vollständig in `docs/server-einrichtung-hetzner.md`.

> ### ⚠ Zwei Fallen, die dort schon behoben sind — bau sie nicht zurück
>
> **1 · PostGIS und der Suchpfad.** Im selbst gehosteten Supabase laufen PostGIS-Abfragen im SQL-Editor, scheitern über `rpc()` aber mit `type "geometry" does not exist`. Ursache ist der Suchpfad der Rolle, mit der PostgREST verbindet. Behoben über `search_path` **aller** Rollen — `anon`, `authenticated`, `service_role`, `authenticator` **und der Migrationsrollen** `postgres`, `supabase_admin`. Ohne letztere scheitert schon ein `CREATE TABLE` mit einer `geometry`-Spalte. **Ein Rauchtest prüft es über den echten Weg.**
>
> **2 · Docker unterläuft die Firewall.** Docker schreibt seine Weiterleitungsregeln unterhalb von ufw. Ein Container, der `0.0.0.0:5432` öffnet, ist aus dem Internet erreichbar, obwohl `ufw status` „deny incoming" meldet. Alle Anschlüsse sind deshalb auf `127.0.0.1` gebunden. **Zugriff nur über SSH-Tunnel.**

**Regel für die gesamte Bauzeit: auf dem Entwicklungsserver liegen ausschließlich erfundene Daten.** Keine Wartelistenadressen, keine Interviewaufnahmen, keine Umfrageantworten. Ab dem ersten echten Menschen greift die DSGVO vollständig, und dann braucht es Auftragsverarbeitungsvertrag, Verarbeitungsübersicht und Folgenabschätzung.

---

## 12 · Abnahme, Tests, Geheimnisse

### Abnahme

Jede Sitzung endet mit **einem** Commit und einem **Abnahmeprotokoll**: was gebaut wurde, welche Tests laufen, was ein Mensch prüfen muss. Sicherheitskritisches wird als **`PRÜFUNG ERFORDERLICH`** markiert.

### Tests

| Bereich | Pflicht |
|---|---|
| **Standort** | Property-Test „keine Ausgabe verlässt den Server präziser als ein Band" · expliziter Trilaterations-Testfall |
| **Löschung** | Löschtest hinterlässt null verwaiste Zeilen |
| **Export** | enthält jede personenbezogene Spalte |
| **Bildpipeline** | EXIF weg · Original nie ausgeliefert · öffentliche Fassung nicht zurückrechenbar |
| **Schranken** | **beide** Stellungen von `P-PRUEFUNG-VOR-EINTRITT` |

### Geheimnisse

Nie im Code, nie im Verlauf, nie in einer Migration. `.env.example` enthält **Platzhalter**, keine echten Werte. Die Datei `.env` steht in `.gitignore` und hat Rechte `600`.

### Migrationen

**Nur hinzufügen. Nie löschen, nie überschreiben.** Auch nicht, wenn die letzte fehlerhaft war — dann kommt eine neue, die es richtigstellt.

---

## 13 · Sprache und Texte

**Die Anwendung spricht Deutsch.** Alle sichtbaren Texte stehen in `docs/systemtexte.md` — **409 Einträge** mit ID, Zeichengrenze, Status und Fundstelle.

**Schreibe keine Oberflächentexte selbst.** Verwende die ID (`ST-CHAT-70`, `ST-DAT-18`, …). Fehlt ein Text, **fordere ihn an**, statt einen zu erfinden — die Texte sind auf Zeichengrenzen geprüft, auf Ausrufezeichen, auf Emoji und auf Wörter wie „sicher", „garantiert", „niemals", die eine Zusage machen, die das Produkt nicht halten kann.

---

## 14 · Wo du nicht allein entscheidest

- **Keine neue Abhängigkeit** von einem US-Anbieter — und bei jeder anderen: Sitz und Datenhaltung prüfen
- **Keine Änderung** an den vier Punkten aus Abschnitt 3
- **Die Sperre aus `P-HASH-AKTIV` nicht entfernen oder umgehen**
- **Keine Migration** löschen oder überschreiben
- **Nichts aus Abschnitt 7 bauen**, auch nicht „nur als Vorbereitung"
- **Keinen Oberflächentext erfinden**
- **Bei jedem Widerspruch zwischen Dokumenten: nachfragen.** Handbuch A und B sind Wahrheitsquellen und werden **nicht** geändert (Nr. 81) — ein Widerspruch wird **benannt**, nicht stillschweigend aufgelöst

**Und die Regel, die über allen steht:** Wenn du etwas nicht weißt, **erfinde es nicht**. Kennzeichne es als `ANNAHME` oder `BEISPIELWERT` und frag nach. Ein falscher Wert, der plausibel aussieht, ist teurer als eine offene Frage.

---

## 15 · Die Quellen, nach Rang

| Rang | Quelle | Gilt für |
|---|---|---|
| 1 | **Handbuch A** | Produkt, Technik, Recht — unverändert, Nr. 81 |
| 2 | **Handbuch B** | Wirtschaft, Kosten, Marketing — unverändert |
| 3 | **Beschlüsse** (`offene-entscheidungen.md`, Nr. 1–103) | schlagen ältere Festlegungen |
| 4 | **Produktspezifikation** (A-29) | 75 Funktionen, 677 geltende Akzeptanzkriterien, 97 Festlegungen, 32 Widersprüche, 109 Parameter, 13 Anwaltsfragen |
| 5 | **Moderationsarchitektur** (A-37) | verbindliche Vorgabe für alles Moderative |
| 6 | **Systemtexte** (A-14), **Nutzerabläufe** (A-30), **Wireframes** (A-15) | Oberfläche |

**Ein neuerer Beschluss schlägt eine ältere Festlegung. Eine Festlegung schlägt eine Vermutung. Eine Vermutung wird gekennzeichnet.**
