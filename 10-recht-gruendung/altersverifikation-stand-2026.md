# Altersverifikation — Stand September 2026

> ## ⚠ Recherche, keine Rechtsberatung
>
> **Stand 20.09.2026 · Aufgabe A-53 · Grundlage für Nr. 40, Nr. 51, Nr. 64 und die Anwaltsfrage K1**
> Alle Angaben stammen aus öffentlichen Quellen mit Abrufdatum. **Ob das Produkt überhaupt eine geschlossene Benutzergruppe braucht, ist und bleibt die Anwaltsfrage Nr. 1 / K1.** Dieser Bericht beantwortet die andere Hälfte: *Wenn* sie gebraucht wird — wie geht sie, was kostet sie, und was folgt daraus für den Bau?

---

> ## ⚠ Korrektur vom 21.09.2026
>
> Dieser Bericht vom 20.09.2026 enthielt **zwei Fehler**, die beim Durchgehen der Festlegungen für Nr. 68 aufgefallen sind:
>
> 1. **„Die Authentifizierung steht in keinem Projektdokument" — falsch.** Die Produktspezifikation regelt sie seit dem 17.09.2026 in **Z-03 und FV-87**: Vor dem ersten Zugriff auf Medien in Zone 2 je Sitzung und nach einer Pause bestätigt sich die Person mit einem Geräteschlüssel oder der Gerätesperre. Ob das dem KJM-Raster genügt, stand dort bereits als Anwaltsfrage (Nr. 39).
> 2. **„Widerspruch FV-87 gegen Gerätebindung" — falsch.** FV-87 **ist** eine gerätegebundene Authentifizierung; am Konto hängt nur der Prüfstatus, also die Identifizierung. Genau diese Trennung verlangt das Raster: einmal identifizieren, jede Sitzung authentifizieren. Es gibt keinen Widerspruch.
>
> **Außerdem überzeichnet:** d-you war kein neuer Befund. Z-03 führt die staatliche Brieftasche bereits als **Weg 1**, mit dem Hinweis aus der Fachpresse, dass sie zum Start noch ohne Zero-Knowledge-Verfahren kommt.
>
> **Was richtig bleibt:** Altersschätzung ist ein anerkannter Identifizierungsweg; der Satz aus Nr. 51 stimmt nicht; die Empfehlung zur Zwei-Stufen-Architektur. **Was die Korrektur neu aufwirft:** FV-87 nennt als Geräteschlüssel einen **Passkey** — und Passkeys hat Henry am 21.09.2026 als „zu USA- und DSGVO-kritisch" ausgeschlossen (Nr. 69). Siehe Abschnitt 4.
>
> Die fehlerhaften Stellen sind unten durchgestrichen und ersetzt, nicht gelöscht.

---

## Auf einen Blick

| | |
|---|---|
| **Der wichtigste Befund** | Reine Altersschätzung per Gesicht ist von der KJM **als Identifizierungsmodul anerkannt** — aber nur als *Teillösung*. Sie muss durch Maßnahmen auf der **Authentifizierungsebene** ergänzt werden. ~~und die fehlen im Projekt bisher vollständig~~ **Korrigiert:** Für Stufe 2 regelt Z-03/FV-87 das bereits; offen ist, ob es genügt, und ob Stufe 1 ebenfalls eine braucht |
| **Der zweite Befund** *(nicht neu — steht als Weg 1 in Z-03)* | Deutschland bekommt am **02.01.2027** eine staatliche Brieftasche mit Altersnachweis (**d-you**). Sie ist kostenlos, die Daten bleiben auf dem Gerät, und der Dienst erfährt nur „Altersgrenze erfüllt: ja“. Zum realen Start ist sie über ein Jahr im Feld |
| **Folge für Nr. 51** | Der festgelegte Satz **stimmt bei der Altersschätzung nicht** und muss umgeschrieben werden. Ein Vorschlag steht in Abschnitt 6 |
| **Folge für Nr. 40** | Die Zwei-Stufen-Architektur trägt — aber der Schnitt liegt anders, als bisher angenommen. Abschnitt 5 |
| **Was offen bleibt** | Preise. Keine der Quellen nennt belastbare Sätze je Prüfung; das bleibt die Anbieteranfrage aus **Nr. 7** |

