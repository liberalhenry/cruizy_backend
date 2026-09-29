# Beschlüsse vom 19.09.2026 — Gründerantworten auf 29 offene Punkte

**Grundlage:** Antwort von Henry Luca Kurz am 19.09.2026 auf die im Chat vorgelegte Fragenliste (Block A, 40 Punkte).
**Verbindlichkeit:** Dieses Dokument hält fest, **was entschieden wurde**. Die Entscheidungstabelle `offene-entscheidungen.md` wird daraus gepflegt und bleibt der Ort, an dem der Status steht. Wo eine Antwort eine neue Frage erzeugt, steht sie hier unter „Was daraus neu offen ist" und dort als neue Nummer.
**Was dieses Dokument nicht ist:** keine Rechtsberatung, keine Neufassung der Handbücher. Wo ein Beschluss einem Handbuch widerspricht, ist der Widerspruch benannt und nicht aufgelöst.

---

## Auf einen Blick

| | Anzahl |
|---|---|
| Beantwortete Entscheidungen | **29** |
| Davon vollständig entschieden | **21** |
| Davon Richtung vorgegeben, Ausarbeitung offen | **8** |
| Neue Entscheidungen, die aus den Antworten entstehen | **6** (Nr. 77 bis Nr. 82) |
| Widersprüche zu den Handbüchern, die benannt werden müssen | **3** |
| Neue KI-Aufgaben | **9** (A-51 bis A-59) |

---

## 1 · Bauen und Prüfen

### Nr. 73 — Baumodell A

> „Wir möchten gerne Option a, also die vollkommene Generation mit Prüfung danach, wir möchten wirklich erstmal alles selber machen und dann am Ende die Prüfung machen in allen Bereichen."

**Beschlossen:** **Modell A.** Die KI baut alle Sitzungen S0 bis S13 durch; die externe Prüfung erfolgt **am Ende und über alle Bereiche**. Begründung der Gründer: Es wird neben der Schule gebaut, bis zum Schulende steht ein Produkt, dem man sich dann mit Finanzierung widmen kann.

**Beschlossen:** Die Prüfkosten **kommen ins Finanzmodell** — „sind ja Kosten, die gegenfinanziert werden müssen".

**Folge für die Kalkulation:** Modell A kostet **10.800 € bis 21.600 €** für eine vollständige Prüfung (120 bis 240 Stunden zu 90 €/Stunde). Die oberflächliche Variante (2.200 € bis 3.600 €) erfüllt den Beschluss „Prüfung in allen Bereichen" nicht und wird deshalb nicht angesetzt. Die Einmalkosten steigen damit von **35.800 € auf 46.600 € bis 57.400 €**.

**Was der Beschluss in Kauf nimmt** — ausdrücklich festgehalten, damit es später nicht überrascht:

1. Ein Befund am Ende ist teurer als derselbe Befund in Woche 6. Wenn die Zugriffsrechte anders geschnitten sein müssen, hängen daran dann zwanzig Dateien statt zwei.
2. Zwischen dem Ende des Baus und dem möglichen Start liegen **3 bis 6 Wochen** Prüfzeit.

**Was den Beschluss absichert, ohne ihn zu ändern** — Vorschlag zur Umsetzung:

- Nach den Sitzungen S3 und S11 wird jeweils ein **eigener Prüflauf durch die KI** gefahren, gegen eine feste Liste (Zugriffsregeln, Standortgenauigkeit in allen Pfaden, Protokollinhalte, Löschkaskaden). Das ersetzt keinen Menschen, kostet aber nichts und fängt die grobe Hälfte ab.
- Die vier Bausteine, die nach dem Bauplan „nachträglich nicht einbaubar" sind (Datenmodell, Standort, Bilder, Zugriffsrechte), werden **zuerst** gebaut und mit einem eigenen Abnahmeprotokoll abgeschlossen. Wenn dort ein Fehler steckt, steht er früh fest — auch ohne externen Prüfer.

### Nr. 47 und Nr. 76 — Web und native App, beides

> „Zu 47, würde gerne beides bauen mit dir. Bereite dich also sowohl auf Web als auch Handy-App-Bau schonmal vor!"
> „Frage 39: entwickeln tun wir sie schon, wann sie kommt schauen wir dann."

**Beschlossen:** Es werden **beide** gebaut. Die Schutzfunktionen F58 (Schnellverstecken per Tippen auf die Geräterückseite), F59 (Symbol und Name tarnen) und F63 (Bildschirmfoto-Sperre) werden in den nativen Apps umgesetzt. Am Rechner wird umgesetzt, was technisch geht; was dort nicht geht, entfällt dort — aber es wird vorher geprüft, ob es doch einen Weg gibt.

