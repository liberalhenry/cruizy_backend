# Einwand-Handbuch: die 25 härtesten Fragen

> ## ⚠ ENTWURF — nicht vorgetragen, nicht freigegeben
>
> Antwortlinien, keine Textbausteine zum Auswendiglernen. Jede Antwort ist so geschrieben, dass sie in **unter 60 Sekunden** gesprochen werden kann und **mindestens eine überprüfbare Angabe** enthält. Wer eine Antwort nicht belegen kann, gibt sie nicht.

Erstellt: 18.09.2026 · Aufgabe A-35 · Rolle: Debattentrainer · Fenster **V3**, als Vorfassung vorgezogen · **Zahlen und Beschlüsse aktualisiert 21.09.2026 (A-52)**
Gilt für: Investoren, Förderprüfer, Presse, Ortspartner und die eigene Zielgruppe
Grundlagen: Handbuch A und B · `40-finanzen-foerderung/finanzmodell.xlsx` · `50-produkt-prototyp/produktspezifikation.md` · `50-produkt-prototyp/moderationsarchitektur.md` · `01-steuerung/offene-entscheidungen.md`

---

## Auf einen Blick

| Größe | Wert |
|---|---|
| Fragen | 25 in 5 Gruppen |
| Wörter je Antwort | 83 im Schnitt, höchstens 104 |
| Längste Antwort gesprochen | 57 Sekunden (Frage 7) |
| Belege | 50, je Antwort zwei |
| Sätze, die man nicht sagen sollte | 25, je Antwort einer |
| Fragen ohne gute Antwort | **8** |

**Wie dieses Handbuch benutzt wird.** Nicht auswendig lernen — die Linie kennen. Jede Antwort beginnt mit dem, was stimmt, nicht mit dem, was gut klingt. Wer eine Frage nicht beantworten kann, sagt das und nennt, wann er es kann; das kostet weniger als eine Antwort, die in der Nachprüfung zerfällt.

**Drei Regeln, die über allem stehen**

1. **Keine Zahl ohne Herkunft.** Jede Zahl in diesem Handbuch steht so auch im Finanzmodell, in der Spezifikation oder in einem der Handbücher.
2. **Keine Schwäche verstecken, die der andere ohnehin findet.** Die Rechtsfrage, die fehlende Traktion und das Alter kommen von uns, bevor sie gefragt werden.
3. **Eine Frage umgehen ist teurer als sie zu verlieren.** Ausweichen fällt auf und färbt rückwirkend auf alles ab, was vorher gesagt wurde.

**Wer fragt was.** Die Buchstaben hinter jeder Frage stehen für: **I** Investor · **F** Förderprüfer · **P** Presse · **O** Ortspartner · **Z** Zielgruppe.

| Gruppe | Fragen | Wer sie stellt |
|---|---|---|
| **A · Team und Glaubwürdigkeit** | 1, 2, 3, 4 | Förderprüfer (4) · Investor (3) · Presse (2) · Zielgruppe (1) |
| **B · Markt und Wettbewerb** | 5, 6, 7, 8, 9 | Investor (4) · Zielgruppe (1) |
| **C · Recht und Aufsicht** | 10, 11, 12, 13, 14 | Förderprüfer (5) · Investor (4) · Presse (2) |
| **D · Sicherheit und Vertrauen** | 15, 16, 17, 18, 19 | Förderprüfer (4) · Investor (3) · Presse (3) · Zielgruppe (3) · Ortspartner (1) |
| **E · Geschäft und Zahlen** | 20, 21, 22, 23, 24, 25 | Investor (5) · Förderprüfer (4) · Zielgruppe (1) · Ortspartner (1) |

---

## A · Team und Glaubwürdigkeit

### 1 · „Warum sollte euch jemand vertrauen, ihr seid zwanzig?“

*Gefragt von: Investor, Förderprüfer, Presse · 88 Wörter · 48 Sekunden gesprochen*

> Nicht wegen des Alters, sondern wegen dem, was vor dem ersten Euro schon steht: eine Produktspezifikation mit 75 Funktionen und 674 Akzeptanzkriterien, elf durchgeschriebene Nutzerabläufe, eine Moderationsarchitektur mit Fristen und ein Finanzmodell, dessen Kapitalbedarf wir selbst nach oben korrigiert haben — von 93.000 auf 160.253 €, weil jede Entscheidung mit ihrem Preis darin steht. Das ersetzt keine Erfahrung, es zeigt, wie wir arbeiten. Wo Erfahrung fehlt, kaufen wir sie zu: Anwalt, Steuerberater, Datenschutzbeauftragter, externe Code- und Sicherheitsprüfung. Jede dieser Positionen steht mit Betrag im Plan, nicht als Absichtserklärung.

**Worauf sich das stützt**

- `50-produkt-prototyp/produktspezifikation.md` — 75 Funktionen, 674 geltende Akzeptanzkriterien im Format „Wenn … dann …“ (Stand 26.09.2026)
- `40-finanzen-foerderung/kapitalbedarf-gegenrechnung.md` — die eigene Korrektur des Kapitalbedarfs nach oben

**Was man nicht sagen sollte:** „Alter spielt keine Rolle.“ — Es spielt eine Rolle, und das Abstreiten bestätigt genau den Zweifel, den die Frage ausdrückt.

### 2 · „Was, wenn einer von euch aussteigt?“

*Gefragt von: Investor, Förderprüfer · 77 Wörter · 42 Sekunden gesprochen*

> Der Fall wird vor der Gründung geregelt, nicht danach. Die Vorbereitungsvereinbarung klärt, wem die Vorarbeiten gehören und wie sie auf die GmbH übergehen. Der Gesellschaftsvertrag bekommt Vesting über vier Jahre mit zwölf Monaten Cliff, einen Stichentscheid für die 50/50-Lage und eine Regel für reduzierte Mitarbeit. Ohne diese Klauseln wäre ein Ausstieg im zweiten Jahr das Ende des Vorhabens; mit ihnen ist er teuer und überlebbar. Der genaue Text ist offen — er gehört dem Notar, nicht uns.

