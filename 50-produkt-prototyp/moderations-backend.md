# Moderations-Backend — Bildschirme und Zugriffsrechte

> ## ⚠ ENTWURF — Bauvorgabe, keine Gestaltung
>
> Beschrieben wird, **was auf jedem Bildschirm steht, wer es sehen darf und was protokolliert wird** — nicht, wie es aussieht. Das Backend ist ein internes Werkzeug; es braucht kein Gestaltungsbudget, aber es braucht diese Regeln, sonst hält die Moderationsarchitektur ihre Zusagen nicht.
>
> **Die Grundregel dieses Dokuments:** Rechte werden hier **nie weiter gefasst** als in `moderationsarchitektur.md`. Wo dieses Dokument etwas ergänzt, steht es als Ergänzung gekennzeichnet.

Erstellt: 18.09.2026 · Aufgabe A-41 · Rolle: Trust-&-Safety-Architekt · Fenster **V2**
Grundlagen: `moderationsarchitektur.md` (A-37) · `../10-recht-gruendung/trefferprozess-hash-abgleich.md` (A-36) · `wireframes-textspezifikation.md` (A-15, Format) · `produktspezifikation.md` (A-29)
Gehört zu: Code Phase 1b (AP-4, AP-5) · `../70-entwicklung-ab-monat-4/code-planer.md`

---

## Auf einen Blick

- **12 Bildschirme** mit **93 nummerierten Ankern**, je Bildschirm eine **Rechte-Tabelle** (wer sieht was, was braucht zwei Personen, was wird protokolliert). *Am 20.09.2026 kam M85 (Vorgänge des Kontaktservice, Nr. 75) mit zehn Ankern hinzu, dazu M90.09; am 21.09.2026 M75 (Freigaben, Nr. 74 und Nr. 82) mit sieben.*
- **Die vier Zusagen aus `moderationsarchitektur.md`, Abschnitt 7, sind je einer Rechte-Regel und einem Testfall zugeordnet** (Abschnitt 14) — das ist die Abnahmebedingung dieser Aufgabe.
- **17 Funktionen, die das Backend ausdrücklich nicht hat** (Abschnitt 13). Diese Liste ist so wichtig wie die Bildschirme: Was nicht gebaut wird, kann auch nicht missbraucht werden.
- **Der Belastungsschutz ist im Werkzeug verankert, nicht im Vorsatz** (M90): Die Obergrenze von zwei Hash-Fällen je Person und Tag ist eine Sperre im Backend, keine Absprache.
- **Zwei Bildschirme hängen an offenen Rechtsfragen** (M30, M40). Beide sind mit **beiden Schalterstellungen** beschrieben, damit die Antwort des Anwalts eine Konfiguration ändert und keinen Umbau auslöst.

---

## 0 · Wie man dieses Dokument liest

| Zeichen | Bedeutung |
|---|---|
| **M30.04** | Bildschirm M30, Element 4 — die Nummer ist der Name im Code und im Testfall |
| **MOD** | Rolle Moderation: sieht die Warteschlange, entscheidet über Inhalte. Anfangs beide Gründer, ab 15.000 aktiven Nutzern zusätzlich eine angestellte Kraft |
| **ZWEI** | Rolle Zweite Person: jede andere Person mit MOD-Recht, **nie dieselbe wie die Fallführung**. Keine eigene Anmeldung, sondern eine Prüfung im Einzelfall |
| **BETRIEB** | Rolle Betrieb: nur die beiden Gründer. Rechteverwaltung, Protokolleinsicht, Absenden einer Behördenmeldung |
| **📋** | wird protokolliert: wer, wann, welcher Fall, welche Begründung — nicht löschbar durch die handelnde Person |
| **👥** | braucht eine zweite Person, bevor die Wirkung eintritt |
| **⚠ offen** | hängt an einer offenen Entscheidung; beide Stellungen sind beschrieben |

**Aufbau eines Bildschirms:** Zweck · Erreichbar über · Bezug · Elementtabelle · Zustände · Rechte-Tabelle · Interaktionen · Hinweise.

**Was dieses Backend ist:** ein schmales internes Werkzeug für zwei Personen, das an jeder Stelle lieber etwas nicht kann, als es zu können und sich darauf zu verlassen, dass niemand es tut.

---

## 1 · M00 · Rahmen und Anmeldung

**Zweck:** Der gemeinsame Rahmen aller Backend-Bildschirme. Legt fest, was immer sichtbar ist und was beim Anmelden passiert.
**Erreichbar über:** eigene Adresse, nicht aus der App heraus erreichbar
**Bezug:** `moderationsarchitektur.md` Abschnitt 7 · A-36 Abschnitt 7 (Belastungsschutz)

| Anker | Element | Inhalt | Verhalten |
|---|---|---|---|
| M00.01 | Anmeldung | Zugangsdaten **plus zweiter Faktor**, immer, ohne Ausnahme | Kein „Angemeldet bleiben“ über 12 Stunden hinaus 📋 |
| M00.02 | Kopfzeile: angemeldete Person | Name der Person, Rolle | dauerhaft sichtbar — niemand arbeitet unbemerkt unter fremdem Namen |
| M00.03 | Kopfzeile: Tageszähler | „Hash-Fälle heute: 1 von 2“ | färbt sich ab dem zweiten Fall; siehe M90 |
| M00.04 | Kopfzeile: Uhrzeitwarnung | ab 21:00 Uhr: „Nach 21 Uhr werden keine Hash-Fälle mehr geöffnet“ | Hinweis, ab 21:00 Uhr Sperre in M30 |
| M00.05 | Navigation | Warteschlange · Meldungen · **Vorgänge** · **Freigaben** · Hash-Fälle · Orte · Einsprüche · Protokoll | **kein Sucheingabefeld über Nutzerkonten**, siehe Abschnitt 11 |
| M00.06 | Abmelden | wird nach 30 Minuten ohne Eingabe automatisch ausgelöst | offene Fälle bleiben der Person zugeordnet |

**Zustände**

| Zustand | Darstellung |
|---|---|
| zweite Person nicht erreichbar | alle 👥-Aktionen sind sichtbar, aber gesperrt, mit dem Hinweis, dass sie warten |
| Tagesgrenze erreicht | M00.03 rot; der Zugang zu M30 ist gesperrt, alles andere bleibt offen |

**Rechte**

| Wer | Was |
|---|---|
| MOD | Warteschlange, Meldungen, Hash-Fälle, Orte, Einsprüche; eigenes Protokoll |
| ZWEI | zusätzlich: Gegenzeichnen fremder Fälle |
| BETRIEB | zusätzlich: Rechteverwaltung, **Protokoll aller Personen**, Absenden einer Behördenmeldung |

**Interaktionen:** M00.05 → M10 · M20 · M30 · M50 · M60 · M70

**Hinweise**

- Das Backend liegt nicht unter derselben Adresse wie die App und wird nicht verlinkt.
- Es gibt **keine Rolle „Lesen“** für Außenstehende. Wer hineinsehen will, bekommt einen Bericht, keinen Zugang.