**Folge:** Der Bauplan bekommt einen zweiten Strang. Das ist die größte Aufwandsänderung dieses Tages und wird in A-51 durchgerechnet.

---

## 2 · Standort, Zonen und Preise

### Nr. 48 — Zone: Ersatzpunkt kostenlos, Inkognito im Abo

> „Ich würde gerne die Funktion haben, dass man sich entscheiden kann, ob man inkognito ist oder einen Ersatzpunkt setzt. Den Ersatzpunkt hätte ich gerne umsonst mit drin, nur inkognito gar nicht angezeigt zu werden dann im Abo. […] Würde dann sagen, man darf maximal 30 Kilometer Radius umsonst machen (Sicherheit), wenn man weiter weg will mit der Zone, oder Leute aus einer anderen Region […] angezeigt haben will (Travel-Version), allerdings dann kostenpflichtige Funktionen."

**Beschlossen:**

| | Wirkung | Preis |
|---|---|---|
| **Ersatzpunkt** (Wirkung E) | Andere sehen einen selbst gewählten Punkt statt des echten Standorts | **kostenlos**, bis **30 km** Abstand zum echten Standort |
| **Inkognito** (Wirkung U) | Man erscheint in keinem Raster, auf keiner Karte, in keiner Liste | **im Abo** |
| **Ersatzpunkt über 30 km / andere Region** | „Travel-Version": vorab umsehen und schreiben, bevor man hinfährt | **im Abo** |

**Warum die Grenze bei 30 km eine Schutzgrenze ist und keine Preisgrenze:** Der Angriff, gegen den eine Zone schützt, ist das Eingrenzen der Wohnung durch wiederholte Abfragen aus verschiedenen Positionen. Ein Ersatzpunkt in bis zu 30 km Entfernung macht das unmöglich — ein weiter entfernter macht es nicht *sicherer*, sondern nur *nützlicher* für etwas anderes. Damit ist das Schutzbedürfnis kostenlos gedeckt und alles darüber hinaus Komfort. **Diese Begründung muss in den Systemtexten stehen**, sonst wirkt die Grenze willkürlich. *Präzisiert am 22.09.2026:* „Unmöglich“ gilt nur, wenn der Ersatzpunkt nicht direkt neben der Wohnung liegt — deshalb der Vorschlag einer Untergrenze von 2 km (`../50-produkt-prototyp/standortanzeige-konzept.md`, Abschnitt 3). Außerdem speichert die Spezifikation den Mittelpunkt einer Zone heute noch genau (W-27). Die Systemtexte beschreiben deshalb, was die App anzeigt, und versprechen nicht, dass niemand den Ort herausfinden kann (ST-STO-40).

**Parameter:** P-ERSATZPUNKT-MAX-KM = 30 (kostenlos). Ohne Codeänderung änderbar.

**Was daraus neu offen ist → Nr. 77:** Ändert der Ersatzpunkt auch, **wen man selbst sieht**? Die Frage steht im Chat zur Entscheidung; bis dahin baut der Prototyp die entkoppelte Fassung (der Ersatzpunkt ändert nur, was andere sehen).

**Widerspruch, der benannt bleibt:** Handbuch A, Prinzip 6 und das Schutzversprechen lauten „Was dich schützt, kostet nie etwas". Inkognito ist eine Schutzwirkung. Der Beschluss stellt darauf ab, dass das Schutzbedürfnis durch den kostenlosen Ersatzpunkt **vollständig gedeckt** ist und Inkognito darüber hinaus eine Komfortwirkung ist (man verschwindet, statt verschoben zu werden). *(Präzisiert am 22.09.2026: „vollständig“ gegen das Eingrenzen der Wohnung über die App — unter den Bedingungen im Absatz davor.)* Das ist vertretbar, aber es ist eine Auslegung von Prinzip 6 und keine Anwendung. Sie wird in den AGB und in den Systemtexten offen ausgesprochen.

### Nr. 67 — Zwei Abostufen plus Unterstützerbeitrag

> „Ich würde für die Abo-Modelle sagen, 2 Abo-Modelle und ein Unterstützerbetrag sollte immer möglich sein, weil wir es natürlich als Unternehmen betreiben, es aber ja auch über das Crowdfunding eine Art Community-Projekt sein soll. Gerne in den Texten dann auch so beschreiben in der App, dass es der Finanzierung gilt, wir aber versuchen, möglichst alle Funktionen kostenfrei zu halten."

