# Wie die App gebaut wird — und wie weit die KI das kann

> **ENTWURF · Stand 19.09.2026 · Aufgabe A-46 · Rolle: Technischer Berater** · *Entscheidungsstand ergänzt am 21.09.2026 (A-52)*
>
> **Entschieden:** Die Gründer haben **Modell A** gewählt (Nr. 73, 19.09.2026) und am 21.09.2026 präzisiert: **vollständige Prüfung des gesamten Codes** am Ende, nicht der kritischen 20 Prozent. Im Finanzmodell steht dafür seit A-52 eine eigene Einmalposition: **18.900 €** (Spanne 11.880 bis 25.920 € für zwei Plattformen). Die Empfehlung für Modell B unten bleibt als Begründung stehen, ist aber nicht der Plan. Was Modell A absichert, ohne es zu ändern: die eigenen Prüfläufe nach S3 und S11, das Abnahmeprotokoll je Sitzung (`bauplan-zwei-plattformen.md`, Abschnitt 8) und der Penetrationstest.
>
> Dieses Dokument beantwortet eine Frage, die bisher nirgends stand: **Wer baut das eigentlich, und was passiert, wenn die KI den größten Teil davon baut?** Es ergänzt `code-planer.md`, der das *Was* und die Reihenfolge festlegt; hier geht es um das *Wer*, das *Wie gut* und das *Was kostet die Absicherung*.

**Der Anlass:** Die Überlegung der Gründer war, die App vollständig mit Claude Code bauen zu lassen und sie danach von einer professionellen Firma prüfen und feinschleifen zu lassen. Das ist ein guter Gedanke, und er ist zur Hälfte richtig. Die andere Hälfte kostet Geld, das im Finanzmodell noch nicht steht — und wenn man sie überspringt, verschiebt sich das Risiko an eine Stelle, an der es niemand mehr sieht.

---

## Auf einen Blick

| | |
|---|---|
| Umfang des MVP | 54 Funktionen, 16 Arbeitspakete, 14 Sitzungen (`code-planer.md`) |
| Geschätzter Codeumfang | **25.000 bis 40.000 Zeilen** — ANNAHME, aus Funktionszahl und Architektur abgeleitet |
| Anteil, den eine KI gut baut | **etwa 70 Prozent** — Datenmodell, Oberfläche, Standardabläufe, Tests, Migrationen |
| Anteil, der menschliche Prüfung braucht | **etwa 20 Prozent** — Zugriffsrechte, Standortarchitektur, Bildpipeline, Verifizierung |
| Anteil, den eine KI gar nicht leisten kann | **etwa 10 Prozent** — Betrieb, Entscheidungen mit Haftung, Reaktion auf Vorfälle |
| Im Finanzmodell budgetiert für Code-Prüfung | ~~**0 €** — es gibt nur den Penetrationstest (4.000 €)~~ **seit A-52: 18.900 €** für die vollständige Prüfung am Ende (Nr. 73), dazu der Penetrationstest (4.000 €) |
| Empfohlener zusätzlicher Posten | **3.600 € bis 5.800 €** für gezielte externe Prüfung, gestaffelt über die Bauzeit — *die Empfehlung zu Modell B; gewählt wurde Modell A (Nr. 73)* |

**Der wichtigste Satz dieses Dokuments:** Eine Prüfung am Ende findet weniger als dieselbe Prüfzeit, verteilt über den Bau. Wer 30.000 Zeilen fertigen Code vor sich hat, liest ihn entweder oberflächlich — dann findet er das Offensichtliche und nicht das Gefährliche — oder er liest ihn vollständig, und dann kostet er fast so viel wie selbst bauen.

---

## 1 · Was eine KI beim Bauen wirklich kann

Ehrlich nach Aufgabenart getrennt, nicht als Werbung.

