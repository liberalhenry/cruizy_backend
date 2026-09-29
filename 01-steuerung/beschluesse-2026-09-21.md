# Beschlüsse vom 21.09.2026 — zweite Runde

**Grundlage:** Antwort von Henry Luca Kurz am 21.09.2026 auf die Rückfragen vom 19. und 20.09.2026.
**Verbindlichkeit:** wie beim Beschlussdokument vom 19.09.2026. Status steht in `offene-entscheidungen.md`; wo eine Antwort eine neue Frage erzeugt, steht sie hier und dort als neue Nummer (**Nr. 83 bis 87**).
**Was dieses Dokument nicht ist:** keine Rechtsberatung, keine Neufassung der Handbücher (Nr. 81: Regel bleibt).

---

## Auf einen Blick

| | |
|---|---|
| Beantwortete Punkte | **17** |
| Vollständig entschieden | **13** |
| Richtung vorgegeben, Ausarbeitung durch die KI | **4** (Check-in, Codes, Standortanzeige, Hauspartys) |
| Neue Entscheidungen aus den Antworten | **5** (Nr. 83 bis 87) |
| Entsperrte KI-Aufgaben | **3** — A-52 Finanzmodell, A-54 Mobilnummer, A-55 Veranstaltungen |
| Befunde, die eine Vorgabe technisch begrenzen | **2** — stiller Notruf und automatische Nachricht bei ausgeschaltetem Telefon |

---

## 1 · Bauen und Prüfen

### Nr. 73 — Modell A, vollständige Prüfung

> „Modell A soll umgesetzt werden. Ich will wasserdichten Code, keine reine Risikobegrenzung in 20 % des Codes mit dem größten Risiko."

**Beschlossen:** Die Prüfung am Ende erfasst **den gesamten Code**, nicht die kritischen zwanzig Prozent. Angesetzt wird die vollständige Prüfung (**10.800 € bis 21.600 €** für eine Plattform, nach A-51 für zwei Plattformen **10 bis 20 Prozent darüber**).

**Was der Beschluss nicht leisten kann — ehrlich festgehalten:** „Wasserdicht" gibt es bei Software nicht. Eine vollständige Prüfung durch einen erfahrenen Menschen senkt die Zahl der Fehler erheblich und findet die gefährlichen am ehesten — aber sie garantiert keine Fehlerfreiheit. Wer das verspricht, verkauft etwas. **Was Wasserdichtigkeit am nächsten kommt, ist die Kombination:** vollständige Prüfung am Ende, die eigenen Prüfläufe nach S3 und S11 (A-51), der Penetrationstest (4.000 €) und die Abnahmeliste je Sitzung. Alle vier bleiben.

---

## 2 · Die 92 Festlegungen

### Nr. 68 — Option B, die zwölf folgenschwersten zuerst

> „Als Option wähle ich B, schicke mir alle, stelle aber die zwölf folgenschwersten an den Anfang."

**Beschlossen:** Eine Prüfliste mit allen 92 Festlegungen; die zwölf folgenschwersten stehen vorn und haben je zwei bis drei Wahlmöglichkeiten. Rückmeldung in gelben Spalten. Ergebnis: `../50-produkt-prototyp/festlegungen-pruefliste.xlsx`.

**Dazu klargestellt — das Alter:**

> „Das Alter wird nicht gespeichert auf den Servern, sehr wohl können die Leute aber nach Alter filtern bei der Suche und die Leute Alter in ihren Profilen selber festlegen. Prüfen tun wir aber nicht, ob 25 stimmt, sondern ob 18 plus oder drunter."

**Beschlossen:** Zwei Dinge sind zu trennen, und die Spezifikation tut das bereits:

| | Was | Wo gespeichert | Geprüft? |
|---|---|---|---|
| **Prüfergebnis** | „volljährig: ja oder nein" | am Konto, **sonst nichts** (FV-16) | ja — die Altersprüfung |
| **Profilalter** | die Zahl, die jemand im Profil angibt | am Profil (FV-23), weil der Filter sie braucht | **nein** — Selbstangabe |

