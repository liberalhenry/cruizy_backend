# Entscheidungsvorlage — alles, was auf euch wartet

Erstellt: 25.09.2026 · Aufgabe A-64 · Grundlage: `offene-entscheidungen.md` (93 Nummern), `../50-produkt-prototyp/festlegungen-pruefliste.xlsx`, `zusagen-tor-2-und-notfall.md`, `../10-recht-gruendung/rechtstexte-entwuerfe/gesellschaftsvertrag-eckpunkte-ENTWURF.md`

> **Wie diese Vorlage gedacht ist.** Jede Frage hat eine Nummer, Optionen und **eine Empfehlung mit Begründung**. Antworten reicht in der Form „83 b · 84 ja · 90 A“ — die Begründung kommt nur dort, wo ihr anders entscheidet als vorgeschlagen. **Die Empfehlungen sind Vorschläge, keine Vorwegnahme:** Wo eine Entscheidung den Gründern gehört, bleibt sie offen, bis ihr sie trefft.

---

## Teil 1 · Die vier eiligen

| # | Frage | Optionen | Empfehlung |
|---|---|---|---|
| **88** | **Reihenfolge von Gründung, Anwalt, Prüfungen und Start.** Die GmbH entsteht zu T0 (Nr. 22), gebaut wird vorher (Nr. 73), der Anwaltstermin ist für 2028 geplant — aber Sitzung S8 braucht die Jugendschutzantwort, und S10 braucht einen Vertrag mit einem Prüfanbieter, den ohne Firma niemand schließt | **(a)** Gründung einige Monate vor der CSD-Saison, Prüfungen danach, Start zum CSD · **(b)** S0–S7 jetzt, S8–S13 nach dem Anwaltstermin · **(c)** Jugendschutzfrage vorab als Einzelfrage klären, übrige Prüfungen privat vorfinanzieren (Vorgründungsgesellschaft, persönliche Haftung) | **(c) + (a)**: die eine Frage (K1) jetzt einzeln klären lassen — 400 bis 900 € statt Stillstand —, alles Übrige nach (a). Nur so blockiert der Anwaltstermin nicht 16 Monate Bau |
| **90** | **Planungswert: realistisch oder pessimistisch?** Handbuch B verlangt, gegen den pessimistischen Fall zu planen, weil er die höchste Einzelwahrscheinlichkeit hat (35 bzw. 40 %) | **(A)** realistisch **233.053 €** · **(B)** pessimistisch **275.861 €** · **(C)** realistisch planen, pessimistisch absichern: 233.053 € als Zielgröße, 42.808 € als benannte Reserve | **(C)** — Außendokumente bleiben bei einer Zahl, und die Lücke ist trotzdem sichtbar. Ein Förderprüfer, der Handbuch B sieht, fragt sonst genau danach |
| **89** | **Größe der geschlossenen Testphase: 150 oder 250 Personen?** Handbuch A sagt 150, die Beta-Vergabe rechnet mit 250 (ein Viertel der erwarteten Bewerbungen) | **(a)** 150 · **(b)** 250 · **(c)** 150 zum Start, Aufstockung auf 250 nach vier Wochen, wenn die Moderationslast es zulässt | **(c)** — zwei Menschen neben allem anderen moderieren 150 sicher; 250 ist eine Entscheidung, die man nach vier Wochen mit Zahlen trifft statt heute mit Hoffnung |
| **92** | **Profilbilder im Web: Wo endet Nacktheit, wo beginnt Explizites?** Nr. 71 lässt „sexuelle oder Nacktheit enthaltende“ Bilder zu und zeigt sie im Web; Handbuch A, die Moderationsarchitektur (Zone 1) und § 4 Abs. 2 JMStV schließen Explizites im öffentlichen Bereich aus | **(a)** Zone 1 bleibt auch im Web ohne Explizites; Nacktheit ohne explizite Darstellung erlaubt, in den Apps unkenntlich · **(b)** explizite Profilbilder im Web, aber nur für Identifizierte (Stufe 2) · **(c)** im öffentlichen Profil gar keine Nacktheit | **(a)** — (b) macht aus dem öffentlichen Bereich eine Pornoplattform im Sinne des JMStV und zieht die teure Identifizierung für alle nach sich; (c) verschenkt, was ROMEO seit Jahren kann |

