# Trefferprozess beim Hash-Abgleich

> ## ⚠ ENTWURF — Vorfassung vor der Anwaltsantwort
>
> Der Ablauf steht, der **Geltungsbereich** nicht: Ob in der privaten Zone überhaupt abgeglichen werden darf, ist die offene Rechtsfrage **Nr. 30**. Dieses Dokument beschreibt den Prozess für beide Fälle und markiert, was sich mit der Antwort ändert. Nichts davon wird ausgeführt, bevor der Fachanwalt geantwortet hat.

Erstellt: 18.09.2026 · Aufgabe A-36 · Rolle: Trust-&-Safety-Analyst · Fenster **V2**
Grundlage: `50-produkt-prototyp/moderationsarchitektur.md` (Zonen, Zugriffsregeln, Speicherfristen — dort festgelegt, hier nur ausgeführt) · `10-recht-gruendung/hash-abgleich-zugangswege.md` · Handbuch A (Moderation, Melden mit Fallnummer)
Rechtsgrundlagen im Text: Art. 18 DSA · § 13 DDG · Art. 22 und Art. 33 DSGVO · § 184b Abs. 5 StGB

---

## Warum es dieses Dokument gibt

**Der erste Treffer ist der schlechteste Zeitpunkt, um zu überlegen, was jetzt zu tun ist.** In der Stunde, in der er kommt, sind zwei Menschen erschrocken, unsicher und allein. Was dann trägt, ist kein Fingerspitzengefühl, sondern eine Liste, die jemand in Ruhe geschrieben hat — an einem Tag, an dem nichts passiert war.

Dieses Dokument ist so geschrieben, dass eine dritte Person es ohne Rückfrage ausführen könnte. Es enthält bewusst keine Angaben darüber, welche Inhalte erkannt werden und welche nicht.

---

## Auf einen Blick

| Größe | Wert |
|---|---|
| Schritte im Ablauf | 12 |
| Zeit bis zur Meldung | **unverzüglich**, im eigenen Maßstab unter 24 Stunden |
| Menschen, die ein Bild ansehen müssen | **im Regelfall null** |
| Entscheidungen, die zwei Personen brauchen | 3 |
| Aufbewahrungsfrist des Zugriffsprotokolls | mindestens 12 Monate |
| Offene Punkte am Ende | 8 |

**Der Grundsatz in einem Satz:** Ein Hash-Treffer ist eine Aussage über eine Zahl, nicht über ein Bild — und der ganze Ablauf ist darauf gebaut, dass das so bleibt.

---

## 0 · Wofür dieser Ablauf gilt

| Zone | Wird abgeglichen? | Gilt dieser Ablauf? |
|---|---|---|
| **Zone 1 — öffentlich** (Profilbilder, öffentliche Inhalte) | ja, vor der Veröffentlichung | **ja, immer** |
| **Zone 2 — privat** (Chatbilder, Alben) | nur bei eingeschaltetem Schalter | ja, wenn eingeschaltet — sonst entsteht kein Treffer |
| **Zone 3 — gemeldet** (durch Nutzer gemeldete Inhalte) | **in der Moderationsarchitektur nicht geregelt** — siehe Hinweis | ja, wenn ein Treffer entsteht |

**Hinweis auf eine Lücke in der Grundlage:** Die Moderationsarchitektur beschreibt den Hash-Abgleich ausdrücklich für Zone 1 und Zone 2. Für Zone 3 — Inhalte, die ein Nutzer gemeldet hat — trifft sie keine Aussage. **Vorschlag dieses Dokuments:** Auch ein gemeldeter Inhalt wird abgeglichen, bevor ihn ein Mensch ansieht; genau dort verhindert der Abgleich, dass jemand etwas sehen muss. Das ist eine **Ergänzung, keine Wiedergabe** — sie gehört in die nächste Fassung der Moderationsarchitektur oder wird dort ausdrücklich verworfen.

**Was der Schalter ist:** Die europäische Übergangsregelung, die den freiwilligen Abgleich in interpersoneller Kommunikation erlaubt, läuft am **03.04.2028** aus — drei Monate vor dem geplanten Start. Gilt bis dahin keine dauerhafte Nachfolgeregelung, startet Zone 2 mit ausgeschaltetem Schalter. Zone 1 und Zone 3 sind davon nicht berührt: Dort wird nicht kommuniziert, dort wird veröffentlicht oder gemeldet.

