# Gegenrechnung: Kapitalbedarf — vom ersten Schreck (485.000 €) bis zum Stand nach den Beschlüssen

Erstellt: 27.07.2026, 09:40 Uhr · Nachtrag zu Aufgabe A-13 · Anlass: Rückfrage Henry · **fortgeschrieben 21.09.2026 (A-52)**
Alle externen Angaben per Websuche am 27.07.2026 erhoben. Quellen am Ende.
Bezug: `finanzmodell.xlsx` (Blätter „Annahmen“, „Kennzahlen“ Punkt 4, „Finanzierungswege“ Abschnitt 5)

> **Stand 21.09.2026 (A-52) — dieser Kasten ersetzt die Kästen vom 27.07. und 16.09.2026.**
>
> Mit allen Beschlüssen vom 19. und 21.09.2026 liegt der **Kapitalbedarf der Firma** im realistischen Fall bei **160.253 €** (Prüfweg eID voreingestellt), je nach Prüfweg beim Jugendschutz zwischen **143.397 €** und **245.841 €**. Zusammen mit Krankenversicherung und Lebenshaltung beider Gründer — der Zahl, gegen die seit Nr. 38 geplant wird — sind es **233.053 €**.
>
> | | Pessimistisch | Realistisch | Optimistisch |
> |---|---|---|---|
> | Kapitalbedarf der Firma | 182.261 € | **160.253 €** | 143.210 € |
> | Gesamtbedarf mit Krankenversicherung und Lebenshaltung | 275.861 € | **233.053 €** | 197.810 € |
> | Break-even (erster Monat mit Überschuss) | keiner in 36 Monaten | Monat 28 | Monat 21 |
>
> **Beschluss Nr. 90 vom 26.09.2026 (Weg C):** Nach außen gilt die **realistische** Zahl **233.053 €**; der Abstand zum pessimistischen Fall — **42.808 €** — wird als **benannte Reserve** in der Finanzierungsfolge geführt, die damit auf **275.861 €** auslegen muss. Dazu der Grundsatz **G-02**: im Zweifel den oberen Rand einer Spanne finanzieren. Die Rechnung dazu steht im Finanzmodell, Blatt „Finanzierungswege", Abschnitt 7.
>
> **Woher die 52.904 € mehr gegenüber dem 16.09.2026 kommen** (realistisch, nacheinander nachgerechnet): Code-Prüfung nach Modell A +22.680 € · eigene Veranstaltungen je Stadt +12.800 € · CSD zum Start +7.200 € · Nebenerlöse ohne bezahlte Sichtbarkeit +3.799 € · berichtigte CSD-Monate +3.590 € · SMS-Versand +2.763 € · Testgeräte +1.440 € · neue Erlöskette −1.387 €. Einzelheiten: `finanzmodell.xlsx`, Blatt „Herkunft & Widersprüche“, Abschnitt 5.
>
> **Was von der Gegenrechnung bleibt:** Die Abschnitte 1 bis 3 erklären, wie die Altersprüfung gerechnet wird, und gelten unverändert. Ihre Beträge sind der Stand vom 16.09.2026, vor den Beschlüssen; die Abschnitte 4, 5 und 7 tragen die Werte vom 21.09.2026.

---

## 1 · Wie die Zahl zustande kam — jeder Schritt einzeln

Die erste Fassung des Modells hat so gerechnet:

| Schritt | Größe | Wert | Woher |
|---|---|---|---|
| a | Nutzerzuwachs über 36 Monate (MAU von 0 auf 62.000) | 62.000 Registrierungen | Modell, realistisches Szenario |
| b | Ersatz für Abwanderung: 8 % der MAU je Monat, aufsummiert | 58.476 Registrierungen | Annahme „monatliche Nutzerabwanderung“ |
| c | **Summe der Prüfvorgänge** = a + b | **120.476** | |
| d | Preis je Prüfung im Fall „JMStV teuer“ | 3,50 € | Mittelwert der Marktspanne 2–5 € |
| e | Prüfkosten gesamt = c × d | 421.668 € | |
| f | Prüfkosten im Grundfall (0,22 € je Prüfung) | 26.505 € | Handbuch B, zurückgerechnet |
| g | **Mehrkosten** = e − f | **395.163 €** | |

