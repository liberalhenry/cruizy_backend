# Datenraum-Struktur für Investoren und Förderprüfer

> ## ⚠ ENTWURF — Struktur und Lückenliste, kein angelegter Datenraum
>
> Dieses Dokument beschreibt, **wie** der Datenraum aufgebaut wird und **was darin heute fehlt**. Es legt keinen Datenraum an, lädt nichts hoch und gibt nichts frei. Jede Freigabe an Dritte ist eine eigene Entscheidung der Gründer.

Erstellt: 18.09.2026 · Aufgabe A-34 · Rolle: Transaktionsberater · Fenster **V3**, als Vorfassung vorgezogen
Stand der Lückenliste: **19.09.2026** — an diesem Tag sind 00.02, 04.08 und 06.05 entstanden (A-43, A-44, A-45).
Grundlagen: der Projektordner selbst (Bestandsaufnahme vom 18.09.2026) · `01-steuerung/offene-entscheidungen.md` · `01-steuerung/zeitplan-bis-start.md` · Handbuch A und B

---

## Auf einen Blick

| Größe | Wert |
|---|---|
| Bereiche | 7 |
| Dokumente im Register | 83 |
| davon liegt vor | **36** |
| davon in Arbeit | 9 |
| davon fehlt | **38** |
| Deckungsgrad (vorhanden oder in Arbeit) | **54 %** |
| Lücken erster Priorität | 8 |
| Dokumente, die nie hinausgehen (Stufe S4) | 3 |

**Der Befund in einem Satz:** Produkt, Technik und Finanzen sind für ein Vorhaben ohne Gesellschaft ungewöhnlich vollständig — was fehlt, ist fast ausschließlich das, was eine **bestehende Gesellschaft** und **gemessene Zahlen** voraussetzt, plus elf Dokumente, die man heute schreiben könnte und noch nicht geschrieben hat.

**Warum das Dokument jetzt entsteht und nicht nach dem ersten Pitch:** Nach einem guten Gespräch kommt die Unterlagenanfrage, und sie kommt mit einer Frist. Wer dann drei Wochen sortiert, wirkt unvorbereitet — und zwar genau in dem Moment, in dem das Gegenteil noch wirkt. Die Struktur steht deshalb vorher; gefüllt wird sie nach und nach.

---

## 1 · Wie der Raum aufgebaut ist

**Ein Ordner je Bereich, durchnummeriert.** Die Nummer ist die Ordnung — sie bleibt, auch wenn ein Dokument dazukommt oder entfällt. Zitiert wird die Kennung, nicht der Dateiname: „04.08“ ist eindeutig, „Cap Table final v3“ nicht.

| Regel | Was sie verhindert |
|---|---|
| **Dateiname = `Kennung · Titel · Stand JJJJ-MM-TT`** | Zwei Fassungen desselben Dokuments im Umlauf, ohne dass jemand merkt, welche die neuere ist |
| **Weitergabeformat ist PDF** | Dass ein Prüfer in einer Tabelle Formeln, Kommentare oder gelöschte Zeilen findet, die für ihn nicht bestimmt waren |
| **Ausnahme Finanzmodell** | Wer das Modell nachrechnen will, bekommt die Tabelle — aber erst in Stufe 3 und ohne das Blatt mit internen Notizen |
| **Ein Stand wird eingefroren** | Dass sich Zahlen ändern, während jemand prüft. Nachträge kommen als eigenes Dokument, nicht als stille Korrektur |
| **Jede Freigabe wird protokolliert** | Streit darüber, was zugesagt oder gezeigt wurde (Dokument 00.04) |
| **Kein Dokument ohne Stand und Zuständigen** | Dass niemand weiß, wen man fragt, wenn eine Zahl nicht stimmt |

**Wo der Raum liegt:** Nicht in diesem Projektordner. Der Projektordner ist die Werkstatt — er enthält Arbeitsstände, Fragenkataloge und Notizen, die nicht für Dritte bestimmt sind. Der Datenraum wird beim ersten Bedarf als eigener, freigabefähiger Ort angelegt und aus der Werkstatt **befüllt**, nicht mit ihr verwechselt.

---

## 2 · Die vier Vertraulichkeitsstufen

| Stufe | Wer sieht es | Wann | Beispiele |
|---|---|---|---|
| **S1** | jeder, der fragt | sofort, ohne Vereinbarung | Einseiter, Pitchdeck als PDF, AGB, Datenschutzerklärung |
| **S2** | nach unterschriebener Geheimhaltungsvereinbarung | binnen 48 Stunden nach Eingang | Finanzmodell als PDF, Kapitaltabelle, Lebensläufe, Marktzahlen |
| **S3** | erst bei ernsthaftem Interesse — schriftliche Absichtserklärung oder laufende Förderprüfung | nach ausdrücklicher Freigabe durch beide Gründer | Gesellschaftsvertrag, Spezifikation, Sicherheitskonzept, Rechtsfragen im Detail |
| **S4** | niemand außerhalb des Teams | nie | siehe Abschnitt 5 |

**Die Stufe steht am Dokument, nicht am Empfänger.** Sonst wird sie im Gespräch verhandelt, und im Gespräch gewinnt immer der, der mehr Übung hat.

---

## 3 · Das Register

Status: **liegt vor** = im Projektordner vorhanden, gegebenenfalls als Entwurf · **in Arbeit** = begonnen, noch nicht abnahmefähig · **fehlt** = existiert nicht.

### 00 · Überblick und Zugang

Was ein Prüfer zuerst öffnet. Drei Seiten, aus denen hervorgeht, was das Vorhaben ist, wie der Raum aufgebaut ist und wer wann was gesehen hat.

*6 Dokumente · 3 liegen vor · 1 in Arbeit · 2 fehlen*

