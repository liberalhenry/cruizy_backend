# Wartelisten-Umfrage — fünf Fragen und Auswertungsraster

> **ENTWURF — nicht veröffentlichen.** Aufgabe A-28 · erstellt am 16.09.2026 · Rolle: Marktforscher · Weg, Zeitpunkt und Einwilligung der Umfrage sind offen (**Nr. 61**). Die Texte für Teilnehmer sind Entwürfe; der Anwalt liest die Datenschutz-Kurzform und die Einwilligung mit.

**Grundlage:** Handbuch B, Teil VIII (Abschnitt 13, vier Auflagen; Abschnitt 14, Feedbackwege und „Fragt nach der Vergangenheit, nicht nach der Zukunft“) · Handbuch A (Tonfall, Streichliste) · `20-interviews-feedback/interviewleitfaden.docx` und `protokoll-vorlage-anonym.docx` · `30-marketing-kanaele/landingpage-copy-warteliste.md` (A-02) · `10-recht-gruendung/datenschutzhinweis-warteliste-ENTWURF.md` (A-03) · `01-steuerung/wettbewerbsbeobachtung-log.md` (R-01) · `01-steuerung/tor-1-vorlage.xlsx` (A-22)
**Arbeitsdatei:** `wartelisten-umfrage-auswertung.xlsx` im selben Ordner — Rücklauf, sechs Auswertungstabellen, Fehlerspannen (296 Formeln, neu berechnet ohne Fehler, mit Testwerten geprüft). Sie nimmt nur Summen auf, nie einzelne Antworten.
**Belegt** per Websuche, Abruf am 16.09.2026: Einordnung von Befragungen per E-Mail (BGH), Lesegeschwindigkeit (Brysbaert 2019). Rechtliche Einordnungen sind Fragen an den Anwalt.

---

## Auf einen Blick

- **Fünf Fragen:** Postleitzahl, Altersgruppe, genutzte Apps, eine Verhaltensfrage zur Vergangenheit, ein Freitext. Jede Frage ist freiwillig und hat eine benannte Auswertungsabsicht.
- **Unter 60 Sekunden:** 125 Wörter zu lesen und sechs Eingaben — geschätzt **49,5 bis 59,7 Sekunden** ohne Freitext (Abschnitt 3) — knapp, aber unter der Grenze. Der Freitext ist freiwillig; ob die Minute mit ihm hält, zeigt erst ein Stoppuhrtest.
- **Anonym gebaut:** Antworten ohne E-Mail- und IP-Adresse, getrennt von der Warteliste gespeichert, nur als Summen ausgewertet.
- **Sechs Befunde** (Abschnitt 6):
  1. **Eine Umfrage per Mail ist vermutlich Werbung.** Der BGH ordnet eine Kundenzufriedenheitsbefragung per E-Mail als (Direkt-)Werbung ein. A-02 plant die Umfrage als eigene Mail an die Warteliste — deren Einwilligung deckt das eher nicht → **Nr. 61**. Vorschlag: ein freiwilliger Link auf der Seite nach dem Bestätigungsklick, dort, wo A-02 einen zweiten Weg ausdrücklich erlaubt.
  2. **Die Umfrage kann die Kernthese nicht prüfen.** Wer sich auf einer Seite einträgt, die von Datenschutz spricht, nennt Datenschutz häufiger. Ob er ungefragt aufkommt, zeigen nur die anonymen Interviews.
  3. **Der Interviewleitfaden verteilte Wartelisten-Codes in V1** — die Warteliste geht aber erst in V4 live (Beschluss vom 26.07.2026). Der Leitfaden ist angepasst.
  4. **Handbuch Bs Beta-Gruppe „aus den Interviewteilnehmern“ lässt sich so nicht bilden:** Die Gespräche werden anonym geführt und liegen rund zwei Jahre vor der Testphase → **Nr. 56** ergänzt.
  5. **Gleiche Altersgruppen wie im Protokollbogen** — sonst lassen sich Umfrage und Gespräche nicht vergleichen.
  6. **Das Zeitfenster aus Handbuch B passt nur in Roadmapmonaten gelesen.** „Monat 4–9“ liegt dann zwischen Oktober 2028 und März 2029 — und damit vor dem Start in Köln, nach dem die Kölner Eintragungen gelöscht werden.

---

## 1 · Rahmen

### 1.1 Weg

