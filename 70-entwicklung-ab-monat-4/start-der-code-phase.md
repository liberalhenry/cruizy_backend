# Start der Code-Phase — was gebraucht wird, wie es aufgebaut sein muss, wann es losgeht

> ## ⚠ Plan, keine Beauftragung
>
> **Erstellt: 26.09.2026 · Fortgeschrieben: 27.09.2026 · Aufgaben A-67 und A-68 · Grundlage: Beschlüsse Nr. 73, 88, 89, 97 und die Beschlüsse vom 27.09.2026**
> **Neu am 27.09.2026:** Der Produktionsserver steht — ~~hosttech~~ **(überholt: seit 28.09.2026 ist der Entwicklungsserver ein Hetzner-VPS mit Ubuntu, Teil 3)**. Der **Hash-Abgleich wird später beantragt**, gebaut wird ein Steckplatz (Teil 4a neu). Die **Gründung liegt etwa drei Monate vor T0** (Nr. 97), womit der Prüfanbietervertrag für S10 nicht mehr blockiert ist.
> Dieses Dokument beantwortet drei Fragen, die am 26.09.2026 gestellt wurden: **Was brauche ich, um zu bauen? Wie muss das aufgebaut sein? Wann und wie fangen wir an?** Dazu die Frage nach dem eigenen Server.
> Der **Bauplan** (welche Funktion wann) steht in `code-planer.md`, das **Gerüst der ersten Sitzung** in `claude-code-kickoff-struktur.md`. Dieses Dokument ist die Schicht davor: Umgebung, Konten, Regeln, Reihenfolge, Geld, Zeitpunkt.
> **Nichts davon ist bestellt, beauftragt oder unterschrieben.**

---

## Auf einen Blick

| | |
|---|---|
| **Wann es losgehen kann** | **Geändert am 27.09.2026:** **S0, S1, S2, S3, S7, S11, S12, S13 sind frei.** **S5 und S6** brauchen **Nr. 100**, **S4** braucht **Nr. 102**. **S8 bis S10** werden auf einer Annahme gebaut, weil **K1 vertagt ist** — beide Stellungen der Prüfschranke werden gebaut (`P-PRUEFUNG-VOR-EINTRITT`) |
| **Was zuerst fehlt** | ein **Git-Hoster in der EU**, ein **Entwicklungsserver**, ein **Apple-Entwicklerkonto** und die beiden Dateien `CLAUDE.md` und `docs/architektur-regeln.md` |
| **Server** | **Hetzner-VPS mit Ubuntu** für Bau, Prüfläufe und Staging (geändert 28.09.2026, vorher hosttech — Nr. 99). Standort **zwingend** Falkenstein, Nürnberg oder Helsinki (G-01). Der Produktionsserver folgt später → **Nr. 103** |
| **Was der Bau kostet** | **rund 100 bis 160 € im Monat** in der Bauzeit, plus einmalig **2.700 €** Geräte und Konten. Die großen Posten kommen erst am Ende: Prüfungen **39.900 €** |
| **Der eine Satz zur Reihenfolge** | Erst die Umgebung, dann das Gerüst, dann das Datenmodell — **und das Datenmodell erst, wenn FV-23 und FV-77 entschieden sind** |
| **Der größte Blocker** | ~~K1~~ **Geändert am 27.09.2026:** Der Bau hat keinen großen Blocker mehr. K1, der Hash-Zugang, der Prüfanbieter und der Steuerberater blockieren nicht mehr den **Bau**, sondern den **Betrieb mit echten Menschen** — Testphase eingeschlossen. Die Torliste dazu steht in Teil 6 |
| **Der Grundsatz seit 27.09.2026** | **Erst fertig bauen, dann prüfen lassen.** Anwalt, Steuerberater, Hash-Anbieter, Prüfanbieter und Code-Prüfung kommen, wenn der Code steht — in der Reihenfolge aus Teil 6. Was das kostet, wenn die Annahme zu K1 nicht trägt, steht in `../01-steuerung/beschluesse-2026-09-27.md`, Abschnitt 9.6 |

---

## Teil 1 · Was gebraucht wird, bevor die erste Zeile entsteht

> **✎ Fortgeschrieben am 27.09.2026 (dritte Runde, A-70).** Die Liste unten stammt vom 26.09.2026 und war geschätzt. Am 27.09.2026 ist **gemessen** worden, was die drei beteiligten Orte tatsächlich können — die Einrichtungsliste mit allen Messwerten und der Reihenfolge steht in **`einrichtung-vor-dem-ersten-code.md`**. Drei Punkte dieser Liste haben sich dadurch geändert: **Nummer 1** (Git-Hoster — Codeberg ist gesperrt), **Nummer 2** (Entwicklungsserver erst ab S4) und **Nummer 9** (Hash-Zugang nach dem Bau). **Was jetzt wirklich gebraucht wird, ist ein leeres verbundenes Verzeichnis `cruizy-code` — 0 €, eine Minute.**

### 1.1 Konten und Zugänge