| Kennung | Dokument | Wozu | Zuständig | Status | Stufe | Im Projektordner |
|---|---|---|---|---|---|---|
| 00.01 | **Inhaltsverzeichnis des Datenraums** | Einstieg: Bereiche, Dokumente, Stand je Dokument. Dieses Dokument ist die Vorlage dafür. | Gründer 1 | in Arbeit | S1 | `40-finanzen-foerderung/datenraum-struktur.md` |
| 00.02 | **Einseiter „Was Cruizy ist“** | Eine Seite, die ohne Vorwissen verständlich macht, worum es geht. Geht vor jedem NDA heraus. | Gründer 1 | liegt vor | S1 | `40-finanzen-foerderung/einseiter-was-cruizy-ist.md` |
| 00.03 | **Geheimhaltungsvereinbarung (Muster)** | Damit Stufe 2 ohne Verhandlung freigegeben werden kann. Ohne Muster kostet jede Anfrage eine Woche. | Anwalt | **fehlt** | S1 | — |
| 00.04 | **Zugriffsprotokoll** | Wer wann welches Dokument in welchem Stand erhalten hat. Schützt bei späterem Streit über Zugesagtes. | Gründer 1 | **fehlt** | S4 | — |
| 00.05 | **Investorenpräsentation** | Der Pitch selbst, 14 Folien. Geht als PDF heraus, nie als bearbeitbare Datei. | Gründer 1 | liegt vor | S1 | `40-finanzen-foerderung/pitchdeck-investoren.pptx` |
| 00.06 | **Präsentation für Förderstellen** | Dieselbe Sache im Maßstab eines Prüfers: Machbarkeit, Mittelverwendung, Nachweise. | Gründer 1 | liegt vor | S1 | `40-finanzen-foerderung/praesentation-foerderung.pptx` |

### 01 · Gesellschaft und Recht

Wer haftet, wem gehört was, welche Pflichten sind erkannt. Der Bereich, in dem das Vorhaben heute am dünnsten ist — die GmbH entsteht erst zu T0 (Nr. 22).

*16 Dokumente · 5 liegen vor · 1 in Arbeit · 10 fehlen*

| Kennung | Dokument | Wozu | Zuständig | Status | Stufe | Im Projektordner |
|---|---|---|---|---|---|---|
| 01.01 | **Gesellschaftsvertrag** | Stichentscheid bei 50/50, Vesting, reduzierte Mitarbeit, Mitverkaufsrechte, Wettbewerbsverbot (Nr. 4). | Notar + Anwalt | **fehlt** | S3 | — |
| 01.02 | **Handelsregisterauszug** | Existenznachweis der Gesellschaft. Entsteht erst mit der Gründung zu T0 (Nr. 22). | Gründer 1 | **fehlt** | S1 | — |
| 01.03 | **Gesellschafterliste** | Wer hält welchen Anteil. Grundlage jeder Beteiligungsverhandlung. | Notar | **fehlt** | S2 | — |
| 01.04 | **Entscheidungsvorlage GmbH oder UG** | Belegt, dass die Rechtsform begründet gewählt wurde und nicht geraten (Nr. 2, Nr. 20). | Gründer 1 | liegt vor | S2 | `10-recht-gruendung/entscheidungsvorlage-gmbh-ug.docx` |
| 01.05 | **Vorbereitungsvereinbarung der Gründer** | Regelt die Zeit vor der Beurkundung: wem gehören Vorarbeiten, wie gehen sie auf die GmbH über (Nr. 26). | Anwalt | in Arbeit | S3 | `10-recht-gruendung/vorbereitungsvereinbarung-ENTWURF.md` |
| 01.06 | **Checkliste Notartermin** | Zeigt Vorbereitungsgrad. Im Datenraum zweitrangig, für die Gründung wesentlich. | Gründer 1 | liegt vor | S2 | `10-recht-gruendung/checkliste-notartermin.docx` |
| 01.07 | **Rechts-Statusbericht** | **Das wichtigste fehlende Dokument des Bereichs.** Zwei Seiten: welche Rechtsfragen erkannt sind, welche geklärt, welche offen, und was der schlechteste Ausgang kostet. Wird aus der Anwaltsakte abgeleitet — die Akte selbst geht nicht hinaus. | Gründer 1 + Anwalt | **fehlt** | S2 | — |
| 01.08 | **Einschätzung zum Jugendschutz (JMStV)** | Die teuerste offene Frage des Vorhabens (Nr. 1): Prüfweg, Kosten, Folgen für das Geschäftsmodell. | Anwalt | liegt vor | S3 | `10-recht-gruendung/jmstv-problem-und-einschaetzung.md` |
| 01.09 | **Markenrecherche** | Zeigt, dass der Name geprüft wurde — samt der gefundenen Vorbenutzung (Nr. 5). | Gründer 1 | liegt vor | S2 | `10-recht-gruendung/markenrecherche-cruizy.md` |
| 01.10 | **Markenanmeldung** | Anmeldebeleg DPMA oder EUIPO. Steht aus, weil der Name erst nach den Interviews feststeht (Nr. 5). | Gründer 1 | **fehlt** | S1 | — |
| 01.11 | **Nachweis der Domains und Konten** | Wem gehören Domains, Kanalkonten, Entwicklerkonten — vor der Gründung private Konten, nach der Gründung zu übertragen. | Gründer 2 | **fehlt** | S2 | — |
| 01.12 | **Vergleich der Impressumslösungen** | Belegt die Prüfung der Anbieterpflichten vor der Freischaltung (Nr. 6). | Gründer 1 | liegt vor | S3 | `10-recht-gruendung/impressumsloesung-vergleich.md` |
| 01.13 | **AGB und Nutzungsbedingungen** | Vertragsgrundlage gegenüber Nutzern; im Datenraum als Nachweis der Verbraucher- und DSA-Transparenzpflichten. | Anwalt | **fehlt** | S1 | — |
| 01.14 | **Widerrufsbelehrung und Abo-Bedingungen** | Fernabsatzrecht und Kündigungsschaltfläche. Ohne diese Texte ist kein Abo verkäuflich. | Anwalt | **fehlt** | S1 | — |
| 01.15 | **Wesentliche Verträge** | Hosting, Zahlungsdienst, Verifizierungsanbieter, Maildienst, Ortsvereinbarungen (Muster). Entstehen mit dem Bau. | Gründer 1 | **fehlt** | S3 | — |
| 01.16 | **Mitgliedschaft in einer Selbstkontrolle** | FSM-Mitgliedschaft kann Jugendschutzbeauftragten, Beschwerdeweg und Prüfnachweis zugleich abdecken. | Gründer 1 | **fehlt** | S2 | — |