**Ein Punkt, der in die Prüfliste gehört:** FV-23 speichert das Profilalter als **Monat und Jahr der Geburt**, damit es sich von selbst weiterzählt. Das ist genauer als nötig — ein Geburtsmonat ist zusammen mit einer Stadt ein halbes Identifizierungsmerkmal. Die Alternative (nur die Zahl, jährlich zur Bestätigung vorgelegt) ist datensparsamer und unbequemer. Steht in der Prüfliste unter den zwölf.

---

## 3 · Sicherheit

### Nr. 66 — Check-in nach Henrys Ablauf

> „Erst nach 15 Minuten die Frage, ob alles gut läuft. Wenn ja gedrückt wird, ist alles super und es passiert nichts. Reagiert die Person mit ‚nein', werden sofort die Notfallkontakte angezeigt (mit Button ‚jetzt informieren') und es gibt zusätzlich einen Button zum Absenden eines Notrufs. […] Reagiert die Person schlicht nicht, wird erneut nach 30 und nach 60 Minuten nachgefragt. Ist nach einer Stunde immer noch keine Reaktion eingetroffen, kann der Benutzer vorher in den Einstellungen festlegen, was passieren soll: Nachricht an Vertrauensperson oder schlicht gar nichts. Die Menschen müssen auch keine Person hinterlegen. Gespeichert werden die Daten aber nur auf dem Handy, nie auf unseren Servern."

**Beschlossen:**

| Zeitpunkt | Was geschieht |
|---|---|
| **+15 Min.** | „Läuft alles gut?" |
| Antwort **Ja** | nichts — kein Alarm |
| Antwort **Nein** | sofort: Notfallkontakte mit „Jetzt informieren" (vorgefertigte Nachricht) · Notruf · Verhaltenshinweise |
| **keine Antwort** | erneute Frage bei **+30** und **+60 Min.** |
| **+60 Min. unbeantwortet** | was die Person **vorher** eingestellt hat: Nachricht an Vertrauensperson **oder gar nichts** |
| **Daten** | Kontakte, Ort, Zeit, Nachricht: **nur auf dem Telefon** |
| **Pflicht** | keine — niemand muss eine Person hinterlegen |

**Die Vision wird übernommen. Zwei Befunde begrenzen sie technisch — beide sind benannt, keiner ist aufgelöst:**

**Befund 1 — stiller Notruf:** Eine App kann in Deutschland **keinen stillen Alarm an die Polizei** auslösen. Es gibt aber die offizielle Notruf-App der Bundesländer, **nora**, mit einem **„stillen Notruf"**: Die Leitstelle schreibt ausschließlich im Chat, ruft nicht zurück, und die App gibt keine Töne von sich. Sie ist für alle nutzbar, nicht nur für Menschen mit Behinderung. **Aber:** Sie verlangt eine **Registrierung vorher** — im Ernstfall lässt sie sich nicht einrichten —, und sie ist für andere Apps **nicht angebunden**. Folge: Der Notrufknopf bietet **zwei Wege** — „110 anrufen" und „nora öffnen" —, und der Check-in empfiehlt beim ersten Einrichten, nora vorher zu registrieren. Einzelheiten: `../50-produkt-prototyp/check-in-konzept.md`.

**Befund 2 — die Nachricht nach 60 Minuten:** iOS lässt Apps keine SMS ohne Tippen verschicken, und die Web-Fassung kann gar keine. Eine Nachricht, die ohne Zutun hinausgeht, muss deshalb **über unseren Server** laufen — schon bei eingeschaltetem Telefon. Das lässt sich ohne Speicherung lösen: Das Telefon schickt Kontakte und Text zur fälligen Minute, der Server reicht sie weiter und löscht sofort. **Aber in genau dem Fall, für den die Funktion gebaut ist — Telefon weggenommen, aus, kein Netz —, geht dann nichts hinaus.** Daraus folgt **Nr. 83**.

**Rückfrage beantwortet — „Check-in ohne Treffen-Partner":** siehe Abschnitt 8 und **Nr. 84**.

### Nr. 69 — Wiederherstellung: 1 + 2 + 5 + 4, 6 als Text