---

## Teil 2 · Produkt und Sicherheit

| # | Frage | Optionen | Empfehlung |
|---|---|---|---|
| **83** | **Check-in: Soll die Nachricht auch rausgehen, wenn das Telefon aus ist?** Heute liegen Kontakte und Text nur auf dem Telefon — im Ernstfall (Telefon weg, aus, kein Netz) geht nichts hinaus | **(a)** nur Durchreichen: Das Telefon schickt zur fälligen Minute an unseren Server, der sofort weitergibt und nichts speichert · **(b)** zusätzlich wählbar: Für die Dauer des Check-ins liegt die Nachricht verschlüsselt bei uns | **(b) als Wahl, (a) als Voreinstellung** — der Fall, gegen den ein Check-in schützt, ist genau der, in dem das Telefon weg ist. Die Zusage „nie auf unseren Servern“ wird dann im Text ehrlich eingegrenzt: „für die Dauer eines laufenden Check-ins, wenn du es einschaltest“ |
| **84** | **Check-in auch ohne Treffen-Partner („Ich bin unterwegs“)?** Heute an ein Gespräch gebunden — Park, Sauna, Darkroom, Heimweg fallen damit heraus | **ja** (zwei Formen, gleicher Ablauf) · **nein** (bleibt am Gespräch) | **ja** — es kostet fast nichts (derselbe Ablauf ohne Gegenüber) und deckt die Fälle, in denen am meisten passiert |
| **85** | **Was gehört zum Travel-Paket?** Beschlossen: in einer anderen Region umsehen und schreiben kostet. Handbuch A kennt zusätzlich die Reiseankündigung (F28, Phase 2) | **(a)** nur Umsehen und Schreiben · **(b)** beides als ein Paket: sehen **und** gesehen werden | **(b)** — wer reist, will beides; getrennt verkauft wirkt es kleinlich, und F28 hat in Handbuch B ohnehin keinen eigenen Preis |
| **86** | **Wiederherstellung über Vertrauenspersonen: Verfahren und Schwelle.** Vorschlag: Schlüssel in Teile zerlegen (Shamir), jede Vertrauensperson bekommt einen Teil, wir speichern nicht, wer sie sind | **(a)** 2 von 3 · **(b)** 2 von 2 · **(c)** 3 von 5 · **(d)** gar nicht bauen, Wiederherstellungscode genügt | **(a) 2 von 3** — hält, wenn eine Person nicht erreichbar ist, und verlangt trotzdem zwei Menschen. (d) ist die ehrliche Rückfallebene, falls es zu aufwendig wird |
| **87** | **Hinweise auf fremde Bars und Konzerte in der App.** Ohne Geld unbedenklich; mit Geld gekaufte Sichtbarkeit (Nr. 65) und kennzeichnungspflichtig | **(a)** nie · **(b)** nur ohne Gegenleistung, redaktionell ausgewählt · **(c)** mit Geld, gekennzeichnet | **(b)**, Entscheidung aber erst, wenn ein Ort konkret fragt — keine Eile, nichts hängt daran |
| **91** | **Ortspartnerschaft als Tausch: QR-Code gegen Hervorhebung?** Handbuch B sieht die Tauschstufe vor; im Tor-1-Plan bringen zwölf Partnerorte rund 1.000 der 2.437 Eintragungen. Dieselbe Frage stellt sich beim Terminservice („Hervorhebung gegen Erwähnung“) | **(a)** keine Hervorhebung, auch nicht im Tausch — der QR-Code bleibt eine Bitte · **(b)** Hervorhebung im Tausch, gekennzeichnet als Werbung · **(c)** keine Hervorhebung, dafür etwas anderes (z. B. früher Beta-Zugang fürs Personal) | **(a) + (c)** — Prinzip 5 ist eines der drei Dinge, mit denen ihr gegen Grindr antretet. Die 1.000 Eintragungen holt ihr über Anlässe, nicht über Platzierung |
| **93** | **Tor 1 — was geschieht, wenn es gerissen wird?** Für Tor 2 steht die Regel seit Nr. 15; für Tor 1 nicht, obwohl das Einwand-Handbuch Prüfern genau das zusagt | **(a)** dieselbe Regel wie Tor 2 (90 Tage Verlängerung nur bei steigendem Frühindikator, dann Formatwechsel, dann geordnetes Ende), Frühindikator: Eintragungen je Woche · **(b)** eigene Reihenfolge · **(c)** keine Regel | **(a)** — dieselbe Mechanik, andere Zahl. Alles andere macht Tor 1 zu einer Zahl, die man im Ernstfall wegdiskutiert |

