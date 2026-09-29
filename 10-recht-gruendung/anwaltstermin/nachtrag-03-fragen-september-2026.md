# Nachtrag 03 zur Anwaltsakte — Fragen aus der Arbeitsphase September 2026

Erstellt: 18.09.2026 · Ergänzung zu `anwaltsakte-cruizy.docx`, `nachtrag-01-jmstv-verifizierungswege.md` und `nachtrag-02-stand-september-2026.md`
Anlass: Zwischen dem 15. und 18.09.2026 sind die Produktspezifikation, die Nutzerabläufe, das Terminservice-Konzept, das Crowdfunding-Konzept, die Wartelisten-Umfrage, zwei Wettbewerbsbeiträge, der Datenraum, das Einwand-Handbuch und der Trefferprozess entstanden. Dabei sind **50 Fragen** aufgelaufen, die niemand im Team beantworten kann.

> **Dieser Nachtrag ist kein zweiter Fragenkatalog, sondern eine Sortierung.** Er sagt, welche Fragen in den Ersttermin gehören, welche schriftlich nachkommen können und welche warten. Ohne diese Sortierung wäre der Termin nicht zu schaffen — siehe Abschnitt 9 zum Budget.

---

## Was seit Nachtrag 02 dazugekommen ist — in fünf Sätzen

1. **Die Produktspezifikation ist geschrieben** (74 Funktionen, 612 Akzeptanzkriterien) und hat dabei **zwölf Rechtsfragen** erzeugt, die je eine Funktion blockieren — sie heißen dort AF-01 bis AF-12.
2. **Der Meldeweg bei einem Treffer ist konkret geworden:** § 13 DDG macht das Bundeskriminalamt zur Zentralstelle für Meldungen nach Art. 18 DSA, und die Pflicht gilt nach Auskunft des BKA **unabhängig von der Größe des Anbieters** — die DSA-Größenausnahme, auf die wir uns an anderer Stelle stützen, hilft hier nicht.
3. **Ein Produktfehler ist aufgefallen, der eine Rechtsfrage ist:** Weil bewusst keine identifizierenden Daten gespeichert werden, kann ein Zugang endgültig verloren gehen — und jeder denkbare Wiederherstellungsweg schafft entweder ein neues Datum oder ein neues Risiko.
4. **Die Kapitalbedarfsspanne der Jugendschutzfrage ist nachgerechnet:** Sie liegt zwischen **95.258 €** und **166.548 €**, also bei rund **71.000 €** Unterschied — die Zahl aus Nachtrag 02 hat sich bestätigt. *(Stand 21.09.2026, nach den Beschlüssen vom September und A-52: **143.397 € bis 245.841 €**, rund **102.000 €** Unterschied. Die Frage ist damit noch teurer geworden.)*
5. **Crowdfunding, Umfrage und Wettbewerbe** bringen je einen eigenen Block mit — sie sind weniger dringend, aber sie haben Fristen.

---

## Wie dieser Nachtrag gelesen wird

| Zeichen | Bedeutung | Anzahl |
|---|---|---|
| **K** | **K.-o.-Frage** — ohne Antwort wird an dieser Stelle nicht gebaut oder nicht gehandelt. Gehört in den Ersttermin | 10 |
| **W** | wichtig — kann schriftlich nachkommen, aber vor dem Bau der betroffenen Funktion | 32 |
| **S** | später — vor dem Start, nicht vor dem Bau | 8 |

**Wenn die Zeit im Termin knapp wird:** Die zehn K-Fragen dieses Nachtrags kommen **nach** den zehn K.-o.-Fragen aus Teil C1 der Akte und den fünf Fragen aus Nachtrag 02. Realistisch ist das ein zweiter Termin, keine Verlängerung des ersten.

---

## 1 · Die zehn Fragen, ohne deren Antwort nicht gebaut wird

Jede dieser Fragen blockiert eine Funktion, eine Zahl im Modell oder eine Handlung, die vor dem Start ansteht.

### K1 · Gilt die Pflicht zur geschlossenen Benutzergruppe auch im Zweiergespräch?

> **Löst § 4 Abs. 2 JMStV die Pflicht zur geschlossenen Benutzergruppe auch für Bilder und Sprachnachrichten in einem Zweiergespräch aus — und genügt die Authentifizierung über einen Geräteschlüssel dem Raster der Kommission für Jugendmedienschutz für die zweite Stufe?**

