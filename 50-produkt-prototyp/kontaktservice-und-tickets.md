# Kontaktservice und Ticketsystem — F75 „Hilfe und Kontakt"

> ## ⚠ Konzept, keine Rechtsberatung
>
> **Stand 20.09.2026 · Aufgabe A-59 · Beschluss Nr. 75 vom 19.09.2026**
> Dieses Dokument beschreibt den Kontaktservice vollständig. Die Produktspezifikation führt ihn als **F75** mit Akzeptanzkriterien; das Moderations-Backend bekommt dafür den Bildschirm **M85**. Fristzusagen in den Bedingungen sind einklagbar — die Formulierungen in Abschnitt 3 sind Entwürfe für den Anwalt, keine fertigen Texte.

---

## Auf einen Blick

| | |
|---|---|
| **Warum es das gibt** | Es gab Melden (F62), Blockieren (F61), Löschen (F68) und ein Sicherheitszentrum — aber **keinen Weg, Hilfe zu bekommen** |
| **Drei Regelwerke verlangen dasselbe** | Art. 12 DSA (Kontaktstelle für Nutzer) · Art. 12 DSGVO (Betroffenenrechte) · Apple Richtlinie 1.2 (veröffentlichte Kontaktdaten). Keines davon war bisher erfüllt |
| **Vier Eingänge** | Missbrauch · Hilfe · Datenschutz · Behörden — getrennt, damit Dringendes nicht hinter Belanglosem liegt |
| **Zugesagte Frist** | Ziel **48 Stunden**, Obergrenze **72 Stunden** an Werktagen. Gefahr für Leib und Leben: unverzüglich. Datenschutz: ein Monat nach Gesetz |
| **Die Besonderheit dieses Produkts** | Eine Antwortmail in ein mitgelesenes Postfach ist dasselbe Problem wie bei Nr. 46. Deshalb: **„Antwort nur in der App"** als Voreinstellung für Angemeldete |
| **Aufwand** | geschätzt 2 bis 4 Vorgänge am Tag bei 3.500 aktiven Nutzern — rund 12 bis 25 Stunden im Monat (**ANNAHME**, Herleitung in Abschnitt 7) |

---

## 1 · Die vier Eingänge

Getrennte Adressen, ein Werkzeug dahinter. Der Grund für die Trennung ist nicht die Ordnung, sondern die **Rangfolge**: Wenn alles in einem Postfach liegt, entscheidet der Eingangszeitpunkt, was zuerst bearbeitet wird — und das ist bei einer Missbrauchsmeldung die falsche Regel.

| Eingang | Wofür | Frist | Wer bearbeitet |
|---|---|---|---|
| **missbrauch@** | Meldungen über Inhalte und Verhalten, auch von außen; der schriftliche Weg neben der Meldung in der App (F62) | Ziel 48 h · Obergrenze 72 h | MOD, bei Sperrung ZWEI |
| **hilfe@** | Konto, Anmeldung, Zahlung, Technik, alles Übrige | Ziel 48 h · Obergrenze 72 h | MOD |
| **datenschutz@** | Auskunft, Löschung, Export, Berichtigung, Widerspruch, Widerruf | **ein Monat** nach Art. 12 Abs. 3 DSGVO, um zwei verlängerbar | **nur BETRIEB** |
| **behoerden@** | Kontaktstelle nach Art. 11 DSA, Auskunftsersuchen, Schriftverkehr mit dem BKA | nach der jeweiligen gesetzlichen Vorgabe | **nur BETRIEB** |

**Die Kontaktstelle nach Art. 12 DSA** — die für Nutzer, nicht die für Behörden — sind `hilfe@` und `missbrauch@` zusammen. Beide stehen im Impressum, in den Bedingungen und im Hilfebereich, und beide sind **ohne Konto erreichbar**. Das ist keine Kür: Wer nicht mehr in sein Konto kommt, kann sich nicht in der App melden.

**Ein fünfter Weg, der keine Adresse ist:** Wer gesperrt wurde und das für falsch hält, geht **nicht** über ein Ticket, sondern über den Einspruchsweg (M50). Das Formular leitet dorthin weiter, statt einen Vorgang anzulegen — sonst laufen zwei Verfahren nebeneinander, und die Fristen des Einspruchs sind andere.

---