| | Was | Wofür | Wann | Kosten | Wer |
|---|---|---|---|---|---|
| 1 | ~~**Git-Hoster in der EU** — Codeberg, GitLab.com mit EU-Region oder Forgejo~~ **Geändert am 27.09.2026 (Nr. 102, gemessen):** **Codeberg und GitLab sind aus beiden Claude-Umgebungen gesperrt** (Proxy antwortet 403), GitHub ist erreichbar. Der Code beginnt daher **lokal** in einem eigenen verbundenen Verzeichnis `cruizy-code`; eine Fernablage hängt Henry später von Windows aus an. Wege und Bewertung: `einrichtung-vor-dem-ersten-code.md`, Abschnitt 4.1 | der gesamte Quellcode, Verlauf, Abnahmeprotokolle | **nicht mehr vor S0** — vor S0 genügt das verbundene Verzeichnis | 0 € | [M] |
| 2 | **Entwicklungsserver** | Staging, Prüfläufe, Datenbank mit Testdaten | ~~vor S1~~ **vor S4** (geändert 27.09.2026): In der Arbeitsumgebung der KI läuft **PostgreSQL 16 mit PostGIS 3.4** — Datenmodell, Zugriffsregeln, Löschkaskaden und Trilaterationstest sind ohne Server prüfbar. ⚠ Die Spezifikation nennt **17**; Migrationen werden 17-verträglich geschrieben und vor S4 nachgeprüft | **Hetzner-VPS, Ubuntu 24.04 LTS** (geändert 28.09.2026) — Einrichtung nach `server-einrichtung-hetzner.md`, Paket in `server-paket/` | [M] |
| 3 | **Apple-Entwicklerkonto** | native App, Sign in with Apple, TestFlight. **Beantragung dauert** und verlangt eine Rechtsform oder eine natürliche Person | vor S12, Antrag **früh** | **99 US-Dollar im Jahr** (ANNAHME, nicht erfragt) | [M] |
| 4 | **Google-Play-Entwicklerkonto** | native App Android | vor S12 | **25 US-Dollar einmalig** (ANNAHME) | [M] |
| 5 | **KI-Werkzeuge für die Entwicklung** | der Bau selbst | vor S0 | im Modell **100 € im Monat** | [M] |
| 6 | **Domain** | Manifest, Sign-in-Konfiguration, Testumgebung | **vor S4** (der Name geht in die Konfiguration) | 10 bis 30 € im Jahr | [M] |
| 7 | **E-Mail-Versand in der EU** | Bestätigungen, Anmeldecodes | vor S4 | ab 0 € im kleinen Volumen | [M] |
| 8 | **SMS-Versand in der EU** (Sweego oder gleichwertig) | Anmeldecodes, Wiederherstellung (Z-10) | vor S4 | 0,078 € je SMS (A-52, abgerufen 21.09.2026) | [M] |
| 9 | **Zugang zum Hash-Abgleich** | **jedes öffentliche Bild** (AP-4) | ~~sofort anstoßen~~ **entschieden 27.09.2026: später.** Gebaut wird ein Steckplatz (Teil 4a); der Zugang muss **vor dem öffentlichen Start** da sein, nicht vor S3 | offen, siehe `../10-recht-gruendung/hash-abgleich-zugangswege.md` | [M] |
| 10 | **Prüfanbieter für die Altersprüfung** | S10 | vor S10 — **nicht mehr blockiert**, weil die GmbH nach **Nr. 97** etwa drei Monate vor T0 entsteht und den Vertrag schließen kann | Vertrag, kein Fixpreis | [M] |

**Der Punkt, der am leichtesten übersehen wird:** Nummer 9. Der Hash-Abgleich ist die Voraussetzung dafür, dass ein Bild eines echten Menschen freigegeben werden darf. **Am 27.09.2026 ist entschieden, ihn später zu beantragen** — gebaut wird ein Steckplatz, beantragt wird nach dem Bau (Nr. 98, Weg b). Damit verschiebt sich der Blocker von Sitzung S3 auf **jeden Betrieb mit echten Menschen** — die geschlossene Testphase eingeschlossen —, und dort ist er hart: Teil 4a beschreibt, wie das technisch abgesichert wird. **Zur Wartezeit:** „Monate" gilt für IWF und PhotoDNA; für **Project Arachnid** nennen Erfahrungsberichte **Tage bis Wochen** (`../10-recht-gruendung/hash-abgleich-zugangswege.md`, Abschnitt 3).

### 1.2 Geräte

| | Was | Wofür | Kosten |
|---|---|---|---|
| 1 | ein **älteres Android-Gerät** | Leistungsuntergrenze, echte Messung statt Emulator | im Modell zusammen **1.500 €** für den Grundpool |
| 2 | ein **älteres iPhone** | dasselbe für iOS | |
| 3 | **je ein neueres Gerät** beider Systeme (A-51) | zweite Plattform | **1.200 €** zusätzlich (A-52) |

**Warum alte Geräte und nicht neue:** Eine Cruising-App wird nachts, unterwegs, bei schlechtem Netz und auf dem Gerät benutzt, das gerade da ist. Was auf einem drei Jahre alten Android flüssig läuft, läuft überall.

### 1.3 Die beiden Dateien, die vor allem anderen stehen

Beide liegen fertig formuliert in `claude-code-kickoff-struktur.md` und werden nur noch angelegt:

| Datei | Was sie tut | Warum sie zuerst kommt |
|---|---|---|
| **`/CLAUDE.md`** | wird bei **jeder** Sitzung automatisch geladen: Stack, Befehle, die vier nicht verhandelbaren Punkte, Freigabepflicht, Ordnerstruktur | Ohne sie beginnt jede Sitzung mit Erklären. Mit ihr beginnt jede Sitzung mit Arbeit |
| **`/docs/architektur-regeln.md`** | die vier Punkte ausführlich begründet: Standortunschärfe, Bildaufbereitung, Löschbarkeit, EXIF | Diese vier lassen sich **nicht nachrüsten**. Nachträglich eingebaut heißt: die halbe Anwendung wird umgeschrieben |

**Dazu drei Dateien, die dort noch fehlen** und die dieses Dokument ergänzt (Teil 2): eine **Abnahmeregel**, eine **Testregel** und eine **Umgebungsregel**.

---

## Teil 2 · Wie das Projekt aufgebaut sein muss

### 2.1 Der Ordnerbaum

Steht vollständig in `claude-code-kickoff-struktur.md`. Das Wesentliche in drei Sätzen: Eine Anwendung (`apps/web`), ein Backend-Ordner (`supabase/` mit `migrations/`, `policies/`, `functions/`), ein geteilter Typenordner für die spätere native App (`packages/shared`), ein Dokumentenordner (`docs/`). **Die drei sicherheitskritischen Orte** — `supabase/policies/`, `src/lib/location/`, `src/lib/media/` — sind benannt und lösen Freigabepflicht aus.

### 2.2 Die drei Umgebungen

Das fehlt bisher und ist der häufigste Fehler in Projekten dieser Größe: **Es gibt nicht eine Datenbank, es gibt drei.**

| Umgebung | Wo | Welche Daten | Wer darf dran |
|---|---|---|---|
| **Lokal** | auf dem eigenen Rechner | erfundene Testdaten | beide Gründer, die KI |
| **Staging** | **eigener Server** (Teil 3) | erfundene Testdaten, dieselbe Struktur wie Produktion | beide Gründer, die KI |
| **Produktion** | **gemieteter Server in der EU** (Teil 3) | **echte Daten echter Menschen** | **nur Menschen, nie die KI** |

**Die Regel, die daraus folgt und in `CLAUDE.md` gehört:** *Die KI bekommt niemals Zugangsdaten zur Produktionsumgebung.* Sie schreibt Migrationen; ein Mensch spielt sie ein. Das ist keine Misstrauensregel, sondern dieselbe Trennung, die jedes ordentliche Projekt hat — und in einer App, in der Standorte und Bilder schwuler Männer liegen, ist sie nicht verhandelbar.

### 2.3 Die Abnahmeregel