**Warum das Geld bewegt:** Zwischen dem günstigsten und dem teuersten zulässigen Weg liegen nach dem nachgerechneten Finanzmodell **95.258 € gegen 166.548 € Kapitalbedarf**, also rund 71.000 €. Die Frage aus Nachtrag 01 und 02 ist damit unverändert die teuerste des Vorhabens; neu ist nur, dass die Spanne jetzt belegt ist. *(Stand 21.09.2026 mit allen Beschlüssen vom September: **143.397 € gegen 245.841 €**, rund 102.000 €. Mit VideoIdent trägt sich die Firma im realistischen Fall in drei Jahren nicht.)*

**Neu an der Frage:** In der Spezifikation heißt sie **AF-06**. Sie entscheidet zusätzlich darüber, ob Sprachnachrichten wie Bilder behandelt werden müssen — das war bisher nirgends festgelegt.

**Bezug:** `50-produkt-prototyp/produktspezifikation.md` (AF-06, Z-03, F48, F49) · offene Entscheidungen **Nr. 1**, **Nr. 39**, **Nr. 40**

### K2 · Erfüllt ein Hash-Treffer die Meldeschwelle des Art. 18 DSA?

> **Art. 18 DSA verlangt die Meldung bei Verdacht auf eine Straftat, die „eine Gefahr für das Leben oder die Sicherheit einer Person oder von Personen" darstellt. Erfüllt ein Treffer gegen eine Hash-Liste bekannter Missbrauchsdarstellungen diese Schwelle — und zwar jeder, oder nur unter Bedingungen?**

**Warum wir fragen:** Wir würden im Zweifel melden. Aber eine Meldung ist eine Aussage über einen Menschen gegenüber einer Polizeibehörde; sie „vorsichtshalber" abzusetzen, ist kein neutraler Akt. Umgekehrt ist das Unterlassen einer Pflichtmeldung ein Verstoß gegen den DSA.

**Was wir dazu ermittelt haben:** § 13 DDG bestimmt das **Bundeskriminalamt als Zentralstelle**; nach der BKA-Auskunft zur Meldeverpflichtung gilt die Pflicht für Anbieter von Hostingdiensten **seit dem 17.02.2024 unabhängig von ihrer Größe**. Gemeldet wird über ein Portal, das eine vorherige Registrierung verlangt.

**Bezug:** `10-recht-gruendung/trefferprozess-hash-abgleich.md`, Abschnitt 3 · offene Entscheidung **Nr. 72**

### K3 · Greift die Ausnahme des § 184b Abs. 5 StGB für unsere Moderation?

> **§ 184b Abs. 5 StGB nimmt Handlungen aus, die ausschließlich der rechtmäßigen Erfüllung dienstlicher oder beruflicher Pflichten dienen. Fällt die Moderation einer kleinen Plattform darunter — und wenn ja, unter welchen Bedingungen (Dokumentation, Vier-Augen-Prinzip, Weisungslage)?**

**Warum die Frage gestellt werden muss, bevor der erste Fall eintritt:** Unser Ablauf ist so gebaut, dass **niemand ein Bild ansehen muss**. Es gibt aber einen Ausnahmefall — den Verdacht auf einen Falschtreffer, der sich anders nicht klären lässt. Ob dieser eine Blick zulässig ist, entscheidet, ob wir ihn überhaupt vorsehen dürfen oder den Fall immer abgeben müssen.

**Bezug:** `10-recht-gruendung/trefferprozess-hash-abgleich.md`, Abschnitt 2 · `50-produkt-prototyp/moderationsarchitektur.md`

### K4 · Darf ein Konto bei einem Treffer vorläufig eingeschränkt werden?

> **Art. 22 DSGVO lässt keine vollautomatische Entscheidung mit erheblicher Wirkung zu. Darf ein Konto bei einem Hash-Treffer vorläufig eingeschränkt werden, bevor ein Mensch geprüft hat — Gefahr im Verzug gegen Art. 22?**

**Stand:** Beide Stellungen sind in der Spezifikation beschrieben und im Produkt als Schalter gebaut (M-04); voreingestellt ist die vorsichtige. Wir brauchen die Antwort, bevor der Schalter eine Voreinstellung bekommt, die im Ernstfall gilt.

**Bezug:** offene Entscheidung **Nr. 31** · `50-produkt-prototyp/produktspezifikation.md` (M-04)