**Worauf sich das stützt**

- `10-recht-gruendung/vorbereitungsvereinbarung-ENTWURF.md` — die Zeit vor der Beurkundung
- Offene Entscheidung Nr. 4 — Gesellschaftsvertrag mit Vesting, Stichentscheid, Wettbewerbsverbot

**Was man nicht sagen sollte:** „Das passiert uns nicht.“ — Eine Zusage, die niemand halten kann, und der klassische Grund, warum Gesellschafterstreit teuer wird.

### 3 · „Wer schreibt eigentlich den Code — und was, wenn eure Werkzeuge morgen anders kosten?“

*Gefragt von: Investor, Förderprüfer · 83 Wörter · 45 Sekunden gesprochen*

> Gebaut wird mit KI-Werkzeugen entlang eines Bauplans aus sechzehn Arbeitspaketen; vor dem Start prüft ein Mensch den gesamten Code, dafür stehen 18.900 € im Plan. Das Risiko ist echt: Preise und Verfügbarkeit solcher Werkzeuge können sich ändern. Dagegen hilft, dass die Spezifikation werkzeugunabhängig ist — 674 Akzeptanzkriterien beschreiben, was gebaut wird, nicht womit. Werden die Werkzeuge teurer, ändern sich Bauzeit und Bauaufwand, nicht der Bauplan und nicht die laufenden Kosten. Was wir nicht behaupten: dass zwei Personen ohne Werkzeuge dieselbe Menge Code schreiben.

**Worauf sich das stützt**

- `70-entwicklung-ab-monat-4/code-planer.md` — Arbeitspakete AP-0 bis AP-15 mit Abhängigkeiten und Prüfpunkten
- Beschluss Nr. 73 (19.09.2026, bestätigt am 21.09.2026) und `40-finanzen-foerderung/finanzmodell.xlsx`, Blatt „Annahmen“ — vollständige Code-Prüfung, 18.900 €

**Was man nicht sagen sollte:** „Die KI macht das schon.“ — Sie macht es nicht allein, und wer das sagt, verrät, dass er den Aufwand nicht gerechnet hat.

### 4 · „Ihr seid zwei junge Männer — wie wollt ihr für eine Gruppe bauen, die ihr nicht ganz seid?“

*Gefragt von: Presse, Zielgruppe, Förderprüfer · 81 Wörter · 44 Sekunden gesprochen*

> Allein gar nicht. Deshalb stehen 60 bis 80 Interviews vor dem Bau und nicht danach. Deshalb ist ein bezahltes Gegenlesen der Merkmalsfelder mit Betroffenen eingeplant — 900 € im Modell, nicht als Freundschaftsdienst. Und deshalb ist die Prüfung der Bilderkennung auf Verzerrungen bei dunkleren Hauttönen eine eigene Aufgabe: ungeprüft entsteht Benachteiligung, die im Graubereich unsichtbar bleibt. Wir werden trotzdem Dinge übersehen. Der Unterschied ist, ob es eine Stelle gibt, an der man das meldet, und eine Frist, in der geantwortet wird.

**Worauf sich das stützt**

- Offene Entscheidung Nr. 13 — Taxonomie-Felder mit Betroffenen gegenlesen, 900 € eingeplant
- Offene Entscheidung Nr. 32 — Klassifikator-Auswahl und Verzerrungsprüfung vor AP-4

**Was man nicht sagen sollte:** „Wir sind selbst Teil der Zielgruppe, das reicht.“ — Zwei Biografien sind keine Stichprobe, und die Gruppe ist deutlich vielfältiger als wir.

---

## B · Markt und Wettbewerb

### 5 · „Grindr hat Millionen Nutzer — warum solltet ausgerechnet ihr gewinnen?“

*Gefragt von: Investor · 82 Wörter · 45 Sekunden gesprochen*

> Wir gewinnen nicht gegen Grindr. Wir gewinnen in einem Raster von 500 Metern in Köln, und dort entscheidet Dichte, nicht Gesamtzahl. Unsere Schwelle für Tor 3 sind 3.500 aktive Nutzer in einer Stadt, nicht Millionen. Der Marktführer ist hochprofitabel und baut an denselben Funktionen — das sagen wir vor der Nachfrage. Was er nicht tun kann, ohne sein Geschäft zu beschädigen: auf Werbeerlöse verzichten, den genauen Standort gar nicht erst speichern und Schutzfunktionen dauerhaft kostenlos halten. Genau darauf ist unser Produkt gebaut.

**Worauf sich das stützt**

- `01-steuerung/roadmap.md` — Tor 3 im Monat 15: mindestens 3.500 aktive Nutzer in Köln
- `01-steuerung/wettbewerbsbeobachtung-log.md` — Grindr Q2 2026: 138 Mio. $ Umsatz, Werbeerlöse +44 % auf 25 Mio. $

**Was man nicht sagen sollte:** „Grindr ist schlecht.“ — Grindr ist erfolgreich; wer das leugnet, verliert die Glaubwürdigkeit für alles Weitere.

### 6 · „Was hindert Grindr daran, eure Funktionen einfach zu kopieren?“

*Gefragt von: Investor · 81 Wörter · 44 Sekunden gesprochen*

