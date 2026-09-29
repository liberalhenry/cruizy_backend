# Nutzungsbedingungen — Gerüst und produktspezifische Klauseln

> ## ⚠ ENTWURF · kein fertiger Rechtstext
>
> **Stand 19.09.2026, fortgeschrieben am 20., 21. und 22.09.2026 · Aufgabe A-49 · Dokument 01.13 des Datenraums**
> Dieses Dokument liefert dem Fachanwalt **das, was er nicht wissen kann**: welche Regeln aus diesem Produkt folgen, welche Funktion welche Klausel verlangt und wo das Produkt strenger ist als das Gesetz. Die Standardklauseln — Vertragsschluss, Haftung, Gerichtsstand, Änderungsvorbehalt — sind **bewusst nicht ausformuliert**. Sie sind Anwaltsroutine, und ein Laientext daran spart nichts.
>
> Im Finanzmodell sind für AGB, Datenschutzerklärung und Einwilligungsarchitektur **5.500 €** eingeplant. Dieses Gerüst soll den Anteil senken, der auf Rückfragen entfällt.

---

## 1 · Gerüst — welcher Abschnitt wofür

| § | Abschnitt | Wer liefert den Inhalt | Besonderheit in diesem Produkt |
|---|---|---|---|
| 1 | Geltungsbereich, Anbieter | Anwalt | Anbieterangaben nach § 5 DDG; die Gründernamen werden öffentlich (**Nr. 19**) |
| 2 | Leistungsbeschreibung | **Produkt** | siehe Abschnitt 2 dieses Dokuments |
| 3 | Zugang, Mindestalter, Prüfung | **Produkt + Anwalt** | ab 18, gestufte Prüfung; hängt an **Nr. 1** |
| 4 | Vertragsschluss, kostenlose Nutzung | Anwalt | — |
| 5 | Bezahlstufen, Preise, Laufzeit, Kündigung | **Produkt + Anwalt** | §§ 312j, 312k BGB; Preise aus Handbuch B; Zuschnitt seit 21.09.2026 vorgeschlagen — PLUS mit Inkognito, PRO mit Travel (**Nr. 67**, A-52), zu bestätigen; die Auslegung aus **Nr. 48** steht in § 2 |
| 5a | Codes | **Produkt + Anwalt** | **neu 21.09.2026** — befristet, Einlösung nur im Web, Verfall bei Auflösung oder Insolvenz (**Nr. 60**); Entwurf in `../../40-finanzen-foerderung/codesystem-konzept.md`, Abschnitt 6 |
| 6 | Widerruf bei digitalen Inhalten | Anwalt | eigenes Dokument, siehe Abschnitt 4 |
| 7 | Pflichten der Nutzenden | **Produkt** | siehe Abschnitt 3 |
| 8 | Inhalte, Rechte, Freistellung | Anwalt | einfaches Nutzungsrecht nur zur Darstellung |
| 9 | Moderation, Sperre, Widerspruch | **Produkt** | siehe Abschnitt 3; DSA Art. 16, 17 |
| 10 | Meldeverfahren und Kontaktstelle | **Produkt + Anwalt** | **ausformuliert seit 20.09.2026** — siehe Abschnitt 3a; hängt an **AF-07** und **Nr. 28** |
| 11 | Haftung | Anwalt | — |
| 12 | Laufzeit, Löschung des Kontos | **Produkt** | Löschung in zwei Tipps, Karenz offen (**AF-10**) |
| 13 | Änderungen der Bedingungen | Anwalt | — |
| 14 | Streitbeilegung, Recht, Gerichtsstand | Anwalt | — |

---

## 2 · Was das Produkt ist — Formulierungsvorschlag für § 2