### K5 · Ist das Angebot eine Online-Plattform im Sinne des DSA?

> **Ist Cruizy eine Online-Plattform im Sinne des DSA — und gilt die Ausnahme des Art. 19 für kleine Plattformen für uns tatsächlich für den gesamten Abschnitt 3 (Art. 20 bis 28, außer Art. 24 Abs. 3)?**

**Warum das mehr ist als eine Einordnungsfrage:** Handbuch A nennt nur vier entfallende Pflichten und stützt zwei eigene Auflagen — „keine Werbung mit besonderen Datenkategorien" und „Altersprüfung" — auf Art. 26 Abs. 3 und Art. 28 DSA. Beide Vorschriften stehen in Abschnitt 3. Fällt der ganze Abschnitt für uns weg, tragen diese Auflagen keine DSA-Grundlage mehr. **Wir behalten sie trotzdem** und stützen sie auf DSGVO und JMStV — aber die Begründung muss stimmen.

**Bezug:** `50-produkt-prototyp/produktspezifikation.md` (AF-11, W-23) · offene Entscheidung **Nr. 28**

### K6 · Wie ist mit einem Konto umzugehen, dessen Prüfung „nicht volljährig" ergibt?

> **Sofortige Löschung, Frist für den Fall eines Irrtums, oder Sperre gegen eine erneute Registrierung? Und wenn gesperrt werden soll: mit welchen Daten, wenn wir bewusst keine identifizierenden Merkmale speichern?**

**Warum das dringend ist:** Es betrifft Daten von Minderjährigen in einem Angebot, das ausdrücklich ab 18 ist. Handbuch A legt den Umgang nicht fest, und jede der drei Möglichkeiten hat einen eigenen Fehler: Löschen verhindert die Korrektur eines Irrtums, Fristen speichern Daten Minderjähriger, Sperren braucht ein Merkmal.

**Bezug:** `50-produkt-prototyp/produktspezifikation.md` (AF-03, F04)

### K7 · Wie kommt jemand zurück in sein Konto, wenn der einzige Anmeldeweg wegfällt?

> **Das Konto kennt weder Telefonnummer noch Klarnamen noch Geburtsdatum. Verliert eine Person ihr E-Mail-Postfach oder trennt die Verbindung zur Anmeldung mit Apple, gibt es keinen Weg zurück — und niemanden, der die Person identifizieren könnte. Welcher Wiederherstellungsweg ist datenschutzrechtlich zulässig, ohne ein neues identifizierendes Datum einzuführen?**

**Warum das keine Nebensache ist:** Betroffen sind dann auch bezahlte Leistungen und, bei einem laufenden Verfahren, Beweismittel. Eine Wiederherstellung über ein Wiederherstellungswort wirft die Frage auf, ob das Wort selbst zum Identifizierungsmerkmal wird. Zusatzfrage: **Meldet ein neu gesetztes Passwort alle anderen Geräte ab** — und muss es das?

**Bezug:** offene Entscheidung **Nr. 69** · `50-produkt-prototyp/nutzerablaeufe.md` (AB-01, AB-10)

### K8 · Braucht die Wochenmail eine eigene Einwilligung?

> **Braucht eine wöchentliche Terminmail eine eigene Einwilligung neben der Wartelisten-Anmeldung — und ist die Anmeldung zu einer queeren Terminübersicht bereits ein Datum nach Art. 9 DSGVO?**

**Warum das vor dem Kanalstart geklärt sein muss:** Der Terminservice ist der einzige Vorlauf, der ohne App funktioniert, und er startet nach Tor 1. Wird die Mail erst gebaut und dann rechtlich beanstandet, ist die Liste verbrannt — eine zweite Einwilligung lässt sich nicht nachträglich einholen, ohne genau die Mail zu schicken, um die es geht.

**Bezug:** `30-marketing-kanaele/terminservice-konzept.md`, Abschnitt 12.2 · offene Entscheidung **Nr. 53**

### K9 · Darf die Kampagne erst durch die GmbH laufen — und was gilt vorher?

> **Wir gehen davon aus, dass eine Crowdfunding-Kampagne erst nach der Gründung laufen darf, weil sonst die Gründer persönlich Leistungen einer künftigen GmbH versprechen. Ist das richtig — und welche Vorbereitungshandlungen sind vorher zulässig, ohne eine persönliche Verpflichtung zu begründen?**