### 02 · Produkt und Technik

Was gebaut wird und wie. Hier liegt der Teil, der schon ungewöhnlich weit ist: Spezifikation, Abläufe und Bauplan stehen vor der ersten Zeile Code.

*13 Dokumente · 3 liegen vor · 4 in Arbeit · 6 fehlen*

| Kennung | Dokument | Wozu | Zuständig | Status | Stufe | Im Projektordner |
|---|---|---|---|---|---|---|
| 02.01 | **Produktspezifikation** | Das Herzstück: 75 Funktionen mit 674 geltenden Akzeptanzkriterien, Grenzfällen und offenen Punkten. Belegt Durchdachtheit besser als jede Folie. | Gründer 1 | in Arbeit | S3 | `50-produkt-prototyp/produktspezifikation.md` |
| 02.02 | **Nutzerabläufe** | Zehn Abläufe Schritt für Schritt, mit jeder Stelle, an der ein Mensch abbricht. | Gründer 1 | in Arbeit | S3 | `50-produkt-prototyp/nutzerablaeufe.md` |
| 02.03 | **Wireframe-Textspezifikation** | Bildschirm für Bildschirm in Worten — ersetzt das fehlende Designbudget. | Gründer 1 | in Arbeit | S3 | `50-produkt-prototyp/wireframes-textspezifikation.md` |
| 02.04 | **Systemtexte** | Jeder Text, den das Produkt sagt. Zeigt Haltung und Sorgfalt an der Stelle, an der Nutzer sie erleben. | Gründer 1 | in Arbeit | S3 | `50-produkt-prototyp/systemtexte-ENTWURF.md` |
| 02.05 | **Moderationsarchitektur** | Drei Zonen, Fristen, Vieraugenprinzip. **Nur in redigierter Fassung** — konkrete Schwellenwerte gehören nicht in fremde Hände. | Gründer 1 | liegt vor | S3 | `50-produkt-prototyp/moderationsarchitektur.md` |
| 02.06 | **Bauplan der Entwicklung** | Arbeitspakete AP-0 bis AP-11 mit Reihenfolge, Abhängigkeiten und Prüfpunkten. | Gründer 1 | liegt vor | S3 | `70-entwicklung-ab-monat-4/code-planer.md` |
| 02.07 | **Aufsetzstruktur der Entwicklungsumgebung** | Wie die Arbeit mit einem Entwicklungswerkzeug organisiert ist — relevant, weil ein Zweierteam damit die Leistung eines größeren erbringen muss. | Gründer 1 | liegt vor | S3 | `70-entwicklung-ab-monat-4/claude-code-kickoff-struktur.md` |
| 02.08 | **Architekturübersicht** | Ein Bild: Systemgrenzen, Datenflüsse, Dienstleister, wo personenbezogene Daten liegen. Fehlt als eigenständiges Dokument. | Gründer 1 | **fehlt** | S2 | — |
| 02.09 | **Sicherheitskonzept** | Schutzziele, Rollen, Schlüsselverwaltung, Protokollierung, Notfallzugriff. Setzt den Rahmen für die Prüfung in Phase 1d. | Gründer 1 | **fehlt** | S3 | — |
| 02.10 | **Bericht der Sicherheitsprüfung** | Externe Prüfung mit Schwerpunkt Standort und Bilder, geplant für Monat 8 bis 9. **Nur die Zusammenfassung mit behobenen Befunden** geht hinaus. | Extern beauftragt | **fehlt** | S3 | — |
| 02.11 | **Notfall- und Wiederanlaufplan** | Was passiert bei Ausfall, Datenabfluss, Erpressung. Auch Meldefristen nach Art. 33 DSGVO. | Gründer 1 | **fehlt** | S3 | — |
| 02.12 | **Abhängigkeiten und Lizenzen** | Liste der verwendeten Fremdbestandteile mit Lizenz. In jeder technischen Prüfung eine Standardfrage. | Gründer 1 | **fehlt** | S2 | — |
| 02.13 | **Barrierefreiheitserklärung** | Pflicht ab Überschreiten der Kleinstunternehmensgrenze; wir wollen uns nicht auf die Ausnahme stützen (Nr. 27). | Gründer 1 | **fehlt** | S1 | — |

### 03 · Datenschutz

Der Bereich, an dem dieses Vorhaben gemessen wird. Wer besondere Kategorien nach Art. 9 DSGVO verarbeitet, wird hier geprüft und nicht bei der Marktgröße.

*14 Dokumente · 4 liegen vor · 1 in Arbeit · 9 fehlen*

