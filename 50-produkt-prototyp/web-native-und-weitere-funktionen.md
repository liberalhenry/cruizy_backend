# Web, native Apps und weitere Funktionen

> **ENTWURF · Stand 19.09.2026 · Aufgabe A-50 · Rolle: Produktstratege**
> Drei Fragen, die zusammenhängen: Wie wichtig ist eine Web-Version? Wann braucht es native Apps? Und welche Funktionen fehlen, die noch niemand aufgeschrieben hat?

---

## 1 · Die Web-Version ist keine Alternative — sie ist das Produkt

**Das muss zuerst geklärt werden, weil es oft andersherum verstanden wird.** Nach der Produktspezifikation ist Phase 1 **ausschließlich eine Web-App**; native Apps folgen in Phase 2. Es gibt also nicht die Frage „App oder auch Web", sondern die Frage **„wann kommt zusätzlich nativ"**.

| | |
|---|---|
| **Phase 1 (MVP)** | Web-App, installierbar über „Zum Home-Bildschirm hinzufügen" |
| **Phase 2** | native Apps für iOS und Android |
| **Entschieden?** | Ja — **Nr. 47 und Nr. 76 (19.09.2026): beide Plattformen werden gebaut.** F58, F59 und F63 kommen in voller Fassung in den nativen Apps; im Web gilt, was technisch geht, mit offenem Hinweis. Wann die nativen Apps erscheinen, bleibt offen |

**Warum diese Reihenfolge klug ist — und zwar mehr, als bisher irgendwo steht:**

1. **Sie umgeht das Store-Risiko.** Entscheidung **Nr. 71** hält fest, dass die Zulassungsbedingungen von App Store und Play Store in keinem Dokument geprüft sind und dass dort ein fertiges Produkt scheitern kann, ohne Widerspruchsweg und ohne Frist. **Eine Web-App braucht keine Zulassung.** Sie ist damit die einzige Bauform, bei der das Produkt auf jeden Fall erscheinen kann.
2. **Sie spart die Store-Gebühr.** Siehe Abschnitt 2 — die Größenordnung ist rund **2.100 € im Jahr** bei Fixkostendeckung.
3. **Sie ist schneller änderbar.** Keine Einreichung, keine Prüfdauer. Für ein Produkt, das nach den Interviews noch einmal umgebaut wird, ist das ein erheblicher Vorteil.
4. **Sie ist diskreter.** Eine Web-App erscheint nicht in der Kaufhistorie eines Stores. In einer Zielgruppe, für die Anwesenheit ein Outing sein kann, ist das kein Detail.

**Was sie kostet:**

| Funktion | Was fehlt | Bewertung |
|---|---|---|
| **F58 Schnellverstecken** | kein Tippen auf die Geräterückseite; nur eine Ersatzgeste in der App | spürbar, aber ersetzbar |
| **F59 Symbol und Name tarnen** | nur ein neutrales Symbol beim Installieren, keine Alternativen | spürbar — das ist eine Schutzfunktion |
| **F63 Bildschirmfoto-Sperre** | im Web weder erkennbar noch verhinderbar | **das Versprechen ist im Web nicht haltbar** und wird offen benannt |
| **Mitteilungen** | auf iOS erst nach dem Hinzufügen zum Home-Bildschirm | Onboarding muss diesen Schritt erklären — eine echte Hürde |

**Die ehrliche Bilanz:** Die Web-App kostet drei Schutzfunktionen in schwächerer Fassung und eine Installationshürde. Sie bringt Unabhängigkeit von zwei Konzernen, rund 2.100 € im Jahr und die Möglichkeit, überhaupt zu starten, falls die Store-Prüfung (**Nr. 71**) schlecht ausgeht. **Das ist ein guter Tausch** — vorausgesetzt, die Grenzen stehen in der App und nicht im Kleingedruckten, was die Spezifikation bereits verlangt (Q-14).

---

## 2 · Was die Store-Gebühr kostet

| Weg | Rechnung *(ANNAHME für die Gebührensätze)* | Netto je Zahler und Monat |
|---|---|---|
| **Store** (15 % für kleine Anbieter) | 9,82 € brutto ÷ 1,19 = 8,25 € · davon 85 % | **7,01 €** |
| **Web** (Zahlungsdienst, rund 2,9 % plus 0,30 €) | 8,25 € × 0,971 − 0,30 € | **7,71 €** |
| **Unterschied** | | **0,70 € je Zahler und Monat** |

**Hochgerechnet:** Bei 253 Abonnenten — der Zahl, die die Fixkosten deckt — sind das **177 € im Monat oder rund 2.125 € im Jahr.** Das ist mehr als die jährliche Rücklage für Rechtsberatung und etwa die Hälfte eines Penetrationstests.