> „Wir nehmen das: 1 + 2 + 5 zusammen, 6 als Text. […] Allerdings nehmen wir auch die Option 4 mit rein (mit einem oder wie vielen auch immer man hinterlegen will) als freiwillige Option. […] Die Sache mit den Passkeys ist zu USA und DSGVO kritisch, das lassen wir definitiv raus. Nichts ist eine Pflicht, den Code bekommt jeder am Anfang, alles andere kann man, muss man aber nicht. Wer dann aber nichts auswählt und den Code verliert, verliert den Account danach — das klar kommunizieren."

**Beschlossen:**

| | Weg | Pflicht? |
|---|---|---|
| 1 | **Wiederherstellungscode** beim Anlegen, nach sieben Tagen einmal nachgefragt | **jeder bekommt ihn** |
| 2 | **Zweiter Anmeldeweg** (Mail oder Mobilnummer), freundlich empfohlen, überspringbar | freiwillig |
| 4 | **Vertrauenspersonen**, eine oder beliebig viele | freiwillig |
| 5 | **Zahlungsbeleg** als stiller Zusatzweg | — |
| 6 | **Klarer Satz:** Wer nichts wählt und den Code verliert, verliert das Konto | Text |
| 3 | **Passkeys** | **ausgeschlossen** (G-01) |

**Ein Widerspruch, der benannt werden muss:** Nr. 66 legt fest, dass Vertrauenspersonen **nur auf dem Telefon** liegen. Wiederherstellung wird aber gerade dann gebraucht, wenn **das Telefon weg ist**. Eine Liste, die nur auf dem verlorenen Gerät steht, kann niemanden wiederherstellen. **Die Auflösung, die beide Zusagen hält, ist Nr. 86:** Der Wiederherstellungsschlüssel wird in Teile zerlegt, jede Vertrauensperson bekommt einen Teil, und wir speichern nicht, wer sie sind.

### Nr. 77 — Ersatzpunkt getrennt, 500-Meter-Grenze, Reisehinweis

> „Finde die Idee, das getrennt zu machen, super. Für Umsehen weiter weg würden wir ohnehin die Travel-Funktion nehmen. […] Unter 500 m darf er nicht anzeigen, wo man ist, wegen Stalking oder Übergriffen. Es soll aber trotzdem eine Entfernung angezeigt werden, sonst verliert es den Reiz. […] Und wenn wer über Travel anschreibt, sieht man das im Chat oder Profil."

**Beschlossen:**

1. **Zwei getrennte Regler:** „Mein angezeigter Ort" (was andere sehen; Ersatzpunkt kostenlos bis 30 km) und „Ich suche in" (was ich sehe; eigene Region kostenlos, andere Region = Travel im Abo).
2. **Eine Entfernung wird immer angezeigt** — auch bei Ersatzpunkt, dann vom Ersatzpunkt aus gerechnet, mit dem Hinweis **„ungefährer Ort"**.
3. **Nie genauer als 500 Meter.** *Das ist schon strenger umgesetzt:* Handbuch A legt verbindlich vier Bänder fest, das feinste ist **„unter 1 km"**, und Meterangaben gibt es nirgends. Die Vorgabe ist damit erfüllt, ohne dass etwas geändert werden muss.
4. **Wer über Travel schreibt, ist erkennbar** — im Gespräch und im Profil steht „schreibt aus [Stadt]".

Ausgearbeitet in `../50-produkt-prototyp/standortanzeige-konzept.md`. Offen: **Nr. 85** (was zum Travel-Paket gehört).

---

## 4 · Geld und Codes

### Nr. 60 — Codes, Weg B, mit Insolvenzklausel

> „Wir möchten Codes haben und vergeben können, beispielsweise auch an Streamer oder Influencer, die für uns werben, oder eben für Crowdfunder. Diese sollten dann in der App einlösbar sein. Wir würden gerne Weg B wählen, damit es definitiv zeitlich begrenzt ist, mit Klausel, dass die Codes im Falle einer Auflösung der Firma oder Insolvenz verfallen. Die Codes sollen dann beispielsweise von uns auf Flyer gedruckt werden können, oder automatisiert an wen verschickt werden können, wenn er eine bestimmte Summe gespendet hat."

**Beschlossen:** Ein allgemeines Codesystem mit **befristeten** Codes, für Crowdfunding, Werbepartner, Flyer und Einladungen; Verfall bei Auflösung oder Insolvenz; automatischer Versand bei Erreichen einer Unterstützungssumme.