> Bei einzelnen Funktionen nichts, und es wird passieren. Drei Dinge lassen sich nicht kopieren, ohne das eigene Geschäft zu beschädigen: rund 40 persönlich verhandelte Ortsbeziehungen je Stadt, eine Architektur, die den genauen Standort gar nicht erst speichert, und ein Versprechen, Schutzfunktionen nie hinter eine Bezahlschranke zu stellen. Das dritte kostet einen werbefinanzierten Anbieter Umsatz. Der Schutz liegt also nicht im Code, sondern in Beziehungen vor Ort — die entstehen in Monaten, nicht in einem Sprint. Wir planen damit, kopiert zu werden.

**Worauf sich das stützt**

- Handbuch A, verteidigbare Positionen — Ortsbeziehungen, Standortarchitektur, Schutzversprechen
- `60-orte-b2b/kontaktanlaesse-playbook.md` — wie die rund 40 Ortsbeziehungen je Stadt entstehen

**Was man nicht sagen sollte:** „Das können die technisch nicht.“ — Können sie. Die Hürde ist wirtschaftlich und organisatorisch, nicht technisch.

### 7 · „Warum baut ihr das nicht einfach als Funktion in einer bestehenden App?“

*Gefragt von: Investor · 104 Wörter · 57 Sekunden gesprochen*

> Weil die Kernentscheidung nicht nachrüstbar ist. Wer keinen genauen Standort speichert, muss das Raster von Anfang an so bauen; wer Schutzfunktionen kostenlos hält, kann sie nicht in eine bestehende Bezahllogik einhängen. Als Zusatzfunktion in einer werbefinanzierten App bliebe von unserem Produkt genau das übrig, was austauschbar ist: eine Kartenansicht. Das betrifft nicht eine Funktion, sondern den Entwurf: In der Spezifikation hängen 74 Funktionen an derselben Standortentscheidung. Dazu kommt das Praktische — eine bestehende App öffnet ihre Plattform nicht für ein Zweierteam ohne Nutzer. Die Frage ist trotzdem berechtigt — sie ist der Grund, warum wir mit einer Stadt anfangen und nicht mit einem Land.

**Worauf sich das stützt**

- `50-produkt-prototyp/produktspezifikation.md` — der Standort wird als Zellmittelpunkt gespeichert, nicht als Koordinate
- `01-steuerung/skalierungs-playbook.md` — Dichte vor Fläche, eine Stadt nach der anderen

**Was man nicht sagen sollte:** „Das wäre langweilig.“ — Geschmack ist kein Argument; die Antwort ist die Architektur.

### 8 · „Warum sollte jemand in einen Nischenmarkt in einem einzigen Land investieren?“

*Gefragt von: Investor · 91 Wörter · 50 Sekunden gesprochen*

> Vielleicht sollte er nicht. Wer ein Zehnfaches in drei Jahren sucht, ist hier falsch, und wir stellen das nicht anders dar. Das Produkt begrenzt seine Erlöse bewusst: rund 0,32 € je aktivem Nutzer und Monat, keine Werbung, kein Datenverkauf, keine gekaufte Sichtbarkeit. Dafür ist der Kapitalbedarf überschaubar — rund 160.000 € statt Millionen — und die Expansion rechenbar: Eine zusätzliche Stadt kostet 733 € im Monat und trägt sich ab 2.231 aktiven Nutzern. Was hier entsteht, ist eine Nische mit hoher Bindung in einem Markt, in dem Vertrauen die Währung ist.

**Worauf sich das stützt**

- `40-finanzen-foerderung/finanzmodell.xlsx`, Szenario realistisch — Erlös je aktivem Nutzer und Monat im dritten Jahr, Kapitalbedarf 160.253 €
- `01-steuerung/skalierungs-playbook.md` — 733 € Stadtkosten, Deckung ab 2.231 aktiven Nutzern (gerechnet mit 0,33 € je aktivem Nutzer im Monat 36; der Durchschnitt des dritten Jahres liegt bei 0,32 €) *(bis 22.09.2026: 2.156, mit 0,34 € aus Handbuch B)*

**Was man nicht sagen sollte:** „Der Markt ist riesig.“ — Er ist es nicht, und die Gegenrechnung steht im eigenen Modell.

### 9 · „Warum sollte ich wechseln? Meine Kontakte sind alle woanders.“

*Gefragt von: Zielgruppe · 94 Wörter · 51 Sekunden gesprochen*

> Musst du nicht. Fast niemand wechselt, man nutzt zwei Apps — das ist einkalkuliert und kein Problem. Die Frage ist, wofür man die zweite öffnet: für den Reiter, der zeigt, was heute in der Stadt läuft, und für Orte, die dahinterstehen. Wenn das in deinem Viertel nicht funktioniert, funktioniert es nicht, und dann bringt es nichts. Genau deshalb fangen wir in einer Stadt an und nicht in zwanzig, und genau deshalb heißt unsere Schwelle 3.500 aktive Nutzer in Köln und nicht eine Million irgendwo: Wir wollen früh erfahren, ob es trägt, und nicht spät.

**Worauf sich das stützt**

- Handbuch B, Wachstumsannahmen — Mehrfachnutzung ist der Normalfall, nicht der Wechsel
- `01-steuerung/roadmap.md` — Start in Köln, Tor 3 bei 3.500 aktiven Nutzern in dieser einen Stadt

**Was man nicht sagen sollte:** „Wir sind besser als Grindr.“ — Das entscheidet niemand im Gespräch, sondern das leere oder volle Raster im eigenen Viertel.

---

## C · Recht und Aufsicht

### 10 · „Ist eure App rechtlich nicht ein Minenfeld?“

*Gefragt von: Investor, Förderprüfer, Presse · 79 Wörter · 43 Sekunden gesprochen*

