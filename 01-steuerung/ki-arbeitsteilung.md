# KI-Arbeitsteilung — was Claude leistet, was Prüfung braucht, was Menschen vorbehalten bleibt

Konsolidiert aus KI-Einsatzplan (Cowork, Monat 1–3) und Handbuch A Abschnitt 10 (Claude Code, ab Monat 4).

**Die Trennlinie in einem Satz:** KI auf eurem Code und euren Inhalten — uneingeschränkt sinnvoll. KI auf Nutzerdaten — praktisch nie, und niemals über einen Anbieter außerhalb der EU.

---

## Stufe 1 — KI erledigt eigenständig (Ergebnis direkt verwendbar)

| Bereich | Beispiele |
|---|---|
| Recherche | Ortslisten, Anbietervergleiche, Markenrecherche DPMA/EUIPO, Domain-Checks, Fördermittel-Übersichten, Wettbewerbsbeobachtung |
| Auswertung | Interviewnotizen thematisch clustern, Kennzahlen zusammenfassen, Finanzmodell fortschreiben |
| Vorbereitung | Fragenkataloge (Anwalt, Steuerberater, Notar, Förderstelle, DSB-Ausschreibung), Checklisten, Entscheidungsvorlagen, Redaktionspläne, Wireframe-Beschreibungen |
| Code (ab Monat 4) | Gerüstcode, Formulare, Migrationen (nur hinzufügen, nie löschen), Tests, Testdaten (nie in Produktion), Code-Durchsicht, Umbau, Dokumentation, Lizenzprüfung, Wechselwirkungstests |

Grenze auch hier: keine Fakten erfinden. Kontostand, Verträge, Termine, Namen werden erfragt, nicht angenommen. Förderkonditionen sind immer nur „die Form der Frage" — vor Antragstellung direkt beim Träger verifizieren.

## Stufe 2 — KI erstellt, Mensch liest gegen und gibt frei

| Was | Warum Prüfung |
|---|---|
| Landingpage-Copy, Social-Media-Beiträge, Newsletter, Pressetexte, B2B-Ansprachen | Kein Versand, keine Veröffentlichung ohne Freigabe — die Gründer drücken den Knopf |
| Systemtexte der App | Endfassung durch Menschen; Formulierungen entscheiden über Annahme ganzer Funktionen |
| Datenschutzhinweis Warteliste (Entwurf) | Fachanwalt muss gegenlesen — Artikel-9-Kontext |
| Entscheidungsvorlagen mit Geldfolge | Entscheidung selbst ist immer menschlich |
| **Sicherheitskritischer Code:** Anmeldung, Verschlüsselung, Standortberechnung, RLS-Policies, Bildpipeline (`supabase/policies/`, `src/lib/location/`, `src/lib/media/`) | Commit-Markierung `PRÜFUNG ERFORDERLICH`, Zeile für Zeile durchgehen oder gar nicht verwenden. Fehler in dieser Art Code sehen korrekt aus und sind es nicht — unabhängig von der Modellstärke. Prüffrage Standort: verlässt irgendwo eine Zahl mit mehr Präzision als ein Entfernungsband den Server? |
| Terminparser, Bild-Vorfilter, Textprüfung | Selbst gehostet, als Vorschlag — nie als endgültige Entscheidung |

Jeder Entwurf ist als Entwurf gekennzeichnet, bis ein Gründer ihn freigegeben hat.

## Stufe 3 — nur Mensch (nicht delegierbar oder nicht autonom entscheidbar)

- **Interviews und Ortsakquise** — Beziehungsarbeit der Gründer; wer sie abgibt, verliert den einzigen unkopierbaren Vorteil
- **Alle Entscheidungen:** Name „Cruizy" (entscheiden die Interviews), GmbH/UG, Holding, Anbieterwahl, Tor-Entscheidungen (weiter/stopp), jede Geldausgabe und Verbindlichkeit
- **Termine mit Notar, Fachanwalt, Steuerberater, Krankenkasse** — KI bereitet Fragenkataloge vor
- **Jede Kontaktaufnahme mit Dritten:** Locations, Behörden, Presse, Förderstellen — KI liefert Text, versendet nie
- **Verträge unterschreiben, Anträge abschicken** (Förderung, Kredit, Marke)
- **Veröffentlichen-Knopf** bei jedem Inhalt
- **Moderation der ersten Monate** (1 Std./Tag) und jede Sperrentscheidung — Art. 22 DSGVO verlangt menschliche Prüfmöglichkeit
- Externe Pflichtleistungen: Penetrationstest, Barrierefreiheitsprüfung durch Betroffene, Taxonomie-Gegenlesen durch trans/nichtbinäre Personen (bezahlt), UI-Gestaltung

## Stufe 4 — KI tabu, ohne Ausnahme

- **Rechtstexte final:** AGB, Datenschutzerklärung, Gesellschaftsvertrag — nur Stichwortsammlung für den Fachanwalt
- **Steuerliche und gesellschaftsrechtliche Entscheidungen**
- **Nutzerdaten an externe Modellanbieter** — der schnellste Weg, die Positionierung zu zerstören
- **Eisbrecher, Profiltexte, Nachrichten generativ** — Echtheit ist das gesamte Vertrauensversprechen (Eisbrecher kommen aus festen Vorlagen)
- **Sperrentscheidung ohne Menschen**
- **Geisterprofile/Testdaten in Produktion** — dunkles Muster
- **Neue Abhängigkeit von US-Cloud-Anbietern** ohne Rückfrage; keine Migration löschen; kein Widerspruch zur Spezifikation stillschweigend auflösen

---

## Prozessregeln (gelten für jede Aufgabe)

1. Handbuch A und B sind Wahrheitsquelle; Widersprüche werden benannt.
2. Bei Unsicherheit: eine Rückfrage statt einer Annahme.
3. Deutsch, direkt, fertig weiterverwendbar — kein „grober" Entwurf, wenn vermeidbar.
4. Ab Monat 4 gelten zusätzlich CLAUDE.md und `docs/architektur-regeln.md` im Code-Repo (Vorlagen: `70-entwicklung-ab-monat-4/claude-code-kickoff-struktur.md`).

## Zur Formulierung „100 % Eigenleistung" (für den Businessplan)

Kommerzielle Nutzungsrechte liegen bei euch; Urheberrechtsschutz nach § 2 UrhG genießen rein maschinelle Ausgaben nach überwiegender Auffassung nicht — geschützt sind Architektur, Auswahl und Integration. Formulierung: „Die Entwicklung erfolgt inhouse. Architektur, Logik, Sicherheitsentscheidungen und Tests verantwortet der technische Gründer; KI-Werkzeuge beschleunigen die Umsetzung. Die kommerziellen Nutzungsrechte liegen vollständig bei der Gesellschaft. Eine automatisierte Lizenzprüfung ist Teil der Bauumgebung."