**Ein Treffer ist kein Beweis.** Ein Hash-Treffer sagt: Diese Datei entspricht einer Datei, die von Fachleuten einer Meldestelle als Missbrauchsdarstellung eingestuft wurde. Er sagt nichts über Absicht, Herkunft oder Kenntnis der Person, die sie hochgeladen hat. Der ganze Ablauf behandelt ihn deshalb als **begründeten Verdacht**, nicht als Feststellung.

---

## 1 · Was automatisch passiert — und was ausdrücklich nicht

**Automatisch, in derselben Sekunde, ohne menschliches Zutun:**

| # | Was | Warum es automatisch sein darf |
|---|---|---|
| A1 | **Der Inhalt wird gesperrt** — nicht veröffentlicht, nicht zugestellt, nicht angezeigt | Eine Entscheidung über einen einzelnen Inhalt, mit Einspruchsmöglichkeit; nach Art. 22 DSGVO zulässig |
| A2 | **Die Datei wird in einen versiegelten Fallordner verschoben**, aus dem normale Ansichten nicht lesen können | Beweissicherung; gleichzeitig Schutz davor, dass jemand die Datei versehentlich öffnet |
| A3 | **Eine Fall-ID wird erzeugt** und mit Zeitstempel, Hashwert, Zone, Konto-ID und — soweit vorhanden — IP-Adresse verknüpft | Das sind genau die Angaben, die eine spätere Meldung verlangt |
| A4 | **Beide Gründer werden benachrichtigt** — mit Fall-ID, ohne Vorschaubild, ohne Dateinamen | Vier-Augen-Prinzip beginnt beim Erfahren, nicht erst beim Entscheiden |
| A5 | **Der Vorgang wird im Zugriffsprotokoll eröffnet** | Jeder spätere Schritt hängt daran und ist nicht nachträglich änderbar |
| A6 | **Weitere Uploads desselben Hashes werden ohne neuen Fall gesperrt** und dem bestehenden Fall zugezählt | Verhindert eine Fallflut bei einer Verteilwelle |

**Ausdrücklich nicht automatisch:**

| # | Was nicht | Warum nicht |
|---|---|---|
| N1 | **Keine Kontosperre.** Das Konto bleibt zunächst unverändert | Art. 22 DSGVO lässt keine vollautomatische Entscheidung mit erheblicher Wirkung zu |
| N2 | **Keine vorläufige Einschränkung**, solange die Rechtsfrage offen ist | Offene Entscheidung **Nr. 31** — Gefahr im Verzug gegen Art. 22 DSGVO. Beide Stellungen sind gebaut; voreingestellt ist die vorsichtige |
| N3 | **Keine automatische Meldung an eine Behörde** | Eine Meldung ist eine Aussage über einen Menschen. Sie wird von einem Menschen abgesendet, nicht von einem Auftrag |
| N4 | **Keine Nachricht an die betroffene Person** | Siehe Abschnitt 4 — die Reihenfolge ist: erst melden, dann mitteilen |
| N5 | **Keine Löschung** | Löschen vernichtet Beweismittel. Gesperrt ist nicht gelöscht |
| N6 | **Kein Vorschaubild irgendwo in der Oberfläche** | Der wichtigste Satz dieses Dokuments: Niemand soll etwas sehen müssen, um zu handeln |

---

## 2 · Wer sieht was — und warum niemand das Bild ansehen muss

**Was das Moderations-Backend bei einem Hash-Treffer anzeigt:**

```text
Fall-ID        HT-2028-0007
Zeitpunkt      12.09.2028, 23:41 Uhr
Zone           1 (öffentlich)
Quelle         Hash-Abgleich, Liste <Meldestelle>
Konto          #48211  · angelegt 04.08.2028 · 2 frühere Meldungen
IP             soweit vorhanden
Status         Inhalt gesperrt · Konto unverändert · nicht gemeldet
```

