# Das JMStV-Problem — Analyse und Einschätzung

Stand: 24.07.2026 · Rechtslage per Websuche verifiziert (Quellen am Ende) · **Keine Rechtsberatung — Grundlage für das erste Fachanwaltsgespräch**

## Worum es geht

§ 4 Abs. 2 JMStV erlaubt pornografische Inhalte in Telemedien nur innerhalb einer **geschlossenen Benutzergruppe**: Der Anbieter muss sicherstellen, dass ausschließlich Erwachsene Zugang haben. Nach den KJM-Kriterien verlangt das zwei Stufen — **Identifizierung** (einmalig, grundsätzlich durch persönlichen Kontakt oder Gleichwertiges wie eID/Bank-Ident/PostIdent) plus **Authentifizierung** bei jeder Nutzung. Eine Selfie-Altersschätzung wurde von der KJM bislang nur als *Teillösung* auf der Identifizierungsebene positiv bewertet — allein genügt sie ausdrücklich nicht.

## Warum das unser Geschäftsmodell bestimmt

Eine Cruising-App wird absehbar pornografische Nutzerinhalte enthalten — in Profilbildern, privaten Alben, im Chat. Greift die Pflicht zur geschlossenen Benutzergruppe für die App oder Teile davon, folgt daraus:

1. **Kosten:** KJM-konforme Identifizierung kostet mehrere Euro je Nutzer statt ~0,40 € für eine Selfie-Schätzung. Bei 7,38 € Nettoerlös je Zahler und Monat und 2,04 € tragbarem CAC kippt die Einheitenökonomie. *(Stand 22.09.2026: Das Finanzmodell rechnet seit A-52 mit 7,56 € je Zahler und 1,97 € tragbaren Akquisekosten; die Folgerung bleibt dieselbe. Was die Prüfwege heute kosten: `../40-finanzen-foerderung/kapitalbedarf-gegenrechnung.md`, Abschnitt 4.)*
2. **Trichter:** Jede Identifizierungshürde vor der Nutzung kostet einen Großteil der Registrierungen. Grindr und Co. verlangen nichts dergleichen — wir stünden mit der höchsten Eintrittshürde der Kategorie da.
3. **Positionierung:** Identifizierung erzeugt genau den Datenbestand (Klarname ↔ schwule Cruising-App), den unsere gesamte Architektur vermeiden will. Der Widerspruch ist nicht kosmetisch, sondern frontal.

## Die ungeklärte Kernfrage

Handbuch A antwortet mit einer Sauberkeitsarchitektur: **keine expliziten Inhalte im öffentlichen Raster** (Vorabprüfung aller öffentlichen Fotos), Pornografie ausschließlich in **privaten, beidseitig freigegebenen Alben** zwischen altersgeprüften Erwachsenen, 18+-Prüfung vor der ersten Nachricht.

Die offene Rechtsfrage: **Ist beidseitig freigegebener 1:1-Austausch ein „Zugänglichmachen" von Pornografie durch uns als Anbieter — oder Individualkommunikation außerhalb der Anbieterpflicht?** Dafür gibt es keine gefestigte Rechtsprechung. Genau diese Frage muss der Fachanwalt beantworten, bevor das Produktdesign endgültig steht.

## Der Standortnachteil, der selten benannt wird

Grindr, ROMEO und Sniffies betreiben de facto keine KJM-konforme geschlossene Benutzergruppe — sie sitzen aber im Ausland. Verfahren der Landesmedienanstalten gegen EU-ausländische Anbieter sind langwierig (Herkunftslandprinzip; die xHamster-Verfahren liefen über Jahre). **Eine deutsche GmbH hat diesen Puffer nicht.** Wir wären der am leichtesten greifbare Anbieter der gesamten Kategorie — die Aufsicht müsste für eine Anordnung nur einen Brief nach Deutschland schicken. Der deutsche Sitz ist unser Datenschutz-Alleinstellungsmerkmal und zugleich unser regulatorisches Exposure.

## Was sich 2025/26 verschärft hat (verifiziert)

- **6. MÄndStV seit 01.12.2025 in Kraft:** „Follow-the-Money" — die KJM kann Zahlungsströme rechtswidriger Angebote unterbinden lassen (trifft direkt Stripe & Co.); Mirror-Page-Sperren werden schneller und unbürokratischer; Betriebssystemansatz (geräteweiter Jugendschutz) verpflichtend spätestens ab 01.12.2027.
- **Gerichte bestätigen die harte Linie:** VG Berlin und VG Neustadt haben Sperrverfügungen gegen Pornoplattformen bestätigt (04/2025).
- **Neu und für uns relevant:** Anerkannte Selbstkontrolleinrichtungen (z. B. FSM) können seit 12/2025 die Eignung von Altersverifikationssystemen bestätigen — ein planbarer Weg, das eigene Konzept **vorab** absegnen zu lassen.
- **EU-Ebene zieht parallel an:** DSA-Art.-28-Leitlinien (07/2025) empfehlen Altersverifikation für Plattformen mit Erwachseneninhalten; die datensparsame **EU-Altersverifikations-App („Mini-Wallet") ist seit 04/2026 technisch fertig**; EUDI-Wallets müssen bis 24.12.2026 bereitstehen (deutsche Wallet realistisch Anfang 2027). Verfahren gegen Pornhub, Stripchat, XNXX, XVideos laufen. Selbstauskunft („Ich bin 18") ist regulatorisch tot.