---

## 2 · M10 · Warteschlange Zone 1 (Graubereich)

**Zweck:** Die tägliche Arbeit. Bilder aus dem öffentlichen Bereich, die der Klassifikator weder eindeutig freigegeben noch eindeutig abgelehnt hat.
**Erreichbar über:** M00.05
**Bezug:** `moderationsarchitektur.md` Abschnitt 3 (Stufe 3) und 5 (Fristen) · Erwartung: 3 bis 6 Bilder am Tag bei 3.500 aktiven Nutzern

| Anker | Element | Inhalt | Verhalten |
|---|---|---|---|
| M10.01 | Zähler | „7 offen · ältestes seit 3 Std. 20 Min.“ | Frist: tagsüber unter 2 Stunden, insgesamt unter 12 Stunden |
| M10.02 | Liste | je Eintrag: Vorschaubild, Zone, Eingang, Klassifikatorwert als Band (nicht als Zahl) | **nur Zone 1** — in dieser Liste gibt es nichts aus Zone 2 |
| M10.03 | Fristampel je Eintrag | grün unter 2 Std. · gelb bis 12 Std. · rot darüber | rot löst eine Mitteilung an beide Gründer aus |
| M10.04 | Einzelansicht | Bild groß, daneben: Konto-Alter, frühere Entscheidungen zu diesem Konto, Zahl der Meldungen | **keine Profilangaben**, die für die Entscheidung nicht nötig sind |
| M10.05 | Freigeben | Bild wird veröffentlicht | 📋 |
| M10.06 | Ablehnen mit Grund | Auswahl aus festen Gründen plus Freitext | 📋 · löst den Systemtext an die Person und den Widerspruchsweg aus (M50) |
| M10.07 | Hochstufen | Fall wird zu einem Meldefall (M20), wenn mehr dahintersteckt als ein Bild | 📋 |
| M10.08 | Unsicher — zurücklegen | Fall geht an die zweite Person, ohne Entscheidung | 📋 · **ausdrücklich erwünscht**, kein Makel |

**Zustände**

| Zustand | Darstellung |
|---|---|
| leer | „Nichts offen.“ — kein Vorschlag, trotzdem etwas zu prüfen |
| Welle (mehr als 30 offen) | Hinweis, dass die Wartezeit steigt, aber keine Gefahr entsteht; Priorität bleibt das Alter des Eintrags |

**Rechte**

| Aktion | MOD | ZWEI | BETRIEB | Protokoll |
|---|---|---|---|---|
| Liste sehen | ja | ja | ja | nein |
| Bild einzeln öffnen | ja | ja | ja | 📋 |
| Freigeben / Ablehnen | ja | ja | ja | 📋 |
| Hochstufen | ja | ja | ja | 📋 |
| Klassifikatorwert als Zahl sehen | **nein** | **nein** | ja | 📋 |

**Interaktionen:** M10.02 → M10.04 · M10.07 → M20 · M10.06 → M50

**Hinweise**

- Der Klassifikatorwert erscheint für MOD als Band, nicht als Zahl. Eine Zahl verleitet dazu, sie als Entscheidung zu lesen; das Band zwingt zum Hinsehen.
- Die Reihenfolge der Liste ist **nach Alter**, nicht nach Wert. Sonst bleiben die schwierigen Fälle liegen.

---

## 3 · M20 · Fallansicht Zone 3 (Meldung)

**Zweck:** Ein Nutzer hat etwas gemeldet. Nur die markierten Inhalte werden geöffnet — nicht der Chat, nicht das Konto, nicht die Vorgeschichte.
**Erreichbar über:** M00.05 · M10.07 (hochgestufter Fall)
**Bezug:** `moderationsarchitektur.md` Abschnitt 2 und 5 · Fristen: Fallnummer sofort, Entscheidung unter 24 Stunden

| Anker | Element | Inhalt | Verhalten |
|---|---|---|---|
| M20.01 | Fallkopf | Fallnummer, Eingang, Frist als Countdown, Meldegrund in den Worten der meldenden Person | Countdown wird rot ab 20 Stunden |
| M20.02 | Die markierten Inhalte | **nur** was die meldende Person markiert hat | Öffnen 📋 — mit Begründung, die aus dem Meldegrund vorbelegt ist |
| M20.03 | Kontext-Schalter | „Zwei Nachrichten davor und danach anzeigen“ | 👥 📋 — braucht die zweite Person und einen eigenen Grund. **Nicht voreingestellt** |
| M20.04 | Meldende Person | nur: Zahl früherer Meldungen und deren Ausgang | **kein Profil**, kein Name, keine weiteren Daten |
| M20.05 | Gemeldete Person | Konto-Alter, frühere Entscheidungen, laufende Fälle | keine Chats, keine Alben, kein Standortverlauf |
| M20.06 | Entscheidung | Inhalt bleibt · Inhalt entfernen · Konto einschränken · Konto sperren · an Behörde melden | Die letzten beiden 👥; „melden“ führt zu M80 |
| M20.07 | Begründung | Pflichtfeld, geht in die Mitteilung an beide Seiten | 📋 |
| M20.08 | Fall schließen | Setzt die Aufbewahrungsfrist des Falls in Gang | 📋 · Frist ⚠ offen (**AF-12**) |

**Zustände**

| Zustand | Darstellung |
|---|---|
| Inhalt bereits verfallen oder gelöscht | die zur Meldung gesicherte Kopie bleibt lesbar; sichtbarer Hinweis, dass das Original nicht mehr existiert |
| mehrere Meldungen zum selben Konto | werden gebündelt gezeigt, **nicht** automatisch zu einer Sperre aufaddiert |

**Rechte**

| Aktion | MOD | ZWEI | BETRIEB | Protokoll |
|---|---|---|---|---|
| Markierte Inhalte öffnen | ja | ja | ja | 📋 |
| Kontext ausklappen (M20.03) | nur mit ZWEI | — | nur mit ZWEI | 👥 📋 |
| Inhalt entfernen | ja | ja | ja | 📋 |
| Konto einschränken oder sperren | nein, nur mit ZWEI | — | nur mit ZWEI | 👥 📋 |
| An Behörde melden | nein | nein | **ja, nur BETRIEB** | 👥 📋 |

**Interaktionen:** M20.06 → M40 (Sperre) · M20.06 → M80 (Meldung) · M20.08 → M60

**Hinweise**

- **M20.03 ist die gefährlichste Schaltfläche des ganzen Werkzeugs.** Sie öffnet Inhalte, die niemand gemeldet hat. Deshalb: zweite Person, eigener Grund, Protokoll — und sie ist nie voreingestellt.
- Eine Meldung öffnet die Vertraulichkeit **nur für die markierten Inhalte**, nicht für den Chat (`produktspezifikation.md`, M-03).

---

## 4 · M30 · Hash-Treffer-Fall

