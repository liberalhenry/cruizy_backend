# Hash-Abgleich gegen bekannte Missbrauchsdarstellungen — Zugangswege

Erstellt: 27.07.2026, 02:15 Uhr · Aufgabe A-08 · Rolle: Trust-&-Safety-Analyst · Fenster **V0**
Alle Angaben per Websuche am 27.07.2026 erhoben. Quellen mit Abrufdatum am Ende.
Kontext: Code-Planer AP-4 (Bildpipeline) · Handbuch A Funktionskatalog · offene Entscheidung Nr. 17
**Wie der Hash-Abgleich in die Gesamtmoderation eingebettet ist:** `../50-produkt-prototyp/moderationsarchitektur.md` (A-37) — dort steht, in welcher Zone er läuft, was daneben läuft und was ausdrücklich nicht.

> **Warum diese Aufgabe früh dran ist:** Der Zugang zu Hash-Listen ist nichts, was man kauft. Er ist ein Zulassungsverfahren mit Prüfung des Antragstellers, und die dauert. Wer damit anfängt, wenn die Bildpipeline steht, wartet mit fertigem Code auf eine Freigabe.
>
> ## ✎ Fortgeschrieben am 27.09.2026 — der Antrag kommt bewusst später
>
> **Beschlossen am 27.09.2026 (Nr. 98, Weg b):** Gebaut wird zuerst, beantragt wird danach. Der Satz oben beschreibt damit genau die gewählte Lage — **mit fertigem Code auf eine Freigabe warten**, und zwar bewusst, weil der Zeitplan es trägt (T0 liegt im Planungsfall im Juli 2029).
>
> **Dazu eine Berichtigung dieses Dokuments:** Die Wartezeit ist nicht für alle Wege gleich. „Monate" gilt für **IWF** und **PhotoDNA**. Für **Project Arachnid**, den empfohlenen Einstiegsweg, nennt Abschnitt 3 nach Erfahrungsberichten **Tage bis Wochen** — kostenlos und ausdrücklich offen für kleine Plattformen. In mehreren anderen Dokumenten stand bis zum 27.09.2026 pauschal „die Zulassung dauert Monate"; das war zu grob und ist dort berichtigt.
>
> **Was damit gesperrt ist:** Solange kein Zugang besteht, lässt sich **kein Betrieb mit echten Menschen** freigeben — weder die geschlossene Testphase noch der öffentliche Start (Spezifikation AK-M02-11). Die Sperre steht im Code.
>
> **Was beim Antrag mit zu klären ist:** ob Project Arachnid einen **reinen Hash-Modus** anbietet oder Medien entgegennimmt. Davon hängt ab, ob ein Bild die EU verlässt (Grundsatz **G-01**). Die Schnittstelle wird so gebaut, dass **beide Bauformen** passen; bleibt es beim Medienversand, ist **Thorn Safer selbst gehostet** die Zielarchitektur.

---

## 1 · Was Hash-Abgleich ist — und was er nicht ist