## 2 · Was in der App steht

**Ort:** Reiter „Ich" → „Hilfe und Kontakt" (S57, neu anzulegen; bis zum 21.09.2026 stand hier irrtümlich S52 — das ist der Check-in). Zusätzlich aus dem Sicherheitszentrum (S51) und aus dem Bezahlbereich erreichbar. Die Erreichbarkeit aus mehreren Orten verletzt Prinzip 7 nicht — dieselbe Begründung wie bei FV-05.

### 2.1 Zwanzig häufige Fragen

Vor dem Formular stehen Antworten. Nicht, um Menschen abzuwimmeln, sondern weil eine sofortige richtige Antwort besser ist als eine richtige nach zwei Tagen.

| | Frage |
|---|---|
| 1 | Ich komme nicht mehr in mein Konto — was kann ich tun? |
| 2 | Ich habe meinen Wiederherstellungscode verloren. |
| 3 | Warum muss ich mein Alter prüfen lassen, bevor ich schreiben kann? |
| 4 | Was passiert mit meinem Selfie bei der Altersprüfung? |
| 5 | Warum sehe ich manche Profile nicht? |
| 6 | Wie genau wird mein Standort angezeigt? |
| 7 | Was ist eine Zone, und wie viele sind kostenlos? |
| 8 | Wie verstecke ich die App auf meinem Gerät? |
| 9 | Wie blockiere ich jemanden, und was sieht die Person davon? |
| 10 | Ich habe jemanden gemeldet — wie geht es weiter? |
| 11 | Wie lange bleiben meine Nachrichten gespeichert? |
| 12 | Wie lösche ich mein Konto, und was passiert dann mit meinen Daten? |
| 13 | Wie bekomme ich eine Kopie meiner Daten? |
| 14 | Meine Zahlung ist nicht angekommen. |
| 15 | Wie kündige ich mein Abo? |
| 16 | Was genau ist im Abo enthalten — und was bleibt kostenlos? |
| 17 | Warum wurde mein Foto abgelehnt? |
| 18 | Mein Konto wurde eingeschränkt — warum, und was kann ich tun? |
| 19 | Wie melde ich einen Ort oder eine Veranstaltung? |
| 20 | Wie erreiche ich einen Menschen? |

**Frage 20 steht bewusst am Ende und führt direkt zum Formular.** Eine Hilfeseite, die den Weg zum Menschen versteckt, ist nach Art. 12 DSA und nach Apples Richtlinie 1.2 keine Kontaktstelle.

### 2.2 Das Formular

| Feld | Inhalt |
|---|---|
| **Kategorie** | eine aus zehn (Abschnitt 2.3) |
| **Beschreibung** | Freitext, P-TICKET-MAX Zeichen |
| **Anhang** | freiwillig, nur Bild, mit demselben Prüfweg wie jedes andere Bild (M-02) |
| **Antwortweg** | **„nur in der App"** (Voreinstellung für Angemeldete) oder eine Adresse |
| **Bezug** | wird automatisch gesetzt, wenn der Aufruf aus einem Gespräch oder einem Bezahlvorgang kommt — **ohne Inhalte zu übernehmen** |

Nach dem Absenden erscheint sofort die **Fallnummer** im Format `H-JJJJ-NNNNNN`. Sie enthält kein Datum genauer als das Jahr, keine Kontokennung und keine Kategorie — sie ist nachschlagbar, aber sie verrät nichts, wenn jemand sie sieht.

### 2.3 Die zehn Kategorien und wohin sie laufen

| | Kategorie | Eingang | Besonderheit |
|---|---|---|---|
| 1 | **Jemand ist in Gefahr** | Missbrauch, **Vorrang** | überspringt die Warteschlange; zeigt zuerst Notrufnummern an |
| 2 | Belästigung, Drohung, verbotener Inhalt | Missbrauch | |
| 3 | Ich komme nicht in mein Konto | Hilfe | |
| 4 | Zahlung und Abo | Hilfe | |
| 5 | Etwas funktioniert nicht | Hilfe | |
| 6 | Meine Daten — Auskunft, Löschung, Export, Widerspruch | **Datenschutz** | eigene Frist |
| 7 | Mein Konto wurde eingeschränkt | → **M50 Einspruch**, kein Ticket | |
| 8 | Ein Ort oder eine Veranstaltung | Missbrauch | |
| 9 | Presse, Behörde, rechtliche Anfrage | **Behörden** | |
| 10 | Etwas anderes | Hilfe | |