---

## Teil 3 · Der Zuschnitt von PLUS, PRO und Unterstützen (Nr. 67, ⚠ W-25 und W-29)

Die Richtung steht seit dem 19.09.2026: zwei Stufen plus ein jederzeit möglicher Unterstützerbeitrag. Offen ist, **was drin ist**.

| Frage | Vorschlag (A-52) | Alternative | Empfehlung |
|---|---|---|---|
| **PLUS (9 € im Monat)** | Inkognito, zusätzliche Zonen, Filter und Komfort | Inkognito **und** Travel zusammen in einer Stufe | **Vorschlag bestätigen** — zwei Stufen brauchen zwei starke Argumente; zusammen in einer Stufe bleibt für PRO nichts übrig |
| **PRO (17 € im Monat)** | alles aus PLUS **plus Travel** (andere Region sehen und schreiben) | PRO mit zusätzlichen Komfortfunktionen | **Vorschlag bestätigen** — Travel ist die einzige Funktion, die klar mehr wert ist und kein Schutz ist (Q-04) |
| **Unterstützen (⚠ W-29)** | frei wählbarer Betrag ab 3 €, **ohne** Abzeichen, ohne Listeneintrag | Handbuch B: 5 € im Monat, dafür Abzeichen und Listeneintrag | **frei ab 3 €, ohne Abzeichen** — ein Abzeichen ist gekaufte Sichtbarkeit in klein und steht gegen Prinzip 5. Bis ihr entscheidet, gilt in der Spezifikation die Fassung von Handbuch B |

---

## Teil 4 · Fünf Vorschläge, die nur ein Ja brauchen

| Punkt | Vorschlag | Wenn ihr nichts sagt |
|---|---|---|
| **Frühindikator Tor 2** (Nr. 15) | Durchschnitt der Installationen je Woche über vier Wochen liegt **mindestens 20 % über** den vier Wochen davor | Die Regel aus Nr. 15 hat kein Maß und ist im Ernstfall wertlos |
| **Zonenmittelpunkt** (⚠ W-27) | Auch der Mittelpunkt einer Zone wird auf die Rasterzelle gerundet — sonst liegt die Wohnung genau gespeichert bei uns, obwohl wir das Gegenteil zusagen | Der Widerspruch bleibt offen benannt stehen |
| **Ersatzpunkt-Mindestabstand** | **2 km** (P-ERSATZPUNKT-MIN-KM); näher zeigt derselbe Ersatzpunkt dasselbe Entfernungsband wie die Wohnung | Der Ersatzpunkt verspricht Schutz, den er nicht hat |
| **Notrufnummer nach Land** | 110 und nora nur in Deutschland; Österreich 133 und DEC112, Schweiz 117, 112 überall | Der Hilfe-Bildschirm nennt in Wien die falsche Nummer |
| **Nie gestrichen wird** (Nr. 16) | Die Liste um einen fünften Punkt ergänzen: **die vollständige Code-Prüfung vor dem Start** (Nr. 73) | Im Engpass fällt zuerst die Prüfung, die den Beschluss trägt |