| Kennung | Dokument | Wozu | Zuständig | Status | Stufe | Im Projektordner |
|---|---|---|---|---|---|---|
| 03.01 | **Verzeichnis von Verarbeitungstätigkeiten** | Art. 30 DSGVO. Das erste Dokument, nach dem eine Aufsichtsbehörde fragt — und ein sorgfältiger Investor auch. | DSB + Gründer 1 | **fehlt** | S2 | — |
| 03.02 | **Datenschutz-Folgenabschätzung** | Art. 35 DSGVO. Bei besonderen Kategorien und Standortbezug praktisch zwingend. | DSB + Anwalt | **fehlt** | S3 | — |
| 03.03 | **Auftragsverarbeitungsverträge** | Art. 28 DSGVO, je Dienstleister einer. Entstehen mit den Verträgen aus 01.15. | Gründer 1 | **fehlt** | S2 | — |
| 03.04 | **Bestellung des Datenschutzbeauftragten** | Bei umfangreicher Verarbeitung besonderer Kategorien zu prüfen und voraussichtlich Pflicht. | Gründer 1 | **fehlt** | S2 | — |
| 03.05 | **Ausschreibung und Fragenkatalog DSB** | Belegt, dass die Beschaffung vorbereitet ist — 18 Fragen mit Bewertungsmaßstab. | Gründer 1 | liegt vor | S2 | `10-recht-gruendung/dsb-ausschreibung-fragenkatalog.md` |
| 03.06 | **Datenschutzhinweis Warteliste** | Der erste Text, der veröffentlicht wird, weil die Warteliste vor allem anderen live geht. | Anwalt | in Arbeit | S1 | `10-recht-gruendung/datenschutzhinweis-warteliste-ENTWURF.md` |
| 03.07 | **Datenschutzerklärung der App** | Muss die Rechtsnachfolge ausdrücklich vorsehen, sonst gefährdet ein Verkauf die Art.-9-Einwilligungen (Nr. 12). | Anwalt | **fehlt** | S1 | — |
| 03.08 | **Löschkonzept** | Fristen je Datenart, Kaskaden, Nachweis der Umsetzung. Im Bauplan als Test verankert. | Gründer 1 | **fehlt** | S2 | — |
| 03.09 | **Technische und organisatorische Maßnahmen** | Art. 32 DSGVO als Übersicht — verschlüsselte Ablage, Zugriffsrollen, Protokolle. | Gründer 1 | **fehlt** | S3 | — |
| 03.10 | **Nachweis der Einwilligungen nach Art. 9** | Versionierte Einwilligungen mit Zweck, Textstand, Zeitstempel und Widerruf. Architektonisch vorgesehen, noch nicht gebaut. | Gründer 1 | **fehlt** | S3 | — |
| 03.11 | **Vergleich der Verifizierungsanbieter** | Drei Anbieter mit EU-Sitz, Löschzusage und Einordnung nach KI-VO (Nr. 7). | Gründer 1 | liegt vor | S2 | `10-recht-gruendung/verifizierungsanbieter-vergleich.xlsx` |
| 03.12 | **Vergleich der Maildienste** | Auswahl des Versanddienstes nach Sitz, Auftragsverarbeitung und Preis. | Gründer 2 | liegt vor | S2 | `10-recht-gruendung/maildienst-vergleich.xlsx` |
| 03.13 | **Zugangswege zum Hash-Abgleich** | Wie der Abgleich gegen bekanntes Missbrauchsmaterial rechtlich und praktisch möglich wird (Nr. 17, Nr. 30). | Gründer 1 | liegt vor | S3 | `10-recht-gruendung/hash-abgleich-zugangswege.md` |
| 03.14 | **Trefferprozess beim Hash-Abgleich** | Was bei einem Treffer geschieht, wer entscheidet, welche Fristen gelten (Nr. 31). In Arbeit als A-36. | Gründer 1 | **fehlt** | S4 | — |

### 04 · Finanzen

Modell, Bedarf, Herkunft der Zahlen. Vollständig, solange es keine Ist-Zahlen gibt — die kommen erst nach T0.

*12 Dokumente · 7 liegen vor · 2 in Arbeit · 3 fehlen*

| Kennung | Dokument | Wozu | Zuständig | Status | Stufe | Im Projektordner |
|---|---|---|---|---|---|---|
| 04.01 | **Finanzmodell** | Drei Szenarien über 36 Monate mit Kennzahlen, Herkunft jeder Zahl und benannten Widersprüchen. | Gründer 1 | liegt vor | S2 | `40-finanzen-foerderung/finanzmodell.xlsx` |
| 04.02 | **Gegenrechnung des Kapitalbedarfs** | Zeigt, dass der Bedarf nachgerechnet und nicht übernommen wurde — einschließlich der Korrektur nach oben. | Gründer 1 | liegt vor | S2 | `40-finanzen-foerderung/kapitalbedarf-gegenrechnung.md` |
| 04.03 | **Businessplan** | Der Fließtext zum Modell. **Der Anhang wird vor jeder Weitergabe entfernt** — er enthält interne Arbeitsstände. | Gründer 1 | in Arbeit | S2 | `40-finanzen-foerderung/businessplan-ENTWURF.docx` |
| 04.04 | **Kostenmodell des Gründungszeitpunkts** | Belegt die Entscheidung, erst zu T0 zu gründen (Nr. 22), mit Zahlen statt Gefühl. | Gründer 1 | liegt vor | S2 | `40-finanzen-foerderung/gruendungszeitpunkt-kostenmodell.xlsx` |
| 04.05 | **Übersicht der Fördermittel** | Programme, Höhen, Ausschlüsse, Sitzvergleich Niedersachsen gegen Hessen (Nr. 21). | Gründer 1 | liegt vor | S2 | `40-finanzen-foerderung/foerdermittel-uebersicht.xlsx` |
| 04.06 | **Übersicht der Gründungswettbewerbe** | 16 Wettbewerbe mit Fristen und Wechselwirkungen — zeigt den Finanzierungsweg ohne Beteiligung. | Gründer 1 | liegt vor | S2 | `40-finanzen-foerderung/wettbewerbe.xlsx` |
| 04.07 | **Crowdfunding-Konzept und Rechner** | Der dritte Finanzierungsweg, durchgerechnet bis zur Gegenleistung je Betrag. | Gründer 2 | liegt vor | S2 | `40-finanzen-foerderung/crowdfunding/crowdfunding-konzept.md` |
| 04.08 | **Kapitaltabelle** | Wer hält was, vor und nach einer Beteiligung, mit Verwässerung. Rechnet; die Beträge auf dem Blatt „Beteiligung“ sind bis zur Entscheidung Nr. 20 Beispielwerte. | Gründer 1 | in Arbeit | S2 | `40-finanzen-foerderung/kapitaltabelle.xlsx` |
| 04.09 | **Ist-Zahlen und laufende Auswertung** | Entsteht erst nach der Gründung. Bis dahin steht im Modell das Blatt „Ist-Werte“ leer bereit. | Steuerberater | **fehlt** | S3 | — |
| 04.10 | **Eröffnungsbilanz und Steuernummern** | Steuernummer, Umsatzsteuer-Identifikationsnummer, Eröffnungsbilanz — alles nach T0. | Steuerberater | **fehlt** | S3 | — |
| 04.11 | **Nachweis der Kapitaleinzahlung** | Beleg über das eingezahlte Stammkapital nach dem gewählten Modell (Nr. 20). | Gründer 1 | **fehlt** | S3 | — |
| 04.12 | **Planung der Mittelverwendung** | Position für Position, welcher Euro wofür — für Förderprüfer die zentrale Seite. | Gründer 1 | liegt vor | S2 | `40-finanzen-foerderung/praesentation-foerderung-skript.md` |