**Kein Bild. Kein Vorschaubild. Kein Dateiname, aus dem sich etwas ableiten ließe.**

**Warum das geht:** Ein Hash-Treffer ist bereits das Ergebnis einer Sichtung. Jedes Bild und Video hinter einer Hash-Liste wurde von Fachleuten einer Meldestelle geprüft und eingestuft. Es noch einmal anzusehen, fügt der Entscheidung nichts hinzu — es fügt nur einem weiteren Menschen etwas zu.

**Die drei Rollen:**

| Rolle | Wer | Was sie darf |
|---|---|---|
| **Fallführung** | die Person, die zuerst reagiert | Fall öffnen, Angaben prüfen, Meldung vorbereiten |
| **Zweite Person** | die andere | Gegenzeichnen, bevor gemeldet oder das Konto eingeschränkt wird |
| **Ansehen** | **niemand im Regelbetrieb** | Nur mit dokumentiertem Grund, nie allein, nie ohne Eintrag ins Protokoll |

**Wann ein Mensch ausnahmsweise doch sehen müsste:** Wenn ein Falschtreffer im Raum steht und sich nur durch Ansehen klären lässt (Abschnitt 6). Dafür gilt: schriftlicher Grund vor dem Öffnen, zwei Personen anwesend, Eintrag im Protokoll, danach Vermerk im Fall. Und der ehrliche Zusatz: **Wer das nicht tun will, muss es nicht.** Die Klärung kann stattdessen der Meldestelle überlassen werden, die genau dafür geschultes Personal hat.

**Rechtlicher Rahmen dafür:** § 184b Abs. 5 StGB nimmt Handlungen aus, die ausschließlich der rechtmäßigen Erfüllung dienstlicher oder beruflicher Pflichten dienen. Ob die Moderation einer kleinen Plattform darunter fällt, ist **keine Frage, die wir uns selbst beantworten** — sie gehört auf die Anwaltsliste, bevor der erste Fall eintritt.

**Vier Regeln aus der Moderationsarchitektur, die hier gelten:**

1. Kein Zugriff ohne Anlass — das Backend kann Zone 2 nicht durchsuchen, nur konkrete Fall-IDs öffnen.
2. Jeder Zugriff wird protokolliert: wer, wann, welcher Fall, welche Begründung.
3. Vier-Augen-Prinzip bei jeder Sperrentscheidung.
4. Keine Vorschaubilder bei Hash-Treffern.

---

## 3 · Der Meldeweg

**Zuerst die Rechtslage, dann die Wahl.** Art. 18 DSA verpflichtet Hostinganbieter, einen Verdacht **unverzüglich** den Strafverfolgungsbehörden mitzuteilen, wenn die Information den Verdacht auf eine Straftat begründet, die **eine Gefahr für das Leben oder die Sicherheit einer Person** darstellt. § 13 DDG bestimmt für Deutschland, wer das entgegennimmt: das **Bundeskriminalamt als Zentralstelle**, das die Meldung an die jeweils zuständige Strafverfolgungsbehörde weiterleitet.

**Die Pflicht trifft auch uns.** Nach Auskunft des BKA gilt die Meldeverpflichtung für Anbieter von Hostingdiensten **seit dem 17.02.2024 unabhängig von ihrer Größe**. Die DSA-Größenausnahme für kleine Plattformen (Art. 19) betrifft Art. 18 nicht.

### 3.1 Die drei Wege im Vergleich

| | **BKA · Digitale Eingangsstelle** | **FSM-Beschwerdestelle** | **INHOPE** |
|---|---|---|---|
| **Was es ist** | Meldeportal der Zentralstelle nach § 13 DDG | Beschwerdestelle des deutschen Safer Internet Centre | Netz aus 54 Beschwerdestellen in 50 Ländern |
| **Rechtliche Wirkung** | **erfüllt die Pflicht aus Art. 18 DSA** | erfüllt sie **nicht** — ergänzt sie | erfüllt sie **nicht** |
| **Zugang** | Portal `u-entrance.bka.de`, nach Registrierung; manuelle Eingabe oder Schnittstelle | Meldeformular, auch über `internet-beschwerdestelle.de` | über die jeweilige nationale Beschwerdestelle, für uns die FSM |
| **Kosten** | kostenlos | kostenlos | kostenlos |
| **Was danach passiert** | Weiterleitung an die zuständige Strafverfolgungsbehörde | Prüfung, dann sofortige Weiterleitung an BKA und/oder INHOPE; bei deutschen Angeboten Kontakt zum Anbieter | Weiterleitung an die Beschwerdestelle des Hostinglandes |
| **Wofür es gut ist** | die gesetzliche Pflicht | fachliche Einordnung, wenn wir unsicher sind; internationale Löschung | Inhalte, die außerhalb Deutschlands liegen |