**Eine Vorgabe, die sich so nicht umsetzen lässt — und der Weg, der trotzdem geht:** „In der App einlösbar" gilt für die **Web-Fassung** ohne Einschränkung. In der **iOS-App** verbietet Apples Richtlinie 3.1.1 ausdrücklich „eigene Mechanismen, um Inhalte freizuschalten, etwa Lizenzschlüssel und QR-Codes". Erlaubt ist nach 3.1.3(b), dass die App Berechtigungen anerkennt, die **auf der Webseite** erworben wurden — sofern dasselbe auch als In-App-Kauf angeboten wird. **Folge:** Eingelöst wird immer auf der Webseite; die Berechtigung hängt danach am Konto und gilt überall. Der QR-Code auf dem Flyer führt auf diese Seite — das ist erlaubt, weil ihn die Kamera des Telefons liest, nicht die App. Ausgearbeitet in `../40-finanzen-foerderung/codesystem-konzept.md`.

### Nr. 78 — Keine Werbung

> „Wir bleiben dann ohne Werbung, finde ich gut. Über Pop-ups kann man später nachdenken als eine Art Eigenwerbung zu unseren Events und Partys oder zu den Bars, Konzerten usw. Aber keine Werbung im klassischen Sinne."

**Beschlossen:** **Keine Werbung.** Regel R6 und Handbuch A gelten unverändert; es wird keine werbefreie Stufe gebaut, weil es nichts gäbe, wovon sie frei wäre.

**Für später vorgemerkt:** Hinweise auf **eigene** Veranstaltungen berühren kein Prinzip. Hinweise auf **fremde** Bars und Konzerte schon, sobald dafür Geld fließt — dann ist es gekaufte Sichtbarkeit (Prinzip 5, **Nr. 65**). Daraus folgt **Nr. 87**, ausdrücklich ohne Eile.

---

## 5 · Tor 2 und Notfall

### Nr. 15 — Regel D, Folge A, C steht ausdrücklich im Text

**Beschlossen:** Wird Tor 2 gerissen, gibt es **90 Tage Verlängerung — aber nur, wenn ein vorher benannter Frühindikator bereits steigt.** Steigt er nicht, wird das **Format geändert** (andere Stadt, anderer Kanal, anderer Zuschnitt). Die **geordnete Beendigung** steht ausdrücklich als Möglichkeit im Text. Ausformuliert in `zusagen-tor-2-und-notfall.md`.

### Nr. 16 — Notfallreihenfolge bestätigt, mit CSD-Klausel

> „Nehme die Sparliste so wie sie ist, füge aber eine Klausel ein, dass der CSD gestrichen wird in allen Folgejahren, der zur Gründung MUSS aber stattfinden, am Start zu sparen wäre ja Quatsch."

**Beschlossen:** Die Reihenfolge aus Handbuch B, Teil IX gilt. **Der CSD-Auftritt zum Start ist von der Streichliste ausgenommen**; gestrichen werden kann nur der CSD der Folgejahre. Damit ist der Widerspruch vom 20.09.2026 aufgelöst — durch Beschluss, nicht stillschweigend.

---

## 6 · Gesellschaftsvertrag

### Nr. 4 — neun Punkte mit Haltung

**Beschlossen, mit Wortlaut in `../10-recht-gruendung/rechtstexte-entwuerfe/gesellschaftsvertrag-eckpunkte-ENTWURF.md`:**

