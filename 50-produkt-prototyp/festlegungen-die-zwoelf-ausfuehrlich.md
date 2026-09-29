# Die zwölf folgenschwersten Festlegungen — ausführlich

> ## ⚠ Entscheidungsvorlage, keine Zusage
>
> **Erstellt: 26.09.2026 · Aufgabe A-66 · Grundlage: Beschluss Nr. 68 (21.09.2026) und die Rückmeldung vom 26.09.2026**
> Am 26.09.2026 hast du zu Teil 5 der Entscheidungsvorlage geschrieben: *„bitte einmal genauer aufschlüsseln, so kann ich keine entscheidung treffen wie es dort steht."* Dieses Dokument ist die Antwort darauf. Es ersetzt die Tabelle in `../01-steuerung/entscheidungsvorlage-2026-09-25.md`, Teil 5, und ergänzt das Blatt „Die zwölf zuerst" in `festlegungen-pruefliste.xlsx`.
>
> ## ✔ Am 27.09.2026 beantwortet — alle zwölf
>
> | # | FV | Entschieden | Anmerkung |
> |---|---|---|---|
> | 1 | FV-87 | **B** | wie empfohlen |
> | 2 | FV-23 | **B** | wie empfohlen |
> | 3 | FV-17 | **B** | **abweichend von der Empfehlung (A), ausdrücklich unter Vorbehalt:** „Vermerke B überall und wir ändern das nur in C oder A, wenn das rechtlich muss“ → **K6** |
> | 4 | FV-15 | **B** | wie empfohlen |
> | 5 | FV-01 | **A** | wie empfohlen |
> | 6 | FV-46 | **A als Dauerwert, 5 in der Testphase** | wie empfohlen |
> | 7 | FV-57 | **A als Voreinstellung, dazu zwei wählbare Stellungen** | **mehr als die drei Möglichkeiten:** „nur mit meiner Bestätigung“ mit Anfrageknopf, und „immer erlaubt“ auch als erste Nachricht → neue Festlegung **FV-96** |
> | 8 | FV-86 | **A**, Prinzip aus 7 in der Hilfe erklärt | wie empfohlen |
> | 9 | FV-77 | **A**, dazu **Nachlauffrist 7–14 Tage** und Aufbewahrung bei Meldung bis zur Klärung | **abweichend von der Empfehlung (B)**, mit einer Ergänzung, die den Einwand gegen A auffängt → neue Festlegung **FV-97** |
> | 10 | FV-71 | **C** | wie empfohlen |
> | 11 | FV-34 | **B**, endgültig nach den Interviews | wie empfohlen |
> | 12 | FV-29 | **freie Wahl der Dauer** | **abweichend von A:** „kann ja auch nur sein, dass der 3 Stunden Zeit hat, oder aber das ganze Wochenende“ |
>
> **Eingearbeitet in die Spezifikation am 27.09.2026** (A-68): 14 neue Akzeptanzkriterien, 6 neue Parameter, 2 neue Festlegungen, 8 neue Systemtexte, 1 neue Anwaltsfrage (AF-13). Herleitung: `../01-steuerung/beschluesse-2026-09-27.md`.
>
> **Die Begründungen unten bleiben stehen** — sie dokumentieren, worauf die Entscheidungen beruhen, einschließlich der Einwände gegen die Empfehlungen.

---

## Wie du das hier liest

Jede der zwölf Festlegungen hat denselben Aufbau:

| Abschnitt | Was darin steht |
|---|---|
| **Worum es geht** | die Frage in einem Satz, ohne Fachwörter |
| **Was ein Mensch davon merkt** | eine Beispielsituation — was auf dem Bildschirm passiert |
| **Die Möglichkeiten** | A, B, C jeweils vollständig ausgeschrieben: was gebaut wird, was die Person erlebt, was es bedeutet |
| **Was es kostet** | Bauzeit, Geld, Rechtsrisiko, Schutzwirkung — vier Spalten, je Möglichkeit |
| **Was dagegen spricht** | der ehrliche Einwand gegen die Empfehlung |
| **Empfehlung** | eine Möglichkeit, mit Begründung |
| **Wettbewerb** | nur, wo es eine belegbare Quelle gibt. Wo keine steht, steht auch keine Behauptung |

**Antworten reicht in der Form „1 B · 2 B · 3 A …"** oder mit Nummern: „FV-87 B". Wo du anders entscheidest als empfohlen, ist eine Begründung hilfreich, aber nicht nötig — es ist deine Entscheidung.

**Zur Arbeit am Wettbewerb, offen gesagt:** Für die meisten dieser zwölf Punkte gibt es **keine öffentliche Quelle**. Was ROMEO im Chat erlaubt oder ab wie vielen Personen Grindr auf der Karte gruppiert, steht in keiner Dokumentation — das sieht man nur, wenn man die Apps installiert und benutzt. Das ist eine Menschenaufgabe und steht als solche in `../01-steuerung/wettbewerbsbeobachtung-log.md`. Ich schreibe hier nichts hin, was ich nicht belegen kann.

---

## 1 · FV-87 — Wie bestätigt man sich vor dem privaten Bereich?

**Betrifft:** Z-03 (Zonenarchitektur), Sitzung S5 · **Rang 1 von 12**

### Worum es geht

Der private explizite Bereich (Zone 2) darf nach dem AVS-Raster der KJM nicht einfach offenstehen, wenn man einmal angemeldet ist. Das Raster verlangt **zwei getrennte Schritte**: eine **Identifizierung** einmal je Person, und danach eine **Authentifizierung vor jedem Nutzungsvorgang**. Diese Festlegung betrifft nur den zweiten Schritt: Womit bestätigt jemand kurz, dass er selbst am Gerät ist?

### Was ein Mensch davon merkt

> Du bist angemeldet, hast dich vor drei Wochen identifiziert und willst den privaten Bereich öffnen. Die App zeigt einen Bildschirm: „Kurz bestätigen." Du legst den Finger auf den Sensor oder schaust in die Kamera — eine Sekunde. Danach bist du drin, bis du die App eine Weile weglegst.

Das ist alles. Der Unterschied zwischen A, B und C ist **nicht**, was du tust, sondern **wo der Schlüssel liegt**, mit dem die App prüft, dass es dein Gerät ist.

### Die Möglichkeiten