**Warum die Frage früh gestellt wird:** Der Kapitalfahrplan setzt die Kampagne als einen von drei Wegen an; liegt sie zwingend nach der Gründung, verschiebt sich die Reihenfolge der Finanzierung.

**Bezug:** `40-finanzen-foerderung/crowdfunding/crowdfunding-konzept.md` (R4) · offene Entscheidung **Nr. 26**

### K10 · Ist Apple bei der Anmeldung mit Apple Auftragsverarbeiter oder eigener Verantwortlicher?

> **Handbuch A empfiehlt die Anmeldung mit Apple und schließt US-Auftragsverarbeiter zugleich als „nicht verhandelbar" aus. Beides zusammen geht nur, wenn Apple an dieser Stelle nicht Auftragsverarbeiter ist. Welche Rolle hat Apple — und trägt die Aussage „kein Auftragsverarbeiter außerhalb der EU" dann noch?**

**Warum das eine K-Frage ist:** Der Satz „kein US-Auftragsverarbeiter" steht in der Außendarstellung, im Businessplan, in den Wettbewerbsbeiträgen und in der Förderpräsentation. Wenn er nicht stimmt, stimmt er an sechs Stellen nicht — und zwar gegenüber Leuten, die ihn geprüft haben werden. Dieselbe Frage stellt sich für zwei weitere Dienste des empfohlenen Technikstacks.

**Bezug:** `50-produkt-prototyp/produktspezifikation.md` (AF-02, F03, Q-08) · offene Entscheidung **Nr. 58**

---

## 2 · Die zwölf Fragen aus der Produktspezifikation

Diese Fragen stehen in `50-produkt-prototyp/produktspezifikation.md` als AF-01 bis AF-12 und blockieren dort je eine Funktion. Fünf davon sind oben als K-Fragen ausgeführt (AF-02 → K10, AF-03 → K6, AF-06 → K1, AF-11 → K5, dazu M-04 → K4); die übrigen acht stehen hier vollständig.

| # | Frage | Warum sie gestellt wird | Betrifft | Rang |
|---|---|---|---|---|
| **AF-01** | Brauchen die Sitzungsmarke des Gastmodus und eine Messung im Client eine Einwilligung nach § 25 TDDDG — und genügt eine rein serverseitige Kennzahlenerfassung ohne Einwilligung? | Handbuch A widerspricht sich an dieser Stelle: Es verlangt eine Einwilligung „auch für Analytik" und nennt dieselbe Analytik zugleich einwilligungsfrei | Gastmodus, gesamte Kennzahlenerfassung | W |
| **AF-04** | Darf der mit Schlüssel gebildete Prüfwert einer Telefonnummer gespeichert und zur Wiedererkennung gesperrter Konten genutzt werden? | Ohne diese Antwort gibt es keine Wiedererkennung nach einer Sperre | Sperrumgehung | W |
| **AF-05** | Müssen oder dürfen Inhalte aus dem Archiv und aus verfallenden Nachrichten über eine Meldung hinaus zur Beweissicherung aufbewahrt werden? | Datenminimierung gegen Rechtsverfolgung — beides ist begründbar, beides hat Folgen | Archiv, Meldefälle | W |
| **AF-07** | Braucht eine Meldung in der App die Angaben nach Art. 16 Abs. 2 DSA (Begründung, Fundstelle, Name und E-Mail, Erklärung guten Glaubens), damit sie Kenntnis begründet? | Bestimmt, wie viel wir von einer meldenden Person verlangen — und ob eine anonyme Meldung überhaupt wirkt | Meldeablauf | W |
| **AF-08** | Auf welcher Rechtsgrundlage und mit welchen Merkmalen darf ein gesperrtes Konto wiedererkannt werden, und dürfen frühere Meldende informiert werden? | Wiedererkennung braucht ein Merkmal; Information Dritter braucht eine Grundlage | Sperrumgehung | W |
| **AF-09** | Dürfen oder müssen Nachrichten der Gegenseite im Datenexport enthalten sein (Art. 15 Abs. 4, Art. 20 Abs. 4 DSGVO)? | Ein Chat gehört zwei Personen. Der Export einer Person enthält Daten der anderen | Datenexport | W |
| **AF-10** | Darf nach dem Widerruf der Art.-9-Einwilligung eine Karenz laufen, in der Daten gespeichert, aber nicht mehr verarbeitet werden? | Ein sofortiger Widerruf löscht auch das, was jemand vielleicht nur pausieren wollte | Widerruf, Löschung | W |
| **AF-12** | Wie lange dürfen Inhalte aus Meldefällen nach der Entscheidung aufbewahrt werden? | Die Aufbewahrungsdauer ist ein Parameter im Produkt und steht heute auf einem geschätzten Wert | Meldefälle | W |