**Zweck:** Ein Abgleich hat angeschlagen. Dieser Bildschirm ist so gebaut, dass **niemand ein Bild ansehen muss**, um zu handeln.
**Erreichbar über:** M00.05 · Mitteilung an beide Gründer beim Entstehen des Falls
**Bezug:** `../10-recht-gruendung/trefferprozess-hash-abgleich.md` Abschnitte 1, 2 und 8

| Anker | Element | Inhalt | Verhalten |
|---|---|---|---|
| M30.01 | Fallkopf | Fall-ID · Zeitpunkt · Zone · Konto-ID · IP soweit vorhanden · Status | genau die Angaben, die eine Meldung verlangt |
| M30.02 | Hinweiszeile | „Kein Bild. Das ist Absicht.“ mit einem Satz warum | dauerhaft, nicht ausblendbar |
| M30.03 | Trefferangabe | Name der Liste, Zeitpunkt des Abgleichs | **kein Hashwert im Klartext für MOD**; BETRIEB sieht ihn für die Meldung |
| M30.04 | Weitere Uploads desselben Hashes | Zähler, ohne Einzelansicht | verhindert eine Fallflut bei einer Verteilwelle |
| M30.05 | Automatisch geschehen | Prüfliste: Inhalt gesperrt ✓ · Datei gesichert ✓ · Fall eröffnet ✓ · beide benachrichtigt ✓ | nur Anzeige — nichts davon ist auszulösen |
| M30.06 | Meldung vorbereiten | öffnet M80 mit vorbelegten Feldern | 📋 |
| M30.07 | Konto vorläufig einschränken | ⚠ **offen (Nr. 31)** — im Auslieferungszustand **gesperrt** und mit dem Grund beschriftet | 👥 📋, sobald freigeschaltet |
| M30.08 | Datei ausnahmsweise ansehen | verlangt: schriftlicher Grund **vor** dem Öffnen, zweite Person angemeldet, Bestätigung | 👥 📋 · zusätzlich Mitteilung an die jeweils andere Person |
| M30.09 | Falschtreffer melden | öffnet den Rückfrageweg an die Meldestelle (Abschnitt 6 von A-36) | 📋 |
| M30.10 | Fall abgeben | „Ich kann das gerade nicht“ — der Fall geht an die andere Person, ohne Begründungszwang | 📋 · **kein Makel, keine Statistik darüber** |

**Zustände**

| Zustand | Darstellung |
|---|---|
| Zone 2, Schalter aus | dieser Fall entsteht gar nicht — der Bildschirm bleibt leer und erklärt warum (⚠ **Nr. 30**) |
| nach 21:00 Uhr | Fall ist sichtbar, aber nicht zu öffnen; Hinweis auf die 24-Stunden-Frist, die bis morgen reicht |
| Tagesgrenze erreicht | wie oben; der Fall wird der anderen Person angeboten |

**Rechte**

| Aktion | MOD | ZWEI | BETRIEB | Protokoll |
|---|---|---|---|---|
| Fall sehen (ohne Bild) | ja | ja | ja | 📋 |
| Hashwert im Klartext | **nein** | **nein** | ja | 📋 |
| Datei ansehen (M30.08) | nur mit ZWEI und Grund | — | nur mit ZWEI und Grund | 👥 📋 |
| Meldung absenden | nein | nein | **ja** | 👥 📋 |
| Konto einschränken | gesperrt bis **Nr. 31** | — | gesperrt bis **Nr. 31** | 👥 📋 |
| Datei löschen | **nein — niemand** | **nein** | **nein** | — |

**Interaktionen:** M30.06 → M80 · M30.07 → M40 · M30.09 → M50 · M30.10 → M90

**Hinweise**

- **Es gibt keine Schaltfläche „Datei löschen“.** Löschen entscheidet die Behörde; das Werkzeug kann es nicht, damit es niemand in der Aufregung tut.
- M30.08 ist kein Regelweg. Der Bildschirm bietet an derselben Stelle an, den Fall stattdessen an die FSM-Beschwerdestelle abzugeben.
- Die Frist steht sichtbar, aber ohne Countdown in Rot. Wer unter Zeitdruck arbeitet, macht hier Fehler; 24 Stunden sind genug.

---

## 5 · M40 · Kontosperre mit Freigabe durch zwei Personen

**Zweck:** Die einzige Stelle, an der ein Konto eingeschränkt oder gesperrt wird. Sie ist bewusst umständlich.
**Erreichbar über:** M20.06 · M30.07
**Bezug:** `moderationsarchitektur.md` Abschnitt 7 Regel 3 und Abschnitt 8 · Art. 22 DSGVO

| Anker | Element | Inhalt | Verhalten |
|---|---|---|---|
| M40.01 | Was geschehen soll | Einschränken (Lesen ja, Senden nein) · Sperren · Sperren und Konto löschen | Löschen nur nach Ablauf aller Fristen |
| M40.02 | Grund | Pflichtfeld, freier Text plus Auswahl; geht wörtlich in die Mitteilung | 📋 |
| M40.03 | Bezug | Fall-ID oder Meldenummer — **ohne Bezug keine Sperre** | eine Sperre ohne Fall ist technisch nicht auslösbar |
| M40.04 | Freigabe durch die zweite Person | eigene Anmeldung mit zweitem Faktor, eigener Bildschirm, eigene Entscheidung | 👥 📋 — die zweite Person sieht denselben Fall und kann ablehnen |
| M40.05 | Ablehnung der Freigabe | mit Begründung, die im Fall stehen bleibt | 📋 · **wird nicht gelöscht**, auch wenn später doch gesperrt wird |
| M40.06 | Wirkung | Zeitpunkt, ab wann; Mitteilung an die Person mit Widerspruchsweg und Frist | löst M50 aus |
| M40.07 | Aufheben | derselbe Weg, dieselben zwei Personen | 📋 |

**Zustände**

| Zustand | Darstellung |
|---|---|
| zweite Person nicht erreichbar | Vorgang bleibt als Entwurf offen; **es gibt keine Umgehung**, auch nicht für BETRIEB |
| Freigabe abgelehnt | Vorgang wird geschlossen, Begründung bleibt im Fall; ein neuer Anlauf braucht einen neuen Grund |

**Rechte**

| Aktion | MOD | ZWEI | BETRIEB | Protokoll |
|---|---|---|---|---|
| Sperre beantragen | ja | ja | ja | 📋 |
| Sperre freigeben | **nie für den eigenen Antrag** | ja | ja, aber nicht für den eigenen | 👥 📋 |
| Sperre aufheben | beantragen | freigeben | beides, nicht allein | 👥 📋 |
| Vier-Augen-Prinzip umgehen | **nein — niemand, kein Notfallzugang** | **nein** | **nein** | — |

**Interaktionen:** M40.06 → M50 · M40.04 → M60

**Hinweise**

- **Es gibt keinen Notfallzugang**, der das Vier-Augen-Prinzip aufhebt. Ein Notfallzugang, der existiert, wird benutzt.
- Die Ablehnung einer Freigabe bleibt dauerhaft im Fall. Das schützt die Person, die abgelehnt hat — und macht später sichtbar, wenn jemand systematisch überstimmt wurde.

