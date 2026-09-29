# KI-Aufgabensystem — Arbeitsanweisung

Angelegt: 24.07.2026 · Gilt für Claude (Fable/Opus/Sonnet) in jeder Sitzung, auch künftigen. **Dieses Dokument zuerst lesen, dann die Aufgabendateien.**

## Wie dieses System funktioniert (der Arbeitszyklus)

1. **Lesen.** Zu Beginn jeder Arbeitssitzung — und erneut nach jeder abgeschlossenen Aufgabe — dieses README lesen, dann die Übersichtstabellen in `aufgaben-phase-0.md` und `aufgaben-entwicklung.md`.
2. **Wählen.** Die nächste Aufgabe ist: die vom Nutzer ausdrücklich genannte — sonst die **oberste offene (☐) Aufgabe ohne offenen Blocker** in der Reihenfolge der Tabelle. Aufgaben mit Status ⏳ (wartet auf Mensch) werden übersprungen, aber im Chat benannt.
3. **Ausführen.** Den vollständigen Prompt im Aufgabenblock befolgen: die angegebene **Rolle einnehmen**, die Kontextdokumente lesen, das Ergebnis im angegebenen Format am angegebenen Ort ablegen und dem Nutzer präsentieren.
4. **Abhaken.** Nach Erledigung **drei** Stellen aktualisieren: (a) in der Übersichtstabelle die Status-Spalte rechts von ☐ auf ☑ setzen mit Datum, (b) im Aufgabenblock die Status-Zeile ergänzen: `☑ erledigt am TT.MM.JJJJ, HH:MM Uhr — Ergebnis: <Pfad>`, (c) **einen Eintrag in `01-steuerung/log.md`** anlegen (Format dort, neueste oben). Zusätzlich den passenden Punkt in `01-steuerung/roadmap.md` abhaken und neue Entscheidungen in `01-steuerung/offene-entscheidungen.md` eintragen, falls vorhanden.
5. **Ergänzen.** Fällt während der Arbeit eine neue sinnvolle KI-Aufgabe auf, wird sie ans Ende des passenden Abschnitts angefügt — im Standardformat (unten), mit **Datum der Idee** und **wofür sie dient**. Die Liste darf wachsen; bestehende Prompts werden nicht gelöscht, nur ergänzt oder als `verworfen am … weil …` markiert.
6. **Blocker melden.** Hängt eine Aufgabe an einer Menschen-Handlung (Status ⏳), am Ende der Sitzung kurz auflisten, was die Gründer tun müssen, damit es weitergeht.

## Statusnotation (Spalte rechts in den Tabellen)

| Zeichen | Bedeutung |
|---|---|
| ☐ | offen — kann von der KI begonnen werden |
| ⏳ | wartet auf Menschen-Input oder Vorentscheidung (Blocker im Block benannt) |
| ☑ TT.MM. | erledigt, mit Datum; Ergebnispfad steht im Aufgabenblock |
| ◐ TT.MM. | teilweise erledigt — ein Teil liegt vor, der Rest bleibt offen (Grund steht im Block) |
| 🔁 | wiederkehrend — wird nie abgehakt, sondern bekommt Log-Zeilen mit Datum im Block |

## Regeln für jede Aufgabe (Kurzfassung der verbindlichen Dokumente)

1. **Wahrheitsquellen:** Handbuch A (Produkt/Technik/Recht) und Handbuch B (Wirtschaft) in `00-grundlagen/`. Widerspricht eine Aufgabe ihnen, wird das benannt — nie stillschweigend entschieden. Arbeitsteilung im Detail: `01-steuerung/ki-arbeitsteilung.md`.
2. **Rollen:** Jeder Prompt nennt eine Rolle (Marketingstratege, beratender Jurist, UX-Researcher, Architekt …). Die Rolle bestimmt Tonfall, Tiefe und Prüfmaßstab — maximal professionell, als würde ein Senior die Firma beraten.
3. **Fakten:** Gegenwartsbezogene Fakten (Recht, Preise, Anbieter, Fristen) vor Verwendung per Websuche verifizieren; Quellen angeben; Unbekanntes erfragen, nie annehmen. Förderangaben sind immer „Form der Frage", vor Antrag beim Träger zu verifizieren.
4. **Entwürfe:** Alles, was nach außen geht (Texte, Rechtstexte-Vorstufen, Posts), ist als ENTWURF gekennzeichnet, bis ein Gründer freigibt. Kein Versand, keine Veröffentlichung durch die KI.
5. **Formate:** Gründer-Deliverables (zum Ausdrucken/Ausfüllen/Mitnehmen) als .docx, Tabellen/Listen zum Pflegen als .xlsx, interne Arbeits- und Analysedokumente als .md. Ablage immer im thematisch passenden Ordner (10 Recht, 20 Interviews, 30 Marketing, 40 Finanzen, 50 Produkt, 60 Orte, 70 Entwicklung).
6. **Code:** gilt zusätzlich `70-entwicklung-ab-monat-4/code-planer.md` — Einstufungen [KI]/[KI→R]/[M], sicherheitskritische Commits als `PRÜFUNG ERFORDERLICH`.

## Format für neue Aufgaben-Einträge

```
### A-XX · Kurztitel                                                     ☐
**Idee vom:** TT.MM.JJJJ · **Wofür:** <Funktion/Zweck, z. B. „Tor 2, Kanalabsicherung“>
**Rolle:** … · **Blocker:** keiner / ⏳ …
**Prompt:** <vollständiger, ausführbarer Auftrag: Kontextdateien, Schritte, Format, Ablageort, Nicht-tun, Abnahmekriterium>
**Status:** ☐ offen
```

## Dateien dieses Ordners

- `aufgaben-phase-0.md` — alle Cowork-Aufgaben (Recherche, Text, Organisation) für Monat 1–3 plus wiederkehrende Aufgaben
- `aufgaben-entwicklung.md` — die Coding-Sitzungen S0–S13 als ausformulierte Arbeitsaufträge für Claude Code

## Verweise

- Verlauf mit Datum und Uhrzeit: `../01-steuerung/log.md`
- Offene Entscheidungen: `../01-steuerung/offene-entscheidungen.md`
- Reihenfolge und Zeitachse: `../01-steuerung/roadmap.md`