**Beschlossen:** **Zwei Abostufen** und ein **Unterstützerbeitrag**, der jederzeit möglich ist und nichts freischaltet. In den Systemtexten wird offen gesagt, wofür das Geld gebraucht wird und dass so viel wie möglich kostenlos bleibt.

**Wichtig:** Mit dem Zonenbeschluss aus Nr. 48 ist die Zweistufigkeit erstmals **rechnerisch tragfähig** geworden. Vorher gab es zu wenige verkaufbare Funktionen für zwei sinnvolle Stufen; Inkognito und die Travel-Version sind zwei starke, unstrittige Kandidaten, die der Abwägung aus Nr. 48 standhalten. Der Zuschnitt der Stufen wird in A-52 neu gerechnet.

**Was daraus neu offen ist → Nr. 78:** Werbung. Der Vorschlag „Werbefreiheit als billigere Stufe" setzt voraus, dass es Werbung gibt. Das widerspricht Handbuch A. Drei Wege liegen im Chat zur Entscheidung.

### Nr. 50 — Jahresabo vorausgewählt

> „Jahresabo vorauswählen finde ich gut, die anderen Optionen müssen aber natürlich auswählbar und präsent sein."

**Beschlossen:** Das Jahresabo ist vorausgewählt. Jede andere Laufzeit steht gleich groß, gleich lesbar und mit **Gesamtpreis und Verlängerungsregel** daneben. Kein Unterschied in Schriftgröße, Farbe oder Position, der die Vorauswahl verstärkt.

**Damit ist Handbuch B erfüllt und Prinzip 1 gewahrt** — die Grenze zum dunklen Muster verläuft nicht bei der Vorauswahl, sondern bei ungleicher Darstellung.

---

## 3 · Verifizierung und Identität

### Nr. 64 — Verifizierung beim ersten Schreiben oder Buchen

> „Man kann ohne Verifikation die App öffnen und das Tutorial durchlaufen, aber sobald man jemandem schreiben, was buchen will oder so, muss man sich verifizieren, dann kommt das Erklärfenster mit der Bitte um Verifizierung, die dann so schnell und mit so wenigen Klicks wie möglich gehen soll, aber natürlich DSGVO-konform."

**Beschlossen:** Drei Zustände statt zwei.

| Zustand | Was geht | Was nicht geht |
|---|---|---|
| **Gast** | App öffnen, Tutorial, Umsehen | schreiben, buchen, Termine zusagen |
| **Geprüft** | alles Übrige | — |
| *(offen)* **Identifiziert** | der private explizite Bereich | — |