> „Der Anbieter stellt eine Anwendung bereit, über die volljährige Personen andere Personen in räumlicher Nähe finden, sich austauschen und Termine an öffentlichen Orten sehen können.
>
> Der Anbieter **vermittelt keine Personen**, **prüft keine Angaben auf inhaltliche Richtigkeit** und **schuldet keinen Erfolg** — insbesondere kein Zustandekommen von Kontakten oder Treffen.
>
> Die Anwendung zeigt **keine genauen Standorte**. Angezeigt wird eine Entfernung in Bändern, die aus einer gerundeten Position berechnet wird. Eine metergenaue Ortung findet nicht statt und ist technisch nicht vorgesehen.
>
> Der Anbieter finanziert sich **nicht durch Werbung und nicht durch den Verkauf von Daten**. Funktionen, die dem Schutz der Nutzenden dienen, sind dauerhaft kostenlos und werden nicht Teil eines kostenpflichtigen Angebots. **Dazu gehört der Ersatzpunkt**, mit dem sich der Ort verschieben lässt, von dem aus andere die Entfernung sehen. Vollständig unsichtbar zu sein ist darüber hinaus eine Komfortfunktion und kann Teil eines kostenpflichtigen Angebots sein."

**Warum die letzten beiden Absätze in die Bedingungen gehören und nicht nur ins Marketing:** Sie machen aus einem Versprechen eine vertragliche Zusage. Das ist ungewöhnlich und eine bewusste Entscheidung — **der Anwalt sollte die Folgen benennen** (Frage A1).

**Ergänzt am 22.09.2026 — die Auslegung aus Nr. 48 steht jetzt im Text:** Der Beschluss vom 19.09.2026 stellt Inkognito ins Abo, obwohl es eine Schutzwirkung hat, und begründet das damit, dass der kostenlose Ersatzpunkt gegen das Eingrenzen der Wohnung ebenso schützt. Er verlangt ausdrücklich, dass diese Auslegung in den Bedingungen offen ausgesprochen wird. Ohne die beiden neuen Sätze hätte der letzte Absatz das Gegenteil zugesagt. Ob die Abgrenzung trägt, fragt **A2**.

---

## 3 · Pflichten und Moderation — was das Produkt verlangt

Diese Regeln folgen aus `../../50-produkt-prototyp/moderationsarchitektur.md` und müssen sich in den Bedingungen wiederfinden, sonst trägt die Moderation rechtlich nicht.

| Regel | Woher sie kommt | Was in den Bedingungen stehen muss |
|---|---|---|
| **Mindestalter 18** | JMStV, Produktentscheidung | Klare Altersgrenze; Folge bei Verstoß (**AF-03** — Löschung, Frist oder Sperre ist offen) |
| **Keine Inhalte mit Minderjährigen** | § 184b StGB | Ausdrückliches Verbot; Hinweis auf Abgleich gegen bekannte Hashes im öffentlichen Bereich |
| **Drei Zonen mit unterschiedlichen Regeln** | Moderationsarchitektur | Öffentlich: keine expliziten Bilder. Privat: erlaubt zwischen Einverständigen. Gemeldet: wird geprüft |
| **Kein Weiterverbreiten empfangener Bilder** | Produktversprechen | Ausdrückliches Verbot, auch wenn es technisch nicht verhinderbar ist (F63) |
| **Inhalte werden vor Veröffentlichung geprüft** | Zone 1 | Hinweis, dass eine Veröffentlichung verzögert sein kann; keine Zusicherung einer Prüfdauer |
| **Sperre nur mit menschlicher Entscheidung** | Art. 22 DSGVO | Zusage, dass eine Kontosperre nie automatisch erfolgt — das ist strenger als nötig und sollte drinstehen |
| **Widerspruch mit Frist** | DSA Art. 17 | Frist nennen: unter 48 Stunden (Selbstverpflichtung aus der Moderationsarchitektur) |
| **Meldung mit Fallnummer** | DSA, Produkt | Zusage: Fallnummer sofort, Entscheidung unter 24 Stunden |
| **Blockierlisten sind unveränderlich** | F61 | Wer blockiert wurde, bleibt blockiert — auch nach einem neuen Konto des Blockierten, soweit erkennbar (**AF-08**) |