| Aufgabenart | Wie gut | Warum |
|---|---|---|
| **Datenmodell, Migrationen, Löschkaskaden** | **sehr gut** | Klar beschreibbar, prüfbar durch Tests, und die Spezifikation ist hier genauer als in den meisten Projekten dieser Größe |
| **Oberfläche nach Textvorgabe** | **sehr gut** | 39 Bildschirme mit 226 Ankern liegen beschrieben vor (`../50-produkt-prototyp/wireframes-textspezifikation.md`). Das ist Übersetzungsarbeit, keine Erfindung |
| **Standardabläufe** — Registrierung, Profil, Liste, Formular, Chat | **sehr gut** | Millionenfach gebaute Muster; hier ist eine KI schneller und gleichmäßiger als ein Mensch |
| **Tests** | **sehr gut** | 612 Akzeptanzkriterien im Format „Wenn … dann …" lassen sich fast eins zu eins in Tests übersetzen. **Das ist der eigentliche Vorteil der Vorarbeit** |
| **Dokumentation im Code** | **sehr gut** | Kommentare, Schnittstellenbeschreibungen, Entscheidungsprotokolle — wird üblicherweise vernachlässigt, hier nicht |
| **Geschäftslogik über viele Dateien** | **gut, mit Prüfung** | Funktioniert, solange die Spezifikation trägt. Wo sie schweigt, füllt eine KI die Lücke plausibel — und plausibel ist nicht dasselbe wie richtig |
| **Leistung und Antwortzeiten** | **mittel** | Eine KI schreibt korrekten Code, der langsam sein kann. Ob eine Abfrage bei 40.000 Nutzern trägt, zeigt erst eine Messung |
| **Zugriffsrechte auf Datenbankebene** | **riskant** | Row-Level-Security-Regeln sind kurz, sehen immer richtig aus und sind der häufigste Weg, wie Daten in solchen Systemen abfließen. Hier ist eine KI nicht schlechter als ein Mensch — aber beide brauchen einen zweiten Menschen |
| **Standortarchitektur** | **riskant** | Der ganze Datenschutzanspruch hängt daran, dass nie eine genaue Koordinate gespeichert wird. Ein einziger vergessener Pfad macht das Versprechen falsch, ohne dass irgendetwas kaputtgeht |
| **Kryptografie, Schlüsselverwaltung** | **riskant** | Funktioniert im Test auch dann, wenn es falsch ist |
| **Betrieb, Vorfälle, Meldungen** | **gar nicht** | Kein Werkzeug übernimmt Verantwortung. Ein Datenabfluss um drei Uhr nachts braucht einen Menschen |

**Die Trennlinie in einem Satz:** Eine KI ist stark, wo ein Fehler sofort auffällt, und schwach, wo ein Fehler jahrelang unsichtbar bleibt. Diese App hat ungewöhnlich viele Stellen der zweiten Art.

**Was in diesem Projekt besonders gut passt:** Die Vorarbeit ist der eigentliche Hebel. 74 Funktionen mit 612 Akzeptanzkriterien, zehn Nutzerabläufe mit 51 Abbruchfällen, 39 beschriebene Bildschirme, eine festgelegte Moderationsarchitektur und ein Bauplan mit 16 Arbeitspaketen — damit ist der Teil erledigt, an dem KI-gestützte Entwicklung sonst scheitert: **zu wissen, was genau gebaut werden soll.** Ohne diese Vorarbeit wäre jedes der Modelle unten deutlich schlechter.

---

## 2 · Vier Modelle, wie gebaut werden kann

Alle vier gehen davon aus, dass die KI den größten Teil des Codes schreibt. Sie unterscheiden sich darin, **wann und wie viel ein Mensch von außen prüft.**

Grundlage der Kostenrechnung: Der Freelancer-Kompass 2026 nennt einen Mediansatz von **90 € je Stunde** für Software- und Webentwicklung, 95 € über alle IT-Disziplinen (veröffentlicht 02.07.2026). Gerechnet wird mit 90 €; ein Spezialist für Anwendungssicherheit liegt darüber.

