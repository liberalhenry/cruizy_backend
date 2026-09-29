# Nachtrag 02 zur Anwaltsakte — Rechtsstand September 2026

Erstellt: 15.09.2026 · Ergänzung zu `anwaltsakte-cruizy.docx` und zu `nachtrag-01-jmstv-verifizierungswege.md`
Anlass: erster Lauf der Rechts- und Wettbewerbsbeobachtung (R-01), `01-steuerung/wettbewerbsbeobachtung-log.md`
**Bitte zusammen mit der Akte und Nachtrag 01 lesen.** Fünf Fragen, die sich seit Juli 2026 neu stellen oder schärfer stellen. *(Frage 5 ergänzt am 15.09.2026 bei A-14.)*

---

## Was sich seit der Akte geändert hat — in vier Sätzen

1. Die ePrivacy-Übergangsverordnung für den freiwilligen Abgleich gegen Missbrauchsdarstellungen ist am 23.07.2026 vom Rat bestätigt worden und gilt bis **03.04.2028** — drei Monate vor unserem geplanten Start.
2. Die Datenbank der KJM führt reine KI-Altersschätzung als positiv bewertetes **Identifizierungsmodul**, zuletzt im März 2026 mit einem nicht änderbaren Puffer von drei Jahren; unsere bisherigen Unterlagen gingen davon aus, dass eine Altersschätzung als Identifizierung nicht genügt.
3. Die KI-Verordnung wurde durch die Verordnung (EU) 2026/1744 geändert (in Kraft seit 27.07.2026): Hochrisiko-Pflichten nach Anhang III ab 02.12.2027, neuer Art. 4a zur Verarbeitung besonderer Datenkategorien für die Erkennung von Verzerrungen.
4. Die NBank-FAQ zum Gründungsstipendium Niedersachsen (Stand 04.07.2025) schließt Vorhaben aus, für die bereits eine GbR „gegründet und angemeldet" ist.

---

## Frage 1 — Zone 2 ab dem Start

> **Auf welcher Rechtsgrundlage dürfen wir ab Sommer 2028 Bilder in privater Kommunikation und in privaten Alben freiwillig gegen Hash-Listen bekannter Missbrauchsdarstellungen abgleichen, wenn die Übergangsverordnung am 03.04.2028 ausgelaufen ist und die dauerhafte CSA-Verordnung noch nicht gilt?**

**Warum die Frage so gestellt ist:** In Akte und Nachtrag 01 stand die Frage „dürfen wir überhaupt abgleichen" (offene Entscheidung Nr. 30). Sie hat jetzt ein Datum. Unsere Architektur baut den Abgleich in der privaten Zone als abschaltbaren Schalter. Wir möchten wissen, ob wir mit eingeschaltetem oder mit ausgeschaltetem Schalter starten — und was im zweiten Fall für den Umgang mit Meldungen aus dieser Zone gilt, bei denen ein Beteiligter uns ein Bild selbst vorlegt.

**Unverändert:** Den öffentlichen Bereich (Profilbilder, Vorabprüfung vor Freischaltung) halten wir für getrennt zu bewerten.

## Frage 2 — genügt eine KJM-positiv bewertete Altersschätzung für Stufe 2?

> **Die KJM hat im März 2026 ein Altersschätzungsmodul eines deutschen Anbieters mit einem nicht änderbaren Puffer von drei Jahren positiv bewertet. Genügt ein solches Modul, kombiniert mit einem positiv bewerteten Authentifizierungsmodul, als Identifizierung für den privaten expliziten Bereich (Stufe 2) — sofern § 4 Abs. 2 JMStV dort überhaupt greift (Nachtrag 01, Frage 1)?**

**Anschlussfragen:**
- Was gilt für Nutzer, deren geschätztes Alter unter der Puffergrenze liegt (bei drei Jahren: unter 21)? Wir würden ihnen einen zweiten Weg anbieten, etwa die eID. Ist ein solcher Rückfallweg Pflicht oder nur unsere Entscheidung?
- Ändert sich an Frage 4 aus Nachtrag 01 (einmalige Identifizierung dauerhaft gültig?) etwas, wenn die Identifizierung eine Schätzung ist?

**Warum das Geld bewegt:** Nach unserem Finanzmodell liegt zwischen dem günstigsten und dem teuersten zulässigen Weg für Stufe 2 eine Spanne von rund 71.000 € Kapitalbedarf *(korrigiert am 16.09.2026; zuvor stand hier eine Näherung von rund 49.000 €)*. Eine anerkannte Altersschätzung wäre ein weiterer, voraussichtlich günstiger Weg — Stückpreise sind nicht öffentlich und werden im Anbietergespräch erfragt.