---

## 6 · M50 · Einspruch und Widerspruch

**Zweck:** Jede Ablehnung und jede Sperre bekommt eine Antwort — auch wenn sie bestehen bleibt. Frist: unter 48 Stunden.
**Erreichbar über:** M00.05 · M10.06 · M40.06
**Bezug:** `moderationsarchitektur.md` Abschnitt 5 · Art. 17 DSA (Begründung)

| Anker | Element | Inhalt | Verhalten |
|---|---|---|---|
| M50.01 | Liste | Einsprüche nach Alter, mit Fristampel | rot ab 40 Stunden |
| M50.02 | Ursprungsentscheidung | was entschieden wurde, von wem, mit welcher Begründung | die Begründung ist unveränderlich |
| M50.03 | Einspruchstext | in den Worten der Person | vollständig, ungekürzt |
| M50.04 | **Andere Person entscheidet** | der Einspruch geht **nie** an die Person, die ursprünglich entschieden hat | technisch erzwungen, nicht per Absprache |
| M50.05 | Ergebnis | bleibt bestehen · wird aufgehoben · wird abgemildert | 📋 |
| M50.06 | Antwort | Pflichtfeld; muss auf den Einspruch eingehen, nicht nur das Ergebnis nennen | 📋 |
| M50.07 | Aufhebung | stellt Inhalt oder Konto vollständig her, auch zurückliegende Einschränkungen | 📋 |
| M50.08 | Vermerk „Fehler bei uns“ | eigenes Feld, getrennt vom Ergebnis | fließt in die Quartalsdurchsicht (M90.05) |

**Zustände**

| Zustand | Darstellung |
|---|---|
| nur eine Person verfügbar | der Einspruch wartet, die Frist läuft sichtbar weiter; er wird **nicht** von derselben Person entschieden |
| Einspruch gegen einen Hash-Fall | kein Bild, keine Einzelheiten; die Antwort verweist auf den Weg über die Behörde |

**Rechte**

| Aktion | MOD | ZWEI | BETRIEB | Protokoll |
|---|---|---|---|---|
| Einspruch sehen | ja | ja | ja | nein |
| Über eigenen Fall entscheiden | **nein — gesperrt** | — | **nein** | — |
| Über fremden Fall entscheiden | ja | ja | ja | 📋 |
| Aufheben | ja | ja | ja | 📋 |

**Interaktionen:** M50.02 → M20 · M50.07 → M40.07 · M50.08 → M90

**Hinweise**

- **M50.04 ist der Kern dieses Bildschirms.** Eine Beschwerdestelle, die von derselben Person beantwortet wird, ist keine.
- Bei zwei Personen heißt das: Wer sperrt, beantwortet den Einspruch nicht. Sind beide beteiligt gewesen, wird das im Ergebnis offengelegt.

---

## 7 · M60 · Zugriffsprotokoll

**Zweck:** Die Regel, die alle anderen trägt. Jeder Zugriff steht hier, und beide Gründer sehen die Einträge des jeweils anderen.
**Erreichbar über:** M00.05
**Bezug:** `moderationsarchitektur.md` Abschnitt 6 und 7 Regel 2 — Aufbewahrung mindestens 12 Monate

| Anker | Element | Inhalt | Verhalten |
|---|---|---|---|
| M60.01 | Zeitleiste | wer · wann · welcher Fall · welche Handlung · welche Begründung | absteigend, nicht filterbar nach Person |
| M60.02 | Eigene Einträge | hervorgehoben | **nicht löschbar, nicht änderbar** durch die handelnde Person |
| M60.03 | Einträge der anderen Person | vollständig sichtbar | gegenseitig, ohne Anfrage |
| M60.04 | Besondere Einträge | farblich hervorgehoben: Kontextausklappen (M20.03), Dateiansicht (M30.08), Sperren (M40), Meldungen (M80) | diese vier sind die Handlungen, bei denen Vertrauen auf dem Spiel steht |
| M60.05 | Wöchentliche Zusammenfassung | automatisch an beide: Zahl der Fälle, besondere Einträge, gerissene Fristen | wird versendet, auch wenn niemand hinsieht |
| M60.06 | Export | nur BETRIEB, nur als Ganzes, nur mit Grund | 📋 — der Export selbst steht wieder im Protokoll |

**Zustände**

| Zustand | Darstellung |
|---|---|
| ein Eintrag ohne Begründung | technisch nicht möglich; ohne Begründung wird die Handlung nicht ausgeführt |
| Protokoll nicht erreichbar | **alle 📋-Handlungen sind gesperrt.** Wenn nicht protokolliert werden kann, wird nicht gehandelt |

**Rechte**

| Aktion | MOD | ZWEI | BETRIEB | Protokoll |
|---|---|---|---|---|
| Eigene Einträge sehen | ja | ja | ja | nein |
| Fremde Einträge sehen | nur zwischen den Gründern | — | ja | nein |
| Eintrag löschen oder ändern | **nein — niemand, keine Ausnahme** | **nein** | **nein** | — |
| Exportieren | nein | nein | ja | 📋 |

**Interaktionen:** M60.01 → der jeweilige Fall

**Hinweise**

- Der letzte Zustand ist der wichtigste: **Ist das Protokoll nicht schreibbar, ist das Werkzeug gesperrt.** Ein Ausfall darf nicht dazu führen, dass unprotokolliert gearbeitet wird.
- Eine angestellte Moderationskraft sieht ihre eigenen Einträge, nicht die der Gründer — und die Gründer sehen ihre. Gegenseitigkeit gilt zwischen den Gründern.

---

## 8 · M70 · Beanspruchung von Orten

**Zweck:** Ein Ort meldet sich und sagt, er sei der Betreiber. Geprüft wird binnen 24 Stunden, und zwar von einem Menschen.
**Erreichbar über:** M00.05
**Bezug:** `produktspezifikation.md` (Ortsverzeichnis, redaktionelle Freigabe) · `../60-orte-b2b/kontaktanlaesse-playbook.md`

| Anker | Element | Inhalt | Verhalten |
|---|---|---|---|
| M70.01 | Liste offener Beanspruchungen | Ort, Eingang, Frist als Countdown | Frist 24 Stunden |
| M70.02 | Angaben der beanspruchenden Person | Name, Rolle, Kontaktweg, Nachweisvorschlag | keine automatische Prüfung |
| M70.03 | Abgleich | Impressumsdomain des Ortes gegen die Mailadresse der Anfrage | Anzeige als Hinweis, **nicht** als Entscheidung |
| M70.04 | Entscheidung | bestätigen · ablehnen · Rückfrage stellen | 📋 |
| M70.05 | Rechteumfang bei Bestätigung | was ein bestätigter Ort ändern darf: Öffnungszeiten, Beschreibung, Termine — **nicht** Bewertungen, nicht die Sichtbarkeit anderer Orte | fest, nicht je Ort einstellbar |
| M70.06 | Widerruf | jederzeit, mit Grund | 📋 |