> Doch. Deshalb steht der Rechtsrahmen vor dem Code und nicht danach. Die Liste ist benannt und nicht geschätzt: Art. 9 DSGVO für Daten zur sexuellen Orientierung, der Jugendmedienschutz-Staatsvertrag für die Altersfrage, der Digital Services Act für Melde- und Beschwerdewege, § 184b StGB, dazu Verbraucherrecht für das Abo. Zu jeder Pflicht steht die geplante Umsetzung in der Spezifikation, und ein Fragenkatalog liegt für den Fachanwalt bereit. Wir behaupten nicht, dass alles geklärt ist. Wir behaupten, dass uns nichts davon überrascht.

**Worauf sich das stützt**

- `10-recht-gruendung/anwaltstermin/anwaltsakte-cruizy.docx` — der Fragenkatalog für den Fachanwalt
- `50-produkt-prototyp/produktspezifikation.md`, Abschnitt 16 — die offenen Anwaltsfragen AF-01 bis AF-12

**Was man nicht sagen sollte:** „Das ist alles halb so wild.“ — Es ist nicht halb so wild, und jeder Prüfer mit Erfahrung weiß das.

### 11 · „Was, wenn eine Landesmedienanstalt euch untersagt?“

*Gefragt von: Investor, Förderprüfer · 78 Wörter · 43 Sekunden gesprochen*

> Die realistische Form ist keine Untersagung, sondern eine Auflage: geschlossene Benutzergruppe mit Altersprüfung. Genau dafür ist die Architektur gebaut — die Prüfstufe ist eine Konfiguration, kein Umbau. Der teure Fall ist gerechnet: Der Kapitalbedarf steigt von 160.253 € auf bis zu 245.841 €. Beide Wege stehen im Modell, nicht nur der günstige. Die Frage klären wir, bevor die Prüfstufe gebaut wird; sie steht als erste auf der Anwaltsliste. Was wir nicht tun: starten und hoffen, dass niemand hinsieht.

**Worauf sich das stützt**

- Offene Entscheidung Nr. 1 — JMStV § 4 Abs. 2, zu klären vor allem anderen
- `40-finanzen-foerderung/finanzmodell.xlsx` — Kapitalbedarf je Prüfweg zwischen 143.397 € und 245.841 €

**Was man nicht sagen sollte:** „Das betrifft uns nicht, wir sind zu klein.“ — Größe schützt beim Jugendschutz nicht; sie ist im Digital Services Act relevant, nicht im JMStV.

### 12 · „Eine Altersprüfung kostet euch die Hälfte der Anmeldungen. Wie viele bleiben?“

*Gefragt von: Investor, Förderprüfer · 81 Wörter · 44 Sekunden gesprochen*

> Vermutlich verlieren wir welche — das ist der eigentliche Preis, nicht die Prüfgebühr. Deshalb ist die Prüfung gestuft: Wer nur schauen will, braucht keine; verlangt wird sie an der Stelle, an der sie rechtlich nötig wird. Wie groß der Abbruch ist, wissen wir nicht. Der Wert steht als offene Annahme im Modell und wird in der geschlossenen Beta mit 150 Testnutzern gemessen. In den Nutzerabläufen ist genau diese Stelle als Abbruchfall benannt, nicht weggelassen. Wer hier heute eine Zahl nennt, rät.

**Worauf sich das stützt**

- `50-produkt-prototyp/nutzerablaeufe.md` — 51 benannte Abbruchfälle, darunter der Abbruch an der Altersprüfung
- `01-steuerung/roadmap.md` — geschlossene Beta in Phase 1d, **200 Testnutzer** nach Nr. 89 (Handbuch A nennt 150)

**Was man nicht sagen sollte:** „Kaum jemand bricht dabei ab.“ — Eine erfundene Zahl, die in der Beta widerlegt wird, und dann ist die ganze Planung verdächtig.

### 13 · „Was, wenn Apple oder Google eure App nicht zulassen?“

*Gefragt von: Investor, Förderprüfer · 91 Wörter · 50 Sekunden gesprochen*

> Das ist ein echtes Risiko, und es trifft härter als eine Auflage der Aufsicht, weil es keinen Widerspruchsweg mit Frist gibt. Vieles, was die Stores verlangen, steht ohnehin in der Architektur: Altersfreigabe, Meldefunktion mit Fallnummer, kein explizites Bild im öffentlichen Bereich, getrennte Zonen. Was fehlt, ist die systematische Prüfung der Store-Richtlinien gegen unsere 74 Funktionen — sie ist bisher in keinem Dokument als Aufgabe geführt und seit dem 18.09.2026 als Entscheidung Nr. 71 vermerkt. Das ist eine Lücke, und wir nennen sie lieber selbst, als sie im Monat sieben zu entdecken.

**Worauf sich das stützt**

- `50-produkt-prototyp/moderationsarchitektur.md` — drei Zonen, kein explizites Bild in Zone 1
- Entscheidungen Nr. 71 (19.09.2026) und **Nr. 92 (26.09.2026)** — Zone 1 bleibt auch im Web ohne explizite Inhalte, Nacktheit ohne explizite Darstellung ist erlaubt und in den Apps unkenntlich; Richtlinien erhoben am 20.09.2026 (A-53). Die **Grenze** zwischen Nacktheit und Explizitem legt die Hausordnung mit der Anwaltsfrage **K11** fest

**Was man nicht sagen sollte:** „Das ist kein Problem, es gibt ja andere solche Apps.“ — Ihre Zulassung ist kein Präzedenzfall für unsere Funktionsliste.

### 14 · „Was ist mit Missbrauchsmaterial? Wie stellt ihr sicher, dass eure Plattform nicht dafür genutzt wird?“

*Gefragt von: Förderprüfer, Presse · 76 Wörter · 41 Sekunden gesprochen*