### 05 · Markt und Traktion

Was belegt ist und was noch Annahme. Der Bereich, in dem der größte Teil erst nach den Interviews ab Oktober 2026 entsteht.

*16 Dokumente · 12 liegen vor · 0 in Arbeit · 4 fehlen*

| Kennung | Dokument | Wozu | Zuständig | Status | Stufe | Im Projektordner |
|---|---|---|---|---|---|---|
| 05.01 | **Interviewleitfaden** | Wie die 60 bis 80 Gespräche geführt werden — belegt Methodik, bevor Ergebnisse da sind. | Gründer 2 | liegt vor | S2 | `20-interviews-feedback/interviewleitfaden.docx` |
| 05.02 | **Anonyme Protokollvorlage** | Stellt sicher, dass keine identifizierbaren Daten entstehen. **Grund, warum es nie Rohprotokolle zu zeigen gibt.** | Gründer 2 | liegt vor | S2 | `20-interviews-feedback/protokoll-vorlage-anonym.docx` |
| 05.03 | **Auswertung der Interviews** | Die aggregierte Auswertung. Entsteht ab Oktober 2026, fertig im Frühjahr 2027 — bis dahin bleibt jede Aussage zum Problem eine Analyse, kein Beleg. | Gründer 2 | **fehlt** | S2 | — |
| 05.04 | **Konzept der Wartelisten-Umfrage** | Fragen, Reihenfolge, Auswertungslogik der Umfrage an die Warteliste. | Gründer 2 | liegt vor | S2 | `20-interviews-feedback/wartelisten-umfrage.md` |
| 05.05 | **Auswertungstabelle der Umfrage** | Vorbereitete Auswertung mit Formeln — wartet auf reale Antworten. | Gründer 2 | liegt vor | S2 | `20-interviews-feedback/wartelisten-umfrage-auswertung.xlsx` |
| 05.06 | **Stand der Warteliste** | Anmeldungen je Woche und Postleitzahl, Quelle je Anmeldung. **Die Zahl geht hinaus, die Liste nie.** | Gründer 2 | **fehlt** | S2 | — |
| 05.07 | **Kanalzahlen** | Reichweite, Folgende, Interaktionen je Format und Woche — die einzige Traktion, die vor T0 messbar ist. | Gründer 2 | **fehlt** | S2 | — |
| 05.08 | **Ortsliste Köln** | Rund 40 Orte mit Priorität und Stand. **Nur aggregiert**: Anzahl Zusagen je Stadtteil, keine Namen und keine Ansprechpartner. | Gründer 1 | liegt vor | S4 | `60-orte-b2b/ortsliste-koeln.xlsx` |
| 05.09 | **Muster der Ortsvereinbarung** | Was ein Ort zusagt und was er bekommt. Fehlt, wird vor der ersten Zusage gebraucht. | Gründer 1 | **fehlt** | S2 | — |
| 05.10 | **Playbook der Kontaktanlässe** | Wie Orte angesprochen werden, mit Anlässen statt Kaltbesuchen. | Gründer 1 | liegt vor | S3 | `60-orte-b2b/kontaktanlaesse-playbook.md` |
| 05.11 | **Skalierungs-Playbook** | Wann und wie die zweite Stadt beginnt, mit Eintrittskriterien als Zahlen (Nr. 70). | Gründer 1 | liegt vor | S3 | `01-steuerung/skalierungs-playbook.md` |
| 05.12 | **Wettbewerbsbeobachtung** | Laufende Beobachtung von Markt und Rechtslage mit Datum je Eintrag. | Gründer 1 | liegt vor | S3 | `01-steuerung/wettbewerbsbeobachtung-log.md` |
| 05.13 | **Redaktionsplan der Kanäle** | Zwölf Wochen Vorlauf, Format für Format — belegt, dass Reichweite geplant und nicht gehofft wird. | Gründer 2 | liegt vor | S3 | `30-marketing-kanaele/redaktionsplan-12-wochen.xlsx` |
| 05.14 | **Konzept des Terminservice** | Der Vorlauf ohne App: Termine sammeln, prüfen, veröffentlichen. | Gründer 2 | liegt vor | S3 | `30-marketing-kanaele/terminservice-konzept.md` |
| 05.15 | **Texte der Wartelistenseite** | Die Seite, über die die erste Reichweite entsteht. | Gründer 2 | liegt vor | S2 | `30-marketing-kanaele/landingpage-copy-warteliste.md` |
| 05.16 | **Vorlagen für Krisenkommunikation** | Was gesagt wird, wenn etwas schiefgeht. Für Prüfer ein Reifezeichen, kein Alarmsignal. | Gründer 2 | liegt vor | S3 | `30-marketing-kanaele/krisenkommunikation-vorlagen.md` |

### 06 · Team

Zwei Personen, geteilte Zuständigkeit, eine bekannte Lücke. Wird ehrlich dargestellt, weil jeder Prüfer sie ohnehin findet.

*6 Dokumente · 2 liegen vor · 0 in Arbeit · 4 fehlen*