Der Kapitalbedarf stieg dadurch von 96.252 € auf 485.189 €. Die Differenz von 388.937 € entspricht dem Anteil dieser Mehrkosten, der **bis zum Tiefpunkt der Liquiditätskurve** anfällt, zuzüglich 20 % Sicherheitspuffer. Die Arithmetik war korrekt. Die Annahmen waren es nicht.

---

## 2 · Die drei Stellen, an denen ich zu grob war

### Fehler 1 — Zeile b: Rückkehrer als Neukunden gezählt

Zeile b unterstellt, dass jeder Nutzer, der in einem Monat inaktiv wird, durch eine **neue Person** ersetzt wird, die neu identifiziert werden muss.

Das ist falsch, und zwar aus einem konkreten rechtlichen Grund. Das AVS-Raster der KJM beschreibt zwei **verbundene** Schritte:

1. **Einmalige Identifizierung** der Person zur Volljährigkeitsprüfung — durch persönlichen Kontakt oder eines der zugelassenen gleichwertigen Verfahren.
2. **Authentifizierung** vor jedem Nutzungsvorgang, der nicht unmittelbar auf die Identifizierung folgt.

Der zweite Schritt soll verhindern, dass Zugangsdaten weitergegeben werden. Er ist ein **Anmeldevorgang** — Passwort, Gerätebindung, zweiter Faktor — und kostet je Nutzung nichts. Wer nach drei Monaten Pause zurückkommt, ist bereits identifiziert.

Mit einer angenommenen Rückkehrerquote von 30 %:

| Rückkehrerquote | Prüfungen | bei 3,50 € |
|---|---|---|
| 0 % (erste Fassung) | 120.476 | 421.668 € |
| 30 % | 102.934 | 360.267 € |
| 50 % | 91.238 | 319.334 € |

Die 30 % sind eine Annahme ohne Beleg. Sie steht jetzt als blaues Feld im Modell.

### Fehler 2 — jeder Nutzer bekommt das teuerste Verfahren

Die erste Fassung hat unterstellt, dass **alle** Registrierungen durch das teure Identverfahren müssen. Das widerspricht unserer eigenen Architektur.

Nach der Zonenlogik aus A-37 ist der öffentliche Bereich frei von expliziten Inhalten — Profilbilder werden vorab geprüft, explizite Darstellungen gehören dort nicht hin. Explizite Inhalte existieren ausschließlich im **privaten, beidseitig freigegebenen** Bereich. Die geschlossene Benutzergruppe nach § 4 Abs. 2 JMStV muss also nur den erfassen, der diesen Bereich betritt.

Das Modell rechnet jetzt zweistufig:

- **Stufe 1** für alle: Altersschätzung, 0,22 € je Vorgang
- **Stufe 2** nur für den Anteil, der den expliziten Bereich betritt: volle Identifizierung nach AVS-Raster

Der Anteil ist mit 35 % voreingestellt. Auch das ist eine Planungsgröße ohne Beleg — auf 100 % gesetzt rechnet das Modell wie zuvor.

### Fehler 3 — im Vier-Wege-Vergleich: falscher Bezugszeitraum

Beim nachträglich gebauten Vergleich der Verfahren hatte ich die Prüfkosten **über volle 36 Monate** vom Kapitalbedarf abgezogen. Für den Tiefpunkt zählen aber nur die Kosten **bis zum Tiefpunkt**. Danach trägt sich die Firma zunehmend selbst. Korrigiert.

---

## 3 · Die Zerlegung, Schritt für Schritt nachgerechnet

*Stand 16.09.2026, vor den Beschlüssen vom September. Die Mechanik gilt weiter; die heutigen Beträge stehen in Abschnitt 4.*

Jede Zeile ist im Modell durch Umstellen der blauen Felder nachvollziehbar; die Werte stammen aus sieben Durchläufen mit anschließender Neuberechnung.