| | Weg A — Link nach dem Bestätigungsklick (Vorschlag) | Weg B — eigene Mail an bestätigte Eintragungen (Plan in A-02) |
|---|---|---|
| Wer wird gefragt | alle, die sich neu eintragen und bestätigen | alle bestätigten Eintragungen, auch die älteren |
| Einwilligung | nur die der Umfrage selbst | zusätzlich eine für die Mail — der BGH ordnet Befragungen per E-Mail als Werbung ein |
| Seite und Messung | A-02 erlaubt auf der Seite nach dem Bestätigungsklick einen zweiten Weg: „die Handlung ist abgeschlossen“ | keine Wirkung auf die Wartelistenseite |
| Mailtakt | unverändert | zählt zum monatlichen Takt (**Nr. 53**, entschieden 19.09.2026: monatlich, Ankündigungen vorbehalten) — und konkurriert mit Ständen der Dinge und einer möglichen Kampagnenmail (Nr. 59) |
| Zeitraum | ab Freischaltung der Warteliste (Mai 2028) | nach Handbuch B „Monat 4–9“ = Oktober 2028 bis März 2029 |

Weg A braucht auf der Bestätigungsseite (A9/B9 in A-02) nur einen Satz und einen Link, zum Beispiel: *„Magst du uns noch fünf kurze Fragen beantworten? [Zur Umfrage]“* — ohne Ausrufezeichen, ohne Verlosung.

### 1.2 Anonymität und Werkzeug

- **Keine Verknüpfung** mit der Wartelisten-Eintragung: kein Zusatzparameter im Link, keine E-Mail-Adresse, keine IP-Adresse, keine Cookies außer technisch notwendigen.
- **Zählung ohne Tracking:** serverseitig nur zwei Summen je Woche — Aufrufe der Umfrageseite und abgeschickte Antworten.
- **Werkzeug:** dieselben Regeln wie für die Wartelistenseite (A-02, Abschnitt 3.3): EU-Sitz, kein Tracking, kein US-Dienstleister. Die Auswahl ist offen (Nr. 61).
- **Mehrfachteilnahme** lässt sich ohne Kennung nicht verhindern. Das wird hingenommen und in der Auswertung genannt.
- **Freitexte** werden nach der Codierung gelöscht (Frist: Nr. 61). Wörtliche Zitate werden nie veröffentlicht, wenn sie Personen, Orte oder Profile erkennbar machen.

---

## 2 · Der Fragebogen

### 2.1 Einleitung

> Fünf kurze Fragen, etwa eine Minute, alles freiwillig.

### 2.2 Datenschutz in Kürze

> Gespeichert ohne E-Mail- und IP-Adresse, getrennt von der Warteliste, ausgewertet nur als Summen. Weil die Teilnahme auf deine Orientierung schließen lässt, fragen wir ausdrücklich. Verantwortlich: Henry Luca Kurz, Nicolas Greulich. [Mehr zum Datenschutz]
>
> ☐ Ich bin einverstanden, dass meine Antworten so gespeichert und ausgewertet werden.

*Erste Ebene eines zweistufigen Hinweises; die zweite Ebene ist der vollständige Datenschutzhinweis aus A-03, der dafür einen Abschnitt zur Umfrage braucht (Anwaltsfrage U3). Die ausdrückliche Einwilligung folgt derselben Logik wie A-03: Schon die Eintragung lässt einen Rückschluss auf die sexuelle Orientierung zu (Art. 9 Abs. 2 lit. a DSGVO). Nicht vorangekreuzt.*

### 2.3 Die fünf Fragen

#### F1 · Deine Postleitzahl

| | |
|---|---|
| Wortlaut | **Deine Postleitzahl** |
| Hilfetext | Dieselbe wie bei deiner Eintragung. |
| Antworttyp | Zahl, genau fünf Ziffern, freiwillig |
| Warum diese Frage | Handbuch B: „Die Postleitzahl ist die wichtigste Angabe, weil sie Dichte misst.“ Die Warteliste kennt die Postleitzahl schon — aber die Antworten werden bewusst nicht mit der Eintragung verknüpft, also muss sie hier noch einmal stehen. |
| Auswertungsabsicht | Zuordnung zu Startstadt, 3-km-Umkreis und übrigen Gebieten wie in `01-steuerung/tor-1-vorlage.xlsx`; Grundlage für die Tabellen B und F; Abgleich mit der Verteilung der ganzen Warteliste (Tabelle F). |

