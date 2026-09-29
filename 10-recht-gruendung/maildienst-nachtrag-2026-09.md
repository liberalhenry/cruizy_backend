# Maildienst — Nachtrag September 2026

> ## ⚠ Recherche, keine Vertragsprüfung
>
> **Stand 20.09.2026 · Aufgabe A-58 · Beschluss zu Nr. 63 vom 19.09.2026**
> Ergänzt `maildienst-vergleich.xlsx` (A-42, sieben geprüfte Dienste). **Die Tabelle wird erst erweitert, wenn die neuen Dienste tatsächlich getestet sind** — sie ist für geprüfte Daten gebaut, nicht für Anbieterversprechen. Alle Angaben hier stammen aus öffentlichen Quellen mit Abrufdatum.

---

## Auf einen Blick

| | |
|---|---|
| **Die Antwort auf „prüfe Proton Mail"** | **Proton Mail ist kein Newsletter-Werkzeug.** Kostenlos 150 Mails am Tag, bezahlt höchstens 100 Empfänger je Mail, Massenversand ausdrücklich nicht vorgesehen. Für eine Liste mit 1.000 Adressen ist das nicht knapp, sondern unmöglich |
| **Aber** | Proton passt an einer **anderen** Stelle sehr gut: als Postfach hinter den vier Eingängen des Kontaktservice (F75). Das ist eine andere Frage als der Newsletter, und sie war bisher gar nicht gestellt |
| **Der Befund zum Selbstbetrieb** | listmonk löst die **Datenfrage**, nicht die **Zustellfrage.** Wer selbst betreibt, braucht trotzdem einen Versandweg mit gutem Ruf — also wieder einen Dienstleister, nur einen kleineren |
| **Neu gefunden** | **Fünf europäische Versanddienste**, die es in A-42 nicht gab. Zwei davon können **eingehende** Mails per Webhook weiterreichen — genau das, was `termine@` und die vier Eingänge aus F75 brauchen |
| **Empfehlung** | **listmonk selbst betrieben + ein europäischer Versandweg.** Das ist die einzige Fassung, bei der die Adressliste das eigene Haus nicht verlässt |

---

## 1 · Proton Mail — die klare Antwort

| | |
|---|---|
| **Kostenloser Plan** | 50 Mails je Stunde, **150 je Tag** |
| **Bezahlte Pläne** | Grenze je nach Kontoruf, **höchstens 100 Empfänger je Mail** (An, Kopie und Blindkopie zusammen) |
| **Wie gezählt wird** | Eine Mail an zehn Adressen zählt als **zehn** Mails |
| **Massenversand** | **ausdrücklich nicht vorgesehen.** Versand, der wie Werbemasse aussieht, verstößt gegen die Nutzungsbedingungen |
| **Bei Auffälligkeit** | Sendesperre bis 48 Stunden, bei Wiederholung Kontoprüfung mit möglicher Sperrung |

**Was das für 1.000 Adressen heißt:** Bei 100 Empfängern je Mail wären das zehn Sendungen — und sie zählen als 1.000 Mails. Selbst wenn das Tageslimit es zuließe, fehlten Abmeldelink, Double-Opt-in-Nachweis, Bounce-Behandlung und Segmentierung nach Postleitzahl. **Die Muss-Kriterien K4, K5 und K8 sind technisch gar nicht erfüllbar.**

> **Proton ist damit für den Newsletter ausgeschlossen — aber aus dem richtigen Grund: Es ist das falsche Werkzeug, nicht das falsche Unternehmen.**

