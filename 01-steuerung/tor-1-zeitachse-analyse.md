# Tor 1 und die zwei Zeitrechnungen — Analyse und Entscheidungsvorlage

Erstellt: 27.07.2026, 15:10 Uhr · Aufgabe A-23 · Rolle: Planungsanalyst · Fenster **V0**
Grundlage: Handbuch A Abschnitt 9 (Bauplan) · Handbuch B Teile VI–VIII · `zeitplan-bis-start.md` · Beschluss vom 26.07.2026
Zu bearbeiten **vor** A-22 (Tor-1-Kennzahlenvorlage)

> **Das Ergebnis vorweg: Der Widerspruch ist bereits aufgelöst — durch eure eigene Entscheidung vom 26. Juli.** Er bestand nur, solange beide Handbücher ihre Monate bei T0 zu zählen begannen. Seit die Kanalproduktion auf V3 gelegt wurde, laufen zwei Uhren, und wenn man sie richtig übereinanderlegt, passen die Angaben zusammen. Tor 1 misst dann keine 90 Tage Warteliste, sondern **151**. Und der Zielwert von 1.500 ist im mittleren Fall nicht knapp erreichbar, sondern **um 62 Prozent übererfüllt**.
>
> **Aber:** Es gibt eine neue, sehr konkrete Bedingung, die bisher nirgends steht. Sie hat mit einem Datum zu tun.

---

## 1 · Der Widerspruch im Wortlaut

| Quelle | Fundstelle | Aussage |
|---|---|---|
| **Handbuch A**, Bauplan, Monat 1–3 | Phase 0 | „Wartelistenseite mit Postleitzahl — **Dichte messen, nicht Anmeldungen**" |
| **Handbuch A**, Bauplan, Monat 1–3 | Phase 0 | „**Tag 90: das Tor.** Weiter nur bei über 1.500 Anmeldungen, davon mind. 900 aus einer Stadt" |
| **Handbuch B**, Social-Media-Zeitplan | Monat 8–12 | „**Warteliste und Beta.** Jetzt wird auf die Warteliste hingearbeitet." |
| **Handbuch B**, Social-Media-Zeitplan | Monat 1 | „Der Aufbau braucht **sechs bis neun Monate Vorlauf**. Wer erst zum Launch anfängt, hat zum Launch null Reichweite." |
| **Handbuch B**, Kapitalfahrplan | Monat 6–10 | „Crowdfunding, sobald die Warteliste über 1.000 Personen hat" |
| **Handbuch B**, Zusammenfassung | — | „Tag 90: 900 Wartelisten-Anmeldungen aus einer Stadt" |

Liest man alle sechs Zeilen mit **derselben** Monatszählung ab T0, ergibt sich Unsinn: Die Warteliste soll ab Monat 8 aufgebaut werden, aber schon an Tag 90 — also Ende Monat 3 — über 1.500 Eintragungen haben. Und das Crowdfunding in Monat 6 soll von einer Liste abhängen, die es in Monat 6 noch gar nicht gibt.

Dazu kommt eine dritte Spannung, die niemand bemerkt hat: **Handbuch A sagt selbst „Dichte messen, nicht Anmeldungen" — und setzt dann eine Anmeldungszahl als Torkriterium.**

---

## 2 · Die Auflösung: es sind zwei Uhren, nicht eine

Am 26.07.2026 wurde festgelegt (`zeitplan-bis-start.md`): **Kanalproduktion ab V3, also neun bis zwölf Monate vor T0.** Damit läuft der Kanal nach einer anderen Uhr als die Roadmap.

| | Uhr | Beginnt | Zählt |
|---|---|---|---|
| **Kanalmonat (KM)** | Handbuch B, Teil VI und VII | **Oktober 2027** (V3) | Monate seit der ersten Veröffentlichung |
| **Roadmapmonat (RM)** | Handbuch A, Bauplan · Handbuch B, Szenarien | **T0, Sommer 2028** | Monate seit dem realen Start |

Der Versatz beträgt **neun Monate**. Damit gilt: `RM n = KM (n + 9)`.