**Was diese Liste über das Vorhaben sagt:** Neun der zwölf Fragen betreffen **Datenschutz und Meldewege**, keine einzige das Geschäftsmodell. Die Spezifikation ist an der Stelle vollständig, an der Geld verdient wird, und offen an der Stelle, an der Menschen geschützt werden. Das ist die richtige Reihenfolge des Offenseins, aber es heißt auch: Ohne Anwalt wird an mehreren Funktionen nicht gebaut.

---

## 3 · Fragen aus dem Terminservice und den Mails

Sechs Fragen aus `30-marketing-kanaele/terminservice-konzept.md`, Abschnitt 12.2. K8 oben ist die erste davon.

| # | Frage | Rang |
|---|---|---|
| T2 | **§ 6 Abs. 2 DDG:** Reichen der Markenname als Absender und ein Betreff wie „Diese Woche in Köln"? Muss der werbliche Charakter im Betreff erkennbar sein? | W |
| T3 | **§ 5a Abs. 4 UWG:** Ist die gegenseitige Erwähnung zwischen uns und einem Ort eine „ähnliche Gegenleistung"? Wie wird in Story und Mail gekennzeichnet — genügt eine Freigabe-Nachricht mit dem Zusatz „kostenlos, ohne Gegenleistung"? | W |
| T4 | **Urheber- und Datenbankrecht:** Ist es unbedenklich, einen privat betriebenen Sammelkalender als Hinweisquelle zu nutzen, wenn jeder Termin beim Veranstalter bestätigt und nichts übernommen wird? | W |
| T5 | **Jugendschutz im öffentlichen Kanal:** Ist die nüchterne Nennung von Terminen an Orten mit Cruising- oder Fetischbezug, mit dem Zusatz „ab 18", auf einer Plattform ab 13 Jahren entwicklungsbeeinträchtigend? | **K-nah**, hier W, weil vor dem Kanalstart in V3 |
| T6 | **Postfach `termine@`:** Sind 30 Tage Aufbewahrung für Veranstalter-Mails vertretbar, und gehört das Postfach ins Verzeichnis von Verarbeitungstätigkeiten? | S |
| T7 | **Double-Opt-in:** Ist es rechtlich zwingend oder beweisrechtlich geboten — und dürfen IP-Adresse und Zeitstempel der Bestätigung gespeichert werden, wie lange? | W |

---

## 4 · Fragen aus dem Crowdfunding-Konzept

Dreizehn Fragen aus `40-finanzen-foerderung/crowdfunding/crowdfunding-konzept.md`, Abschnitt 9. **Zu jeder haben wir eine eigene Vorprüfung notiert** — sie steht dort und ist ausdrücklich als Laieneinschätzung gekennzeichnet. K9 oben ist R4. *Stand 21.09.2026: R1 ist nach Nr. 60 enger gefasst, R3 ist gegenstandslos; neu sind R14 und R15 — siehe `nachtrag-04-fragen-19-bis-21-september-2026.md`.*