| Kennung | Dokument | Wozu | Zuständig | Status | Stufe | Im Projektordner |
|---|---|---|---|---|---|---|
| 06.01 | **Lebensläufe beider Gründer** | Werdegang, Fähigkeiten, Vorarbeiten. **Fehlt und wird in jeder Anfrage verlangt.** | Gründer 1 und 2 | **fehlt** | S2 | — |
| 06.02 | **Vesting-Vereinbarung** | Vier Jahre, zwölf Monate Cliff (Nr. 4). Schützt beide Seiten und ist Bedingung jeder Beteiligung. | Anwalt | **fehlt** | S3 | — |
| 06.03 | **Aufgabenteilung im Team** | Wer verantwortet was, wo liegt die Vertretung. Grundlage ist die dokumentierte Arbeitsteilung mit der KI. | Gründer 1 | liegt vor | S2 | `01-steuerung/ki-arbeitsteilung.md` |
| 06.04 | **Erklärung zur zeitlichen Verfügbarkeit** | Wie viel Zeit vor dem Abitur (Sommer 2028) zur Verfügung steht und was danach gilt. Ehrlich, weil jeder Prüfer danach fragt. | Gründer 1 und 2 | **fehlt** | S2 | — |
| 06.05 | **Liste der zugekauften Qualifikationen** | Was das Team nicht kann und wer es stattdessen macht — dreizehn Einmalposten über 55.900 € (seit 21.09.2026 mit der Code-Prüfung nach Nr. 73), sieben laufende Positionen, dazu was ausdrücklich selbst gemacht wird. | Gründer 1 | liegt vor | S2 | `40-finanzen-foerderung/zukaufliste-qualifikationen.md` |
| 06.06 | **Beirat und Begleitung** | Mentoren, Gründungsnetzwerk, begleitende Einrichtung — für das Stipendium Niedersachsen ohnehin Voraussetzung (Nr. 9). | Gründer 1 | **fehlt** | S2 | — |

---

## 4 · Die Lückenliste

38 Dokumente fehlen. Sie sind nach dem einzigen Kriterium sortiert, das zählt: **wann sie gebraucht werden.** Jede Zeile hat einen Zuständigen — eine Lücke ohne Namen schließt sich nicht.

### P1 · Vor der ersten Unterlagenanfrage (8 Dokumente)

Diese Dokumente entscheiden, ob eine Anfrage in Tagen oder in Wochen beantwortet wird. Der früheste harte Termin ist der **05.01.2027** — der erste Wettbewerbsstichtag (Nr. 5).

| Kennung | Dokument | Zuständig | Bis wann | Woran es hängt |
|---|---|---|---|---|
| 00.03 | **Geheimhaltungsvereinbarung (Muster)** | Anwalt | V1 · Okt 2026 – Mär 2027 | Anwaltstermin; ein Muster reicht, kein Einzelvertrag |
| 00.04 | **Zugriffsprotokoll** | Gründer 1 | V1 · Okt 2026 – Mär 2027 | nichts — eine Tabelle mit fünf Spalten |
| 01.07 | **Rechts-Statusbericht** | Gründer 1 + Anwalt | V1 · Okt 2026 – Mär 2027 | Anwaltstermin; die Akte liegt vor, der Bericht ist ihre Kurzfassung |
| 01.11 | **Nachweis der Domains und Konten** | Gründer 2 | V1 · Okt 2026 – Mär 2027 | nichts — Bestandsaufnahme der bestehenden Konten |
| 02.08 | **Architekturübersicht** | Gründer 1 | V2 · Apr – Sep 2027 | Architekturentscheidung zur Altersprüfung (Nr. 24, Nr. 39) |
| 05.09 | **Muster der Ortsvereinbarung** | Gründer 1 | V2 · Apr – Sep 2027 | Anwaltstermin (Haftung, Datenschutz beim Ortspartner) |
| 06.01 | **Lebensläufe beider Gründer** | Gründer 1 und 2 | V1 · Okt 2026 – Mär 2027 | nichts |
| 06.04 | **Erklärung zur zeitlichen Verfügbarkeit** | Gründer 1 und 2 | V1 · Okt 2026 – Mär 2027 | nichts |

### P2 · Mit der Gründung (27 Dokumente)

Fast alles davon setzt die GmbH oder den Bau voraus und kann heute nur vorbereitet werden. Wer es früher anfängt, produziert Fassungen, die er zweimal schreibt.

| Kennung | Dokument | Zuständig | Bis wann | Woran es hängt |
|---|---|---|---|---|
| 01.01 | **Gesellschaftsvertrag** | Notar + Anwalt | V4 · Apr – Jul 2028 | Notartermin, Stammkapitalmodell (Nr. 20), Sitz (Nr. 21) |
| 01.02 | **Handelsregisterauszug** | Gründer 1 | T0 · mit der Gründung | Beurkundung und Eintragung |
| 01.03 | **Gesellschafterliste** | Notar | T0 · mit der Gründung | Beurkundung |
| 01.10 | **Markenanmeldung** | Gründer 1 | V2 · Apr – Sep 2027 | Namensentscheidung nach den Interviews (Nr. 5) |
| 01.13 | **AGB und Nutzungsbedingungen** | Anwalt | V4 · Apr – Jul 2028 | Anwalt; setzt die Leistungen der Bezahlstufen voraus (Nr. 67) |
| 01.14 | **Widerrufsbelehrung und Abo-Bedingungen** | Anwalt | V4 · Apr – Jul 2028 | Anwalt; setzt Preise und Abrechnungswege voraus |
| 01.15 | **Wesentliche Verträge** | Gründer 1 | V4 · Apr – Jul 2028 | Anbieterauswahl in V4 |
| 01.16 | **Mitgliedschaft in einer Selbstkontrolle** | Gründer 1 | V4 · Apr – Jul 2028 | Beitrittsvoraussetzungen der Selbstkontrolle, Kosten |
| 02.09 | **Sicherheitskonzept** | Gründer 1 | V4 · Apr – Jul 2028 | Architektur; entsteht mit AP-0 bis AP-2 |
| 02.11 | **Notfall- und Wiederanlaufplan** | Gründer 1 | V4 · Apr – Jul 2028 | Betriebsentscheidungen (Hosting, Sicherung, Meldewege) |
| 02.12 | **Abhängigkeiten und Lizenzen** | Gründer 1 | V4 · Apr – Jul 2028 | den ersten Bauzustand |
| 02.13 | **Barrierefreiheitserklärung** | Gründer 1 | V4 · Apr – Jul 2028 | Prüfung durch Betroffene in Phase 1d |
| 03.01 | **Verzeichnis von Verarbeitungstätigkeiten** | DSB + Gründer 1 | V4 · Apr – Jul 2028 | Datenschutzbeauftragten (03.04) und die endgültige Architektur |
| 03.02 | **Datenschutz-Folgenabschätzung** | DSB + Anwalt | V4 · Apr – Jul 2028 | Verzeichnis (03.01) und Architekturübersicht (02.08) |
| 03.03 | **Auftragsverarbeitungsverträge** | Gründer 1 | V4 · Apr – Jul 2028 | die Verträge aus 01.15 |
| 03.04 | **Bestellung des Datenschutzbeauftragten** | Gründer 1 | V4 · Apr – Jul 2028 | Ausschreibung liegt vor; offen sind Auswahl und Bestellung |
| 03.07 | **Datenschutzerklärung der App** | Anwalt | V4 · Apr – Jul 2028 | Anwalt; muss die Rechtsnachfolge vorsehen (Nr. 12) |
| 03.08 | **Löschkonzept** | Gründer 1 | V4 · Apr – Jul 2028 | Datenmodell; im Bauplan als Test verankert |
| 03.09 | **Technische und organisatorische Maßnahmen** | Gründer 1 | V4 · Apr – Jul 2028 | die gewählten Dienstleister |
| 03.10 | **Nachweis der Einwilligungen nach Art. 9** | Gründer 1 | V4 · Apr – Jul 2028 | AP-1 (Einwilligungen versioniert) |
| 03.14 | **Trefferprozess beim Hash-Abgleich** | Gründer 1 | V3 · Okt 2027 – Mär 2028 | Anwaltstermin (Nr. 30, Nr. 31) — als A-36 in Arbeit |
| 04.11 | **Nachweis der Kapitaleinzahlung** | Gründer 1 | T0 · mit der Gründung | Beurkundung und Konto |
| 05.03 | **Auswertung der Interviews** | Gründer 2 | V1 · Okt 2026 – Mär 2027 | die 60 bis 80 Gespräche ab Oktober 2026 |
| 05.06 | **Stand der Warteliste** | Gründer 2 | V4 · Apr – Jul 2028 | die Freischaltung der Wartelistenseite in V4 |
| 05.07 | **Kanalzahlen** | Gründer 2 | V3 · Okt 2027 – Mär 2028 | den Produktionsstart der Kanäle in V3 |
| 06.02 | **Vesting-Vereinbarung** | Anwalt | V4 · Apr – Jul 2028 | Gesellschaftsvertrag (01.01) |
| 06.06 | **Beirat und Begleitung** | Gründer 1 | V1 · Okt 2026 – Mär 2027 | Ansprache des Gründungsnetzwerks — Voraussetzung für das Stipendium (Nr. 9) |