**Wichtig zur Einordnung:** Das Finanzmodell rechnet mit **7,38 €** netto je Zahler — einem Mischwert, der zwischen den beiden Wegen liegt und offenbar von einer Mischung aus Web- und Store-Käufen ausgeht. Die Rechnung oben ersetzt ihn nicht, sie zeigt die Spanne. **Je mehr über Web verkauft wird, desto besser die Zahl** — und in Phase 1 wird ausschließlich über Web verkauft.

> **Stand 21.09.2026 (A-52):** Das Finanzmodell rechnet die Kette inzwischen selbst — **7,56 €** netto je Zahler bei 60 % Web und 40 % Store. Statt 253 Abonnenten braucht es **299 Zahler**, um die laufenden Kosten bei 5.000 aktiven Nutzern zu decken (`../40-finanzen-foerderung/preise-und-bezahlstufen.md`).

**Die unangenehme Kehrseite:** Sobald native Apps kommen, verlangt Apple für digitale Inhalte den Kauf über den Store. Die 0,70 € gehen dann für jeden Kauf verloren, der dort stattfindet. **Das ist ein Argument, native Apps später zu bringen als technisch möglich** — nicht früher.

---

## 3 · Wann native Apps wirklich nötig werden

Nicht nach Kalender, sondern nach Auslösern. Vorschlag für vier Schwellen — sobald eine erreicht ist, wird es Zeit:

| Auslöser | Warum er zählt |
|---|---|
| **Die Installationshürde ist messbar der Grund für Abbrüche** | In den Nutzerabläufen ist der Abbruch beim Hinzufügen zum Home-Bildschirm als Fall benannt. Wenn die Beta zeigt, dass dort mehr als ein Viertel verloren geht, ist die Web-App das Problem |
| **Mitteilungen erreichen zu wenige** | Ohne Mitteilungen bricht die Wiederkehr ein — und die 30-Tage-Wiederkehr von 24 % ist eine Kernannahme des Finanzmodells |
| **Die drei Schutzfunktionen werden vermisst** | Wenn Nutzer nach Verstecken und Tarnen fragen, ist es eine Schutzfrage und keine Komfortfrage |
| **Ein Partner verlangt es** | Manche Kooperationen setzen eine App im Store voraus |

**Was vorher passieren muss:** Die Prüfung der Store-Richtlinien gegen die Funktionsliste (**Nr. 71**). Sie steht heute in keinem Arbeitspaket und gehört **vor** jede native Entwicklung — sonst baut man etwas, das nicht zugelassen wird.

---

## 4 · Weitere Funktionen — was fehlt und was sich lohnt

Geprüft gegen die 74 spezifizierten Funktionen: Was kommt in einem Produkt dieser Art vor und fehlt hier? Jede Idee ist gegen die eigenen Regeln geprüft (keine gekaufte Sichtbarkeit, kein Schutz hinter der Bezahlschranke, keine Statusfunktionen).

| # | Idee | Nutzen | Aufwand | Urteil |
|---|---|---|---|---|
| N1 | **Wiederherstellung des Zugangs** | Ohne sie kann ein Konto endgültig verloren gehen — mit bezahlten Leistungen und laufenden Meldefällen darin | mittel | **fehlt und ist dringend** — steht als **Nr. 69**, noch ohne Lösung |
| N2 | **Statusseite außerhalb der App** | Wenn die App nicht erreichbar ist, will man wissen, ob es an einem selbst liegt | gering | **F73**, bereits spezifiziert, Phase 2 — würde ich **vorziehen** |
| N3 | **Hilfebereich mit Antworten auf die zwanzig häufigsten Fragen** | Jede Frage, die nicht gestellt wird, ist eine, die zwei Gründer nicht beantworten müssen | gering | **fehlt vollständig** — nirgends spezifiziert. **Empfehlung: ins MVP** |
| N4 | **Ein Weg, Unterstützung zu bekommen** | Es gibt Melden (F62) und Löschen (F68), aber keinen Weg für „ich komme nicht weiter" | gering bis mittel | **fehlt** — siehe Abschnitt 5 |
| N5 | **Mehrsprachigkeit** | Köln ist deutschsprachig; Wien und Zürich auch | hoch | **richtig geparkt** in Phase 3 |
| N6 | **Barrierefreiheit über das Pflichtmaß hinaus** | Eine Prüfung durch Betroffene ist mit 1.500 € budgetiert | im Bauplan | **gut abgedeckt** |
| N7 | **Export der eigenen Daten in lesbarer Form** | F68 sieht eine verschlüsselte Datei vor. Eine Datei, die niemand lesen kann, erfüllt das Recht, aber nicht den Zweck | gering | **Ergänzung zu F68 vorschlagen** |
| N8 | **Ein „Ich bin heute nicht ansprechbar"-Zustand** | Pausieren ohne Löschen; reduziert Druck und Abwanderung | gering | **fehlt** — prüfen, ob es Handbuch A widerspricht |
| N9 | **Erinnerung an den Check-in nach einem Treffen** | F55 gibt es; die Nachfrage ist seit **Nr. 66** (21.09.2026) entschieden — 15, 30 und 60 Minuten (`check-in-konzept.md`) | gering | umgesetzt im Check-in-Konzept |
| N10 | **Gruppen oder Foren** | Bindung, Community | hoch | **bewusst nicht** — Handbuch A kennt Gruppen nur als temporäre Ereignisgruppen (F33). Eine Forenfunktion wäre ein zweites Produkt mit eigener Moderationslast |
| N11 | **Freundes- oder Merkliste** | Menschen wiederfinden | mittel | **prüfen** — kann Stalking begünstigen; gehört gegen die Schutzarchitektur geprüft, bevor es ins Produkt kommt |
| N12 | **Veranstaltungsmodul** | siehe `../35-veranstaltungen/veranstaltungskonzept.md` | hoch | F35 bis F40 in Phase 2, Konzept liegt vor |