**Die Mindestangaben, die das BKA-Portal erwartet** — und die unser Fallordner deshalb automatisch vorhält:

- der strafrechtlich relevante Sachverhalt, **einschließlich des Zeitpunkts der Veröffentlichung**
- Benutzername, User-ID oder Account-ID mit den zugehörigen Nutzerinformationen
- die IP-Adresse, soweit vorhanden
- eine **eigene Vorgangsnummer** für Rückfragen — bei uns die Fall-ID

**Eine Erleichterung, die für uns nicht greift:** Wer bereits eine Meldung an das US-amerikanische NCMEC abgesetzt hat, muss nach Auskunft des BKA nicht gesondert melden, sondern gibt die NCMEC-Fallnummer an. Für einen deutschen Anbieter ist NCMEC aber kein Meldeweg — die US-Meldepflicht trifft US-Anbieter. Wir melden also direkt.

### 3.2 Was wir tun

**Regel: BKA immer, FSM bei Zweifeln, INHOPE nie direkt.**

1. **BKA-Portal** — jeder bestätigte Hash-Treffer, unverzüglich. Interne Frist: **unter 24 Stunden**, gerechnet ab dem automatischen Fallordner.
2. **FSM-Beschwerdestelle** — zusätzlich, wenn wir die Einordnung nicht sicher treffen können oder wenn der Inhalt auch außerhalb unserer Plattform erreichbar ist. Die FSM hat 2025 insgesamt 28.598 Beschwerden bearbeitet, davon 21.072 begründet und darunter 12.147 Missbrauchsdarstellungen; im Inland lag die durchschnittliche Zeit bis zur Löschung bei zwei Tagen, 99,68 % wurden binnen einer Woche entfernt. Diese Erfahrung haben wir nicht.
3. **INHOPE** — nie direkt; der Weg führt über die FSM.

**Vorher zu erledigen, nicht im Ernstfall:** Die Registrierung im BKA-Portal gehört zur Startvorbereitung. Wer sich erst im Moment des ersten Treffers registriert, verliert genau die Stunden, die „unverzüglich" bedeutet. → Offene Entscheidung **Nr. 72**.

**Was bei unklarer Zuständigkeit gilt:** Lässt sich der betroffene Mitgliedstaat nicht sicher bestimmen, sieht Art. 18 Abs. 2 DSA die Meldung an den Sitzstaat oder an Europol vor. Für uns heißt das im Zweifel: Deutschland, also dasselbe Portal.

---

## 4 · Was die betroffene Person erfährt — und was nicht

**Die Reihenfolge ist keine Höflichkeitsfrage.** Wer zuerst die Person informiert und dann meldet, gibt ihr die Gelegenheit, Spuren zu beseitigen. Deshalb: **erst melden, dann mitteilen.**

| Zeitpunkt | Was gesagt wird | Was nicht gesagt wird |
|---|---|---|
| **sofort, automatisch** | „Dieser Inhalt konnte nicht veröffentlicht werden." — der neutrale Systemtext, derselbe wie bei jeder anderen Ablehnung | dass ein Hash-Abgleich angeschlagen hat · welche Liste · welcher Inhalt · dass ein Fall eröffnet wurde |
| **nach der Meldung** | dass der Inhalt gesperrt bleibt und der Vorgang an die zuständige Stelle übergeben wurde, mit Fallnummer und Widerspruchsweg | Einzelheiten der Meldung · der Stand des Verfahrens · was die Behörde tut |
| **auf Nachfrage** | der Widerspruchsweg und die Frist | nichts, was eine Ermittlung gefährden könnte |
| **nie** | — | die Schwellenwerte, die Liste, der Erkennungsweg, der Name der Meldestelle in Verbindung mit dem Einzelfall |

