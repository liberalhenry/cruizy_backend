# Verarbeitungsübersicht — Zuarbeit für Datenschutzerklärung und Verzeichnis

> ## ⚠ ENTWURF · Zuarbeit, keine Datenschutzerklärung
>
> **Stand 19.09.2026, fortgeschrieben am 20. und 21.09.2026 (D16 bis D22, Dienstleister) · Aufgabe A-49 · Vorarbeit zu den Dokumenten 03.01 und 03.07 des Datenraums**
> **Bewusst keine ausformulierte Datenschutzerklärung.** Bei Daten nach Art. 9 DSGVO wäre ein Laientext gefährlich: Er läse sich fertig und wäre es nicht. Was der Anwalt und der Datenschutzbeauftragte stattdessen brauchen, ist diese Übersicht — **wer verarbeitet was, wozu, auf welcher Grundlage, wie lange**. Daraus entstehen dann das Verzeichnis nach Art. 30 und die Erklärung.

---

## 1 · Was verarbeitet wird

| # | Datenart | Zweck | Rechtsgrundlage *(Vorschlag, zu prüfen)* | Dauer *(Vorschlag)* |
|---|---|---|---|---|
| D1 | **E-Mail-Adresse oder Apple-Kennung** | Anmeldung, Wiederherstellung | Art. 6 Abs. 1 lit. b | bis zur Löschung des Kontos |
| D2 | **Profilangaben ohne besondere Kategorien** — Anzeigename, Alter, Beschreibung | Darstellung | Art. 6 Abs. 1 lit. b | bis zur Löschung |
| D3 | **Angaben zu Geschlechtsidentität, Vorlieben, Gesundheit** | Darstellung, Filter | **Art. 9 Abs. 2 lit. a — ausdrückliche Einwilligung** | bis Widerruf, dann ⚠ **AF-10** |
| D4 | **Bilder** | Profil, Chat, Alben | lit. b; bei erkennbarer Orientierung zusätzlich Art. 9 Abs. 2 lit. a | nach Zonenregeln |
| D5 | **Gerundete Position (Zellmittelpunkt)** | Nähe anzeigen | lit. b; Einwilligung für den Gerätezugriff | flüchtig, kein Verlauf |
| D6 | **Nachrichten** | Chat | lit. b | 24-Stunden-Archiv, Alben nach eigener Regel |
| D7 | **Blockier- und Meldelisten** | Schutz | lit. b und lit. f | **unveränderlich**, auch nach Kontolöschung (F61) ⚠ |
| D8 | **Moderationsfälle** | gesetzliche Pflichten, Schutz | lit. c und lit. f | ⚠ **AF-12** — Dauer offen |
| D9 | **Hash-Treffer und Fallordner** | § 184b StGB, Art. 18 DSA | lit. c | nach Vorgabe der Behörde |
| D10 | **Altersprüfung** | JMStV | lit. c | **beim Anbieter sofort zu löschen** — vertraglich zu sichern (**Nr. 7**) |
| D11 | **Zahlungsdaten** | Abo | lit. b, lit. c | beim Zahlungsdienst; handelsrechtliche Fristen |
| D12 | **Kennzahlen ohne Personenbezug** | Betrieb, Tore | lit. f | monatlich archiviert (Q-16) |
| D13 | **Wartelisten-Adresse** | Information vor dem Start | Einwilligung | bis Widerruf oder Start |
| D14 | **Kontaktdaten von Ortspartnern** | Vertragsdurchführung | lit. b | Vertragsdauer plus Fristen |
| D15 | **Zugriffsprotokoll der Moderation** | Nachweis, Selbstkontrolle | lit. f, lit. c | mindestens 12 Monate |
| D16 | **Mobilnummer** *(neu; seit Nr. 69 freiwillig — als Anmeldeweg oder zweiter Weg; Rest von **Nr. 79** offen)* — verschlüsselt; ein Prüfwert zur Wiedererkennung gesperrter Konten nur, wenn **AF-04** das erlaubt | Anmeldung, Wiederherstellung, Benachrichtigung im Ernstfall nach Art. 34 DSGVO; SMS ohne Produktnamen und Anlass (FV-95) | lit. b und lit. c | bis zur Löschung des Kontos oder bis die Person sie entfernt |
| D17 | **Vorgänge des Kontaktservice** *(neu aus **Nr. 75**)* — Fallnummer, Kategorie, Text, freiwilliger Anhang, Antwortweg, Verlauf | Art. 12 und 16 DSA, Art. 12 DSGVO, Vertragsdurchführung | lit. c für Meldungen und Betroffenenrechte · lit. b für Konto- und Zahlungsfragen | ⚠ **P8** — Vorschlag: 90 Tage (Hilfe), 12 Monate (Missbrauch), gesetzlich (Datenschutz, Behörden) |
| D18 | **Codes und Einlösungen** *(neu aus **Nr. 60**)* — Code nur als Prüfwert, Art, Gültigkeit, Zähler; Einlösung: Konto, Code, Zeitpunkt; bei Unterstützercodes die Vorgangsnummer der Plattform | Freischaltung, Missbrauchserkennung | lit. b | Code bis Ablauf plus Prüffrist; Unterstützer-Mailadresse **nur für den Versand**, danach gelöscht |
| D19 | **Check-in** *(neu aus **Nr. 66**)* — Ort, Zeit, Gegenüber, Vertrauenspersonen, Nachrichtentext | Schutz der Person | **liegt nicht bei uns** — nur auf dem Gerät. Bei uns nur: dass ein Check-in läuft und wann die nächste Frage fällig ist (lit. b) | bis zum Ende des Check-ins; Ausnahme **Nr. 83 (b)** nur nach ausdrücklicher Wahl |
| D20 | **Zonen und Ersatzpunkt** *(neu aus **Nr. 48** und **Nr. 77**)* — Mittelpunkt und Radius je Zone, gewählter Ersatzpunkt, Wirkung | Schutz des Wohnorts, Anzeige nach eigener Wahl | lit. b | bis die Person die Zone löscht oder das Konto endet; ⚠ **W-27**: heute als genauer Punkt vorgesehen, Vorschlag: auf die Rasterzelle runden |
| D21 | **Wiederherstellung** *(neu aus **Nr. 69**)* — Wiederherstellungscode nur als Prüfwert; Vertrauenspersonen **nicht bei uns** (Teilschlüssel nach **Nr. 86**); Zahlungsbeleg beim Zahlungsdienst | Zugang zurückgeben, ohne eine Identität zu erheben | lit. b | Prüfwert bis zur Löschung des Kontos oder bis ein neuer Code erzeugt wird |
| D22 | **Veranstaltungen mit Anmeldung** *(neu aus **Nr. 74** und **Nr. 82**)* — Anmeldung, Gespräch mit dem Gastgeber, Zusage oder Absage, Adresse nach der Zusage, Gästeliste nur für den Gastgeber | Teilnahme ermöglichen, Adresse schützen | lit. b; die Teilnahme an einer queeren Veranstaltung kann ein Datum nach Art. 9 sein → **V8** | P-VERANSTALTUNG-LOESCHUNG nach dem Termin (Vorschlag: 7 Tage) |