Nr. 73 sagt: bauen, am Ende prüfen. Das heißt **nicht**, dass zwischendurch niemand hinsieht — sonst ist die Prüfung am Ende ein Berg statt einer Prüfung.

| Sitzungstyp | Was ein Mensch tut | Aufwand |
|---|---|---|
| **S1, S2, S3, S10, S11** (Datenmodell, Standort, Bilder, Verifizierung, Rechte) | **Zeile für Zeile lesen**, besonders Migrationen und Zugriffsregeln | 2 bis 4 Stunden je Sitzung |
| **S5–S9, S12** | Ablauf durchklicken, Abnahmeliste abhaken | 1 Stunde |
| **S0, S13** | überfliegen | 15 Minuten |

**Jede Sitzung endet mit:** einem sauberen Commit-Stand, einer kurzen Liste „was geprüft werden muss", und — wo es die sicherheitskritischen Orte betrifft — der Markierung **`PRÜFUNG ERFORDERLICH`**. Ohne Abhaken beginnt die nächste Sitzung nicht.

### 2.4 Die Testregel

| Was | Regel |
|---|---|
| **Immer getestet, ohne Ausnahme** | Standortberechnung (verlässt je eine genauere Zahl als ein Band den Server?) · Bildpipeline (EXIF weg? Original nie ausgeliefert?) · Löschkaskaden (bleibt nach einer Löschung irgendwo etwas?) · Blockieren (überlebt es Neuinstallation?) |
| **Tests laufen bei jedem Commit** | automatisch, auf dem eigenen Server als Prüfläufer |
| **Ein Test, der rot ist, wird nicht „später" repariert** | Er blockiert die nächste Sitzung. Das ist die einzige Regel, die verhindert, dass sich Schulden aufbauen, die am Ende die Prüfung sprengen |
| **Was nicht getestet wird** | Aussehen, Texte, Anordnung. Das prüfen Menschen mit den Augen |

### 2.5 Umgang mit Geheimnissen

Zugangsdaten gehören **nie** in das Code-Verzeichnis, auch nicht in einer Datei, die „nicht hochgeladen wird". Sie liegen in einer Umgebungsdatei außerhalb des Verzeichnisses oder in einem Passwortspeicher, und im Verzeichnis liegt nur eine Beispieldatei ohne Werte. **Ein einziges Versehen hier ist der teuerste Fehler, den dieses Projekt machen kann** — ein Datenbankzugang in einem öffentlichen Verlauf ist innerhalb von Minuten automatisiert gefunden.

### 2.6 Was in `CLAUDE.md` ergänzt werden muss

Vier Zeilen, die in der heutigen Fassung fehlen:

1. **Keine Produktionszugänge für die KI** (2.2).
2. **Rot ist blockierend** (2.4).
3. **Lizenzprüfung vor jedem Commit** — der Befehl steht schon drin, die Regel dazu nicht: Eine Abhängigkeit unter Copyleft-Lizenz kann das ganze Produkt erfassen.
4. **Abweichungen vom Handbuch werden gemeldet, nicht entschieden** — steht sinngemäß drin, gehört aber als eigene Zeile hin, weil es die Regel ist, die am leichtesten stillschweigend verletzt wird.

---

## Teil 3 · Die Server — entschieden am 27.09.2026, geändert am 28.09.2026

> ### ✎ Geändert am 28.09.2026 (A-71) — Hetzner statt hosttech
>
> **Der Entwicklungsserver läuft auf einem Hetzner-VPS mit Ubuntu 24.04 LTS**, nicht bei hosttech. Entscheidung von Nicolas, weitergegeben über Henry am 28.09.2026.
>
> **Was davon unberührt bleibt:** Dass Bau, Prüfläufe und Staging auf einem gemieteten Server laufen, dass dort **ausschließlich erfundene Daten** liegen, und dass Auftragsverarbeitungsvertrag und Folgenabschätzung erst vor dem ersten echten Menschen fällig werden.
>
> **Was sich ändert:** Der Abschnitt 3.5 zu hosttech ist damit **gegenstandslos** und bleibt nur als Nachweis stehen, was am 27.09.2026 geprüft worden war. An seine Stelle tritt **`server-einrichtung-hetzner.md`** mit Anleitung, Skripten und Prüfliste; das Paket zum Hochladen liegt in `server-paket/`.
>
> ⚠ **Der eine Punkt, der zwingend ist:** Hetzner hat sechs Standorte, drei davon außerhalb der EU (Ashburn, Hillsboro, Singapur). **Nur Falkenstein, Nürnberg oder Helsinki** sind mit Grundsatz **G-01** vereinbar.

---

> ~~**Beschlossen:** Produktion bei **hosttech** (gemietet)~~ **Überholt am 28.09.2026 — siehe Kasten am Anfang von Teil 3.** Bau und Staging auf dem **eigenen Server**. Die Abwägung darunter bleibt stehen, weil sie begründet, warum geteilt wird — und Abschnitt 3.5 nennt, was bei hosttech noch zu klären ist.

**Die Frage war:** *„Hätte sonst auch nen Server oder so zur Verfügung."* Die Antwort ist nicht ja oder nein, sondern: **für welchen Zweck.**

### 3.1 Was ein eigener Server gut kann

| | Warum |
|---|---|
| **Bau und Staging** | Dort liegen nur erfundene Daten. Fällt er aus, ärgert das; es schadet niemandem |
| **Prüfläufe (CI)** | Tests bei jedem Commit brauchen Rechenzeit, nicht Verfügbarkeit |
| **Sicherungsziel** | eine verschlüsselte zweite Kopie der Produktionssicherungen, räumlich getrennt — **genau das, was Art. 32 DSGVO als „Wiederherstellbarkeit" meint** |
| **Geld** | Seit dem **15.06.2026** sind die Cloud-Preise bei Hetzner deutlich gestiegen: CCX13 von 19,03 € auf **51,16 €** im Monat, CAX11 von 5,34 € auf **7,13 €** (Deutschland/Finnland, inkl. 19 % Umsatzsteuer, ohne IPv4; abgerufen 26.09.2026). Ein vorhandener Server spart in der Bauzeit real Geld |

### 3.2 Was ein eigener Server nicht kann — sobald echte Menschen drauf sind

Ab der geschlossenen Testphase liegen dort **Standorte, Bilder und Gespräche von 200 schwulen, bi und queeren Männern**. Das sind besondere Kategorien personenbezogener Daten nach **Art. 9 DSGVO** — die sexuelle Orientierung ergibt sich schon aus der Mitgliedschaft.