**Die drei, die ich vorziehen würde:** **N3 Hilfebereich** (fehlt völlig, kostet fast nichts, spart die knappste Ressource des Projekts — die Zeit der Gründer), **N2 Statusseite** (schon spezifiziert, gehört zum Vertrauensversprechen) und **N4 Unterstützungsweg** (siehe unten). Alle drei sind gering im Aufwand und keiner widerspricht einer Regel.

---

## 5 · Die größte Lücke: Es gibt keinen Weg, Hilfe zu bekommen

Beim Durchgehen der 74 Funktionen fällt auf: Es gibt **Melden** (F62, für Inhalte und Verhalten), **Blockieren** (F61), **Löschen** (F68) und ein **Sicherheitszentrum** (F54 bis F59, F63) — aber **keinen Kanal für alles andere**. Kein „meine Zahlung ist nicht angekommen", kein „ich komme nicht in mein Konto", kein „eine Funktion tut nicht, was sie soll", kein „ich verstehe die Altersprüfung nicht".

**Warum das mehr ist als ein Komfortproblem:**

- Die **Datenschutz-Grundverordnung** gibt Betroffenen Rechte (Auskunft, Berichtigung, Löschung, Widerspruch), die einen Weg brauchen, auf dem man sie geltend macht. Ein Löschknopf deckt nur eines davon ab.
- Der **Digital Services Act** verlangt eine Kontaktstelle für Nutzende (Art. 12) — unabhängig von der Größenausnahme (**Nr. 28**).
- **Nr. 69** (verlorener Zugang) ist ohne Supportweg gar nicht lösbar: Wer nicht hineinkommt, kann auch nichts in der App melden.
- Und praktisch: Ohne Kanal landet alles in den Kanalkommentaren oder gar nicht. Beides ist schlechter.

**Vorschlag als neue Funktion:**

> **Hilfe und Kontakt.** Ein Bereich im Reiter „Ich" mit: den zwanzig häufigsten Fragen als Text (N3) · einem Formular mit Kategorien (Konto, Zahlung, Technik, Datenschutzrechte, Sonstiges) · einer Kontaktadresse, die auch ohne Konto erreichbar ist · einer Nennung der Frist, in der geantwortet wird · dem Hinweis, dass Meldungen zu Inhalten und Verhalten den anderen Weg nehmen (F62), damit Sicherheitsfälle nicht im Support versanden.

**Aufwand:** gering — ein Formular, ein Postfach, zwanzig Texte. **Wirkung:** deckt zwei Rechtspflichten ab, macht Nr. 69 lösbar und verhindert, dass die knappste Ressource des Projekts in Einzelantworten verschwindet.

**Empfehlung: als neue Funktion in die Spezifikation aufnehmen und ins MVP ziehen.** Sie ist kleiner als jede andere offene Funktion und schließt die größte Lücke.

---

## 6 · Weitere Themen, die dem Projekt fehlen

Systematisch geprüft, was ein Vorhaben dieser Art braucht und in keinem der 97 Dokumente steht. Zwölf Befunde, nach Dringlichkeit.

