# Entwicklung — vor T0 (Nr. 73) und danach

> **Berichtigt am 26.09.2026 (A-61):** Der Ordner hieß „ab Monat 4", weil Handbuch A den Bau in die Roadmapmonate 4 bis 9 setzt. **Nach Beschluss Nr. 73 wird vor T0 gebaut** — die Sitzungen S0 bis S13 liegen in den Vorbereitungsfenstern V1 bis V3. Herleitung: `../01-steuerung/zeitplan-bis-start.md`, Abschnitt „Wo der Bau liegt".

**Zuerst lesen, wenn es losgeht: `einrichtung-vor-dem-ersten-code.md`** (was einzurichten ist) **und `start-der-code-phase.md`** (wie es aufgebaut sein muss). **Zentral für das Was: `code-planer.md`** — 15 Arbeitspakete mit Abhängigkeitsgraph, Schnittstellen, KI-Einstufung je Funktion und Sitzungsplan S0–S13.
Daneben die Kickoff-Struktur für Claude Code (CLAUDE.md-Vorlage, Architekturregeln, erster Arbeitsauftrag = Sitzung S0).
Vier Architekturpunkte vor jeder Funktion: Standortunschärfe, Bildpipeline, Löschbarkeit, kein US-Auftragsverarbeiter. Sicherheitskritischer Code immer mit PRÜFUNG ERFORDERLICH.

## Inhalt

| Datei | Inhalt | Stand |
|---|---|---|
| `code-planer.md` | Arbeitspakete AP-0 bis AP-15, Abhängigkeiten, Schnittstellen, Einstufung [KI] / [KI→R] / [M], Sitzungsplan | 24.07.2026; Hinweis auf die Korrekturliste der Spezifikation seit 17.09.2026 |
| `entwicklungsmodelle.md` | Wer baut und wie abgesichert: vier Modelle mit Kosten und Risiko, acht Lücken im Bauplan, eine Abnahmeliste je Sitzung | A-46 |
| `bauplan-zwei-plattformen.md` | **Neu:** Wie Web und native Apps zusammen gebaut werden — Capacitor statt zweiter Codebasis, was geteilt und was doppelt ist, die drei Schutzfunktionen ehrlich je Betriebssystem, +29 % Mehraufwand, die acht Lücken als Arbeitspakete und das Abnahmeprotokoll je Sitzung | A-51 · 20.09.2026 |
| `eu-alternativen-stack.md` | **Neu:** Ersatz für Sentry und RevenueCat nach Grundsatz G-01 — mit dem Befund, dass RevenueCat in Phase 1 gar nicht gebraucht wird, und der neu entdeckten Lücke Zahlungsdienstleister | A-53 · 20.09.2026 |
| `CLAUDE.md` | **Neu:** Die Datei, die Claude Code bei **jeder** Sitzung lädt — Stack, die vier nicht nachrüstbaren Architekturpunkte, sicherheitskritische Bereiche, die zwei Annahmen (K1, Hash), Kontozustände, Moderationszonen, Wiederherstellung, die Nie-bauen-Liste, Parameter, Sitzungsplan, Serverfallen, Abnahme- und Testregeln, Quellenrang. **Gehört in die Wurzel des Code-Verzeichnisses**; hier liegt die gepflegte Fassung | A-72 · 28.09.2026 |
| `claude-code-kickoff-struktur.md` | CLAUDE.md-Vorlage, Architekturregeln, erster Arbeitsauftrag (Sitzung S0) | Grundlagendokument seit Projektstart |
| `start-der-code-phase.md` | **Neu:** Was vor der ersten Zeile gebraucht wird (Konten, Zugänge, Geräte), wie das Projekt aufgebaut sein muss (drei Umgebungen, Abnahme-, Test- und Geheimnisregel), **eigener Server gegen gemieteten** mit der Preisanpassung vom 15.06.2026, die Voraussetzungen je Sitzung S0–S13, die Kosten und der Startvorschlag in drei Stufen | A-67 · 26.09.2026 |
| `einrichtung-vor-dem-ersten-code.md` | **Neu:** Die Einkaufs- und Einrichtungsliste — was Henry einrichten muss, in welcher Reihenfolge, mit den **am 27.09.2026 gemessenen** Fähigkeiten der drei beteiligten Orte (Arbeitsumgebung der KI, Claude auf dem Rechner, Windows und hosttech). Befund: Codeberg und GitLab sind gesperrt, PostgreSQL mit PostGIS läuft bei der KI, Docker nur auf dem Server. **Jetzt gebraucht: ein leeres verbundenes Verzeichnis, 0 €** | A-70 · 27.09.2026 |
| `server-einrichtung-hetzner.md` | **Neu:** Schritt-für-Schritt-Anleitung für den **Entwicklungsserver auf einem Hetzner-VPS** mit Ubuntu 24.04 — Standortwahl (G-01!), Härtung, Docker, selbst gehostetes Supabase, PostGIS mit Rauchtest, Sicherung mit geprobter Rückspielung. Gepflegte Fassung; die Mitnahmefassung liegt im Paket | A-71 · 28.09.2026 |
| `server-paket/` | **Neu:** genau eine Datei zum Hochladen — `cruizy-server-setup.zip` (40 KB, 18 Dateien, Fassung 1.0) mit Prüfsumme und Hochladeanleitung in der README daneben | A-71 · 28.09.2026 |

## Woanders, aber für die Entwicklung maßgeblich

- `../02-ki-aufgaben/aufgaben-entwicklung.md` — die Sitzungsaufträge S0 bis S13, seit 17.09.2026 mit der Zuordnung zur Spezifikation.
- `../50-produkt-prototyp/produktspezifikation.md` — die prüfbare Fassung des Funktionskatalogs (A-29, Vorfassung); ihre Akzeptanzkriterien werden Tests.
- `../50-produkt-prototyp/moderationsarchitektur.md` — verbindliche Vorgabe für AP-4 und das Moderations-Backend (A-37).