**Zustände**

| Zustand | Darstellung |
|---|---|
| zwei Beanspruchungen für denselben Ort | beide warten; entschieden wird erst nach Rückfrage bei beiden |
| Frist gerissen | Mitteilung an beide Gründer; der Ort bleibt unbeansprucht, nichts wird automatisch bestätigt |

**Rechte**

| Aktion | MOD | ZWEI | BETRIEB | Protokoll |
|---|---|---|---|---|
| Beanspruchung sehen | ja | ja | ja | nein |
| Bestätigen | ja | ja | ja | 📋 |
| Rechteumfang ändern | **nein — für niemanden einzeln** | **nein** | **nein** | — |

**Interaktionen:** M70.04 → Ortsverzeichnis

**Hinweise**

- Bezahlte Hervorhebung von Orten ist seit dem 19.09.2026 **ausgeschlossen (Nr. 65)** und in diesem Bildschirm nicht vorgesehen — es gibt dafür keine Schaltfläche. **Seit dem 26.09.2026 (Nr. 91) gilt das auch für den Tausch gegen einen QR-Code.** Was es dagegen gibt: ein **Kennzeichen** an Einträgen zahlender Werkzeugkonten (Nr. 87, AK-F31-08) — es hebt nichts hervor, es sagt nur, woher der Eintrag kommt.
- Der Abgleich in M70.03 ist ein Hinweis. Wer ihn zur Entscheidung macht, bestätigt jeden, der eine passende Mailadresse besorgen kann.

---

## 9 · M75 · Freigabe von Veranstaltungen, Inseraten und Orten

**Zweck:** Jede Veranstaltung, jedes Inserat und jeder neue Ort wird gegengelesen, bevor er sichtbar wird — so beschlossen für die Anfangszeit. Fünf Prüfpunkte, eine Entscheidung, ein Grund.
**Erreichbar über:** M00.05
**Bezug:** `../35-veranstaltungen/veranstaltungskonzept.md`, Abschnitt 3b · Entscheidungen **Nr. 74**, **Nr. 82**, **Nr. 55** · Muster: M70

| Anker | Element | Inhalt | Verhalten |
|---|---|---|---|
| M75.01 | Warteschlange | Einreichungen nach Eingang, mit Art (öffentlich, privat, Inserat, Ort) und Kontoart (Gemeinschaft, gewerblich) | älteste zuerst; private Veranstaltungen mit Termin in weniger als 48 Stunden rücken vor |
| M75.02 | Prüfliste | die fünf Fragen: Ampel eingehalten? · keine Privatadresse im Text? · ab 18 genannt? · kein unhaltbares Versprechen? · bei gewerblich: Anbieterangaben vollständig? | jede Frage einzeln abzuhaken; ohne alle fünf keine Freigabe |
| M75.03 | Ampel | grün · gelb · rot, vorbelegt nach Stichworten, **vom Menschen bestätigt** | Rot heißt: in der App nur für verifizierte Konten, nie außerhalb |
| M75.04 | Freigeben | macht die Einreichung sichtbar | 📋 |
| M75.05 | Zurückgeben | mit einem Grund aus einer kurzen Liste und freiem Text | 📋 · der Einreichende erhält ST-EVT-10 mit Grund und Weg |
| M75.06 | Ablehnen | bei Rechtsverstoß oder bei rotem Kern ohne Altersgrenze | 📋 · Weg zu M50 (Einspruch) |
| M75.07 | Vertrauensstand | Zahl beanstandungsfreier Veranstaltungen je gewerblichem Konto | ab P-FREIGABE-VERTRAUEN Vorschlag „selbst schalten" — **Freischaltung nur durch BETRIEB** |

**Rechte**

| Aktion | MOD | ZWEI | BETRIEB | Protokoll |
|---|---|---|---|---|
| Einreichung öffnen und prüfen | ja | ja | ja | 📋 |
| Freigeben, zurückgeben | ja | ja | ja | 📋 |
| Ablehnen | ja | ja | ja | 📋 |
| Ein gewerbliches Konto auf „selbst schalten" setzen | **nein** | **nein** | ja | 👥 📋 |
| Die Adresse einer privaten Veranstaltung sehen | **nein — niemand** | **nein** | **nein** | — |

**Hinweise**

- **Warum niemand die Adresse einer privaten Veranstaltung sieht:** Sie steht nicht in der Einreichung. Der Gastgeber gibt sie erst beim Annehmen eines Gastes heraus, und dann nur an diesen (Nr. 82). Was die Moderation nicht hat, kann sie nicht verlieren.
- **Aufwand:** zwei bis fünf Minuten je Einreichung (**ANNAHME**). Ab etwa 100 Einreichungen in der Woche muss Freigabephase 2 kommen.

---

## 10 · M80 · Meldung nach Art. 18 DSA

**Zweck:** Die Meldung an das Bundeskriminalamt vorbereiten, gegenzeichnen lassen und absenden. Vier Pflichtangaben, ein Knopf, zwei Menschen.
**Erreichbar über:** M20.06 · M30.06
**Bezug:** `../10-recht-gruendung/trefferprozess-hash-abgleich.md` Abschnitt 3 · Art. 18 DSA · § 13 DDG

| Anker | Element | Inhalt | Verhalten |
|---|---|---|---|
| M80.01 | Vorbelegte Pflichtangaben | Sachverhalt mit Veröffentlichungszeitpunkt · Konto-ID mit Nutzerangaben · IP soweit vorhanden · eigene Vorgangsnummer (die Fall-ID) | aus dem Fall übernommen, einzeln prüfbar |
| M80.02 | Sachverhaltstext | vorformuliert, muss gelesen und bestätigt werden | kein Absenden ohne Bestätigung |
| M80.03 | Fehlende Angaben | rot, mit dem Hinweis, dass „unverzüglich" auch mit Lücken gilt | eine fehlende IP verhindert die Meldung nicht |
| M80.04 | Gegenzeichnung | zweite Person, eigene Anmeldung, eigener Bildschirm | 👥 📋 |
| M80.05 | Absenden | nur BETRIEB, nur nach Gegenzeichnung | 👥 📋 |
| M80.06 | Vorgangsnummer der Behörde | Pflichtfeld nach dem Absenden — der Beleg, dass gemeldet wurde | 📋 |
| M80.07 | Nachtrag | für den Fall eines Falschtreffers: Nachtrag an dieselbe Stelle | 📋 · **eine Meldung wird nie stillschweigend zurückgezogen** |
| M80.08 | Frist | „gemeldet nach 4 Std. 12 Min." | intern; Ziel unter 24 Stunden |

**Zustände**

| Zustand | Darstellung |
|---|---|
| Portalkonto nicht eingerichtet | Warnung mit Verweis auf **Nr. 72** — die Registrierung gehört in die Startvorbereitung, nicht in den Ernstfall |
| BETRIEB nicht erreichbar | Meldung bleibt als vorbereiteter Entwurf offen, Frist läuft sichtbar; **keine Umgehung** |