**Die drei Stellen, an denen es anspruchsvoll wird:** D3 (Art. 9 mit Widerruf und Karenzfrage), D7 (unveränderliche Listen gegen das Recht auf Löschung) und D8/D9 (Aufbewahrung gegen Datenminimierung). Sie stehen alle bereits als Anwaltsfragen im Nachtrag 03.

**Zu D17 gehört ein Satz, der leicht übersehen wird:** Wer sich aus diesem Produkt heraus meldet, offenbart damit einen Zusammenhang mit seiner sexuellen Orientierung — **auch wenn der Text selbst harmlos ist.** Ein Vorgang des Kontaktservice ist deshalb regelmäßig ein Datum nach Art. 9 DSGVO, und das ist der Grund, warum er das eigene Werkzeug nicht verlässt (Moderations-Backend, Abschnitt 12, Zeile 17).

---

## 2 · Wer außer uns verarbeitet

| Dienstleister | Wofür | Sitz | Stand |
|---|---|---|---|
| Hosting | gesamte Anwendung | EU *(Vorgabe: kein US-Auftragsverarbeiter)* | Anbieter offen |
| Zahlungsdienst | Abo im Web, Wiederherstellung über den Zahlungsbeleg | Kandidat **Mollie**, Amsterdam (A-53) | Vertrag offen |
| Verifizierungsanbieter | Altersprüfung | EU-Sitz gefordert | **Nr. 7**, drei in der engeren Wahl |
| Maildienst | Wartelisten- und Systemmails | EU | **Nr. 63**, Vergleich und Nachtrag liegen vor; Empfehlung listmonk selbst betrieben plus europäischer Versandweg |
| SMS-Versand | Codes an die Mobilnummer (D16), Nachricht des Check-ins nach **Nr. 83** (a) — weitergereicht, nicht gespeichert | Kandidat **Sweego**, Frankreich | nach G-01 vertraglich zu bestätigen |
| Hash-Abgleich | Missbrauchsdarstellungen | außerhalb der EU möglich | **Nr. 17**, Zugangswege recherchiert |
| Fehlerprotokolle | Betrieb | **selbst betrieben** (GlitchTip oder Bugsink) — seit A-53 ohne US-Anbieter; eine Abo-Verwaltung wie RevenueCat braucht die Web-App nicht | **Nr. 58** / G-01 — die Ausnahmeliste bleibt leer |
| Crowdfunding-Plattform | Unterstützungen, Versand der Unterstützercodes (D18) | Kandidat Startnext, Dresden | eher eigener Verantwortlicher als Auftragsverarbeiter — **R5** |
| Ticketsystem *(Phase 2)* | Tickets für Veranstaltungen | Vorschlag **pretix** im Selbstbetrieb | ⚠ Handbuch B verlangt „nicht selbst abwickeln“ → **V12** |
| Stores | Kauf in den nativen Apps | USA | unvermeidbar, **AF-02** |