**Folge für drei Funktionen, die bisher ins Leere liefen:** F09 (Erklärbildschirm für Unverifizierte) ist damit eindeutig belegt — er erscheint genau an der Schwelle. F08 („Nur Verifizierte zulassen") und F57 (Grenze für neue unverifizierte Konten) bleiben **nur dann sinnvoll, wenn es die dritte Stufe gibt** — also wenn „verifiziert" mehr heißt als „Alter geprüft". Das hängt an Nr. 40 und wird dort mitentschieden.

**Auslegung:** „Buchen" umfasst nach diesem Beschluss jede verbindliche Handlung gegenüber Dritten — Ticket, Zusage zu einem Termin, Eintrag in eine Gästeliste.

### Nr. 40 und Nr. 51 — Altersprüfung: erneute Rechtsprüfung beauftragt

> „Da müssen wir eh noch prüfen nach DSGVO usw., wie es rechtlich sicher ist, ob die Schätzungen reichen, ob wir Personalausweise brauchen, ob Bilder reichen, die eine KI auswertet wie bei vielen anderen Apps. Prüfe das gerne auch nochmal erneut und sage, wie wir vorzugehen haben."

**Beauftragt (A-53):** Neuerhebung des Stands zu Altersverifikation in Deutschland — KJM-Raster, Altersschätzung per Bild, eID, die Einordnung der Selfie-Schätzung nach der KI-Verordnung, und was andere Anbieter tatsächlich einsetzen. Danach eine begründete Empfehlung mit Kostenvergleich.

**Bis dahin bleibt Nr. 51 offen:** Der festgelegte Satz „Ein Gericht kann es über unseren Prüfpartner" stimmt nur bei echter Identifizierung. Der Satz wird **nicht** verwendet, bevor die Architektur feststeht.

---

## 4 · Notfall, Konto und Kontakt

### Nr. 46 — Benachrichtigung über den selbst gewählten Weg

> „Es muss über Mail laufen, alles andere geht schlicht nicht, SMS wäre auch eine Option. Würde sagen, die können sich mit Nummer oder Mail anmelden, und der entsprechende Weg, den sie wählen, wird dann hinterlegt und im Notfall dann die Benachrichtigung darauf gesendet."

**Beschlossen:** Beim Anlegen wählt die Person **E-Mail oder Mobilnummer** als Anmeldeweg. Genau dieser Weg wird hinterlegt und im Ernstfall für die Benachrichtigung nach Art. 34 DSGVO verwendet.

**Was dabei zwingend dazugehört** — sonst entsteht genau der Schaden, den Nr. 46 vermeiden wollte:

1. Der Text der Benachrichtigung nennt **weder den Produktnamen noch den Anlass im Betreff**. Der Betreff ist neutral; der Inhalt verweist auf eine Seite, die erst nach Anmeldung etwas sagt.
2. Beim Anlegen steht ein Satz dazu: *„An diese Adresse melden wir uns nur, wenn es sein muss. Wähle etwas, das nur du liest."*
3. Die Mobilnummer als Anmeldeweg erzeugt eine neue Datenart (D16) und berührt AF-04 — den mit Schlüssel gebildeten Prüfwert. Beides geht in die Verarbeitungsübersicht.

**Neu offen → Nr. 79:** Die Mobilnummer war bisher **kein** Bestandteil des Konzepts; Handbuch A führt bewusst weder Telefonnummer noch Klarnamen. Der Beschluss ändert das. Die Folgen (Wiedererkennung gesperrter Konten, SMS-Anbieter, Kosten, Datensparsamkeit) werden in A-54 aufgearbeitet.

### Nr. 69 — Wiederherstellung: Code als erste Wahl

> „Wenn wir nichts haben, ist super, aber eine Sache müssen wir ja allein wegen der DSGVO-Benachrichtigung haben. Wäre für einen Wiederherstellungscode, aber gib mir dazu nochmal andere Ideen."

**Beschlossen als Richtung:** Wiederherstellungscode. Die Alternativen liegen im Chat zur Auswahl; die Entscheidung wird hier nachgetragen.

**Wichtig:** Mit Nr. 46 ist der zweite Weg ohnehin da. Wer sich mit Mobilnummer anmeldet, hat die Mail als zweiten Faktor frei — und umgekehrt. Das entschärft Nr. 69 erheblich.

### Kontaktservice — Fristen und Eingänge

> „Wäre dafür, 48, maximal 72 Stunden als Frist zu benennen, und verschiedene Mailadressen wären wichtig. Missbrauch ist natürlich immer das, was als Erstes angeschaut wird, und Hilfe kann auch selten mal länger dauern. Datenschutz aber natürlich wichtig, und da gilt die entsprechende gesetzliche Antwortfrist."

**Beschlossen:**

| Eingang | Zugesagte Frist | Rang |
|---|---|---|
| **Missbrauch und Verstöße** | 48 Stunden, in Ausnahmen 72 | **immer zuerst** |
| **Gefahr für Leib und Leben** | unverzüglich, ohne Frist gerechnet | vor allem anderen |
| **Hilfe und Konto** | 48 Stunden als Ziel, 72 als zugesagte Obergrenze | nachrangig |
| **Datenschutz und Betroffenenrechte** | **ein Monat** nach Art. 12 Abs. 3 DSGVO, verlängerbar um zwei | gesetzlich |

**Wichtig für die AGB:** Eine genannte Frist wird mit der Aufnahme in die Bedingungen **einklagbar**. Deshalb wird „48 Stunden" als Ziel und „72 Stunden" als Zusage formuliert, nicht umgekehrt. Fristen laufen an Werktagen; die Gefahrenmeldung nicht.

**Umsetzung:** vier getrennte Adressen, ein Ticketsystem dahinter, jede Meldung erzeugt eine Fallnummer, die der meldenden Person sofort angezeigt wird. Ausgearbeitet in A-59.

---

## 5 · Veranstaltungen und Orte

### Nr. 74 und Nr. 65 — Veranstaltungen für alle, Erstellung nur verifiziert

> „Es sollte überall Veranstaltungen geben dürfen, auch von Community-Gruppen, beispielsweise für Stammtische oder Hauspartys. Professionell aber natürlich auch gerne. Zur Erstellung braucht man aber ein verifiziertes Konto. […] Am Anfang wird das denke ich erstmal noch vollkommen über uns laufen, dass wir Korrektur lesen, bevor wir die freischalten, die wir später dann erst freischalten mit den professionellen Konten, damit die dann selber schalten und schreiben können."

**Beschlossen:**

1. **Wer darf Veranstaltungen anlegen:** jedes verifizierte Konto — Community-Gruppen (Stammtische, Hauspartys) ebenso wie professionelle Veranstalter. Die Öffnung ist ausdrücklich nicht auf gewerbliche Orte beschränkt.
2. **Freigabe:** In der Anfangszeit liest ein Mensch **jede** Veranstaltung, jedes Inserat und jeden Ort gegen, bevor sie sichtbar werden. Erst später bekommen professionelle Konten das Recht, ohne Vorprüfung zu veröffentlichen.
3. **Ertrag:** Der Strang muss Geld einbringen — über Kontingente, Prozentanteile oder einmalige Zuschüsse. Dazu eine **freiwillige Zuschussfunktion**.
4. **Anspruch an das Modell:** für Veranstalter günstig und attraktiv, für uns trotzdem rechnend.

**Zwei Dinge, die dieser Beschluss sofort auslöst:**

- **Hauspartys sind ein eigener Fall.** Eine Privatadresse in einer öffentlichen Veranstaltungsliste ist ein Sicherheitsproblem und ein Datenschutzproblem zugleich. Vorschlag: private Veranstaltungen zeigen **nur die Umgebung**, die genaue Adresse geht erst nach Zusage an bestätigte Gäste, und der Veranstalter entscheidet über jede Zusage einzeln. Das wird in A-55 ausgearbeitet und erzeugt voraussichtlich eine eigene Rechtsfrage (V10).
- **Der Ertrag darf nicht über Sichtbarkeit laufen.** Prinzip 5 schließt gekaufte Aufmerksamkeit aus. Ein Erlösmodell über **Vermittlung** (Anteil am Ticket), **Werkzeug** (Veranstalterkonto mit Funktionen) und **freiwilligen Zuschuss** berührt Prinzip 5 nicht; ein Modell über Platzierung oder Hervorhebung schon. Das ist die Trennlinie, an der A-55 entlangbaut.

**Damit ist Nr. 65 beantwortet:** Bezahlte Hervorhebung von Orten **entfällt**; der Erlös kommt aus Vermittlung und Werkzeug. Handbuch B (Hervorhebung, Vorabplatzierung, Ereignis-Hervorhebung ab 8.000 MAU) ist an dieser Stelle **überholt**.

### Nr. 55 — Ampel für Termine mit sexuellem Kern

> „Frage 30 mit der Ampel finde ich für die Veranstaltungen sehr geil und smart."

**Beschlossen:** Die Ampel gilt. Grün: öffentlich. Gelb: nur nüchtern genannt (Orte mit Cruising- oder Fetischbezug, Saunen). Rot: nie im öffentlichen Kanal (Termine, deren Kern sexuell ist). Sie gilt für den Kanal **und** künftig für die Sichtbarkeit von Veranstaltungen außerhalb der App.

---

## 6 · Gründung, Sitz und Zeitachse

### Nr. 20 — Stammkapital: je 12.500 €

> „Wir würden jeder 12.500 Euro einzahlen, eine GmbH wäre auch möglich, wenn es finanziell passt, UG wäre auch eine Option."

**Beschlossen als Ziel:** **GmbH mit 25.000 € Stammkapital, voll eingezahlt**, je 12.500 € pro Gesellschafter. **Rückfallebene** bei angespannter Lage: UG mit späterer Umwandlung.

**Was das ausschließt:** das Modell „25.000 € mit nur 12.500 € eingezahlt". Dort haftet die Differenz mit dem Privatvermögen; bei voller Einzahlung entfällt das. Das ist die sicherere Variante und kostet dasselbe Geld — nur früher.

### Nr. 21, Nr. 33 und Nr. 37 — Sitz und Wohnsitz

> „Wird vermutlich Niedersachsen werden, steht aber noch nicht fest. Wenn die Förderlage es so sagt, können wir uns auch NRW vorstellen." · „Ziehen dann zusammen dorthin, wo der Sitz liegt."

**Beschlossen:** **Beide Gründer ziehen an den Sitz der Gesellschaft.** Damit ist Nr. 33 (Wohnsitz Nicolas Greulich) als eigene Frage erledigt — sie geht in der Sitzfrage auf.

**Richtung:** Niedersachsen, mit NRW als ernsthafter Alternative, wenn die Förderlage dafür spricht. Hessen ist damit praktisch aus dem Rennen. Endgültig 2028, nach Prüfung der dann geltenden Programme.

**Was das an Gewicht verschiebt:** Weil beide ohnehin umziehen, verliert das Gründungsstipendium Niedersachsen seinen Ausschlussgrund — und NRW gewinnt, weil dort der Startmarkt Köln liegt, dazu OUT OF THE BOX.NRW (50.000 €) und NUK. **Der Sitz folgt jetzt der Förderlage, nicht dem Wohnort.**

### Nr. 4 — Gesellschaftsvertrag: 50/50, Rest offen

> „50/50 starten wir, werden eh noch ein paar Prozent an Investoren verlieren. Beschreibe die anderen Punkte und Ideen, die du hast und hattest, nochmal, damit ich dann entscheiden kann."

**Beschlossen:** Start bei **50/50**. Die übrigen neun Eckpunkte liegen im Chat zur Entscheidung vor und werden hier nachgetragen.

### Nr. 34 und Nr. 38 — Finanzierung: jetzt planen, später rechnen

> „Wir machen und planen jetzt erstmal alles und überschlagen dann immer neu. […] Die App soll nicht kaputtgespart werden. Es geht um eine qualitative Verbesserung zu den aktuellen Riesen, da dürfen wir nicht sparen, und auch eine 200k-Finanzierung kriegen wir dann schon irgendwie hin. Das Aktuellhalten der Schätzungen bleibt aber wichtig, damit wir den Überblick behalten."

**Beschlossen:** Kein Zuschnitt des Produkts auf einen Kapitalrahmen. Der Kapitalbedarf wird **fortgeschrieben, nicht gedeckelt**. Weg A oder Weg B (Nr. 34) bleibt bis 2028 offen; dann wird nach der dann geltenden Förder- und Kreditlage entschieden.

**Was daraus folgt:** Das Finanzmodell bekommt eine **Gesamtsicht**, die Firmenbedarf und Lebenshaltung beider Gründer zusammen ausweist — bisher steht dort „nicht beziffert". Die Zahl, gegen die geplant wird, ist damit nicht 107.349 €, sondern rund **170.000 €** nach heutigem Stand. Ausgearbeitet in A-52.

### Nr. 45 — T0: Pride-Saison, eher ein Jahr später

> „Hängt am Plan dann, könnte sein, wenn alles perfekt läuft, gehe aber von einem Jahr später aus. Sollten aber die Pride- und CSD-Saison nutzen, meiner Meinung nach, für den ersten Start und mit der Teilnahme eines Wagens sowie Ständen."

**Beschlossen:** Der Start liegt in der **Pride- und CSD-Saison** (Mai bis August), mit eigenem Wagen und Ständen. Als Planungsgrundlage gilt **nicht** der Bestfall Sommer 2028, sondern **ein Jahr später** — der Bestfall bleibt möglich, ist aber nicht die Zahl, gegen die geplant wird.

**Folge:** Alle Termine aus dem Block A4 (Kanalstart, Tor 2, Terminservice, Redaktionsplan) verschieben sich entsprechend und werden als **Spanne** statt als Datum geführt. Die zwei Uhren (Kanalmonate, Roadmapmonate) bleiben, der Nullpunkt wird beweglich.

**Neu offen → Nr. 80:** Wagen und Stände auf einem CSD sind ein eigener Kostenblock, der in keinem Dokument steht.

---

## 7 · Kanäle, Mails und Warteliste

### Nr. 53 — Monatlicher Newsletter

**Beschlossen:** Der Standard ist **monatlich**. Zusätzliche Mails bleiben ausdrücklich vorbehalten für Ankündigungen. Der Einwilligungstext und die Bestätigungsmail werden so formuliert, dass sie das abdecken — ohne „höchstens einmal im Monat" zu versprechen und dann öfter zu schreiben.

### Nr. 56 — Beta-Plätze über Postleitzahl, mit drei Einladungscodes

> „Wäre für PLZ-Eintragung samt Mail. Wenn man genommen wird, kriegt man Codes (3 insgesamt), die man verteilen kann und anderen dann auch Zutritt geben."

**Beschlossen:** Vergabe nach **Postleitzahl im Startgebiet**, Eintragung mit Mailadresse. Wer aufgenommen wird, erhält **drei Einladungscodes** zum Weitergeben.

**Warum das gut ist und wo es kippt:** Drei Codes je Person bedeuten im Extremfall eine Vervierfachung der Testgruppe — genau das, was Handbuch B mit „ihr könnt nur ein Viertel bedienen" ausschließen wollte. Die Codes brauchen deshalb ein Kontingent, das getrennt von der Warteliste gesteuert wird, und dürfen die Postleitzahlgrenze nicht aushebeln. Ausgearbeitet in A-56.

### Nr. 59 — Warteliste darf die Kampagnenmail bekommen

> „Ja, darf sie, ändere das in den Bestimmungen, wollen ja darauf aufmerksam machen und uns finanzieren."

**Beschlossen:** Die Einwilligung der Warteliste wird **von vornherein** so gefasst, dass sie die Information über eine Crowdfunding-Kampagne deckt. Das ist nur möglich, **weil die Warteliste noch nicht live ist** — eine bereits erteilte Einwilligung ließe sich nicht nachträglich erweitern. Der Text wird in A-57 neu gefasst und bleibt dem Anwalt vorgelegt (K8, R6, U1).

### Nr. 63 — Maildienst: weitere Anbieter prüfen

**Beauftragt (A-58):** Proton und weitere Anbieter gegen dieselben Muss-Kriterien prüfen wie die sieben bisherigen; zusätzlich der Eigenbetrieb (listmonk auf eigenem Server) als ernsthafte Option durchrechnen.

### Nr. 5 — „Cruizy" bleibt vorerst überall

> „Baue erstmal überall Cruizy ein, und wenn sich was ändert, ändern wir das später. Wird erstmal provisorischer Platzhalter, der ja sogar vielleicht bleibt."

**Beschlossen:** Der Name wird in allen Texten, Bildschirmen und Dokumenten **ausgeschrieben** statt als Platzhalter geführt. Die Markenlage (Vorbenutzung cruizy.eu) bleibt offen; Nr. 5 bleibt offen, aber der Arbeitsstand ist eindeutig.

**Dazu:** Domains und Handles werden **jetzt noch nicht** gesichert.

### Nr. 62 — Wettbewerbe: vorerst keine Teilnahme

> „JUGEND GRÜNDET wird vermutlich eh nichts, weil wir wie gesagt jetzt erstmal alles machen wollen ohne externe, nur zusammen und mit dir, und dann nach der Schule (Sommer 28) weitermachen, professionell. Würden dann nach neuen und frischen Fördertöpfen schauen."

**Beschlossen:** Keine Wettbewerbsteilnahme in dieser Phase. Damit entfällt der Stichtag 05.01.2027 und mit ihm der Konflikt zwischen Veröffentlichung und Interviewende. Die Unterlagen bleiben liegen und sind wiederverwendbar.

**Was dabei verloren geht, offen benannt:** STARTUP TEENS hat ein Altersfenster, das sich schließt — die Runde mit Abgabe im Mai 2027 war die einzige, in der beide gemeinsam hätten antreten können. Bis zu 10.000 € je Kategorie. Das ist eine bewusste Entscheidung und wird nicht schöngeredet.

---

## 8 · Technik und Recht

### Nr. 58 — Grundsatz: DSGVO übertreffen, keine US-Standorte

> „Prüfe, ob es entsprechende DSGVO-konforme Alternativen gibt, falls nicht, müssen wir die Kröte schlucken und schauen, dass es so konform wie möglich wird. Schreibe das auch ins Handbuch, dass wir uns an die besten DSGVO halten und diese übertreffen wollen und auf die USA als Standorte verzichten möchten, nur wenn alles andere nicht möglich ist, behalten wir uns vor, darauf auszuweichen, aber in so seltenen Fällen wie möglich."

**Beschlossener Grundsatz, wörtlich als Regel:**

> **G-01 · Datenschutz als Maßstab.** Cruizy hält nicht das gesetzliche Mindestmaß ein, sondern strebt an, es zu übertreffen. Auftragsverarbeiter mit Sitz oder Datenhaltung in den Vereinigten Staaten werden nicht eingesetzt. Lässt sich eine notwendige Funktion nachweislich nicht anders erbringen, ist ein Ausweichen zulässig — als begründete Einzelentscheidung, dokumentiert, befristet und mit der Verpflichtung, sie bei erster Gelegenheit zurückzunehmen.

**Wo dieser Grundsatz steht:** Er gehört nach dem Wunsch der Gründer ins Handbuch. Die Projektregel sagt, dass die Handbücher **nicht bearbeitet** werden; deshalb steht er bis auf Weiteres hier und in `00-grundlagen/grundsatzbeschluesse.md`, auf das alle anderen Dokumente verweisen. Die Frage, ob das Handbuch selbst geändert werden soll, liegt im Chat.

**Beauftragt (A-53):** Prüfung DSGVO-konformer Alternativen zu Sentry und RevenueCat.

### Nr. 71 — Store-Richtlinien und unkenntlich gemachte Bilder

> „Prüfe du die Richtlinien, Web wäre egal, für die Stores schauen wir, dass wir sexuelle oder Nacktheit enthaltende Bilder in den Profilen blurren (wie ROMEO es beispielsweise macht) und die dann nur im Web ansehbar sind. Versenden von Bildern und Videos ist deren private Sache in den Chats und fällt ja nicht unter die Richtlinien."

**Beschlossen als Richtung:** In den nativen Apps werden Profilbilder mit Nacktheit oder sexuellem Inhalt **unkenntlich dargestellt**; ansehbar sind sie dort nicht. Die Web-Fassung zeigt sie. Private Chatinhalte gelten als Sache der Beteiligten.

**Ein Punkt, der vor dem Bau geklärt sein muss:** Die Annahme, Chatinhalte fielen nicht unter die Store-Richtlinien, trifft in dieser Form nicht zu. Beide Stores verlangen für nutzergenerierte Inhalte — **auch in privaten Nachrichten** — ein Meldeverfahren, eine Sperrmöglichkeit und eine Moderation. Das Produkt hat all das bereits (F61, F62, Moderations-Backend); der Satz „fällt nicht unter die Richtlinien" ist trotzdem zu korrigieren, damit später niemand darauf baut. **Beauftragt (A-53):** Erhebung der aktuellen Fassungen beider Richtlinien.

---

## 9 · Was jetzt gebaut und geschrieben werden darf

| | Was | Aufgabe |
|---|---|---|
| 1 | Interviewfragen und Wartelisten-Umfrage ausformulieren — **ausdrücklich freigegeben** | A-19 vorbereitend |
| 2 | Kontaktservice in alle Konzepte einbauen | A-59 |
| 3 | Zwei-Plattform-Bauplan (Web und nativ) | A-51 |
| 4 | Finanzmodell neu rechnen (Prüfkosten, zwei Plattformen, Lebenshaltung, Veranstaltungserlöse) | A-52 |
| 5 | Rechts- und Marktprüfung: Altersverifikation, Store-Richtlinien, US-Alternativen | A-53 |
| 6 | Mobilnummer als Anmeldeweg einarbeiten | A-54 |
| 7 | Veranstaltungs- und Erlöskonzept mit Community-Veranstaltungen | A-55 |
| 8 | Beta-Vergabe mit Codes | A-56 |
| 9 | Wartelisten-Einwilligung neu fassen | A-57 |
| 10 | Maildienst: Proton und Eigenbetrieb prüfen | A-58 |

---

## 10 · Was offen bleibt

**Im Chat zur Entscheidung vorgelegt:** Nr. 68 (die 90 Festlegungen), Nr. 66 (Check-in ohne Rückmeldung), Nr. 33 alt/Nr. 60 (Crowdfunding-Datenmodell), Nr. 15 und Nr. 16 (die zwei Zusagen an sich selbst), die neun Eckpunkte des Gesellschaftsvertrags, Nr. 77 (Ersatzpunkt und eigene Sicht), Nr. 78 (Werbung), Nr. 69 (Wiederherstellung), Nr. 81 (Handbuchänderung).

**Nicht entschieden und nicht gefragt:** alles, was an die Interviews gebunden ist (Nr. 5 endgültig, Nr. 67 Feinschnitt), und alles, was an den Anwalt geht.

---

## Quellen

- Antwort Henry Luca Kurz, 19.09.2026, im Projektchat. Zitate gekürzt, Rechtschreibung angeglichen, Inhalt unverändert.
- `70-entwicklung-ab-monat-4/entwicklungsmodelle.md` (A-46) — Kostenrechnung der vier Baumodelle
- `40-finanzen-foerderung/preise-und-bezahlstufen.md` (A-48) — Regeln R1 bis R6, Kandidaten K1 bis K11
- `35-veranstaltungen/veranstaltungskonzept.md` (A-47) — Stufenlogik und Rechtsfragen V1 bis V9
- `50-produkt-prototyp/produktspezifikation.md` — F60, FV-70, AF-01 bis AF-12
- `01-steuerung/offene-entscheidungen.md` — Nummern 1 bis 76
