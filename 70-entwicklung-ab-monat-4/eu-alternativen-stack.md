# EU-Alternativen im Technikstack

> ## ⚠ Recherche, keine Vertragsprüfung
>
> **Stand 20.09.2026 · Aufgabe A-53 · Grundlage für Nr. 58 und Grundsatz G-01**
> Angaben aus öffentlichen Quellen mit Abrufdatum. **Was auf einer Anbieterseite steht, ist keine vertragliche Zusage.** Vor dem Einsatz gilt in jedem Fall: Auftragsverarbeitungsvertrag lesen, Unterauftragnehmerliste prüfen, Hostingort schriftlich bestätigen lassen.

---

## Auf einen Blick

| Baustein | Bisher im Stack | Befund |
|---|---|---|
| **Fehlerprotokolle** | Sentry (USA, mit wählbarer EU-Region) | **Vollständig ersetzbar.** Mehrere EU-Anbieter, einer davon quelloffen und selbst betreibbar, vollständig kompatibel mit Sentry-Clients |
| **Abo-Verwaltung** | RevenueCat (USA) | **In Phase 1 gar nicht nötig.** Das MVP hat keine Bezahlfunktion, und die Web-Fassung rechnet später direkt ab; RevenueCat existiert, um Store-Belege zu vereinheitlichen. Das Problem beginnt erst mit den nativen Apps |
| **Zahlung im Web** | bisher nicht benannt | **Neue Lücke, aber erst ab Phase 2** — im MVP gibt es keine Bezahlfunktion. EU-Optionen sind vorhanden; der Engpass ist die Inhaltsfrage, nicht die Technik. Das **Datenmodell** ist schon in Phase 1 betroffen (Nr. 60, Nr. 48) |

**Das Ergebnis vorweg:** Grundsatz G-01 lässt sich in diesem Punkt **ohne Ausnahme** einhalten. Es muss keine Kröte geschluckt werden.

---

## 1 · Ersatz für Sentry

Sentry sammelt Fehlerberichte aus der laufenden App. Handbuch A schließt US-Auftragsverarbeiter „nicht verhandelbar" aus — **ausdrücklich auch für Fehlerprotokolle** — und empfiehlt im selben Atemzug Sentry. Das war der Widerspruch hinter Nr. 58.

### Die Kandidaten

| | Sitz | Hosting | Quelloffen | Anmerkung |
|---|---|---|---|---|
| **Bugsink** | Niederlande | EU, auch selbst betreibbar | **ja** | „Daten bleiben vollständig unter Ihrer Kontrolle, keine externen Dienste erforderlich"; kostenloser Plan vorhanden |
| **GlitchTip** | USA (Unternehmen) | **selbst betrieben** | **ja** | „Vollständig kompatibel mit Sentry-Clients". Beim Selbstbetrieb ist der US-Sitz des Projekts belanglos — es verlässt kein Datum den eigenen Server |
| **AppSignal** | Niederlande | EU | nein | Unterstützt Ruby, Node, JavaScript, Elixir |
| **Bugfender** | Deutschland | EU | nein | Arbeitet vor allem als Protokollspeicher für Mobil- und Web-Apps |
| **Flare** | Belgien | nicht angegeben | nein | Für Laravel, also PHP — passt nicht zum Stack |