> Zwei Mechanismen, getrennt nach Zone. Im öffentlichen Bereich läuft eine Vorabprüfung vor der Veröffentlichung. Im privaten Bereich gibt es bewusst keinen Inhaltsklassifikator, sondern ausschließlich einen Abgleich gegen Hashes bekannten Missbrauchsmaterials — eine einzige Frage, kein Mitlesen. Die Zugangswege zu den Hash-Datenbanken sind recherchiert, die Anträge stehen an. Die Rechtsgrundlage ist nicht endgültig: Die europäische Übergangsregelung läuft am 03.04.2028 aus, drei Monate vor unserem Start. Deshalb ist der Abgleich in der privaten Zone als abschaltbarer Schalter gebaut.

**Worauf sich das stützt**

- `10-recht-gruendung/hash-abgleich-zugangswege.md` — Project Arachnid, IWF, Thorn mit Bedingungen und Kosten
- Offene Entscheidung Nr. 30 — Übergangsverordnung bis 03.04.2028, danach ungeklärt

**Was man nicht sagen sollte:** „Bei uns kann so etwas nicht hochgeladen werden.“ — Kann es, auf jeder Plattform; die Antwort ist der Prozess, nicht das Dementi.

---

## D · Sicherheit und Vertrauen

### 15 · „Was passiert, wenn sich jemand über eure App verabredet und etwas Schlimmes geschieht?“

*Gefragt von: Investor, Förderprüfer, Presse, Ortspartner, Zielgruppe · 70 Wörter · 38 Sekunden gesprochen*

> Dann ist ein Mensch verletzt worden, und keine Antwort macht das kleiner. Was wir schulden, ist Vorbereitung: Meldung aus jedem Chat heraus, Fallnummer sofort, Entscheidung in unter 24 Stunden, Beweissicherung statt Löschung, ein vorbereiteter Weg zu den Strafverfolgungsbehörden und Vorlagen für die Kommunikation, damit in dieser Stunde niemand improvisiert. Was wir nicht versprechen: dass es nicht passiert. Jede App, die das verspricht, hat entweder nicht nachgedacht oder sagt die Unwahrheit.

**Worauf sich das stützt**

- `50-produkt-prototyp/moderationsarchitektur.md` — Fristen: Fallnummer sofort, Entscheidung unter 24 Stunden
- `30-marketing-kanaele/krisenkommunikation-vorlagen.md` — vorbereitete Texte für genau diesen Fall

**Was man nicht sagen sollte:** „Wir haben die sicherste App auf dem Markt.“ — Unbelegbar, und nach dem ersten Vorfall steht der Satz in jedem Artikel.

### 16 · „Wie wollt ihr moderieren, wenn ihr zu zweit seid?“

*Gefragt von: Investor, Förderprüfer, Presse · 84 Wörter · 46 Sekunden gesprochen*

> Mit Zahlen statt Zuversicht. Bei 3.500 aktiven Nutzern in Köln landen 3 bis 6 Bilder am Tag in der menschlichen Warteschlange, also rund zwei Minuten Arbeit. Bei 15.000 Nutzern sind es 14 bis 28 Bilder und 5 bis 10 Minuten — genau dort plant das Modell die erste Moderationskraft ein. Die Fristen stehen schriftlich: Graubereich unter zwölf Stunden, Meldungen unter 24, Einsprüche unter 48. Werden sie zwei Monate in Folge gerissen, wird die Expansion gestoppt, bevor eine Moderationskraft finanzierbar ist. Sicherheit geht vor Wachstum.

**Worauf sich das stützt**

- `50-produkt-prototyp/moderationsarchitektur.md` — Aufwandsrechnung je Nutzerstufe und die Fristentabelle
- `01-steuerung/skalierungs-playbook.md` — gerissene Moderationsfristen als Abbruchkriterium einer Stadt

**Was man nicht sagen sollte:** „Das schaffen wir nebenbei.“ — Es stimmt bis 15.000 Nutzern und klingt nach Ahnungslosigkeit; die Rechnung ist die bessere Antwort.

### 17 · „Wie geht ihr mit Nutzern um, die eure Regeln umgehen?“

*Gefragt von: Förderprüfer, Presse · 79 Wörter · 43 Sekunden gesprochen*

> Abgestuft und nachvollziehbar. Ein Bild kann automatisch gesperrt werden, ein Konto nicht: Art. 22 DSGVO lässt keine vollautomatische Entscheidung mit erheblicher Wirkung zu. Also Sperre des Inhalts, menschliche Prüfung, Begründung, Widerspruch mit Frist. Wiederholung führt zu Einschränkung, nicht zu stiller Löschung — wer gesperrt wird, erfährt warum. Eine Frage ist offen und liegt beim Anwalt: Darf ein Konto bei einem Hash-Treffer vorläufig eingeschränkt werden, bevor ein Mensch geprüft hat? Wir haben beide Stellungen gebaut und entscheiden nach der Antwort.

**Worauf sich das stützt**

- Offene Entscheidung Nr. 31 — vorläufige Kontoeinschränkung bei Hash-Treffer, Art. 22 DSGVO
- `50-produkt-prototyp/produktspezifikation.md` — M-04 beschreibt beide Schalterstellungen

**Was man nicht sagen sollte:** „Wer sich nicht benimmt, fliegt raus.“ — Rechtlich zu kurz gesprungen und genau die Haltung, die eine Aufsichtsbehörde aufmerksam macht.

### 18 · „Ihr verarbeitet Daten zur sexuellen Orientierung. Was passiert bei einem Datenabfluss?“

*Gefragt von: Zielgruppe, Förderprüfer · 78 Wörter · 43 Sekunden gesprochen*

> Der Schaden wäre nicht ersetzbar — deshalb ist die erste Antwort Vermeidung: Es wird nicht gespeichert, was nicht gebraucht wird. Kein genauer Standort, sondern der Mittelpunkt einer Rasterzelle. Keine Klarnamenpflicht. Getrennte Ablagen je Moderationszone und ein Zugriffsprotokoll, das auch uns beide erfasst. Im Ernstfall gelten 72 Stunden Meldefrist nach Art. 33 DSGVO. Ein Notfallplan und eine externe Sicherheitsprüfung mit Schwerpunkt Standort und Bilder sind im Bauplan vorgesehen — beides existiert heute noch nicht, das ist ehrlicherweise eine Lücke.