**Warum die erste Meldung neutral bleibt:** Ein Systemtext, der einen Hash-Treffer erkennen lässt, ist eine Anleitung zum Ausprobieren. Der Text muss so aussehen wie bei jeder anderen Ablehnung — das ist kein Verstecken, sondern die Voraussetzung dafür, dass die Erkennung überhaupt wirkt.

**Wo die Grenze liegt:** Wir sagen nichts Falsches. Wir sagen nur nicht alles, und wir sagen niemandem, dass nichts passiert ist. Wenn eine Behörde später Auskunft gibt, ist das ihre Entscheidung, nicht unsere.

**Der Widerspruch bleibt offen.** Auch in diesem Fall gilt die Frist aus der Moderationsarchitektur: Einspruch gegen eine Ablehnung wird in unter 48 Stunden beantwortet. Die Antwort kann lauten, dass der Inhalt gesperrt bleibt — sie darf nicht ausbleiben.

---

## 5 · Aufbewahrung

| Was | Wo | Wie lange | Wer darf zugreifen |
|---|---|---|---|
| **Die Datei selbst** | versiegelter Fallordner, verschlüsselt, getrennt von jeder Ansicht | **nach Vorgabe der Behörde** — bis dahin nicht löschen | niemand ohne dokumentierten Grund und zweite Person |
| **Hashwert, Zeitstempel, Zone** | Falldatensatz | wie der Fall | Fallführung und zweite Person |
| **Konto-ID, IP, Nutzerangaben** | Falldatensatz | wie der Fall | Fallführung und zweite Person |
| **Meldebeleg und Vorgangsnummer der Behörde** | Falldatensatz | dauerhaft, solange der Fall besteht | beide Gründer |
| **Zugriffsprotokoll** | eigene Ablage, für Moderierende nicht löschbar | **mindestens 12 Monate** | beide Gründer, gegenseitig einsehbar |

**Drei Regeln, die in der Aufregung leicht gebrochen werden:**

1. **Nicht löschen.** Auch nicht „zur Sicherheit". Gesperrt ist nicht gelöscht, und die Löschung entscheidet die Behörde.
2. **Nicht kopieren.** Keine Datei auf einen privaten Rechner, kein Anhang in einer Mail, kein Verschieben in einen Messenger — auch nicht zur Abstimmung untereinander. Abgestimmt wird über die Fall-ID.
3. **Nicht weiterleiten.** Auch nicht an den Anwalt. Wer den Sachverhalt schildern muss, schildert ihn; die Datei bleibt, wo sie ist.

**Und der Fall, an den niemand denkt:** Wenn das Konto gelöscht wird — vom Nutzer oder von uns — darf der Fallordner nicht mit gelöscht werden. Die Löschkaskade muss den versiegelten Fallordner ausdrücklich ausnehmen. Das ist eine Anforderung an den Bau, nicht an den Prozess.

---

## 6 · Falschtreffer

**Sie kommen vor.** Ein Hash kann auf eine Datei zeigen, die inzwischen anders eingeordnet wird; eine Liste kann einen Fehler enthalten; ein wahrnehmungsbasiertes Verfahren kann bei stark bearbeiteten Bildern anschlagen. Ein Ablauf, der Falschtreffer nicht vorsieht, produziert stattdessen Schäden.

**Woran ein Falschtreffer erkennbar wird:**

- Der Inhalt ist nachweislich anderswo öffentlich und unbeanstandet verfügbar.
- Die betroffene Person legt eine plausible Herkunft dar, die sich ohne Ansehen der Datei prüfen lässt.
- Die Meldestelle widerspricht der Einordnung auf Rückfrage.
- Mehrere unabhängige Konten laden dieselbe Datei hoch, ohne jeden weiteren Anhaltspunkt.

**Wie zurückgedreht wird — in dieser Reihenfolge:**

