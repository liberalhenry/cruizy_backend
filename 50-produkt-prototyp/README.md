# Produkt und Prototyp — Ablage

Produktspezifikation, Nutzerabläufe, Systemtext-Entwürfe, Wireframe-Beschreibungen und Moderationsarchitektur; später Taxonomie-Entwürfe (mit Betroffenen gegenlesen) und Auszüge für externe Gestalter.
Wahrheitsquelle für alle Produktfragen bleibt Handbuch A. Spezifikation, Abläufe, Systemtexte und Wireframes sind Vorfassungen, bis die Gründer sie freigeben; die Grundsätze der Moderationsarchitektur gelten schon jetzt.

## Inhalt

| Datei | Inhalt | Aufgabe · Stand |
|---|---|---|
| `produktspezifikation.md` | Der Funktionskatalog als prüfbare Fassung: 75 Funktionen und 10 Zusatzanforderungen mit Ablauf, Fehler- und Randfällen, Daten, Rechtsbezug und 674 geltenden Akzeptanzkriterien („Wenn … dann …“); Streichliste, Moderation aus A-37, Wechselwirkungen, 109 Parameter, 97 Festlegungen und 32 Widersprüche | A-29 · Vorfassung 17.09.2026, fortgeschrieben 20., 21. und 22.09.2026 (Kontaktservice, Check-in, Zonen, Codes, Wiederherstellung, Mobilnummer; am 22.09.2026 der Abgleich mit allen Beschlüssen — Nr. 64 mit drei Zuständen, Nr. 47, 50, 58, 65, 71; Nachprüfung in Abschnitt 20); Endfassung nach den Interviews (A-19) |
| `nutzerablaeufe.md` | Elf Wege vom ersten bis zum letzten Schritt (AB-01 bis AB-11) mit 112 Schritten, 57 Abbruchfällen, Diagrammen, den typischen Scheiterstellen und den Wechselwirkungen | A-30 · Vorfassung 17.09.2026, AB-11 am 20.09., Check-in, Wiederherstellung und Mobilnummer am 21.09.2026, Beschlussabgleich am 22.09.2026 (Nr. 64, 47, 50); Endfassung nach den Interviews (A-19) |
| `moderationsarchitektur.md` | Drei Zonen, getrennte Ablagen, wo bewusst niemand hinschaut; **verbindliche Vorgabe** für alle Moderationsfunktionen | A-37 · 27.07.2026 |
| `moderations-backend.md` | Das interne Werkzeug: 12 Bildschirme mit 93 Ankern, je eine Rechte-Tabelle (wer sieht was, was braucht zwei Personen, was wird protokolliert), 17 Funktionen, die es ausdrücklich **nicht** hat, und je ein Testfall zu den vier Zusagen aus A-37 | A-41 · 18.09.2026, M85 ergänzt 20.09.2026, M75 (Freigaben) am 21.09.2026 |
| `kontaktservice-und-tickets.md` | F75 „Hilfe und Kontakt" — vier Eingänge, zehn Kategorien, zwanzig vorangestellte Antworten, Fristen und der Bildschirm M85. Erfüllt Art. 12 DSA, Art. 12 DSGVO und Apples Richtlinie 1.2 auf einmal | A-59 · 20.09.2026; Bildschirmnummer am 21.09.2026 berichtigt (S57 statt S52) |
| `festlegungen-die-zwoelf-ausfuehrlich.md` | **Neu:** die zwölf folgenschwersten Festlegungen ausführlich — Beispielsituation, alle Möglichkeiten im Klartext, Kosten in vier Spalten (Bauzeit, Geld, Rechtsrisiko, Schutz), Einwand gegen jede Empfehlung, und ob sie später noch änderbar ist. Nur FV-23 und FV-77 müssen jetzt entschieden werden | A-66 · 26.09.2026 |
| `check-in-konzept.md` | der Check-in nach Nr. 66, 83 und 84 — drei Fragen nach 15, 30 und 60 Minuten, Hilfe-Bildschirm mit Vertrauenspersonen, 110 und nora, Daten nur auf dem Telefon, die technische Grenze der Nachricht bei ausgeschaltetem Telefon (Nr. 83) und die Form ohne Gegenüber (Nr. 84) | 21.09.2026 |
| `standortanzeige-konzept.md` | **Neu:** zwei Regler („Mein angezeigter Ort", „Ich suche in"), Ersatzpunkt 2 bis 30 km, Zonen mit dem Zuschnitt aus Nr. 48, Travel und wie Reisende erkennbar sind (Nr. 77, offen Nr. 85) | 21.09.2026 |
| `festlegungen-pruefliste.xlsx` | **Neu, zum Ausfüllen:** alle 97 Festlegungen, die zwölf folgenschwersten mit je drei Möglichkeiten vorn; gelbe Spalten für die Rückmeldung, Auswertung rechnet sich selbst (Nr. 68) | 21.09.2026 |
| `store-richtlinien-pruefung.md` | **Neu:** Beide Store-Regelwerke gegen die eigene Funktionsliste — der „hookup"-Satz und seine Eingrenzung, Googles Regel „standardmäßig verborgen, zwei Handlungen", und was für private Nachrichten wirklich gilt | A-53 · 20.09.2026 |
| `web-native-und-weitere-funktionen.md` | Warum die Web-App das Produkt ist und nicht die Notlösung · wann native Apps nötig werden · zwölf geprüfte Funktionsideen · zwölf Themen, die dem Projekt fehlen | A-50 · 19.09.2026 |
| `systemtexte-ENTWURF.md` | Systemtext-Bibliothek mit 395 Einträgen (Text-IDs `ST-…`; 325 aus der Erstfassung, 70 seit dem 20.09.2026, darunter der Hinweis im Ernstfall nach Nr. 46) — Briefing für die Texter | A-14 · ENTWURF 15.09.2026, ergänzt 20. und 21.09.2026; Korrekturliste in der Spezifikation, Abschnitt 16.3 |
| `wireframes-textspezifikation.md` | 39 Bildschirme mit 226 Ankerpunkten (`S…`) — Briefing für die externe Gestaltung | A-15 · ENTWURF 15.09.2026; Korrekturliste in der Spezifikation, Abschnitt 16.3 — dort seit dem 21.09.2026 auch der neue Bildschirm S57 und die Änderungen an S03, S13, S52 und S63 |

## Lesereihenfolge

1. `produktspezifikation.md` — was gebaut wird und woran man erkennt, dass es richtig gebaut ist.
2. `moderationsarchitektur.md` — gilt vor jeder Auslegung, wenn es um Prüfung, Sichtbarkeit von Bildern, Meldungen oder Zugriffe geht.
3. `nutzerablaeufe.md` — die Reihenfolge und das Verhalten an den Bruchstellen; baut auf der Spezifikation auf.
4. `systemtexte-ENTWURF.md` und `wireframes-textspezifikation.md` — was Nutzer lesen und sehen; Spezifikation und Abläufe verweisen über Text-IDs und Bildschirmnummern darauf.

Wo sich die Dateien widersprechen, steht das in der Spezifikation (Abschnitte 16 und 17) — nichts ist stillschweigend aufgelöst. Offene Produktentscheidungen: `../01-steuerung/offene-entscheidungen.md`, besonders Nr. 40, 46 bis 51, 64 bis 69, 83 bis 87, 89 (Größe der Testphase) und 91 (Hervorhebung als Gegenleistung für Orte).