### Modell A · Alles bauen, am Ende prüfen lassen

*Das war die ursprüngliche Überlegung.*

| | |
|---|---|
| **Ablauf** | Sitzungen S0 bis S13 durchlaufen, MVP fertigstellen, dann eine Firma beauftragen, die alles prüft und feinschleift |
| **Externe Kosten** | **10.800 € bis 21.600 €** für eine vollständige Prüfung (120 bis 240 Stunden — ein erfahrener Entwickler versteht 1.000 bis 2.000 Zeilen kritischen Code am Tag, nicht mehr) · oder **2.200 € bis 3.600 €** für eine oberflächliche (3 bis 5 Tage: Architektur, Stichproben, Werkzeuge) |
| **Zeit bis zum Ergebnis** | Bauzeit plus 3 bis 6 Wochen |
| **Das Problem** | Die teure Prüfung sprengt das Budget — 35.800 € Einmalkosten stehen im Modell, davon ist keiner für Code-Prüfung vorgesehen. Die billige Prüfung findet genau das nicht, was hier gefährlich ist: eine Zugriffsregel, die eine Zeile zu weit gefasst ist, oder einen Pfad, auf dem doch eine genaue Koordinate gespeichert wird |
| **Das zweite Problem** | Ein Befund nach dem Bau ist teuer. Wenn im Monat 9 auffällt, dass die Zugriffsrechte anders geschnitten sein müssen, hängen daran zwanzig Dateien statt zwei |
| **Wofür es trotzdem taugt** | Wenn das Ergebnis ein **Prototyp zum Zeigen** ist und nicht der Start mit echten Nutzern |

### Modell B · Bauen und gestaffelt prüfen lassen — **empfohlen**

| | |
|---|---|
| **Ablauf** | Dieselben Sitzungen, aber nach S3 (Datenmodell, Standort, Bilder), nach S11 (Zugriffsrechte, Melden) und vor der Beta je ein gezielter externer Blick auf genau diese Teile |
| **Externe Kosten** | **3.600 € bis 5.800 €** — 40 bis 64 Stunden, verteilt auf drei Termine. Dazu der ohnehin budgetierte Penetrationstest (4.000 €) |
| **Zeit** | keine zusätzliche Wartezeit: Geprüft wird, während weitergebaut wird |
| **Warum es besser ist** | Die drei Prüfungen liegen auf den **20 Prozent des Codes, an denen 80 Prozent des Risikos hängen**. Ein Befund in Woche 6 kostet eine Sitzung, derselbe Befund in Monat 9 kostet einen Umbau |
| **Was es verlangt** | Jemanden finden, der drei kurze Aufträge annimmt statt eines großen. Das ist bei Freelancern leichter als bei Agenturen |
| **Restrisiko** | Die 80 Prozent nicht geprüften Codes enthalten Fehler. Sie sind aber solche, die auffallen, wenn etwas nicht funktioniert — nicht solche, die stillschweigend Daten preisgeben |

### Modell C · Die kritischen Bausteine von außen bauen lassen

| | |
|---|---|
| **Ablauf** | AP-1 (Datenmodell), AP-2 (Standort), AP-3 (Bilder) und die Zugriffsrechte werden von einem erfahrenen Entwickler gebaut, alles andere von der KI |
| **Externe Kosten** | **9.000 € bis 14.400 €** — 100 bis 160 Stunden |
| **Warum man es erwägen sollte** | Diese vier Teile sind nach dem Bauplan „nachträglich nicht einbaubar". Wer sie richtig hat, kann den Rest reparieren |
| **Warum es hier trotzdem nicht passt** | Es kostet das Zweieinhalbfache von Modell B und löst ein Problem, das Modell B auch löst — mit dem Unterschied, dass der externe Entwickler sich erst in die Spezifikation einlesen muss. Die 612 Akzeptanzkriterien sind ein Vorteil beim Prüfen und ein Aufwand beim Einarbeiten |