---

## Teil 5 · Die zwölf folgenschwersten Festlegungen (Nr. 68)

> **Am 26.09.2026 zurückgestellt und neu aufbereitet.** Antwort: *„bitte einmal genauer aufschlüsseln, so kann ich keine entscheidung treffen wie es dort steht."* Die Tabelle unten bleibt als Übersicht stehen; entschieden wird nach **`../50-produkt-prototyp/festlegungen-die-zwoelf-ausfuehrlich.md`** (A-66) — dort steht je Festlegung eine Beispielsituation, jede Möglichkeit im Klartext, die Kosten in vier Spalten, der Einwand gegen die Empfehlung und ob sie später noch änderbar ist.
>
> **Das wichtigste Ergebnis daraus:** Nur **FV-23** und **FV-77** müssen jetzt entschieden werden — sie gehen an das Datenmodell. Die übrigen zehn sind Parameter oder Bildschirme.

Vollständig mit Begründung: `../50-produkt-prototyp/festlegungen-pruefliste.xlsx`, Blatt „Die zwölf zuerst“. **A ist immer der heutige Stand.**

| # | FV | Worum es geht | A (heute) | B | C | Empfehlung |
|---|---|---|---|---|---|---|
| 1 | FV-87 | Bestätigung vor dem privaten Bereich | Passkey oder Gerätesperre | nur gerätegebundene Schlüssel, nichts verlässt das Gerät | nur Gerätesperre | **B** (ihr habt Passkeys am 21.09. ausgeschlossen) |
| 2 | FV-23 | Profilalter speichern | Monat und Jahr der Geburt | nur die Zahl, jährlich bestätigt | nur ein Altersband | **B** |
| 3 | FV-17 | „nicht volljährig“ | sofort gesperrt und gelöscht | 7 Tage Einspruch | Einspruch nur über neues Konto | **A** |
| 4 | FV-15 | Wege der Altersprüfung | mind. zwei, einer ohne Biometrie | wie A, ab 2027 zusätzlich d-you | nur Brieftasche und Ausweis | **B** |
| 5 | FV-01 | Voreingestellte Standortgenauigkeit | „Grob“ | „Nah“ | beim ersten Start fragen | **A** |
| 6 | FV-46 | Gruppengröße auf der Karte | ab 10 Personen | ab 5 | ab 20 | **A** |
| 7 | FV-57 | Bilder im Gespräch | erst wenn beide geschrieben haben | erst wenn die Gegenseite zulässt | sofort | **A** |
| 8 | FV-86 | Was der Absender sieht | geschlossene Kachel, Absender erfährt nichts | Absender sieht den Grund | Senden gar nicht möglich | **A** |
| 9 | FV-77 | Gemeinsame Gespräche bei Kontolöschung | alles weg | Gegenseite behält ihre eigenen Nachrichten | Gegenseite behält alles | **B** |
| 10 | FV-71 | Gespräch bei endgültiger Blockierung | gelöscht | bleibt lesbar | gelöscht, vorher Melden anbieten | **C** |
| 11 | FV-34 | Bänder der Antwortquote | 70/30 % | milder: 60/20 % | Band 3 nicht anzeigen | **B** |
| 12 | FV-29 | Wie lange gilt eine Absicht | „Heute Abend“ bis 4 Uhr | bis 6 Uhr | Nutzer wählt selbst | **A** |

Die übrigen 83 Festlegungen stehen im Blatt „Alle 95“ — sie gelten, bis ihr widersprecht.

---

## Teil 6 · Gesellschaftsvertrag — vier Präzisierungen (Nr. 4)