| | Punkt | Haltung der Gründer |
|---|---|---|
| 2 | Verteilung | **50/50.** Wer später mehr Geld einbringt, kann dafür mehr Anteile bekommen |
| 3 | Stichentscheid | **Ressortprinzip:** Jeder entscheidet in seinem Bereich (Nicolas: Technik; Henry: Marketing, Veranstaltungen, Partnerschaften mit Clubs). **Bei Grundsatzfragen:** Mediation, danach entscheidet eine **Beiratsperson**, die alle Argumente hört |
| 4 | Vesting | Nicht verdiente Anteile gehen im Ausscheidensfall **zum Nennwert** an die Verbleibenden, **anteilig**; dazu **Kaufoption mit Stimmrechts- und Notarvollmacht**, damit die Übertragung nicht blockiert werden kann |
| 5 | Ausscheiden | wie vorgeschlagen: Buchwert, drei Jahresraten |
| 6 | Reduzierte Mitarbeit | Vesting **ruht**, wenn einer zwölf Monate nur stark reduziert beiträgt — **aber nicht**, wenn beide gleichermaßen reduzieren |
| 7 | Wettbewerbsverbot | zwei Jahre, DACH, Dating und Cruising — gilt nach Ausscheiden oder Ausschluss; **bei einvernehmlicher Trennung durch Konsens aufhebbar** |
| 8 | Mitverkauf | wie vorgeschlagen |
| 9 | Geschäftsführung | Zustimmung ab **5.000 €**; einzelne Fachbereiche können durch **vorherigen gemeinsamen Beschluss** höher freigestellt werden (Beispiel: Henry für Veranstaltungen bis 30.000 €) |
| 10 | Gründungsaufwand | **Henrys Formulierung** — bis 2.500 €, höchstens tatsächliche Kosten, Rest nach Anteilen |
| — | **Allgemein** | **Good Leaver und Bad Leaver unterscheiden**, wo es relevant ist |

**Vier Stellen, an denen ich widerspreche oder präzisieren muss** — ausgeführt im Eckpunktepapier:

1. **„Mehr Geld, mehr Anteile" braucht eine Bewertungsregel.** Ohne sie kauft ein zusätzlicher Euro zum Nennwert einen Anteil, der ein Vielfaches wert ist. Zwei saubere Wege: Anteile zu einer **festgestellten Bewertung** oder statt Anteilen ein **Gesellschafterdarlehen**.
2. **Ein Investor mit wenigen Prozent als Stichentscheider** ist ein Königsmacher: Wer bei 49/49/2 jede Pattsituation entscheidet, steuert die Firma mit zwei Prozent. Der Beirat sollte deshalb **auch nach dem Einstieg eines Investors** bleiben.
3. **„Stark reduziert" braucht ein Maß**, sonst entscheidet es der Streit. Vorschlag: ein relatives Maß mit vierteljährlichem Gespräch.
4. **30.000 € je Vorhaben** sind bei einem Kapitalbedarf um 100.000 € zu viel, wenn es keine Jahresgrenze gibt. Zwei solche Abschlüsse leeren das Konto. Vorschlag: Freistellung **innerhalb eines beschlossenen Jahresbudgets**.

---

## 7 · Veranstaltungen und CSD

### Nr. 82 — Private Veranstaltungen mit Bewerbung

> „Man kann ein Event erstellen und eintragen, wie viele Leute theoretisch kommen können, dann kann man sich anmelden und der Veranstalter kann mit der Person chatten […]. Passt es, kann die Person die Anmeldung annehmen und der, der sich anmelden wollte, kriegt eine Bestätigung zugesendet plus Adresse, Uhrzeit usw. (wir sind dann ja abgesichert, weil er bestätigt hat, nicht wir) — muss auch irgendwo in einen Disclaimer rein. Bei Ablehnung bekommt man eine freundliche automatisierte Ablehnung. Und ja, die Gästeliste soll nur der Anbieter sehen."

**Beschlossen:** Anmeldung mit Höchstzahl, Gespräch vor der Zusage, Adresse erst nach Annahme, freundliche automatische Absage, Gästeliste nur für den Gastgeber, Hinweis in den Bedingungen. Ausgearbeitet in `../35-veranstaltungen/veranstaltungskonzept.md` (A-55).

**Präzisierung zu „wir sind abgesichert":** Das trifft zu, soweit wir als Plattform die Zusage nicht selbst geben — aber nur im Rahmen der Haftungsprivilegien für Vermittlungsdienste, und nur, wenn wir auf Meldungen reagieren. Ein Hinweis in den Bedingungen ist nötig und sinnvoll; er ist kein Freibrief. **Neue Anwaltsfrage V10.**

### Nr. 80 — CSD grob überschlagen, Rest ergibt sich

**Beschlossen:** Stände sind machbar; beim Wagen wird geschaut, wen man findet — Mitfahren oder Teilen ist ausdrücklich erwünscht. Grobe Schätzung ins Finanzmodell, als Spanne.

