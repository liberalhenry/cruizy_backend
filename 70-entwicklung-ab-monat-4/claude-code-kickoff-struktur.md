# Kickoff für Claude Code — Struktur und erste Programmierschritte

Drei Teile: zwei Dateien, die ihr im Projekt anlegt, und ein Arbeitsauftrag, den ihr als erste Nachricht in Claude Code eingebt. `CLAUDE.md` wird automatisch bei jeder Sitzung geladen — deshalb bleibt sie kurz, Details stehen in `docs/architektur-regeln.md` und werden nur bei Bedarf gelesen.

**Zum Modell:** Für dieses Kickoff reicht ein günstigeres Modell als Standard — reines Gerüst, keine schwierige Architekturentscheidung. Fable 5 lohnt sich ab dem Punkt, an dem es um die Standort- und Bildarchitektur selbst geht (Phase 1a, siehe unten), nicht für das Anlegen von Ordnern und Konfigurationsdateien.

---

## Datei 1 — `/CLAUDE.md` (Projekt-Root)

```markdown
# CLAUDE.md

Projekt: Cruizy (Arbeitstitel) — Cruising- und Verbindungs-App für schwule Männer, DACH.
Vollständige Spezifikation: `docs/handbuch-a.md`. Diese Datei ist die Kurzfassung für jede Sitzung.

## Stack
- Frontend: React + Vite + TypeScript, als PWA. Hauptprodukt — React Native folgt erst in Phase 2, noch nicht anfangen.
- Backend: Supabase, **selbst gehostet**. Für **Bau, Prüfläufe und Staging** auf einem **Hetzner-VPS mit Ubuntu 24.04 LTS**, Standort **Falkenstein, Nürnberg oder Helsinki** — niemals Ashburn, Hillsboro oder Singapur (G-01), ausschließlich mit erfundenen Daten (Nr. 99, geändert am 28.09.2026; vorher hosttech). Die **Produktion** folgt später, Größe und Anbieter in **Nr. 103**. Niemals Supabase Cloud, niemals Firebase, kein Google-/AWS-/Meta-SDK. Einrichtung: `server-einrichtung-hetzner.md`.
- Datenbank: PostgreSQL 17 + PostGIS
- Styling: Tailwind CSS
- Test: Vitest · Lint: ESLint + Prettier

## Befehle
- `npm run dev` — Dev-Server
- `npm test` — Tests
- `npm run lint` — Linting
- `npm run license-check` — vor jedem Commit, meldet copyleft-Konflikte in Abhängigkeiten

## Nicht verhandelbar
Ausführlich in `docs/architektur-regeln.md` — vor der ersten Implementierung lesen. Kernpunkte:
1. Der Client erhält nie eine exakte Fremdkoordinate — nur serverseitig berechnete Entfernungsbänder.
2. Bilder: Original bleibt am Server. Öffentliche Fassung entsteht über eine 32×42-Zwischenstufe (Information zerstören, nicht verdecken). Getrennte, nicht ableitbare Ablage.
3. Datenmodell unterstützt von Anfang an vollständige Löschung und Export.
4. EXIF-Daten werden bei jedem Upload sofort entfernt.

## Freigabepflicht
Änderungen in `supabase/policies/`, `src/lib/location/`, `src/lib/media/` sind sicherheitskritisch.
Claude markiert solche Commits als `PRÜFUNG ERFORDERLICH` und beschreibt kurz, was ein Mensch prüfen muss. Nie stillschweigend als fertig behandeln.

## Struktur
```
cruizy/
├── apps/web/           React + Vite PWA
│   └── src/
│       ├── features/   auth, profile, discovery, today, chat, safety
│       ├── lib/        location/ media/ supabase/  ← sicherheitskritisch
│       └── components/
├── supabase/
│   ├── migrations/     nur hinzufügen, nie löschen oder überschreiben
│   ├── policies/        Row Level Security, dokumentiert
│   └── functions/       Bildverarbeitung, Hash-Abgleich-Anbindung
├── packages/shared/     geteilte Typen für spätere native App
├── docs/
└── scripts/
```

## Claude entscheidet hier nicht autonom
- Keine neue Abhängigkeit von einem US-Cloud-Anbieter
- Keine Änderung an den vier Punkten unter „Nicht verhandelbar" ohne Rückfrage
- Keine Migration löschen oder überschreiben, nur neue hinzufügen
- Bei Widerspruch zur Spezifikation in `docs/`: nachfragen statt selbst entscheiden

## Vertiefend, nur bei Bedarf lesen
- `docs/architektur-regeln.md` — Begründung der vier Kernpunkte
- `docs/handbuch-a.md` — vollständige Produkt- und Technikspezifikation
```

---

## Datei 2 — `/docs/architektur-regeln.md`

