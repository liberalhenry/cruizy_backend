# Moderationsarchitektur — das Gesamtbild

Erstellt: 27.07.2026, 03:00 Uhr · Aufgabe A-37 · Rolle: Trust-&-Safety-Architekt · Fenster **V2**, Grundsätze aber **jetzt** verbindlich
Grundlage: Handbuch A (Funktionskatalog, Mikro-UX, Bildpipeline), `../10-recht-gruendung/hash-abgleich-zugangswege.md` (A-08), `../10-recht-gruendung/jmstv-problem-und-einschaetzung.md`
Gehört zu: A-29 (Produktspezifikation), A-30 (Nutzerabläufe), A-36 (Trefferprozess) · Code: AP-4 Bildpipeline

> **Warum dieses Dokument existiert.** Handbuch A sagt „Vorabprüfung aller öffentlichen Fotos". Das liest sich, als würde ein Mensch jedes Bild ansehen. Das wäre weder machbar noch gewollt. Dieses Dokument beschreibt, was tatsächlich passiert — und vor allem, **wo bewusst niemand hinschaut.**

---

## 1 · Das Grundprinzip in drei Sätzen

Moderation ist nicht eine Sache, sondern drei. Sie unterscheiden sich technisch, rechtlich und in dem, was wir Nutzern versprechen.

**Der Satz, an dem sich alles ausrichtet:**

> **In privater Kommunikation sieht ein Mensch nur dann etwas, wenn ein Beteiligter selbst darum bittet — oder wenn das Gesetz keine Wahl lässt.**

Dieser Satz ist überprüfbar, er hält, und er darf so an Nutzer gehen. Ein Versprechen wie „wir sehen eure Bilder nie" wäre falsch, weil es keine Architektur gibt, in der eine Meldefunktion existiert und trotzdem niemals ein Mensch hinsieht. Der DSA verlangt die Meldefunktion.

---

## 2 · Die drei Zonen

| | **Zone 1 — öffentlich** | **Zone 2 — privat** | **Zone 3 — gemeldet** |
|---|---|---|---|
| **Was** | Profilbilder, die im Raster sichtbar sind | Bilder im Chat und in privaten Alben | Alles, was ein Nutzer meldet |
| **Wer entscheidet über Sichtbarkeit** | wir, vor Freischaltung | niemand — es geht direkt an den Empfänger | der Meldende hat die Vertraulichkeit selbst geöffnet |
| **Hausordnung durchgesetzt?** | ja: keine expliziten Inhalte | **nein** — dort ist explizit erlaubt | Prüfung im Einzelfall |
| **Klassifikator aktiv?** | ja | **nein** | nein, aber Mensch schaut |
| **Hash-Abgleich aktiv?** | ja¹ | ja¹ | ja¹ |
| **Menschliche Warteschlange?** | ja, nur Graubereich | **nein** | ja, immer |
| **Rechtlich** | Hosting von öffentlich zugänglichen Inhalten | interpersonelle Kommunikation | Meldeverfahren nach DSA Art. 16 |

¹ *Im Übergangszustand nach Beschluss vom 27.09.2026 ist Stufe 1 ein Steckplatz mit ausgeschaltetem Schalter. Dieser Zustand trägt nur erfundene Testdaten — Betrieb mit echten Menschen ist gesperrt (Nr. 98, Weg b). Siehe Kasten in Stufe 1.*

**Die wichtigste Zeile dieser Tabelle ist „Klassifikator aktiv?".** In Zone 2 ist Nacktheit erlaubt — sie ist Teil des Produkts. Ein Klassifikator, der dort nach Nacktheit sucht, würde also nichts erkennen, was verboten wäre, und dabei jedes Bild bewerten. Er hat dort nichts zu suchen. **In Zone 2 läuft ausschließlich der Hash-Abgleich, und der stellt genau eine Frage: Ist das ein bekanntes Missbrauchsbild?**

---

## 3 · Die Prüfkette

Vier Stufen. Die ersten drei laufen vollautomatisch in Millisekunden.

### Stufe 0 · Technische Aufbereitung

Dateityp und Größe prüfen, **EXIF-Daten entfernen** (Standort, Gerät, Zeitstempel), Bild neu kodieren. Das Neukodieren entfernt versteckte Datenanhänge und normalisiert das Format für die nächste Stufe.

*Läuft in: Zone 1 und 2. Dauer: wenige Millisekunden.*

### Stufe 1 · Hash-Abgleich