| # | Schritt | Frist |
|---|---|---|
| F1 | Rückfrage bei der Meldestelle, mit Fall-ID und Hashwert, ohne Datei | sofort |
| F2 | Ergebnis im Fall vermerken, zweite Person gegenzeichnen lassen | am selben Tag |
| F3 | **Nachtrag an die Behörde**, an die gemeldet wurde — eine Meldung wird nicht stillschweigend zurückgezogen | unverzüglich |
| F4 | Inhalt entsperren, Konto vollständig wiederherstellen, auch zurückliegende Einschränkungen aufheben | am selben Tag |
| F5 | **Entschuldigung, ohne Einschränkung** — benannt, in eigener Sache, ohne Verweis auf Automatik | am selben Tag |
| F6 | Vorgang im Zugriffsprotokoll abschließen und in die Quartalsdurchsicht aufnehmen | mit dem Fall |

**Der Text, der dafür vorbereitet wird, sagt drei Dinge:** dass es unser Fehler war, was genau passiert ist, und was wir dagegen geändert haben. Er sagt nicht „das System hat" — das System sind wir.

**Was ein Falschtreffer auslöst:** Zwei Falschtreffer innerhalb von drei Monaten sind kein Pech, sondern ein Hinweis auf die Liste oder auf die Schwelle. Dann wird der Abgleich in der betroffenen Zone ausgesetzt, bis die Ursache geklärt ist.

---

## 7 · Die Belastung der Moderierenden

**Das ist kein Anhang.** Bei einem Zweierteam gibt es keine Abteilung, in die man einen Fall abgeben kann, und niemanden, der am nächsten Tag übernimmt. Wer mit solchen Funden arbeitet, trägt ein bekanntes und gut dokumentiertes Risiko: sekundäre Traumatisierung. Sie entsteht nicht durch einen schweren Fall, sondern durch viele kleine ohne Pause.

**Sechs Regeln, die vor dem Start festgelegt werden — nicht danach:**

| # | Regel | Warum genau so |
|---|---|---|
| B1 | **Niemand bearbeitet einen Hash-Fall allein.** Die zweite Person wird immer benachrichtigt, auch wenn sie nichts tun muss | Das Vier-Augen-Prinzip ist hier kein Kontrollinstrument, sondern Gesellschaft |
| B2 | **Obergrenze: zwei Hash-Fälle je Person und Tag.** Danach wird der Rest auf den nächsten Tag verschoben oder an die FSM abgegeben | Eine Zahl, die vorher feststeht, ist die einzige, die im Ernstfall hält |
| B3 | **Kein Fall nach 21 Uhr und keiner als letzte Handlung des Tages** | Was man zuletzt tut, nimmt man mit ins Bett. Die Frist von 24 Stunden lässt das zu |
| B4 | **Feste Ansprechperson außerhalb des Teams**, benannt mit Namen und Nummer, bevor der erste Fall kommt | Im Ernstfall sucht niemand mehr eine Nummer |
| B5 | **Nach jedem Fall ein kurzes Gespräch zu zweit** — nicht über den Inhalt, sondern darüber, wie es geht | Zehn Minuten, die den Unterschied machen |
| B6 | **Quartalsdurchsicht**: Wie viele Fälle, wie hat es sich angefühlt, halten die Regeln? Schriftlich | Belastung wächst leise; sie wird nur sichtbar, wenn man danach fragt |

**Wenn es zu viel wird:** Der Abgleich in der privaten Zone ist ein Schalter, und die Moderationsfristen sind im Skalierungs-Playbook ein Abbruchkriterium für die Expansion. Beides heißt dasselbe: **Es ist zulässig, langsamer zu werden.** Was nicht zulässig ist, ist weiterzumachen, bis jemand zusammenbricht.

**Angebote, die vorher herausgesucht werden** — nicht in dem Moment, in dem man sie braucht:

- Die eigene Krankenkasse vermittelt psychotherapeutische Sprechstunden; die Terminservicestelle der Kassenärztlichen Vereinigung ist unter **116117** erreichbar.
- Die **TelefonSeelsorge** ist rund um die Uhr, kostenlos und anonym erreichbar: **0800 111 0 111** und **0800 111 0 222**.
- Wer einen Fall bearbeitet hat und danach schlecht schläft, sich zurückzieht oder die Bilder im Kopf behält, sucht sich Hilfe — das ist eine normale Reaktion auf eine unnormale Sache, kein Zeichen von Schwäche.