| Anforderung | Gemieteter Server im Rechenzentrum | Eigener Server |
|---|---|---|
| **Physische Sicherheit** (Art. 32) | Zutrittskontrolle, protokolliert, zertifiziert | wer im Raum steht, steht an der Festplatte |
| **Stromversorgung und Netz** | redundant, unterbrechungsfreie Versorgung | ein Stromausfall ist ein Ausfall |
| **Abwehr von Überlastangriffen** | eingebaut | praktisch nicht vorhanden |
| **Wiederherstellbarkeit** | Sicherungen und Wiederherstellung als Dienst | selbst zu bauen und **selbst zu testen** |
| **Nachweisbarkeit gegenüber Prüfern** | Zertifikate, Auftragsverarbeitungsvertrag, Verzeichnis | eine Aussage der Gründer |
| **Erreichbarkeit** | zugesagte Verfügbarkeit | so gut wie die Leitung, an der er hängt |

**Der Punkt, der den Ausschlag gibt, ist nicht technisch, sondern nachweislich:** Bei einer Datenschutz-Folgenabschätzung und im Store-Antrag wird gefragt, **wo** die Daten liegen und **wie** sie geschützt sind. „In einem Rechenzentrum mit Zutrittskontrolle, Vertrag und Zertifikat" ist eine Antwort. „Auf einem Server, der bei uns steht" ist eine Erklärung, die man verteidigen muss — und die man in dieser Zielgruppe schlecht verteidigen kann, wenn einmal etwas passiert.

**Ein zweiter Punkt, der oft übersehen wird:** Ein Server an einem Privatanschluss versendet in der Praxis keine zuverlässigen E-Mails — die Adressbereiche stehen bei den großen Anbietern auf Sperrlisten. Anmeldebestätigungen, die im Spam landen, kosten mehr Nutzer als jede Funktion bringt.

### 3.3 Die Empfehlung: teilen

| Zweck | Wo | Ab wann |
|---|---|---|
| **Entwicklung, Prüfläufe, Staging, Git-Hosting** | **eigener Server** | sofort — das spart in der ganzen Bauzeit Geld und ist ohne Nachteil |
| **Produktion, sobald ein echter Mensch ein Konto hat** | **gemieteter Server in der EU**, mit Auftragsverarbeitungsvertrag | ab der geschlossenen Testphase (Nr. 89) |
| **Zweite Sicherungskopie der Produktionsdaten** | **eigener Server**, verschlüsselt | ab derselben Zeit |

**Was das bedeutet, wenn der eigene Server ausfällt:** In der Bauzeit steht der Bau still, bis er wieder läuft — ärgerlich, kein Schaden. Genau deshalb ist er für diesen Zweck richtig.

### 3.5 hosttech — was noch zu klären war *(gegenstandslos seit 28.09.2026, siehe Kasten oben)*

> ### ✎ Geändert am 27.09.2026, zweite Runde (Nr. 99)
>
> **hosttech trägt nur Bau, Prüfläufe und Staging — nicht die Produktion.** Die Produktion läuft später auf einem stärkeren Server in Deutschland (→ **Nr. 103**).
>
> **Damit entfallen für hosttech vorerst:** die Standortwahl (Punkt 1), der Auftragsverarbeitungsvertrag (Punkt 2) und die Zertifikatsfrage. Grund: Auf einem Entwicklungsserver mit **ausschließlich erfundenen Daten** gibt es keine personenbezogenen Daten und damit keine Auftragsverarbeitung.
>
> **Die Grenze, an der das kippt:** ab dem ersten echten Menschen — und „echter Mensch" beginnt **nicht erst mit der Testphase**. Auch eine Warteliste mit echten E-Mail-Adressen, Interviewaufnahmen oder Umfrageantworten auf diesem Server wären personenbezogene Daten. **Regel für die ganze Bauzeit: auf dem Entwicklungsserver liegen nur erfundene Daten.**
>
> **Was von der Liste unten offen bleibt:** Punkt 3 (trägt der Server die Anforderungen?) — jetzt für die Entwicklung statt für die Produktion — sowie Punkt 4 und 5, weil Sicherungen auch für den Bau gelten. Die Punkte 1 und 2 wandern zu **Nr. 103**.

**hosttech ist ein schweizerisches Unternehmen** und betreibt oder nutzt fünf Rechenzentren: **Nottwil, Wädenswil und Appenzell/Gais** (Schweiz), **Berlin** (Deutschland) und **Wien** (Österreich). *Abgerufen 27.09.2026.*

| | Was zu klären ist | Warum es zählt |
|---|---|---|
| **1** | **In welchem Rechenzentrum steht der Server?** → **Nr. 99** | **Berlin oder Wien:** EU, unter Grundsatz G-01 unproblematisch. **Schweiz:** Drittlandsübermittlung — zulässig über den Angemessenheitsbeschluss der Kommission, aber sie muss in Verarbeitungsübersicht, Datenschutzerklärung und Folgenabschätzung **benannt** werden, und das schweizerische Datenschutzgesetz gilt parallel. Vorschlag: **Berlin** — dort nennt hosttech ISO 27001, ISO 9001, ISO 14001 und TÜViT EN 50600 Level 3+ |
| **2** | **Auftragsverarbeitungsvertrag nach Art. 28 DSGVO** plus Liste der Unterauftragsverarbeiter | Ohne ihn darf kein echter Nutzer auf dem Server sein. Braucht einen Vertragspartner — vorhanden, seit die GmbH nach Nr. 97 vor T0 entsteht |
| **3** | **Trägt der Server die Anforderungen?** PostgreSQL 17 mit PostGIS, Redis, S3-kompatibler Objektspeicher, Bildverarbeitung (imgproxy), dazu Reserve für die Prüfkette | Mit den bisherigen Angaben nicht zu beurteilen. Gebraucht werden: Kerne, Arbeitsspeicher, Plattenart und -größe, ob Objektspeicher dabei ist, ob Sicherungen enthalten sind |
| **4** | **Sicherungen und Wiederherstellung** — Häufigkeit, Aufbewahrung, und ob eine **Wiederherstellung schon einmal geprobt** wurde | Art. 32 DSGVO verlangt Wiederherstellbarkeit. Eine Sicherung, die nie zurückgespielt wurde, ist eine Vermutung |
| **5** | **Zweite Kopie** auf dem eigenen Server, verschlüsselt, räumlich getrennt | Das ist der Zweck, für den der eigene Server neben Staging weiter gebraucht wird |