### Was passiert, wenn man die Uhren übereinanderlegt

| Handbuch-B-Phase | Kanalmonat | Kalender | Roadmapmonat |
|---|---|---|---|
| Kanäle anlegen | KM 1 | Okt 2027 | — (V3) |
| Rhythmus finden | KM 2–3 | Nov–Dez 2027 | — (V3) |
| Bauen in der Öffentlichkeit | KM 4–9 | Jan–Jun 2028 | — (V3/V4) |
| **Warteliste und Beta** | **KM 8–12** | **Mai–Sep 2028** | **überlappt T0 bis RM 3** |
| Start und Ortsservice | ab KM 13 | ab Okt 2028 | ab RM 4 |

**Tor 1 liegt bei RM 3 = KM 12.** Das ist der letzte Monat von Handbuch Bs Wartelistenphase — also **genau der Zeitpunkt, zu dem diese Phase ihr Ergebnis liefern soll.**

Der Widerspruch war ein Rechenfehler in der Zählung, kein Sachfehler. Und er ist durch eine Entscheidung geheilt worden, die aus einem ganz anderen Grund getroffen wurde.

---

## 3 · Was daraus folgt: Tor 1 misst 151 Tage, nicht 90

| | |
|---|---|
| Wartelistenseite geht live | **Mai 2028** (KM 8, Fenster V4) |
| T0 — der reale Start | **Juli 2028** |
| Tor 1 misst | **Ende September 2028** (RM 3) |
| **Tatsächliche Laufzeit der Warteliste bei der Messung** | **151 Tage** |
| davon **vor** T0 | 61 Tage |

Das ist die eigentliche Korrektur. Die Frage lautet nicht „Schaffen wir 1.500 in 90 Tagen?", sondern **„Schaffen wir 1.500 in fünf Monaten, mit einem Kanal, der dann zwölf Monate alt ist?"** — und das sind zwei sehr verschiedene Fragen.

---

## 4 · Die Reichweitenrechnung

### 4.1 Was 1.500 über den sozialen Kanal allein verlangen würden

Trichter rückwärts gerechnet, drei Annahmesätze. Keine dieser Quoten steht in den Handbüchern; sie sind Planungsgrößen dieses Dokuments.

| Annahmesatz | Bestätigung Double-Opt-in | Seitenbesuch → Absendung | Aufruf → Seitenbesuch | **Nötige Aufrufe in 90 Tagen** | je Beitrag bei 8 Beiträgen/Woche |
|---|---|---|---|---|---|
| pessimistisch | 60 % | 8 % | 0,5 % | **6.250.000** | 60.096 |
| mittel | 70 % | 15 % | 1,0 % | **1.428.571** | 13.736 |
| optimistisch | 80 % | 25 % | 2,0 % | **375.000** | 3.606 |

Zur Einordnung: Handbuch B setzt als zweites Tor bei KM 12 **5.000 echte Follower** an. Ein Kanal dieser Größe erreicht im mittleren Fall keine 13.736 Aufrufe je Beitrag. **Über den sozialen Kanal allein ist der Wert nicht zu holen** — und das ist der Grund, warum Handbuch B ihn auch nie allein ansetzt.

### 4.2 Was tatsächlich zur Verfügung steht — über 151 Tage

Die Offline-Kanäle tauchen in Handbuch Bs Marketingrechnung **überhaupt nicht auf**. Sie sind aber der größte Beitrag.

| Quelle | Rechnung | pessimistisch | Mittel | optimistisch |
|---|---|---|---|---|
| Interviews aus V0/V1 | 70 Gespräche × 80 % | 45 | 56 | 64 |
| **Partnerorte, QR hinter der Theke** | 12 aktive Orte × 22 Wochen × 2–6 je Woche | 517 | **1.035** | 1.553 |
| **ColognePride-Stand** | ein Wochenende; Handbuch B nennt 400 als Größenordnung | 250 | **400** | 700 |
| Queere Sportvereine und Gruppen | 6 Gruppen × 30–120 Mitglieder × 15 % | 27 | 90 | 216 |
| Sozialer Kanal (KM 8–13) | 2.500–5.000 Follower, davon 8–15 % | 200 | 450 | 750 |
| Mundpropaganda | Aufschlag 20 % auf alles Übrige | — | — | — |
| **Summe** | | **1.247** | **2.437** | **3.940** |
| **Erfüllung des Zielwerts 1.500** | | **83 %** | **162 %** | **263 %** |