> **⚠ Übergangszustand, beschlossen am 27.09.2026 — ✔ aufgelöst am selben Tag durch Nr. 98, Weg (b).** Der Zugang zum Hash-Abgleich wird **später** beantragt, und diese Stufe wird als **Steckplatz** gebaut: Schnittstelle, Zustand „Hash-Prüfung ausstehend", Schalter `P-HASH-AKTIV`. Solange der Schalter aus ist, arbeiten Stufe 2 und Stufe 3 allein, und **bekanntes Missbrauchsmaterial wird nicht automatisch erkannt** — deshalb trägt dieser Zustand **ausschließlich erfundene Testdaten**: Weder die geschlossene Testphase mit 200 Personen noch der öffentliche Start lassen sich freigeben, solange der Schalter aus ist (Spezifikation AK-M02-11). **Die Zusage dieses Dokuments ist damit eingehalten** — kein Bild eines echten Menschen erscheint ohne Hash-Abgleich. Die Rechtsfrage **W18** bleibt gestellt, weil sie auch nach der Anbindung trägt. Die Schnittstelle bildet **Hash- und Medienübermittlung** ab, weil noch offen ist, welche Bauform der Anbieter verlangt (Grundsatz G-01). Dieses Dokument bleibt im Übrigen unverändert die verbindliche Vorgabe.

Wahrnehmungs-Hash berechnen, gegen die Liste bekannter Missbrauchsdarstellungen prüfen.

**Das Ergebnis ist binär.** Treffer oder kein Treffer, praktisch keine Fehlalarme. **Bei Treffer greift eine harte automatische Sperre** — das Bild wird nicht ausgeliefert, nicht angezeigt, nicht zugestellt. Es wird gesichert und der Prozess aus A-36 startet.

**Wichtig: Auch bei einem Treffer muss niemand das Bild ansehen.** Der Hash *ist* die Bestätigung. Das Moderations-Backend zeigt eine Fall-ID und einen Hashwert — kein Vorschaubild.

*Läuft in: Zone 1 und 2. Dauer: Millisekunden bei lokaler Liste, bis ~200 ms bei API-Abfrage.*

### Stufe 2 · Klassifikator

Ein selbst gehostetes Modell schätzt: Wie wahrscheinlich enthält dieses Bild explizite Inhalte?

**Das Ergebnis ist keine Entscheidung, sondern eine Weiche.** Drei Spuren:

| Spur | Was passiert | Anteil (Zielwert) |
|---|---|---|
| unter der unteren Schwelle | automatisch freigeschaltet, kein Mensch involviert | ~85–92 % |
| über der oberen Schwelle | automatisch abgelehnt, mit Hinweis und Einspruchsmöglichkeit | ~3–5 % |
| dazwischen | Warteschlange für menschliche Sichtung | ~5–10 % |

Die beiden Schwellenwerte sind **Stellschrauben**, keine Naturkonstanten. Sie werden in der Beta kalibriert: Untere Schwelle zu hoch heißt zu viel Handarbeit, obere Schwelle zu niedrig heißt falsche Ablehnungen und verärgerte Nutzer.

*Läuft ausschließlich in Zone 1. Dauer: ~50–150 ms, selbst gehostet.*

### Stufe 3 · Mensch

Nur die mittlere Spur aus Zone 1, plus alles aus Zone 3.

---

## 4 · Was das in Zahlen bedeutet

**Alle Zahlen dieses Abschnitts sind Schätzungen mit offengelegter Rechnung, keine Erfahrungswerte.** Sie werden in der Beta durch echte Zahlen ersetzt.

**Annahmen:**

| Größe | Wert | Woher |
|---|---|---|
| Monatliches Nutzerwachstum in der Wachstumsphase | 10 % | Schätzung |
| Öffentliche Bilder je Neuregistrierung | 2,5 | Schätzung |
| Bildwechsel je Bestandsnutzer und Monat | 0,3 (also etwa alle drei Monate) | Schätzung |
| Anteil Graubereich | 5–10 % | Zielwert der Kalibrierung |

**Rechnung Zone 1:**

```
Bilder je Monat = (MAU × 0,10 × 2,5) + (MAU × 0,3)
Bilder je Tag   = Bilder je Monat ÷ 30
Warteschlange   = Bilder je Tag × 0,05 bis 0,10
```

| Stufe | MAU | Bilder/Monat | Bilder/Tag | **Warteschlange/Tag** | Zeitaufwand bei 20 Sek. je Bild |
|---|---|---|---|---|---|
| Beta | 150 | 82 | 3 | **unter 1** | Minuten je Woche |
| Tor 3 (Köln) | 3.500 | 1.925 | 64 | **3–6** | ca. 2 Minuten |
| Erste Moderationskraft | 15.000 | 8.250 | 275 | **14–28** | 5–10 Minuten |
| Zweite Stadt läuft | 40.000 | 22.000 | 733 | **37–73** | 12–25 Minuten |