**Kategorie 1 zeigt vor dem Absenden einen Zwischenschritt:** *„Wenn jemand jetzt in Gefahr ist, ruf 110 oder 112. Wir sind kein Notdienst und können nicht sofort da sein."* Das ist kein Haftungsausschluss, sondern die Wahrheit — und es ist besser, sie steht da, als dass jemand auf eine Antwort wartet, die nicht rechtzeitig kommen kann.

### 2.4 Die Diskretionsfrage

Dieselbe Falle wie bei Nr. 46: Eine Antwortmail in ein mitgelesenes Postfach kann jemanden outen.

**Drei Regeln:**

1. **„Antwort nur in der App"** ist für Angemeldete voreingestellt. Es kommt keine Mail, sondern ein Hinweis in der App.
2. Geht doch eine Mail hinaus, enthält der **Betreff nur die Fallnummer** — kein Thema, keine Kategorie, kein Hinweis auf den Anlass.
3. Der erste Satz der Mail nennt den Anlass ebenfalls nicht, sondern verweist auf den Fall in der App.

**Wer ohne Konto schreibt, bekommt eine Mail** — anders geht es nicht. Das Formular sagt das vorher, in einem Satz.

---

## 3 · Was in den Bedingungen steht — Entwurf

*Zur Aufnahme in `../10-recht-gruendung/rechtstexte-entwuerfe/agb-geruest-ENTWURF.md`. Entwurf, vom Anwalt zu prüfen (neue Frage A7).*

> **§ 10 Meldungen, Beschwerden und Kontakt**
>
> **(1)** Nutzerinnen und Nutzer können uns Inhalte und Verhalten melden — in der App über die Meldefunktion oder schriftlich an die im Impressum genannte Adresse für Meldungen. Der schriftliche Weg steht auch ohne Konto offen.
>
> **(2)** Wir bestätigen den Eingang unverzüglich mit einer Fallnummer. **Wir antworten in der Regel innerhalb von 48 Stunden, spätestens innerhalb von 72 Stunden an Werktagen.** Auf Meldungen, die eine Gefahr für Leben oder Sicherheit erkennen lassen, reagieren wir unverzüglich.
>
> **(3)** Anfragen zu Rechten nach der Datenschutz-Grundverordnung beantworten wir innerhalb eines Monats. Verlängert sich diese Frist nach Art. 12 Abs. 3 DSGVO, teilen wir das innerhalb desselben Monats mit.
>
> **(4)** Über jede Entscheidung, die ein Konto oder einen Inhalt betrifft, informieren wir die betroffene Person mit Begründung und weisen auf den Einspruchsweg hin.
>
> **(5)** Wir sind kein Notdienst. Bei unmittelbarer Gefahr wenden Sie sich an Polizei oder Rettungsdienst.

**Drei Hinweise für den Anwalt (neue Frage A7):**

- Absatz 2 macht aus einer Absicht eine **einklagbare Zusage** — dieselbe Frage wie A1 für die übrigen freiwilligen Zusagen.
- „In der Regel 48, spätestens 72" ist bewusst zweistufig formuliert: Das Ziel bindet nicht, die Obergrenze schon. Trägt diese Formulierung?
- Absatz 5 soll keine Haftung ausschließen, sondern eine Tatsache benennen. Ist das so haltbar, oder wird daraus ungewollt ein Freizeichnungsversuch nach § 309 BGB?

---

## 4 · Was das Backend bekommt — M85

Vollständig ausgearbeitet in `moderations-backend.md`, Abschnitt 9a. Die Grundzüge:

| | |
|---|---|
| **Sortierung** | **nach Restfrist, nicht nach Eingang.** Das ist der ganze Zweck des Werkzeugs |
| **Vier Töpfe** | entsprechend den Eingängen, mit eigener Fristampel je Topf |
| **Ampel** | grün bis 50 % der Frist · gelb ab 75 % · rot bei Ablauf. Rot verschwindet nicht durch Wegklicken |
| **Rechte** | Hilfe: MOD · Missbrauch: MOD, Sperrung nur mit ZWEI · Datenschutz und Behörden: **nur BETRIEB** |
| **Vorlagen** | für die zwanzig häufigen Fragen, immer bearbeitbar — **nie automatisch versandt** |
| **Verknüpfung** | ein Vorgang kann einen Moderationsfall (M20) auslösen; dann läuft der Fall dort weiter und der Vorgang wird geschlossen, mit Verweis |
| **Protokoll** | jeder Zugriff auf einen Vorgang steht im Zugriffsprotokoll (M60) |