**Im mittleren Fall wird das Ziel um 62 Prozent übererfüllt.** Selbst im pessimistischen Fall werden 83 Prozent erreicht. Tor 1 ist damit **kein unerreichbares Kriterium** — es ist ein anspruchsvolles, aber realistisches.

Zwei Positionen tragen zusammen 59 Prozent des Ergebnisses: die Partnerorte und der CSD-Stand. Beide sind offline, beide sind lokal, und beide hängen an Arbeit, die in V3 und V4 geleistet werden muss.

> **Ergänzt am 22.09.2026, entschieden am 26.09.2026:** Die Zeile „Partnerorte“ unterstellte die Tauschstufe aus Handbuch B — QR-Code hinter der Theke gegen Hervorhebung im Verzeichnis. **Beschluss Nr. 91 schließt die Hervorhebung aus, auch im Tausch.** Die Orte stellen den QR-Code also **ohne Gegenleistung** auf; angeboten werden dürfen nur Dinge, die keine Sichtbarkeit sind — früher Beta-Zugang für das Personal, Material, namentlicher Dank.
>
> **Was das für diese Rechnung bedeutet, ehrlich gesagt:** Die rund **1.000 der 2.437 Eintragungen**, die im mittleren Fall aus zwölf Partnerorten kommen sollen, hängen jetzt allein an der Überzeugungskraft der Anlässe aus dem Playbook. Ob zwölf Orte ohne Gegenleistung mitmachen, ist **nicht belegt** — und die Zahl bleibt bis zu den ersten Gesprächen die unsicherste dieser Analyse. **Wenn sich zeigt, dass Orte ohne Gegenleistung nicht mitmachen, ist das ein Befund für Tor 1 und kein Grund, Nr. 65 aufzuweichen.** Zu messen ist es in V3, beim ersten Dutzend Gespräche (Anlass 9 des Playbooks).

---

## 5 · Der neue Befund: ein Datum entscheidet über 480 Eintragungen

**ColognePride findet regelmäßig am ersten Juliwochenende statt.** Handbuch B nennt ihn ausdrücklich „den größten einzelnen Akquisemoment im deutschsprachigen Raum".

| T0 | Tag 90 | Liegt ColognePride im Fenster? | Erwartung Mittel | Erfüllung |
|---|---|---|---|---|
| **Anfang Juli 2028** | Ende September 2028 | **ja**, in den ersten Tagen | **2.437** | **162 %** |
| **September 2028** | Ende November 2028 | **nein** — der nächste ist zwölf Monate entfernt | **1.957** | **130 %** |

Die Differenz beträgt **480 Eintragungen** allein durch die Wahl des Starttermins innerhalb desselben Sommers. Beide Varianten erfüllen das Kriterium im Mittel — aber im pessimistischen Fall fällt die Septembervariante auf **63 Prozent** und reißt das Tor.

**Das ist eine Entscheidung, die heute getroffen werden kann und zwei Jahre lang keinen Cent kostet.** Sie steht bisher nirgends: `zeitplan-bis-start.md` nennt nur „Sommer 2028".

*Zu prüfen: Das Abitur endet je nach Bundesland und Prüfungsplan unterschiedlich. Ein T0 Anfang Juli setzt voraus, dass beide bis dahin fertig sind. Falls nicht, ist die Alternative ein T0 **im Juni** — dann liegt ColognePride ebenfalls im Fenster, und es bleibt sogar Vorlauf.*

---

## 6 · Die zweite Bedingung: 900 aus einer Stadt