Ein Wahrnehmungs-Hash („perceptual hash") ist ein kurzer Zahlenwert, der aus einem Bild berechnet wird. Anders als eine Prüfsumme überlebt er Verkleinern, Zuschneiden und leichte Veränderungen. **Der Hash lässt sich nicht in ein Bild zurückrechnen.**

Der praktische Ablauf: Ein hochgeladenes Bild wird lokal gehasht, der Hash gegen eine Liste bekannter, von Fachleuten geprüfter Hashes verglichen. Bei Treffer greift ein festgelegter Prozess. **Bei Nicht-Treffer passiert nichts, und niemand hat das Bild gesehen.**

**Was daraus für uns folgt — und was der entscheidende technische Punkt dieser ganzen Recherche ist:**

> Bei einer Lösung mit lokalem Hashing **verlässt das Bild unsere Infrastruktur nie.** Nur der Hash geht hinaus, und aus dem Hash lässt sich das Bild nicht rekonstruieren. Damit ist die Frage „verlässt das Bild die EU?" beantwortbar mit: nein — sofern wir eine Variante wählen, die lokal hasht.

Das ist keine Nebensächlichkeit. Es ist der Unterschied zwischen einem Verfahren, das zu unserer Positionierung passt, und einem, das sie beendet.

**Was Hash-Abgleich nicht leistet:** Er findet ausschließlich **bereits bekanntes** Material. Neues oder mit generativen Werkzeugen erzeugtes Material fällt durch — die IWF weist ausdrücklich darauf hin, dass dieses Problem wächst. Hash-Abgleich ist eine Schicht, nicht die Lösung.

---

## 2 · Die Rechtslage in der EU ist gerade in Bewegung — Stand 27.07.2026, Nachtrag 15.09.2026

Dieser Abschnitt ist der wichtigste des Dokuments und muss vor jeder Architekturentscheidung gelesen werden.

| Datum | Was passiert ist |
|---|---|
| 14.07.2021 | Verordnung (EU) 2021/1232 schafft eine **befristete Ausnahme** von Art. 5 Abs. 1 und Art. 6 der ePrivacy-Richtlinie. Sie erlaubt Anbietern nummernunabhängiger interpersoneller Kommunikationsdienste, **freiwillig** auf Missbrauchsdarstellungen zu prüfen. |
| 26.03.2026 | Das Europäische Parlament stimmt gegen eine Verlängerung. |
| **03./04.04.2026** | **Die Ausnahme läuft aus.** Für freiwillige Erkennung in interpersoneller Kommunikation fehlt seither eine ausdrückliche, harmonisierte Rechtsgrundlage. Erkennung ist nicht verboten — aber sie steht ohne klare Grundlage da. |
| 09.07.2026 | Das Parlament stimmt im Dringlichkeitsverfahren (Regel 163) doch für eine Verlängerung **bis April 2028**. Die Ablehnung scheiterte knapp: 314 bis 315 Gegenstimmen bei 361 erforderlichen. Verschlüsselte Dienste bleiben ausgenommen. |
| ~~offen~~ | Der Rat hatte drei Monate Zeit, die Entscheidung zu bestätigen oder abzulehnen. **Erledigt — siehe nächste Zeile.** |
| **23.07.2026** | *Nachtrag 15.09.2026 (R-01):* **Der Rat stimmt endgültig zu**, einschließlich des Ausschlusses Ende-zu-Ende-verschlüsselter Kommunikation. Die Ausnahme gilt wieder **bis 03.04.2028** und tritt drei Tage nach Veröffentlichung im Amtsblatt in Kraft (Fundstelle im Lauf nicht ermittelt). **Sie endet damit drei Monate vor T0.** Quelle: Rat der EU, Pressemitteilung vom 23.07.2026. |
| ab 09/2026 | Verhandlungen über die dauerhafte **CSA-Verordnung** sollen beginnen. |

> **Nachtrag 15.09.2026:** Die Verlängerung ist beschlossen, aber sie läuft am 03.04.2028 aus — vor unserem Start. Wenn bis dahin keine dauerhafte CSA-Verordnung gilt, beginnt Cruizy ohne diese Grundlage für den freiwilligen Abgleich in privater Kommunikation. Der Schalter für Zone 2 aus `moderationsarchitektur.md` ist damit keine Vorsichtsmaßnahme mehr, sondern die wahrscheinliche Startkonfiguration, bis der Anwalt etwas anderes sagt. Anwaltsfrage: `anwaltstermin/nachtrag-02-stand-september-2026.md`, Frage 1.

**Was das für uns bedeutet.** ~~Wir bauen ohnehin erst ab T0 (Sommer 2028).~~ **Berichtigt am 27.09.2026:** Nach Beschluss **Nr. 73** wird **vor** T0 gebaut; T0 liegt im Bestfall Juli 2028, im Planungsfall Juli 2029 (Nr. 45). Bis dahin wird sich die Lage entweder geklärt haben oder erneut verändert haben. **Deshalb ist die richtige Handlung heute nicht, eine Rechtsfrage zu beantworten, sondern den Zugang zu beantragen** — das dauert unabhängig von der Rechtslage, und ein bewilligter Zugang, den man nicht sofort nutzt, kostet nichts.

**Der Punkt, den wir uns architektonisch merken müssen:** Die Ausnahme betraf **interpersonelle Kommunikation** — also Chat und private Alben. Sie betraf nicht öffentlich zugängliche Inhalte. Ein Hash-Abgleich auf **öffentlichen Profilbildern**, die bei uns ohnehin vor Freischaltung geprüft werden, ist rechtlich deutlich weniger exponiert als derselbe Abgleich im Chat. Das ist dieselbe Zweiteilung wie bei der Altersprüfung: Der öffentliche Bereich ist der einfache Teil, der private der schwierige.

---

## 3 · Die sechs Zugangswege im Vergleich

| Weg | Träger | Zulassung | Wartezeit | Kosten | Integration | Verlässt das Bild die EU? |
|---|---|---|---|---|---|---|
| **Project Arachnid / Shield** | Canadian Centre for Child Protection (Kanada) | Registrierung, danach Freischaltung durch das Team; ausdrücklich auch für kleine Plattformen | nicht öffentlich beziffert — nach Erfahrungsberichten Tage bis Wochen | **kostenlos** | HTTP-API, offizielle SDKs (u. a. PHP) auf GitHub | **Prüfen.** Die API nimmt Medien entgegen; ob eine reine Hash-Übermittlung möglich ist, muss im Gespräch geklärt werden. Kanada hat einen Angemessenheitsbeschluss der EU. |
| **PhotoDNA Cloud Service** | Microsoft (USA) | Antrag mit Prüfung; Zugang liegt im alleinigen Ermessen von Microsoft, Nachprüfung jederzeit möglich | nicht öffentlich beziffert | **kostenlos für qualifizierte Kunden** | API-Schlüssel nach bestandener Prüfung | **Kritisch.** Cloud-Dienst eines US-Anbieters. Widerspricht der Regel „kein Auftragsverarbeiter außerhalb der EU", solange nicht belegt ist, dass nur Hashes übertragen werden. |
| **Safer by Thorn** | Thorn (USA, gemeinnützig) | Vertragskunde | nicht öffentlich beziffert | **nicht öffentlich** — Angebot auf Anfrage | Zwei Varianten: Thorn-gehostete API oder **selbst gehostete Variante** | **Selbst gehostet: nein.** Nach Anbieterangabe werden Inhalte in der eigenen Umgebung gehasht und klassifiziert; nur Hashes verlassen das System. Das ist genau die Bauform, die wir brauchen. Datenbank mit über 138 Millionen geprüften Hashes. |
| **IWF-Mitgliedschaft mit Hash-Liste** | Internet Watch Foundation (UK, gemeinnützig) | Mitgliedschaftsantrag mit Prüfung | nicht öffentlich beziffert | **£5.000 bis über £100.000 im Jahr**, gestaffelt nach Branche und Unternehmensgröße | Lizenzierter Zugang zur Hash-Liste; Abgleich im eigenen System möglich | **Nein**, wenn die Liste lokal vorgehalten wird. Jedes Bild und Video der Liste wurde von Fachleuten gesichtet; die Hashes sind nicht rückrechenbar. |
| **NCMEC-Anbindung** | National Center for Missing & Exploited Children (USA) | Registrierung als Anbieter | — | kostenlos | CyberTipline-Meldung | Für uns **kein Erkennungsweg, sondern ein Meldeweg** — und einer, der für einen deutschen Anbieter nicht verpflichtend ist. Die US-Meldepflicht trifft US-Anbieter. |
| **EU-Zentrum (CSA-Verordnung)** | EU, geplant | existiert noch nicht | — | — | — | Perspektivisch der passendste Weg. **Aber:** Die Verordnung ist Entwurf, Verhandlungen sollen ab September 2026 laufen. Nicht planbar. |

**Meldeweg in Deutschland — davon getrennt zu betrachten:** Für die Weitergabe von Funden stehen die Beschwerdestellen von **FSM**, **eco** und **jugendschutz.net** bereit, die gemeinsam das deutsche Safer Internet Centre bilden. Bestätigte Missbrauchsdarstellungen werden von dort an das **BKA** und über das INHOPE-Netz an die zuständige Partner-Hotline weitergeleitet. Das ist der naheliegende Weg für einen deutschen Anbieter — und er ist kostenlos.

---

## 4 · Bewertung für unseren Fall

**Was unsere Lage besonders macht:** Wir sind ein sehr kleiner deutscher Anbieter mit einer scharfen Selbstverpflichtung zur EU-Verarbeitung, die vor dem Start noch kein Budget und keine Nutzer hat. Drei der sechs Wege scheiden damit praktisch aus oder verschieben sich.

**IWF ist inhaltlich der beste Weg und finanziell vorerst nicht darstellbar.** Die Hash-Liste ist von Menschen geprüft, lokal vorhaltbar und damit die sauberste Bauform. Aber die Gebühren beginnen bei £5.000 im Jahr — bei einem Kapitalbedarf von 130.000 € über 24 Monate (Planungswert vom Juli 2026; seit dem 21.09.2026 sind es 160.253 € für die Firma und 233.053 € mit Lebenshaltung) ist das ein spürbarer Posten für ein Produkt, das noch keine Nutzer hat. **Trotzdem anfragen:** Die Staffel richtet sich nach Branche und Größe, und die IWF wirbt ausdrücklich damit, Unternehmen jeder Größe aufnehmen zu wollen. Was ein Zweipersonenunternehmen ohne Umsatz zahlt, steht nirgends — das erfährt man nur, indem man fragt.

**Project Arachnid ist der realistische Einstieg.** Kostenlos, ausdrücklich offen für kleine Plattformen, dokumentierte SDKs. Der offene Punkt ist der Datenfluss: Wenn die API Medien entgegennimmt statt Hashes, ist zu klären, ob es einen reinen Hash-Modus gibt. Kanada verfügt über einen Angemessenheitsbeschluss der EU, die Übermittlung wäre also nicht per se unzulässig — aber unsere eigene Regel ist strenger als das Gesetz, und das war Absicht.

**Thorn Safer selbst gehostet ist die technisch passendste Bauform** und die einzige, bei der der Anbieter die gewünschte Architektur ausdrücklich beschreibt: hashen und klassifizieren in der eigenen Umgebung, nur Hashes gehen hinaus. Preis unbekannt. Für die Zeit nach dem Start die naheliegende Zielarchitektur.

**PhotoDNA ist der bekannteste Weg und für uns der unpassendste.** Kostenlos, etabliert — aber als Cloud-Dienst eines US-Anbieters im Widerspruch zu der Regel, die unsere gesamte Außendarstellung trägt. Aufnehmen als Vergleich, nicht als Plan.

**NCMEC und EU-Zentrum stehen nicht zur Wahl.** Das eine ist ein Meldeweg für US-Anbieter, das andere existiert nicht.

---

## 5 · Empfohlener Antragsweg

> **✎ Fortgeschrieben am 27.09.2026 (Nr. 98, Weg b):** Die drei Schritte gelten unverändert **in ihrer Reihenfolge**, aber **nicht mehr in Fenster V0**. Angestoßen wird, **wenn der Bau fertig ist** — zusammen mit Fachanwalt, Steuerberater, Prüfanbieter und Code-Prüfung. Die Reihenfolge innerhalb dieser Prüfphase steht in `../01-steuerung/beschluesse-2026-09-27.md`, Abschnitt 9.6: **erst der Fachanwalt, dann die Korrekturen, dann die Code-Prüfung, dann die Anbieter.**

~~Drei Schritte, in dieser Reihenfolge, alle in Fenster **V0** anzustoßen.~~ Drei Schritte, in dieser Reihenfolge, **nach dem Bau** anzustoßen.

**Schritt 1 — Project Arachnid, zuerst.** Kostenlos, niedrigste Hürde, sofort möglich. Der Antrag klärt nebenbei die Frage, wie ein solches Verfahren abläuft — Erfahrung, die alle weiteren Gespräche leichter macht. Anschreiben-Entwurf unten.

**Schritt 2 — IWF, mit einer klaren Frage.** Nicht „wir wollen Mitglied werden", sondern: *Was kostet eine Mitgliedschaft für ein Zweipersonenunternehmen vor dem Marktstart, und gibt es einen Weg für Vorgründungsprojekte?* Eine Absage ist ein verwertbares Ergebnis; eine Zahl ist ein besseres.

**Schritt 3 — Thorn Safer, nach dem Anwaltstermin.** Erst wenn geklärt ist, ob und in welchem Bereich wir überhaupt abgleichen dürfen, lohnt ein Angebotsgespräch über eine kostenpflichtige Lösung.

**Was ausdrücklich nicht passiert:** kein Vertrag, keine Zusage, keine Integration vor der Klärung durch den Fachanwalt. Der Antrag ist eine Vorbereitung, keine Verpflichtung.

---

## 6 · Anschreiben-Entwurf — Project Arachnid

> **ENTWURF — Versand ausschließlich durch die Gründer.** Vor dem Absenden: Namen, Kontaktdaten und den Absatz zum Zeitplan prüfen. Englisch, weil das Team in Kanada sitzt.

**Betreff:** Request for Arachnid Shield API access — small German platform in pre-launch preparation

> Dear Project Arachnid team,
>
> we are writing to ask about access to the Arachnid Shield API for a platform that is currently in preparation and not yet operating.
>
> **Who we are.** We are two founders based in Germany, Henry Luca Kurz and Nicolas Greulich. We are building a dating and social platform for gay, bisexual and queer men in German-speaking Europe. The company is scheduled to be incorporated in Germany in 2028; we are currently in the preparation phase and are not yet processing any user content.
>
> **Why we are contacting you now.** Our architecture is being designed before any code is written, and we want known-CSAM detection to be part of that architecture from the first line rather than added afterwards. We understand that access to hash matching involves a vetting process, and we would rather begin that conversation early than discover a two-year lead time when our image pipeline is finished.
>
> **What our platform will do.** Users will be able to upload profile images, which are reviewed before they become publicly visible, and to exchange images in one-to-one conversations after both sides have consented. All hosting will be in Germany. We do not use processors outside the European Union.
>
> **Our questions.**
> 1. Is the Arachnid Shield API available to a platform of our size, and is it available before launch or only once we are operating?
> 2. What are the eligibility requirements and what does the onboarding process involve? How long does it typically take?
> 3. **Data flow:** Is it possible to submit only perceptual hashes computed in our own infrastructure, rather than the media itself? If media must be submitted, where is it processed and how long is it retained? This matters to us because we have committed publicly to processing user content only within the European Union.
> 4. Are there technical requirements we should account for now, while the architecture is still on paper?
> 5. Is there anything else you would advise a small operator to prepare before applying?
>
> We are aware that your resources are directed at protecting children, not at supporting companies, and we do not want to take up more of your time than necessary. If there is a standard application route we should follow instead of writing to you directly, please point us to it.
>
> Thank you for your work.
>
> Henry Luca Kurz · Nicolas Greulich
> [E-Mail] · [Telefon]

---

## 7 · Anschreiben-Entwurf — Internet Watch Foundation

> **ENTWURF — Versand ausschließlich durch die Gründer.** Zu senden über das Mitgliedschafts-Anfrageformular der IWF; dieser Text passt in das Freitextfeld oder als beigefügte Nachricht.

**Betreff:** Membership enquiry — pre-launch two-person company, Germany

> Dear IWF membership team,
>
> we would like to ask whether membership is realistic for an organisation at our stage, and what it would cost.
>
> **Our situation.** We are two founders in Germany building a dating and social platform for gay, bisexual and queer men in German-speaking Europe. The company will be incorporated in 2028. We currently have no users, no revenue and no incorporated entity — we are designing the platform, including its safety architecture, before development begins.
>
> **Why we are asking now rather than later.** We want the Image Hash List to be part of our image pipeline from the start. Retrofitting detection into a platform that is already running is harder, slower and less complete than building it in. We would rather understand the requirements and the cost now, while both are still design decisions.
>
> **Our questions.**
> 1. Your published fee bands start at £5,000 per year. Is there a route for a pre-revenue company of two people, or would you advise us to return once we are operating?
> 2. Can the Image Hash List be held and matched within our own infrastructure, so that user images never leave our servers? We have committed to processing user content only within the European Union, and this point is decisive for us.
> 3. What does the application and vetting process involve, and how long does it usually take?
> 4. Is associate membership an option at our stage, and what does it include?
> 5. If membership is not realistic yet, is there anything you would recommend we do in the meantime?
>
> We are asking honestly rather than optimistically: if the answer is that we are too small today, that is useful to know, and we will come back when we are not.
>
> Thank you for your work.
>
> Henry Luca Kurz · Nicolas Greulich
> [E-Mail] · [Telefon]

---

## 8 · Was noch geklärt werden muss

| # | Punkt | Wer | Wann |
|---|---|---|---|
| 1 | **Dürfen wir überhaupt abgleichen — und wo?** Die ePrivacy-Ausnahme betraf interpersonelle Kommunikation. Nach ihrem Auslaufen im April 2026 und der noch nicht bestätigten Verlängerung vom Juli 2026 ist das eine offene Rechtsfrage. *(Nachtrag 15.09.2026: Die Verlängerung ist am 23.07.2026 bestätigt und gilt bis 03.04.2028 — also nicht mehr zum Start. Die Frage bleibt für die Zeit ab T0 offen.)* Öffentlicher Bereich und Chat sind getrennt zu bewerten. | **[M/Anwalt]** | Anwaltstermin, zusammen mit der JMStV-Frage |
| 2 | Datenfluss bei Project Arachnid: reiner Hash-Modus möglich? | **[M]** im Gespräch | nach Antwort |
| 3 | IWF-Gebühr für ein Unternehmen unserer Größe | **[M]** im Gespräch | nach Antwort |
| 4 | Preis und Vertragsbedingungen Thorn Safer, selbst gehostet | **[M]** | nach dem Anwaltstermin |
| 5 | Prozess bei einem Treffer: Wer sieht was, wer meldet, an wen, in welcher Frist, wie wird dokumentiert? **Das gehört geschrieben, bevor der erste Treffer kommt** — nicht danach. | **[KI]** Entwurf, **[M]** Freigabe | neue Aufgabe A-36 |
| 6 | Belastung der Moderierenden. Wer mit solchen Funden arbeitet, braucht Begleitung. Bei einem Zweierteam ist das keine Personalfrage, sondern eine Gesundheitsfrage. | **[M]** | vor dem Start |
| 7 | Verhältnis zur geplanten Ende-zu-Ende-Verschlüsselung ab 15.000 MAU: Die Verlängerung nimmt verschlüsselte Dienste aus. Die IWF verweist auf „upload prevention" — Prüfung vor der Verschlüsselung. | **[M/Anwalt]** | vor Phase 2 |

---

## 9 · Die nächste Handlung in einem Satz

**Henry oder Nicolas schicken den Anschreiben-Entwurf aus Abschnitt 6 über das Kontaktformular von Project Arachnid ab — kostenlos, unverbindlich, und es beantwortet in einer Antwort, wie lange dieser Weg wirklich dauert.**

---

## Quellen

Alle abgerufen am 27.07.2026.

- [IWF: Membership pricing](https://www.iwf.org.uk/membership/fees/) — Gebührenbänder £5.000 bis über £100.000 im Jahr, gestaffelt nach Branche und Unternehmensgröße
- [IWF: Image Hash List](https://www.iwf.org.uk/our-technology/our-services/image-hash-list/) — jedes Bild von Fachleuten gesichtet, Hashes nicht rückrechenbar
- [IWF: EU Failure on Child Safety — Why CSAM Detection Laws Must Be Restored](https://www.iwf.org.uk/policy-work/eu/eu-failure-on-child-safety-why-csam-detection-laws-must-be-restored/) — Auslaufen der Ausnahme am 03.04.2026, Rückgang der Meldungen um 58 % in 18 Wochen im vergleichbaren Zeitraum 2020, Hinweis auf generativ erzeugtes Material
- [Microsoft: PhotoDNA Cloud Service](https://www.microsoft.com/en-us/photodna/cloudservice) und [Terms of Use](https://www.microsoft.com/en-us/photodna/termsofuse) — Zugang nach Prüfung im alleinigen Ermessen, kostenlos für qualifizierte Kunden, Nachprüfung jederzeit
- [Safer by Thorn: Self-Hosted Deployment](https://safer.io/resources/safers-self-hosted-deployment-provides-control-security-and-scalability/) — Hashing und Klassifikation in der eigenen Umgebung, nur Hashes verlassen das System
- [Safer by Thorn: Solutions](https://safer.io/solutions/) — über 138 Millionen geprüfte Hashes
- [Project Arachnid](https://projectarachnid.ca/en/) und [Arachnid Shield SDK auf GitHub](https://github.com/CdnCentreForChildProtection/arachnid-shield-sdk-php) — kostenlose HTTP-API nach Registrierung, offizielle SDKs
- [ComputerBase: Chatkontrolle — EU-Parlament kann Übergangsregelung bis 2028 nicht stoppen](https://www.computerbase.de/news/netzpolitik/chatkontrolle-eu-parlament-kann-uebergangsregelung-bis-2028-nicht-stoppen.98317/) — Abstimmung vom 09.07.2026, Dringlichkeitsverfahren Regel 163, 314–315 Gegenstimmen bei 361 erforderlichen, Rat hat drei Monate
- [Brussels Signal: European Parliament approves „mini-chat control"](https://brusselssignal.eu/2026/07/european-parliament-approves-mini-chat-control/) — Verlängerung bis April 2028, Ausnahme für verschlüsselte Dienste, CSA-Verhandlungen ab September 2026
- [FSM-Beschwerdestelle](https://www.fsm.de/wissen/a-bis-z/fsm-beschwerdestelle/) und [Pressemitteilung 2026 zur Jahresbilanz](https://www.presseportal.de/pm/66501/6261183) — Weiterleitung an BKA und über INHOPE, 28.598 Meldungen im Jahr 2025
- [jugendschutz.net: Missbrauchsdarstellungen sicher melden](https://www.jugendschutz.net/service/presse/artikel/missbrauchsdarstellungen-von-kindern-im-netz-sicher-melden-am-18-november-ist-der-europaeische-aktionstag-gegen-sexuelle-ausbeutung-von-kindern) — deutsches Safer Internet Centre aus FSM, eco und jugendschutz.net
- Projektintern: `jmstv-problem-und-einschaetzung.md`, `../70-entwicklung-ab-monat-4/code-planer.md` (AP-4)

**Nicht belastbar recherchierbar und deshalb offen geführt:** typische Bearbeitungsdauer aller Zulassungsverfahren (keiner der Träger veröffentlicht sie), Preise von Thorn Safer, die konkrete IWF-Gebühr für ein Unternehmen unserer Größe, und der genaue Datenfluss bei Project Arachnid. Alle vier stehen als Fragen in den Anschreiben.