**Quelle:** [Proton · E-Mail-Sendelimits](https://proton.me/support/email-sending-limits), abgerufen 20.09.2026.

### Wo Proton stattdessen passt

Der Kontaktservice (F75) braucht **vier Postfächer**: `missbrauch@`, `hilfe@`, `datenschutz@`, `behoerden@`. Das ist keine Versandaufgabe, sondern eine Empfangs- und Ablageaufgabe — und dafür ist Proton gebaut: Ende-zu-Ende-Verschlüsselung, Sitz in der Schweiz mit eigenem Datenschutzrecht, eigene Domain möglich.

**Was vorher zu klären ist:** Die Schweiz ist Drittland. Ein Angemessenheitsbeschluss besteht, aber Grundsatz G-01 spricht von **EWR**. Ob die Schweiz darunter fällt oder eine begründete Ausnahme braucht, ist eine Frage an den Anwalt — **neu als P10**, und sie betrifft nebenbei auch die Zahlungs- und Steuerfragen zur Schweiz aus Nr. 11.

---

## 2 · Fünf europäische Versanddienste, die in A-42 fehlten

| Dienst | Sitz | Hosting | Besonderheit |
|---|---|---|---|
| **Scaleway TEM** | Frankreich | EU | kostenloser Plan mit 300 Mails im Monat; erneuerbare Energien |
| **Sweego** | Frankreich | EU | zusätzlich SMS — **und Weiterleitung eingehender Mails per Webhook** |
| **Lettermint** | Niederlande | EU/EWR | Anbindungen für PHP, Node.js und andere |
| **EmailConnect** | Niederlande | EU | **auf eingehende Mails spezialisiert**, Umwandlung in Webhook-Daten |
| **EmailLabs** | Polen | EU | Zustell- und Öffnungsmessung (für uns eher ein Nachteil, siehe K6) |

**Quelle:** [European Alternatives · Transaktionale E-Mail-Dienste](https://european-alternatives.eu/category/transactional-email-service), abgerufen 20.09.2026.

### Der Fund, der über den Newsletter hinausgeht

**Sweego** und **EmailConnect** können **eingehende** Mails annehmen und als Webhook weiterreichen. Damit lösen sie zwei Aufgaben, die bisher getrennt und ungelöst dastanden:

1. **K9** aus A-42 — der Eingang für `termine@` (Terminservice)
2. **Die vier Eingänge des Kontaktservice** (F75) — jede eingehende Mail wird automatisch zu einem Vorgang mit Fallnummer, ohne dass jemand ein Postfach abarbeitet

**Das ist die Verbindung, die vorher niemand gesehen hat:** Der Kontaktservice braucht genau die Fähigkeit, die im Maildienstvergleich als „Soll" geführt wurde. Sie wird damit zum **Muss**.

### Zwei weitere Anbieter aus dem Newsletter-Umfeld

| Dienst | Sitz | Hosting | Anmerkung |
|---|---|---|---|
| **Mailerlite** | Litauen | EU | EU-Verarbeitung, aber kein deutschsprachiger Kundendienst |
| **GetResponse** | Polen | Polen/EU, teilweise | „teilweise" ist bei K1 und K2 das Problem — das muss vertraglich geklärt werden, nicht auf einer Webseite |

**Quelle:** [Newsletter-Tool-Check · DSGVO-konforme Newsletter-Tools](https://newsletter-tool-check.de/newsletter-tool-dsgvo.html), abgerufen 20.09.2026. CleverReach (Rastede, Server ausschließlich in Deutschland) und Brevo (Paris) standen bereits in A-42.

---

## 3 · Der Selbstbetrieb — was er löst und was nicht

listmonk ist quelloffen, selbst betreibbar und stand in A-42 unter den drei Verbliebenen. Der Beschluss zu Nr. 63 verlangte, ihn ernsthaft durchzurechnen. Das Ergebnis ist zweigeteilt.

| | |
|---|---|
| **Was der Selbstbetrieb löst** | **Die Adressliste verlässt das eigene Haus nicht.** Kein Auftragsverarbeitungsvertrag, keine Unterauftragnehmerkette, keine Frage nach dem Serverstandort, keine Messung, die jemand versehentlich einschaltet. Bei einer Liste, deren bloße Existenz ein Rückschluss auf die sexuelle Orientierung ist, ist das der größte denkbare Gewinn |
| **Was er nicht löst** | **Die Zustellung.** Eine Mail von einem frischen Server landet im Spam. Ein guter Ruf einer Versand-IP entsteht über Monate und bricht bei einem einzigen schlechten Versand zusammen |

**Die praktische Folge:** Wer listmonk betreibt, versendet trotzdem über einen Dienstleister — einen **Versandweg** (SMTP-Relay) statt eines Newsletter-Anbieters. Der Unterschied ist erheblich:

| | Newsletter-Anbieter | Selbstbetrieb + Versandweg |
|---|---|---|
| **Wer hat die Adressliste** | der Anbieter | **wir** |
| **Wer sieht, wer geöffnet hat** | der Anbieter, sofern eingeschaltet | **niemand** — die Messung wird gar nicht erst gebaut |
| **Wer sieht die Adressen** | der Anbieter dauerhaft | der Versandweg **je Sendung, flüchtig** |
| **Aufwand** | gering | **Einrichtung, Pflege, Zustellüberwachung** |
| **Kosten** | Abonnement | Server plus Versandentgelt |

**Einordnung:** Der Versandweg sieht eine Adresse in dem Moment, in dem er die Mail zustellt — das lässt sich nicht vermeiden, auch nicht bei einem eigenen Mailserver, weil die Adresse zum Zustellen gebraucht wird. Aber er **führt keine Liste**, und das ist der Unterschied, auf den es hier ankommt.

---

## 4 · Empfehlung

> **listmonk selbst betrieben, Versand über einen europäischen Versandweg, Eingang über denselben Anbieter.**

| | Warum |
|---|---|
| **Es ist die einzige Fassung, bei der die Liste bei uns bleibt** | Alles andere heißt: Eine Datei mit 1.000 Adressen von Männern, die sich für eine Cruising-App eingetragen haben, liegt bei einem Dritten |
| **Es passt zu Grundsatz G-01** | Kein Auftragsverarbeiter mit der eigentlichen Datenmenge |
| **Es passt zum Baumodell A** | Es wird ohnehin alles selbst gebaut und betrieben; ein Dienst mehr auf demselben Server ist kein Bruch |
| **Es löst K9 und den Kontaktservice mit** | Sweego und EmailConnect reichen eingehende Mails als Webhook weiter |
| **Der Preis** | Einrichtung, Pflege und die Zustellüberwachung. **Das ist echte Arbeit** und gehört als Posten in die Rechnung, nicht in die Hoffnung |

**Die Rückfallebene, falls der Selbstbetrieb scheitert:** rapidmail. Es kam in A-42 am weitesten, sitzt in Freiburg, hostet in Deutschland, erzwingt Double-Opt-in und lässt die Messung kontoweit abschalten (K6 erfüllt).

**Was ausdrücklich nicht empfohlen wird:** Einen Anbieter zu wählen, weil auf seiner Webseite „DSGVO-konform" steht. Das steht auf allen.

---

## 5 · Was als Nächstes zu tun ist

| | Was | Wer | Wann |
|---|---|---|---|
| 1 | **K9 vom Soll zum Muss hochstufen** — der Kontaktservice braucht den Eingang per Webhook | KI, beim nächsten Durchgang | mit A-59 verbunden |
| 2 | **Vier Anbieter anschreiben** (Sweego, EmailConnect, Scaleway, Lettermint): Auftragsverarbeitungsvertrag, Unterauftragnehmerliste, Serverstandort, Preis bei 1.000 / 5.000 / 20.000 — **schriftlich** | Gründer | V3 |
| 3 | **Testversand** mit jedem Kandidaten nach dem Blatt „Testmail-Prüfung" in `maildienst-vergleich.xlsx` | Gründer | V3 |
| 4 | **Erst danach die Tabelle erweitern** — sie ist für geprüfte Daten gebaut | KI | nach Schritt 3 |
| 5 | **Anwaltsfrage P10:** Ist die Schweiz unter Grundsatz G-01 zulässig (Proton als Postfach), oder braucht es eine begründete Ausnahme? | Anwalt | Anwaltstermin |
| 6 | **Aufwand für den Selbstbetrieb beziffern** — Einrichtung, laufende Pflege, Zustellüberwachung | KI, **erledigt 21.09.2026 (A-52)** | — |

---

## 5a · Was der Selbstbetrieb kostet — beziffert in A-52

*Ergänzt am 21.09.2026. Alle Werte sind **ANNAHMEN** aus dem Aufbau, nicht gemessen.*

| | Zeit | Geld |
|---|---|---|
| **Einrichtung** — listmonk auf dem vorhandenen Server, Versandweg anbinden, Absenderdomäne mit SPF, DKIM und DMARC, Double-Opt-in, Abmeldelink | ein bis zwei Tage, einmalig | keins zusätzlich |
| **Pflege** — Aktualisierungen, Datensicherung, Abmeldungen prüfen | ein bis zwei Stunden im Monat | keins zusätzlich — der Server läuft im Posten „Hosting, Infrastruktur“ der Kostenstaffel |
| **Zustellüberwachung** — Rückläufer, Beschwerden, Sperrlisten, Ruf der Absenderdomäne | rund eine Stunde im Monat, nach Aussendungen mehr | keins zusätzlich |
| **Versandentgelt** am Beispiel Sweego | — | kostenlos bis 100 Mails am Tag; **10 € im Monat** für 20.000 bis 50.000 Mails ([sweego.io, Preise](https://www.sweego.io/pricing), abgerufen 21.09.2026) |

**Ergebnis:** Der Selbstbetrieb kostet **Zeit, kaum Geld** — zwei bis vier Stunden im Monat, dazu der einmalige Aufbau. Im Finanzmodell steht er deshalb nicht als eigene Zeile, sondern im Blatt „Herkunft & Widersprüche“, Abschnitt 5, unter „nicht eingerechnet“. Die eigentliche Gegenrechnung ist nicht Geld gegen Geld, sondern Zeit gegen die Zusage, dass die Liste bei uns bleibt.

---

## 6 · Was dieser Nachtrag nicht ist

- **Keine Vertragsprüfung.** Jede Angabe ist vor dem Einsatz schriftlich zu bestätigen.
- **Keine Erweiterung der Tabelle.** Die Tabelle bekommt erst geprüfte Dienste, nicht recherchierte.
- **Keine Entscheidung.** Nr. 63 bleibt offen, bis die Anbieterantworten und die Testversände vorliegen.

---

## Quellen

| Quelle | Inhalt | Abgerufen |
|---|---|---|
| [Proton · E-Mail-Sendelimits](https://proton.me/support/email-sending-limits) | 150 Mails am Tag kostenlos, 100 Empfänger je Mail bezahlt, Massenversand nicht vorgesehen, Sperrfristen | 20.09.2026 |
| [European Alternatives · Transaktionale E-Mail-Dienste](https://european-alternatives.eu/category/transactional-email-service) | Scaleway TEM, Sweego, Lettermint, EmailConnect, EmailLabs — Sitz, Hosting, Besonderheiten | 20.09.2026 |
| [Newsletter-Tool-Check · DSGVO-konforme Newsletter-Tools](https://newsletter-tool-check.de/newsletter-tool-dsgvo.html) | CleverReach, rapidmail, Brevo, Mailerlite, GetResponse — Sitz, Serverstandort, Auftragsverarbeitungsvertrag | 20.09.2026 |
| `maildienst-vergleich.xlsx` (A-42) | die sieben bereits geprüften Dienste, Kriterien K1 bis K10, Testmail-Prüfung | — |
| `../50-produkt-prototyp/kontaktservice-und-tickets.md` (A-59) | die vier Eingänge, die den Webhook-Eingang zum Muss machen | — |
