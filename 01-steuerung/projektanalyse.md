# Projektanalyse Cruizy

Stand: 24.07.2026 · Basis: Handbuch A (Produkt/Technik/Recht), Handbuch B (Wirtschaft), KI-Einsatzplan, Claude-Code-Kickoff — alle in `00-grundlagen/` bzw. `70-entwicklung-ab-monat-4/`.

## Das Projekt in drei Sätzen

Cruizy (Arbeitstitel) ist eine Cruising- und Verbindungs-App für schwule Männer im DACH-Raum, die statt Grindrs Frage „Wer ist in meiner Nähe?" die Frage „Was passiert hier gerade, und wo bin ich willkommen?" beantwortet. Verteidigt wird die Position über drei nicht kopierbare Vorteile: echte Ortsbeziehungen (40 Vereinbarungen je Stadt), Datensouveränität (deutsches Hosting, kein US-Auftragsverarbeiter, serverseitige Standortunschärfe) und asynchrone Mechanik für die Nicht-Metropole. Zweierteam (18 Jahre), Start als PWA in Köln — konkret: Schaafenstraße, 300 Nutzer auf 500 Metern statt 5.000 über die ganze Stadt.

## Komplexität nach Dimensionen

| Dimension | Umfang | Kernbefund |
|---|---|---|
| **Produkt** | 74 spezifizierte Funktionen: 46 MVP, 13 USPs, 15 bewusst gestrichen | Vier Reiter (Nähe · Heute · Chats · Ich). Sieben Prinzipien mit benanntem Preis. Prüffrage jeder Funktion: mehr Treffen oder nur mehr Zeit in der App? |
| **Technik** | React+Vite-PWA, selbst gehostetes Supabase auf einem **Hetzner-VPS mit Ubuntu 24.04 LTS** (Standort Falkenstein, Nürnberg oder Helsinki — niemals USA oder Singapur, G-01; geändert 28.09.2026, vorher hosttech → Nr. 99), PostgreSQL 17 + PostGIS | Vier Architekturentscheidungen sind nachträglich nicht einbaubar und müssen vor der ersten Funktionszeile stehen (siehe unten). Eigenbau: Geo-Suche, Chat, Ranking. Zukauf: Altersverifikation, Hash-Abgleich, Moderations-Vorfilter, Zahlung. |
| **Recht** | Die komplexeste Dimension | Art.-9-DSGVO-Daten ab Registrierung (DSFA, externer DSB ab Tag 1, nur ausdrückliche Einwilligung), DSA-Kontaktstellen, JMStV inkl. Jugendschutzbeauftragtem, § 184b StGB mit strafrechtlicher Verantwortung der Geschäftsführung. **Die JMStV-Frage (geschlossene Benutzergruppe § 4 Abs. 2) bestimmt das gesamte Geschäftsmodell und ist vor allem anderen anwaltlich zu klären.** |
| **Wirtschaft** | Kapitalbedarf realistisch 94 T€, planen mit 130 T€; Break-even Monat 21–23 | Nettoerlös 7,38 €/Zahler/Monat, tragbarer CAC 2,04 € → bezahlte Akquise rechnerisch ausgeschlossen, organisch ist die einzige aufgehende Strategie. Fünf Erlösquellen; 253 Abonnenten decken die Fixkosten. |
| **Markt** | 600–850 T aktive Männer DACH, konsolidierender Markt | Grindr hochprofitabel (~130 Mio. $/Quartal), Match Group mit 100 Mio. $ bei Sniffies. Die Nischenvorteile machen eine Stadt gewinnbar, nicht den Markt. Städtereihenfolge: Köln → Berlin → Hamburg → München → Frankfurt → Wien → Zürich. |
| **Team/Betrieb** | Zwei Gründer, Vollzeit, ohne Gehalt bis mindestens Monat 26 | Ortsakquise und Interviews sind nicht delegierbar. Social Media = 40 % der Zeit von Gründer 2, 14–19 Std./Woche über mindestens neun Monate. Moderation anfangs selbst. |