### Modell D · Agentur baut, KI unterstützt

| | |
|---|---|
| **Externe Kosten** | **90.000 € bis 180.000 €** für ein MVP dieser Größe (1.000 bis 2.000 Stunden). Zum Vergleich: Der gesamte Kapitalbedarf der Firma lag bei 107.349 € (seit A-52 mit allen Beschlüssen: 160.253 €) |
| **Einordnung** | Rechnerisch ausgeschlossen. Steht hier nur, damit die Größenordnung im Raum ist, wenn jemand fragt, was „professionell bauen lassen" kostet |

### Die vier Modelle nebeneinander

| | A · Prüfung am Ende | **B · gestaffelt** | C · kritische Teile extern | D · Agentur baut |
|---|---|---|---|---|
| Externe Kosten | 2.200–21.600 € | **3.600–5.800 €** | 9.000–14.400 € | 90.000–180.000 € |
| Zusätzliche Zeit | 3–6 Wochen | **keine** | 2–4 Wochen Abstimmung | — |
| Risiko stiller Fehler | **hoch** (billige Prüfung) | **niedrig** | niedrig | niedrig |
| Kosten eines späten Befunds | hoch | **niedrig** | niedrig | — |
| Passt ins Budget | teils | **ja** | knapp | nein |

**Empfehlung: Modell B.** Und zwar aus einem Grund, der nichts mit Geld zu tun hat: Es ist das einzige Modell, bei dem ein Fehler gefunden wird, **solange er billig zu beheben ist.**

---

## 3 · Was „fertige App" ehrlich heißt

Wenn die Sitzungen S0 bis S13 durchlaufen sind, ist Folgendes da — und Folgendes nicht.

| Da | Nicht da |
|---|---|
| Alle 54 MVP-Funktionen lauffähig | Die 18 Funktionen der Phase 2 und 3 (F07, F22, F28, F35–F40, F49–F51, F64–F67, F73, F74) |
| Tests aus den 612 Akzeptanzkriterien | Lasttests mit realistischen Nutzerzahlen |
| Datenmodell mit Löschkaskaden und Export | Erprobte Wiederherstellung aus einer Datensicherung |
| Moderations-Backend nach `../50-produkt-prototyp/moderations-backend.md` | Erfahrung, ob die Fristen im Betrieb halten |
| Oberfläche nach der Textspezifikation | Gestaltung — die kostet 6.000 € und ist als eigener Posten budgetiert |
| Eine App, die tut, was spezifiziert ist | Eine App, von der jemand bezeugt hat, dass sie auch tut, was sie *nicht* tun soll: nämlich nichts preisgeben |

**Der Unterschied zwischen „läuft" und „kann online gehen"** sind im Wesentlichen fünf Dinge, die im Bauplan heute fehlen. Sie stehen in Abschnitt 4.

---

## 4 · Was im Bauplan fehlt

Beim Durchgehen von `code-planer.md` gegen das, was ein Produktivbetrieb braucht, bleiben acht Lücken. Keine davon ist ein Fehler des Plans — er beschreibt das Bauen, nicht das Betreiben. Aber ohne sie geht die App nicht online.