| | Was gebaut wird | Was die Person erlebt | Was es bedeutet |
|---|---|---|---|
| **A** (heute) | **Passkey oder Gerätesperre.** Ein Passkey ist ein Schlüssel, den das Betriebssystem verwaltet und **über die Cloud zwischen Geräten synchronisiert** — bei Apple über die iCloud-Schlüsselbund, bei Google über den Passwortmanager | identisch: Finger, Gesicht, PIN | Der Schlüssel liegt (auch) bei Apple oder Google. Wer das Konto dort übernimmt, übernimmt den Schlüssel |
| **B** | **Nur gerätegebundene Schlüssel.** Derselbe technische Standard (WebAuthn), aber mit der Vorgabe „nicht synchronisieren" — der Schlüssel entsteht im Sicherheitschip des Geräts und **verlässt es nie** | identisch: Finger, Gesicht, PIN. **Ein Unterschied:** Bei einem neuen Telefon ist der Schlüssel weg und muss neu angelegt werden | Kein US-Dienst ist beteiligt. Der Preis: ein zusätzlicher Schritt beim Gerätewechsel |
| **C** | **Nur die Gerätesperre.** Die App fragt das Betriebssystem „ist der Besitzer gerade entsperrt?" und glaubt der Antwort | identisch | Am einfachsten zu bauen, am schwächsten im Nachweis: Es gibt keinen kryptografischen Beleg, nur eine Ja/Nein-Auskunft des Betriebssystems |

### Was es kostet

| | Bauzeit | Geld | Rechtsrisiko | Schutz für die Person |
|---|---|---|---|---|
| **A** | gering (Standardbibliotheken) | 0 € | **Widerspruch zu Nr. 69 und G-01** — synchronisierte Passkeys laufen über US-Anbieter | mittel: Übernahme des Apple- oder Google-Kontos reicht |
| **B** | gering bis mittel (ein zusätzlicher Ablauf für den Gerätewechsel, ~1 Tag) | 0 € | **keines erkennbar** — nichts verlässt das Gerät | **am höchsten** |
| **C** | am geringsten | 0 € | **erkennbar** — ob eine Gerätesperre als „Authentifizierung" im Sinne des AVS-Rasters genügt, ist zweifelhaft (Anwaltsfrage) | niedrig |

### Was gegen die Empfehlung spricht

Bei **B** verliert jemand beim Verlust oder Wechsel des Telefons diesen Schlüssel. Er kommt über die Wege aus Z-09 zurück ins Konto und legt dann einen neuen an — aber es ist ein Schritt mehr, und er fällt genau in einen Moment, in dem die Person ohnehin gestresst ist.

### Empfehlung: **B**

Du hast Passkeys am 21.09.2026 mit Nr. 69 ausdrücklich ausgeschlossen. **A widerspricht damit einem Beschluss, der schon gefallen ist** — die Festlegung ist nur deshalb noch offen, weil sie vor Nr. 69 formuliert wurde. B hält die Authentifizierung, die das KJM-Raster verlangt, ohne dass ein US-Dienst daran beteiligt ist, und kostet dafür einen Ablauf, der ohnehin gebaut werden muss.

---

## 2 · FV-23 — Wie wird das Alter im Profil gespeichert?

**Betrifft:** Abschnitt 5.0, F26 (Profil anlegen) · **Rang 2 von 12**

### Worum es geht

Getrennt zu halten sind zwei Dinge: die **Prüfung**, dass jemand 18 ist (die geschieht bei der Registrierung und ist Gegenstand von FV-15 und FV-17), und die **Angabe im Profil**, nach der andere filtern. Diese Festlegung betrifft nur die zweite.

### Was ein Mensch davon merkt