**Das ist der Punkt, der die Sorge auflöst:** Selbst bei 40.000 Nutzern sind es keine Stunden, sondern Minuten. Und die Schwelle, ab der Handbuch B die erste Moderationskraft einplant — 15.000 MAU — passt genau zu dem Punkt, an dem der tägliche Aufwand aus dem Nebenbei herausfällt.

**Anmeldewellen** ändern daran wenig, weil die Warteschlange nicht zeitkritisch ist. Ein Bild, das drei Stunden auf Freischaltung wartet, ist ein Komfortproblem, kein Sicherheitsproblem. Bei einer Welle wächst nur die Wartezeit, nicht die Gefahr.

**Zone 2** lässt sich schlechter schätzen, weil Bildaustausch erst nach beidseitiger Antwort möglich ist. Das ist aber unerheblich: **In Zone 2 entsteht kein menschlicher Aufwand.** Die Menge beeinflusst nur die Rechenlast und gegebenenfalls die Kosten je Hash-Abfrage — nicht eure Zeit.

---

## 5 · Zeiten und Zusagen

| Vorgang | Zusage | Warum diese Zahl |
|---|---|---|
| Stufen 0 bis 2 | unter 500 ms | Der Nutzer soll nichts merken |
| Zone 1, Graubereich, tagsüber | unter 2 Stunden | Bei 3–6 Bildern am Tag machbar |
| Zone 1, Graubereich, gesamt | unter 12 Stunden | Auch nachts und am Wochenende |
| Zone 3, Meldung: Fallnummer | sofort, automatisch | DSA verlangt Bestätigung |
| Zone 3, Meldung: Entscheidung | unter 24 Stunden | Selbstverpflichtung, ehrgeizig aber machbar |
| **Hash-Treffer** | **sofort, ohne Ermessen** | Kein Abwägen, kein Warten |
| Einspruch gegen eine Ablehnung | unter 48 Stunden | DSA Art. 17 verlangt Begründung |

Diese Zeiten gehören in die AGB und auf eine öffentliche Seite. Sie sind gleichzeitig ein Verkaufsargument — kein Wettbewerber nennt sie.

---

## 6 · Speicherung und Aufbewahrung

| Was | Wo | Wie lange | Zugriff |
|---|---|---|---|
| Öffentliches Profilbild | verschlüsselte Ablage, getrennt von Chatbildern | solange im Profil | Moderations-Backend, nur Graubereich und Meldungen |
| **Chatbild** | **eigene, getrennte verschlüsselte Ablage** | nach Chatregeln (24-Std.-Archiv, Albenlogik) | **kein Lesezugriff aus dem Moderations-Backend** |
| Klassifikator-Wert Zone 1 | Metadatensatz | bis zur Entscheidung, danach nur Ergebnis | Moderations-Backend |
| **Klassifikator-Wert Zone 2** | **entsteht nicht** | — | — |
| Hash-Treffer | versiegelter Fallordner | nach Vorgabe der Behörde | nur über Fall-ID, jeder Zugriff protokolliert |
| Zugriffsprotokoll | eigene Ablage, nicht löschbar durch Moderierende | mindestens 12 Monate | beide Gründer, gegenseitig einsehbar |

**Die getrennte Ablage ist keine Ordnungsfrage, sondern die technische Durchsetzung des Zonenprinzips.** Wenn das Moderations-Backend auf Zone 2 keinen Lesezugriff hat, dann ist „wir gucken nicht rein" keine Absichtserklärung, sondern eine Berechtigungsregel.

---

## 7 · Zugriffsregeln

**Vier Regeln, die zusammen das Versprechen tragen:**

1. **Kein Zugriff ohne Anlass.** Das Moderations-Backend kann Zone 2 nicht durchsuchen. Es kann nur konkrete Fall-IDs öffnen, die durch eine Meldung oder einen Hash-Treffer entstanden sind.

2. **Jeder Zugriff wird protokolliert.** Wer, wann, welcher Fall, welche Begründung. Beide Gründer sehen die Protokolle des jeweils anderen. Moderierende können ihre eigenen Einträge nicht löschen.

3. **Vier-Augen-Prinzip bei Sperrentscheidungen.** Eine Kontosperre braucht zwei Personen. In der Anfangszeit heißt das: beide Gründer.

4. **Keine Vorschaubilder bei Hash-Treffern.** Das Moderations-Backend zeigt Fall-ID, Hashwert, Zeitpunkt und Konto — kein Bild. Wer das Bild sehen müsste, braucht dafür einen dokumentierten Grund und einen zweiten Menschen.