**Die Stelle, an der das Produkt strenger ist als das Gesetz:** Die Zusagen zu Fristen, zur menschlichen Entscheidung und zur dauerhaften Kostenlosigkeit der Schutzfunktionen sind freiwillig. **Sie werden mit der Aufnahme in die Bedingungen einklagbar.** Das ist gewollt — es ist der Kern der Außendarstellung —, aber es ist eine Entscheidung mit Folgen (Frage A1).

---

## 3a · Meldungen, Beschwerden und Kontakt — Formulierungsvorschlag für § 10

*Neu am 20.09.2026 aus Entscheidung **Nr. 75**. Vollständiges Konzept: `../../50-produkt-prototyp/kontaktservice-und-tickets.md`.*

**Drei Regelwerke verlangen hier dasselbe**, und bis zum 19.09.2026 erfüllte das Produkt keines davon: Art. 12 DSA (Kontaktstelle für Nutzer), Art. 12 Abs. 3 DSGVO (Fristen für Betroffenenrechte) und Apples Richtlinie 1.2 (veröffentlichte Kontaktdaten).

> **§ 10 Meldungen, Beschwerden und Kontakt**
>
> **(1)** Nutzerinnen und Nutzer können uns Inhalte und Verhalten melden — in der App über die Meldefunktion oder schriftlich an die im Impressum genannte Adresse für Meldungen. Der schriftliche Weg steht auch ohne Konto offen.
>
> **(2)** Wir bestätigen den Eingang unverzüglich mit einer Fallnummer. Wir antworten in der Regel innerhalb von 48 Stunden, spätestens innerhalb von 72 Stunden an Werktagen. Auf Meldungen, die eine Gefahr für Leben oder Sicherheit erkennen lassen, reagieren wir unverzüglich.
>
> **(3)** Anfragen zu Rechten nach der Datenschutz-Grundverordnung beantworten wir innerhalb eines Monats. Verlängert sich diese Frist nach Art. 12 Abs. 3 DSGVO, teilen wir das innerhalb desselben Monats mit.
>
> **(4)** Über jede Entscheidung, die ein Konto oder einen Inhalt betrifft, informieren wir die betroffene Person mit Begründung und weisen auf den Einspruchsweg hin.
>
> **(5)** Wir sind kein Notdienst. Bei unmittelbarer Gefahr wenden Sie sich an Polizei oder Rettungsdienst.

**Die Stelle, an der das Produkt sich bindet:** Absatz 2 macht aus einer Absicht eine **einklagbare Zusage** — dieselbe Wirkung wie bei den freiwilligen Zusagen aus Abschnitt 2 und 3 (Frage **A1**). Die Zweistufigkeit ist bewusst gewählt: „in der Regel 48" bindet nicht, „spätestens 72" schon.

---

## 3b · Codes — Verweis auf den Entwurf für § 5a

*Neu am 21.09.2026 aus Entscheidung **Nr. 60**.* Der Formulierungsvorschlag steht vollständig in `../../40-finanzen-foerderung/codesystem-konzept.md`, Abschnitt 6, und wird hier nicht wiederholt, damit es nur eine Fassung gibt. Kern: Codes sind befristet, nur im Web einlösbar, bringen keinen Auszahlungsanspruch, und **nicht eingelöste Codes erlöschen bei Auflösung oder Insolvenz**. Ob der letzte Satz gegenüber einem Insolvenzverwalter trägt, ist die neue Frage **R15**.

---

## 3c · Private Veranstaltungen — Hinweis für § 9 oder einen eigenen Abschnitt

*Neu am 21.09.2026 aus Entscheidung **Nr. 82**.* Wer eine private Veranstaltung anlegt, entscheidet selbst, wen er zulässt, und gibt die Adresse selbst frei. Formulierungsvorschlag:

> **Private Veranstaltungen.** Wer eine private Veranstaltung anlegt, ist deren Veranstalter. Er entscheidet über jede Anmeldung und gibt Ort und Zeit selbst frei. Wir vermitteln den Kontakt; wir prüfen weder die Veranstaltung noch ihre Gäste und sind nicht Veranstalter. Hinweise auf rechtswidrige Inhalte oder Gefahren nehmen wir über die Meldefunktion und § 10 entgegen und prüfen sie.