| | |
|---|---|
| Rein lokale Quellen im Mittel (Interviews, Orte, CSD, Vereine) | **1.581** |
| davon in Köln und der Rheinschiene | nahezu 100 % |
| **Erfüllung der 900er-Bedingung durch Offline allein** | **176 %** |
| 900 gemessen an der lokalen Zielgruppe (75.000–95.000) | 0,95 % bis 1,20 % |
| 900 gemessen an der Kölner Startschwelle (5.000 Nutzer) | 18 % |

### Der Befund, der die beiden Kriterien miteinander verbindet

**Sie ziehen gegeneinander.**

- Der Zielwert **1.500 gesamt** wird leichter, je mehr über den sozialen Kanal läuft — dort ist die Reichweite skalierbar.
- Die Bedingung **900 aus einer Stadt** wird schwerer, je mehr über den sozialen Kanal läuft. Handbuch B warnt selbst: *„Ein viraler Beitrag bringt Installationen aus ganz Deutschland — überall ein bisschen Dichte, nirgends genug."*

Das ist kein Konstruktionsfehler, sondern der eigentliche Sinn des Doppelkriteriums: Es erzwingt **lokale** Nachfrage und macht einen bundesweiten Zufallstreffer wertlos. Wer das versteht, plant anders — nämlich offline zuerst.

---

## 7 · Drei Auflösungen, wie die Aufgabe sie verlangt

*Zur Erinnerung: Die Schwelle selbst zu ändern ist ausdrücklich nicht Aufgabe dieses Dokuments. Eine nachträglich gesenkte Messlatte ist wertlos.*

### Option A — Schwelle senken

**Was sie bedeuten würde:** Der Zielwert wird auf ein Niveau gesetzt, das sicher erreichbar ist.

**Was dafür spricht:** Nichts, was die Rechnung hergibt. Nach Abschnitt 4.2 wird der Wert im mittleren Fall um 62 Prozent übererfüllt. Eine Senkung wäre eine Antwort auf ein Problem, das nach dieser Analyse nicht besteht.

**Was sie kaputtmacht:** Ein Tor, dessen Schwelle gesenkt wird, sobald sie unbequem wird, ist kein Tor mehr, sondern eine Formalie. Sein Wert liegt gerade darin, dass er auch **Nein** sagen kann.

**Einschätzung:** entfällt nach dieser Rechnung.

---

### Option B — Tor 1 zeitlich verschieben

**Was sie bedeuten würde:** Die Messung wandert von Tag 90 auf Tag 120 oder 150.

**Was dafür spricht:** Bei einem T0 im September, ohne ColognePride im Fenster, würde eine Verschiebung um 60 Tage den nächsten Sommer nicht erreichen — sie hilft also nicht. Bei einem T0 im Juli ist sie unnötig.

**Was sie kaputtmacht:** Tor 1 hat einen zweiten Zweck, der leicht übersehen wird: Es begrenzt, wie lange Geld in ein Vorhaben fließt, das nicht trägt. Nach Abschnitt 4 des Finanzmodells sind bis RM 3 rund 20.000 bis 25.000 Euro gebunden. Jede Verschiebung erhöht diesen Betrag.

**Einschätzung:** Nur sinnvoll, wenn ein äußerer Umstand die ersten Wochen verschluckt — etwa ein verspäteter Abiturtermin.

---

### Option C — Kriterium wechseln: Dichte statt Gesamtzahl

**Was sie bedeuten würde:** Das Torkriterium misst nicht mehr 1.500 gesamt und 900 in einer Stadt, sondern **Dichte** — etwa: *„mindestens 300 Eintragungen im Umkreis von 3 Kilometern um die Schaafenstraße"*.

**Was dafür spricht:** Handbuch A verlangt es selbst — „Dichte messen, nicht Anmeldungen" — und tut es dann nicht. Und Handbuch B beschreibt die Kaltstart-Taktik so: *„Ziel der ersten Monate ist nicht 5.000 Nutzer in Köln, sondern 300 Nutzer im Umkreis von 500 Metern an einem Samstagabend. Auf 500 Metern fühlen sich 300 Menschen wie eine volle App an; über ganz Köln verteilt wie eine leere."*