**Regel 2 ist die wichtigste.** Sie schützt nicht nur die Nutzer. Wenn euch jemand vorwirft, in privaten Chats gelesen zu haben, ist das Protokoll euer Beweis — und wenn einer von euch es doch täte, würde es der andere sehen.

---

## 8 · Automatisch entscheiden — wo ja, wo nein

Art. 22 DSGVO verbietet rein automatisierte Entscheidungen mit erheblicher Wirkung. Die Trennlinie ist scharf:

| Entscheidung | Automatisch zulässig? |
|---|---|
| **Ein Bild** sperren oder ablehnen | **Ja.** Betrifft einen Inhalt, ist mit Einspruch versehen, nicht erheblich im Sinne der Vorschrift |
| Ein Bild in die Warteschlange schieben | Ja, ist gar keine Entscheidung |
| **Ein Konto** sperren | **Nein.** Immer menschliche Prüfung, immer Widerspruchsmöglichkeit |
| Ein Konto vorläufig einschränken bei Hash-Treffer | Vermutlich ja, aber **Anwaltsfrage** — Gefahr im Verzug gegen Art. 22 |

Die letzte Zeile ist echt offen und gehört auf die Anwaltsliste.

---

## 9 · Rechtliche Musterlösung, je Zone

*Vorschlag für den Fachanwalt, keine Rechtsberatung.*

**Zone 1.** Prüfung öffentlich sichtbarer Inhalte vor Freischaltung. Rechtsgrundlage: Durchsetzung der eigenen Nutzungsbedingungen plus berechtigtes Interesse an einem rechtskonformen Angebot; bei Art.-9-Bezug zusätzlich die Einwilligung. Transparenzpflicht nach DSA Art. 14: Die Moderationspraxis gehört ausdrücklich in die AGB.

**Zone 2.** Der heikle Teil. Der Hash-Abgleich in interpersoneller Kommunikation stützte sich auf die ePrivacy-Ausnahme, die am 03./04.04.2026 auslief; die Verlängerung bis April 2028 ist vom Parlament beschlossen, aber vom Rat noch nicht bestätigt. **Bis das geklärt ist, ist Zone 2 als Konfigurationsschalter zu bauen** — abschaltbar, ohne dass etwas anderes bricht.

> *Nachtrag 15.09.2026 (R-01):* Der Rat hat die Verlängerung am 23.07.2026 bestätigt. Sie gilt bis **03.04.2028** und endet damit drei Monate vor T0. Ohne dauerhafte CSA-Verordnung startet Zone 2 voraussichtlich mit ausgeschaltetem Schalter. Der Nutzertext aus Abschnitt 11 liegt deshalb in zwei Fassungen vor: `systemtexte-ENTWURF.md`, ST-DAT-20.

**Zone 3.** Melde- und Abhilfeverfahren nach DSA Art. 16, Begründungspflicht nach Art. 17, Meldung an Behörden bei Verdacht auf schwere Straftaten nach Art. 18. Diese Pflichten treffen uns **unabhängig von der Größenausnahme** in Art. 19.

**Querschnittlich:** kein Auftragsverarbeiter außerhalb der EU · Verarbeitungsverzeichnis · Folgenabschätzung mit ausdrücklicher Aufnahme des Klassifikators und des Hash-Abgleichs · Einordnung des Klassifikators nach KI-VO (siehe offene Entscheidung Nr. 24).

---

## 10 · Datenschutz-Musterlösung

**Datenminimierung als Bauweise, nicht als Absicht.**

- Klassifikator **selbst gehostet**. Kein Bild geht an einen externen Dienst.
- Hashing **lokal**. Nur der Hash verlässt das Haus, und er ist nicht rückrechenbar.
- Kein Bild verlässt die EU — nicht als Regel, sondern weil kein Pfad dafür existiert.
- In Zone 2 wird der Klassifikator gar nicht erst ausgeführt. **Was nicht berechnet wird, kann nicht gespeichert und nicht herausgegeben werden.**
- EXIF-Entfernung vor jeder weiteren Verarbeitung.
- Getrennte Ablagen mit getrennten Berechtigungen.
- Zugriffsprotokoll als technische Kontrolle, nicht als Vertrauensfrage.

**Transparenz als Verkaufsargument.** Der DSA verlangt ohnehin, dass die Moderationspraxis beschrieben wird. Wer sie verständlich beschreibt statt juristisch, gewinnt dabei etwas — bei einer Zielgruppe, die vorbelastet ist, sogar viel.

---

## 11 · Was wir Nutzern sagen