```markdown
# Architekturregeln — verbindlich, nicht rückwirkend änderbar

Diese vier Punkte müssen stehen, bevor irgendeine Funktion gebaut wird. Nachträglich eingebaut bedeutet: die halbe Anwendung wird umgeschrieben.

## 1. Serverseitige Standortunschärfe
Der Client — egal ob eigener oder fremder Nutzer — erhält niemals eine exakte Koordinate einer anderen Person. Die Datenbank speichert exakte Koordinaten nur serverseitig zur Berechnung; ausgeliefert wird ausschließlich ein Entfernungsband (< 1 km · 1–3 km · 3–10 km · > 10 km). Trilaterationsangriffe müssen dadurch konstruktiv unmöglich sein, nicht nur erschwert.

**Prüffrage vor jedem Commit in diesem Bereich:** Verlässt an irgendeiner Stelle eine Zahl mit mehr Präzision als ein Entfernungsband den Server?

## 2. Bildaufbereitung — Information zerstören, nicht verdecken
Ein Gaußscher Weichzeichner mit kleinem Radius ist umkehrbar und deshalb verboten. Stattdessen:
1. Original hochladen → EXIF sofort entfernen → Original verschlüsselt ablegen, nie an Clients ausliefern.
2. Öffentliche Fassung: Original auf ca. 32×42 Pixel herunterrechnen, dann auf Zielgröße hochskalieren. Die hohe Bildfrequenz ist danach physisch nicht mehr vorhanden.
3. Öffentliche und private Fassung liegen unter getrennten, nicht voneinander ableitbaren Pfaden/IDs.
4. Moderationsprüfung (Hash-Abgleich, NSFW-Filter) läuft immer auf dem Original, nie auf der weichgezeichneten Fassung.

## 3. Löschbarkeit und Export von Anfang an
Jede Tabelle mit Personenbezug braucht von der ersten Migration an: eine Löschfunktion, die kaskadiert statt Datenleichen zu hinterlassen, und einen Exportpfad, der alle Daten einer Person maschinenlesbar ausgibt. Nicht als späteres Feature nachrüsten.

## 4. Kein US-Auftragsverarbeiter
Gilt für Hosting, Datenbank, Medienspeicher, Analytik, Fehlerprotokolle, Chat-Infrastruktur, Authentifizierung. Vor jeder neuen Abhängigkeit prüfen: Wo sitzt der Anbieter, wo liegen die Daten. Im Zweifel nachfragen statt installieren.

## Sicherheitskritischer Code — immer Freigabepflicht
Auch wenn Tests grün sind: Code in den oben genannten Bereichen wird als `PRÜFUNG ERFORDERLICH` markiert. Grund: Fehler in dieser Art Code sehen oft korrekt aus und sind es nicht — das gilt unabhängig davon, wie stark das verwendete Modell ist.
```

---

## Erster Arbeitsauftrag — als Nachricht in Claude Code einfügen

```
Lies CLAUDE.md und docs/architektur-regeln.md, dann richte das Projekt ein.

Diese erste Sitzung baut ausschließlich das Fundament — keine Funktionen, kein Chat,
keine Verifizierung. Das kommt in späteren Sitzungen.

1. Lege die Ordnerstruktur aus CLAUDE.md an.
2. Initialisiere apps/web als React + Vite + TypeScript mit Tailwind CSS.
3. Richte ESLint und Prettier mit dokumentierter Konfiguration ein.
4. Richte Vitest ein, schreibe einen Beispieltest, der zeigt, dass die Umgebung läuft.
5. Erstelle .env.example mit Platzhaltern für Supabase-URL, Supabase Anon Key,
   Verifizierungsanbieter-Key — keine echten Werte.
6. Erstelle in supabase/migrations eine erste Migration mit den Tabellen users und
   profiles. Kommentiere im SQL, wo später Standort- und Bilddaten nach den Regeln
   aus docs/architektur-regeln.md ergänzt werden — implementiere diese Logik noch nicht.
7. Richte die Lizenzprüfung ein (z. B. license-checker) als npm-Skript.
8. Erstelle README.md: Projektübersicht in zwei Sätzen, Setup-Anleitung, Verweis auf
   CLAUDE.md.
9. Markiere die Migration aus Schritt 6 als PRÜFUNG ERFORDERLICH.

Nicht tun: keine Chat-Funktion, keine Registrierungs-UI, keine Anbindung an einen
echten Verifizierungsanbieter, keine Bildverarbeitung implementieren. Diese Sitzung
endet mit einem lauffähigen, leeren Grundgerüst und einem einzigen Commit.
```

---

## Danach ablegen, nicht neu erstellen

Legt `docs/handbuch-a.md` und `docs/handbuch-b.md` mit den Inhalten der beiden bereits erstellten Handbücher an. Claude Code liest sie dann nur, wenn eine Aufgabe konkret danach verlangt — nicht bei jeder Sitzung, das würde unnötig Kontext verbrauchen.