> Du legst dein Profil an. Bei „Alter" steht entweder ein Geburtsdatum-Feld, ein Zahlenfeld („34") oder eine Auswahl („26–35"). Andere sehen das, was du gewählt hast, und können danach filtern.

Und ein Jahr später:

> **Bei A** steht dein Alter von allein richtig — die App zählt weiter. **Bei B** fragt sie einmal im Jahr: „Bist du jetzt 35?" **Bei C** steht dein Band so lange, bis du es selbst wechselst.

### Die Möglichkeiten

| | Was gespeichert wird | Was andere sehen | Der Unterschied, der zählt |
|---|---|---|---|
| **A** (heute) | **Monat und Jahr der Geburt** | eine Zahl | Wir speichern ein Teil-Geburtsdatum. Zusammen mit Stadt und Profilbild ist das ein starkes Identifizierungsmerkmal — für uns, für einen Angreifer, für eine Behörde mit Auskunftsverlangen |
| **B** | **nur die Zahl** (z. B. 34), einmal im Jahr zur Bestätigung vorgelegt | dieselbe Zahl | Wir speichern kein Datum. Der Preis: ein Hinweis einmal im Jahr, und wer ihn wegklickt, hat ein Jahr lang eine Zahl zu niedrig |
| **C** | **nur ein Band** (18–25, 26–35, 36–50, über 50) | ein Band statt einer Zahl | Am sparsamsten. Aber: Filter nach Alter werden gröber, und in einer Zielgruppe, in der Alter ein zentrales Suchkriterium ist, merkt man das sofort |

### Was es kostet

| | Bauzeit | Geld | Rechtsrisiko | Schutz | Produktwirkung |
|---|---|---|---|---|---|
| **A** | keine (Standard) | 0 € | **mittel** — Teil-Geburtsdatum ist nach Art. 5 Abs. 1 lit. c DSGVO (Datenminimierung) begründungsbedürftig, wenn eine Zahl reicht | niedrig | beste Bequemlichkeit |
| **B** | gering (ein Jahresablauf, ~0,5 Tage) | 0 € | gering | **hoch** | ein Hinweis im Jahr |
| **C** | gering | 0 € | am geringsten | am höchsten | **merkbar schlechter** — grobe Filter |

### Was gegen die Empfehlung spricht

Bei **B** zeigt ein Profil möglicherweise ein Jahr lang ein um eins zu niedriges Alter. Das ist eine kleine Unwahrheit im Profil — und in einer App, in der Alter ein Suchkriterium ist, kann das ärgern. Dagegen hilft nur der Hinweis, und der muss freundlich und überspringbar sein.

### Empfehlung: **B**

Ein Geburtsmonat zusammen mit einer Stadt ist ein halbes Identifizierungsmerkmal, und wir brauchen ihn für nichts. Gefiltert wird nach Alter — dafür reicht die Zahl. Geprüft wird „18 oder älter" — das geschieht an anderer Stelle und braucht kein Datum im Profil.

---

## 3 · FV-17 — Was geschieht, wenn die Prüfung „nicht volljährig" sagt?

**Betrifft:** F04 (Altersprüfung), Abschnitt 5.0 · **Rang 3 von 12** · **hängt an Anwaltsfrage K6**

### Worum es geht

Die Altersschätzung ist eine Maschine und irrt. Sie irrt in zwei Richtungen: Sie lässt Minderjährige durch, und sie sperrt Erwachsene aus. Diese Festlegung bestimmt, was mit jemandem geschieht, den sie für minderjährig hält.

### Was ein Mensch davon merkt

> Du bist 19 und siehst jünger aus. Du machst das Selfie, und der Bildschirm sagt: „Wir können nicht bestätigen, dass du 18 oder älter bist."
>
> **Bei A** ist dein Konto in diesem Moment gesperrt und deine Daten gelöscht. Du kannst es neu versuchen, aber das Konto von vorhin ist weg.
> **Bei B** ist es gesperrt, und du hast sieben Tage, um mit dem Ausweis zu widersprechen. Gelingt das, geht es weiter, als wäre nichts gewesen.
> **Bei C** ist es gesperrt und gelöscht, und der Weg zurück führt über ein neues Konto mit Ausweisprüfung.

### Die Möglichkeiten

| | Was geschieht | Für einen echten Minderjährigen | Für einen 19-Jährigen, der jünger aussieht |
|---|---|---|---|
| **A** (heute) | sofort gesperrt, **ohne Karenz gelöscht** | seine Daten sind binnen Sekunden weg — das Beste, was für ihn geschehen kann | ein Konto ist verloren; er muss von vorn anfangen |
| **B** | sofort gesperrt, **Löschung nach 7 Tagen**, in denen ein Einspruch mit Ausweis möglich ist | seine Daten liegen sieben Tage länger bei uns — und zwar Daten eines Minderjährigen | er widerspricht mit dem Ausweis und behält alles |
| **C** | sofort gesperrt und gelöscht, **Einspruch nur über ein neues Konto** mit Ausweisprüfung | wie A | wie A, aber mit einem klaren Weg zurück, der Ausweis verlangt |

### Was es kostet

| | Bauzeit | Geld | Rechtsrisiko | Jugendschutz | Erlebnis |
|---|---|---|---|---|---|
| **A** | keine | 0 € | **gering beim Jugendschutz, höher beim Verbraucherrecht** — eine sofortige Löschung ohne Einspruchsmöglichkeit kann als unverhältnismäßig gelten (K6) | **am stärksten** | am härtesten |
| **B** | mittel (Einspruchsverfahren, Aufbewahrung mit Frist, ~2 Tage) | Ausweisprüfungen der Einsprüche (1 € je eID-Vorgang) | **umgekehrt** — sieben Tage Daten von Minderjährigen aufzubewahren, ist nach § 4 JMStV und Art. 5 DSGVO erklärungsbedürftig | schwächer | am freundlichsten |
| **C** | gering | Ausweisprüfungen der Neuanlagen | gering | stark | hart, aber mit Weg |

### Was gegen die Empfehlung spricht

**A ist für einen 19-Jährigen, der jünger aussieht, wirklich unangenehm** — er hat nichts falsch gemacht und verliert sein Konto. Die Zielgruppe dieser App umfasst viele junge Erwachsene; wenn die Schätzung dort häufig irrt, ist das ein echtes Wachstumsproblem und nicht nur ein Härtefall. **Deshalb hängt die Frage an einer Zahl, die wir nicht haben:** Wie oft irrt die Schätzung nach unten? Solange das nicht gemessen ist, entscheidet man im Blindflug.

### Empfehlung: **A** — mit zwei Ergänzungen

A ist die sicherste Antwort auf die Frage, die im Ernstfall gestellt wird („was tun Sie, wenn Ihr System einen Minderjährigen erkennt?"). Zwei Ergänzungen machen sie erträglich, ohne sie aufzuweichen:

1. **Der Ausweisweg steht schon vor der Schätzung offen.** Wer weiß, dass er jung aussieht, wählt ihn gleich und läuft nicht ins Messer.
2. **Der Absagebildschirm nennt den Ausweisweg ausdrücklich**, freundlich und ohne Schuldzuweisung — und lädt zum neuen Anlauf ein, statt die Person mit einem Verbotshinweis stehen zu lassen.

**Was vorher noch geschehen muss:** Anwaltsfrage **K6** klären. Wenn der Anwalt sagt, eine Löschung ohne Einspruch sei unverhältnismäßig, wird es **C** — nicht B, weil B die Daten eines möglichen Minderjährigen eine Woche lang bei uns liegen lässt.

---

## 4 · FV-15 — Welche Wege gibt es für die Altersprüfung (Stufe 1)?

**Betrifft:** F04 · **Rang 4 von 12** · **hängt an Nr. 1 und Nr. 39**

### Worum es geht

Stufe 1 ist die Prüfung, die **jeder** durchläuft: „18 oder älter". Diese Festlegung bestimmt, **wie viele Wege** es dafür gibt und **welche**.

### Was ein Mensch davon merkt

> Nach der Anmeldung: „Wir müssen einmal prüfen, dass du 18 oder älter bist. Wähle einen Weg." Darunter zwei oder drei Knöpfe — zum Beispiel „Mit einem Selfie (dauert 10 Sekunden, das Bild wird nicht gespeichert)" und „Mit dem Online-Ausweis".

### Die Möglichkeiten

| | Wege | Wer bleibt draußen | Was es kostet je Prüfung |
|---|---|---|---|
| **A** (heute) | **mindestens zwei, einer ohne Biometrie**; wer unter der Schätzschwelle liegt, bekommt den Ausweisweg | sehr wenige | Schätzung 0,22 € · eID 1,00 € |
| **B** | wie A, **und ab 2027 zusätzlich die staatliche Brieftasche d-you** | noch weniger | wie A, **d-you ist kostenlos** |
| **C** | **nur Brieftasche und Online-Ausweis** — keine Gesichtsschätzung | **alle, die weder eine Brieftasche noch die Online-Ausweisfunktion nutzen** — das ist in Deutschland ein erheblicher Teil | 0 € bis 1,00 € |

### Was es kostet

| | Bauzeit | Geld über 36 Monate (realistisch) | Rechtsrisiko | Wer bleibt draußen |
|---|---|---|---|---|
| **A** | Grundlage, ohnehin nötig | rund 58.672 € bei voreingestelltem Prüfweg | gering — entspricht „mehrere Prüfwege anbieten" in Handbuch A | wenige |
| **B** | **+ ein Weg mehr** (~2 bis 4 Tage, wenn die Schnittstelle steht) | **niedriger** — jeder Vorgang über d-you kostet nichts | am geringsten: d-you ist staatlich, die Daten bleiben auf dem Gerät | am wenigsten |
| **C** | geringer (kein Schätzverfahren) | am niedrigsten | am geringsten beim Datenschutz | **viele** — das ist der Haken |

### Was gegen die Empfehlung spricht

**B ist heute noch nicht baubar.** Die deutsche Brieftasche **d-you** ist angekündigt, aber noch nicht verfügbar; das Bundesministerium für Digitales und Staatsmodernisierung nennt als Zeitpunkt „Anfang 2027" — ohne Tag. B heißt also: A bauen, und später einen Weg ergänzen. Das ist kein Nachteil, aber es heißt, dass B heute **dieselbe Arbeit** bedeutet wie A.

> **Belegt, abgerufen am 26.09.2026:** Die deutsche EUDI-Brieftasche heißt **d-you**, startet „Anfang 2027", steht allen Bürgerinnen und Bürgern **kostenfrei** zur Verfügung und kann unter anderem einen **Altersnachweis** führen; die Daten bleiben verschlüsselt auf dem Gerät. *(Bundesministerium für Digitales und Staatsmodernisierung)* — **Präzisierung zum Projektstand:** In `../10-recht-gruendung/altersverifikation-stand-2026.md` steht „ab 02.01.2027" (A-53, 20.09.2026, Quelle Fachpresse). Beides ist richtig und heißt Verschiedenes: **02.01.2027 ist der Stichtag aus eIDAS 2.0**, zu dem die Mitgliedstaaten eine Brieftasche anbieten müssen; die amtliche Seite nennt als Startzeitpunkt am 26.09.2026 nur **„Anfang 2027"** ohne Tag. Für die Planung gilt deshalb „Anfang 2027", nicht der Tag.

### Empfehlung: **B**

B ist A mit einer zugesagten Erweiterung. Es kostet heute nichts zusätzlich, senkt später die Prüfkosten und erfüllt G-01 vollständig. **C ist die verlockende Antwort und die falsche:** Sie ist am datensparsamsten und schließt genau die Menschen aus, für die diese App gebaut wird — wer sich nicht outen will, hat selten die Online-Ausweisfunktion eingerichtet.

---

## 5 · FV-01 — Welche Standortgenauigkeit ist voreingestellt?

**Betrifft:** F69, F70 · **Rang 5 von 12**

### Worum es geht

Es gibt drei Stufen: **Grob**, **Nah**, **Aus**. Sie bestimmen, wie groß die Rasterzelle ist, auf die dein Standort gerundet wird, bevor irgendjemand eine Entfernung zu sehen bekommt. Diese Festlegung bestimmt nur, **welche Stufe beim ersten Start aktiv ist**.

### Was ein Mensch davon merkt

> Du öffnest die App zum ersten Mal und siehst das Raster. Bei jedem Profil steht eine Entfernung — bei **Grob** in gröberen Abständen, bei **Nah** feiner. **In beiden Fällen steht eine Entfernung da.** Das ist der Punkt, der in der Vorlage zu kurz kam: „Grob" heißt nicht „keine Entfernung", sondern „ungenauere Entfernung".

### Die Möglichkeiten

| | Voreinstellung | Was die Person tun muss, wenn sie es anders will | Was es bedeutet |
|---|---|---|---|
| **A** (heute) | **Grob** | einmal in die Einstellungen und „Nah" wählen | Datenschutz durch Voreinstellung (Art. 25 Abs. 2 DSGVO). Wer nie in die Einstellungen geht, ist geschützt |
| **B** | **Nah** | einmal in die Einstellungen und „Grob" wählen | Die App fühlt sich beim ersten Öffnen präziser an. Wer nie in die Einstellungen geht, ist genauer sichtbar, als er weiß |
| **C** | **keine** — beim ersten Start wird gefragt | nichts, sie wird ohnehin gefragt | Ehrlich, aber ein Bildschirm mehr in genau dem Moment, in dem die Person die App zum ersten Mal sehen will — und eine Frage, die ohne Erfahrung schwer zu beantworten ist |

### Was es kostet

| | Bauzeit | Geld | Rechtsrisiko | Schutz | Erster Eindruck |
|---|---|---|---|---|---|
| **A** | keine | 0 € | **am geringsten** — Art. 25 Abs. 2 DSGVO verlangt die datenschutzfreundlichste Voreinstellung | hoch | gut |
| **B** | keine | 0 € | **erkennbar** — eine genauere Voreinstellung muss begründet werden | niedriger | etwas besser |
| **C** | gering (ein Bildschirm) | 0 € | gering | mittel — wer schnell wegtippt, wählt zufällig | **schlechter** — eine Frage vor dem ersten Blick |

### Was gegen die Empfehlung spricht

Der eigentliche Einwand aus deiner Rückmeldung vom 21.09.2026 war: *„ohne Entfernung verliert es den Reiz."* Der Einwand ist richtig und trifft A nicht — **bei „Grob" steht eine Entfernung da.** Wenn sich in den Interviews zeigt, dass die Bänder bei „Grob" zu grob sind, ist die Antwort nicht eine andere Voreinstellung, sondern eine **feinere Zellgröße für „Grob"** (der Parameter `P-ZELLE-GROB`). Das ist eine andere Entscheidung, und sie lässt sich später treffen.

### Empfehlung: **A**

---

## 6 · FV-46 — Ab wie vielen Personen zeigt die Karte eine Gruppe?

**Betrifft:** F30 (Karte) · **Rang 6 von 12**

### Worum es geht

Auf der Karte werden keine einzelnen Personen gezeigt, sondern **Gruppen** („hier sind etwa 15 Leute"). Diese Festlegung bestimmt, ab wie vielen Personen eine Gruppe überhaupt entsteht — und damit, wie viel auf der Karte zu sehen ist.

### Was ein Mensch davon merkt

> Du öffnest die Karte in Köln-Ehrenfeld an einem Dienstagabend. **Bei A (ab 10)** siehst du drei Gruppen und viel leere Karte. **Bei B (ab 5)** siehst du acht Gruppen — die Karte wirkt lebendig. **Bei C (ab 20)** siehst du vielleicht eine, in einer kleineren Stadt keine.

### Die Möglichkeiten

| | Schwelle | Wie die Karte wirkt | Das Risiko |
|---|---|---|---|
| **A** (heute) | **10 Personen** | ordentlich gefüllt in einer Großstadt, leer in einem kleinen Viertel | gering |
| **B** | **5 Personen** | deutlich lebendiger, auch am Anfang und in kleinen Städten | **erkennbar:** Aus „5 Personen an diesem Park" lässt sich zusammen mit dem Raster auf einzelne schließen — besonders in einer Zielgruppe, in der wenige Menschen an wenigen Orten sind |
| **C** | **20 Personen** | am Anfang fast leer | am geringsten |

### Was es kostet

| | Bauzeit | Geld | Rechtsrisiko | Schutz | Produktwirkung |
|---|---|---|---|---|---|
| **A** | keine (ein Parameter) | 0 € | gering | hoch | mittel |
| **B** | keine | 0 € | **mittel** — in der Datenschutz-Folgenabschätzung begründungsbedürftig | **niedriger** | **am besten** |
| **C** | keine | 0 € | am geringsten | am höchsten | **am schlechtesten** — eine leere Karte hilft niemandem |

**Wichtig:** Alle drei kosten dasselbe zu bauen — es ist ein Parameter (`P-CLUSTER-MIN`). Die Entscheidung lässt sich später ändern, **ohne etwas neu zu bauen.**

### Was gegen die Empfehlung spricht

Am Anfang, wenn es wenige Nutzer gibt, ist eine leere Karte ein echtes Problem: Sie beantwortet die Frage „ist hier jemand?" mit „nein" — und genau die Antwort bringt Menschen dazu, die App zu löschen. Das spricht für B **in der Startphase**.

### Empfehlung: **A**, mit einer ausdrücklichen Ausnahme für die Testphase

A ist der richtige Dauerwert. Aber weil es ein Parameter ist, lässt sich in der geschlossenen Testphase (200 Personen, Nr. 89) mit **5** arbeiten und die Wirkung messen — dort sind alle Teilnehmer informiert und in einem Viertel. **Danach wird entschieden, mit Zahlen statt mit Vermutung.** So bleibt die Karte im Test lebendig, ohne dass der Dauerwert vorweggenommen wird.

---

## 7 · FV-57 — Wann darf man im Gespräch Bilder schicken?

**Betrifft:** F43 (Medien im Gespräch) · **Rang 7 von 12**

### Worum es geht

Ungefragte Nacktbilder sind in dieser Art von App der häufigste einzelne Grund, warum Menschen sie wieder verlassen. Diese Festlegung bestimmt, welche Hürde davor steht.

### Was ein Mensch davon merkt

> Jemand schreibt dir „Hey". Du antwortest „Hi". **Bei A** kann er ab jetzt Bilder schicken. **Bei B** kann er das erst, wenn du ausdrücklich „Bilder erlauben" antippst. **Bei C** hätte er schon vor deinem „Hi" schicken können.

### Die Möglichkeiten

| | Bedingung für das erste Bild | Was das für den Empfänger heißt | Was das für den Absender heißt |
|---|---|---|---|
| **A** (heute) | **beide Seiten haben Text geschrieben** | Das erste ungefragte Bild ist unmöglich. Wer geantwortet hat, hat sich auf ein Gespräch eingelassen | keine sichtbare Hürde — er schreibt, bekommt Antwort, kann senden |
| **B** | **die empfangende Seite lässt Bilder ausdrücklich zu** | stärkster Schutz: nichts kommt an, was nicht freigegeben ist | **ein Schritt in jedem Gespräch**, in dem Bilder eine Rolle spielen — in dieser App also in vielen |
| **C** | **keine** | ungefragte Bilder sind möglich | am bequemsten |

### Was es kostet

| | Bauzeit | Geld | Moderationslast | Schutz | Reibung |
|---|---|---|---|---|---|
| **A** | gering (eine Bedingung im Gespräch) | 0 € | **deutlich niedriger als bei C** | hoch | **keine sichtbare** |
| **B** | gering bis mittel (ein Schalter je Gespräch, ein Hinweis, ein Zustand mehr) | 0 € | am niedrigsten | **am höchsten** | **in jedem Gespräch** |
| **C** | keine | 0 € | **am höchsten** — jedes ungefragte Bild kann eine Meldung werden, und jede Meldung kostet einen Menschen Zeit | niedrig | keine |

**Die Moderationslast ist hier der Posten, der Geld kostet.** In der Testphase moderieren zwei Menschen; ab 15.000 aktiven Nutzern steht im Modell eine Teilzeitkraft mit 1.700 € im Monat. Ungefragte Bilder sind der Meldegrund, der diese Zahl am stärksten treibt.

### Was gegen die Empfehlung spricht

**B ist wirklich der bessere Schutz**, und die Reibung ist kleiner, als sie klingt: Der Schalter kann im Gespräch stehen, einmal getippt und vergessen. Wer B wählt, entscheidet sich für „Schutz vor Bequemlichkeit" — was zur Positionierung passt. **Der Einwand gegen B ist nicht der Schutz, sondern die Stelle:** Ein zusätzlicher Schritt im Gespräch ist genau dort, wo eine App sich lebendig anfühlen muss.

### Empfehlung: **A**

A verhindert das erste ungefragte Bild — das ist der Fall, der Menschen vertreibt. Wer schon geantwortet hat, ist in einem Gespräch, und dort ist Blockieren einen Tipp entfernt. **Wenn die Interviews zeigen, dass A nicht genügt, ist B die Nachrüstung** — sie lässt sich ergänzen, ohne A zurückzubauen.

---

## 8 · FV-86 — Was sieht jemand, der Bilder noch nicht empfangen darf?

**Betrifft:** Z-03 · **Rang 8 von 12** · **hängt an Nr. 40**

### Worum es geht

Wer nur Stufe 1 hat (18+ geprüft, aber nicht identifiziert), darf explizite Bilder nicht empfangen. Diese Festlegung bestimmt, was in diesem Fall auf **beiden** Bildschirmen steht.

### Was ein Mensch davon merkt

> Du schickst ein Bild. **Bei A** siehst du nichts Besonderes — für dich ist es abgeschickt. Der Empfänger sieht eine geschlossene Kachel mit einem Hinweis, warum. **Bei B** siehst du „kann noch keine Bilder empfangen". **Bei C** ist der Bildknopf gar nicht da.

### Die Möglichkeiten

| | Empfänger sieht | Absender sieht | Der Kern |
|---|---|---|---|
| **A** (heute) | geschlossene Kachel mit Erklärung | **nichts** | Der Prüfstand des Empfängers ist eine **Information über eine andere Person**. A gibt sie nicht heraus. Preis: Der Absender wartet auf eine Reaktion, die nicht kommt |
| **B** | geschlossene Kachel mit Erklärung | **„kann noch keine Bilder empfangen"** | Ehrlich zum Absender — und es verrät, dass der Empfänger nicht identifiziert ist. In einer App, in der Identifizierung mit dem expliziten Bereich zusammenhängt, ist das eine Aussage über dessen Nutzung |
| **C** | nichts (es kommt nichts an) | **kein Bildknopf** | Am klarsten. Aber: Der Absender erfährt dasselbe wie bei B — nur indirekt. Ein fehlender Knopf ist auch eine Information |

### Was es kostet

| | Bauzeit | Geld | Rechtsrisiko | Schutz des Empfängers | Verständlichkeit für den Absender |
|---|---|---|---|---|---|
| **A** | gering | 0 € | am geringsten | **am höchsten** | **am schlechtesten** — er wartet und versteht nicht |
| **B** | gering | 0 € | **erkennbar** — Offenlegung eines Prüfstands gegenüber Dritten | niedriger | gut |
| **C** | gering | 0 € | **erkennbar, wie B** — der fehlende Knopf verrät dasselbe | niedriger | am besten |

### Was gegen die Empfehlung spricht

**A ist verwirrend**, und Verwirrung im Gespräch erzeugt Supportvorgänge („mein Bild kommt nicht an"). Jeder Supportvorgang kostet einen Menschen Zeit — bei zwei Gründern ein echter Posten.

### Empfehlung: **A**, mit einem allgemeinen Hinweis statt eines persönlichen

Der Prüfstand einer anderen Person gehört nicht auf den Bildschirm ihres Gegenübers. Die Verwirrung lässt sich anders lösen: Der Absender bekommt einen **allgemeinen** Hinweis, der nichts über den Empfänger sagt — etwa *„Bilder kommen nicht bei allen an. Warum, steht in der Hilfe."* Das beantwortet seine Frage, ohne eine Aussage über die andere Person zu treffen.

---

## 9 · FV-77 — Was geschieht mit gemeinsamen Gesprächen, wenn jemand sein Konto löscht?

**Betrifft:** F68 (Konto löschen) · **Rang 9 von 12** · **hängt an Anwaltsfrage AF-09**

### Worum es geht

Ein Gespräch hat zwei Seiten. Löscht einer sein Konto — wessen Nachrichten verschwinden?

### Was ein Mensch davon merkt

> Du hast mit jemandem zwei Wochen geschrieben. Er löscht sein Konto. **Bei A** ist das ganze Gespräch weg, auch was **du** geschrieben hast. **Bei B** bleiben deine Nachrichten stehen, seine sind verschwunden — das Gespräch ist einseitig lesbar. **Bei C** bleibt alles, bis du selbst löschst.

Und einen Monat später, wenn etwas vorgefallen ist:

> **Bei A** hast du keinen Beleg mehr — nicht einmal darüber, was du selbst geschrieben hast. **Bei B** hast du deine Hälfte. **Bei C** hast du alles, aber die Löschung der anderen Person war keine.

### Die Möglichkeiten

| | Was gelöscht wird | Was die Gegenseite behält | Was das rechtlich heißt |
|---|---|---|---|
| **A** (heute) | **alles**, auch die Nachrichten der Gegenseite im selben Gespräch | nichts | Maximal sparsam. Aber: Wir löschen Inhalte, die **einer anderen Person** gehören, ohne sie zu fragen |
| **B** | nur die Nachrichten der löschenden Person | **ihre eigenen** Nachrichten, in einem Gespräch ohne Gegenüber | Löschung erfüllt Art. 17 DSGVO für die löschende Person; die Gegenseite behält, was ihr gehört |
| **C** | nichts im Gespräch der Gegenseite | **alles**, bis sie selbst löscht | Am bequemsten — und **Löschen ist dann nicht Löschen.** Das widerspricht der Zusage und wahrscheinlich Art. 17 DSGVO |

### Was es kostet

| | Bauzeit | Geld | Rechtsrisiko | Datensparsamkeit | Was der Gegenseite bleibt |
|---|---|---|---|---|---|
| **A** | gering | 0 € | **mittel** — Löschung fremder Inhalte ohne Einwilligung; auch Beweismittel verschwinden | **am höchsten** | nichts |
| **B** | mittel (Nachrichten einzeln zuordnen, Gespräch ohne Gegenüber darstellen, ~2 Tage) | 0 € | **am geringsten** | hoch | ihre eigenen Nachrichten |
| **C** | gering | 0 € | **hoch** — Art. 17 DSGVO | niedrig | alles |

### Was gegen die Empfehlung spricht

**B erzeugt einen seltsamen Zustand:** ein Gespräch, in dem die eine Hälfte fehlt. Das muss gestaltet werden, sonst sieht es wie ein Fehler aus. Und es ist Bauarbeit, die A nicht braucht.

### Empfehlung: **B**

Was du geschrieben hast, gehört dir. A nimmt es dir, weil eine andere Person eine Entscheidung getroffen hat — und nimmt dir damit im Streitfall auch den Beleg. **Der Fall, in dem das zählt, ist genau der, für den diese App Schutzfunktionen hat:** Wer belästigt wurde und Anzeige erstatten will, braucht seine eigenen Nachrichten. **Vor dem Bau ist AF-09 zu klären** — ob die Nachrichten der löschenden Person im Gespräch der Gegenseite vollständig verschwinden müssen oder als „gelöscht" markiert stehen bleiben dürfen.

---

## 10 · FV-71 — Was geschieht mit dem Gespräch, wenn eine Blockierung endgültig wird?

**Betrifft:** F61 (Blockieren) · **Rang 10 von 12**

### Worum es geht

Eine Blockierung ist 24 Stunden rücknehmbar, danach endgültig. Diese Festlegung bestimmt, was in diesem Moment mit dem Gespräch passiert.

### Was ein Mensch davon merkt

> Jemand ist unangenehm geworden. Du blockierst. Nach 24 Stunden ist es endgültig. **Bei A** ist das Gespräch weg. **Bei B** kannst du es weiter lesen, solange du willst. **Bei C** fragt die App vorher einmal: „Willst du das melden? Danach wird das Gespräch gelöscht."

### Die Möglichkeiten

| | Was mit dem Gespräch geschieht | Was das für eine Meldung bedeutet | Was das für die blockierende Person bedeutet |
|---|---|---|---|
| **A** (heute) | **gelöscht** (außer bereits gesicherten Fallinhalten) | **Der Beleg ist weg**, bevor jemand an eine Meldung denkt. Wer erst eine Woche später merkt, dass er es melden will, hat nichts mehr | sauber: das Unangenehme ist verschwunden |
| **B** | **bleibt lesbar**, bis sie es selbst löscht | Beleg bleibt | Das Unangenehme bleibt in der Liste stehen — und wird immer wieder gesehen |
| **C** | **gelöscht, vorher wird Melden angeboten** | Beleg wird bewahrt, **wenn die Person das will** | ein Bildschirm mehr — genau in dem Moment, in dem sie es hinter sich bringen will |

### Was es kostet

| | Bauzeit | Geld | Moderation | Beweissicherung | Erlebnis |
|---|---|---|---|---|---|
| **A** | keine | 0 € | am wenigsten | **am schlechtesten** | sauber |
| **B** | keine | 0 € | mittel | gut | **belastend** |
| **C** | gering (ein Bildschirm mit zwei Knöpfen, ~0,5 Tage) | 0 € | **mehr Meldungen** — mit Absicht: Meldungen sind der Zweck | **am besten** | ein Schritt mehr |

### Was gegen die Empfehlung spricht

**C erzeugt mehr Meldungen**, und jede Meldung kostet einen Menschen Zeit — in der Testphase die beiden Gründer. Das ist der Preis, und er ist gewollt: Eine Meldung, die nie gestellt wird, schützt niemanden. **Aber er muss eingeplant sein**, gerade weil die Aufstockung der Testphase (Nr. 89) an der Moderationslast hängt.

### Empfehlung: **C**

Wer blockiert, hat meistens einen Grund. Wird das Gespräch still gelöscht, verschwindet der Beleg, bevor die Person an eine Meldung denkt — und danach ist sie darauf angewiesen, dass wir ihr glauben. C bewahrt den Beleg nur, wenn sie es will, und fragt in dem einen Moment, in dem die Sache noch frisch ist.

---

## 11 · FV-34 — Ab wann landet jemand im untersten Band der Antwortquote?

**Betrifft:** F19 (Antwortquote) · **Rang 11 von 12**

### Worum es geht

Die Antwortquote wird nicht als Prozentzahl gezeigt, sondern in drei Bändern (Handbuch A gibt die drei Bänder vor). Diese Festlegung bestimmt die Grenzen — und damit, wie viele Menschen im untersten Band landen.

### Was ein Mensch davon merkt

> An deinem Profil steht ein Hinweis, wie zuverlässig du antwortest. **Bei A** bist du im obersten Band ab 70 %, im mittleren ab 30 %, darunter im untersten. **Bei B** liegen die Grenzen bei 60 % und 20 % — es landen weniger Menschen unten. **Bei C** steht bei allen im untersten Band „keine Angabe".

### Die Möglichkeiten

| | Grenzen | Wer landet im untersten Band | Was das auslöst |
|---|---|---|---|
| **A** (heute) | Band 1 ab **70 %**, Band 2 ab **30 %**; mindestens 5 gewertete Nachrichten, 28 Tage | wer von 10 Nachrichten weniger als 3 beantwortet | **Beschämung.** Das unterste Band ist ein öffentliches Urteil über ein Verhalten, das oft gute Gründe hat — zu viele Nachrichten, eine schwere Woche |
| **B** | Band 1 ab **60 %**, Band 2 ab **20 %** | wer von 10 weniger als 2 beantwortet | deutlich weniger Menschen; die drei Bänder aus Handbuch A bleiben |
| **C** | wie A, aber das unterste Band **wird nicht angezeigt** — dort steht „keine Angabe" | niemand sichtbar | **berührt die Vorgabe „drei Bänder" aus Handbuch A** — es sind dann faktisch zwei sichtbare |

### Was es kostet

| | Bauzeit | Geld | Rechtsrisiko | Wirkung auf Nutzer | Treue zu Handbuch A |
|---|---|---|---|---|---|
| **A** | keine (Parameter) | 0 € | gering | **beschämt am stärksten** | vollständig |
| **B** | keine (Parameter) | 0 € | gering | milder | vollständig |
| **C** | gering | 0 € | gering | am mildesten | **abweichend** — wäre ein benannter Widerspruch |

**Auch das sind Parameter.** Die Grenzen lassen sich jederzeit ändern, ohne etwas neu zu bauen.

### Was gegen die Empfehlung spricht

Die Antwortquote hat einen Zweck: Sie soll das Ghosting sichtbar machen, über das sich in dieser Art von App fast alle beschweren. **Mildere Grenzen machen sie schwächer** — wenn fast niemand im untersten Band landet, sagt das Band nichts mehr.

### Empfehlung: **B**, und endgültig erst nach den Interviews

B mildert, ohne die Vorgabe aus Handbuch A zu verletzen. Die Zahl selbst ist eine Vermutung — sie gehört in die Interviews (A-19): *„Was würdest du denken, wenn an einem Profil steht, dass die Person selten antwortet?"* Danach wird der Parameter gesetzt, nicht vorher.

---

## 12 · FV-29 — Wie lange gilt eine Absicht?

**Betrifft:** F14 (Absichten) · **Rang 12 von 12**

### Worum es geht

Eine Absicht ist eine kurze Angabe wie „Heute Abend" oder „Nur schreiben". Diese Festlegung bestimmt, wann sie von allein verfällt.

### Was ein Mensch davon merkt

> Du setzt um 22 Uhr „Heute Abend". **Bei A** verschwindet das um 4 Uhr früh. **Bei B** um 6 Uhr. **Bei C** hast du beim Setzen gewählt, wie lange — ein Schritt mehr, jedes Mal.

### Die Möglichkeiten

| | Fenster | Was das bedeutet |
|---|---|---|
| **A** (heute) | **„Heute Abend" bis 4 Uhr**, „Nur schreiben" sieben Tage | Der sparsamste Wert. Wer um 4:30 noch unterwegs ist, hat keine Absicht mehr gesetzt |
| **B** | **„Heute Abend" bis 6 Uhr** | Deckt die ganze Nacht ab. Zwei Stunden mehr, in denen eine Angabe über Absichten bei uns liegt |
| **C** | **die Person wählt selbst** | Am ehrlichsten und **jedes Mal ein Schritt mehr** — bei einer Angabe, die man abends schnell setzt |

### Was es kostet

| | Bauzeit | Geld | Datensparsamkeit | Passung zur Nacht |
|---|---|---|---|---|
| **A** | keine (Parameter) | 0 € | **am höchsten** | bis 4 Uhr |
| **B** | keine (Parameter) | 0 € | etwas geringer | **die ganze Nacht** |
| **C** | gering (eine Auswahl beim Setzen) | 0 € | je nach Wahl | **frei** |

### Was gegen die Empfehlung spricht

**4 Uhr ist für diese Zielgruppe früh.** Cruising und Clubnächte enden oft später; eine Absicht, die um 4 Uhr verfällt, verfällt mitten im Geschehen. Das ist der einzige Einwand, und er ist gut.

### Empfehlung: **A** bis zu den Interviews, danach wahrscheinlich B

A ist der sparsamste Wert und heute richtig, weil niemand weiß, wie die Nächte in dieser App tatsächlich verlaufen. **Die Frage gehört in die Interviews** (A-19), und wenn sich zeigt, dass zwischen 4 und 6 Uhr etwas passiert, wird der Parameter auf 6 Uhr gesetzt. Es ist eine Zahl in einer Tabelle, keine Bauarbeit.

---

## Zusammenfassung — die zwölf auf einer Seite

| # | FV | Frage | Empfehlung | Warum, in einem Satz | Später änderbar? |
|---|---|---|---|---|---|
| 1 | FV-87 | Bestätigung vor dem privaten Bereich | **B** | A widerspricht Nr. 69 (keine Passkeys) — die Festlegung ist älter als der Beschluss | ja, aber mit Bauarbeit |
| 2 | FV-23 | Alter im Profil | **B** | Ein Geburtsmonat ist ein halbes Identifizierungsmerkmal, und eine Zahl reicht | **nein** — betrifft das Datenmodell |
| 3 | FV-17 | „nicht volljährig" | **A** | sicherste Antwort auf die Frage, die im Ernstfall gestellt wird; hängt an K6 | ja |
| 4 | FV-15 | Wege der Altersprüfung | **B** | kostet heute nichts mehr als A und senkt später die Prüfkosten | ja, ist eine Ergänzung |
| 5 | FV-01 | Voreingestellte Standortstufe | **A** | Art. 25 Abs. 2 DSGVO; „Grob" zeigt trotzdem eine Entfernung | ja, ein Parameter |
| 6 | FV-46 | Gruppengröße auf der Karte | **A**, im Test 5 | Dauerwert A, aber der Test darf messen statt vermuten | ja, ein Parameter |
| 7 | FV-57 | Bilder im Gespräch | **A** | verhindert das erste ungefragte Bild ohne Reibung; B ist die Nachrüstung | ja |
| 8 | FV-86 | Was der Absender sieht | **A** + allgemeiner Hinweis | der Prüfstand einer Person gehört nicht auf den Bildschirm einer anderen | ja |
| 9 | FV-77 | Gespräche bei Kontolöschung | **B** | was du geschrieben hast, gehört dir — auch als Beleg; hängt an AF-09 | **nein** — betrifft das Datenmodell |
| 10 | FV-71 | Gespräch bei endgültiger Blockierung | **C** | bewahrt den Beleg, wenn die Person es will, im einzigen Moment, in dem es noch frisch ist | ja |
| 11 | FV-34 | Bänder der Antwortquote | **B**, endgültig nach den Interviews | mildert ohne Abweichung von Handbuch A | ja, ein Parameter |
| 12 | FV-29 | Dauer einer Absicht | **A**, wahrscheinlich später B | sparsamster Wert, bis die Interviews etwas anderes zeigen | ja, ein Parameter |

**Vier von zwölf kosten Bauarbeit, wenn sie sich später ändern** (FV-87, FV-23, FV-77 und — in Grenzen — FV-57). Bei zwei davon, **FV-23 und FV-77**, geht es an das Datenmodell: Diese beiden sollten **vor Sitzung S4** stehen. Die übrigen zehn sind Parameter oder Bildschirme und lassen sich später ändern.

**Was du also wirklich jetzt entscheiden musst:** **FV-23** und **FV-77**. Alles andere kann warten, bis es gebaut wird — oder bis die Interviews Zahlen liefern.

---

## Was dieses Dokument nicht ist

- **Keine Entscheidung.** Bis du entscheidest, gilt überall Möglichkeit A.
- **Keine Rechtsberatung.** Die Rechtshinweise sind Vorarbeit für den Anwalt; K6 und AF-09 sind ausdrücklich offen.
- **Keine Marktbeobachtung.** Wo keine Quelle steht, steht auch keine Behauptung über ROMEO, Grindr oder Hornet. Was diese Apps tun, sieht man nur durch Benutzen — das ist eine Menschenaufgabe (`../01-steuerung/wettbewerbsbeobachtung-log.md`).
- **Keine Änderung der Handbücher.** Wo eine Empfehlung von Handbuch A abweicht (FV-34 Möglichkeit C wäre eine), ist das benannt (Nr. 81).

---

## Quellen

- `festlegungen-pruefliste.xlsx`, Blatt „Die zwölf zuerst" — dieselben zwölf in Kurzform, mit gelben Antwortspalten
- `produktspezifikation.md`, Abschnitt 18 — alle 95 Festlegungen mit Belegstelle
- `../01-steuerung/entscheidungsvorlage-2026-09-25.md`, Teil 5 — die Kurzfassung, die dieses Dokument ersetzt
- `../01-steuerung/offene-entscheidungen.md`, Nr. 68 — der Beschluss, aus dem die Prüfliste folgt
- **Grindr, Hilfe-Center, „Age Assurance on Grindr"** — Gesichtsbasierte Altersschätzung über den Anbieter FaceTec, Ausweisprüfung als Ersatzweg; eingesetzt im Vereinigten Königreich, in Australien (seit Dezember 2025) und Brasilien (seit März 2026). Wird das Alter nicht bestätigt, kann das Konto eingeschränkt oder entfernt werden, mit Einspruchsmöglichkeit. *Abgerufen 26.09.2026* · <https://help.grindr.com/hc/en-us/articles/47133656615827-Age-Assurance-on-Grindr>
- **Bundesministerium für Digitales und Staatsmodernisierung, „Deutsche EUDI-Wallet heißt d-you"** — Start „Anfang 2027", kostenfrei für alle, Altersnachweis enthalten, Daten verschlüsselt auf dem Gerät. *Abgerufen 26.09.2026* · <https://bmds.bund.de/aktuelles/aktuelle-meldungen/detail/meldung-eudi-wallet>