Entwürfe im Tonfall aus Handbuch A. Endfassung mit A-14 (Systemtexte) abgleichen. *Nachtrag 15.09.2026: abgeglichen — zwei Fassungen je nach Schalterstellung für Zone 2 in `systemtexte-ENTWURF.md`, ST-DAT-20.*

**Im Datenkonto oder in den AGB:**

> **Was wir prüfen — und was nicht**
>
> **Dein öffentliches Profilbild** schauen wir uns an, bevor es sichtbar wird. Das macht in den meisten Fällen ein Programm; nur wenn es sich nicht sicher ist, sieht ein Mensch nach. Wir tun das, weil im öffentlichen Bereich keine expliziten Bilder stehen sollen.
>
> **Was du privat schickst, sieht niemand außer dem Empfänger.** Kein Programm bewertet es, kein Mensch schaut hinein, wir speichern keine Einschätzung dazu.
>
> Eine einzige Prüfung läuft auch dort: ein Abgleich gegen bekannte Missbrauchsdarstellungen von Kindern. Dabei wird aus deinem Bild eine Zahl berechnet und mit einer Liste verglichen. Aus dieser Zahl lässt sich dein Bild nicht wiederherstellen, und wenn es keinen Treffer gibt, bleibt nichts davon übrig.
>
> **Die Ausnahme:** Wenn dein Gegenüber ein Bild meldet, muss jemand von uns es ansehen können. Sonst wäre die Meldefunktion wertlos. Jeder solche Zugriff wird protokolliert, und wir sehen gegenseitig, was der andere geöffnet hat.

**Kurzfassung für die Wartelistenseite oder einen Beitrag:**

> Was du privat schickst, sieht niemand außer dem Empfänger — außer der Empfänger bittet uns um Hilfe.

---

## 12 · Was bewusst nicht gebaut wird

| Nicht | Warum |
|---|---|
| Klassifikator in Zone 2 | Dort ist explizit erlaubt. Er würde nichts Verbotenes finden und dabei alles bewerten. |
| Stichproben in privaten Chats | Es gibt keinen Anlass, und ein Anlass lässt sich nicht nachträglich erfinden. |
| Durchsuchbarkeit von Zone 2 im Backend | Was durchsuchbar ist, wird irgendwann durchsucht. |
| Vorschaubilder bei Hash-Treffern | Niemand muss das ansehen, um zu wissen, was es ist. |
| Automatische Kontosperre | Art. 22 DSGVO. Und Fehler in dieser Richtung sind nicht heilbar. |
| Externe Moderationsdienstleister außerhalb der EU | Widerspricht der Grundregel und der Positionierung. |
| Speicherung von Klassifikator-Werten nach der Entscheidung | Nicht mehr nötig, also weg. |

---

## 13 · Offene Punkte

| # | Punkt | Wer | Wann |
|---|---|---|---|
| 1 | Rechtsgrundlage Zone 2 (offene Entscheidung Nr. 30) | Anwalt | Anwaltstermin |
| 2 | Vorläufige Kontoeinschränkung bei Hash-Treffer — zulässig ohne Menschen? | Anwalt | Anwaltstermin |
| 3 | Einordnung des Klassifikators nach KI-VO (Nr. 24) | Anwalt | vor AP-4 |
| 4 | Schwellenwerte kalibrieren — echte Zahlen aus der Beta | **[M]** in 1d | Beta |
| 5 | Auswahl des Klassifikator-Modells, Lizenzlage, Verzerrungen bei Hauttönen prüfen | **[KI→F]** | V2 |
| 6 | Trefferprozess im Detail (A-36) | **[KI→F]** | V2 |
| 7 | Mengengerüst gegen echte Zahlen ersetzen | **[KI]** | ab Beta |
| 8 | Belastung der Moderierenden: Obergrenzen, Ansprechperson, Begleitung | **[M]** | vor Launch |

**Zu Punkt 5 ausdrücklich:** Klassifikatoren für explizite Inhalte sind dafür bekannt, bei dunkleren Hauttönen und bei bestimmten Körperformen häufiger falsch zu liegen. Wer das nicht prüft, baut eine Diskriminierung ein, die im Graubereich landet und dort unsichtbar bleibt. Das gehört in dieselbe Runde wie das Gegenlesen der Taxonomie.

---

## 14 · Der Merksatz

> **Zone 1: Wir prüfen, weil es öffentlich ist.
> Zone 2: Wir prüfen nur, ob es strafbar Bekanntes ist — sonst nichts.
> Zone 3: Wir schauen hin, weil jemand darum gebeten hat.**

Alles andere ist Ausführung.