**Was M85 ausdrücklich nicht hat:**

- keine automatische Antwort, die vorgibt, von einem Menschen zu sein
- keine Zufriedenheitsbewertung — sie erzeugt Druck auf die falsche Kennzahl
- keine Weitergabe an einen externen Dienstleister
- keine Volltextsuche über alle Vorgänge hinweg; gesucht wird nach Fallnummer

**M90 bekommt eine neue Zeile:** offene Vorgänge je Topf, ältester Vorgang, Zahl der roten Fristen. Ein Tag mit einer roten Frist ist kein normaler Tag.

---

## 5 · Welche Daten dabei entstehen

*Zur Aufnahme in `../10-recht-gruendung/rechtstexte-entwuerfe/verarbeitungsuebersicht-ENTWURF.md` als neue Datenart.*

| | **D17 · Vorgänge des Kontaktservice** |
|---|---|
| **Was** | Fallnummer, Kategorie, Beschreibungstext, freiwilliger Anhang, gewählter Antwortweg, Bearbeitungsverlauf |
| **Von wem** | Nutzern mit und ohne Konto |
| **Rechtsgrundlage** | Art. 6 Abs. 1 lit. c DSGVO (rechtliche Verpflichtung: Art. 12, 16 DSA; Art. 12 DSGVO) für Meldungen und Betroffenenrechte · Art. 6 Abs. 1 lit. b (Vertrag) für Konto- und Zahlungsfragen |
| **Art-9-Bezug** | **ja, regelmäßig.** Wer von diesem Produkt aus schreibt, offenbart damit einen Zusammenhang mit seiner sexuellen Orientierung — auch wenn der Text harmlos ist |
| **Aufbewahrung** | Vorschlag: 90 Tage nach Abschluss für Hilfe · 12 Monate für Missbrauch (Wiederholungserkennung) · nach gesetzlicher Vorgabe für Datenschutz und Behörden |
| **Besonderheit** | Ein Vorgang **ohne Konto** hat keine Kontokennung und wird mit Ablauf der Frist vollständig gelöscht |

**Neue Anwaltsfrage P8:** Wie lange dürfen Vorgänge des Kontaktservice aufbewahrt werden, und wie verhält sich die Wiederholungserkennung bei Missbrauchsmeldungen zu Art. 17 DSGVO? Verwandt mit P2 (Blockierlisten) und P3 (Moderationsfälle).

---

## 6 · Wie es sich zu dem verhält, was es schon gibt

| Bestehend | Verhältnis zu F75 |
|---|---|
| **F62 Melden** | bleibt der Hauptweg **in** der App. F75 ist der Weg für alles, was nicht an einem Inhalt hängt — und der einzige Weg von außen |
| **F61 Blockieren** | unberührt |
| **F54 Sicherheitszentrum** | bekommt einen Verweis auf F75 |
| **M50 Einspruch** | eigenes Verfahren mit eigenen Fristen; F75 leitet dorthin und legt keinen Vorgang an |
| **F68 Konto löschen** | unberührt; Kategorie 6 ist der Weg für alle, die nicht mehr an die Funktion kommen |
| **Nr. 69 Wiederherstellung** | **F75 ist die Voraussetzung dafür.** Ohne einen Weg, sich zu melden, gibt es keine Wiederherstellung, welches Verfahren auch immer gewählt wird |
| **M80 Meldung nach Art. 18 DSA** | ein Vorgang der Kategorie 1 oder 2 kann dorthin führen |

---

## 7 · Was es kostet — Aufwand

**ANNAHME, hergeleitet, nicht gemessen.** Grundlage: 3.500 aktive Nutzer zu Tor 3 (Finanzmodell).