---

## 1 · Was die KJM tatsächlich verlangt

Eine geschlossene Benutzergruppe nach § 4 Abs. 2 Satz 2 JMStV steht nach dem Raster der KJM auf **zwei** Beinen, nicht auf einem:

| Stufe | Was sie leistet | Wie oft |
|---|---|---|
| **Identifizierung** | Feststellen, dass diese Person volljährig ist | **einmal** je Person |
| **Authentifizierung** | Sicherstellen, dass bei jeder Nutzung **dieselbe** Person zugreift | **vor jeder Nutzung** |

Die KJM formuliert als Anforderung, dass „nur die jeweils identifizierte und altersgeprüfte Person Zugang zur geschlossenen Benutzergruppe erhält" und dass eine **Weitergabe des Zugangs an Dritte verhindert** wird.

**Das ist der Punkt, an dem das Projekt eine Lücke hat.** Alle bisherigen Überlegungen — in Handbuch A, in der Anwaltsakte, in der Produktspezifikation — betreffen die Identifizierung. Die Authentifizierung kommt nirgends vor. Ein Konto mit Mailadresse und Passwort lässt sich weitergeben; genau das soll die zweite Stufe verhindern.

**Quelle:** [KJM · Technischer Jugendmedienschutz](https://www.kjm-online.de/themen/technischer-jugendmedienschutz/), abgerufen 20.09.2026.

---

## 2 · Welche Wege die KJM anerkennt

| Weg | Beispiele aus der Positivliste | Was er verlangt |
|---|---|---|
| **Biometrische Altersschätzung** | Ageware · airis:ident · ComplyCube · FaceAssure | Neuronales Netz schätzt das Alter aus einem Gesichtsbild. **Pflichtpuffer**, nicht abschaltbar |
| **Ausweisprüfung mit Lebenderkennung** | AutoIdent + Liveness · Checkout Identity | Ausweisdokument plus Nachweis, dass eine lebende Person davorsitzt |
| **Bankweg** | insic · Klarna Sign-in | Identifizierung über ein bestehendes Bankkonto |
| **Persönliche Prüfung** | Hermes AltersCheck | Ausweisprüfung bei der Zustellung |

Beim ersten positiv bewerteten System mit biometrischer Alterskontrolle — **FaceAssure der Privately SA**, Pressemitteilung 22/2022 vom **07.11.2022** — galt: Die Nutzerin oder der Nutzer muss als **mindestens 23 Jahre** erkannt werden, um Inhalte ab 18 zu sehen (Sicherheitspuffer von fünf Jahren), es gibt Kontrollfunktionen gegen Standbilder, und **die biometrischen Daten bleiben ausschließlich auf dem Endgerät.** Die KJM stufte es als „Teillösung auf Identifizierungsebene" ein. Zu diesem Zeitpunkt lagen 102 positiv bewertete Konzepte oder Module vor.

Die allgemeine Themenseite der KJM nennt für Systeme dieser Art einen **Puffer von drei Jahren als nicht veränderbare Voreinstellung.** Die beiden Angaben widersprechen sich nicht: Der Puffer wird je Konzept festgelegt, nicht pauschal.

**Quellen:** [KJM · Pressemitteilung zur biometrischen Alterskontrolle](https://www.kjm-online.de/presse/pressemitteilungen/kjm-bewertet-altersverifikationssystem-mit-biometrischer-alterskontrolle-positiv/) · [KJM · Technischer Jugendmedienschutz](https://www.kjm-online.de/themen/technischer-jugendmedienschutz/), beide abgerufen 20.09.2026.

### Was das für uns heißt

**Die gute Nachricht:** „Bilder, die eine KI auswertet" — dein Wortlaut aus der Anfrage — ist **kein Behelf, sondern ein anerkannter Weg.** Das teuerste Verfahren ist nicht vorgeschrieben.

**Die unangenehme Nachricht:** Ein Puffer von drei bis fünf Jahren heißt, dass ein 19-Jähriger durch die Prüfung fallen kann. Er braucht dann einen zweiten Weg — und der ist der teure. Die Zielgruppe ist jung; in der Kostenrechnung ist bisher niemand eingeplant, der beide Wege geht.

---

## 3 · d-you — ~~die Entwicklung, die alles verändert~~ bestätigt, was Z-03 schon als Weg 1 führt

Am **02.01.2027** läuft der Stichtag aus eIDAS 2.0 ab, zu dem jeder Mitgliedstaat eine Brieftasche anbieten muss; die deutsche heißt **d-you**. *(Präzisiert am 26.09.2026: Das Bundesministerium für Digitales und Staatsmodernisierung nennt auf seiner Meldungsseite als Startzeitpunkt nur **„Anfang 2027"** ohne Tag — abgerufen 26.09.2026, <https://bmds.bund.de/aktuelles/aktuelle-meldungen/detail/meldung-eudi-wallet>. Für die Planung gilt „Anfang 2027", der Tag ist der Rechtsstichtag und keine bestätigte Freigabe.)* Sie kommt vom Bundesministerium für Digitales und Staatliche Modernisierung, rund 40 Partner aus Wirtschaft, Wissenschaft und Verwaltung bringen zum Start Dienste mit.

| | |
|---|---|
| **Kosten für den Bürger** | kostenlos, Nutzung freiwillig |
| **Wo die Daten liegen** | verschlüsselt auf dem Gerät, nicht in der Cloud |
| **Quelltext** | veröffentlicht |
| **Altersnachweis** | ausdrücklich als Anwendung zum Start genannt |
| **Was der Dienst erfährt** | nach Kristina Yasuda, Identitätsarchitektin des nationalen Projekts: „Dienste erhalten lediglich die Information, dass eine Altersgrenze erfüllt wird" |

Deutschland verzichtet ausdrücklich auf die separate EU-Alters-App und setzt stattdessen auf diese Brieftasche.

**Quellen:** [Biometric Update · Germany unveils national EUDI wallet ‚d-you'](https://www.biometricupdate.com/202609/germany-unveils-national-eudi-wallet-d-you) · [iphone-ticker · Deutschland verzichtet auf EU-Alters-App](https://www.iphone-ticker.de/deutschland-verzichtet-auf-eu-alters-app-und-setzt-auf-eudi-wallet-279851/) (17.06.2026), beide abgerufen 20.09.2026.

### Warum das für dieses Projekt größer ist als für andere

Rechnet man vom realen Start aus: Selbst im späteren Planungsfall nach Nr. 45 liegt der Start **mehr als zwei Jahre nach** dem Erscheinen von d-you. Die Brieftasche wird dann kein Nischenwerkzeug mehr sein.

Für Cruizy passt sie besser als jede kommerzielle Lösung — und zwar aus vier Gründen, die alle schon anderswo im Projekt stehen:

1. **Sie erfüllt Grundsatz G-01 vollständig.** Staatlich, in Deutschland, Daten auf dem Gerät. Kein Auftragsverarbeiter, kein Drittland, kein Vertrag.
2. **Sie beantwortet den Einwand aus dem Einwand-Handbuch,** dass eine Altersprüfung die Anonymität zerstört: Wir erfahren „ja" oder „nein", sonst nichts.
3. **Sie kostet den Nutzer nichts** — die größte Hürde bei kommerziellen Verfahren ist nicht die Technik, sondern das Unbehagen.
4. **Sie löst den Puffer-Fall.** Wer bei der Schätzung durchfällt, hat einen zweiten Weg, der weder Geld noch ein Ausweisfoto an einen Anbieter kostet.

**Was sie nicht löst:** die Authentifizierung aus Abschnitt 1. Auch eine Brieftasche sagt nur einmal, dass jemand volljährig ist.

**Was offen ist und erfragt werden muss:** Was ein Dienst (eine „vertrauende Partei") für die Nutzung zahlt und welche Registrierung er dafür braucht. Das steht in keiner der gefundenen Quellen. **Gehört zu Nr. 7.**

---

## 4 · Die Authentifizierung — ~~die Lücke~~ was schon geregelt ist und was offen bleibt

Die Identifizierung ist gelöst, sobald die Rechtsfrage K1 beantwortet ist: Es gibt mehrere anerkannte Wege, der billigste ist anerkannt, und ab 2027 kommt ein kostenloser staatlicher dazu.

~~**Die Authentifizierung ist nicht gelöst, und sie steht in keinem Projektdokument.**~~

**Korrigiert:** Für **Stufe 2** ist sie geregelt — Z-03, FV-87: Geräteschlüssel oder Gerätesperre, je Sitzung und nach einer Pause. **Offen sind zwei Dinge:**

1. **Stufe 1.** Falls die Anwaltsfrage K1 ergibt, dass die **ganze** App eine geschlossene Benutzergruppe sein muss, braucht auch das Schreiben eine Authentifizierung je Sitzung — nicht nur Zone 2. Die Spezifikation sieht das bisher nicht vor.
2. **Der Passkey in FV-87.** Henry hat Passkeys am 21.09.2026 ausgeschlossen (Nr. 69), gemeint im Zusammenhang der Wiederherstellung und wegen der Synchronisierung über US-Dienste. FV-87 nennt den Passkey als Geräteschlüssel. **Vorschlag:** nur **gerätegebundene Schlüssel, die nicht synchronisiert werden** — oder allein die Gerätesperre. Dann verlässt nichts das Gerät, und die Authentifizierung bleibt. Steht in der Prüfliste der Festlegungen.

Die folgenden vier Bauweisen bleiben als Einordnung stehen; **A entspricht dem, was FV-87 bereits festlegt.**

Zur Wahl stehen vier Bauweisen. Alle vier haben in einer App, die Anonymität verspricht, einen Preis:

| | Wie | Was es kostet — nicht in Geld |
|---|---|---|
| **A** | **Gerätebindung.** Der Zugang gilt für das Gerät, auf dem geprüft wurde. Neues Gerät → neue Prüfung | Wer zwei Geräte nutzt, prüft zweimal. Wer sein Telefon verliert, steht vor Nr. 69 |
| **B** | **Zweiter Faktor bei jeder Anmeldung** — Code per Mail oder SMS | Bequem gebaut, aber es ist kein Nachweis derselben *Person*, nur desselben *Postfachs*. Ob die KJM das genügen lässt, ist eine Anwaltsfrage |
| **C** | **Erneute Schätzung in Abständen** — alle 90 Tage ein Selfie | Nah an dem, was die KJM meint. Aber jede Wiederholung ist ein Moment, in dem jemand aussteigt |
| **D** | **Brieftasche bei jeder Anmeldung** | Technisch sauber, setzt aber voraus, dass alle die Brieftasche haben |

**Mein Vorschlag: A als Grundlage, C als Auffrischung in großem Abstand, D sobald verbreitet.** Gerätebindung ist die einzige Variante, die nichts zusätzlich erhebt — sie nutzt, was ohnehin da ist.

> ~~**⚠ Widerspruch, der dabei auffällt und nicht aufgelöst wird:**~~ **Korrigiert 21.09.2026 — kein Widerspruch:** FV-87 ist eine gerätegebundene Authentifizierung, am Konto hängt nur die Identifizierung; genau diese Trennung verlangt das Raster. *Ursprünglicher, falscher Text:* Die Produktspezifikation legt in **FV-87** fest, dass der Prüfstatus **am Konto hängt, nicht am Gerät** — genau deshalb kann jemand auf einem neuen Gerät weitermachen, ohne sich erneut zu identifizieren (Ablauf AB-10, Schritt 5). Eine Gerätebindung als Authentifizierung widerspricht dem. Beides zusammen geht nicht: Entweder ist der Status kontogebunden und dann leicht weiterzugeben, oder er ist gerätegebunden und dann ist der Gerätewechsel unbequem. **Das ist keine Kleinigkeit** — es ist derselbe Zielkonflikt wie bei Nr. 69, nur an anderer Stelle. Die Auflösung gehört in dieselbe Entscheidung wie Nr. 40.

~~**Das gehört als neue Frage in den Anwaltstermin:**~~ **Korrigiert 21.09.2026 — keine neue Frage:** *Welche Maßnahme auf der Authentifizierungsebene genügt dem Raster der KJM bei einem Angebot dieser Art — und genügt eine Gerätebindung?* steht bereits als zweiter Teil von **K1** in Nachtrag 03. Neu ist nur der Zusatz zu Stufe 1 und zum Passkey; er steht als **K1a** in `anwaltstermin/nachtrag-04-fragen-19-bis-21-september-2026.md`.

---

## 5 · Was das für Nr. 40 bedeutet — die Zwei-Stufen-Architektur

Die bisherige Annahme lautete: Stufe 1 ist die billige Schätzung für alle, Stufe 2 ist die teure volle Identifizierung für den privaten expliziten Bereich.

**Nach dieser Recherche liegt der Schnitt anders.** Die Schätzung *ist* bereits eine anerkannte Identifizierung. Der Unterschied zwischen den Stufen ist deshalb nicht „ungefähr" gegen „richtig", sondern:

| | **Stufe 1 — Zugang zum Schreiben** | **Stufe 2 — privater expliziter Bereich** |
|---|---|---|
| **Wofür** | Nr. 64: vor der ersten Nachricht, vor jeder Buchung | Zone 2 nach A-37 |
| **Wege** | Altersschätzung mit Puffer · eID · ab 2027 d-you | dieselben Wege, **aber** mit Authentifizierung nach Abschnitt 4 |
| **Was wir speichern** | „volljährig: ja" (FV-16) | zusätzlich: die Bindung, die die Wiedererkennung trägt |
| **Der Unterschied** | einmalige Feststellung | **wiederholte Feststellung derselben Person** |

**Das ist eine bessere Architektur als die bisher geplante** — und eine billigere. Sie verlangt keine zweite, teurere Prüftechnik, sondern eine zweite *Verlässlichkeitsstufe* auf derselben Technik.

**Was sich dadurch am Kapitalbedarf ändert:** Die Spanne von 95.258 € bis 166.548 € kam wesentlich daher, dass für Stufe 2 mit teuren Ausweisprüfungen je Nutzer gerechnet wurde. Fällt diese Annahme, fällt das obere Ende. **Nachgerechnet wird das, sobald Nr. 40 entschieden ist** — vorher wäre es eine Zahl auf einer Vermutung. *(Stand 21.09.2026: A-52 hat das Modell mit allen Beschlüssen vom September fortgeschrieben; die Spanne liegt jetzt bei 143.397 € bis 245.841 €. Die Architektur dieses Abschnitts ist darin noch nicht gerechnet, weil Nr. 40 offen ist.)*

---

## 6 · Was das für Nr. 51 bedeutet — der Satz stimmt nicht

Handbuch A legt wörtlich fest:

> „Wir können dich nicht identifizieren. Ein Gericht kann es über unseren Prüfpartner. Genau deshalb ist diese App für Täter uninteressant."

**Satz 2 ist nach dieser Recherche in zwei von drei Fällen falsch:**

| Weg | Kann ein Gericht die Person über den Prüfpartner ermitteln? |
|---|---|
| **Altersschätzung** (FaceAssure-Bauart: Daten bleiben auf dem Gerät) | **Nein.** Es gibt nichts zu ermitteln. Der Prüfpartner hat die Person nie gesehen |
| **d-you / Brieftasche** | **Nein.** Der Dienst erfährt nur „Altersgrenze erfüllt". Die Brieftasche gibt die Identität nicht heraus |
| **eID oder Ausweisprüfung** | **Ja** — aber nur, wenn der Anbieter die Daten aufbewahrt, und das wollen wir vertraglich gerade ausschließen (Nr. 7: „Sofortlöschung vertraglich") |

Der Satz verspricht also eine Abschreckung, die das eigene Datensparsamkeitsversprechen gerade verhindert. **Beides gleichzeitig geht nicht.** Das ist kein Detail: Der Satz ist ein tragender Teil der Außendarstellung und steht so in den Systemtexten.

### Vorschlag für eine Neufassung

> **Wir wissen nicht, wer du bist — und wollen es nicht wissen.** Wir prüfen einmal, ob du volljährig bist, und speichern davon nur „ja". Kein Name, kein Geburtsdatum, kein Ausweisbild.
>
> **Was das für Täter heißt:** Wer hier etwas tut, was strafbar ist, hinterlässt trotzdem Spuren — Meldungen, Inhalte, Zeitpunkte, Geräte. Die geben wir auf richterliche Anordnung heraus. Was wir nicht herausgeben können, ist ein Name, den wir nie hatten.

**Das ist ehrlicher und trotzdem abschreckend** — und es widerspricht der Datensparsamkeit nicht. Die Fassung geht in die Systemtexte, sobald Nr. 51 entschieden ist.

---

## 7 · Was zu tun ist

| | Was | Wer | Wann |
|---|---|---|---|
| 1 | ~~**Neue Anwaltsfrage**~~ **K1, zweiter Teil** (steht schon in Nachtrag 03): Welche Authentifizierungsmaßnahme genügt dem KJM-Raster — reicht Gerätebindung? Dazu neu **K1a** (Stufe 1, Passkey) in Nachtrag 04 | Anwalt, zusammen mit K1 | Anwaltstermin |
| 2 | **Nr. 40 nach dem Schnitt aus Abschnitt 5 entscheiden** | Gründer | vor Phase 1b |
| 3 | **Nr. 51: Satz ersetzen** durch die Fassung aus Abschnitt 6 | Gründer | vor den Systemtexten |
| 4 | **d-you als Weg einplanen**, Registrierungs- und Kostenfrage an das Ministerium richten | Gründer | V1, weil Vorlauf |
| 5 | **Anbieteranfrage Nr. 7** um die Puffer-Frage erweitern: *Wie viele 18- bis 21-Jährige fallen durch?* | Gründer | V0 anfragen |

---

## 8 · Was dieser Bericht nicht ist

- **Keine Antwort auf K1.** Ob die geschlossene Benutzergruppe überhaupt greift, entscheidet der Anwalt.
- **Keine Preisliste.** Keine der Quellen nennt belastbare Sätze je Prüfung. Alles, was dazu bisher im Projekt steht, sind Annahmen.
- **Keine Produktentscheidung.** Die Vorschläge in Abschnitt 4, 5 und 6 sind Vorschläge.
- **Kein Ersatz für eine erneute Prüfung vor dem Bau.** Zwischen heute und dem realen Start liegen mindestens zwei Jahre. d-you erscheint erst, das Raster kann sich ändern, und die Beobachtung R-01 führt es ab jetzt mit.

---

## Quellen

| Quelle | Inhalt | Abgerufen |
|---|---|---|
| [KJM · Technischer Jugendmedienschutz](https://www.kjm-online.de/themen/technischer-jugendmedienschutz/) | Identifizierung und Authentifizierung, anerkannte Verfahren, Pufferregel | 20.09.2026 |
| [KJM · Pressemitteilung 22/2022](https://www.kjm-online.de/presse/pressemitteilungen/kjm-bewertet-altersverifikationssystem-mit-biometrischer-alterskontrolle-positiv/) | FaceAssure, 07.11.2022, Puffer fünf Jahre, Daten auf dem Gerät, 102 bewertete Konzepte | 20.09.2026 |
| [KJM · Altersverifikationssysteme, weitere Bewertungen](https://www.kjm-online.de/presse/pressemitteilungen/kjm-bewertet-weitere-altersverifikationssysteme-positiv/) | Fortschreibung der Positivliste | 20.09.2026 |
| [FSM · Altersverifikationssysteme / Geschlossene Benutzergruppen](https://www.fsm.de/wissen/a-bis-z/altersverifikationssysteme-geschlossene-benutzergruppen/) | Einordnung, Begriffe | 20.09.2026 |
| [Biometric Update · Germany unveils national EUDI wallet ‚d-you'](https://www.biometricupdate.com/202609/germany-unveils-national-eudi-wallet-d-you) | Start 02.01.2027, kostenlos, Daten auf dem Gerät, Altersnachweis | 20.09.2026 |
| [iphone-ticker · Deutschland verzichtet auf EU-Alters-App](https://www.iphone-ticker.de/deutschland-verzichtet-auf-eu-alters-app-und-setzt-auf-eudi-wallet-279851/) | Begründung, Zeitplan, Zitat Yasuda; Artikel vom 17.06.2026 | 20.09.2026 |