**Was damit erledigt ist:** Die Empfehlung aus A-67 — gemieteter Server im Rechenzentrum mit Vertrag und Zertifikat für die Produktion — ist erfüllt. Hetzner ist aus allen Bauunterlagen gestrichen; die Preisangabe unten bleibt nur als Hinweis stehen, dass Hostingkosten in diesem Jahr gestiegen sind.

### 3.4 Was vor dem Einsatz des eigenen Servers geklärt sein muss

| | Frage |
|---|---|
| 1 | **Wem gehört er, und wer hat Zugang?** Steht er bei jemandem im Haus, hat diese Person physischen Zugriff. Für Staging mit erfundenen Daten unproblematisch — für die Sicherungskopie muss die Verschlüsselung sitzen |
| 2 | **Was läuft sonst noch darauf?** Ein Server, der nebenbei etwas anderes betreibt, teilt sich dessen Sicherheitslage |
| 3 | **Wie kommt er ins Netz?** Für Staging genügt ein Zugang über ein privates Netz; er muss nicht öffentlich erreichbar sein — und sollte es nicht sein |
| 4 | **Wer spielt Sicherheitsaktualisierungen ein?** Ein vergessener Server ist nach einem halben Jahr ein Einfallstor |

---

## Teil 4a · Die Hash-Abgleich-Lücke — wie sie gebaut wird

**Beschlossen am 27.09.2026:** Der Zugang wird später beantragt. Gebaut wird mit Lücke — aber mit einer Lücke, die genau geformt ist, damit später nichts umgebaut werden muss.

| | Was gebaut wird | Warum so |
|---|---|---|
| **1** | Die **vollständige Prüfkette** (M-02): Dateityp und Größe, EXIF entfernen, neu kodieren, Original verschlüsselt ablegen, Klassifikator, menschliche Warteschlange, Freigabe | Alles außer Stufe 1 ist ohnehin eigene Arbeit und nicht vom Zugang abhängig |
| **2** | Stufe 1 als **Schnittstelle mit festgelegter Ein- und Ausgabe** — hinein ein Bild, heraus „Treffer" oder „kein Treffer". Dahinter liegt zunächst eine Attrappe, die immer „nicht geprüft" zurückgibt | Wird der Zugang erteilt, wird ein Anbieter-Modul eingesetzt. **Kein Umbau, keine neue Migration** |
| **3** | Der Parameter **`P-HASH-AKTIV`**, Voreinstellung **aus** | Ein Schalter, kein Codezweig, der später ausgebaut werden muss |
| **4** | Der Zustand **„Hash-Prüfung ausstehend"** an jedem Bild, das in dieser Zeit freigegeben wird — dauerhaft abfragbar | Damit lässt sich **jedes** dieser Bilder nachprüfen, sobald der Zugang da ist (AK-M02-10, AK-M02-12) |
| **5** | Eine **harte Sperre gegen jeden Betrieb mit echten Menschen**, solange der Schalter aus ist — Testphase **und** öffentlicher Start, im Code und nicht in einer Absprache (AK-M02-11, geändert am 27.09.2026 durch Nr. 98 Weg b) | Der einzige Schutz gegen die Versuchung, „das eine Mal" ohne zu starten |
| **6** | Der Treffer-Weg wird **gebaut und getestet**, obwohl er nicht auslösen kann — mit Testdaten, nicht mit echten Hashes | Sonst ist der Weg am Tag der Anbindung unerprobt, und zwar genau der Weg, der nie versagen darf |
| **7** | Die Schnittstelle bildet **zwei Bauformen** ab: Hash hinausgeben **oder** Medium hinausgeben. Welche gilt, steht in einer Einstellung (AK-M02-13, neu am 27.09.2026) | Ob Project Arachnid einen reinen Hash-Modus anbietet, ist offen; Thorn Safer selbst gehostet gibt nur Hashes heraus. Grundsatz **G-01** verlangt, dass nach Möglichkeit kein Bild die EU verlässt — die Wahl fällt beim Anbieter, nicht am Code |

**Was die Lücke kostet, ohne Beschönigung:** Bekanntes Missbrauchsmaterial wird in dieser Zeit **nicht** automatisch erkannt. Klassifikator und Mensch finden explizite Inhalte und offensichtliche Fälle; bekanntes Material, das durch den Klassifikator kommt, finden sie nicht zuverlässig. Handbuch A und die Moderationsarchitektur sagen das Gegenteil zu — **die Zusage ist in dieser Zeit nicht eingehalten**, und das steht so in beiden Dokumenten.

> ### ✔ Entschieden am 27.09.2026, zweite Runde — Nr. 98 ist Weg (b)
>
> **Der Übergangszustand trägt keinen echten Menschen.** Solange `P-HASH-AKTIV` auf aus steht, läuft der Bau **ausschließlich mit erfundenen Testdaten**; weder die geschlossene Testphase mit 200 Personen noch der öffentliche Start lassen sich freigeben. **Damit ist die Zusage aus Handbuch A und A-37 eingehalten** — der Widerspruch, der am Vormittag benannt wurde, findet nicht mehr statt.
>
> **Der Antrag wird gestellt, wenn der Bau fertig ist.** Das ist eine bewusste Entscheidung und trägt, weil kein Zeitdruck besteht: T0 liegt im Planungsfall im Juli 2029. **Die Wartezeit ist außerdem kürzer als bisher angenommen** — „Monate" gilt für IWF und PhotoDNA, für **Project Arachnid** nennen Erfahrungsberichte **Tage bis Wochen**.
>
> **Was damit entfällt:** der Vorschlag, in der Testphase jedes öffentliche Bild von Hand freizugeben. Er wird nicht gebraucht, weil die Testphase erst nach der Anbindung beginnt.

**Was dadurch billiger wird:** nichts. **Was dadurch später teurer werden kann:** Wird der Zugang nie erteilt — der IWF verlangt eine Mitgliedschaft, Project Arachnid arbeitet mit Nachweisen —, steht das Produkt vor dem öffentlichen Start mit einer Sperre, die sich nicht öffnen lässt. **Deshalb bleibt die Anfrage eine Menschenhandlung mit Termin und nicht „irgendwann":** spätestens **sechs Monate vor T0**, weil die Zulassung Monate dauert.

---

## Teil 4 · Die Reihenfolge — was wann gebaut wird und was vorher da sein muss

Der Sitzungsplan steht in `code-planer.md`. Hier steht, **was vor jeder Sitzung erledigt sein muss** — das ist die Information, die beim Start fehlt.