| | Rechnung |
|---|---|
| Kontaktquote je Monat | **2 %** der aktiven Nutzer (ANNAHME für eine App mit Konto, Zahlung und Altersprüfung) |
| Vorgänge je Monat | 3.500 × 2 % = **70** |
| Vorgänge je Tag | 70 ÷ 30 ≈ **2 bis 3** |
| Bearbeitungszeit je Vorgang | **10 bis 20 Minuten** einschließlich Prüfung |
| **Aufwand je Monat** | **12 bis 23 Stunden** |

**Einordnung:** Das ist mit zwei Personen neben anderem machbar — aber es ist kein Nebenher. Es kommt zur Moderationslast aus A-37 hinzu, nicht statt ihrer. **In der Notfallreihenfolge von Handbuch B steht „Moderationskraft — Gründer übernehmen wieder" an dritter Stelle; der Kontaktservice gehört in dieselbe Zeile.**

**Was den Aufwand senkt, ohne die Zusage zu brechen:** die zwanzig Fragen aus Abschnitt 2.1 gut beantworten. Jede Frage, die dort steht, ist ein Vorgang, der nicht entsteht.

---

## 8 · Was zu bauen ist

| | Was | Wohin | Phase |
|---|---|---|---|
| 1 | Bildschirm S57 mit den zwanzig Fragen und dem Formular | Oberfläche | 1c · AP-13 |
| 2 | Vorgangsablage, Fallnummern, Fristberechnung | Grundlage | 1a · AP-1 |
| 3 | Vier Eingänge, Zuordnung eingehender Mails zu Vorgängen | Grundlage | 1c |
| 4 | M85 im Backend | Backend | 1c · AP-11 |
| 5 | Fristzeile in M90 | Backend | 1c · AP-11 |
| 6 | Weg ohne Konto über die Webseite | Web | 1c |
| 7 | Texte ST-HLF-01 bis ST-HLF-20 | Systemtexte | 1c |

**Warum die Ablage in Phase 1a gehört und nicht in 1c:** Eine Fallnummer, die auf einen Vorgang zeigt, der auf ein Konto zeigen kann, aber nicht muss, ist eine Datenmodell-Entscheidung. Sie nachträglich einzuziehen heißt, die Löschkaskade (F68) noch einmal anzufassen — und die steht auf der Liste der Dinge, die „nachträglich nicht einbaubar" sind.

---

## 9 · Offene Punkte

| | Punkt |
|---|---|
| 1 | **Frist an Werktagen oder Kalendertagen?** Der Entwurf sagt Werktage. Bei einer Missbrauchsmeldung am Freitagabend heißt das Antwort am Mittwoch. Für Kategorie 1 gilt das nicht — für Kategorie 2 sollte es vielleicht auch nicht gelten |
| 2 | **Wer vertritt, wenn beide Gründer ausfallen?** Die Fristen laufen weiter. Das ist Thema T11 aus A-50 und hat hier seinen ersten konkreten Anlass |
| 3 | **Anhänge ja oder nein?** Sie helfen bei der Aufklärung und erzeugen eine neue Bildablage mit eigener Prüfpflicht |
| 4 | **Sprache.** Der Startmarkt ist deutschsprachig, aber Anfragen kommen auf Englisch. Zwei Sprachen oder eine? |
| 5 | **Anwaltsfragen A7 und P8** aus den Abschnitten 3 und 5 |

---

## 10 · Was dieses Dokument nicht ist

- **Keine Rechtsberatung.** Der Entwurf in Abschnitt 3 ist ein Entwurf.
- **Keine Zusage von Fristen nach außen.** Nichts davon ist veröffentlicht.
- **Keine gemessenen Zahlen.** Abschnitt 7 ist eine hergeleitete Annahme und als solche gekennzeichnet.

---

## Quellen

- Beschluss Nr. 75 vom 19.09.2026 · `../01-steuerung/beschluesse-2026-09-19.md`
- `web-native-und-weitere-funktionen.md` (A-50), Abschnitt 5 — die Lücke
- `moderations-backend.md` (A-41) — Rechte, Rollen, Protokoll
- `moderationsarchitektur.md` (A-37) — Zonen, Fristen, Einspruch
- `store-richtlinien-pruefung.md` (A-53) — Apple Richtlinie 1.2, veröffentlichte Kontaktdaten
- Art. 11, 12 und 16 DSA · Art. 12 Abs. 3 DSGVO