**Rechte**

| Aktion | MOD | ZWEI | BETRIEB | Protokoll |
|---|---|---|---|---|
| Meldung vorbereiten | ja | ja | ja | 📋 |
| Gegenzeichnen | nie den eigenen Entwurf | ja | ja | 👥 📋 |
| Absenden | **nein** | **nein** | ja | 👥 📋 |
| Meldung löschen | **nein — niemand** | **nein** | **nein** | — |

**Interaktionen:** M80.05 → M60 · M80.07 → M30.09

**Hinweise**

- **Warum nur BETRIEB absendet:** Eine Meldung ist eine Aussage über einen Menschen gegenüber einer Polizeibehörde. Sie gehört zu den Pflichten, die die Gründer persönlich tragen, auch wenn später jemand angestellt moderiert.
- Der Text in M80.02 ist vorformuliert, damit im Ernstfall niemand unter Druck formuliert — aber er muss gelesen werden, sonst meldet das Werkzeug und nicht der Mensch.

---

## 11 · M85 · Vorgänge des Kontaktservice

**Zweck:** Die Vorgänge aus „Hilfe und Kontakt" (F75) bearbeiten, ohne eine Frist zu verpassen. Vier Töpfe, eine Sortierung: **nach Restfrist, nicht nach Eingang.**
**Erreichbar über:** M00.05 · M90.09
**Bezug:** `../50-produkt-prototyp/kontaktservice-und-tickets.md` · Art. 11, 12 und 16 DSA · Art. 12 Abs. 3 DSGVO · Entscheidung **Nr. 75**

| Anker | Element | Inhalt | Verhalten |
|---|---|---|---|
| M85.01 | Vier Töpfe | Missbrauch · Hilfe · Datenschutz · Behörden, je mit offener Zahl und ältestem Vorgang | Missbrauch steht immer oben |
| M85.02 | Liste | Fallnummer, Kategorie, Eingang, **Restfrist**, Bearbeiter | sortiert nach Restfrist; die Sortierung ist nicht umstellbar |
| M85.03 | Fristampel | grün bis 50 % · gelb ab 75 % · rot ab Ablauf | **Rot lässt sich nicht wegklicken** |
| M85.04 | Vorgang | Text, freiwilliger Anhang, gewählter Antwortweg, Verlauf | Anhänge laufen durch dieselbe Prüfkette wie jedes Bild (M-02) |
| M85.05 | Bezug | Verweis auf Gespräch oder Bezahlvorgang, **wenn** der Aufruf von dort kam | zeigt die Kennung, **nie den Inhalt** |
| M85.06 | Antwort | freies Textfeld, darunter Vorlagen zu den zwanzig häufigen Fragen | **Vorlagen sind immer bearbeitbar und werden nie automatisch versandt** |
| M85.07 | Als Moderationsfall öffnen | legt einen Fall nach M20 an und schließt den Vorgang mit Verweis | 📋 |
| M85.08 | Schließen | mit Grund aus einer kurzen Liste | 📋 |
| M85.09 | Kategorie ändern | wenn jemand die falsche gewählt hat — die Frist wird neu berechnet und der Wechsel protokolliert | 📋 · **die alte Frist bleibt sichtbar** |
| M85.10 | Ohne Konto | Vorgänge ohne Kontobezug sind als solche gekennzeichnet | keine Kontoansicht, kein Verlauf |

**Zustände**

