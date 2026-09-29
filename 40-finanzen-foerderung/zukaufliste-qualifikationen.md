# Zukaufliste: was wir nicht können und wer es stattdessen macht

> **ENTWURF · Stand 21.09.2026 · Aufgabe A-45, fortgeschrieben in A-52 · Dokument 06.05 des Datenraums**
> Bisher stand diese Liste verstreut über Finanzmodell, Anwaltsakte, Moderationsarchitektur und vier Konzepte. Hier steht sie an einem Ort — mit Betrag, Zeitpunkt und dem, was passiert, wenn man es doch selbst macht.

**Wofür das gut ist:** Jeder Prüfer fragt irgendwann, was ein Zweierteam eigentlich nicht kann. Die schlechte Antwort ist „wir lernen das". Die gute ist eine Liste mit Preisschildern — sie zeigt, dass die Lücke erkannt, bewertet und bezahlt ist.

**Monatsangaben** zählen ab dem realen Start (T0 in der CSD-Saison; Bestfall Sommer 2028, geplant wird ein Jahr später — Nr. 45), nicht ab heute. „V0" bis „V4" sind die Vorbereitungsfenster aus `../01-steuerung/zeitplan-bis-start.md`.

---

## 1 · Einmalig zugekauft — 55.900 €

Dreizehn Positionen, alle im Finanzmodell hinterlegt (Blatt „Annahmen", Abschnitt 6): die zwölf aus Handbuch B über 35.800 € und seit dem 21.09.2026 die **vollständige Code-Prüfung nach Nr. 73**, dazu die zweite Hälfte des Gerätepools für die zweite Plattform (A-51). Die Reihenfolge ist die des Bedarfs, nicht die der Höhe.

| Monat | Was | € | Wer | Warum nicht selbst |
|---|---|---|---|---|
| 1 | **Notar, Handelsregister, Gesellschaftsvertrag** | 2.600 | Notar | Beurkundung ist gesetzlich vorgeschrieben. Ein individueller Vertrag mit Vesting und Stichentscheid ist kein Musterprotokoll (**Nr. 4**, **Nr. 20**) |
| 1 | **JMStV-Gutachten, Jugendschutzkonzept** | 2.500 | Fachanwalt | Die teuerste offene Frage des Vorhabens. Eine Laieneinschätzung dazu ist wertlos, weil sie niemand akzeptiert (**Nr. 1**) |
| 1 | **Code-Prüfung, vollständig, beide Plattformen** | 18.900 | erfahrene Entwicklerin oder Entwickler mit Schwerpunkt Anwendungssicherheit | **Nr. 73:** der gesamte Code, nicht die kritischen 20 %. 120 bis 240 Stunden zu 90 € für eine Plattform, für zwei 10 bis 20 % mehr — Spanne 11.880 bis 25.920 €, angesetzt die Mitte. Liegt vor dem Start, zwischen Bauende und Start drei bis sechs Wochen (`../70-entwicklung-ab-monat-4/entwicklungsmodelle.md`) |
| 1 | **Gerätepool** | 1.500 + 1.200 | Beschaffung | Handbuch B: ein älteres Android-Gerät, ein älteres iPhone. Seit A-51 für zwei Plattformen je ein neueres dazu (ANNAHME, ohne Preisrecherche). Kein Zukauf von Wissen, sondern von Prüfmöglichkeit |
| 2 | **Marke DPMA und EUIPO, drei Klassen** | 1.800 | Markenanwalt | Mit Recherche. Vor der ersten Pressemitteilung, und der Name ist noch offen (**Nr. 5**) |
| 2 | **Gegenlesen der Merkmalsfelder** | 900 | trans und nichtbinäre Personen, **bezahlt** | Zwei Biografien sind keine Stichprobe. Unbezahltes Gegenlesen wäre dieselbe Arbeit ohne Honorar (**Nr. 13**) |
| 3 | **AGB, Datenschutzerklärung, Einwilligungsarchitektur** | 5.500 | Fachanwalt IT-Recht | Art.-9-Einwilligungen tragen das ganze Produkt. Ein Fehler hier ist nicht nachbesserbar (**Nr. 12**) |
| 3 | **Gestaltung der Oberfläche, 10 Tage** | 6.000 | externe Gestaltung | Bei einer fotogetriebenen App ist Gestaltung Produktqualität, nicht Verzierung. Die Textfassung liegt vor (`../50-produkt-prototyp/wireframes-textspezifikation.md`) |
| 4 | **Datenschutz-Folgenabschätzung** | 4.500 | DSB und Anwalt | Art. 35 DSGVO. Bei besonderen Kategorien plus Standortbezug praktisch zwingend |
| 5 | **DSA- und DDG-Prüfung** | 3.000 | Fachanwalt | Kontaktstellen, Meldeverfahren, AGB-Transparenz — und die Frage, welche Pflichten die Größenausnahme wirklich streicht (**Nr. 28**) |
| 6 | **Texterstellung Systemtexte** | 2.000 | Texter | Die Formulierungen entscheiden über die Annahme ganzer Funktionen. Der Entwurf mit 325 Einträgen liegt vor und wird überarbeitet, nicht ersetzt |
| 8 | **Penetrationstest** | 4.000 | externe Sicherheitsprüfung | Schwerpunkt Standort- und Bildarchitektur, vor dem öffentlichen Start. Wer den eigenen Code prüft, findet, was er erwartet |
| 8 | **Barrierefreiheitsprüfung** | 1.500 | Betroffene | Prüfung durch Menschen, die die Hilfsmittel täglich benutzen — nicht durch ein Prüfwerkzeug |

**Summe 55.900 €** (Handbuch B: 35.800 €). Davon sind **44.300 € Recht, Gutachten und Prüfung** (Notar, JMStV-Gutachten, Marke, AGB und Datenschutz, Folgenabschätzung, DSA-Prüfung, Code-Prüfung, Penetrationstest, Barrierefreiheit) — rund 79 Prozent. Die übrigen **11.600 €** sind Gestaltung, Systemtexte, das bezahlte Gegenlesen und die Geräte. **Die Verteilung ist die Aussage:** Bei diesem Produkt kostet das Einhalten der Regeln mehr als das Aussehen — und seit Nr. 73 auch das Prüfen mehr als jede andere Einzelposition.

**Was die Reihenfolge verschweigt:** Code-Prüfung, Penetrationstest, Folgenabschätzung, AGB und Barrierefreiheitsprüfung müssen vor einem öffentlichen Start erledigt sein. Nach Nr. 22 gibt es die Firma aber erst zu T0. Wer das bezahlt, wenn der Start in dieselbe Saison fallen soll, ist offen → **Nr. 88**.

---

## 2 · Laufend zugekauft

Die Staffel wächst mit der Nutzerzahl. Angegeben sind die Werte bei 0 · 5.000 · 12.000 aktiven Nutzern im Monat.

| Was | €/Monat | Wer | Ab wann |
|---|---|---|---|
| **Externer Datenschutzbeauftragter** | 250 · 250 · 300 | Dienstleister mit EU-Sitz | vor der ersten gespeicherten Adresse; Ausschreibung liegt vor (`../10-recht-gruendung/dsb-ausschreibung-fragenkatalog.md`) |
| **Rechtsberatung, Rückstellung** | 300 · 300 · 350 | Kanzlei | laufend ab Gründung |
| **Cyber- und Betriebshaftpflicht** | 200 · 220 · 250 | Versicherer | ab Start |
| **Buchhaltung, Steuerberatung** | 150 · 180 · 220 | Steuerberater | ab Gründung |
| **Jugendschutzbeauftragter** | 100 · 100 · 120 | extern oder über eine Selbstkontrolle | ab Start — **siehe Abschnitt 3** |
| **Hash-Abgleich, Moderations-KI** | 0 · 250 · 380 | Meldestelle und Anbieter | ab Zone-1-Betrieb (**Nr. 30**) |
| **Moderationskraft, Teilzeit** | ab **15.000** aktiven Nutzern | Anstellung | die Schwelle, ab der die tägliche Prüfung aus dem Nebenbei fällt |

**Nicht in dieser Liste, aber derselbe Gedanke:** Hosting, Werkzeuge, Entwicklerzugänge und Zahlungsabwicklung sind Einkauf von Infrastruktur, nicht von Können — sie stehen in der Kostenstaffel des Finanzmodells.

---

## 3 · Ein Zukauf, der drei Posten zugleich löst

Beim Prüfen von § 7 JMStV ist aufgefallen: Anbieter mit weniger als 50 Beschäftigten können auf einen **eigenen** Jugendschutzbeauftragten verzichten, wenn sie sich einer anerkannten Einrichtung der Freiwilligen Selbstkontrolle anschließen und diese mit den Aufgaben betrauen.

Eine Mitgliedschaft könnte damit zugleich abdecken: den Jugendschutzbeauftragten (100 €/Monat), einen anerkannten Beschwerdeweg und einen Prüfnachweis gegenüber der Aufsicht. **Die Kosten einer Mitgliedschaft kennen wir nicht** — sie stehen nirgends öffentlich und sind zu erfragen. Grundlage: `../10-recht-gruendung/dsb-ausschreibung-fragenkatalog.md`, Abschnitt 1.

---

## 4 · Was wir ausdrücklich selbst machen

Nicht aus Sparsamkeit, sondern weil ein Zukauf hier das Ergebnis verschlechtern würde.

| Was | Warum selbst |
|---|---|
| **Ortsbeziehungen** | Wer die Orte einer Stadt kennt, muss dort gewesen sein. Rund 40 Vereinbarungen je Stadt, ein bis zwei Tage je Woche — nicht delegierbar und der einzige unkopierbare Vorteil |
| **Nutzergespräche** | Ein Dienstleister bringt die Antworten, nicht das Verständnis. 60 bis 80 Gespräche, davon mindestens acht bezahlt mit trans und nichtbinären Personen |
| **Moderationsentscheidungen** | Fristen, Vieraugenprinzip und Protokoll tragen nur, wenn die Verantwortlichen selbst entscheiden (`../50-produkt-prototyp/moderations-backend.md`) |
| **Meldungen an Behörden** | Eine Meldung ist eine Aussage über einen Menschen. Sie gehört zu den Pflichten, die die Gründer persönlich tragen (**Nr. 72**) |
| **Produktentscheidungen** | Die 95 Festlegungen der Spezifikation sind Haltungsfragen, keine Fachfragen (**Nr. 68**; Prüfliste `../50-produkt-prototyp/festlegungen-pruefliste.xlsx`) |

---

## 5 · Was diese Liste nicht ist

- **Kein Angebot und kein Preisvergleich.** Die Beträge sind Planwerte aus dem Finanzmodell; keiner davon ist eingeholt.
- **Keine Vollständigkeit.** Was in den Interviews und beim Anwaltstermin dazukommt, kommt hier dazu.
- **Kein Ersatz für die Entscheidung, wen man beauftragt.** Die Liste sagt, *dass* zugekauft wird, nicht *bei wem*.

---

## Quellen

- `../40-finanzen-foerderung/finanzmodell.xlsx`, Blatt „Annahmen" — alle Beträge und Monatsangaben
- `../10-recht-gruendung/dsb-ausschreibung-fragenkatalog.md` — Datenschutzbeauftragter und der Fund zu § 7 JMStV
- `../01-steuerung/offene-entscheidungen.md` — die genannten Nummern
- `../40-finanzen-foerderung/datenraum-struktur.md` — dieses Dokument ist dort 06.05