| Einstellung | Kapitalbedarf realistisch |
|---|---|
| Erste Fassung nachgestellt: alle Nutzer, VideoIdent, keine Rückkehrer | **516.995 €** |
| nur Rückkehrerquote 30 % korrigiert | 438.683 € |
| nur Zwei-Stufen 35 % ergänzt | 189.249 € |
| beide Korrekturen, weiterhin VideoIdent | 166.548 € |
| beide Korrekturen + eID *(Voreinstellung)* | **107.349 €** |
| beide Korrekturen + EUDI-Wallet | 97.003 € |
| Stufe 2 gar nicht erforderlich | 95.258 € |

Der nachgestellte Ausgangswert liegt mit 516.995 € über den ursprünglichen 485.189 €, weil das Modell jetzt Stufe 1 und Stufe 2 addiert — bei einem Stufe-2-Anteil von 100 % zahlt also jeder 0,22 € **plus** 3,50 €. Die Differenz ist erklärt und gewollt.

**Der größte Einzelhebel ist die Zwei-Stufen-Architektur** — sie allein nimmt 328.000 € heraus. Sie kostet nichts außer der Entscheidung, sie so zu bauen. Und sie folgt ohnehin aus der Zonenlogik, die in A-37 schon steht.

---

## 4 · Die vier Wege für Stufe 2 — was jeder kostet und was ihn belegt

*Kapitalbedarf der Firma im realistischen Fall, vollständig nachgerechnet am 21.09.2026 (A-52): Schalter umgestellt, alles neu berechnet, mit allen Beschlüssen vom September. In Klammern der Stand vom 16.09.2026.*

| Weg | Preis je Prüfung | Prüfkosten 36 Monate | Kapitalbedarf | Break-even | Belastbarkeit der Preisangabe |
|---|---|---|---|---|---|
| **0 — nicht erforderlich** | 0,00 € | 22.645 € | **143.397 €** (95.258 €) | Monat 26 | hängt allein an einer Rechtsfrage, siehe Abschnitt 5 |
| **1 — EUDI-Wallet „d-you“** | 0,15 € | 28.049 € | **145.888 €** (97.003 €) | Monat 26 | Preis geschätzt, Verfügbarkeit belegt |
| **2 — eID Personalausweis** | 1,00 € | 58.672 € | **160.253 €** (107.349 €) | Monat 28 | Preis geschätzt, Zulässigkeit belegt · **voreingestellt** |
| **3 — VideoIdent / AutoIdent** | 3,50 € | 148.739 € | **245.841 €** (166.548 €) | keiner in 36 Monaten | Marktspanne belegt, Stückpreis nicht |

Die Prüfkosten selbst haben sich nicht verändert — die Zahl der Neuregistrierungen ist dieselbe. Gewachsen ist alles andere, und Weg 3 wirkt stärker als vorher, weil er den Tiefpunkt nach hinten schiebt: Die Firma trägt sich damit im realistischen Fall in drei Jahren nicht.

### Weg 1 — die EUDI-Wallet („d-you“), und warum der Zeitpunkt kaum besser liegen könnte

Die EU-Mitgliedstaaten mussten die europäische Identitäts-Wallet bis Ende 2026 bereitstellen. **Deutschland stellt sie ab dem 2. Januar 2027 kostenlos für alle bereit**, aufbauend auf der AusweisApp und der eID des Personalausweises. Eine Altersnachweisfunktion ist ausdrücklich vorgesehen: Für einen Altersnachweis genügt die Information, dass eine Person eine bestimmte Grenze erreicht hat — nicht das Geburtsdatum, nicht der Name.

Unser Start liegt frühestens im **Sommer 2028**, geplant wird ein Jahr später (Nr. 45) — also rund zweieinhalb Jahre nach der Einführung. Das ist mehr als die Zeit, die eine solche Infrastruktur braucht, um in der Breite anzukommen. In Deutschland heißt die Wallet **„d-you“**; der Dienst erfährt nur „Altersgrenze erfüllt“ (`../10-recht-gruendung/altersverifikation-stand-2026.md`, A-53).

Was ich nicht belegen kann: was die Abfrage für uns als prüfende Stelle kostet. Die Wallet ist für Bürger kostenlos; für die abfragende Seite gibt es noch keine öffentliche Preisangabe. Die 0,15 € sind eine Schätzung, keine Zahl.

