# Bauplan für zwei Plattformen — Web und nativ

> ## ⚠ Bauplan, keine Zusage
>
> **Stand 20.09.2026 · Aufgabe A-51 · Beschlüsse Nr. 47, Nr. 73, Nr. 76 vom 19.09.2026**
> `code-planer.md` gilt weiter für alles, was er beschreibt. Dieses Dokument ergänzt ihn um den zweiten Strang und um die acht Lücken aus A-46. Aufwandsangaben sind **Schätzungen aus Funktionsumfang und Architektur**, keine gemessenen Werte.

---

## Auf einen Blick

| | |
|---|---|
| **Die Bauform** | **Capacitor** — die bestehende Web-App bekommt eine native Hülle, nicht zwei neue Codebasen. React Native hieße, die gesamte Oberfläche neu zu schreiben |
| **Mehraufwand** | **rund vier zusätzliche Sitzungen** auf vierzehn, also **+29 Prozent** — nicht +100, wie „beide Plattformen" zunächst klingt |
| **Reihenfolge** | **Web zuerst, vollständig.** Nicht aus Kostengründen: Ein Store-Antrag mit laufendem, moderiertem Produkt im Rücken ist ein anderer Antrag |
| **Die unangenehme Korrektur** | Zwei der drei Schutzfunktionen sind auch nativ **schwächer als geplant.** F58 kann auf iOS keine App auslösen, und F59 zeigt dort beim Wechsel einen Systemhinweis |
| **Der Fund am Rechner** | Am Rechner geht **mehr** als gedacht: F59 ist dort sogar leichter als nativ — Titel und Symbol des Browsertabs lassen sich frei setzen |
| **Was aus A-53 folgt** | Sentry raus, RevenueCat aus Phase 1 raus, dazu vier neue Store-Arbeiten |

---

## 1 · Die Bauform — warum Capacitor

Drei Wege standen zur Wahl:

| | Was es heißt | Urteil |
|---|---|---|
| **Zwei native Codebasen** (Swift, Kotlin) | Die gesamte Oberfläche zweimal neu, dazu die Web-Fassung. Drei Codebasen für dasselbe Produkt | **Ausgeschlossen.** Bei 75 Funktionen und 620 Akzeptanzkriterien wäre das dreimal derselbe Test |
| **React Native** | Eine gemeinsame native Oberfläche, die Web-Fassung bleibt getrennt. Zwei Codebasen | **Abgelehnt.** Die Oberfläche müsste komplett neu geschrieben werden; die Textspezifikation mit 39 Bildschirmen und 226 Ankern gälte dann zweimal |
| **Capacitor** | Die bestehende Web-App läuft in einer nativen Hülle; nur die Stellen, die wirklich native Fähigkeiten brauchen, werden nativ geschrieben | **Empfohlen** |

Capacitor legt eine native Schale um die Web-App und stellt eine Brücke zu nativen Schnittstellen bereit; veröffentlicht wird in beiden Stores wie jede andere App, mit demselben Prüfverfahren. Der bezahlte Preis ist ehrlich zu nennen: **zwei zusätzliche Bauketten**, Plugin-Pflege und die Versionsdrift zwischen Web und Hülle.

**Warum das hier besonders gut passt:** Der Stack ist bereits React + Vite + TypeScript, und die Architekturregel des Projekts — der Client bekommt nie rohe Koordinaten, nie Original-Bildpfade — liegt vollständig serverseitig. Die native Hülle ändert daran nichts. Sie fügt genau das hinzu, was der Browser nicht kann.