| Zustand | Darstellung |
|---|---|
| Kategorie 1 („Jemand ist in Gefahr") | eigene Zeile über allen Töpfen, rot, ohne Fristrechnung — **unverzüglich heißt jetzt** |
| Rote Frist vorhanden | M00 und M90 zeigen die Zahl; sie verschwindet erst, wenn der Vorgang bearbeitet ist |
| Datenschutzvorgang, MOD angemeldet | Vorgang ist als vorhanden sichtbar, **Inhalt nicht** |

**Rechte**

| Aktion | MOD | ZWEI | BETRIEB | Protokoll |
|---|---|---|---|---|
| Topf Hilfe öffnen und beantworten | ja | ja | ja | 📋 |
| Topf Missbrauch öffnen | ja | ja | ja | 📋 |
| Aus einem Vorgang heraus sperren | **nein** | ja | ja | 👥 📋 |
| Topf Datenschutz öffnen | **nein** | **nein** | ja | 📋 |
| Topf Behörden öffnen | **nein** | **nein** | ja | 📋 |
| Vorgang löschen | **nein — niemand** | **nein** | **nein** | — |
| Kategorie ändern | ja | ja | ja | 📋 |

**Interaktionen:** M85.07 → M20 · Kategorie 7 im Formular → M50 (kein Vorgang) · M85 → M60 (jeder Zugriff)

**Hinweise**

- **Warum Datenschutz nur BETRIEB sieht:** Eine Auskunft nach Art. 15 DSGVO ist eine vollständige Offenlegung dessen, was über eine Person gespeichert ist. Wer sie erteilt, sieht alles. Das ist keine Moderationsaufgabe, sondern eine Pflicht der Geschäftsführung.
- **Warum die Sortierung nicht umstellbar ist:** Eine Warteschlange, die man nach Eingang sortieren kann, wird nach Eingang sortiert. Genau das führt dazu, dass eine Missbrauchsmeldung hinter einer Zahlungsfrage liegt.
- **Warum es keine Zufriedenheitsbewertung gibt:** Sie erzeugt Druck auf eine Kennzahl, die mit dem Schutzauftrag nichts zu tun hat. Wer eine berechtigte Sperre erklärt, bekommt keine gute Bewertung — und soll es trotzdem tun.
- **Was fehlt und bewusst fehlt:** keine Volltextsuche über alle Vorgänge. Gesucht wird nach Fallnummer. Eine durchsuchbare Sammlung von Hilfetexten ist eine durchsuchbare Sammlung persönlicher Notlagen.

---

## 12 · M90 · Tagesübersicht und Belastungsschutz

**Zweck:** Der Abschnitt aus A-36, der keine Fußnote sein darf, wird hier zu Sperren im Werkzeug. Was als Vorsatz formuliert ist, hält nicht; was das Werkzeug erzwingt, hält.
**Erreichbar über:** M00.03 · M30.10 · Startbildschirm nach der Anmeldung
**Bezug:** `../10-recht-gruendung/trefferprozess-hash-abgleich.md` Abschnitt 7

| Anker | Element | Inhalt | Verhalten |
|---|---|---|---|
| M90.01 | Tageszähler Hash-Fälle | „1 von 2" je Person | **ab dem dritten Fall gesperrt**, nicht nur gewarnt |
| M90.02 | Uhrzeitsperre | ab 21:00 Uhr keine neuen Hash-Fälle | die 24-Stunden-Frist lässt das zu |
| M90.03 | Letzte Handlung des Tages | nach einem Hash-Fall schlägt das Werkzeug vor, Schluss zu machen | Vorschlag, keine Sperre |
| M90.04 | Gesprächserinnerung | nach jedem Hash-Fall: „Zehn Minuten reden. Nicht über den Inhalt." | wird im Fall vermerkt, wenn bestätigt |
| M90.05 | Quartalsdurchsicht | Zahl der Fälle je Person, besondere Einträge, gerissene Fristen, Vermerke „Fehler bei uns" | erscheint automatisch, muss quittiert werden |
| M90.06 | Ansprechperson | Name und Nummer, beim Einrichten des Backends zu hinterlegen | **Pflichtfeld** — ohne Eintrag lässt sich der Hash-Abgleich nicht einschalten |
| M90.07 | Notfallhinweise | 116117 · TelefonSeelsorge 0800 111 0 111 und 0800 111 0 222 | dauerhaft auf M30 und hier |
| M90.08 | Abgeben | „Ich kann das gerade nicht" — ohne Begründung, ohne Zähler | 📋 nur als Zuständigkeitswechsel, **nicht als Leistungsangabe** |
| M90.09 | Offene Vorgänge | je Topf: offene Zahl, ältester Vorgang, **Zahl der roten Fristen** | führt zu M85; **ein Tag mit einer roten Frist ist kein normaler Tag** |

**Zustände**

| Zustand | Darstellung |
|---|---|
| beide Personen an der Tagesgrenze | Hash-Fälle bleiben offen, die Frist läuft sichtbar; die Übergabe an die FSM-Beschwerdestelle wird angeboten |
| Moderationsfristen zwei Monate in Folge gerissen | Hinweis auf das Abbruchkriterium aus dem Skalierungs-Playbook: **Expansion stoppen, bevor jemand zusammenbricht** |

**Rechte**

| Aktion | MOD | ZWEI | BETRIEB | Protokoll |
|---|---|---|---|---|
| Eigene Zahlen sehen | ja | ja | ja | nein |
| Zahlen der anderen Person sehen | nur zwischen den Gründern | — | ja | nein |
| Tagesgrenze erhöhen | **nein — für niemanden, auch nicht einmalig** | **nein** | **nein** | — |
| Uhrzeitsperre aufheben | **nein** | **nein** | **nein** | — |

**Interaktionen:** M90.08 → M30 · M90.05 → M60

**Hinweise**

- **M90.01 und M90.02 sind bewusst nicht einstellbar.** Eine Obergrenze, die man im Ernstfall hochsetzen kann, ist keine Obergrenze. Hält sie den Betrieb nicht aus, ist das Werkzeug nicht das Problem.
- M90.08 erzeugt **keine** Statistik darüber, wer wie oft abgibt. Eine solche Zahl würde genau das Verhalten bestrafen, das hier erwünscht ist.
- M90.06 ist die einzige Stelle, an der ein Pflichtfeld eine Produktfunktion blockiert: **Ohne benannte Ansprechperson kein Hash-Abgleich.**

---

## 13 · Was das Backend ausdrücklich nicht hat

**Diese Liste ist so wichtig wie die Bildschirme.** Jede Zeile ist eine Funktion, die technisch leicht wäre und deshalb ohne ausdrückliches Verbot irgendwann gebaut würde.

| # | Gibt es nicht | Warum nicht |
|---|---|---|
| 1 | **Suche über Zone 2** — kein Feld, kein Filter, keine Liste privater Inhalte | Das Backend kann Zone 2 nur über eine konkrete Fall-ID öffnen. Ohne Suchfunktion ist „wir lesen nicht mit" eine Berechtigungsregel und keine Absichtserklärung |
| 2 | **Stichproben** — keine zufällige Auswahl privater Inhalte zur Qualitätskontrolle | Eine Stichprobe ist ein Zugriff ohne Anlass. Qualität wird an Entscheidungen gemessen, nicht an Inhalten |
| 3 | **Export von Chatinhalten ohne Fall** | Ohne Fall-ID gibt es keinen Ausgang für Inhalte aus dem Werkzeug heraus |
| 4 | **Nutzersuche nach Name, Mailadresse oder Standort** | Ein Konto wird über eine Fall-ID erreicht, nie über eine Personensuche |
| 5 | **Profilansicht wie in der App** | Moderiert wird ein Inhalt, nicht ein Mensch. Gezeigt wird, was für die Entscheidung nötig ist |
| 6 | **Standortverlauf** | Er entsteht gar nicht — es gibt keinen genauen Standort, nur Zellmittelpunkte |
| 7 | **Vorschaubilder bei Hash-Treffern** | Zusage aus `moderationsarchitektur.md`, Abschnitt 7, Regel 4 |
| 8 | **Löschen von Protokolleinträgen** | Auch nicht für BETRIEB, auch nicht mit Begründung |
| 9 | **Löschen gesicherter Falldateien** | Löschen entscheidet die Behörde |
| 10 | **Notfallzugang, der das Vier-Augen-Prinzip aufhebt** | Er würde benutzt |
| 11 | **Automatische Kontosperre** | Art. 22 DSGVO |
| 12 | **Leistungsstatistik je Moderierender** (Fälle je Stunde, Abgabequote) | Sie würde genau das Verhalten bestrafen, das sicher ist: langsam entscheiden, abgeben, zurücklegen |
| 13 | **Einstellbare Tagesgrenze und Uhrzeitsperre** | Eine Grenze, die man im Ernstfall hochsetzt, ist keine |
| 14 | **Automatische Antwort, die wie ein Mensch klingt** (M85) | Eine Eingangsbestätigung ist ehrlich. Eine Antwort, die vorgibt, gelesen worden zu sein, ist es nicht |
| 15 | **Zufriedenheitsbewertung von Vorgängen** (M85) | Sie erzeugt Druck auf eine Kennzahl, die mit dem Schutzauftrag nichts zu tun hat. Wer eine berechtigte Sperre erklärt, bekommt keine gute Bewertung — und soll es trotzdem tun |
| 16 | **Volltextsuche über alle Vorgänge** (M85) | Gesucht wird nach Fallnummer. Eine durchsuchbare Sammlung von Hilfetexten ist eine durchsuchbare Sammlung persönlicher Notlagen |
| 17 | **Weitergabe von Vorgängen an einen externen Dienstleister** (M85) | Ein Vorgang aus diesem Produkt ist regelmäßig ein Art-9-Datum. Er verlässt das eigene Werkzeug nicht |

**Der Maßstab dahinter:** Bei jeder Funktion, die hier fehlt, wurde gefragt, was schlimmer wäre — sie nicht zu haben, oder sie an einem schlechten Tag zu haben. Siebzehnmal war die Antwort dieselbe.

---

## 14 · Abnahme: die vier Zusagen und ihre Testfälle

`moderationsarchitektur.md`, Abschnitt 7, macht vier Zusagen. Jede ist hier einer Rechte-Regel zugeordnet, die sich als Test schreiben lässt — das ist die Abnahmebedingung dieser Aufgabe.

| Zusage | Rechte-Regel im Backend | Testfall | Erwartetes Ergebnis |
|---|---|---|---|
| **1 · Kein Zugriff ohne Anlass.** Das Backend kann Zone 2 nicht durchsuchen, nur konkrete Fall-IDs öffnen | Keine Suchschnittstelle über Zone-2-Inhalte; jede Leseanfrage verlangt eine gültige Fall-ID (M20.02, M30.01); Abschnitt 11 Nummer 1 bis 4 | Leseanfrage auf einen Zone-2-Inhalt **ohne** Fall-ID aus einem Backend-Konto; zusätzlich Aufruf jeder bekannten Listen- und Suchadresse | Abweisung mit Fehler; **keine** Adresse liefert eine Liste privater Inhalte |
| **2 · Jeder Zugriff wird protokolliert; Moderierende können eigene Einträge nicht löschen** | Jede 📋-Handlung schreibt zuerst den Protokolleintrag und führt dann aus; Schreibrecht ja, Änderungs- und Löschrecht für niemanden (M60.02, Abschnitt 11 Nummer 8) | Inhalt öffnen, dann versuchen, den eigenen Eintrag zu löschen und zu ändern — als MOD und als BETRIEB; danach Protokollschreiben künstlich abschalten und erneut einen Inhalt öffnen | Löschen und Ändern scheitern in beiden Rollen; bei abgeschaltetem Protokoll **wird der Inhalt nicht geöffnet** |
| **3 · Vier-Augen-Prinzip bei Sperrentscheidungen** | Eine Sperre wirkt erst nach Freigabe durch eine **andere** angemeldete Person; Antragsteller und Freigebende dürfen nicht dieselbe Kennung sein (M40.04); kein Notfallzugang (Abschnitt 11 Nummer 10) | Sperre beantragen und mit derselben Kennung freigeben; danach dieselbe Person über zwei Sitzungen; danach als BETRIEB allein | Alle drei Versuche scheitern; die Sperre bleibt Entwurf, das Konto unverändert |
| **4 · Keine Vorschaubilder bei Hash-Treffern** | Die Fallansicht M30 liefert Fall-ID, Zeitpunkt, Zone, Konto, IP — und **keinen Bildverweis**; ein Bild ist nur über M30.08 mit Grund und zweiter Person erreichbar | Antwort der Fallansicht auf Bildverweise prüfen; M30.08 ohne Grund und ohne zweite Person auslösen | Die Antwort enthält keinen Bildverweis; M30.08 scheitert ohne Grund und ohne zweite Person |

**Zusätzlich prüfbar, aus A-36 Abschnitt 7:**

| Zusage | Regel | Testfall | Ergebnis |
|---|---|---|---|
| Höchstens zwei Hash-Fälle je Person und Tag | M90.01 als Sperre, nicht als Warnung | dritten Fall am selben Tag öffnen | Abweisung, Angebot zur Übergabe |
| Keiner nach 21 Uhr | M90.02 | Fall um 21:30 Uhr öffnen | Abweisung mit Hinweis auf die Frist |
| Ohne Ansprechperson kein Abgleich | M90.06 als Pflichtfeld | Hash-Abgleich ohne hinterlegte Ansprechperson einschalten | Einschalten nicht möglich |

---

## 15 · Offene Punkte

| # | Punkt | Wirkung auf welchen Bildschirm | Woran es hängt |
|---|---|---|---|
| 1 | Darf ein Konto bei einem Hash-Treffer vorläufig eingeschränkt werden? | M30.07 — im Auslieferungszustand gesperrt | **Nr. 31**, Anwaltstermin |
| 2 | Wird in Zone 2 überhaupt abgeglichen? | M30 entsteht dort sonst nicht | **Nr. 30**, Anwaltstermin |
| 3 | Wie lange dürfen Inhalte aus Meldefällen aufbewahrt werden? | M20.08 (Frist), M60 | **AF-12** |
| 4 | Braucht eine Meldung in der App die Angaben nach Art. 16 Abs. 2 DSA? | M20.01 (Meldegrund), Pflichtfelder | **AF-07** |
| 5 | Mit welchen Merkmalen darf ein gesperrtes Konto wiedererkannt werden? | M40 — heute ohne Wiedererkennung gebaut | **AF-08** |
| 6 | Bezahlte Hervorhebung von Orten | M70 — bewusst nicht vorgesehen | **Nr. 65 entschieden 19.09.2026: keine**; **Nr. 91 entschieden 26.09.2026: auch nicht im Tausch.** Neu zu bauen ist stattdessen das **Kennzeichen** für Einträge zahlender Werkzeugkonten (Nr. 87, AK-F31-08) |
| 7 | Gilt der Abgleich auch für gemeldete Inhalte (Zone 3)? | M20 — heute kein Abgleich beim Eingang | Vorschlag aus A-36, offener Punkt 8 |
| 8 | Rechteumfang einer angestellten Moderationskraft ab 15.000 aktiven Nutzern | alle Bildschirme | vor der Einstellung zu entscheiden; Vorschlag: MOD ohne M80 und ohne M60.03 |

---

## 16 · Was dieses Dokument nicht ist

- **Keine Gestaltung.** Das Backend bekommt kein Gestaltungsbudget; Lesbarkeit und Berührflächen genügen.
- **Keine Rechtsauskunft.** Die genannten Vorschriften sind zusammengefasst, nicht ausgelegt.
- **Keine Erkennungsbeschreibung.** Schwellenwerte, Listen und Verfahren stehen hier bewusst nicht.
- **Keine Endfassung.** Nach den Interviews (A-19) und der Anwaltsantwort werden mindestens die acht Punkte aus Abschnitt 13 nachgezogen.

---

## 17 · Prüfprotokoll

Programmatisch geprüft am 18.09.2026 mit dem Bauskript dieses Dokuments.

| Prüfung | Ergebnis |
|---|---|
| Jeder Bildschirm hat Zweck, Elementtabelle, Zustände, Rechte-Tabelle und Interaktionen | 10 von 10 |
| Alle Anker sind eindeutig und lückenlos je Bildschirm nummeriert | 75 Anker |
| Jede Interaktion zeigt auf einen vorhandenen Bildschirm oder Anker | bestanden |
| Jede der vier Zusagen aus A-37 Abschnitt 7 hat Regel und Testfall | 4 von 4 |
| Jede genannte Entscheidungsnummer existiert in `../01-steuerung/offene-entscheidungen.md` | bestanden |
| Jede genannte AF-Nummer existiert in `produktspezifikation.md` | bestanden |
| Jeder genannte Projektpfad existiert | bestanden |
| Keine der 13 ausgeschlossenen Funktionen kommt als Element vor | bestanden |
| Auszeichnung (markdownlint) | im Bau geprüft |

**Was nicht geprüft werden konnte:** ob die Rechte im gebauten Werkzeug tatsächlich so wirken. Dafür sind die Testfälle aus Abschnitt 12 da — sie gehören als Tests in AP-4 und AP-5, nicht in eine Abnahme per Augenschein.