### Weg 2 — die eID, und warum sie voreingestellt ist

Das AVS-Raster der KJM nennt für die einmalige Identifizierung mehrere zulässige Wege ausdrücklich nebeneinander, darunter **die eID-Funktion des Personalausweises**, den Dokumentenabgleich per Webcam und Post-Ident. Es verlangt nicht das teuerste Verfahren, sondern ein gleichwertiges.

Die eID ist vollautomatisch und in Sekunden erledigt. Zur Kostenlage: Banken zahlen für VideoIdent derzeit rund **7 bis 8 € je Vorgang**, mit erwartetem Rückgang auf etwa 2 €. Die eID wird demgegenüber als deutlich günstiger beschrieben, weil technischer und personeller Aufwand minimal sind. Einen öffentlichen Stückpreis nennt auch hier niemand — die 1,00 € sind eine vorsichtige Schätzung nach oben.

**Das ist die Voreinstellung des Modells**, weil sie heute schon verfügbar ist und nicht auf eine Wallet wartet, die es noch nicht gibt.

### Weg 3 — VideoIdent, der teure Rückfallweg

Nur nötig, wenn Anwalt oder KJM die günstigeren Wege ausschließen. Dann liegt der Kapitalbedarf bei **245.841 €** — nicht bei einer halben Million, aber rund 86.000 € über der Voreinstellung, und ohne Break-even innerhalb von drei Jahren.

---

## 5 · Die Frage, die alles davor entscheidet

Bevor über Preise gesprochen wird, gehört eine Frage geklärt, die in der Anwaltsakte bisher zu allgemein formuliert ist:

> **Gilt die Pflicht zur geschlossenen Benutzergruppe nach § 4 Abs. 2 JMStV auch für Inhalte, die zwei erwachsene Nutzer einander in einem beidseitig freigegebenen privaten Bereich zeigen — oder nur für das, was der Anbieter selbst öffentlich zugänglich macht?**

Das ist keine Spitzfindigkeit. Der öffentliche Bereich von Cruizy ist nach A-37 ohnehin frei von expliziten Inhalten. Wenn die Norm auf privaten Austausch zwischen identifizierten Erwachsenen nicht in derselben Weise zugreift, fällt Stufe 2 ganz weg — und mit ihr der gesamte Kostenblock.

Fällt sie zu unseren Gunsten aus, liegt der Kapitalbedarf bei **143.397 €**. Fällt sie ungünstig aus und ist zusätzlich VideoIdent nötig, bei **245.841 €**. Die Spanne zwischen bestem und schlechtestem Fall beträgt rund **102.000 €** (Stand 21.09.2026; am 27.07.2026 waren es 49.000 €, am 16.09.2026 rund 71.000 €) — nicht 400.000 €.

**Neu seit A-53 (20.09.2026):** Die KJM erkennt die Altersschätzung per Gesicht als Identifizierungsmodul an. Der Unterschied zwischen den Stufen liegt dann nicht mehr in einer teureren Prüftechnik, sondern in der Authentifizierung derselben Person. Fällt die Annahme teurer Ausweisprüfungen für Stufe 2, fällt das obere Ende der Spanne. Nachgerechnet wird das, sobald **Nr. 40** entschieden ist.

Zusätzlich für den Anwaltstermin, in dieser Reihenfolge:

1. Genügt für Stufe 1 eine Altersschätzung, oder muss auch dort ein Identverfahren stehen?
2. Erkennt die KJM die eID als gleichwertigen persönlichen Kontakt an — und gibt es dazu eine Positivbewertung, auf die wir uns berufen können?
3. Wird die EUDI-Wallet nach dem AVS-Raster genügen, und ab wann?
4. Reicht eine einmalige Identifizierung dauerhaft, oder ist eine Wiederholung nach Zeitablauf vorgesehen?

Frage 4 ist die einzige, die die Rechnung noch einmal kippen könnte: Müsste alle zwei Jahre neu identifiziert werden, stiege die Zahl der Prüfungen wieder deutlich.

---

## 6 · Zusätzliche Geldquellen — was über A-09 und A-12 hinaus existiert

Vollständig mit Konditionen im Blatt „Finanzierungswege“, Abschnitt 5. Die drei wichtigsten:

**Mikromezzaninfonds Deutschland** ist die interessanteste Ergänzung. Stille Beteiligung bis 100.000 €, für bestimmte Zielgruppen bis 150.000 €, über die mittelständische Beteiligungsgesellschaft des Sitzlandes. Laufzeit zehn Jahre, **Tilgung erst ab Jahr 7** — also weit nach dem Break-even. Keine Sicherheiten, keine Stimmrechte, bilanziell wie Eigenkapital. Zu den ausdrücklich angesprochenen Zielgruppen zählen gemeinwohlorientierte Unternehmen. Der Haken: 11 % ergebnisunabhängige Vergütung im Jahr, abgemildert durch einen Zinszuschuss von 3 %. Das ist teuer — aber es ist Geld, das keine Anteile kostet und in den ersten sechs Jahren nicht getilgt werden muss.

**Bürgschaftsbank Niedersachsen** schließt die Lücke zwischen „die Bank will Sicherheiten“ und „wir haben keine“. Ausfallbürgschaft bis 80 % des Kreditbetrags, mindestens 12.000 €. Der Antrag läuft über die Hausbank, nicht direkt.

**Vorverkauf von Jahresabos an die Warteliste** ist die einzige Quelle, die zugleich Marktforschung ist: 500 Jahresabos zu 70 € ergäben 35.000 € brutto — von genau den Menschen, für die gebaut wird. Rechtlich aber nicht trivial: Vorkasse für eine noch nicht existierende Leistung, Widerrufsrecht, umsatzsteuerliche Behandlung der Anzahlung. Gehört vor jedem Verkauf auf die Anwaltsliste — dort steht es seit dem 22.09.2026 als **R16** (`../10-recht-gruendung/anwaltstermin/nachtrag-04-fragen-19-bis-21-september-2026.md`, Abschnitt 4.2).

**Eine Warnung zu INVEST:** Der BAFA-Zuschuss für Wagniskapital macht uns für Business Angels attraktiver, ohne dass wir mehr abgeben — der Staat übernimmt einen Teil des Tickets. Der Erwerbszuschuss liegt 2026 bei 15 % (2023 waren es 25 %). Aber das Programm ist **bis zum 31.12.2026 verlängert**, und unser Start liegt frühestens im Sommer 2028, geplant ein Jahr später. Ob es dann noch existiert, weiß heute niemand.

---

## 7 · Was sich dadurch am Gesamtbild ändert

| | 27.07.2026, vorher | 16.09.2026 | **21.09.2026, mit den Beschlüssen** |
|---|---|---|---|
| Kapitalbedarf Firma, realistisch, Voreinstellung eID | 96.252 € | 107.349 € | **160.253 €** |
| Kapitalbedarf im teuersten Fall (VideoIdent) | 485.189 € | 166.548 € | **245.841 €** |
| Spanne zwischen bestem und schlechtestem Fall | 389.000 € | rund 71.000 € | **rund 102.000 €** |
| Gesamtbedarf inkl. Lebenshaltung und Krankenversicherung, realistisch | 153.452 € | 169.749 € | **233.053 €** |