#### F2 · Wie alt bist du?

| | |
|---|---|
| Wortlaut | **Wie alt bist du?** |
| Antworttyp | Einfachauswahl, freiwillig |
| Optionen | 18–25 · 26–35 · 36–50 · über 50 · keine Angabe |
| Warum diese Frage | Handbuch A nennt als Zielgruppe 18 bis 60. Die Gruppen sind dieselben wie im anonymen Protokollbogen der Interviews — nur so lassen sich Umfrage und Gespräche vergleichen. Eine Gruppe unter 18 gibt es nicht: Wer jünger ist, gehört nicht auf die Liste. |
| Auswertungsabsicht | Altersaufbau je Gebiet (Tabelle B), App-Nutzung je Altersgruppe (Tabelle D), Vergleich mit der Altersmischung der Interviews. |

#### F3 · Welche Dating- oder Cruising-Apps nutzt du?

| | |
|---|---|
| Wortlaut | **Welche Dating- oder Cruising-Apps nutzt du?** |
| Hilfetext | Mehrere möglich. |
| Antworttyp | Mehrfachauswahl, freiwillig |
| Optionen | Grindr · ROMEO · SCRUFF · Hornet · Sniffies · andere · keine |
| Warum diese Frage | Handbuch B nennt „welche Apps genutzt“ als Pflichtbestandteil. Die Liste folgt den Anbietern, die die Wettbewerbsbeobachtung (R-01) verfolgt; vor dem Start abgleichen. „keine“ ist wichtig: Der Interviewleitfaden sucht ausdrücklich auch Leute, die aktuell keine App nutzen. |
| Auswertungsabsicht | Marktbild der Liste (Mehrfachnutzung, Anteil ohne App); mit F4 die Frage, wie wechselfreudig die Nutzer einzelner Apps sind (Tabelle C). |

#### F4 · Hast du in den letzten zwölf Monaten eine solche App gelöscht oder ein Abo gekündigt?

| | |
|---|---|
| Wortlaut | **Hast du in den letzten zwölf Monaten eine solche App gelöscht oder ein Abo gekündigt?** |
| Antworttyp | Einfachauswahl, freiwillig |
| Optionen | App gelöscht · Abo gekündigt · beides · nein · weiß nicht mehr |
| Warum diese Frage | Die Verhaltensfrage zur Vergangenheit. Handbuch B: „Fragt nach der Vergangenheit, nicht nach der Zukunft.“ Wechselbereitschaft wird nicht erfragt, sondern aus diesem Verhalten abgeleitet. Die Kündigung zeigt zusätzlich, wer schon einmal gezahlt hat. |
| Auswertungsabsicht | Tabelle C: Anteil mit Löschung oder Kündigung je genutzter App. Vorsicht: Die Frage gilt für irgendeine App, nicht für die in F3 genannte — Tabelle C zeigt also, wie wechselfreudig die Nutzer einer App sind, nicht, wie oft genau diese App gelöscht wird. |

#### F5 · Was hat dich zuletzt an einer dieser Apps geärgert?

| | |
|---|---|
| Wortlaut | **Was hat dich zuletzt an einer dieser Apps geärgert?** |
| Hilfetext | Ein Satz reicht. Keine Namen. |
| Antworttyp | Freitext, höchstens 280 Zeichen, freiwillig |
| Warum diese Frage | Die erste Interviewfrage in kurzer Form („Was hat dich zuletzt an deiner Haupt-App geärgert?“). So lassen sich die Antworten mit demselben Codebuch auswerten wie die Gespräche. |
| Auswertungsabsicht | Codierung nach dem Codebuch in Abschnitt 4.3, Häufigkeiten je Altersgruppe (Tabelle E). **Kein Test der Kernthese** — dazu unten Befund 2. |

Schaltfläche: **Abschicken** — aktiv, sobald die Einwilligung gesetzt ist; alle Fragen dürfen leer bleiben.

### 2.4 Dankeseite

> ## Danke
> Das war es schon. Deine Antworten fließen gesammelt in unsere Planung ein.
>
> [Zur Startseite]

*Keine Teilen-Aufforderung, kein zweiter Aufruf, keine Verlosung (Handbuch B, Teil VIII, Auflage 4).*

---