| # | Was fehlt | Warum es zählt | Vorschlag |
|---|---|---|---|
| L1 | **Umgebungen.** Der Plan kennt keine Trennung zwischen Entwicklung, Test und Produktion | Ohne getrennte Umgebungen wird irgendwann mit echten Daten getestet. Das ist bei Art.-9-Daten nicht reparabel | eigenes Arbeitspaket AP-0b, vor S1 |
| L2 | **Datensicherung und erprobte Wiederherstellung** | Eine Sicherung, aus der nie wiederhergestellt wurde, ist keine Sicherung. Das Finanzmodell budgetiert Hosting, aber der Plan nennt keinen Sicherungszyklus und keinen Wiederherstellungstest | in AP-0 aufnehmen, Test in AP-15 |
| L3 | **Geheimnisverwaltung.** Wo liegen Schlüssel, Zugangsdaten, API-Token? | Der häufigste Weg, wie kleine Projekte Daten verlieren, ist ein Schlüssel im Quelltextverzeichnis | in AP-0, mit einer Regel im Kickoff-Auftrag |
| L4 | **Überwachung und Alarmierung.** Der Plan nennt Monitoring in AP-0, aber nicht, was überwacht wird und wer wann geweckt wird | Die Moderationsfristen (unter 12, 24, 48 Stunden) sind nur haltbar, wenn jemand merkt, dass etwas liegen bleibt | Kennzahlen und Schwellen festlegen, in AP-0 und AP-4 |
| L5 | **Lastannahmen.** Es gibt keine Zahl, gegen die gebaut wird | „Schnell genug" ist keine Abnahmebedingung. Aus dem Finanzmodell lassen sich Werte ableiten: 3.500 aktive Nutzer zu Tor 3, Spitzen am Samstagabend, 64 Bilder am Tag | Leistungsbudgets je Bildschirm in AP-7 und AP-15 |
| L6 | **Rücknahme einer Auslieferung.** Was passiert, wenn eine Auslieferung kaputt ist? | Bei additiven Migrationen ist ein Rückwärtsschritt nicht automatisch möglich | Rücknahmeplan je Migration, Regel in AP-1 |
| L7 | **Bauplan für Phase 2 und 3.** 18 Funktionen sind spezifiziert, aber keinem Arbeitspaket zugeordnet | Darunter das Veranstalterportal (F39) und das eigene Treffen (F36) — genau das, was das Veranstaltungskonzept braucht | eigener Abschnitt im Code-Planer, nach der Beta |
| L8 | **Abnahmeprotokoll.** Woran erkennen die Gründer, dass eine Sitzung gut war? | „PRÜFUNG ERFORDERLICH" sagt, *dass* geprüft wird, nicht *wogegen* | Abnahmeliste je Sitzung — Vorschlag in Abschnitt 5 |

**L1 bis L4 gehören vor die erste Zeile Produktivcode.** L5 bis L8 können mitwachsen.

---

## 5 · Woran die Gründer erkennen, dass eine Sitzung gut war

Der Bauplan verlangt an mehreren Stellen eine Prüfung durch Gründer 1, sagt aber nicht, wogegen geprüft wird. Vorschlag für eine Abnahmeliste, die für jede Sitzung gilt:

1. **Laufen alle Tests, und sind die neuen Tests echte Tests?** Ein Test, der nur prüft, dass eine Funktion nicht abstürzt, ist keiner. Stichprobe: Zwei Akzeptanzkriterien aus der Spezifikation heraussuchen und den zugehörigen Test lesen.
2. **Gibt es eine neue Abhängigkeit, und warum?** Jede neue Bibliothek ist eine Entscheidung. Besonders: Sitzt der Anbieter in der EU?
3. **Steht irgendwo ein Geheimnis im Klartext?** Suche im Verzeichnis nach Schlüsselmustern — das ist in dreißig Sekunden getan.
4. **Ist eine Zugriffsregel neu oder geändert?** Wenn ja: Diese Zeilen liest ein Mensch, immer, ohne Ausnahme.
5. **Wird irgendwo ein genauer Standort verarbeitet?** Suche nach Koordinaten-Feldnamen. Erwartung: Treffer nur in der Rundungsfunktion.
6. **Was wurde als `PRÜFUNG ERFORDERLICH` markiert, und ist die Prüfnotiz verständlich?** Wenn die Notiz nicht erklärt, *warum* die Stelle kritisch ist, ist sie unbrauchbar.
7. **Ist der Commit-Stand sauber?** Eine Sitzung, ein Thema, ein nachvollziehbarer Stand.