| Sitzung | Inhalt | Was vorher stehen muss | Menschenzeit |
|---|---|---|---|
| **S0** | Gerüst, leere Anwendung, Ordnerstruktur | Git-Hoster · `CLAUDE.md` · `docs/architektur-regeln.md` · **sonst nichts** | 15 Min |
| **S1** | Datenmodell, Löschkaskaden, Export | **FV-23** und **FV-77** entschieden (beide gehen an das Datenmodell) · Entwicklungsserver | **2–4 h** |
| **S2** | Standortarchitektur | ⚠ W-27 (erledigt 26.09.) · Parameter der Rasterzellen | **2–4 h** |
| **S3** | Bildpipeline | **nichts.** Stufe 1 als Steckplatz (Teil 4a); **Nr. 98 ist entschieden** (Weg b). Die Schnittstelle bildet Hash- **und** Medienübermittlung ab | **2–4 h** |
| **S4** | Anmeldung, Gastmodus, Sicherungen, Überwachung | **Nr. 102** — Domain als Konfigurationswert, die drei domaingebundenen Teile (Apple-Dienst-ID, DNS, Absenderfreigabe) zuletzt · E-Mail- und SMS-Versand. **Nicht mehr nötig:** hosttech-Standort und Auftragsverarbeitungsvertrag — die Produktionsumgebung entsteht später (Nr. 99, Nr. 103) | 1 h |
| **S5–S6** | Profil, Einwilligungsfluss | FV-87 entschieden · **Nr. 95 teilweise entschieden** (Wartefrist, Abbruchrecht) · **Nr. 100 nötig**, wenn Vertrauenspersonen gebaut werden — ohne Empfänger der Benachrichtigung hat das Abbruchrecht keine Wirkung | 1 h |
| **S7** | Raster, Entdecken | FV-01, FV-46 (beides Parameter, notfalls vorläufig) | 1 h |
| **S8–S9** | Gespräche mit allen Schranken | ~~K1 beantwortet~~ **K1 ist vertagt** — gebaut wird auf der Annahme, dass Zone 1 keine geschlossene Benutzergruppe verlangt; **beide Stellungen** von `P-PRUEFUNG-VOR-EINTRITT` werden gebaut, Zonenregeln bleiben Daten · FV-57, FV-86 | 1–2 h |
| **S10** | Verifizierung; Hash-Abgleich nur als Steckplatz | **nichts.** Der Prüfanbieter bekommt **denselben Steckplatz** wie der Hash-Abgleich — Schnittstelle plus Attrappe; der Vertrag kommt nach dem Bau · FV-15, FV-17 | **2–4 h** |
| **S11** | Blockieren, Melden, Datenkonto | FV-71 · Zugriffsregeln vollständig | **2–4 h** |
| **S12** | „Heute", Sicherheitszentrum | **Nr. 83, 84** (erledigt 26.09.) · **Nr. 101, zweiter Teil** — bleiben redaktionelle Einträge neben dem Eintragen durch verifizierte Konten? · Entwicklerkonten der Stores | 1 h |
| **S13** | Antwortquote, Vorbereitung der Härtung | FV-34 | 15 Min |
| **danach** | geschlossene Testphase (200, Nr. 89), dann die externen Prüfungen | **GmbH gegründet** (Nr. 97, etwa drei Monate vor T0) · Produktionsumgebung (Anbieter offen → Nr. 103) · alle Rechtstexte · **Nr. 98** · Zugang zum Hash-Abgleich **vor dem öffentlichen Start** | Wochen |

**Zwei Stellen, an denen der Bau wirklich stehen bleibt, wenn nichts geschieht:**

1. **Vor S1:** FV-23 und FV-77. Beide sind in `../50-produkt-prototyp/festlegungen-die-zwoelf-ausfuehrlich.md` aufbereitet und brauchen je eine Antwort.
2. **Vor S8:** **K1**. Das ist der große — nach Nr. 88 wird die Frage vorgezogen, und das ist der Grund, warum sie vorgezogen wird.

*Der dritte Punkt — der Prüfanbietervertrag vor S10 — ist am 27.09.2026 mit **Nr. 97** entfallen: Die GmbH entsteht etwa drei Monate vor T0 und kann ihn schließen. Der Hash-Abgleich ist seit demselben Tag kein Blocker vor S3 mehr, sondern eine Bedingung für den **öffentlichen Start**.*

---

## Teil 5 · Was es kostet

### 5.1 Laufend, während gebaut wird

| Posten | Betrag je Monat | Anmerkung |
|---|---|---|
| KI-Werkzeuge für die Entwicklung | 100 € | Modellwert |
| Entwicklungs- und Staging-Server | **0 €** | eigener Server, vorhanden |
| Git-Hosting | 0 € | Codeberg oder selbst gehostet |
| Domain | ~2 € | |
| Entwicklerkonten der Stores, auf den Monat gerechnet | ~8 € | |
| **Summe je Monat in der Bauzeit** | **rund 110 €** | |
| Entwicklungsserver (Hetzner-VPS) | **ANNAHME A-72: rund 10 bis 20 € im Monat** — nicht erfragt, Preisrechner beim Anlegen | ab S4 gebraucht (geändert 28.09.2026) |

Das Finanzmodell setzt für diese Phase **„Werkzeuge, Entwicklerzugänge" 90 €** und **„KI-Werkzeuge Entwicklung" 100 €** an, zusammen 190 € — der Plan hier liegt darunter. **Kein Grund, die Zahl zu senken:** Die Differenz ist der Puffer für das, was in jedem Bauprojekt dazukommt.

### 5.2 Einmalig, vor und während des Baus

| Posten | Betrag | Quelle |
|---|---|---|
| Gerätepool (zwei ältere Geräte) | 1.500 € | Finanzmodell |
| Testgeräte für die zweite Plattform | 1.200 € | A-52 (A-51) |
| Apple-Entwicklerkonto, erstes Jahr | ~90 € | ANNAHME |
| Google-Play-Konto | ~23 € | ANNAHME |
| **Summe** | **rund 2.810 €** | |

### 5.3 Am Ende — die großen Posten

| Posten | Betrag |
|---|---|
| **Code-Prüfung, vollständig, beide Plattformen** (Nr. 73) | **18.900 €** |
| Penetrationstest | 4.000 € |
| Barrierefreiheitsprüfung durch Betroffene | 1.500 € |
| Jugendschutzgutachten | 2.500 € |
| Datenschutz-Folgenabschätzung | 4.500 € |
| AGB, Datenschutzerklärung, Einwilligungsarchitektur | 5.500 € |
| DSA- und DDG-Prüfung | 3.000 € |
| **Summe vor dem öffentlichen Start** | **39.900 €** |