| # | Frage | Unsere Vorprüfung | Rang |
|---|---|---|---|
| R1 | Sind Einlösecodes für eine Bezahlstufe ~~ohne Laufzeitende~~ — seit Nr. 60 nur noch **befristete** — eine Vermögensanlage — Prospektpflicht, Aufsicht? | Nein, gegenleistungsbasiertes Crowdfunding fällt nach BaFin-Darstellung nicht darunter | W |
| R2 | Welche Widerrufsbelehrung braucht ein Code für eine digitale Leistung, welche eine Führung mit Termin? Wann erlischt das Widerrufsrecht, wer muss belehren — wir oder die Plattform? | offen | W |
| ~~R3~~ | ~~Wie formuliert man „ohne Laufzeitende" wirksam — Umfang, spätere Änderungen, Einstellung des Dienstes, Verkauf, Insolvenz, unbestimmter Starttermin?~~ **Gegenstandslos seit Nr. 60** (21.09.2026) — ersetzt durch R15 in Nachtrag 04 | „Lebenslang" ist ohne Einschränkung nicht haltbar | ~~W~~ |
| R5 | Welche Rolle haben wir für die Unterstützerdaten der Plattform, welche Rechtsgrundlage, welche Löschfristen? **Ist schon die Unterstützung einer solchen Kampagne ein Rückschluss auf die sexuelle Orientierung?** | vermutlich ja — dann Art. 9 DSGVO | **K-nah**, hier W |
| R6 | Deckt die Wartelisten-Einwilligung eine Mail zur Kampagne? Zählt die geschlossene Testphase bereits als Start? | offen, hängt mit K8 zusammen | W |
| R7 | Was muss nach den Plattformrichtlinien als KI-erzeugt gekennzeichnet werden, wenn Entwürfe mit KI entstanden und von den Gründern neu geschrieben wurden? | offen | S |
| R8 | Bestätigung: keine Verlosungen unter Unterstützern | Plattform schließt Lose und Wetten aus; Handbuch B rät ab | S |
| R9 | Was gilt für Unterstützer unter 18 oder ohne bestandene Altersprüfung — Rückzahlung? Welche Anforderungen stellt der Jugendschutz an Kampagnenseite und Video? | offen | W |
| R10 | Dürfen Kampagnen-Codes in den nativen Apps wirken? | Apple lässt Freischaltung über eigene Mechanismen nicht zu; anderswo Erworbenes nur unter Bedingungen | W |
| R11 | Wo liegen die Grenzen vergleichender Aussagen in Video, Kampagnenseite und Pressetext? | § 6 UWG; Handbuch B rät zur Positionierung ohne Nennung | S |
| R12 | Muss die Marke vor dem Kampagnenstart eingetragen oder nur angemeldet sein? | Handbuch B: Anmeldung vor der ersten Pressemitteilung; Name noch offen (**Nr. 5**) | W |
| R13 | Wie ordnen Plattformen eine Cruising-App ein — droht ein Ausschluss? | Mehrere Plattformen schließen pornografische Inhalte und Sexualdienstleistungen aus; unsere Einordnung ist offen | **K-nah**, hier W |

---

## 5 · Fragen aus der Wartelisten-Umfrage

Fünf Fragen aus `20-interviews-feedback/wartelisten-umfrage.md`, Abschnitt 8.

| # | Frage | Rang |
|---|---|---|
| U1 | Ist eine Einladung zur Umfrage per Mail an die Warteliste Werbung im Sinne der Rechtsprechung — und deckt die Wartelisten-Einwilligung sie? Wenn nein: Wie sieht eine zweite, freiwillige Einwilligung ohne Kopplung aus? | W |
| U2 | Sind die Antworten ohne Mail- und IP-Adresse personenbezogen? Braucht es die ausdrückliche Einwilligung nach Art. 9 DSGVO? Wie geht man mit Widerruf und Löschwunsch um, wenn sich Antworten niemandem zuordnen lassen? | W |
| U3 | Reicht die kurze Datenschutzebene im Fragebogen, und was muss der vollständige Hinweis ergänzen? | S |
| U4 | Wie lange dürfen Freitexte liegen, und was gilt, wenn jemand darin Dritte nennt? | S |
| U5 | Läuft die Umfrage vor der Gründung, braucht sie dieselbe Übergangsklausel zur GmbH wie die Warteliste? | W |

---

## 6 · Fragen aus den Wettbewerbsbeiträgen

| # | Frage | Warum | Rang |
|---|---|---|---|
| G1 | **Öffentlichkeit vor dem Start.** Ein Wettbewerbsveranstalter darf Name, Kurzbeschreibung, Geschäftsmodell und Vision für die Öffentlichkeitsarbeit verwenden. Der eigene Zeitplan sieht vor, dass bis Oktober 2027 nichts veröffentlicht wird. Welche Folgen hat eine frühe Veröffentlichung für Marke (**Nr. 5**), Neuheitsschonfrist und die eigene Kanalplanung? | Der Stichtag liegt vor dem Ende der Interviews | **K-nah**, hier W (**Nr. 62**) |
| G2 | **Persönliche Verpflichtung durch die Teilnahme.** Welche Bindungen entstehen durch Teilnahmebedingungen — Nutzungsrechte an eingereichten Unterlagen, Exklusivität, Rückzahlungspflichten bei Nichtdurchführung? | Eingereicht wird vor der Gründung, also persönlich | W |
| G3 | **Besteuerung von Preisgeldern.** Ein Preisgeld von 10.000 €, „projekt- oder bildungsbezogen einzusetzen", fließt vor der Gründung an Privatpersonen. Ist es steuerpflichtig, und ändert sich das, wenn es zweckgebunden ist oder später in die GmbH eingelegt wird? | betrifft beide Wettbewerbe | W — **gehört zum Steuerberater, nicht zum Anwalt** |