| Punkt | Frage | Vorschlag |
|---|---|---|
| **Bewertungsregel** | Wer später mehr Geld einbringt, bekommt mehr Anteile — zu welchem Wert? | **Darlehen als Regel**, Anteile nur mit Bewertung durch einen Dritten. Hält die 50/50-Grundlage (GV7) |
| **Beirat nach Investoreinstieg** | Wird der Investor zum Schiedsrichter bei Patt zwischen euch? | **Nein** — der Beirat bleibt für Gründerpatt zuständig, der Investor stimmt mit, entscheidet aber nicht (GV4) |
| **Maß für „stark reduziert“** | Wann ruht das Vesting? | Einmal im Vierteljahr sagen beide schriftlich „passt“ oder „passt nicht“. Vier Mal hintereinander „passt nicht“ über denselben → Vesting ruht, außer der Beirat sieht es anders |
| **Jahresbudget je Bereich** | Ab wann braucht eine Ausgabe beide? | Zustimmung beider **ab 5.000 €** — außer innerhalb eines gemeinsam beschlossenen Jahresbudgets des Bereichs (GV9) |
| **Gründungsaufwand** | Die Klausel deckelt bei **2.500 €**, das Finanzmodell rechnet **2.600 €** | Entweder Klausel auf 2.600 € anheben (bleibt unter 10 % des Stammkapitals) oder die 100 € bewusst privat tragen. **Vorschlag: 2.600 € in die Klausel** (GV6, Nr. 29) |

---

## Teil 7 · Zwei Zahlen, die noch keine Uhr haben

| # | Frage | Optionen | Empfehlung |
|---|---|---|---|
| **57** | **Tor 2 — welche Zeitrechnung?** 5.000 Follower und 800 Installationen: Handbuch B misst in Kanalmonat 12 (= Roadmapmonat 3), da gibt es die App noch nicht | **(a)** beide Kriterien in Roadmapmonat 12 · **(b)** Follower in Kanalmonat 12 (mit Tor 1), Installationen in Roadmapmonat 12 · **(c)** andere Zählweise | **(b)** — misst beides dann, wenn es messbar ist, und macht aus Tor 1 und dem Follower-Ziel einen gemeinsamen Prüfpunkt |
| **11** | **Kleinunternehmerregelung für die GmbH** (Steuerberaterfrage) | Verzicht oder nicht — bindet mehrere Jahre; ändert Crowdfunding-Mindestbetrag (8.500 € statt 10.800 €) | Vor der Gründung mit dem Steuerberater klären; heute nichts zu entscheiden |

---

## Teil 8 · Was nur Menschen tun können

| Wann | Handlung |
|---|---|
| **Jetzt** | Diese Vorlage beantworten — Teile 1 bis 6 |
| **Vor Sitzung S8** | Jugendschutzfrage K1 klären lassen (Nr. 88) |
| **In V0** | Project Arachnid anschreiben (Entwurf liegt), beim IWF nach der Gebühr für ein Zweipersonenunternehmen fragen |
| **Ab Oktober 2026** | Interviews: 60 bis 80 Gespräche, davon mindestens acht mit trans und nichtbinären Personen, bezahlt |
| **Vor jeder Weitergabe** | Businessplan: Anhang B entfernen · Pitchdeck: Platzhalter auf Folie 10 füllen · Nr. 90 entschieden haben |

---

## Was nach euren Antworten passiert

| Antwort | Was sie freischaltet |
|---|---|
| Nr. 88 | **A-61** (Zeitplan auf Nr. 45 und Nr. 88 umstellen) — die letzte blockierte KI-Aufgabe |
| Nr. 83, 84, 86 | Check-in und Wiederherstellung gehen von „Konzept“ auf „gebaut wird so“ (AP-11, AP-1) |
| Nr. 92 | Bildprüfung und Store-Fassung sind baubar (AP-4, Sitzung S10) |
| Nr. 67 und die zwölf Festlegungen | Systemtexte und Kaufbildschirm bekommen echte Inhalte statt Platzhalter |
| Nr. 90 | Außendokumente dürfen weitergegeben werden |