## 3 · Zeitbedarf — die Abnahme „unter 60 Sekunden“

| Schritt | Annahme | Sekunden |
|---|---|---|
| Lesen: Einleitung, Datenschutz, Einwilligung, Fragen, Hilfetexte, Optionen, Schaltfläche | 125 Wörter bei 180 bis 238 Wörtern je Minute | 31,5–41,7 |
| Postleitzahl tippen | fünf Ziffern | 5 |
| Altersgruppe, Verhaltensfrage | je ein Tipp | 2 + 3 |
| Apps | ein bis drei Tipps | 5 |
| Einwilligung, Abschicken | zwei Tipps | 3 |
| **Summe ohne Freitext** | | **49,5–59,7** |

Die obere Lesegeschwindigkeit ist der Mittelwert für stilles Lesen englischer Sachtexte (Brysbaert 2019: 238 Wörter je Minute). Deutsche Wörter sind im Schnitt länger, und auf dem Telefon liest man langsamer — deshalb rechnet die untere Grenze vorsichtig mit 180 Wörtern je Minute. Die Tippzeiten sind Annahmen dieser Vorlage. **Vor dem Start misst ein Stoppuhrtest mit fünf Personen aus der Zielgruppe nach — einmal ohne, einmal mit einem Satz Freitext.**

---

## 4 · Auswertungsraster

### 4.1 Rücklauf

| Größe | Rechnung | Wozu |
|---|---|---|
| Aufrufe der Umfrageseite | serverseitige Summe je Woche | Nenner der Abbruchquote |
| abgeschickte Antworten | serverseitige Summe je Woche | Fallzahl |
| Abbruchquote | 1 − abgeschickt ÷ Aufrufe | Handbuch B: Lange Umfragen „werden abgebrochen und verzerren das Ergebnis zugunsten der Geduldigen“ |
| Teilnahmequote | abgeschickt ÷ neu bestätigte Eintragungen im selben Zeitraum | Wie groß der Ausschnitt der Liste ist, über den die Umfrage spricht |

### 4.2 Kreuztabellen

| Tabelle | Zeilen × Spalten | Frage dahinter |
|---|---|---|
| **A** | Rücklauf je Woche | Hält die Teilnahme, oder bricht sie ein? |
| **B** | Gebiet (Startstadt · 3-km-Umkreis · übrige) × Altersgruppe | Wer wartet in Köln, und wer in der Nähe der Schaafenstraße? |
| **C** | genutzte App × Löschung oder Kündigung in zwölf Monaten | Wie wechselfreudig sind die Nutzer der einzelnen Apps? |
| **D** | Altersgruppe × genutzte App | Welche App nutzt welche Altersgruppe? Wie viele nutzen keine? |
| **E** | Freitext-Kategorie × Altersgruppe | Was ärgert wen? |
| **F** | Gebiet: Anteil in der Umfrage gegen Anteil in der ganzen Warteliste | Spricht die Umfrage für die Liste, oder für einen Ausschnitt? Die Listenwerte kommen als Summen aus `tor-1-vorlage.xlsx`. |

Bei Mehrfachauswahl (F3) zählt jede genannte App; die Anteile summieren sich deshalb über 100 %.

### 4.3 Codebuch für den Freitext

Dieselben Kategorien wie im Protokollbogen, ergänzt um die häufigen Beschwerden aus Handbuch A. Eine Antwort kann mehrere Codes bekommen.

| Code | Kategorie | Beispiele für Zuordnung |
|---|---|---|
| DS | Datenschutz, Standort, „wer sieht meine Daten“ | Standort zu genau, Daten weitergegeben |
| AB | Ablehnung, Ghosting, Umgangston | keine Antwort, unfreundliche Nachrichten |
| WB | Werbung | Werbung im Raster oder Chat |
| FK | Fake-Profile, Betrug, Sicherheit | falsche Bilder, Geldforderungen |
| BI | unerwünschte Bilder | Bilder ohne Nachfrage |
| PR | Preis, Abo, Bezahlschranken | zu teuer, alles hinter dem Abo |
| OR | Orte, Ausgehen, „wo ist heute was los“ | keine Termine, keine Orte |
| TE | Technik, Akku, Abstürze | langsam, stürzt ab |
| SO | Sonstiges | alles andere |