**Diese 39.900 € sind der eigentliche Kostenblock der Code-Phase** — nicht die Werkzeuge. Nach Nr. 88 (c) werden sie vor der Gründung privat vorfinanziert; wie das Geld zurückkommt, ist **Nr. 94**, und ob die Gründung stattdessen vorgezogen wird, ist **Nr. 97**.

### 5.4 Ein Hinweis zum Hosting nach dem Start

Das Modell rechnet mit **80 € im Monat bei 0 aktiven Nutzern** und **180 € bei 5.000** (Kostenstaffel aus Handbuch B). **Diese Zahlen stammen aus einer Zeit vor der Preisanpassung vom 15.06.2026.** Ein selbst gehostetes Supabase braucht einen Server mit zugesicherten Kernen; das Modell CCX13 kostet seit dem 15.06.2026 **51,16 € im Monat** statt 19,03 € (abgerufen 26.09.2026). Mit Sicherungen, Objektspeicher und einem zweiten Server für die Datenbank ist **80 € knapp und 180 € realistisch, aber nicht großzügig**.

**Vorschlag:** Die Zeile „Hosting, Infrastruktur" im Finanzmodell wird vor dem ersten Förderantrag mit einem echten Angebot gegengerechnet. Bis dahin bleibt sie, wie sie ist — mit diesem Hinweis.

---

## Teil 6 · Die Blocker, nach Dringlichkeit

> **Neu gefasst am 27.09.2026, zweite Runde.** Fünf der neun Blocker sind gefallen oder verschoben. Der Grundsatz „erst fertig bauen, dann prüfen lassen" nimmt K1, den Hash-Zugang, den Prüfanbieter und den Steuerberater **aus dem Bauweg heraus** und stellt sie vor den **Betrieb mit echten Menschen**.

| Rang | Blocker | Blockiert | Was ihn löst | Wer |
|---|---|---|---|---|
| **1** | **Nr. 100** — wer innerhalb der Wartefrist benachrichtigt wird; Passkey oder Wiederherstellungscode | **S5** — der Weg über Vertrauenspersonen | eine Entscheidung; Vorschläge liegen vor | **[M]** |
| **2** | **Nr. 102** — wohin der Code kommt und wie ohne Domain gebaut wird | **S0** (Ablageort) und **S4** (Domain als Konfigurationswert) | eine Entscheidung; Vorschläge liegen vor | **[M]** |
| **3** | **Gerätepool** | die Leistungsmessungen in S7 und S13 | kaufen, 1.500 € | **[M]** |
| **4** | **Nr. 101** — ob redaktionelle Einträge neben verifizierten Konten bestehen bleiben | **S12** (Veranstaltungen und Verzeichnis) | eine Entscheidung; ⚠ W-32 | **[M]** |
| — | ~~**K1 — Jugendschutzfrage**~~ | **verschoben am 27.09.2026.** Der Anwalt kommt nach dem Bau. **S8 bis S11 werden auf einer Annahme gebaut**, begrenzt über `P-PRUEFUNG-VOR-EINTRITT` und datengetriebene Zonenregeln. Blockiert jetzt den **Betrieb mit echten Menschen**, nicht den Bau | Einzelmandat nach dem Bau | **[M]** |
| — | ~~**Nr. 98**~~ | **entschieden am 27.09.2026: Weg (b).** S3 ist frei; gesperrt ist jeder Betrieb mit echten Menschen | — | — |
| — | ~~**FV-23 und FV-77**~~ | **entschieden am 27.09.2026 (Nr. 68).** S1 ist frei | — | — |
| — | ~~Nr. 97 — Rechtsform vor der Testphase~~ | **entschieden am 27.09.2026: Gründung etwa drei Monate vor T0.** S10 ist frei | — | — |
| — | ~~**Endgültiger Name und Domain**~~ | **entschieden am 27.09.2026: Domain wird später gesichert.** Für S4 folgt daraus eine Bauordnung → Nr. 102 | — | — |
| — | ~~**Prüfanbieter der Altersprüfung**~~ | **nicht mehr blockierend** — S10 wird mit Schnittstelle und Attrappe gebaut, wie der Hash-Abgleich | Vertrag nach dem Bau | **[M]** |
| — | ~~**Zugang zum Hash-Abgleich**~~ | **blockiert den Bau nicht**, sondern jeden **Betrieb mit echten Menschen** — Testphase eingeschlossen, per Sperre im Code (AK-M02-11). Antrag nach dem Bau; Wartezeit bei Project Arachnid nach Erfahrungsberichten Tage bis Wochen | Antrag nach dem Bau | **[M]** |
| — | ~~**Nr. 99** — Standort und Auftragsverarbeitungsvertrag~~ | **entschieden am 27.09.2026 und geändert am 28.09.2026: Entwicklungsserver ist ein Hetzner-VPS mit Ubuntu**, Standort in der EU. Auftragsverarbeitungsvertrag wandert zum Produktionsserver → **Nr. 103**, fällig vor dem ersten echten Menschen | — | — |

**Alles auf dieser Liste ist eine Menschenhandlung.** Nichts davon kann die KI erledigen — sie kann die Vorlagen schreiben, und das ist geschehen.

**Was an die Stelle der alten Blocker tritt — die Torliste vor dem ersten echten Menschen.** Nichts davon hält den Bau auf; alles davon hält den Betrieb auf, bis es erledigt ist:

| | Vor dem ersten echten Menschen |
|---|---|
| 1 | **Fachanwalt** — K1, K6 und der gesamte Fragenkatalog; danach die Korrekturen am Code |
| 2 | **Code-Prüfung** (18.900 €) — **nach** den Rechtskorrekturen, sonst prüft sie Code, der danach geändert wird |
| 3 | **Hash-Abgleich** — Zugang beantragt und `P-HASH-AKTIV` eingeschaltet, sonst lässt sich nichts freigeben |
| 4 | **Prüfanbieter der Altersprüfung** — Vertrag, Attrappe gegen das echte Modul getauscht |
| 5 | **GmbH gegründet** — sie ist Verantwortliche nach Art. 4 Nr. 7 DSGVO (Nr. 97) |
| 6 | **Produktionsserver** in Deutschland mit Auftragsverarbeitungsvertrag (Nr. 103) |
| 7 | **Steuerberater** — Kleinunternehmerregelung und Gründungsjahr (Nr. 11) |

---

## Teil 7 · Wann und wie gestartet wird

### 7.1 Der Vorschlag in drei Stufen

#### Stufe 1 — sofort, ohne eine einzige offene Entscheidung