**Quellen:** [Our Code World · PWA vs Capacitor vs Native 2026](https://ourcodeworld.com/articles/read/3646/pwa-vs-capacitor-vs-native-2026) · [Capacitor vs React Native — Entscheidungshilfe 2026](https://www.bacancytechnology.com/blog/capacitor-vs-react-native), abgerufen 20.09.2026.

---

## 2 · Was geteilt wird und was doppelt gebaut wird

| | Geteilt | Doppelt |
|---|---|---|
| **Datenmodell, Zugriffsregeln, Edge Functions** | **vollständig** | — |
| **Oberfläche, Texte, Abläufe** | **vollständig** | — |
| **Akzeptanzkriterien** | **vollständig** — dieselben 620 gelten für beide | — |
| **Push-Mitteilungen** | Serverseite | Zustellung: Web Push · APNs · FCM |
| **F58 Schnellverstecken** | Die harmlose Ansicht und die Rückkehr | Der Auslöser: Geste · Gerätegeste · Tastenkürzel |
| **F59 Tarnen** | Die Auswahl im Sicherheitszentrum | Der Wechsel: Manifest · iOS-Alternativsymbole · Android-Alias · Tab-Titel |
| **F63 Bildschirmfoto** | Der Hinweistext | Android: Sperre · iOS: nur Erkennung · Web: nichts |
| **Bauketten und Auslieferung** | — | **drei**: Web, App Store, Play Store |
| **Store-Unterlagen** | — | **zwei** Sätze Metadaten, Bildschirmfotos, Altersfreigaben |

**Der entscheidende Satz:** Alles, was in den 620 Akzeptanzkriterien steht, wird **einmal** gebaut und **einmal** getestet. Doppelt sind nur die vier Zeilen oben — und die Store-Arbeit, die kein Code ist.

---

## 3 · Die drei Schutzfunktionen, ehrlich je Plattform

`code-planer.md`, Abschnitt 5, nennt diese Funktionen als „nativ voll, PWA eingeschränkt". **Das stimmt nicht ganz**, und die Korrektur gehört in den Plan, bevor jemand darauf baut.

### F58 · Schnellverstecken

| | |
|---|---|
| **Android** | Eine Geste in der App ist frei belegbar. **Die Systemgeste „Doppeltipp auf die Rückseite" ist herstellerabhängig** und nicht überall vorhanden |
| **iOS** | **Korrektur:** „Back Tap" ist eine Bedienungshilfe, die **der Nutzer selbst** in den Einstellungen einrichtet und die höchstens einen Kurzbefehl auslöst. **Eine App kann sich dafür nicht registrieren.** Was geht: eine Geste in der App, und eine Anleitung, wie man Back Tap selbst auf einen Kurzbefehl legt |
| **Web mobil** | Geste in der App — dasselbe wie nativ |
| **Rechner** | **Tastenkürzel**, zum Beispiel zweimal Escape. Am Rechner ist das die zuverlässigste Fassung von allen |

**Folge für den Plan:** Der Gewinn durch „nativ" ist bei F58 **klein**. Die Funktion lebt von der Geste in der App, und die geht überall.

### F59 · Symbol und Name tarnen

| | |
|---|---|
| **Android** | Über einen Aktivitäts-Alias lassen sich Symbol und Name wechseln. Funktioniert, kann aber je nach Startbildschirm kurz flackern |
| **iOS** | Alternativsymbole müssen **vorab im Programmpaket hinterlegt** sein (`CFBundleAlternateIcons`), und beim Wechsel **zeigt das System einen Hinweis an.** Die Tarnung ist also nicht unbemerkt — genau das, was sie sein sollte. **Vor dem Bau auf einem echten Gerät zu prüfen**, weil sich dieses Verhalten über Versionen geändert hat |
| **Web mobil** | Nur beim Hinzufügen zum Startbildschirm; danach fest |
| **Rechner** | **Besser als nativ.** Titel und Symbol des Browsertabs lassen sich jederzeit frei setzen — ein „diskreter Modus" ist am Rechner eine Zeile Code |

**Folge für den Plan:** F59 ist auf **iOS die schwächste Fassung**, nicht die stärkste. Das muss in den Systemtexten stehen, sonst verspricht die App etwas, das das Betriebssystem zurücknimmt.

### F63 · Bildschirmfoto

| | |
|---|---|
| **Android** | `FLAG_SECURE` verhindert Bildschirmfotos und Aufnahmen zuverlässig. **Das ist der einzige echte Zugewinn der nativen Fassung** |
| **iOS** | Bildschirmfotos lassen sich **nicht verhindern.** Die App kann sie nur **danach** bemerken und das Gegenüber informieren |
| **Web** | weder verhindern noch erkennen — nur der Hinweistext |

**Folge für den Plan:** F63 ist der **einzige** Grund für native Apps, der sich nicht anders lösen lässt — und er gilt nur für Android.

### Was daraus für Nr. 76 folgt

Der Beschluss lautet: beide bauen, Erscheinungszeitpunkt offen. **Diese Analyse schärft ihn:** Der Schutzgewinn der nativen Apps ist **kleiner als gedacht** — im Wesentlichen `FLAG_SECURE` auf Android. Die stärkeren Gründe für native Apps sind andere: Sichtbarkeit im Store, Push ohne den Umweg über „Zum Startbildschirm hinzufügen" auf iOS, und Vertrauen bei Menschen, die eine Web-App nicht für eine echte App halten.

**Das ist kein Argument gegen den Beschluss. Es ist ein Argument für die Reihenfolge.**

---

## 4 · Was am Rechner geht — die Antwort auf „sobald es irgendwie geht"

| Funktion | Am Rechner |
|---|---|
| **F58 Schnellverstecken** | **ja, am besten von allen** — Tastenkürzel, sofort, ohne Geste |
| **F59 Tarnen** | **ja, besser als nativ** — Tab-Titel und Symbol frei setzbar |
| **F63 Bildschirmfoto** | **nein** — in keinem Browser, auf keinem Betriebssystem |
| **Push** | ja, über den Browser |
| **Standort** | ja, aber ungenauer — am Rechner oft nur auf Stadtebene. **Das ist für dieses Produkt eher gut als schlecht** |

**Zwei Dinge, die es nur am Rechner gibt und die in keinem Dokument stehen:**

1. **Der Verlauf.** Ein besuchter Link steht im Browserverlauf, und der gehört oft nicht nur einer Person. Das Sicherheitszentrum braucht am Rechner einen Hinweis auf das private Fenster — und die Anmeldung sollte anbieten, sich **nicht** zu merken.
2. **Der geteilte Rechner.** Ein Familienrechner ist der Normalfall, kein Randfall. Eine kurze Abmeldefrist bei Untätigkeit ist am Rechner wichtiger als auf dem Telefon.

**Neue Arbeit:** beides gehört in AP-11 (Sicherheitszentrum) und in die Textspezifikation.

---

## 5 · Reihenfolge

**Web vollständig fertig, dann nativ.** Nicht parallel.

| Warum | |
|---|---|
| **Der Store-Antrag** | Beide Stores verlangen für nutzergenerierte Inhalte ein laufendes Moderationssystem. Ein Antrag mit einem Produkt, das seit Monaten läuft und moderiert wird, ist belastbar — eine Beteuerung nicht |
| **Das Modell A** | Nach Nr. 73 wird am Ende geprüft. Zwei parallele Stränge heißen zwei unfertige Stränge bis zum Schluss — genau das, was Modell A ohnehin riskant macht |
| **Die Rückfalllinie** | Wird eine App abgelehnt, erscheint das Produkt trotzdem. Das gilt nur, wenn die Web-Fassung fertig ist |
| **Die Store-Gebühr** | Rund 0,70 € je Zahler und Monat entfallen, solange nur über das Web verkauft wird |

---

## 6 · Der Mehraufwand, nachgerechnet

| Sitzung | Inhalt | Prüfaufwand |
|---|---|---|
| **S14** | Capacitor-Hülle, beide Bauketten, native Push-Zustellung (APNs, FCM) | mittel |
| **S15** | F58, F59, F63 je Betriebssystem, mit Gerätetests | **hoch** — Verhalten je Version |
| **S16** | Store-Unterlagen: eigene Bildschirmfotos mit erfundenen Profilen (Richtlinie 2.3.8), Altersfreigabe-Fragebogen, Datenschutzangaben, Store-Texte | gering, aber zeitraubend |
| **S17** | *(Phase 2)* Belegprüfung selbst gebaut — App Store Server API, Google Play Developer API | **hoch** |

| | |
|---|---|
| Sitzungen bisher (S0 bis S13) | **14** |
| Neu für die native Fassung | **4** |
| **Mehraufwand** | **+29 Prozent** |
| Gerätepool | bereits budgetiert (1.500 €) — für zwei Plattformen **zu knapp**: es braucht mindestens je ein älteres und ein neueres Gerät pro System |

**Was der Mehraufwand *nicht* enthält:** die Prüfung nach Modell A. Sie wächst mit, weil zwei Bauketten und drei native Funktionen dazukommen — **geschätzt 10 bis 20 Prozent über der Spanne von 10.800 bis 21.600 €.** Diese Zahl geht in A-52.

---

## 7 · Die acht Lücken aus A-46 als Arbeitspakete

| | Lücke | Wird zu | Wann |
|---|---|---|---|
| **L1** | Keine Trennung von Entwicklung, Test und Produktion | **AP-0b** · eigene Umgebung mit eigener Datenbank, **nie echte Daten im Test** | vor S1 |
| **L2** | Datensicherung ohne erprobte Wiederherstellung | AP-0 · täglich, dazu ein **Wiederherstellungstest** als Abnahmekriterium in AP-15 | AP-0, Test in AP-15 |
| **L3** | Geheimnisverwaltung ungeklärt | AP-0 · Schlüssel und Zugangsdaten außerhalb des Quelltextverzeichnisses, Regel im Kickoff-Auftrag, **Prüfschritt in jeder Sitzung** | vor S0 |
| **L4** | Überwachung ohne festgelegte Schwellen | AP-0 und AP-4 · was überwacht wird (Moderationsfristen aus A-37, **neu die vier Fristen aus F75**), ab wann gewarnt wird, wer geweckt wird | AP-0 |
| **L5** | Keine Lastannahmen | AP-7 und AP-15 · Leistungsbudgets je Bildschirm, abgeleitet aus dem Finanzmodell: 3.500 aktive Nutzer, Spitze Samstagabend, 64 Bilder am Tag | AP-7 |
| **L6** | Kein Rücknahmeplan für Auslieferungen | AP-1 · Regel: jede Migration additiv, Rücknahmeplan je Migration schriftlich | AP-1 |
| **L7** | Kein Bauplan für Phase 2 und 3 | Eigener Abschnitt im Code-Planer · 18 Funktionen, darunter **Veranstalterportal (F39) und eigenes Treffen (F36)** — genau das, was der Veranstaltungsstrang braucht | nach der Beta |
| **L8** | Kein Abnahmeprotokoll je Sitzung | **Abschnitt 8** dieses Dokuments | ab S0 |

---

## 8 · Abnahmeprotokoll je Sitzung

Nach Modell A prüft am Ende ein Mensch. **Bis dahin ist dies die einzige Abnahme, die es gibt** — und sie wird nach jeder Sitzung ausgefüllt, nicht am Ende.

| | Prüfpunkt | Wie geprüft |
|---|---|---|
| 1 | **Läuft die Sitzung auf dem Abnahmekriterium, nicht auf dem Gefühl?** | Jede in der Sitzung berührte Funktion hat ihre AK-Nummern; jede ist abgehakt oder begründet offen |
| 2 | **Kein Geheimnis im Quelltext** | Suchlauf nach Schlüsselmustern, in jeder Sitzung |
| 3 | **Keine genaue Koordinate irgendwo außerhalb der Edge Functions** | Suchlauf über Antworten, Protokolle, Fehlerberichte |
| 4 | **Keine Kontokennung im Klartext in einem Fehlerbericht** | Prüfung gegen die Bereinigungsregel aus `eu-alternativen-stack.md` |
| 5 | **Jede Migration additiv, mit Rücknahmeplan** | Migrationsverzeichnis durchgesehen |
| 6 | **Keine neue Abhängigkeit gegen G-01** | Abgleich mit `../00-grundlagen/grundsatzbeschluesse.md` |
| 7 | **Was ist unklar geblieben?** | Eine Liste, wörtlich, ohne Beschönigung — sie ist der Prüfauftrag der Sitzung danach |

**Die zwei Sitzungen mit eigenem Prüflauf:** Nach **S3** (Datenmodell, Standort, Bilder) und nach **S11** (Zugriffsrechte, Melden) läuft zusätzlich ein vollständiger Prüflauf gegen alle sieben Punkte plus die Zugriffsregeln Zeile für Zeile. Das ersetzt keinen externen Menschen — es ist die Absicherung, die Modell A sich selbst geben kann.

---

## 9 · Was sich aus A-53 am Stack ändert

| Baustein | Bisher | Neu |
|---|---|---|
| **Fehlerprotokolle** | Sentry (EU-Region) | **GlitchTip oder Bugsink, selbst betrieben.** Dazu die Bereinigungsregel: keine Koordinaten, keine Nachrichteninhalte, keine Kontokennungen im Klartext |
| **Abo-Verwaltung** | RevenueCat (Phase 2) | **selbst gebaut** (S17). rovenue dient als quelloffenes Vorbild, nicht als Baustein |
| **Zahlung** | nirgends benannt | **Neue Lücke.** Der Code-Planer sagt richtig: im MVP gibt es keine Bezahlfunktion. Ab Phase 2 braucht es einen Anbieter — EU-Kandidat Mollie, 1,80 % + 0,25 € |
| **Store-Bildschirmfotos** | nicht vorgesehen | **eigene Bildschirmfotos mit erfundenen Profilen** (Richtlinie 2.3.8) — S16 |
| **Nacktheit in Profilbildern** | nicht unterschieden | In den nativen Apps unkenntlich und dort nicht freischaltbar (Nr. 71). Die Ein-Tipp-Freischaltung des Gesichts (F12) zeigt dort nur Fotos ohne Nacktheit; soll sie je mehr zeigen, braucht es **zwei Handlungen** nach Googles Regel. *Berichtigt am 22.09.2026, bestätigt durch Nr. 92 am 26.09.2026:* F12 schaltet das Gesicht frei, nicht explizite Bilder — Explizites bleibt Zone 2 (⚠ W-30, Nr. 92) |

---

## 10 · Offene Punkte

| | Punkt |
|---|---|
| 1 | **Gerätepool.** 1.500 € reichen für zwei Plattformen nicht. **Erledigt 21.09.2026 (A-52):** 1.200 € für je ein neueres Gerät pro System zusätzlich (ANNAHME), Prüfkosten für zwei Plattformen mit 18.900 € (Mitte der Spanne) im Finanzmodell |
| 2 | **Apple-Entwicklerkonto** — jährliche Gebühr, und es braucht eine Firmenidentität. Vor S14, also nach der Gründung |
| 3 | **iOS-Symbolwechsel** auf echtem Gerät prüfen, bevor F59 in den Systemtexten etwas verspricht |
| 4 | **Der Widerspruch zu FV-87** (Prüfstatus am Konto statt am Gerät) berührt auch die native Fassung — siehe `../10-recht-gruendung/altersverifikation-stand-2026.md`, Abschnitt 4 |
| 5 | ~~**Nr. 80** (CSD-Auftritt) und **Nr. 78** (Werbung) blockieren A-52, nicht diesen Plan~~ — beide am 21.09.2026 entschieden, A-52 erledigt |

---

## 11 · Was dieses Dokument nicht ist

- **Kein Ersatz für `code-planer.md`.** Architektur, Arbeitspakete AP-0 bis AP-15 und der Sitzungsplan S0 bis S13 gelten unverändert.
- **Keine gemessenen Aufwände.** Die vier zusätzlichen Sitzungen sind eine Schätzung aus Funktionsumfang und Architektur.
- **Keine Zusage, dass die Apps zugelassen werden.** Siehe `../50-produkt-prototyp/store-richtlinien-pruefung.md`.

---

## Quellen

| Quelle | Inhalt | Abgerufen |
|---|---|---|
| [Our Code World · PWA vs Capacitor vs Native 2026](https://ourcodeworld.com/articles/read/3646/pwa-vs-capacitor-vs-native-2026) | Capacitor als native Hülle um die Web-App, Store-Verteilung, Kosten der Bauketten | 20.09.2026 |
| [Capacitor vs React Native — Entscheidungshilfe 2026](https://www.bacancytechnology.com/blog/capacitor-vs-react-native) | Abgrenzung der beiden Wege | 20.09.2026 |
| [Apple Developer · setAlternateIconName](https://developer.apple.com/documentation/uikit/uiapplication/setalternateiconname(_:completionhandler:)) | Alternativsymbole müssen vorab hinterlegt sein; das System zeigt beim Wechsel einen Hinweis | 20.09.2026 |
| `code-planer.md` | Architektur, AP-0 bis AP-15, Sitzungsplan, PWA-Realitätscheck | — |
| `entwicklungsmodelle.md` (A-46) | die acht Lücken L1 bis L8, Modell A bis D | — |
| `../50-produkt-prototyp/store-richtlinien-pruefung.md` (A-53) | Richtlinie 2.3.8, Googles Zwei-Handlungen-Regel | — |
| `eu-alternativen-stack.md` (A-53) | Sentry-Ersatz, Belegprüfung, Zahlungsdienstleister | — |