**Quelle:** [European Alternatives · Alternativen zu Sentry](https://european-alternatives.eu/alternative-to/sentry), abgerufen 20.09.2026. Ergänzend: [Bugsink · Sentry-Alternative in der EU](https://www.bugsink.com/sentry-eu-alternative/), abgerufen 20.09.2026.

### Empfehlung

**GlitchTip oder Bugsink, selbst betrieben — mit Vorrang für den Selbstbetrieb.**

Die Begründung ist bei diesem Baustein besonders eindeutig: Fehlerprotokolle sind die unscheinbarste und zugleich verräterischste Datenquelle einer App. Ein Absturzbericht enthält je nach Bauweise die Kennung des Kontos, den aufgerufenen Bildschirm und im schlimmsten Fall Teile der Anfrage — also möglicherweise einen Standort. **Bei einer App für schwule Männer ist ein Fehlerprotokoll potenziell ein Art-9-Datum.** Es an irgendeinen Dritten zu geben, ist die vermeidbarste aller Übertragungen.

Beide sind mit Sentry-Clients kompatibel. Das heißt praktisch: Der Code, den man ohnehin schreibt, bleibt gleich — es ändert sich nur, wohin er sendet. **Die Entscheidung ist später ohne Umbau revidierbar**, was sie zu einer der ungefährlichsten Festlegungen des ganzen Stacks macht.

**Zusätzliche Regel, unabhängig vom Anbieter:** Fehlerberichte werden vor dem Versand bereinigt — keine Koordinaten, keine Nachrichteninhalte, keine Kontokennungen im Klartext. Das gehört in AP-0 und als Prüfpunkt in die Abnahmeliste. Ein selbst betriebener Dienst ersetzt diese Regel nicht, er macht ihren Bruch nur weniger folgenreich.

---

## 2 · Ersatz für RevenueCat — und warum er in Phase 1 gar nicht gebraucht wird

RevenueCat vereinheitlicht Abos über App Store, Play Store und Web. Es löst ein Problem, das erst entsteht, **wenn es mehr als einen Verkaufsweg gibt.**

**Phase 1 ist ausschließlich eine Web-App** — und nach `code-planer.md` zunächst sogar ohne Bezahlfunktion. Sobald verkauft wird, geschieht das über genau einen Weg: direkt. Damit gibt es nichts zu vereinheitlichen.

> **Befund:** Die Entscheidung über RevenueCat muss nicht vor dem Bau der Web-App fallen, sondern vor dem Bau der nativen Apps. Das ist mindestens ein Jahr später. **Nr. 58 ist in diesem Punkt weniger dringend als angenommen.**

### Wenn die nativen Apps kommen — drei Wege

| | | Einordnung |
|---|---|---|
| **A** | **Selbst bauen.** Die Store-Belege beider Anbieter direkt gegen deren Server prüfen (App Store Server API, Google Play Developer API) | Das ist kein kleines Stück Arbeit, aber ein gut dokumentiertes. Kein Dritter, kein Umsatzanteil, volle Kontrolle. **Passt zum Baumodell A**, in dem ohnehin alles selbst gebaut wird |
| **B** | **rovenue** — quelloffene, selbst betreibbare Alternative unter AGPL-3.0, mit App Store Server API v2, Google Play Developer API und Stripe-Webhooks, dazu ein Web-SDK | Technisch genau das Gesuchte. **Aber:** Das Projekt ist praktisch unbekannt (null Sterne auf GitHub bei über 3.400 Commits). Ein Baustein, der Zahlungen trägt und den sonst niemand benutzt, ist ein Risiko eigener Art |
| **C** | **RevenueCat behalten** und als dokumentierte Ausnahme nach G-01 führen | Zulässig nach dem Wortlaut des Grundsatzes — aber nur, wenn A und B nachweislich nicht gehen. Nach diesem Befund gehen sie |

**Quelle zu rovenue:** [GitHub · broverse/rovenue](https://github.com/broverse/rovenue), abgerufen 20.09.2026.

### Empfehlung

**A, mit B als Vorlage.** Die Belegprüfung selbst zu bauen ist der Weg, der am besten zum beschlossenen Baumodell passt — und der einzige, bei dem keine Zahlungsdaten und keine Abo-Historie einen Dritten passieren. rovenue lässt sich dabei als quelloffenes Vorbild lesen, ohne es in Betrieb zu nehmen.

**Was das kostet:** ein eigenes Arbeitspaket in Phase 2, geschätzt in der Größenordnung einer Sitzung. Das steht in A-51 und wird dort beziffert.

---

## 3 · Die neue Lücke: Zahlung im Web

Sobald die Web-App abrechnet, braucht sie einen Zahlungsdienstleister. **In keinem Dokument des Projekts steht, welcher.**

**Zur Zeitachse, genau:** `code-planer.md` hält fest, dass es **im MVP gar keine Bezahlfunktion gibt** — die Frage wird also nicht in Phase 1 akut, sondern in Phase 2. Zwei Dinge daran berühren trotzdem schon Phase 1: die **Einlösecodes und dauerhaften Berechtigungen** aus dem Crowdfunding (**Nr. 60**) gehören ins Datenmodell, und die Zonenregel aus **Nr. 48** macht Inkognito zu einer Berechtigung, die verwaltet werden muss. Der Anbieter kann warten; das Datenmodell nicht.

### EU-Optionen

| | Sitz | Abos | Gebühren | Für uns |
|---|---|---|---|---|
| **Mollie** | Amsterdam, lizenziert bei der niederländischen Zentralbank | ja, gespeicherte Karten und Abonnements | **1,80 % + 0,25 €** für EWR-Karten, keine Monatsgebühr, kein Aufsetzentgelt, keine Vertragsbindung | **Der naheliegende Kandidat** — Anmeldung ohne Vertriebsgespräch, Preise öffentlich |
| **Adyen** | Amsterdam, börsennotiert, Vollbanklizenz | ja | Interchange++ | Nicht für kleine Anbieter — Anmeldung nur über den Vertrieb |
| **Klarna** | Stockholm, Vollbanklizenz | nur als Ergänzung | über Partner | Kein vollwertiger Kartenakzeptant |

**Quelle:** [StackPatrol · Europäische Alternativen zu Stripe: Mollie, Adyen und Klarna im Vergleich](https://stackpatrol.eu/guides/european-alternatives-stripe), abgerufen 20.09.2026.

### Der Engpass ist nicht die Technik, sondern die Inhaltsregel

Handbuch B führt die **Zahlungsdienstleister-Sperre** als eigenes Risiko mit mittlerer Wahrscheinlichkeit und hoher Auswirkung und empfiehlt: *„Inhaltsrichtlinie eng fassen, Klassifizierung vorab schriftlich klären, zweiten Zahlungsweg als Reserve einrichten."* Diese Empfehlung gilt unverändert — und sie gilt für **jeden** Anbieter, auch für einen europäischen.

**Was zu tun ist:** Vor der Auswahl eine schriftliche Anfrage an zwei Anbieter, in der das Produkt ehrlich beschrieben wird, mit der Bitte um schriftliche Einordnung. Eine mündliche Zusage ist wertlos, wenn das Konto später gesperrt wird. **Das ist eine neue Aufgabe für die Gründer, kein KI-Schritt** — sie braucht eine Firmenidentität, die es noch nicht gibt, und gehört damit in V4.

**Was in die Rechnung gehört:** 1,80 % + 0,25 € je Zahlung. Bei einem Monatsabo von 9 € sind das rund **0,41 €** oder **4,6 %** — bei einem Jahresabo von 70 € nur **1,51 €** oder **2,2 %**. Die Store-Gebühr, mit der das Finanzmodell rechnet, liegt deutlich darüber. **Die Web-Abrechnung ist also nicht nur zulassungsfrei, sie ist auch billiger.** Das gehört in A-52.

---

## 4 · Was daraus für G-01 folgt

| Baustein | Ausnahme nötig? |
|---|---|
| Fehlerprotokolle | **nein** — selbst betrieben |
| Abo-Verwaltung | **nein** — in Phase 1 nicht nötig, danach selbst gebaut |
| Zahlung im Web | **nein** — EU-Anbieter vorhanden |
| Anmeldung mit Apple (K10) | **offen** — Rechtsfrage, nicht Anbieterfrage |
| Verifizierungsanbieter (Nr. 7) | **offen**, aber mit d-you ab 2027 eine staatliche EU-Lösung in Sicht (siehe `../10-recht-gruendung/altersverifikation-stand-2026.md`) |
| Maildienst (Nr. 63) | **in Klärung** — A-58 erledigt am 20.09.2026: listmonk im Selbstbetrieb plus europäischer Versandweg; die Anbieterantworten stehen aus |

**Die Ausnahmeliste in `../00-grundlagen/grundsatzbeschluesse.md` bleibt damit vorerst leer.** Das ist ein besseres Ergebnis, als die Formulierung des Grundsatzes erwarten ließ.

---

## 5 · Was zu tun ist

| | Was | Wer | Wann |
|---|---|---|---|
| 1 | **Sentry aus dem empfohlenen Stack nehmen**, GlitchTip oder Bugsink selbst betrieben eintragen | KI, in A-51 | mit dem Bauplan |
| 2 | **Bereinigungsregel für Fehlerberichte** als Prüfpunkt in AP-0 und in die Abnahmeliste | KI, in A-51 | mit dem Bauplan |
| 3 | **RevenueCat aus Phase 1 streichen**, Entscheidung auf Phase 2 vertagen | KI, in A-51 | mit dem Bauplan |
| 4 | **Zahlungsdienstleister als eigene Zeile** ins Finanzmodell, mit 1,80 % + 0,25 € | KI, **erledigt 21.09.2026 (A-52)** — Blatt „Annahmen“, Abschnitt 2a: eigene Zeilen für den prozentualen und den festen Teil, Web-Anteil 60 % | — |
| 5 | **Schriftliche Anfrage an zwei Zahlungsdienstleister** mit ehrlicher Produktbeschreibung | Gründer | V4, spätestens vor Phase 2 |
| 6 | **Neue Entscheidung:** welcher Zahlungsweg, und welcher als Reserve | Gründer | vor dem ersten Web-Abo |

---

## 6 · Was dieser Bericht nicht ist

- **Keine Vertragsprüfung.** Jede Angabe stammt von Anbieter- oder Vergleichsseiten und ist vor dem Einsatz schriftlich zu bestätigen.
- **Keine Empfehlung für rovenue im Betrieb.** Es dient als Vorlage, nicht als Baustein.
- **Keine Preiszusage.** Gebührensätze ändern sich; die genannten sind der Stand vom 20.09.2026.

---

## Quellen

| Quelle | Inhalt | Abgerufen |
|---|---|---|
| [European Alternatives · Alternativen zu Sentry](https://european-alternatives.eu/alternative-to/sentry) | Bugsink, AppSignal, Bugfender, Flare, GlitchTip mit Sitz und Hosting | 20.09.2026 |
| [Bugsink · Sentry-Alternative in der EU](https://www.bugsink.com/sentry-eu-alternative/) | Selbstbetrieb, Datenkontrolle | 20.09.2026 |
| [GitHub · broverse/rovenue](https://github.com/broverse/rovenue) | AGPL-3.0, Selbstbetrieb, App Store Server API v2, Google Play Developer API, Stripe, Web-SDK | 20.09.2026 |
| [StackPatrol · Europäische Alternativen zu Stripe](https://stackpatrol.eu/guides/european-alternatives-stripe) | Mollie 1,80 % + 0,25 €, Adyen, Klarna — Sitz, Lizenz, Abo-Eignung | 20.09.2026 |