---

## 7 · Neue Fragen aus der Vorbereitung von Unterlagen

| # | Frage | Woher | Rang |
|---|---|---|---|
| D1 | **Muster einer Geheimhaltungsvereinbarung** für Investoren- und Förderanfragen — einseitig oder gegenseitig, welche Laufzeit, welche Ausnahmen? | Datenraum-Struktur, Dokument 00.03 | W |
| D2 | **Muster einer Ortsvereinbarung**: Was sagt ein Ort zu, was bekommt er, wer haftet wofür, welche Datenschutzrolle hat der Ort, und wie endet die Vereinbarung? | Datenraum-Struktur, Dokument 05.09 | W |
| D3 | **Rechtsnachfolge in der Datenschutzerklärung.** Wie muss sie formuliert sein, damit ein späterer Verkauf die Art.-9-Einwilligungen nicht entwertet? | offene Entscheidung **Nr. 12**, bestätigt beim Einwand-Handbuch | W |
| D4 | **Was darf ein Datenraum enthalten?** Dürfen aggregierte Nutzerkennzahlen an Investoren gehen, und ab welcher Gruppengröße sind sie sicher nicht mehr personenbezogen? | Datenraum-Struktur, Abschnitt 5 | S |
| D5 | **Zulassungsbedingungen der App-Stores.** Keine Rechtsfrage im engeren Sinn, aber eine, bei der ein Blick von außen hilft: Welche Auflagen der Store-Richtlinien treffen ein Angebot wie unseres, und welche davon sind vertraglich, welche gesetzlich? | offene Entscheidung **Nr. 71** | S |
| D6 | **Gilt der Abgleich auch für gemeldete Inhalte?** Wenn ein Nutzer einen Inhalt meldet, liegt er uns vor. Dürfen oder sollen wir ihn abgleichen, bevor ein Mensch ihn ansieht? | Trefferprozess, offener Punkt 8 | W |

---

## 8 · Was sich an bereits gestellten Fragen geändert hat

| Frage aus | Was sich geändert hat |
|---|---|
| **Nachtrag 01, Kapitalwirkung** | Die Spanne ist nachgerechnet und liegt bei **95.258 € bis 166.548 €**. Die in Nachtrag 02 genannten „rund 71.000 €" Unterschied bestätigen sich (71.290 €). Die Voreinstellung des Modells liegt bei **107.349 €** — nicht bei den 93.000 €, die in älteren eigenen Unterlagen standen. *Stand 21.09.2026 (A-52): 143.397 € bis 245.841 €, Voreinstellung 160.253 €* |
| **Nachtrag 02, Frage 1 (Zone 2)** | Unverändert offen, aber der Ablauf für beide Schalterstellungen ist jetzt geschrieben (`10-recht-gruendung/trefferprozess-hash-abgleich.md`). Die Antwort entscheidet nur noch über den Geltungsbereich, nicht mehr über das Verfahren |
| **Nachtrag 02, Frage 3 (KI-Verordnung)** | Unverändert. Der neue Art. 4a KI-VO bleibt der mögliche Rahmen für die Verzerrungsprüfung (**Nr. 32**) |
| **Akte Teil B6 (DSA)** | Verschärft: Art. 18 DSA gilt nach BKA-Auskunft unabhängig von der Größe. Die Größenausnahme des Art. 19 betrifft nur Abschnitt 3 — siehe **K5** |
| **Akte Teil B4 (Gesellschaftsrecht)** | Unverändert offen: Stammkapitalmodell (**Nr. 20**), Sitz (**Nr. 21**), Vesting und Stichentscheid (**Nr. 4**). Neu ist nur, dass ein Investorengespräch die Kapitaltabelle voraussetzt und die an **Nr. 20** hängt |

---

## 9 · Was das für Termin und Budget bedeutet