Zwei Personen codieren unabhängig die ersten 30 Antworten und vergleichen. Wo sie abweichen, wird die Kategorie geschärft, bevor der Rest codiert wird.

### 4.4 Ab wann eine Aussage trägt

Die zufällige Fehlerspanne eines Anteils (95 %, ungünstigster Fall bei 50 %) beträgt ±1,96 × √(0,25 ÷ n):

| Fallzahl n | 30 | 50 | 100 | 200 | 400 | 1.000 |
|---|---|---|---|---|---|---|
| Fehlerspanne in Prozentpunkten | ±17,9 | ±13,9 | ±9,8 | ±6,9 | ±4,9 | ±3,1 |

**Regeln für die Auswertung:**

1. **Anteile je Gruppe erst ab 100 Antworten in der Gruppe berichten** (rund ±10 Prozentpunkte). Darunter nur Rangfolgen und Beispiele.
2. **Unterschiede zwischen zwei Gruppen** nur dann als Unterschied lesen, wenn er größer ist als beide Fehlerspannen zusammen — eine grobe, vorsichtige Regel.
3. **Zellen unter 10 nicht ausweisen**, sondern als „unter 10“ — aus Datenschutzgründen und weil Zufall dort alles ist.
4. **Beantwortet ein großer Teil der Liste die Umfrage**, wird die Spanne kleiner (Endlichkeitskorrektur, in der Arbeitsdatei gerechnet).
5. **Die Fehlerspanne deckt nur den Zufall ab.** Gegen die Verzerrungen unten hilft keine Fallzahl.

### 4.5 Verzerrungen, die zu erwarten sind

| Verzerrung | Richtung | Umgang |
|---|---|---|
| **Selbstauswahl** | Es antworten die Interessierten und Geduldigen | Teilnahmequote berichten; Tabelle F gegen die ganze Liste |
| **Einstimmung durch die Wartelistenseite** | Datenschutz wird häufiger genannt, weil die Seite davon spricht | Code DS nie als Beleg der Kernthese lesen |
| **Abbruch** | Wer abbricht, fehlt ganz | Abbruchquote berichten; Fragen kurz halten |
| **Soziale Erwünschtheit** | Manche Apps werden seltener angegeben, als sie genutzt werden | Anteile als Untergrenze lesen |
| **Mehrfachteilnahme** | Einzelne zählen doppelt | ohne Kennung nicht vermeidbar; bei auffälligen Häufungen Woche für Woche prüfen |
| **Zeitpunkt** | Rund um ColognePride tragen sich auch Gäste ein | Gebietsverteilung je Woche ansehen |
| **Sprache** | Der Bogen ist deutsch; wer kein Deutsch liest, fehlt | als Grenze nennen; eine englische Fassung wäre eine Entscheidung (Nr. 61) |

---

## 4a · Warum die Umfrage nicht wächst

*Ergänzt am 20.09.2026 (A-60).*

Aus den Beschlüssen vom 19.09.2026 sind vierzehn neue Fragen entstanden — zu Zonen, Preisen, Verifizierung, Veranstaltungen, Name, Bildern und verlorenem Zugang. **Keine davon kommt in diese Umfrage.**

Der Grund steht in Abschnitt 3: Sie liegt bei **49,5 bis 59,7 Sekunden**, und „unter 60 Sekunden" ist ihre Abnahmebedingung. Eine einzige zusätzliche Frage bricht sie. Was dabei verloren geht, ist nicht die Genauigkeit, sondern der **Rücklauf** — und der ist der eigentliche Wert dieser Umfrage. Eine Umfrage, die 40 Prozent ausfüllen, sagt mehr als eine doppelt so lange, die 15 Prozent ausfüllen.

**Die neuen Fragen laufen deshalb über die Gespräche** — dort ist Platz, und dort sieht man das Zögern, das ein Formular nicht zeigt. Der Aufbau steht in `interviewfragen-fassung-2.md`.

**Drei Wege, sie später doch von der Warteliste zu bekommen**, mit dem Widerspruch, der dabei auffällt:

| | | |
|---|---|---|
| **A** | Gar nicht — die Fragen bleiben in den Gesprächen | **empfohlen** |
| **B** | Ein freiwilliger zweiter Block **nach** dem Absenden | Bricht die 60 Sekunden nicht. **Aber:** Handbuch B, Teil VIII, Auflage 4 verbietet auf der Dankeseite „einen zweiten Aufruf". Ob das nur die Teilen-Aufforderung meint oder jede weitere Bitte, ist auslegungsbedürftig — **der Widerspruch wird benannt, nicht aufgelöst** |
| **C** | Eine zweite Umfrage später an die dann größere Liste | Möglich, braucht aber eine eigene Einwilligung (**U1**) und kommt zu spät für die Entscheidungen, die jetzt blockieren |

---

## 5 · Fünf Fragen, die wir bewusst nicht stellen

| # | Frage | Warum nicht |
|---|---|---|
| 1 | „Würdest du für Datenschutz zahlen?“ | Zukunft statt Vergangenheit. Handbuch B nennt genau dieses Beispiel als falsche Frage. Zahlungsverhalten zeigt F4 (gekündigtes Abo). |
| 2 | „Fändest du Funktion X gut?“ | Zustimmungsfrage — Handbuch B: „Auf die Frage ‚hättest du gern Funktion X?‘ antworten fast alle mit Ja — und benutzen sie nie.“ |
| 3 | „Wie wichtig ist dir Datenschutz?“ | Eine direkte Frage misst, was Befragte für erwünscht halten. Die Kernthese hängt daran, ob Datenschutz ungefragt fällt — das prüfen allein die Interviews. |
| 4 | Fragen zu sexueller Praxis, Vorlieben, HIV-Status oder PrEP | Ausdrücklich ausgeschlossen; besondere Kategorien nach Art. 9 DSGVO ohne Nutzen für die Planung. Handbuch A streicht Ausschlussfilter nach HIV-Status als Diskriminierungsschwerpunkt. |
| 5 | „Wie hast du von uns erfahren?“ | Die naheliegende sechste Frage — und genau die „nur eine kurze Zusatzfrage“, die der Auftrag ausschließt. Welche Wege wirken, zeigen die Wochensummen im Verlauf der Tor-1-Vorlage (Eintragungen, aktive Partnerorte) — ohne dass jemand gefragt wird. |

**Ebenfalls nicht:** Name, E-Mail-Adresse oder ein Kontaktwunsch (die Umfrage ist anonym), und Fragen zu Geschlechtsidentität oder Orientierung. Die Begriffe dafür lassen die Gründer erst von Betroffenen gegenlesen (Nr. 13); eine falsche Auswahl würde mehr schaden als nützen.

---

## 6 · Befunde und Widersprüche

1. **Befragung per Mail und Einwilligung.** Der BGH (Urteil vom 10.07.2018, VI ZR 225/17) hält fest: „Eine Kundenzufriedenheitsbefragung in einer E-Mail fällt auch dann unter den Begriff der (Direkt-)Werbung, wenn mit der E-Mail die Übersendung einer Rechnung für ein zuvor gekauftes Produkt erfolgt.“ A-02 plant die Umfrage „als separate Mail an bestätigte Eintragungen“. Die Wartelisten-Einwilligung nannte in ihrer alten Fassung nur, „über den Start von Cruizy zu informieren“, und die Interessenmessung; seit A-57 (20.09.2026) nennt sie fünf Zwecke. Laieneinschätzung: nicht gedeckt → **Nr. 61**; A-02 trägt einen Hinweis.
2. **Keine Prüfung der Kernthese.** Die Wartelistenseite spricht von Datenschutz; wer dort unterschreibt, ist eingestimmt. Die Kernthese — Datenschutz kommt ungefragt — prüfen allein die anonymen Interviews (Tor am Ende von V1).
3. **Wartelisten-Codes in V1.** Der Leitfaden (24.07.2026) sah vor, am Ende jedes Gesprächs eine Karte oder einen Code zur Warteliste zu überreichen. Seit dem Beschluss vom 26.07.2026 geht die Warteliste erst in V4 live; die Interviews laufen in V1. Ein Code hätte ins Leere geführt, und eine Vorab-Seite würde die Impressumsfrage wieder öffnen (Nr. 6). **Angepasst:** Im Leitfaden wird nichts mehr überreicht; der Abschlusssatz verspricht nichts.
4. **Beta-Gruppe aus den Interviews.** Handbuch B bildet die Beta-Gruppe als „Telegram- oder Discord-Gruppe aus den Interviewteilnehmern“ und verlangt zugleich, die Gespräche „anonym“ zu notieren. Ohne Kontaktdaten gibt es keinen Weg zurück zu den Befragten — und zwischen Gespräch (V1) und Testphase (RM 8–9) liegen rund zwei Jahre. Wer mitmachen will, muss sich später selbst auf die Warteliste setzen → **Nr. 56** ergänzt.
5. **Altersgruppen.** Handbuch A nennt die Zielgruppe 18 bis 60; der Protokollbogen gruppiert 18–25, 26–35, 36–50, über 50. Die Umfrage übernimmt diese Gruppen, damit beide Quellen zusammenpassen.
6. **Zeitfenster.** Handbuch B setzt die Umfrage in „Monat 4–9“ — gedacht für eine Warteliste, die in den ersten Wochen nach dem Start öffnet. Im Projekt öffnet sie im Mai 2028, zwei Monate vor T0. Weg A läuft deshalb ab dem ersten Tag der Liste; Weg B in Roadmapmonat 4–9 (Oktober 2028 bis März 2029), in jedem Fall vor dem Start in Köln, weil die Kölner Eintragungen dann gelöscht werden.

