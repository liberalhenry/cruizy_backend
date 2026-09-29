# Nachtrag 05 zur Anwaltsakte — Fragen aus den Beschlüssen vom 26. und 27.09.2026

Erstellt: 26.09.2026 · Ergänzung zu `anwaltsakte-cruizy.docx` und den Nachträgen 01 bis 04
Anlass: Am 26.09.2026 sind 28 Punkte beantwortet worden (`../../01-steuerung/beschluesse-2026-09-26.md`), am 27.09.2026 sieben weitere (`../../01-steuerung/beschluesse-2026-09-27.md`). Sechs davon erzeugen neue Rechtsfragen, und einer ändert die Reihenfolge, in der der Anwalt überhaupt gebraucht wird. Dazu sind am 27.09.2026 die zwölf folgenschwersten Festlegungen beantwortet worden (Nr. 68) — daraus folgen **AF-13** und die Schärfung von **K6** und **AF-09**.

> **Dieser Nachtrag sammelt und sortiert — er beantwortet nichts.** Er ist keine Rechtsberatung. Jede Frage bleibt in dem Dokument, in dem sie begründet ist; hier steht sie mit Rang und Fundstelle.

---

## Das Wichtigste zuerst: **K1 wird vorgezogen**

**Beschluss Nr. 88, Weg (c), vom 26.09.2026.** Die Frage, ob das Produktkonzept die Pflicht zur geschlossenen Benutzergruppe nach **§ 4 Abs. 2 JMStV** auslöst (**K1**), wird **nicht** mehr im großen Anwaltstermin 2028 gestellt, sondern **vorab als Einzelmandat**.

| | |
|---|---|
| **Warum** | Sitzung **S8** des Code-Planers kann ohne diese Antwort nicht gebaut werden. Wartet sie auf 2028, wartet sechzehn Monate Bauzeit auf einen Termin |
| **Was beauftragt wird** | eine schriftliche Einschätzung zu **K1**, nicht ein vollständiges Jugendschutzkonzept. Das Gutachten (2.500 €) folgt später |
| **Kostenrahmen** | **400 bis 900 €** (ANNAHME A-64, nicht erfragt) für eine schriftliche Einzelfrage bei einem Fachanwalt für IT-Recht mit Jugendmedienschutz-Erfahrung |
| **Wer beauftragt** | die Gründer persönlich — die GmbH gibt es noch nicht (Nr. 22). Damit haftet die **Vorgründungsgesellschaft** (Nr. 26), eine GbR mit unbeschränkter persönlicher Haftung |
| **Was mitgefragt wird** | **K11** (unten): wo „Nacktheit“ endet und „explizit“ beginnt — die Grenze, die Beschluss **Nr. 92** ausdrücklich dem Anwalt überlässt |

**Was dem Mandat beigelegt wird:** `../altersverifikation-stand-2026.md`, die Zonenarchitektur aus `../../50-produkt-prototyp/moderationsarchitektur.md` (Abschnitt 2), die Zustände Gast/Geprüft/Identifiziert aus der Spezifikation (Abschnitt 4.0) und Nachtrag 01, der die Verifizierungswege schon aufbereitet hat. **Nicht** beigelegt wird das Finanzmodell — die Frage ist rechtlich, nicht wirtschaftlich.

---

## Die neuen Fragen

### K11 · Wo endet Nacktheit, wo beginnt Explizites?

**Aus Beschluss Nr. 92 (Weg a).** Der öffentliche Bereich (Zone 1) bleibt auch in der Webfassung frei von **expliziten** Inhalten; **Nacktheit ohne explizite Darstellung** ist im Profil erlaubt und erscheint in den nativen Apps unkenntlich.

| | |
|---|---|
| **Die Frage** | Welche Darstellung ist „Pornografie“ im Sinne des § 4 Abs. 2 JMStV, und welche ist einfache Nacktheit? Genügt eine Hausordnung mit Beispielen, oder verlangt die Abgrenzung eine andere Form? |
| **Warum sie zählt** | Sie bestimmt, was die Bildprüfung (AP-4, Sitzung S10) ablehnt — und ob der öffentliche Bereich eine geschlossene Benutzergruppe braucht |
| **Rang** | **mit K1 zusammen**, weil beide dieselbe Norm betreffen |
| **Fundstelle** | `../../50-produkt-prototyp/produktspezifikation.md`, F10 und ⚠ W-30 (aufgelöst); Nr. 92 |