| # | Thema | Warum es fehlt auffällt | Wann |
|---|---|---|---|
| T1 | **Support und Nutzeranfragen** | siehe Abschnitt 5 — betrifft zwei Rechtspflichten | **vor dem Start** |
| T2 | **Betriebshandbuch** | Wer macht was, wenn der Server ausfällt, eine Meldung liegen bleibt, eine Zahlung scheitert? Es gibt einen Bauplan, aber keinen Betriebsplan | **vor dem Start** |
| T3 | **Umgebungen, Sicherungen, Überwachung, Geheimnisse** | die Lücken L1 bis L4 aus `../70-entwicklung-ab-monat-4/entwicklungsmodelle.md` | **vor der ersten Zeile Produktivcode** |
| T4 | **Versicherungen im Einzelnen** | Das Modell nennt „Cyber- und Betriebshaftpflicht, 200 €/Monat". Was genau gedeckt sein muss — Datenabfluss, Rechtsverteidigung, Veranstaltungen — steht nirgends | vor dem Start |
| T5 | **Steuerliche Themen jenseits der Umsatzsteuer** | Gewerbesteuerhebesatz am Sitz, Abgrenzung Preisgeld, Behandlung von Crowdfunding-Erlösen, Kleinunternehmerregelung (**Nr. 11**) | mit dem Steuerberater |
| T6 | **Gemeinschaftsregeln für Nutzende** | Die Moderationsarchitektur sagt, wie moderiert wird. Was gilt, steht in den AGB — aber es fehlt die lesbare Fassung, die Menschen tatsächlich lesen | vor der Beta |
| T7 | **Umgang mit Presse und Anfragen von Behörden** | Krisenkommunikation gibt es (A-18). Der Normalfall — eine Journalistin fragt etwas, eine Behörde will Auskunft — fehlt | vor dem Start |
| T8 | **Nachfolge und Ausfall** | Was passiert, wenn beide Gründer gleichzeitig ausfallen? Wer kann auf die Systeme zugreifen? Bei einem Zweierteam mit Art.-9-Daten ist das keine theoretische Frage | vor dem Start |
| T9 | **Barrierefreiheitserklärung** | im Datenraum als 02.13 geführt, hängt an **Nr. 27** | vor dem Start |
| T10 | **Zusammenarbeit mit Beratungsstellen** | Ein Produkt für diese Zielgruppe wird Fälle sehen, die über Moderation hinausgehen. Wohin verweist man? Das ist keine Pflicht, aber es gehört zu dem Anspruch, den das Produkt erhebt | vor der Beta |
| T11 | **Was passiert nach dem Ende** | Wenn das Vorhaben scheitert: Wie werden Nutzer informiert, wie werden Daten gelöscht, was passiert mit bezahlten Abos? Gehört auch in die Bedingungen | vor dem Start |
| T12 | **Messbarkeit der eigenen Versprechen** | Das Produkt verspricht Fristen und Kostenlosigkeit. Es gibt keine Kennzahl, die prüft, ob sie gehalten werden | mit dem Betrieb |

**Die vier, die ich zuerst machen würde:** T1 (Support), T3 (Umgebungen und Sicherungen), T8 (Ausfall beider Gründer) und T2 (Betriebshandbuch). Sie kosten wenig, und jede von ihnen ist der Unterschied zwischen einem Vorfall und einer Katastrophe.

---

## 7 · Was zu entscheiden ist

| # | Entscheidung | Bezug |
|---|---|---|
| 1 | **Kommt „Hilfe und Kontakt" ins MVP?** | Abschnitt 5, neue Funktion |
| 2 | **Wird die Statusseite (F73) vorgezogen?** | heute Phase 2 |
| 3 | **Wann kommen native Apps** — nach Kalender oder nach den vier Auslösern aus Abschnitt 3? | **Nr. 47**, **Nr. 71** |
| 4 | **Wird N8 („heute nicht ansprechbar") geprüft** oder verworfen? | Handbuch A |
| 5 | **Wird N11 (Merkliste) geprüft** oder wegen Stalking-Risiko verworfen? | Schutzarchitektur |

---

## 8 · Was dieses Dokument nicht ist

- **Keine Produktentscheidung.** Die Kandidaten sind geprüft, nicht beschlossen.
- **Keine Änderung der Spezifikation.** Die 74 Funktionen bleiben, wie sie dort stehen; hier stehen Vorschläge.
- **Keine Gebührenzusage.** Die Sätze in Abschnitt 2 sind **ANNAHMEN**; die tatsächlichen Konditionen stehen in Verträgen, die es noch nicht gibt.

---

## Herkunft

`../50-produkt-prototyp/produktspezifikation.md` (Web-App in Phase 1, Q-14, F54 bis F73, die 74 Funktionen als Prüfraster) · `../50-produkt-prototyp/nutzerablaeufe.md` (Abbruch beim Installieren) · `../70-entwicklung-ab-monat-4/code-planer.md` (PWA-Realitätscheck) · `../70-entwicklung-ab-monat-4/entwicklungsmodelle.md` (Lücken L1 bis L8) · `../40-finanzen-foerderung/finanzmodell.xlsx` (7,38 € netto, 253 Abonnenten, Versicherungszeile) · `../01-steuerung/offene-entscheidungen.md` (**Nr. 11, 27, 28, 47, 66, 69, 71**). Die Gebührensätze in Abschnitt 2 sind **ANNAHMEN ohne Beleg**.