---

## 7 · Offene Punkte

### 7.1 Entscheidungen

- **Nr. 61 — Wartelisten-Umfrage: Weg, Zeitpunkt, Einwilligung, Werkzeug, Löschfrist** (Gründer + Anwalt, vor der Freischaltung der Warteliste).
- **Nr. 56 ergänzt** um die Beta-Gruppe aus den Interviews.

### 7.2 Fragen an den Anwalt

| # | Frage |
|---|---|
| U1 | Ist eine Einladung zur Umfrage per E-Mail an die Warteliste Werbung im Sinne von BGH VI ZR 225/17 — und deckt die Wartelisten-Einwilligung sie? Wenn nein: Wie sieht eine zweite, freiwillige Einwilligung ohne Kopplung aus? |
| U2 | Sind die Antworten ohne E-Mail- und IP-Adresse personenbezogen? Braucht es die ausdrückliche Einwilligung nach Art. 9 DSGVO? Wie gehen wir mit Widerruf und Löschwünschen um, wenn sich Antworten niemandem zuordnen lassen (Art. 11 DSGVO)? |
| U3 | Reicht die erste Ebene in Abschnitt 2.2, und was muss der vollständige Datenschutzhinweis (A-03) zur Umfrage ergänzen? |
| U4 | Wie lange dürfen Freitexte liegen, und was gilt, wenn jemand darin Dritte nennt? |
| U5 | Läuft die Umfrage vor der Gründung (ab Mai 2028), braucht sie dieselbe Übergangsklausel zur GmbH wie die Warteliste? |

### 7.3 Menschen-Handlungen

| Wann | Was |
|---|---|
| vor der Freischaltung (V4) | Nr. 61 entscheiden; Anwaltsfragen U1–U5 klären; Werkzeug wählen |
| vor der Freischaltung | App-Liste in F3 mit der Wettbewerbsbeobachtung abgleichen |
| vor der Freischaltung | Stoppuhrtest mit fünf Personen, ohne und mit Freitext |
| ab 30 Freitexten | Codebuch zu zweit prüfen (Abschnitt 4.3) |

---

## 8 · Was dieses Dokument nicht enthält

- **Keine Umsetzung** im Werkzeug und keine Veröffentlichung.
- **Keine Soll-Werte** für Rücklauf oder Antworten — die Umfrage beschreibt, sie entscheidet kein Tor.
- **Keine Endfassung** der Datenschutztexte.
- **Keine Einzelantworten** in der Arbeitsdatei.

---

## Quellen

Abruf jeweils am 16.09.2026.

| Thema | Quelle |
|---|---|
| BGH, Urteil vom 10.07.2018, VI ZR 225/17 — amtlicher Leitsatz | [anwalt24.de](https://www.anwalt24.de/urteile/bgh/2018-07-10/vi-zr-225_17) · [datenschutz-guru.de (19.09.2018, aktualisiert 01.02.2019)](https://www.datenschutz-guru.de/der-bgh-und-die-kundenzufriedenheitsumfragen-per-e-mail/) |
| Lesegeschwindigkeit: Brysbaert, M. (2019). How many words do we read per minute? Journal of Memory and Language, 109, 104047 | [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0749596X19300786) |

Handbuchzitate aus den HTML-Originalen in `00-grundlagen/`. Fehlerspannen sind berechnet.