**Die Punkte 3, 4 und 5 dauern zusammen unter zehn Minuten** und fangen die drei Fehlerarten ab, die in diesem Projekt am teuersten wären.

---

## 6 · Was ich beim Bauen nicht leisten kann

Vollständigkeit, so gut ich sie einschätzen kann — und eine Einschränkung vorweg: **Ich kann die Qualität meines eigenen Codes nicht zuverlässig beurteilen.** Das ist keine Bescheidenheit, sondern die Eigenschaft, die die externe Prüfung überhaupt nötig macht. Wo ich einen Fehler machen würde, würde ich ihn auch beim Nachlesen für richtig halten.

| Was | Warum nicht | Wer stattdessen |
|---|---|---|
| **Beurteilen, ob mein Code sicher ist** | siehe oben | externe Prüfung, Modell B |
| **Entscheiden, was gebaut wird** | Die 90 Festlegungen der Spezifikation sind Haltungsfragen (**Nr. 68**) | Gründer |
| **Rechtsfragen beantworten** | 65 liegen beim Anwalt | Fachanwalt |
| **Betreiben** — Server, Vorfälle, Meldungen, nächtliche Störungen | Kein Werkzeug trägt Verantwortung | Gründer |
| **Prüfen, ob eine Abfrage in der Realität trägt** | Dafür braucht es Messung unter Last, nicht Lesen | Lasttest in AP-15 |
| **Bilder und Gestaltung** | Die Oberfläche folgt einer Textvorgabe; Gestaltung ist ein eigener Posten (6.000 €) | externe Gestaltung |
| **Verantwortung übernehmen, wenn etwas schiefgeht** | — | Gründer, und dafür gibt es die Cyber-Haftpflicht (200 €/Monat im Modell) |

**Und eine Einschränkung, die für alle Modelle gilt:** Die Werkzeuge, mit denen gebaut wird, können sich ändern — im Preis, im Zugang, in der Leistung. Was dagegen hilft, ist, dass die Spezifikation werkzeugunabhängig ist: 612 Akzeptanzkriterien beschreiben, *was* gebaut wird, nicht *womit*. Wird das Werkzeug teurer, ändert sich die Bauzeit, nicht der Bauplan.

---

## 7 · Der Weg zur professionellen Firma — wie er wirklich aussieht

Die ursprüngliche Vorstellung war: fertige App, Firma schaut drüber, schleift fein. So läuft es in der Praxis nicht, und es ist nützlich zu wissen, warum.

**Was eine Firma bei einer fertigen fremden App zuerst tut:** Sie liest nicht den Code, sondern fragt nach Architektur, Tests und Dokumentation. Sind die gut, wird die Prüfung billig. Fehlen sie, wird die Prüfung teuer oder oberflächlich. **Dieses Projekt ist in dieser Hinsicht in einer ungewöhnlich guten Lage** — Spezifikation, Abläufe, Moderationsarchitektur und Backend-Rechte liegen geschrieben vor, bevor die erste Zeile existiert. Das ist die Vorbedingung dafür, dass eine Prüfung überhaupt bezahlbar ist.

**Was „feinschleifen" bedeutet, wenn es ehrlich benannt wird:**

| Was oft darunter verstanden wird | Was es tatsächlich ist |
|---|---|
| „die letzten Fehler rausmachen" | Fehler sind nicht das Problem — die fallen beim Testen auf. Das Problem sind die Stellen, an denen nichts kaputtgeht |
| „schöner machen" | Das ist Gestaltung, ein eigener Posten, und sie gehört vor die Entwicklung, nicht danach |
| „schneller machen" | Setzt Messung voraus. Ohne Lastannahmen (L5) weiß niemand, was schnell genug ist |
| „professionalisieren" | Meint meistens: Umgebungen, Überwachung, Sicherungen, Auslieferungswege — also genau L1 bis L4, und die gehören an den Anfang |