**Was wir vorschlagen und bestätigt haben wollen:** Bis zur Antwort behandelt die Prüfkette ein Bild **im Zweifel als explizit** und entzieht es Zone 1. Der Fehler in diese Richtung kostet einen Einspruch; der Fehler in die andere Richtung kostet die Store-Zulassung.

---

### G14 · Privat vorfinanzierte Prüfkosten — wie kommen sie in die GmbH?

**Aus Beschluss Nr. 88 (c) und der daraus entstandenen Entscheidung Nr. 94.** Der Gründungsaufwand ist auf **2.600 €** begrenzt (GV6, Nr. 29). Privat vorgelegte Prüfkosten liegen darüber — im Höchstfall bei **39.900 €**.

| | |
|---|---|
| **Die Frage** | Welcher Weg trägt: **(a)** Gesellschafterdarlehen, **(b)** Sacheinlage der Vorgründungsgesellschaft mit Bewertung und Sachgründungsbericht, oder **(c)** endgültig privat getragen? Und welche Gestaltung vermeidet zuverlässig eine **verdeckte Einlagenrückgewähr**? |
| **Was wir vorschlagen** | **(a)**, schriftlich vereinbart **vor der ersten Zahlung** an einen Prüfer, mit Rangrücktritt und fremdvergleichsfähigem Zins |
| **Rang** | **vor der ersten Zahlung an einen Prüfer** — also möglicherweise vor allem anderen |
| **Fundstelle** | `../rechtstexte-entwuerfe/gesellschaftsvertrag-eckpunkte-ENTWURF.md`, Abschnitt 4.6; Nr. 94; verwandt mit **GV13** |

---

### G15 · Prüfvertrag ohne Gesellschaft

**Aus Beschluss Nr. 88 (c).** Sitzung **S10** braucht einen Vertrag mit einem Anbieter der Altersprüfung. Ohne Firma schließt den niemand — außer den Gründern persönlich.

| | |
|---|---|
| **Die Frage** | Kann die Vorgründungsgesellschaft einen solchen Vertrag schließen, und **geht er auf die GmbH über**, wenn sie entsteht? Welche Klausel braucht der Vertrag dafür? Welche persönliche Haftung bleibt, wenn die GmbH nicht zustande kommt? |
| **Warum sie zählt** | Ein Prüfanbietervertrag ist ein Dauerschuldverhältnis mit Datenverarbeitung. Bleibt er bei den Gründern, bleibt auch die Verantwortlichkeit nach Art. 4 Nr. 7 DSGVO bei ihnen |
| **Rang** | vor Sitzung S10 |
| **Fundstelle** | Nr. 26, Nr. 88, Nr. 94; `../../70-entwicklung-ab-monat-4/code-planer.md`, externe Blocker |

---

### V14 · Die hinterlegte Check-in-Nachricht

**Aus Beschluss Nr. 83 (b).** Wer „Hinterlegen“ einschaltet, dessen Nachricht liegt **für die Dauer eines laufenden Check-ins** verschlüsselt auf unserem Server und wird mit seinem Ende gelöscht.

| | |
|---|---|
| **Die Frage** | Genügt die ausdrückliche Wahl in der App als Rechtsgrundlage (Art. 6 Abs. 1 lit. a DSGVO), oder braucht es mehr — und wird die Verarbeitung dadurch **DSFA-pflichtig**, weil Daten über ein geplantes Treffen betroffen sind? |
| **Zweite Frage** | Der SMS-Versanddienst wird Auftragsverarbeiter für eine Nachricht **an eine dritte Person, die dem nicht zugestimmt hat** (verwandt mit **V11**). Welche Pflichten entstehen? |
| **Rang** | vor Phase 1c (AP-11) |
| **Fundstelle** | `../../50-produkt-prototyp/check-in-konzept.md`, Abschnitt 5; Spezifikation AK-F55-18; Nr. 83 |

---

### P11 · Wiederherstellung mit Schwelle 1

**Aus Beschluss Nr. 86.** Eine hinterlegte Vertrauensperson genügt zur Wiederherstellung. Jede erhält eine vollständige verschlüsselte Kopie des Schlüssels; wir speichern nicht, wer sie sind.