Ein Dichtekriterium misst also genau das, was über Erfolg oder Misserfolg entscheidet — und die Postleitzahl wird ohnehin abgefragt.

**Was sie kaputtmacht:** Zwei Dinge. Erstens ist ein Dichtewert **schwerer zu kommunizieren** — gegenüber Förderprüfern, Investoren und der eigenen Motivation ist „1.500 Menschen warten" eine bessere Geschichte als „0,4 Eintragungen je Quadratkilometer". Zweitens ist er **anfälliger für Definitionsstreit**: Welcher Radius, welcher Bezugspunkt, welche Postleitzahlen zählen zu Köln?

**Einschätzung:** Inhaltlich die beste Option, kommunikativ die schwächste. Ein möglicher Mittelweg wäre, beide zu führen — das Doppelkriterium als Torwert, die Dichte als Steuerungsgröße, die man jede Woche ansieht.

---

## 8 · Was diese Analyse an anderer Stelle ändert

| Dokument | Was nachzuziehen ist | Status |
|---|---|---|
| `zeitplan-bis-start.md` | Die Zuordnung von Kanalmonat zu Roadmapmonat fehlt vollständig. Ohne sie entsteht der Widerspruch bei jedem neuen Leser erneut. | **ergänzt am 27.07.2026** |
| `offene-entscheidungen.md` | Der genaue T0-Termin ist eine offene Entscheidung mit beziffertem Gegenwert (480 Eintragungen). | **als Nr. 45 aufgenommen** |
| `aufgaben-phase-0.md`, A-22 | Die Tor-1-Kennzahlenvorlage muss 151 Tage abbilden, nicht 90 — und die Dichte als zweite Spalte führen. | **Prompt ergänzt** |
| `finanzmodell.xlsx` | Fünfter Widerspruch aufgefallen, siehe unten. | **auf dem Blatt „Herkunft & Widersprüche" ergänzt** |

### Der fünfte Widerspruch in Handbuch B

Beim Übereinanderlegen der Uhren ist eine weitere Unstimmigkeit aufgefallen, die das Finanzmodell betrifft:

**Handbuch A** stellt die App erst in **Monat 10** öffentlich (Phase 2); in Monat 8–9 gibt es eine geschlossene Beta mit **150 Testnutzern** *(Beschluss Nr. 89 vom 26.09.2026 setzt **200**; Handbuch A bleibt unberührt)*.
**Handbuch B** nennt für das erste Jahr im realistischen Fall einen **MAU-Jahresmittelwert von 3.200**.

Beides zusammen geht nicht auf: Startet die App in Monat 10 und erreicht Ende Monat 12 die genannten 7.500 MAU, liegt der Jahresmittelwert bei etwa 900 — nicht bei 3.200. Das Finanzmodell folgt Handbuch B, weil von dort sämtliche Finanzzahlen stammen; der Startmonat ist dort ein blaues Eingabefeld und kann auf 10 gesetzt werden, um die andere Lesart zu sehen. Die Abweichung ist erheblich und gehört vor dem ersten Förderantrag geklärt.

---

## 9 · Die Entscheidungsvorlage

Alles, was die Gründer in einer Sitzung entscheiden können. Jede Zahl in dieser Vorlage ist in den Abschnitten 4 bis 6 hergeleitet.

| # | Frage | Möglichkeiten | Gegenwert |
|---|---|---|---|
| 1 | **Wann genau ist T0?** | Anfang Juli 2028 · September 2028 | **480 Eintragungen**, und im pessimistischen Fall die Frage, ob das Tor hält (83 % gegen 63 %) |
| 2 | Bleibt es beim Doppelkriterium 1.500 / 900? | ja · nein | Bei Ja: keine Änderung nötig, die Rechnung trägt |
| 3 | Kommt ein **Dichtekriterium** dazu? | als Torwert · als Steuerungsgröße · gar nicht | Misst, was tatsächlich über Erfolg entscheidet — kostet Erklärbarkeit |
| 4 | Wie viele Partnerorte müssen bei T0 **aktiv verteilen**? | Die Rechnung unterstellt **12**. | Jeder Ort weniger kostet rund 86 Eintragungen über 151 Tage |
| 5 | Wird der ColognePride-Stand fest eingeplant? | ja · nein | 400 Eintragungen im Mittel; 3.500–5.000 € Kosten laut Handbuch B |