**Ein Satz, der in diesem Abschnitt stehen muss:** Wenn einer von beiden sagt, dass er das nicht mehr kann, ist das keine Verhandlung. Dann übernimmt der andere, oder der Abgleich wird ausgesetzt, oder es wird bezahlte Hilfe geholt. Das Produkt ist keinen Menschen wert.

---

## 8 · Notfallkarte

> Zum Ausdrucken. Eine Seite. Hängt dort, wo moderiert wird.

---

### HASH-TREFFER — WAS JETZT ZU TUN IST

**Erst einmal: Es ist nichts kaputt.** Der Inhalt ist bereits gesperrt, die Datei gesichert, der Fall eröffnet. Nichts davon musst du tun. Du hast Zeit bis morgen um diese Uhrzeit.

**1 · Die andere Person anrufen.** Nicht schreiben — anrufen. Kein Hash-Fall wird allein bearbeitet.

**2 · Den Fall öffnen und die Angaben prüfen.** Fall-ID, Zeitpunkt, Zone, Konto, IP. **Kein Bild ansehen.** Es gibt keines zu sehen, und das ist Absicht.

**3 · Meldung im BKA-Portal absetzen** (`u-entrance.bka.de`). Mindestens: Sachverhalt mit Veröffentlichungszeitpunkt · Benutzername oder Account-ID mit Nutzerangaben · IP, soweit vorhanden · unsere Fall-ID als Vorgangsnummer. **Die zweite Person zeichnet gegen, bevor abgesendet wird.**

**4 · Vorgangsnummer der Behörde im Fall eintragen.** Das ist der Beleg, dass gemeldet wurde.

**5 · Erst danach**: die betroffene Person über Sperre und Widerspruchsweg unterrichten. Neutraler Text. Keine Einzelheiten.

**NICHT TUN**

- ❌ Datei löschen · ❌ Datei kopieren, anhängen, weiterleiten — an niemanden
- ❌ Konto automatisch sperren · ❌ vor der Meldung informieren
- ❌ Bild ansehen, um „sicherzugehen" · ❌ allein entscheiden

**UNSICHER?** Die **FSM-Beschwerdestelle** ordnet ein, kostenlos, und leitet selbst an BKA und INHOPE weiter. Im Zweifel dorthin — nicht selbst ansehen.

**FRISTEN** · Meldung: unter 24 Stunden · Nachricht an die Person: nach der Meldung · Widerspruch beantworten: unter 48 Stunden

**DANACH** · Zehn Minuten reden, zu zweit. Nicht über den Inhalt — darüber, wie es geht.
**Höchstens zwei Fälle am Tag. Keiner nach 21 Uhr. Keiner als Letztes am Tag.**

**WENN ES ZU VIEL WIRD** · Ansprechperson: ______________________ · TelefonSeelsorge 0800 111 0 111 · Terminservice 116117
**Aufhören ist erlaubt. Das Produkt ist keinen Menschen wert.**

---

---

## 9 · Was dieses Dokument nicht ist

- **Keine Rechtsauskunft.** Art. 18 DSA, § 13 DDG und § 184b Abs. 5 StGB sind hier zusammengefasst, nicht ausgelegt. Drei Fragen dazu stehen unten offen.
- **Keine Erkennungsbeschreibung.** Schwellenwerte, Listenumfang und Verfahren stehen bewusst nicht hier — auch nicht in der internen Fassung.
- **Keine Freigabe.** Vor dem ersten echten Einsatz muss der Ablauf einmal trocken durchgespielt werden, mit einem erfundenen Fall und echter Stoppuhr.
- **Kein Ersatz für die Meldestelle.** Wir ordnen nicht ein, was Fachleute einordnen. Im Zweifel geben wir ab.

---

## 10 · Offene Punkte