| | |
|---|---|
| **Die Frage** | Verlangt **Art. 32 DSGVO** bei dieser Zielgruppe ein stärkeres Verfahren, als eine einzelne Vertrauensperson darstellt — und genügen die vorgeschlagenen Schutzvorkehrungen (72 Stunden Wartefrist, Benachrichtigung aller hinterlegten Personen, Abbruchrecht, sieben Tage eingeschränkter Zustand)? |
| **Zweite Frage** | Welche Haftung trifft uns, wenn ein Konto über eine getäuschte oder unter Druck gesetzte Vertrauensperson übernommen wird und daraus ein Outing folgt? |
| **Rang** | vor Phase 1b (Datenmodell) |
| **Fundstelle** | Spezifikation Z-09, AK-Z09-08 und AK-Z09-09; Nr. 86, Nr. 95; verwandt mit **K7a** |

---

### W17 · Bezahlte Werkzeugkonten und die Kennzeichnung von Terminen

**Aus Beschluss Nr. 87, in Verbindung mit Nr. 65 und Nr. 91** (benannt als ⚠ W-31, Entscheidung Nr. 96). Business-Konten kosten ab dem zweiten Jahr Geld. Was ein zahlendes Konto einträgt, gilt deshalb als bezahlt.

| | |
|---|---|
| **Die Frage** | Ist der Termin eines zahlenden Werkzeugkontos **kommerzielle Kommunikation** im Sinne des **Art. 26 DSA** — obwohl das Geld für das Werkzeug gezahlt wird und nicht für die Veröffentlichung? |
| **Zweite Frage** | Genügt ein Kennzeichen am Eintrag, oder verlangt **§ 5a Abs. 4 UWG** die Bezeichnung als Werbung? Wie muss das Kennzeichen lauten? |
| **Dritte Frage** | Entsteht aus der **redaktionellen Auswahl** („wir entscheiden im Einzelfall“) eine Pflicht zur Gleichbehandlung aller zahlenden Konten — und wenn ja, woraus? |
| **Rang** | vor dem ersten bezahlten Werkzeugkonto (Modellmonat 13) |
| **Fundstelle** | Spezifikation AK-F31-07 und AK-F31-08, ⚠ W-31; Nr. 87, Nr. 96; `../../35-veranstaltungen/veranstaltungskonzept.md` |

---

### W18 · Pflichten ohne proaktiven Hash-Abgleich

**Neu am 27.09.2026** aus dem Beschluss, den Zugang zum Hash-Abgleich später zu beantragen (Entscheidung Nr. 98). Gebaut wird die Prüfkette mit einem **Steckplatz** statt einer Anbindung: Klassifikator und menschliche Freigabe arbeiten, bekanntes Missbrauchsmaterial wird nicht automatisch erkannt.

| | |
|---|---|
| **Die Frage** | Welche Pflichten treffen uns in dieser Zeit? Nach **Art. 8 DSA** gibt es keine allgemeine Überwachungspflicht, die Pflicht ist Melden und Handeln nach **Art. 16 DSA** — trägt diese Einordnung, und zwar auch für einen Dienst mit nutzergenerierten Bildern in einer Zielgruppe mit hohem Anteil expliziter Inhalte? |
| **Zweite Frage** | Macht es einen Unterschied, dass die Testphase **geschlossen** ist (200 eingeladene Personen) — und ändert sich die Einordnung mit dem öffentlichen Start? |
| **Dritte Frage** | Wir sagen in Handbuch A und in der Moderationsarchitektur zu, dass kein öffentliches Bild ohne Hash-Abgleich erscheint. Entsteht aus dieser **eigenen Zusage** eine Haftung, wenn sie in der Übergangszeit nicht eingehalten wird — gegenüber Nutzern, gegenüber Wettbewerbern (§ 5 UWG), gegenüber Aufsichtsbehörden? |
| **Vierte Frage** | Ab wann muss der Zugang bestehen? Reicht „vor dem öffentlichen Start", oder gibt es einen früheren Zeitpunkt, an dem er rechtlich geboten ist? |
| **Rang** | **vor der Testphase** — sie ist der Zeitpunkt, an dem echte Bilder echter Menschen erscheinen |
| **Fundstelle** | Spezifikation M-02 (Übergangskasten), AK-M02-10 bis AK-M02-12; `../hash-abgleich-zugangswege.md`; Nr. 98 |