## Frage 3 — KI-Verordnung nach dem Omnibus

> **(a) Ist eine KI-gestützte Altersschätzung, die wir als Betreiber von einem Anbieter einsetzen, ein Hochrisiko-System nach Anhang III — mit Pflichten ab 02.12.2027, also ab unserem Start? (b) Bleibt es bei der Einschätzung zu Art. 5 Abs. 1 lit. g (Akte, Teil B10)? (c) Trägt der neue Art. 4a eine Prüfung unseres Bildklassifikators auf Verzerrungen nach Hautton und Körperform (offene Entscheidung Nr. 32), und welche der sechs Bedingungen wären für uns als kleiner Betreiber kritisch?**

## Frage 4 — Vorbereitungsphase und Gründungsstipendium

> **Schadet eine nicht rechtsfähige Innengesellschaft ohne Gewerbeanmeldung, wie im Entwurf der Vorbereitungs-Vereinbarung vorgesehen, der Förderfähigkeit beim Gründungsstipendium Niedersachsen? Und kann das bestehende Einzelunternehmen von Nicolas Greulich als „bereits gegründet" gewertet werden?**

**Hinweis:** Die zweite Hälfte ist zuerst eine Frage an die NBank. Wir stellen sie hier, weil die Antwort die Gestaltung der Vereinbarung (offene Entscheidungen Nr. 43 und Nr. 44) beeinflusst.

## Frage 5 — Web-Abo und Diskretion

*Ergänzt am 15.09.2026 bei der Arbeit an den Systemtexten (A-14, `50-produkt-prototyp/systemtexte-ENTWURF.md`).*

> **Wie gestalten wir das Web-Abo so, dass es die Verbraucherschutzvorschriften erfüllt, ohne unsere Nutzer durch die dafür nötigen Mitteilungen zu outen?**

**Die Einzelfragen:**
- **Verlängerung (§ 309 Nr. 9 BGB):** Nach unserem Verständnis darf sich ein Laufzeitabo (3, 6 oder 12 Monate) per AGB nur auf unbestimmte Zeit mit höchstens einmonatiger Kündigungsfrist verlängern. Zu welchem Preis darf die Verlängerung laufen, und wie formulieren wir sie?
- **Kündigungsbestätigung (§ 312k Abs. 4 BGB):** Die Kündigung ist „sofort auf elektronischem Wege in Textform“ zu bestätigen. Genügt eine Bestätigung im Mitteilungsbereich der App mit Möglichkeit zum Speichern — oder muss sie per E-Mail gehen? Wenn E-Mail: Wie neutral dürfen Absender und Betreff sein?
- **Pflichtangaben:** Müssen Transaktions-E-Mails (Bestätigungscode, neues Passwort, gegebenenfalls Kündigungsbestätigung) die Pflichtangaben eines Geschäftsbriefs der GmbH enthalten — und wenn ja, dürfen sie im Fuß stehen statt im Absender?
- **Abrechnungsname:** Welche Angaben müssen auf dem Kontoauszug der Nutzer erscheinen? Ist ein neutraler Name zulässig, solange er der Gesellschaft zuzuordnen ist?
- **Vorauswahl:** Handbuch B sieht das Jahresabo im Kaufbildschirm vorausgewählt vor. Ist das bei gleich deutlicher Darstellung aller Laufzeiten und Gesamtpreise zulässig (Art. 25 DSA, Verbraucherrecht)?

**Warum das mehr als Formalie ist:** Bei einer App für schwule Männer ist ein Betreff, ein Absender oder eine Zeile auf dem Kontoauszug genau die Stelle, an der ein mitlesender Partner, Elternteil oder Arbeitgeber etwas erfährt. Die Krisenkommunikation (A-18) hat dieselbe Frage für Sicherheitsmitteilungen gestellt; hier stellt sie sich für den Alltag.

---

## Was wir aus dem Termin zusätzlich mitnehmen möchten

1. Die Startkonfiguration von Zone 2: an oder aus.
2. Ob die Altersschätzung mit Puffer als Weg für Stufe 2 in die Produktspezifikation darf.
3. Eine Einordnung der Altersschätzung nach der geänderten KI-Verordnung.
4. Eine Gestaltung des Web-Abos, die Verbraucherrecht und Diskretion zugleich erfüllt.

---

*Dieser Nachtrag ist ein Vorbereitungspapier der Gründer, keine Rechtsauffassung. Alle Angaben zur Rechtslage sind Rechercheergebnisse mit Stand 15.09.2026 und stehen unter dem Vorbehalt Ihrer Prüfung. Quellen: `01-steuerung/wettbewerbsbeobachtung-log.md`, Lauf 1.*