**Worauf sich das stützt**

- `50-produkt-prototyp/produktspezifikation.md` — Standort als Zellmittelpunkt, kein Speichern genauer Koordinaten
- `40-finanzen-foerderung/datenraum-struktur.md` — Notfallplan (02.11) und Sicherheitsprüfung (02.10) als offene Lücken geführt

**Was man nicht sagen sollte:** „Unsere Daten sind sicher.“ — Kein System ist sicher; die überzeugende Antwort ist, wie wenig überhaupt gespeichert wird.

### 19 · „Ihr speichert keinen genauen Standort — ist eine Ortsapp ohne genauen Standort nicht sinnlos?“

*Gefragt von: Investor, Zielgruppe · 80 Wörter · 44 Sekunden gesprochen*

> Umgekehrt. Genaue Entfernungen sind der Grund, warum sich bei anderen Anbietern Aufenthaltsorte errechnen lassen: Mit drei Messpunkten ergibt sich eine Position. Wir speichern den Mittelpunkt einer Rasterzelle, angezeigt wird Nähe statt Meterzahl. Für die eigentliche Frage — ist hier gerade jemand — reicht das. Was es kostet, ist die Sortierung nach exakter Entfernung, eine Funktion, die viele schätzen. Ob dieser Tausch angenommen wird, ist eine der Kernfragen der Interviews ab Oktober 2026. Wir behaupten nicht, die Antwort schon zu kennen.

**Worauf sich das stützt**

- `50-produkt-prototyp/produktspezifikation.md` — FV-02 und AK-F70-03: kein genauer Standort, nur Zellmittelpunkt
- `20-interviews-feedback/interviewleitfaden.docx` — der Tausch Genauigkeit gegen Schutz als Interviewfrage

**Was man nicht sagen sollte:** „Genauigkeit braucht niemand.“ — Sie wird gebraucht und geschätzt; die Antwort ist der bewusste Tausch, nicht das Abstreiten.

---

## E · Geschäft und Zahlen

### 20 · „Ihr wollt kein Werbe-Tracking — wie verdient ihr dann Geld?“

*Gefragt von: Investor, Förderprüfer, Zielgruppe · 92 Wörter · 50 Sekunden gesprochen*

> Mit fünf Quellen, keine davon Werbung: Abos zu 9 und 17 €, ein Werkzeugabo für Orte und Veranstalter, ein Anteil an vermittelten Tickets, Unterstützerbeiträge und eine Gesundheitspartnerschaft. Gekaufte Sichtbarkeit gibt es nicht, auch nicht für Orte. Die Rechnung dahinter ist unbequem und steht offen im Modell: 7,56 € netto je Zahler, im dritten Jahr knapp ein Viertel aus den Nebenquellen, und erst ab rund 12.000 aktiven Nutzern tragen die Abos die laufenden Kosten allein. Bezahlte Werbung kostet in diesem Markt 60 bis 150 € je Installation — tragbar wären knapp 2 €.

**Worauf sich das stützt**

- `40-finanzen-foerderung/preise-und-bezahlstufen.md` — Erlöskette je Zahler und nötige Zahler je Ausbaustand; Nr. 65 und Nr. 78
- `40-finanzen-foerderung/finanzmodell.xlsx` — Erlöse und aktive Nutzer im Monat 36 (realistisch): 0,33 € je aktivem Nutzer; mit 18 Monaten Verweildauer und der Relation 3 : 1 aus Handbuch B tragbar 1,97 € gegen 60 bis 150 € Marktpreis (bis 21.09.2026 stand hier 2,04 € aus Handbuch B, nicht aus dem Modell)

**Was man nicht sagen sollte:** „Werbung schließen wir aus Prinzip aus.“ — Halb wahr und schwächer als die Rechnung; das Prinzip allein überzeugt keinen Investor.

### 21 · „Wie realistisch ist Break-even in Monat 28?“

*Gefragt von: Investor, Förderprüfer · 86 Wörter · 47 Sekunden gesprochen*

> Es ist eine Planzahl, keine Prognose — und wir haben sie selbst nach hinten geschoben. Der Tiefpunkt liegt bei minus 126.877 € in Monat 27, der Ausgleich in Monat 28; Handbuch B nannte Monat 21 bis 23. Den Abstand machen vor allem eigene Entscheidungen: vollständige Code-Prüfung, CSD-Auftritt zum Start, eigene Veranstaltungen, keine gekaufte Sichtbarkeit. Die Zahl hängt an Wiederkehr, Anteil Zahlender und Kostenstaffel. Alle drei stehen im Modell als Eingabefelder. Wer eine andere Annahme für plausibel hält, trägt sie ein und bekommt sofort die neue Kurve.

**Worauf sich das stützt**

- `40-finanzen-foerderung/finanzmodell.xlsx` — 36 Monatswerte, Tiefpunkt −126.877 € in Monat 27; Wirkung jeder Entscheidung im Blatt „Herkunft & Widersprüche“, Abschnitt 5
- `40-finanzen-foerderung/kapitalbedarf-gegenrechnung.md` — die Abweichung zu Handbuch B ist benannt, nicht geglättet

**Was man nicht sagen sollte:** „Break-even ist konservativ gerechnet.“ — Das sagen alle; belegen lässt es sich nur durch das Vorrechnen der Annahmen.

### 22 · „Was ist euer Plan B, wenn Tor 1 reißt?“

*Gefragt von: Investor, Förderprüfer · 85 Wörter · 46 Sekunden gesprochen*