**Was wir vorschlagen und bestätigt haben wollen:** In der Testphase geht **kein öffentliches Bild ohne menschliche Freigabe** online (bei 200 Personen leistbar), der Meldeweg ist aktiv, jedes freigegebene Bild bleibt **nachprüfbar** markiert, und der öffentliche Start ist technisch gesperrt, solange der Schalter aus ist.

---

### K6 wird geschärft · FV-17 steht auf Weg B, unter Vorbehalt

**Neu am 27.09.2026 aus Nr. 68.** Die Gründer haben für FV-17 **Weg B** gewählt und dazu gesagt: *„Vermerke B überall und wir ändern das nur in C oder A, wenn das rechtlich muss."* Damit ist K6 nicht mehr eine offene Auswahl, sondern eine **Prüfung einer getroffenen Wahl**.

| | |
|---|---|
| **Was gebaut wird** | Ergibt ein Ausweis- oder Wallet-Weg „nicht volljährig", wird das Konto **sofort für jede Nutzung gesperrt**. Die Löschung folgt nach **7 Tagen** (`P-VOLLJAEHRIG-EINSPRUCH`); in dieser Frist kann die Person **mit dem Ausweis widersprechen**. Während der Sperre findet keine Nutzung statt — der Einspruch ist der einzige mögliche Vorgang |
| **Die Frage** | Ist diese Frist nach **§ 4 JMStV** und **Art. 5 Abs. 1 lit. c DSGVO** tragbar, obwohl in ihr die Daten einer **möglicherweise minderjährigen** Person weiter bei uns liegen? |
| **Zweite Frage** | Wenn nein: Ist **Weg C** tragbar — sofort gesperrt und gelöscht, Einspruch nur über ein **neues** Konto mit Ausweisprüfung? Das ist der Weg, den wir statt B nehmen würden, weil er denselben Weg zurück offenlässt, ohne Daten aufzubewahren |
| **Dritte Frage** | Welche Daten dürfen in der Frist überhaupt gehalten werden — genügt eine Vorgangskennung ohne Inhalte? |
| **Rang** | **mit K1 zusammen**, weil beides § 4 JMStV betrifft und beides vor Sitzung S8 gebraucht wird |
| **Fundstelle** | Spezifikation FV-17, `P-VOLLJAEHRIG-EINSPRUCH`; `nachtrag-03-fragen-september-2026.md`, K6 |

---

### AF-09 wird geschärft · die Nachlauffrist nach der Kontolöschung

**Neu am 27.09.2026 aus Nr. 68 (FV-77, FV-97).** Beschlossen ist Weg A — nach der Karenz verschwindet das gemeinsame Gespräch vollständig, auch die Nachrichten der Gegenseite — **und dazu eine Nachlauffrist**: 14 Tage gesperrte Aufbewahrung, für niemanden zugänglich, erreichbar nur über einen Meldefall.

| | |
|---|---|
| **Die Frage** | Trägt **Art. 17 Abs. 3 lit. e DSGVO** (Verteidigung von Rechtsansprüchen) eine solche Frist — und sind 14 Tage angemessen, oder braucht es einen anderen Wert? |
| **Zweite Frage** | Genügt es, dass niemand in der Frist zugreifen kann und jeder Zugriff über einen Fall mit Protokoll läuft — oder verlangt die Aufbewahrung eine eigene Rechtsgrundlage und einen eigenen Hinweis in der Datenschutzerklärung? |
| **Dritte Frage** | Weg A löscht die Nachrichten der **Gegenseite** mit. Ist das zulässig, obwohl es fremde Inhalte ohne deren Zustimmung entfernt — und ändert die Nachlauffrist daran etwas? |
| **Rang** | vor Sitzung S1, weil es das Datenmodell und die Löschkaskaden betrifft |
| **Fundstelle** | Spezifikation FV-77, FV-97, AK-F68-10 bis -13, `P-LOESCH-NACHLAUF`; `nachtrag-03-fragen-september-2026.md`, AF-09 |

---

### AF-13 · Wartende Bilder vor der Zustimmung des Empfängers

**Neu am 27.09.2026 aus Nr. 68 (FV-57, FV-96).** Wer „nur mit meiner Bestätigung" eingestellt hat, bekommt Bilder erst nach einer Anfrage. Bis zur Entscheidung liegen sie verschlüsselt bei uns.