| # | Punkt | Wer | Wann |
|---|---|---|---|
| 1 | **Dürfen wir in Zone 2 überhaupt abgleichen?** Die Übergangsregelung endet am 03.04.2028, drei Monate vor T0 | Anwalt | Anwaltstermin (**Nr. 30**) |
| 2 | **Darf ein Konto bei einem Treffer vorläufig eingeschränkt werden**, bevor ein Mensch geprüft hat? | Anwalt | Anwaltstermin (**Nr. 31**) |
| 3 | **Erfüllt ein Hash-Treffer die Schwelle des Art. 18 DSA** — „Gefahr für das Leben oder die Sicherheit einer Person"? Wir melden im Zweifel, aber die Frage gehört beantwortet | Anwalt | vor dem Start |
| 4 | **Greift § 184b Abs. 5 StGB für die Moderation einer kleinen Plattform?** Davon hängt ab, ob ein Ansehen im Ausnahmefall überhaupt zulässig ist | Anwalt | vor dem Start |
| 5 | **Welcher Meldeweg wird der Regelweg, und wer registriert das Konto im BKA-Portal?** | Gründer | vor dem Start (**Nr. 72**) |
| 6 | **Ausnahme der Löschkaskade für versiegelte Fallordner** — Anforderung an AP-1 und AP-4 | Bau | Phase 1 |
| 7 | **Trockenlauf**: ein erfundener Fall, echte Stoppuhr, Protokoll | Gründer | vor dem Start |
| 8 | **Gilt der Abgleich auch für gemeldete Inhalte (Zone 3)?** Die Moderationsarchitektur regelt nur Zone 1 und 2. Dieses Dokument schlägt Zone 3 vor, weil der Abgleich genau dort verhindert, dass ein Mensch etwas ansehen muss | Gründer, dann Nachtrag in A-37 | vor dem Bau von AP-4 |

---

## Quellen

- **Art. 18 DSA** — Meldung des Verdachts auf Straftaten; Schwelle „Gefahr für das Leben oder die Sicherheit einer Person oder von Personen", bei unklarer Zuständigkeit Sitzstaat oder Europol. Abgerufen am 18.09.2026: <https://gesetz-digitale-dienste.de/dsa/artikel-18/>
- **§ 13 DDG** — das Bundeskriminalamt nimmt als Zentralstelle Informationen nach Art. 18 Abs. 1 und 2 DSA entgegen und leitet sie an die zuständige Strafverfolgungsbehörde weiter. Abgerufen am 18.09.2026: <https://gesetz-digitale-dienste.de/13-ddg/>
- **BKA, FAQ zur Meldeverpflichtung nach Art. 18 DSA** — Portal `u-entrance.bka.de`, manuelle Eingabe oder Schnittstelle, Mindestangaben, Pflicht für alle Hostingdiensteanbieter seit 17.02.2024 unabhängig von der Größe, NCMEC-Fallnummer statt gesonderter Meldung. Abgerufen am 18.09.2026: <https://www.bka.de/DE/DasBKA/OrganisationAufbau/Fachabteilungen/ZentralerInformationsUndFahndungsdienst/Digitale_Eingangsstelle/FAQ/faq_dsa_node.html>
- **FSM-Beschwerdestelle** — kostenlos, Weiterleitung von Missbrauchsdarstellungen an BKA und INHOPE, INHOPE mit 54 Beschwerdestellen in 50 Ländern. Abgerufen am 18.09.2026: <https://www.fsm.de/wissen/a-bis-z/fsm-beschwerdestelle/>
- **FSM-Statistik 2025** — 28.598 Beschwerden, 21.072 begründet, davon 12.147 Missbrauchsdarstellungen; Inland durchschnittlich zwei Tage bis zur Löschung, 99,68 % binnen einer Woche. Abgerufen am 18.09.2026: <https://www.fsm.de/files/2026/04/fsm_statistik_2025.pdf>
- **§ 184b Abs. 5 StGB** — Ausnahme für Handlungen, die ausschließlich der rechtmäßigen Erfüllung dienstlicher oder beruflicher Pflichten dienen. Abgerufen am 18.09.2026: <https://www.juraforum.de/gesetze/stgb/184b-verbreitung-erwerb-und-besitz-kinderpornographischer-inhalte>
- Projektintern: `50-produkt-prototyp/moderationsarchitektur.md` · `10-recht-gruendung/hash-abgleich-zugangswege.md` · `01-steuerung/offene-entscheidungen.md`