**Die brauchbare Fassung derselben Idee:** Die App wird mit KI gebaut, an drei Stellen von außen geprüft, und **vor dem öffentlichen Start** kommt der ohnehin budgetierte Penetrationstest mit Schwerpunkt Standort- und Bildarchitektur. Das ist Modell B, es kostet 3.600 bis 5.800 € zusätzlich — und es ist derselbe Gedanke, nur an der richtigen Stelle im Zeitablauf.

---

## 8 · Was das fürs Finanzmodell heißt

| Posten | Heute im Modell | Vorschlag |
|---|---|---|
| Penetrationstest | 4.000 € (Monat 8) | unverändert |
| **Externe Code-Prüfung, gestaffelt** | **fehlt** | **+ 3.600 € bis 5.800 €**, verteilt auf Monat 5, Monat 7 und Monat 9 |
| Summe Einmalkosten | 35.800 € | **39.400 € bis 41.600 €** |

Das sind 10 bis 16 Prozent mehr Einmalkosten. Gemessen an einem Kapitalbedarf von 107.349 € ist das ein Aufschlag von 3 bis 5 Prozent — und er kauft die einzige Absicherung gegen die Fehlerart, die dieses Produkt am teuersten treffen würde.

**Einzutragen ist das erst, wenn die Gründer das Modell gewählt haben.** Bis dahin steht es hier und nicht im Finanzmodell, damit keine Zahl wandert, über die niemand entschieden hat.

**Stand 21.09.2026 — gewählt und eingetragen:** Modell A mit vollständiger Prüfung (Nr. 73). Im Finanzmodell steht die **Code-Prüfung mit 18.900 € in Monat 1** (Blatt „Annahmen“, Zeile 128), dazu 1.200 € für Testgeräte der zweiten Plattform. Die Einmalkosten steigen damit von 35.800 € auf **55.900 €**, der Kapitalbedarf der Firma durch diese beiden Posten um rund 24.100 € (mit Puffer). Die Tabelle oben bleibt als Vergleich stehen: Modell B hätte 3.600 bis 5.800 € gekostet — der Unterschied ist der Preis für „den gesamten Code" statt „die gefährlichsten 20 Prozent".

---

## 9 · Was dieses Dokument nicht ist

- **Keine Zusage über Qualität.** Ich kann sagen, wie ich arbeite, nicht wie gut das Ergebnis wird.
- **Kein Angebot und kein Preisvergleich.** Die Stundensätze sind Marktmedianwerte, keine eingeholten Angebote.
- **Keine Aussage über konkrete Dienstleister.** Wer geprüft wird und von wem, entscheiden die Gründer.
- **Kein Ersatz für den Code-Planer.** Der bleibt die Bauvorgabe; dieses Dokument ergänzt ihn um das Wer und das Wie-abgesichert.

---

## Quellen

- **Freelancer-Kompass 2026**, veröffentlicht am 02.07.2026: Mediansatz 95 € je Stunde über alle IT-Disziplinen, **90 € für Software- und Webentwicklung**, SAP/ERP 120 €, Data & Analytics 100 €, IT-Infrastruktur 95 €. Abgerufen am 19.09.2026: <https://www.freelancermap.de/blog/stundensatz-it-freelancer/>
- Projektintern: `code-planer.md` (Arbeitspakete, Sitzungsplan, PWA-Realitätscheck) · `claude-code-kickoff-struktur.md` · `../50-produkt-prototyp/produktspezifikation.md` (Stand 19.09.2026: 74 Funktionen, 612 Akzeptanzkriterien; seit 22.09.2026: 75 und 645 geltende) · `../50-produkt-prototyp/moderations-backend.md` · `../40-finanzen-foerderung/finanzmodell.xlsx` (Einmalkosten, Kostenstaffel)
- Die Einschätzungen in Abschnitt 1 und die Umfangsschätzung von 25.000 bis 40.000 Zeilen sind **ANNAHMEN** ohne externen Beleg.