| | |
|---|---|
| **Die Frage** | Auf welcher Grundlage darf ein Bild, das an eine Person gesendet wurde, die ihm noch nicht zugestimmt hat, bei uns liegen — und wie lange darf `P-BILD-ANFRAGE-FRIST` (Vorschlag 7 Tage) sein? |
| **Zweite Frage** | Ändert es etwas, dass das Bild die Prüfkette bereits durchlaufen hat und der Empfänger es nicht sehen kann? |
| **Rang** | vor Sitzung S8 (AP-8, Gespräche) |
| **Fundstelle** | Spezifikation F43, FV-96, AF-13 |

---

## Was sich an bereits gestellten Fragen ändert

| Frage | Änderung |
|---|---|
| **K1** | wird **vorgezogen** und als Einzelmandat gestellt (Nr. 88 c). Rang: vor allem anderen |
| **GV6** | Der Gründungsaufwand steht jetzt bei **2.600 €** statt 2.500 € (Nr. 29, 26.09.2026). Die Frage lautet dadurch anders: Beurkundet der Notar **10,4 Prozent** des Stammkapitals? |
| **GV13** | wird durch **G14** und **G15** konkret: Es geht nicht mehr nur um Beratungskosten, sondern um Prüfverträge und um den Rückfluss von bis zu 39.900 € |
| **V11** | bleibt; **V14** stellt dieselbe Frage für den Fall, dass die Nachricht bei uns liegt |
| **Nr. 1** | bleibt die Entscheidung, die daran hängt — sie ist jetzt zweigeteilt: K1 vorab, das Gutachten später |
| **G14, G15** | **entschärft am 27.09.2026 durch Nr. 97:** Die GmbH wird etwa drei Monate vor T0 gegründet. Damit kann **sie** den Prüfanbietervertrag und den Auftragsverarbeitungsvertrag schließen, und privat vorfinanziert wird nur noch K1 und das Jugendschutzgutachten (≈ 2.900–3.500 €). G14 bleibt für diesen Restbetrag, G15 wird kleiner |
| **K6** | **geschärft am 27.09.2026** — siehe oben: FV-17 steht auf Weg B, und die Frage ist jetzt, ob diese Wahl trägt |
| **AF-09** | **geschärft am 27.09.2026** — die Nachlauffrist aus FV-97 kommt hinzu |
| **P11** | unverändert, aber die Verantwortlichkeit ist geklärt: In der Testphase ist die **GmbH** Verantwortliche (Nr. 97), nicht die Vorgründungsgesellschaft |

---

## Was das für Termin und Budget bedeutet

| | |
|---|---|
| **Vorgezogen** | ein Einzelmandat zu **K1 und K11** — 400 bis 900 € (ANNAHME), privat zu zahlen |
| **Vor der ersten Zahlung** | **G14** und **G15** — sinnvollerweise im selben Mandat, weil beide die Vorgründungsgesellschaft betreffen. Aufwand gering, wenn sie mitgestellt werden; teuer, wenn der Fehler erst später auffällt |
| **Im großen Termin** | alles Übrige — K2 bis K10, P-, V-, W- und GV-Fragen |
| **Nicht verschiebbar** | **G14**: Wer ohne schriftliche Darlehensvereinbarung zahlt, kann das Geld später nicht sauber zurückholen |

---

## Was dieser Nachtrag nicht ist

- **Keine Rechtsberatung.** Alle Einordnungen sind Vorarbeit, damit die Zeit beim Anwalt nicht mit Erklären vergeht.
- **Keine Kostenzusage.** Die 400 bis 900 € für das Einzelmandat sind eine ANNAHME und bei keinem Anwalt erfragt.
- **Keine Beauftragung.** Nichts davon ist versendet.

---

## Quellen

- `../../01-steuerung/beschluesse-2026-09-26.md` — Wortlaut und Herleitung aller 28 Antworten
- `../../01-steuerung/offene-entscheidungen.md` — Nr. 1, 26, 29, 83, 86, 87, 88, 91, 92, 94, 95, 96
- `nachtrag-04-fragen-19-bis-21-september-2026.md` — K1 bis K10, GV1 bis GV13, V1 bis V13, P8 bis P10
- `../rechtstexte-entwuerfe/gesellschaftsvertrag-eckpunkte-ENTWURF.md`, Abschnitte 4.5 und 4.6