**Was die Recherche dazu sagt:** Ein fertiger Paradewagen kostet **2.500 € bis 10.000 € netto** und fasst 25 bis 100 Personen; die Anmeldegebühr beim CSD-Verein reicht **von rund 20 € bis in den vierstelligen Bereich**; Selbstbau ist „aufwendig, aber deutlich günstiger"; und Wagen werden üblicherweise über **Mitfahrkarten zu 20 € bis 70 €** je Person mitfinanziert. Quelle: [CSD-Termine · CSD-Wagen mieten](https://www.csd-termine.de/infothek/csd-wagen-mieten-paradetruck-showtruck), abgerufen 21.09.2026.

---

## 8 · Die Rückfrage, die unklar war — „Check-in ohne Treffen-Partner"

Der Check-in ist heute an **ein Gespräch** gebunden: „mit wem" wird aus dem Chat vorausgefüllt. Die Frage war, ob er auch **ohne** jemanden aus der App laufen darf.

**Warum das bei dieser App die wichtigere Hälfte ist:** Cruising heißt oft gerade nicht, sich mit einer bestimmten Person zu verabreden — sondern an einen Ort zu gehen: einen Park, eine Sauna, einen Darkroom, eine Party. Oder nachts allein nach Hause. In all diesen Fällen gibt es niemanden im Chat, an den der Check-in gebunden wäre. **Ein Check-in, der nur mit Chatpartner geht, schützt genau die Situationen nicht, die für diese Zielgruppe typisch sind.**

**Vorschlag (Nr. 84):** Ja. Der Check-in hat zwei Formen — **„Ich treffe jemanden"** (mit Gespräch) und **„Ich bin unterwegs"** (ohne). Der Ablauf danach ist derselbe.

---

## 9 · Handbücher

### Nr. 81 — Option A

**Beschlossen:** Die Regel bleibt. Handbücher werden nicht bearbeitet; überholte Stellen stehen in `../00-grundlagen/grundsatzbeschluesse.md` und in der Entscheidungstabelle.

---

## 10 · Neue Entscheidungen

| Nr. | Frage | Warum sie entsteht |
|---|---|---|
| **83** | **Check-in: Soll die Nachricht nach 60 Minuten auch dann ankommen, wenn das Telefon aus ist?** Dann muss sie für die Dauer des Check-ins verschlüsselt bei uns liegen | Befund 2 zu Nr. 66 |
| **84** | **Check-in auch ohne Treffen-Partner** („Ich bin unterwegs")? | Rückfrage zu Nr. 66 |
| **85** | **Gehört die Reiseankündigung (F28) mit ins Travel-Paket?** | Nr. 77 |
| **86** | **Wiederherstellung über Vertrauenspersonen mit geteiltem Schlüssel** — bestätigen? | Widerspruch Nr. 66 gegen Nr. 69 |
| **87** | **Hinweise auf fremde Bars und Konzerte:** nur unbezahlt, oder bezahlt mit Kennzeichnung? | Nr. 78 gegen Prinzip 5 |

---

## Quellen

- Antwort Henry Luca Kurz, 21.09.2026, im Projektchat. Zitate gekürzt, Rechtschreibung angeglichen, Inhalt unverändert.
- [nora · Häufige Fragen](https://www.nora-notruf.de/de-as/fragen/faq) — stiller Notruf, Registrierungspflicht, keine Anbindung für Drittanbieter; abgerufen 21.09.2026
- [Netzwelt · Notruf ohne zu sprechen](https://www.netzwelt.de/news/257197-notruf-ohne-sprechen-nora-app-alarmiert-polizei-rettung-lautlos.html) — Artikel vom 11.08.2026, abgerufen 21.09.2026
- [Apple · App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) — 3.1.1 und 3.1.3(b); abgerufen 21.09.2026
- [CSD-Termine · CSD-Wagen mieten](https://www.csd-termine.de/infothek/csd-wagen-mieten-paradetruck-showtruck) — Kosten Paradewagen; abgerufen 21.09.2026
- Handbuch A, Mikro-UX — Entfernungsbänder; Funktionskatalog F28
- Handbuch B, Teil IX — Notfallreihenfolge