**Die ehrliche Rechnung.** Teil F der Akte nennt ein Budget von rund **1.800 €**. Dem stehen jetzt gegenüber: zehn K.-o.-Fragen aus Teil C1, fünf Fragen aus Nachtrag 02 und **50 weitere aus diesem Nachtrag**. Das ist in einem Ersttermin nicht zu beantworten, und es wäre unredlich, so zu tun, als ginge es.

**Vorschlag für die Aufteilung:**

| Schritt | Inhalt | Form | Geschätzter Umfang |
|---|---|---|---|
| **1 · Ersttermin** | Teil C1 der Akte, Nachtrag 02, dazu **K1 bis K5** dieses Nachtrags | Gespräch | 2 bis 3 Stunden |
| **2 · Schriftliche Runde** | **K6 bis K10** und die 32 W-Fragen, gebündelt nach Themen | schriftlich, mit Frist | eigene Vereinbarung |
| **3 · Vor dem Bau** | die übrigen W-Fragen, sobald die betroffene Funktion an die Reihe kommt | schriftlich | nach Bedarf |
| **4 · Vor dem Start** | die 8 S-Fragen | schriftlich | nach Bedarf |

**Was wir die Kanzlei ausdrücklich fragen:** Ob sie ein solches gestuftes Mandat annimmt, was Schritt 2 kosten würde, und ob eine Pauschale für die schriftlichen Runden möglich ist. Wenn nicht, brauchen wir die Antwort trotzdem — dann wird das Budget nicht ausreichen, und das gehört in die Kapitalplanung, nicht in die Hoffnung.

**Was wir nicht tun:** Fragen streichen, damit die Liste kürzer aussieht. Eine nicht gestellte Frage wird nicht billiger, sondern nur später teuer.

---

## 10 · Was dieser Nachtrag nicht ist

- **Keine Rechtsauffassung.** Jede Vorprüfung in den Tabellen ist eine Laieneinschätzung und ausdrücklich zur Korrektur gestellt.
- **Keine Vollständigkeitsgarantie.** Er enthält, was zwischen dem 15. und 18.09.2026 aufgelaufen ist. Die Interviews ab Oktober 2026 werden weitere Fragen erzeugen.
- **Keine Neufassung der Akte.** Akte, Nachtrag 01 und 02 gelten unverändert; dieser Nachtrag ergänzt sie.

---

## Prüfprotokoll

Programmatisch geprüft am 18.09.2026: Alle genannten Entscheidungsnummern existieren in `01-steuerung/offene-entscheidungen.md` · alle genannten Dateipfade existieren im Projektordner · die Summe der Ränge (K, W, S) stimmt mit der Zahl der Fragen überein · Auszeichnung mit markdownlint geprüft.

## Quellen für die neuen Angaben

- **Art. 18 DSA**, Meldung des Verdachts auf Straftaten. Abgerufen am 18.09.2026: <https://gesetz-digitale-dienste.de/dsa/artikel-18/>
- **§ 13 DDG**, Bundeskriminalamt als Zentralstelle. Abgerufen am 18.09.2026: <https://gesetz-digitale-dienste.de/13-ddg/>
- **BKA, FAQ zur Meldeverpflichtung nach Art. 18 DSA** — Pflicht für alle Hostingdiensteanbieter seit 17.02.2024 unabhängig von der Größe, Meldeportal, Mindestangaben. Abgerufen am 18.09.2026: <https://www.bka.de/DE/DasBKA/OrganisationAufbau/Fachabteilungen/ZentralerInformationsUndFahndungsdienst/Digitale_Eingangsstelle/FAQ/faq_dsa_node.html>
- **§ 184b Abs. 5 StGB**, Ausnahme für dienstliche oder berufliche Pflichten. Abgerufen am 18.09.2026: <https://www.juraforum.de/gesetze/stgb/184b-verbreitung-erwerb-und-besitz-kinderpornographischer-inhalte>
- Projektintern: `50-produkt-prototyp/produktspezifikation.md` (AF-01 bis AF-12) · `50-produkt-prototyp/nutzerablaeufe.md` · `10-recht-gruendung/trefferprozess-hash-abgleich.md` · `30-marketing-kanaele/terminservice-konzept.md` · `40-finanzen-foerderung/crowdfunding/crowdfunding-konzept.md` · `20-interviews-feedback/wartelisten-umfrage.md` · `40-finanzen-foerderung/datenraum-struktur.md` · `01-steuerung/offene-entscheidungen.md`