### P3 · Nach dem Start (3 Dokumente)

Entsteht aus dem Betrieb. Vorher gibt es hier nichts zu zeigen — und es ist ehrlicher, das zu sagen, als eine Planzahl zu liefern.

| Kennung | Dokument | Zuständig | Bis wann | Woran es hängt |
|---|---|---|---|---|
| 02.10 | **Bericht der Sicherheitsprüfung** | Extern beauftragt | RM 8–9 · Phase 1d | einen lauffähigen Stand; beauftragt in Phase 1d |
| 04.09 | **Ist-Zahlen und laufende Auswertung** | Steuerberater | nach T0 · laufend | laufenden Betrieb |
| 04.10 | **Eröffnungsbilanz und Steuernummern** | Steuerberater | nach T0 · laufend | Gründung und Steuerberater |

**Was daran auffällt:** Von den 38 Lücken hängen 30 an der Gründung oder am Bau — sie sind heute nicht schließbar, sondern nur vorbereitbar. Bei den 8 Lücken erster Priorität hat sich die Lage am 19.09.2026 geändert: Die drei, die an nichts als Schreibarbeit hingen, sind geschrieben (00.02, 04.08, 06.05). **Was übrig bleibt, braucht jemanden von außen oder eine Angabe der Gründer** — drei Punkte den Anwalt (00.03, 01.07, 05.09), einer eine Architekturentscheidung (02.08) und vier die Gründer selbst (01.11, 06.01, 06.04 sowie die Bestätigung des Stammkapitalmodells für 04.08). Das ist keine Schreibarbeit mehr, sondern eine Terminfrage.

---

## 5 · Die Sperrliste: was Dritten nie gezeigt wird

Drei Dokumente des Registers tragen deshalb die Stufe S4 — sie verlassen das Team nie. Diese Liste ist weiter gefasst: Sie beschreibt **Inhalte**, nicht Dateien, und gilt auch für Auszüge, Bildschirmfotos und mündliche Auskunft.

Sie ist kein Misstrauen gegenüber Prüfern. Sie ist der Grund, warum Nutzer diesem Produkt Daten anvertrauen sollen, die in Deutschland zu den bestgeschützten überhaupt gehören. Wer sie in einer Verhandlung aufweicht, hat das Produkt bereits beschädigt.