## Meine Einschätzung

**Die Sauberkeitsarchitektur aus Handbuch A ist die richtige und vermutlich einzige wirtschaftlich tragfähige Verteidigungslinie — aber sie ist eine Grauzone, kein sicherer Hafen.** Konkret:

1. **Öffentlicher Bereich strikt pornografiefrei = gut verteidigbar.** Mit lückenloser Vorabprüfung und Protokollierung ist belegbar, dass der zugängliche Teil der App keine Pornografie verbreitet. Das ist die halbe Miete und vollständig in unserer Hand.
2. **Private Alben = das Restrisiko.** Die Einordnung als Individualkommunikation ist gut vertretbar, aber nicht gesichert. Eine Landesmedienanstalt könnte anders entscheiden — dann käme es gestuft (Beanstandung → Untersagung → Sperrung/Zahlungsstrom), nicht als sofortiges Aus. Zeit zum Reagieren gäbe es, aber der Reputationsschaden einer öffentlichen Beanstandung wäre für eine Vertrauensmarke erheblich.
3. **Deshalb modular bauen (Handbuch A sagt das bereits richtig):** Die Altersprüfung so architektieren, dass eine strengere Stufe eine *Konfigurationsänderung* ist, kein Umbau. Konkret als Fallback-Option vorbereiten: Basisfunktionen mit einfacher 18+-Prüfung, **private Alben/Bildversand erst nach härterer Prüfstufe** — eine gestufte geschlossene Benutzergruppe nur für den sensiblen Teil. Das würde selbst im Worst Case den Trichter für die Kernnutzung schützen.
4. **Die EU-Entwicklung spielt uns in die Karten.** Mini-Wallet und EUDI-Wallet liefern ab ~Ende 2026/Anfang 2027 genau das, was wir brauchen: 18+-Nachweis ohne Identitätsoffenlegung gegenüber uns, perspektivisch nahe Nullkosten. Unser Launchfenster (Beta Monat 8–9, öffentlich ab Monat 10+) passt zeitlich fast perfekt dazu. Die Wallet-Anbindung gehört von Anfang an in die Architektur.
5. **Vorab-Bestätigung anstreben.** Der neue FSM/KJM-Bestätigungsweg macht das Konzept planbar, statt auf eine Beanstandung zu warten. Das kostet Zeit und etwas Geld, kauft aber Rechtssicherheit — und ist zugleich ein Marketingargument, das kein Wettbewerber hat: die erste Cruising-App mit regulatorisch bestätigtem Jugendschutzkonzept.
6. **Finanzplanung absichern:** Handbuch B rechnet implizit mit dem günstigen Prüfpfad. Beide Kostenpfade (0,40 € vs. 2–5 €/Nutzer für den Album-Bereich) gehören als Szenario ins Finanzmodell.

**Kurzfassung:** Das Problem ist real, aber gestaltbar. Es entscheidet nicht, *ob* die App gebaut werden kann, sondern *wie teuer die Tür* wird und *wie die Bildarchitektur gestuft* sein muss. Die Antwort darauf muss vor Phase 1a vorliegen — deshalb Anwaltsgespräch in den ersten 14 Tagen, mit dem Fragenkatalog aus diesem Ordner.

## Quellen

- [KJM: 6. MÄndStV tritt in Kraft — Mehr Schutz, weniger Schlupflöcher (19.11.2025)](https://www.kjm-online.de/pressemitteilungen/6-maendstv-tritt-in-kraft-mehr-schutz-weniger-schlupfloecher/)
- [FSM: Altersverifikationssysteme / Geschlossene Benutzergruppen](https://www.fsm.de/wissen/a-bis-z/altersverifikationssysteme-geschlossene-benutzergruppen/)
- [KJM: Unzulässige Inhalte / AVS-Kriterien](https://www.kjm-online.de/themen/technischer-jugendmedienschutz/unzulaessige-inhalte/)
- [KJM: Sperrverfügungen gerichtlich bestätigt (30.04.2025)](https://www.kjm-online.de/pressemitteilungen/sperrverfuegungen-bestaetigt/)
- [EU-Kommission: Age-verification blueprint](https://digital-strategy.ec.europa.eu/en/news/commission-makes-available-age-verification-blueprint)
- [Lewis Silkin: Age Assurance in 2026 — UK/EU-Überblick (17.04.2026)](https://www.lewissilkin.com/insights/2026/04/17/age-assurance-in-2026-what-do-digital-businesses-operating-in-the-uk-and-eu-need-to-know)
- [Corbado: EUDI Wallet 2026 — Deadline und Rollout](https://www.corbado.com/blog/eudi-wallet-2026-deadline-rollout-eic-2026)
- Wissenschaftliche Dienste des Bundestags: [WD 8-049-25 Jugendmedienschutz durch Altersverifikation](https://www.bundestag.de/resource/blob/1108608/WD-8-049-25.pdf)