**Für jeden dieser Dienstleister braucht es einen Vertrag zur Auftragsverarbeitung** (Dokument 03.03 des Datenraums, heute fehlend) und einen Eintrag im Verzeichnis.

---

## 3 · Was ausdrücklich nicht verarbeitet wird

Diese Liste gehört in die Datenschutzerklärung, weil sie das Produkt beschreibt:

- **Kein genauer Standort.** Gespeichert wird der Mittelpunkt einer Rasterzelle, kein Koordinatenpaar und kein Bewegungsverlauf. ⚠ Heute noch mit einer Ausnahme, die dem Satz widerspricht: dem Mittelpunkt einer Zone (D20, **W-27**) — bis zur Entscheidung darf der Satz so nicht veröffentlicht werden.
- **Keine Werbe-Kennungen, keine Profilbildung zu Werbezwecken, kein Datenverkauf.**
- **Kein Klarname, kein Geburtsdatum, keine Telefonnummer** als Pflichtangabe — die Mobilnummer gibt es nur, wenn jemand sie selbst wählt (D16).
- **Kein Mitlesen in der privaten Zone.** Dort läuft ausschließlich der Hash-Abgleich, und nur, solange er rechtlich zulässig ist (**Nr. 30**).
- **Keine biometrische Kategorisierung**, die auf die sexuelle Orientierung schließt (Art. 5 Abs. 1 lit. g KI-VO, **Nr. 24**).
- **Keine Liste der Vertrauenspersonen** — weder für den Check-in (D19) noch für die Wiederherstellung (D21).

---

## 4 · Fragen an den Anwalt und den Datenschutzbeauftragten

| # | Frage | Bezug |
|---|---|---|
| P1 | **D3: Was passiert beim Widerruf der Art.-9-Einwilligung?** Karenz zulässig oder sofortige Löschung? | **AF-10** |
| P2 | **D7: Unveränderliche Blockierlisten gegen Art. 17 DSGVO.** Wie lange darf ein Eintrag über die Kontolöschung hinaus bestehen? | F61, **AF-08** |
| P3 | **D8/D9: Aufbewahrungsdauer für Moderations- und Hash-Fälle** | **AF-12** |
| P4 | **D5: Braucht der Gerätezugriff auf den Standort eine Einwilligung nach § 25 TDDDG**, auch wenn wir nur runden? | **AF-01** |
| P5 | **Rechtsnachfolge.** Wie muss die Erklärung formuliert sein, damit ein Verkauf die Einwilligungen nicht entwertet? | **Nr. 12** |
| P6 | **Reicht eine Erklärung für App und Webseite**, oder braucht die Wartelistenseite eine eigene? | **Nr. 61** |
| P7 | **Ist eine Folgenabschätzung zwingend**, und deckt eine gemeinsame alle Verarbeitungen ab? | Dokument 03.02 |
| P8 | **D17: Aufbewahrung der Vorgänge des Kontaktservice** — wie lange, und wie verhält sich die Wiederholungserkennung bei Missbrauchsmeldungen zu Art. 17 DSGVO? | **Nr. 75**, verwandt mit P2 und P3 |
| P9 | **Einladungscodes der Testphase:** Die Codetabelle sagt, **wer wen eingeladen hat** — eine Beziehungsinformation zwischen zwei Personen. Vorschlag: Verbindung mit dem Ende der Testphase löschen. Trägt das? | **Nr. 56**, verwandt mit P2 |
| P10 | **Ist die Schweiz unter Grundsatz G-01 zulässig?** Proton kommt als Postfach hinter den vier Eingängen des Kontaktservice in Frage; G-01 spricht von EWR. Angemessenheitsbeschluss genügt, oder braucht es eine begründete Ausnahme? | **Nr. 63**, berührt auch Nr. 11 |

---

## Herkunft

`../../50-produkt-prototyp/produktspezifikation.md` (F04 bis F75, Z-06, Z-09, Z-10, Q-08, Q-09, Q-16, AF-01 bis AF-12, W-27) · `../../50-produkt-prototyp/check-in-konzept.md` (D19) · `../../50-produkt-prototyp/standortanzeige-konzept.md` (D20) · `../../40-finanzen-foerderung/codesystem-konzept.md` (D18) · `../../35-veranstaltungen/veranstaltungskonzept.md` (D22, V8, V12) · `../../70-entwicklung-ab-monat-4/eu-alternativen-stack.md` (Dienstleister) · `../../50-produkt-prototyp/moderationsarchitektur.md` (Zonen, Speicherung, Zugriffsregeln) · `../trefferprozess-hash-abgleich.md` (Fallordner, Aufbewahrung) · `../datenschutzhinweis-warteliste-ENTWURF.md` (D13) · `../../40-finanzen-foerderung/datenraum-struktur.md` (Dokumente 03.01 bis 03.14). Rechtsgrundlagen sind **Vorschläge der Gründer**, keine geprüfte Einordnung.