**Was dieser Absatz nicht leistet:** Er ist kein Freibrief. Die Haftungsprivilegien für Vermittlungsdienste gelten, solange wir auf Meldungen reagieren — deshalb der letzte Satz. Neue Anwaltsfrage **V10** im Veranstaltungskonzept.

---

## 4 · Widerruf — was zu klären ist

| Fall | Lage | Frage |
|---|---|---|
| **Abo, im Web gekauft** | Fernabsatz, digitale Dienstleistung. Widerrufsrecht besteht; es erlischt bei vorzeitigem Beginn nur unter Bedingungen | Wie wird die Zustimmung zum vorzeitigen Beginn eingeholt, ohne den Kauf zu verkomplizieren? |
| **Abo, über einen Store gekauft** | Der Store ist Vertragspartner | Welche Angaben schulden wir trotzdem? |
| **Einmalkauf** | wie Abo | — |
| **Veranstaltungsticket** | Der BGH hat am 13.07.2022 (VIII ZR 317/21) entschieden, dass bei terminierten Freizeitveranstaltungen kein Widerrufsrecht besteht — auch für Vorverkaufsstellen, die im eigenen Namen auf Rechnung des Veranstalters verkaufen (§ 312g Abs. 2 Nr. 9 BGB) | Gilt das für unser Modell, und wie muss der Verkauf dafür ausgestaltet sein? → Frage **V4** im Veranstaltungskonzept |

---

## 5 · Fragen an den Anwalt

| # | Frage | Warum |
|---|---|---|
| A1 | **Die freiwilligen Zusagen aus Abschnitt 2 und 3** — was bedeutet es, sie in die Bedingungen zu schreiben statt nur in die Außendarstellung? Entsteht ein einklagbarer Anspruch, und wie ändert man sie später? | die wichtigste Frage dieses Dokuments |
| A2 | **„Schutz ist dauerhaft kostenlos"** — lässt sich das so zusagen, ohne sich für immer zu binden? *Ergänzt 22.09.2026:* Und trägt die Abgrenzung aus Nr. 48 — Ersatzpunkt kostenlos, vollständige Unsichtbarkeit als Komfort im Abo —, oder macht die Zusage auch die Unsichtbarkeit kostenlos? | Kern des Produktversprechens |
| A3 | **Altersgrenze und Folge bei Verstoß** (**AF-03**) — Löschung, Frist oder Sperre? | betrifft Daten Minderjähriger |
| A4 | **Zonenregeln in den Bedingungen** — reicht eine Beschreibung, oder braucht jede Zone eigene Nutzungsregeln? | Moderation trägt nur, wenn die Regel vorher galt |
| A5 | **Änderungsvorbehalt** — wie ändert man Bedingungen, in denen einklagbare Zusagen stehen? | folgt aus A1 |
| A6 | **Vorzeitiger Beginn beim Abo** — welche Zustimmung, in welcher Form? | Abschnitt 4 |
| A7 | **§ 10 Absatz 2 und 5** — trägt die zweistufige Fristzusage („in der Regel 48, spätestens 72"), und wird Absatz 5 ungewollt zu einer unzulässigen Freizeichnung nach § 309 BGB? | Abschnitt 3a, neu seit **Nr. 75** |

---

## Herkunft

`../../50-produkt-prototyp/produktspezifikation.md` (Z-05 Abo, Q-04 und Q-08 Sicherheit nicht hinter der Bezahlschranke, AF-03, AF-07, AF-08, AF-10) · `../../50-produkt-prototyp/moderationsarchitektur.md` (Zonen, Fristen, Vieraugenprinzip) · `../../35-veranstaltungen/veranstaltungskonzept.md` (Frage V4) · Handbuch A (Prinzipien, Streichliste) · Handbuch B (Preise). Die BGH-Fundstelle in Abschnitt 4 ist am 19.09.2026 abgerufen: <https://www.it-recht-kanzlei.de/bgh-widerrufsausschluss-veranstaltungstickets.html>