> Tor 1 verlangt mehr als 1.500 Wartelisten-Anmeldungen, davon mindestens 900 aus einer Stadt, gemessen nach 151 Tagen Laufzeit. Reißt es, gilt seit dem 26. September schriftlich dieselbe Regel wie für Tor 2: 90 Tage Verlängerung nur, wenn die Eintragungen je Woche über vier Wochen mindestens zwanzig Prozent steigen; sonst Formatwechsel, dann geordnetes Ende. Ändern dürfen wir die Regel nur, solange die Messung mehr als dreißig Tage entfernt ist. Was wir ausschließen: weitermachen und die Schwelle nachträglich senken. Ein Tor, das man verschiebt, ist kein Tor.

**Worauf sich das stützt**

- `01-steuerung/tor-1-zeitachse-analyse.md` — die 151 Tage Laufzeit und die Reichweitenrechnung
- Beschlüsse Nr. 15 (21.09.2026) und **Nr. 93 (26.09.2026)** — die Regeln für **beide** Tore stehen in `01-steuerung/zusagen-tor-2-und-notfall.md`, Abschnitte 1, 1a und 1b; der Frühindikator hat sein Maß (vier Wochen mindestens 20 % über den vier Wochen davor)

**Was man nicht sagen sollte:** „Dann machen wir eben weiter.“ — Damit ist das ganze Torsystem wertlos, und aufmerksame Prüfer hören das sofort.

### 23 · „Ihr habt noch keine Nutzer. Woher wisst ihr, dass das Problem überhaupt existiert?“

*Gefragt von: Investor, Förderprüfer · 79 Wörter · 43 Sekunden gesprochen*

> Wir wissen es nicht. Wir haben eine Analyse aus dem Wettbewerb und aus der Rechtslage, und wir haben 60 bis 80 Gespräche, die im Oktober 2026 beginnen und im Frühjahr 2027 ausgewertet sind. Bis dahin sagen wir „Analyse“ und nicht „belegt“ — auch in der Investorenpräsentation steht auf der Traktionsfolie kein Ergebnis, das wir nicht haben, sondern ein Platzhalter mit Datum. Widerlegen die Gespräche die These, ist das der billigste Fehlschlag des ganzen Vorhabens: Er kostet Zeit, kein Kapital.

**Worauf sich das stützt**

- `20-interviews-feedback/interviewleitfaden.docx` — 60 bis 80 Gespräche, Beginn Oktober 2026
- `40-finanzen-foerderung/pitchdeck-skript.md` — Folie 10 trägt Platzhalter mit Datum statt erfundener Traktion

**Was man nicht sagen sollte:** „Das Problem ist offensichtlich.“ — Wäre es offensichtlich, bräuchte es die Interviews nicht, und genau die sind unser Argument.

### 24 · „Was ist euer Exit?“

*Gefragt von: Investor · 78 Wörter · 43 Sekunden gesprochen*

> Ehrlich: Dieses Produkt ist nicht auf einen schnellen Verkauf gebaut, und wir stellen das nicht anders dar. Es begrenzt seine Erlöse bewusst — keine Werbung, kein Datenverkauf, keine Bezahlschranke vor Schutzfunktionen. Denkbar ist ein Verkauf an einen Anbieter im selben Markt oder an eine Gruppe, die den Datenschutzanspruch mitträgt. Beides setzt voraus, dass die Einwilligungen nach Art. 9 DSGVO die Rechtsnachfolge ausdrücklich vorsehen; sonst gefährdet ein Verkauf die Rechtsgrundlage. Genau das ist als Punkt für den Anwalt notiert.

**Worauf sich das stützt**

- Offene Entscheidung Nr. 12 — Rechtsnachfolge in der Datenschutzerklärung ausdrücklich vorsehen
- `40-finanzen-foerderung/pitchdeck-skript.md` — dieselbe Antwortlinie im Sprechskript, damit sie nicht variiert

**Was man nicht sagen sollte:** „Übernahme durch einen der Großen in fünf Jahren.“ — Eine Behauptung ohne Grundlage, und sie widerspricht dem eigenen Produktversprechen.

### 25 · „Warum sollte ein Ort mit euch zusammenarbeiten, wenn ihr noch keine Nutzer habt?“

*Gefragt von: Ortspartner · 88 Wörter · 48 Sekunden gesprochen*

> Weil die erste Gegenleistung nichts mit der App zu tun hat. Vor dem Start läuft ein Terminservice: Wir sammeln, prüfen und veröffentlichen, was in der Stadt stattfindet — mit Nennung des Ortes, ohne Gegenleistung und ohne Vertrag. Wer davon profitiert, kennt uns, bevor wir etwas wollen. Angepeilt sind rund 40 Orte in Köln, davon 15 Zusagen vor der Freischaltung. Was wir nicht tun: Reichweite versprechen, die wir nicht haben. Wenn wir in einem halben Jahr nichts geliefert haben, ist die Zusage nichts wert — das sagen wir vorher.

**Worauf sich das stützt**

- `30-marketing-kanaele/terminservice-konzept.md` — Wochenablauf, Quellenregeln, Aufwand in Minuten
- `01-steuerung/skalierungs-playbook.md` — 15 Ortszusagen als Startschwelle, rund 40 im ersten Jahr

**Was man nicht sagen sollte:** „Ihr bekommt viele neue Gäste.“ — Nicht belegbar, und der schnellste Weg, eine Ortsbeziehung dauerhaft zu verlieren.

---

## Fragen, auf die wir noch keine gute Antwort haben

Der wertvollste Teil dieses Dokuments. Wer eine dieser Fragen gestellt bekommt, sagt, dass sie offen ist, und nennt, wann sie beantwortet wird — nicht mehr und nicht weniger. **Eine ehrliche Schwäche kostet weniger als eine Antwort, die zerfällt.**