| # | Was | Warum nie | Was stattdessen geht |
|---|---|---|---|
| 1 | **Nutzerdaten jeder Art** — Konten, Nachrichten, Bilder, Standorte, Verbindungsdaten | Art. 9 DSGVO: Die Einwilligung der Nutzer deckt den Betrieb des Dienstes, nicht die Vorlage bei einem Investor. Eine Weitergabe wäre rechtswidrig und würde das Versprechen brechen, auf dem das Produkt steht | Aggregierte Kennzahlen ohne Personenbezug, ab einer Mindestgruppengröße |
| 2 | **Rohprotokolle der Interviews** | Sie enthalten Angaben zur sexuellen Orientierung identifizierbarer Personen. Deshalb wird von vornherein anonym protokolliert (05.02) | Die aggregierte Auswertung (05.03) mit Zitaten ohne Zuordnung |
| 3 | **Die Ortsliste mit Ansprechpartnern** | Namen, Telefonnummern und persönliche Notizen über Geschäftsleute. Für einen Wettbewerber wäre sie der wertvollste Einzelbestand des Projekts | Anzahl der Zusagen je Stadtteil, Priorisierungslogik, Muster der Vereinbarung |
| 4 | **Konkrete Schwellenwerte und Erkennungsregeln der Moderation** | Wer sie kennt, umgeht sie. Das trifft nicht uns, sondern die Menschen, die die Moderation schützen soll | Die Architektur mit Zonen, Fristen und Vieraugenprinzip — also das Prüfbare, ohne die Umgehungsanleitung |
| 5 | **Unbehobene Befunde aus Sicherheitsprüfungen** | Eine offene Schwachstelle in fremder Hand ist eine Schwachstelle mehr | Die Zusammenfassung der Prüfung mit dem Stand der Behebung (02.10) |
| 6 | **Zugangsdaten, Schlüssel, Kontozugänge** | Kein Prüfzweck rechtfertigt das, auch nicht „nur zum Ansehen“ | Ein begleiteter Blick auf einen Testbestand, wenn technische Prüfung verlangt wird |
| 7 | **Die Adressliste der Warteliste** | Eine Liste von Mailadressen mit dem impliziten Merkmal der sexuellen Orientierung. Der schwerste denkbare Vertrauensbruch für ein paar Punkte in einer Verhandlung | Anzahl, Herkunft, Verlauf je Woche (05.06) |
| 8 | **Anwaltsakte und Fragenkataloge im Original** | Arbeitsmittel mit unabgeschlossenen Überlegungen; einzelne Sätze daraus lesen sich ohne Zusammenhang wie Eingeständnisse | Der Rechts-Statusbericht (01.07): erkannt, geklärt, offen, schlechtester Ausgang mit Preis |
| 9 | **Private Verhältnisse der Gründer** über das gesetzlich Nötige hinaus | Weder prüfrelevant noch verhandelbar | Der Lebenslauf und die Erklärung zur zeitlichen Verfügbarkeit (06.01, 06.04) |
| 10 | **Angebote Dritter mit Vertraulichkeitsklausel** | Vertragsbruch gegenüber dem Anbieter | Die Spanne, die im Finanzmodell hinterlegt ist |

**Wenn jemand darauf besteht:** Eine schriftliche Absage mit Begründung, in einem Satz — „Das sind personenbezogene Daten besonderer Kategorien; eine Weitergabe wäre rechtswidrig.“ Wer daraufhin abspringt, wäre auch später der falsche Partner gewesen. **Diese Absage ist selbst ein Prüfergebnis**: Ein Investor, der Nutzerdaten sehen will, sagt damit etwas über seinen Umgang mit ihnen nach dem Einstieg.

---

## 6 · Was passiert, wenn die Anfrage kommt

| Wann | Was | Wer |
|---|---|---|
| **Tag 0** | Eingang bestätigen, Stufe-1-Paket sofort schicken: Einseiter, Deck als PDF, ein Satz zum Stand des Vorhabens | Gründer 1 |
| **Tag 0** | Geheimhaltungsvereinbarung mitschicken, unaufgefordert | Gründer 1 |
| **Tag 1–2** | Nach Rücklauf den Stand einfrieren: Stufe-2-Dokumente in der aktuellen Fassung als PDF ablegen, Datum im Dateinamen | Gründer 1 |
| **Tag 2** | Zugang geben, Freigabe protokollieren (00.04) | Gründer 1 |
| **laufend** | Rückfragen sammeln statt einzeln beantworten — jede Rückfrage, die zweimal kommt, wird ein Dokument im Raum | beide |
| **bei Absichtserklärung** | Stufe 3 einzeln freigeben, je Dokument entschieden, nicht als Paket | beide gemeinsam |
| **nach Abschluss oder Absage** | Zugang schließen, Protokoll abschließen, geänderte Dokumente markieren | Gründer 1 |

**Die 48-Stunden-Regel:** Stufe 2 geht binnen zwei Werktagen heraus oder gar nicht. Das ist keine Höflichkeit, sondern Selbstschutz — ein Datenraum, der langsam gefüllt wird, sieht aus wie einer, in dem jemand noch aufräumt.

---

## 7 · Was dieses Dokument nicht ist

- **Kein angelegter Datenraum.** Es ist die Struktur und die Lückenliste; hochgeladen und freigegeben wird nichts.
- **Keine Freigabeentscheidung.** Welche Stufe ein bestimmter Empfänger bekommt, entscheiden die Gründer im Einzelfall.
- **Keine Rechtsberatung.** Die Geheimhaltungsvereinbarung (00.03) und der Gesellschaftsvertrag (01.01) gehören dem Anwalt, nicht diesem Dokument.
- **Keine vollständige Due-Diligence-Liste.** Ein Investor bringt seine eigene mit. Diese hier ist auf ein Vorhaben ohne Gesellschaft und ohne Umsatz zugeschnitten — sie wächst mit.

---

## 8 · Prüfprotokoll

Programmatisch geprüft am 18.09.2026 mit dem Bauskript dieses Dokuments. Der Bau bricht ab, wenn eine Prüfung fehlschlägt.

| Prüfung | Ergebnis |
|---|---|
| Kennungen eindeutig und einem Bereich zugeordnet | 83 Dokumente, keine Dopplung |
| Jedes Dokument hat einen Zuständigen | bestanden |
| Jeder genannte Projektpfad existiert wirklich | 45 Pfade geprüft |
| Kein Dokument gilt zugleich als fehlend und vorhanden | bestanden |
| Lückenliste deckt genau die als fehlend geführten Dokumente | 38 von 38 |
| Jede zitierte Entscheidungsnummer existiert in `offene-entscheidungen.md` | 17 Nummern geprüft |
| Auszeichnung (markdownlint) | im Bau geprüft |

**Was nicht geprüft werden konnte:** Ob ein vorhandenes Dokument inhaltlich abnahmefähig ist. Das Register sagt „liegt vor“, nicht „ist fertig“ — 9 Dokumente tragen ausdrücklich den Stand „in Arbeit“, und mehrere der vorhandenen sind als ENTWURF gekennzeichnet.

---

## Quellen

- Bestandsaufnahme des Projektordners `C:\Users\henry\Desktop\Cruizy` am 18.09.2026 — Grundlage der Spalte „Im Projektordner“.
- `01-steuerung/offene-entscheidungen.md` — die zitierten Nummern.
- `01-steuerung/zeitplan-bis-start.md` — die Fenster V1 bis V4 und T0.
- Handbuch A (Pflichtenkatalog) und Handbuch B (Finanzierung, Tore) — nicht bearbeitet, nur ausgewertet.