> *Hinweis vom 19.09.2026:* Die Zeile **Wirtschaft** ist überholt. Nach der vollständigen Nachrechnung vom 16.09.2026 liegt der Kapitalbedarf der Firma zwischen **95.258 € und 166.548 €** je nach Prüfweg beim Jugendschutz, voreingestellt **107.349 €** — nicht bei 94 T€. Der Break-even liegt im Modell in **Monat 24**, der Tiefpunkt bei −82.790 € in Monat 23; „Monat 21–23“ war die Angabe aus Handbuch B. Die Planungsregel „mit 130 T€ planen“ gilt weiter, deckt aber den teuersten Prüfweg nicht mehr ab. Grundlage: `../40-finanzen-foerderung/kapitalbedarf-gegenrechnung.md`, Abschnitt 3, und das Finanzmodell, Blatt „Kennzahlen“. Die Zeile oben bleibt als Stand vom 24.07.2026 stehen.
>
> *Hinweis vom 21.09.2026 (A-52):* Mit den Beschlüssen vom 19. und 21.09.2026 liegt der Kapitalbedarf der Firma bei **160.253 €** (Spanne 143.397 € bis 245.841 €), der Gesamtbedarf mit Lebenshaltung bei **233.053 €**; Break-even in **Monat 28**, Tiefpunkt −126.877 € in Monat 27. Die Planungsregel „mit 130 T€ planen“ ist durch Nr. 38 abgelöst: Geplant wird gegen den Gesamtbedarf. Grundlage: Finanzmodell, Blatt „Herkunft & Widersprüche“, Abschnitt 5.
>
> *Hinweis vom 22.09.2026 (A-62):* In derselben Zeile sind auch die Stückzahlen überholt. Der Nettoerlös je Zahler liegt bei **7,56 €** im Monat (60 % Web, 40 % Store; Handbuch B: 7,38 € bei 40 % Web), die tragbaren Akquisekosten bei **1,97 €** je gewonnenem Nutzer (0,33 € Erlös je aktivem Nutzer im Monat 36, 18 Monate Verweildauer, Verhältnis 3:1; Handbuch B: 2,04 €). Die Folgerung bleibt: Bezahlte Akquise geht rechnerisch nicht auf. Statt „253 Abonnenten decken die Fixkosten“ gilt: **299 Zahler** decken die laufenden Kosten bei 5.000 aktiven Nutzern, 411 bei 12.000. Grundlage: `../40-finanzen-foerderung/preise-und-bezahlstufen.md`, Abschnitt 4.
>
> *Hinweis vom 17.09.2026 (A-29):* Die Zahlen in der Zeile „Produkt“ stammen aus der Kopfzeile von Handbuch A. Der Funktionskatalog selbst weist **54** Funktionen als MVP aus, dazu 17 als V2, 1 als V3 und 2 als gestrichen; die Marke USP tragen 18 Funktionen — „13 USPs“ meint die Liste der dreizehn Alleinstellungsmerkmale, „15 bewusst gestrichen“ die Streichliste. Die Abweichung ist in `50-produkt-prototyp/produktspezifikation.md` als ⚠ W-26 benannt (Abschnitt 19.1); die Spezifikation folgt den Katalogzeilen. Die Zeile oben bleibt unverändert.

## Kritische Abhängigkeiten — warum die Reihenfolge nicht beliebig ist

1. **JMStV-Klärung zuerst.** Entscheidet zwischen Selfie-Prüfung (~0,40 €/Nutzer) und KJM-anerkanntem Verfahren (mehrere €/Nutzer) — und damit über das Geschäftsmodell. Erstes Anwaltsgespräch, Tag 1–14.
2. **Gründung/Impressum vor Warteliste.** § 5 DDG verlangt eine ladungsfähige Anschrift auf der Wartelistenseite — verknüpft mit einer App für schwule Männer ein echtes Problem für zwei 18-Jährige. Beste Lösung: erst gründen, Firmenadresse nutzen.
3. **Datenschutzhinweis vor der ersten E-Mail-Adresse.** Inklusive ausdrücklichem Übergang auf die spätere Gesellschaft — fehlt das, geht ein Teil der Liste verloren. Rechtsnachfolge auch in der späteren Datenschutzerklärung (sonst gefährdet ein Verkauf die Einwilligungen).
4. **Das Architektur-Viereck vor jeder Funktion:** serverseitige Standortunschärfe (nur Entfernungsbänder), Bildpipeline (EXIF-Entfernung, 32×42-Zwischenstufe, getrennte nicht ableitbare Ablage), vollständige Löschbarkeit/Export ab erster Migration, kein US-Auftragsverarbeiter. Nachrüsten kostet jeweils das Zehnfache.
5. **Kennzahlenhistorie ab Tag 1.** Kohortendaten monatlich archivieren — nicht nachholbar, preisrelevant bei jedem späteren Verkauf.
6. **Social-Media-Kanäle sofort.** Sechs bis neun Monate Vorlauf bis Reichweite; wer zum Launch anfängt, hat zum Launch null.
7. **Antwortquote als letztes MVP-Feature** — braucht existierende Chatdaten.

## Die drei Tore (verbindlich, vorab schriftlich)

| Tor | Kriterium | Bei Verfehlung |
|---|---|---|
| Tag 90 | > 1.500 Wartelisten-Anmeldungen, davon ≥ 900 aus einer Stadt · *die Liste läuft dann bereits 151 Tage, siehe `tor-1-zeitachse-analyse.md`* | Nicht weiterbauen |
| Monat 12 | ≥ 5.000 echte Follower und 800 Installationen über eigene Kanäle | Format ändern, Kapital aufnehmen oder beenden — Entscheidung jetzt schriftlich festlegen |
| Monat 15 | ≥ 3.500 MAU in Köln | These widerlegt |

## Größte Risiken (nach Erwartungsschaden)

Datenleck mit Outing-Folge (existenziell — beendet die Marke dauerhaft), Liquidität/Dichte wird nie erreicht, organischer Kanal trägt nicht (es gibt keinen bezahlbaren Ausweichkanal), App-Store-Ablehnung (deshalb PWA als Hauptprodukt), Missbrauchsdarstellungen (strafrechtlich, Hash-Abgleich alternativlos), Gründererschöpfung. **Nie gestrichen werden:** Datenschutzbeauftragter, Hash-Abgleich, Cyberversicherung, Rechtsrückstellung.

## Quellenordnung bei Widersprüchen

Handbuch A ist Wahrheitsquelle für Produkt/Technik/Recht, Handbuch B für alles Wirtschaftliche, der KI-Einsatzplan regelt die Arbeitsweise in Cowork (Monat 1–3), der Claude-Code-Kickoff die erste Programmiersitzung (ab Monat 4). Widerspricht eine Aufgabe den Handbüchern, wird das benannt — nie stillschweigend übergangen oder übernommen.