| Frage | Wo wir stehen | Wer sie schließt |
|---|---|---|
| **Was genau steckt in den Bezahlstufen?** | Die Preise stehen — 9 € und 17 € —, die Richtung auch: Inkognito und Travel im Abo (Nr. 48), zwei Stufen plus Unterstützerbeitrag (Nr. 67). Der Feinschnitt ist ein Vorschlag (PLUS mit Inkognito, PRO mit Travel) und wartet auf die Interviews. Bis dahin ist „was bekomme ich wofür?“ nur zur Hälfte beantwortet. | Gründer, nach den Interviews |
| **Wie viele Menschen bricht die Altersprüfung ab?** | Wir haben keinen Messwert, nur eine Annahme im Modell. Jede genannte Zahl wäre geraten. Belastbar wird es erst in der geschlossenen Beta mit 150 Testnutzern. | Messung in Phase 1d |
| **Was passiert, wenn jemand den Zugang endgültig verliert?** | **Seit 21.09.2026 (Nr. 69) und 26.09.2026 (Nr. 86 — eine Vertrauensperson genügt, Schutzvorkehrungen offen in Nr. 95) beantwortet:** Jeder bekommt zu Beginn einen Wiederherstellungscode; zweite Adresse, Mobilnummer und Vertrauenspersonen sind freiwillig. Wer nichts davon nutzt und den Code verliert, verliert das Konto — und erfährt das vorher klar. Offen ist nur noch, wie Vertrauenspersonen helfen, ohne dass wir wissen, wer sie sind (**Nr. 86**). | Gründer |
| **Halten die Store-Richtlinien unsere Funktionsliste aus?** | **Seit 20.09.2026 geprüft (A-53):** Profilbilder mit Nacktheit erscheinen in den Apps unkenntlich, im Web sichtbar (Nr. 71); auch private Nachrichten fallen unter die Regeln für nutzergenerierte Inhalte, und Melden, Sperren und Moderation sind vorhanden. Eine Zusage der Stores ist das nicht — die gibt es erst mit dem Antrag. Die Web-Fassung erscheint in jedem Fall. | Gründer, beim Store-Antrag |
| **Wie verhindert ihr Erpressung mit Bildern oder Outing?** | Technisch kaum. Screenshots lassen sich nicht zuverlässig unterbinden, und jede Maßnahme dagegen kostet Nutzbarkeit. Was wir haben, sind Meldewege, Fristen und Beweissicherung — also Reaktion, keine Verhinderung. Das ist eine ehrliche Schwäche, keine gelöste Frage. | offen |
| **Was macht ihr, wenn die Interviews die These widerlegen?** | Es gibt keinen zweiten Produktentwurf in der Schublade. Der Plan sieht vor, in diesem Fall zu stoppen und neu zu denken — das ist konsequent, aber es ist keine Antwort auf die Frage „und dann?“. | Gründer, nach V1 |
| **Wer moderiert nachts?** | Die Frist im Graubereich lautet unter zwölf Stunden, damit auch Nacht und Wochenende abgedeckt sind. Eine echte Nachtabdeckung gibt es nicht und wird es zu zweit nicht geben. Bei einem schweren Fall um drei Uhr nachts ist die ehrliche Antwort: Es dauert bis zum Morgen. | offen bis zur ersten Moderationskraft |
| **Wie viel Zeit steht nach dem Start wirklich zur Verfügung?** | Der Start liegt frühestens im Sommer 2028, geplant wird ein Jahr später (Nr. 45). Ob beide Gründer danach in Vollzeit arbeiten, ist nicht festgelegt; die Eckpunkte des Gesellschaftsvertrags regeln seit dem 21.09.2026, was bei deutlich reduzierter Mitarbeit geschieht (Nr. 4). Die Kapazitätsplanung bleibt trotzdem eine Annahme. | Gründer |

**Was diese Liste wert ist:** Sie ist der einzige Teil des Handbuchs, den man einem Prüfer zeigen kann, ohne dass es nach Verkauf klingt. Wer acht offene Fragen benennen kann, hat nachgedacht; wer keine hat, hat nicht lange genug hingesehen.

---

## Was dieses Handbuch nicht ist

- **Keine Freigabe.** Kein Satz wird vorgetragen, bevor die Gründer ihn geprüft haben.
- **Keine Rechtsauskunft.** Wo es rechtlich wird, gilt, was in der Anwaltsakte steht, nicht die Kurzfassung hier.
- **Kein Ersatz für Zuhören.** Die meisten dieser Fragen kommen anders formuliert, als sie hier stehen. Erst verstehen, was gemeint ist, dann antworten.
- **Keine Sammlung von Killerphrasen.** Wer eine Frage mit einem gut sitzenden Satz abräumt, gewinnt den Moment und verliert die Nachprüfung.

---

## Prüfprotokoll

Programmatisch geprüft am 18.09.2026 mit dem Bauskript dieses Dokuments; der Bau bricht ab, wenn eine Prüfung fehlschlägt.

| Prüfung | Ergebnis |
|---|---|
| Genau 25 Fragen, lückenlos nummeriert | bestanden |
| Jede Antwort unter 60 Sekunden bei 110 Wörtern je Minute | längste 57 s (Frage 7) |
| Jede Antwort mit mindestens einer überprüfbaren Angabe | 25 von 25 |
| Je Antwort zwei Belege und ein Satz, den man nicht sagen sollte | bestanden |
| Die 13 im Auftrag genannten Fragen enthalten | 13 von 13 |
| Auszeichnung (markdownlint) | im Bau geprüft |

**Was nicht geprüft werden konnte:** Ob eine Antwort im Gespräch trägt. Das zeigt sich erst, wenn jemand nachfragt — und die wertvollen Fragen sind die zweiten, nicht die ersten.