**Die Botschaft vom Juli gilt weiter:** Die Unsicherheit durch die Jugendschutzfrage ist beherrschbar geworden. **Die Botschaft vom September kommt dazu:** Die Beschlüsse — vollständige Code-Prüfung, CSD zum Start, eigene Veranstaltungen, keine bezahlte Sichtbarkeit — kosten zusammen rund 53.000 € Kapitalbedarf. Keiner davon ist ein Rechenfehler, jeder ist eine bewusste Entscheidung für Qualität und Glaubwürdigkeit (Nr. 38: „Die App soll nicht kaputtgespart werden"). Eine Lücke von rund 233.000 € ist ein Problem, das man mit Stipendium, Preisgeldern, Eigenkapital, Crowdfunding und Mikromezzanin angehen kann — aber nicht mehr mit einem davon allein.

---

## 8 · Was jetzt zu tun ist

| # | Was | Wer | Wann |
|---|---|---|---|
| 1 | Die vier JMStV-Fragen als Nachtrag zur Anwaltsakte ausformuliert — `10-recht-gruendung/anwaltstermin/nachtrag-01-jmstv-verifizierungswege.md`. Zusammen mit der Akte an den Anwalt geben | KI, erledigt 27.07.2026 | — |
| 2 | Zwei-Stufen-Architektur in der Produktspezifikation festschreiben (A-29), damit sie nicht später als Nachgedanke auftaucht | KI, **erledigt 17.09.2026** (Z-03) | — |
| 3 | Preisanfragen an AusweisIDent und zwei weitere eID-Anbieter — Stückpreis bei 30.000 bis 100.000 Prüfungen im Jahr | Gründer | V2, vor dem Anbietervergleich |
| 4 | EUDI-Wallet „d-you“ beobachten: Ab Januar 2027 zeigt sich, wie gut sie funktioniert und was die abfragende Seite zahlt | wiederkehrende Beobachtung (R-01) | ab Q1 2027 |
| 6 | **Nach der Entscheidung zu Nr. 40** die vier Wege mit der Architektur aus A-53 neu rechnen — Schalter und Anteil Stufe 2 im Blatt „Annahmen“ | KI | nach Nr. 40 |
| 5 | Mikromezzaninfonds beim Sitzland vormerken — der Antrag geht erst nach der Gründung, die Voraussetzungen sollten aber vorher bekannt sein | Gründer | V3 |

---

## Quellen

Abschnitte 1 bis 6: alle am 27.07.2026 abgerufen. Stand vom 21.09.2026: Nachrechnung im Finanzmodell (A-52) mit Varianten für jeden Prüfweg; `../10-recht-gruendung/altersverifikation-stand-2026.md` (A-53, Quellen dort, abgerufen 20.09.2026).

1. KJM — AVS-Raster, zweistufiges Verfahren aus einmaliger Identifizierung und Authentifizierung, zulässige Identifizierungswege einschließlich eID · kjm-online.de, Bereich Altersverifikationssysteme
2. KJM — Positivbewertungen von Altersverifikationssystemen, Pressemitteilungen · kjm-online.de
3. Datenschutz bei Altersverifikationssystemen gemäß KJM · activemind.de
4. EUDI-Wallet in Deutschland ab 02.01.2027 kostenlos verfügbar, aufbauend auf AusweisApp und eID · bmds.bund.de, Bereich digitale Identitäten
5. EUDI-Wallet — Altersnachweis genügt als Bestätigung des Erreichens einer Altersgrenze; Altersverifikationsliste · netzpolitik.org, FAQ zur EUDI-Wallet (2026)
6. EUDI-Wallet — aktueller Stand und Zeitplan · heise.de
7. eID gegenüber Post- und VideoIdent: Kostenvergleich, Banken zahlen 7–8 € je VideoIdent mit erwartetem Rückgang auf 2 € · it-finanzmagazin.de
8. AusweisIDent — transaktionsbasierte Abrechnung, schneller und günstiger als POSTIDENT und VideoIdent · bundesdruckerei.de
9. Mikromezzaninfonds Deutschland — bis 100.000 €, Zielgruppen bis 150.000 €, 10 Jahre, 11 % Vergütung mit 3 % Zinszuschuss, Tilgung ab Jahr 7 · mikromezzaninfonds-deutschland.de und bundeswirtschaftsministerium.de
10. ERP-Förderkredit Gründung und Nachfolge (077) — seit 01.11.2024, ohne Besicherung außer Bürgschaftsbankgarantie · kfw.de, Merkblatt 077
11. Bürgschaftsbank Niedersachsen — Classic-Bürgschaft bis 80 %, min. 12.000 €, max. 2,0 Mio. €, Antrag über die Hausbank · ni.ermoeglicher.de
12. INVEST — Zuschuss für Wagniskapital: 15 % Erwerbszuschuss 2026, 25 % Exitzuschuss, Programm bis 31.12.2026 verlängert · bafa.de
13. Eigene Vorarbeiten: `verifizierungsanbieter-vergleich.xlsx` (A-07), `moderationsarchitektur.md` (A-37), `wettbewerbe.xlsx` (A-12), `finanzmodell.xlsx` (A-13)