| | Was | Wer | Dauer |
|---|---|---|---|
| 1 | **Git-Hoster wählen und Verzeichnis anlegen** | [M] | 30 Min |
| 2 | **`CLAUDE.md` und `docs/architektur-regeln.md` anlegen** — Text liegt fertig in `claude-code-kickoff-struktur.md`, dazu die vier Ergänzungen aus Teil 2.6 | [KI] schreibt, [M] legt an | 1 h |
| 3 | **S0 bauen** — Gerüst, leere Anwendung, erste Migration | [KI] | eine Sitzung |
| 4 | **Eigenen Server für Staging und Prüfläufe einrichten** | [M], Anleitung [KI] | halber Tag |
| 5 | ~~hosttech: Standort klären~~ **Geändert 28.09.2026: Hetzner-VPS anlegen (Standort in der EU!), Auftragsverarbeitungsvertrag erst vor dem ersten echten Menschen, Serverdaten zusammenstellen** (Nr. 99) | [M] | eine Stunde, dann Wartezeit |

**Warum sofort:** S0 implementiert bewusst keine kritische Logik. Es endet mit einem lauffähigen, leeren Grundgerüst — und danach ist alles Weitere eine Frage von Antworten, nicht von Aufbau. **Es gibt keinen Grund zu warten, und einen guten Grund anzufangen:** Man sieht dann, wie eine Sitzung tatsächlich läuft, bevor es um etwas geht.

#### Stufe 2 — sobald zwei Antworten da sind (FV-23, FV-77) und Nr. 98 entschieden ist

**S1 bis S3** — Datenmodell, Standortarchitektur, Bildpipeline. Das sind die drei Sitzungen, die sich **nicht nachträglich reparieren lassen** und die deshalb die volle Aufmerksamkeit brauchen: Zeile für Zeile, 2 bis 4 Stunden je Sitzung.

**Parallel dazu, unabhängig davon:** das Einzelmandat für **K1** auslösen. Der Zugang zum Hash-Abgleich ist nach dem Beschluss vom 27.09.2026 **später** fällig — aber mit Termin: spätestens sechs Monate vor T0.

#### Stufe 3 — nach der Antwort auf K1

**S4 bis S13.** Ab hier ist der Bau durchgängig planbar. Die erste belastbare Schätzung, wie lange er dauert, entsteht **nach S3** — vorher weiß niemand, wie schnell eine Sitzung mit Abnahme tatsächlich läuft.

### 7.2 Warum nicht auf alles warten

Man könnte argumentieren, man solle erst alle Entscheidungen treffen und dann bauen. **Das wäre falsch, aus drei Gründen:**

1. **Der Takt ist nicht der Engpass, die Antworten sind es.** Wer S0 heute baut, verliert nichts, wenn K1 erst in drei Monaten kommt — S1 bis S7 hängen nicht daran.
2. **Die erste Sitzung ist die Lehrsitzung.** Man lernt daran, wie viel Prüfzeit eine Sitzung wirklich kostet. Diese Zahl fehlt bisher in jeder Planung — auch in dieser.
3. **Ein leeres Verzeichnis ist ein psychologisches Hindernis.** Ein laufendes Gerüst mit einer grünen Testausgabe ist eine Einladung.

### 7.3 Was ausdrücklich **nicht** jetzt passiert

- **Kein Produktivsystem mit echten Menschen, solange die GmbH nicht steht.** Nach Nr. 97 entsteht sie etwa drei Monate vor T0 — vorher laufen auf dem Entwicklungsserver nur Testdaten.
- **Kein öffentlicher Start ohne Hash-Abgleich.** Die Sperre ist im Code (AK-M02-11), nicht in einer Absprache.
- **Keine Verträge** mit Prüfanbietern, Hostern oder Stores, die eine Rechtsform verlangen — außer sie sind ausdrücklich durch die Vorgründungsgesellschaft gedeckt (Nr. 26, Nr. 94).
- **Keine Veröffentlichung.** Kein öffentliches Verzeichnis, keine Vorschau, keine Ankündigung. Der Kanalstart liegt in V3 und folgt seinem eigenen Plan.
- **Keine native App.** React Native folgt erst nach der Webfassung (A-51, Nr. 47/76).

---

## Was dieser Plan nicht ist

- **Keine Beauftragung und keine Bestellung.** Kein Konto ist angelegt, kein Server gemietet, kein Gerät gekauft.
- **Keine Preiszusage.** Die Beträge zu Apple, Google und Domains sind **ANNAHMEN** und bei keinem Anbieter erfragt. Die Hetzner-Preise sind belegt und mit Abrufdatum versehen; sie ändern sich.
- **Keine Rechtsberatung.** Die Aussagen zu Art. 9 und Art. 32 DSGVO sind Vorarbeit für die Datenschutz-Folgenabschätzung, keine Prüfung.
- **Keine Zeitschätzung für den Bau.** Sie entsteht nach S3 und wird dann nachgetragen.

---

## Quellen

- `code-planer.md` — Arbeitspakete AP-0 bis AP-15, Sitzungsplan S0 bis S13, externe Blocker
- `claude-code-kickoff-struktur.md` — `CLAUDE.md`, `docs/architektur-regeln.md`, erster Arbeitsauftrag im Wortlaut
- `bauplan-zwei-plattformen.md` — Web zuerst, nativ danach (A-51, Nr. 47 und 76)
- `eu-alternativen-stack.md` — europäische Anbieter je Baustein, mit Abrufdaten
- `../01-steuerung/zeitplan-bis-start.md`, Abschnitt „Wo der Bau liegt" — wo die Sitzungen in den Vorbereitungsfenstern liegen (A-61)
- `../50-produkt-prototyp/festlegungen-die-zwoelf-ausfuehrlich.md` — FV-23 und FV-77, die beiden Antworten vor S1
- `../10-recht-gruendung/anwaltstermin/nachtrag-05-fragen-26-september-2026.md` — K1 als Einzelmandat, G14, G15
- `../40-finanzen-foerderung/finanzmodell.xlsx`, Blatt „Annahmen", Abschnitte 4 und 6 — Kostenstaffel und Einmalkosten
- **Hetzner Docs, „Preisanpassung 15. Juni 2026"** — Cloud-Server Deutschland/Finnland, inkl. 19 % Umsatzsteuer, ohne IPv4: CCX13 von 19,03 € auf **51,16 €**, CAX11 von 5,34 € auf **7,13 €**; gilt für Neubestellungen und Umskalierungen ab 15.06.2026, 8 Uhr MESZ. *Abgerufen 26.09.2026* · <https://docs.hetzner.com/de/general/infrastructure-and-availability/price-adjustment/>