---

## 10 · Was dieses Dokument bewusst nicht tut

**Es senkt keine Schwelle.** Das war ausdrücklich ausgeschlossen, und die Rechnung gibt es auch nicht her.

**Es empfiehlt keinen T0-Termin.** Der hängt am Abitur, und das ist keine Rechengröße.

**Es behauptet keine Genauigkeit, die es nicht hat.** Sämtliche Trichterquoten in Abschnitt 4.1 und die Ergiebigkeit der Partnerorte in Abschnitt 4.2 sind Annahmen dieses Dokuments, keine Erfahrungswerte. Sie sind so gewählt, dass die pessimistische Spalte tatsächlich pessimistisch ist. Ab V3 lassen sie sich durch echte Zahlen ersetzen — die ersten fünfzig Eintragungen aus einer Partnerbar sagen mehr als jede Schätzung hier.

**Es rechnet nicht mit einem viralen Treffer.** Handbuch B erklärt ausführlich, warum ein solcher Treffer zur falschen Zeit schadet statt hilft. Diese Analyse folgt dem.

---

## Quellen

1. **Handbuch A**, Abschnitt 9 „Bauplan": Phase 0 Monat 1–3 mit Wartelistenseite und Tag-90-Tor; Phase 1d Monat 8–9 mit 150 Testnutzern; Phase 2 ab Monat 10 öffentlich
2. **Handbuch B**, Teil VI, Social-Media-Zeitplan: Monat 1 Kanäle anlegen · Monat 2–3 Rhythmus · Monat 4–9 Bauen in der Öffentlichkeit · Monat 8–12 Warteliste und Beta · ab Monat 13 Start und Ortsservice
3. **Handbuch B**, Teil VI: „Der Aufbau braucht sechs bis neun Monate Vorlauf" · „14 bis 19 Stunden je Woche über mindestens neun Monate"
4. **Handbuch B**, Teil VI, zweites Tor bei Monat 12: 5.000 echte Follower und 800 Installationen
5. **Handbuch B**, Teil VI: „Trenden ist ein Ergebnis, kein Plan" — Warnung vor bundesweiter Streuung
6. **Handbuch B**, Teil I, Kaltstart-Taktik: „300 Nutzer im Umkreis von 500 Metern an einem Samstagabend"
7. **Handbuch B**, Teil I, Städtepriorisierung: Köln und Rheinschiene 75.000–95.000 Zielgruppe, Startschwelle 5.000
8. **Handbuch B**, Teil II: CSD-Stand 3.500–5.000 € je Stadt, „nicht an Installationen gemessen"
9. **Handbuch B**, Teil V, Kapitalfahrplan: Crowdfunding Monat 6–10, sobald die Warteliste über 1.000 liegt
10. **Handbuch B**, Teil VIII: Feedbackwege, 60–80 persönliche Gespräche in Monat 1–3, 40 Ortsbetreiber laufend
11. **ColognePride** findet regelmäßig am ersten Juliwochenende statt (2026: Straßenfest 3.–5. Juli, Demonstration 5. Juli). Für 2028 nicht bestätigt — vor der Planung prüfen. Abgerufen 27.07.2026
12. Eigene Vorarbeiten: `zeitplan-bis-start.md` (Beschluss vom 26.07.2026 zu V0–V4 und Kanalstart in V3) · `../40-finanzen-foerderung/finanzmodell.xlsx` · `roadmap.md`

---

*Alle Rechnungen dieses Dokuments sind in `outputs/a23/rechnung2.py` reproduzierbar hinterlegt.*
