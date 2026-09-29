# Einrichtung vor dem ersten Code — was gebraucht wird, in welcher Reihenfolge

> ## ⚠ Einrichtungsliste, keine Beauftragung
>
> **Erstellt: 27.09.2026 · Fortgeschrieben: 28.09.2026 · Aufgaben A-70 und A-71 · Grundlage: Beschlüsse Nr. 98 bis 103**
> **Geändert am 28.09.2026:** Der Entwicklungsserver ist ein **Hetzner-VPS mit Ubuntu 24.04 LTS**, nicht hosttech (Entscheidung Nicolas). Abschnitt 3 ist entsprechend gefasst; die vollständige Einrichtung steht in **`server-einrichtung-hetzner.md`**, das Paket zum Hochladen in **`server-paket/`**.
> Dieses Dokument beantwortet eine Frage: **Was muss Henry einrichten, damit gebaut werden kann — und was nicht.**
> Der **Bauplan** (welche Funktion wann) steht in `code-planer.md`, das **Gerüst der ersten Sitzung** in `claude-code-kickoff-struktur.md`, die **Umgebungs- und Abnahmeregeln** in `start-der-code-phase.md`. Dieses Dokument ist die Einkaufs- und Einrichtungsliste dazu.
> **Alle Angaben zur Erreichbarkeit und zu vorhandenen Werkzeugen sind am 27.09.2026 gemessen**, nicht angenommen — die Messwerte stehen in Abschnitt 1. **Nichts davon ist bestellt, beauftragt oder unterschrieben.**

---

## Auf einen Blick

| | |
|---|---|
| **Was jetzt gebraucht wird** | **ein leeres Verzeichnis, verbunden.** Sonst nichts. Damit lassen sich S0, S1 und S2 vollständig bauen und prüfen |
| **Was als nächstes gebraucht wird** | der **Entwicklungsserver** — seit 28.09.2026 ein **Hetzner-VPS mit Ubuntu 24.04 LTS** (vorher hosttech). Ab **S4**, nicht vorher. Anleitung und Paket: `server-einrichtung-hetzner.md` und `server-paket/` |
| **Was noch warten kann** | Apple-Konto, Google-Play-Konto, Gerätepool, Domain, Mail- und SMS-Versand |
| **Was gemessen wurde und den Plan ändert** | **Codeberg und GitLab sind aus beiden Claude-Umgebungen gesperrt.** Eine Fernablage dort könnte die KI nicht bedienen. Der Code beginnt deshalb **lokal**; die Fernablage hängt Henry später von Windows aus an (dort gibt es keine Sperre) |
| **Was die KI ohne Server prüfen kann** | **PostgreSQL 16 mit PostGIS 3.4 läuft in der Arbeitsumgebung der KI** — getestet am 27.09.2026. Migrationen, Zugriffsregeln, Löschkaskaden und der Trilaterationstest sind damit ohne Server prüfbar |
| **Kosten der Einrichtung jetzt** | **0 €** |

---

## 1 · Was tatsächlich vorhanden ist — Messung vom 27.09.2026

Drei Orte sind zu unterscheiden. Sie können Verschiedenes, und das entscheidet, wer welchen Schritt macht.

| | **Arbeitsumgebung der KI** (Anthropic-Wolke) | **Claude auf deinem Rechner** (die Linux-Umgebung des Desktop-Programms) | **Dein Windows / der Hetzner-VPS** |
|---|---|---|---|
| `git` | ✔ 2.43 | ✔ 2.34 | musst du einrichten |
| `node` / `npm` | ✔ 22.22 / 10.9 · **Installationen funktionieren** (geprüft) | ✔ 22.23 / 10.9 | musst du einrichten |
| **Docker** | vorhanden, aber **kein laufender Dienst** → nicht nutzbar | **fehlt** | ✔ auf dem Server möglich |
| **PostgreSQL + PostGIS** | ✔ **16.15 + PostGIS 3.4, läuft** (getestet) | fehlt | **17** auf dem Server (Ziel) |
| `ssh` | — | **fehlt** | ✔ |
| `registry.npmjs.org` | ✔ 200 | ✔ 200 | ✔ |
| `github.com` | ✔ `git ls-remote` erfolgreich | ✔ 200 | ✔ |
| **`codeberg.org`** | ✖ **403 am Proxy** (zweimal geprüft) | ✖ nicht erreichbar | ✔ |
| **`gitlab.com`** | ✖ nicht erreichbar | ✖ nicht erreichbar | ✔ |
| `apt.postgresql.org` | ✖ nicht erreichbar (deshalb 16 statt 17) | — | ✔ |

**Drei Folgerungen, die den Plan wirklich ändern:**

1. **Die Fernablage des Codes ist kein Startbedingung, sondern eine späte Kür.** Codeberg war die Empfehlung aus A-67 — es ist aus beiden Claude-Umgebungen gesperrt. Ein Verzeichnis, das die KI nicht erreicht, hilft beim Bauen nichts. Also: **lokal beginnen**, Fernablage nachziehen.
2. **Der Entwicklungsserver ist nicht für S1 nötig, sondern erst für S4.** Datenmodell, Zugriffsregeln, Löschkaskaden und Standortarchitektur lassen sich gegen die lokale Datenbank der KI vollständig bauen **und mit Testbelegen abnehmen**. Das verschiebt die einzige echte Serverarbeit nach hinten.
3. **Selbst gehostetes Supabase braucht Docker — und Docker gibt es nur auf deinem Server.** Weder die KI-Umgebung noch Claude auf deinem Rechner können es ausführen. Die KI **schreibt** die Einrichtung, **ihr führt sie auf dem Server aus** — seit 28.09.2026 vollständig als Paket in `server-paket/`, mit Anleitung in `server-einrichtung-hetzner.md`. Das ist keine Bequemlichkeit, sondern die einzige mögliche Aufteilung.

> **Ein Versionsunterschied, benannt:** Die Spezifikation und der Bauplan nennen **PostgreSQL 17**; die Arbeitsumgebung der KI hat **16**. Migrationen werden **17-verträglich** geschrieben (keine 16-eigenen Konstrukte) und vor S4 gegen eine echte 17 auf dem Server nachgeprüft. Bis dahin gilt jeder Prüfbeleg unter dem Vorbehalt „auf 16 geprüft".

---

## 2 · Jetzt — ein Schritt, 0 €

### 2.1 Das Verzeichnis für den Code

| | |
|---|---|
| **Was** | ein **leeres** Verzeichnis anlegen: `C:\Users\henry\Desktop\cruizy-code` |
| **Dann** | im Claude-Desktop-Programm **„Ordner hinzufügen"** und dieses Verzeichnis verbinden |
| **Dauer** | eine Minute |
| **Kosten** | 0 € |

**Warum ein eigenes Verzeichnis und kein Unterordner von `Cruizy`:** Ein Node-Projekt legt `node_modules` an — zehntausende Dateien. Im Dokumentenordner würde das die Abgleichprüfung (`prepare_commit.py`), die Integritätsprüfung und die Dateizählung überfluten und jede Übertragung verlangsamen. Getrennte Verzeichnisse halten beides sauber: **`Cruizy` ist ein Archiv, `cruizy-code` ist ein Programm.**

**Was danach von allein passiert:** Die KI legt in diesem Verzeichnis das Gerüst an — `CLAUDE.md`, `docs/architektur-regeln.md`, den Ordnerbaum aus `claude-code-kickoff-struktur.md`, `.gitignore`, die leere Anwendung — und richtet die **lokale Versionsverwaltung** ein. Das ist Sitzung **S0**.

### 2.2 Was ausdrücklich **nicht** jetzt gebraucht wird

| | Warum nicht |
|---|---|
| **Git-Hoster** | Die Versionsverwaltung ist zunächst lokal: Verlauf, Rückrollen und Abnahmeprotokolle funktionieren vollständig ohne Fernablage. **Was fehlt, ist die zweite Kopie außerhalb des Rechners** — also sichere den Ordner, bis eine Fernablage steht (Abschnitt 4.1) |
| **Node.js auf Windows** | erst, wenn du die Anwendung selbst starten willst. Für die Abnahme reicht zunächst Lesen und der Prüfbeleg |
| **Server** | erst ab S4 |
| **Domain** | Der Name steht überall als Konfigurationswert (Nr. 102, Teil 2); die drei Teile, die wirklich am Namen hängen, werden zuletzt gebaut |

---

## 3 · Vor Sitzung S4 — der Entwicklungsserver

**S4 baut Anmeldung, Gastmodus, Sicherungen und Überwachung.** Dafür braucht es zum ersten Mal die echte Umgebung: Supabase mit Anmeldung, Objektspeicher und laufender Datenbank.

### 3.1 Was ich von dir brauche, um die Einrichtung zu schreiben

| | Was | Warum |
|---|---|---|
| **1** | ~~Serverdaten von hosttech~~ **Erledigt am 28.09.2026:** Der Server wird neu angelegt, die Größe also beim Anlegen gewählt | **Empfehlung: 4 Kerne, 8 GB Arbeitsspeicher, 80 GB SSD.** Supabase nennt als Minimum 2 Kerne, 4 GB und 40 GB SSD *(abgerufen 28.09.2026)*. Einrichtung: `server-einrichtung-hetzner.md` |
| **2** | **Betriebssystem-Zugang** (SSH) — für **dich**, nicht für mich | Claude auf deinem Rechner hat kein `ssh`; die Arbeitsumgebung der KI erreicht deinen Server nicht. **Du führst aus, ich schreibe** |
| **3** | **Eine Subdomain oder feste IP** für den Server | Die Supabase-API und die Staging-Oberfläche brauchen eine Adresse. Eine Subdomain einer Domain, die du ohnehin hast, genügt — sie muss nicht die endgültige Produktdomain sein (Nr. 5) |

### 3.2 Was auf dem Server eingerichtet wird

| | Was | Wer |
|---|---|---|
| **1** | **Docker und Docker Compose** | du, ein Befehl |
| **2** | **Selbst gehostetes Supabase** — PostgreSQL 17 mit PostGIS, PostgREST, Anmeldung (GoTrue), Objektspeicher, Studio | ich schreibe die Compose-Datei und die Schritte, du führst sie aus |
| **3** | **Redis** und **imgproxy** | dito |
| **4** | **Sicherung mit geprobter Wiederherstellung** — nicht nur Sicherung, sondern ein **einmal durchgespieltes** Zurückspielen (Art. 32 DSGVO verlangt Wiederherstellbarkeit; eine nie zurückgespielte Sicherung ist eine Vermutung) | ich schreibe das Skript, du führst es aus und bestätigst |
| **5** | **Die Regel, die für die ganze Bauzeit gilt** | **auf diesem Server liegen ausschließlich erfundene Daten.** Keine Wartelistenadressen, keine Interviewaufnahmen, keine Umfrageantworten. Sobald ein echter Mensch drauf ist, greift die DSGVO vollständig — und dann braucht es Auftragsverarbeitungsvertrag, Verarbeitungsübersicht und Folgenabschätzung (Nr. 99, Nr. 103) |

### 3.3 Mail- und SMS-Versand

S4 verschickt Bestätigungen und Anmeldecodes. Die Empfehlung steht bereits in `../10-recht-gruendung/maildienst-nachtrag-2026-09.md`, Abschnitt 4, und wird hier nur eingeordnet:

| | Was | Wann | Kosten |
|---|---|---|---|
| **Mail** | **listmonk selbst betrieben** auf demselben Server, Versand über einen europäischen Versandweg. Rückfallebene: **rapidmail** (Freiburg) | vor S4 | Versandkosten, kleines Volumen fast null |
| **SMS** | **Sweego** oder gleichwertig in der EU — reicht eingehende Mails auch als Webhook weiter und löst damit K9 und den Kontaktservice mit | vor S4 | **0,078 € je SMS** (A-52, abgerufen 21.09.2026) |

**Für den Bau genügt zunächst ein Testmodus**, der Mails und SMS ins Protokoll schreibt statt zu versenden. Ein Konto brauchst du erst, wenn ein echter Code an ein echtes Gerät gehen soll.

---

## 4 · Später — mit dem Zeitpunkt, an dem es fällig wird

### 4.1 Fernablage des Codes — wann und wohin

Sobald der Code eine zweite Kopie außerhalb deines Rechners haben soll, und das sollte **nicht lange** dauern. Drei Wege, mit dem, was die Messung über sie sagt:

| Weg | Erreichbar für die KI | Bewertung |
|---|---|---|
| **Selbst gehostetes Forgejo** auf dem Hetzner-VPS | vermutlich **nein** (eigene Domains liegen nicht in der Freigabeliste) | **Inhaltlich der sauberste Weg** — keine dritte Partei, alles im eigenen Haus, passt zu G-01 ohne jede Fußnote. Du schiebst von Windows, die KI arbeitet weiter über das verbundene Verzeichnis |
| **GitHub**, privates Verzeichnis | **ja** (geprüft) | Funktioniert heute und die KI kann es bedienen. **Aber:** US-Unternehmen. G-01 spricht von **Auftragsverarbeitern** — ein Quellcodeverzeichnis ohne Personenbezug ist keiner, der Grundsatz ist also nicht wörtlich verletzt. Dem Geist widerspricht es trotzdem, und das ist **deine Entscheidung, nicht meine** |
| **Codeberg** (Verein, Deutschland) | **nein** — 403 am Proxy | Wäre erste Wahl gewesen. Für dich von Windows aus nutzbar, für die KI nicht |

**Mein Vorschlag:** Forgejo auf dem Server, wenn er ohnehin eingerichtet wird (Abschnitt 3) — dann liegt alles an einem Ort, den du besitzt. Bis dahin: **sichere das Verzeichnis `cruizy-code` mit, wie du den Dokumentenordner sicherst.**

### 4.2 Konten und Geräte

| | Was | Wann fällig | Kosten | Haken |
|---|---|---|---|---|
| **1** | **Apple-Entwicklerkonto** | wenn S4 die Anmeldung mit Apple baut; spätestens S12 | **99 US-Dollar im Jahr** (ANNAHME, nicht erfragt) | Verlangt eine natürliche Person oder eine Rechtsform. Da die GmbH erst später entsteht (Nr. 97), läuft es zunächst auf eine Privatperson — **ein Punkt für Nr. 94**, weil die Kosten dann privat anfallen |
| **2** | **Google-Play-Entwicklerkonto** | S12 | **25 US-Dollar einmalig** (ANNAHME) | dito |
| **3** | **Gerätepool** — altes Android, altes iPhone, dazu je ein neueres | die Leistungsmessungen in **S7 und S13** | **1.500 €** Grundpool, **1.200 €** für die zweite Plattform (A-51, A-52) | Alte Geräte sind der Zweck, nicht der Kompromiss: Was auf einem drei Jahre alten Android nachts bei schlechtem Netz läuft, läuft überall |
| **4** | **Domain** | nach den Interviews (Nr. 5) | 10 bis 30 € im Jahr | Bis dahin Konfigurationswert |
| **5** | **KI-Werkzeuge für die Entwicklung** | laufend | im Modell **100 € im Monat** | bereits im Finanzmodell |

### 4.3 Eine technische Entscheidung, die noch keine Frage an dich ist

**Welcher Klassifikator prüft Stufe 2 der Bildprüfung?** `AK-M02-07` verlangt: Er läuft **auf eigenen Servern**, kein Bild verlässt dafür unsere Infrastruktur. Das schließt jede Cloud-API aus und begrenzt die Auswahl auf selbst hostbare Modelle. Für den Bau genügt zunächst eine Attrappe wie bei Stufe 1; **vor der Testphase** braucht es ein echtes Modell, und dazu gehört die Verzerrungsprüfung bei Hauttönen und Körperformen (`AK-M02-09`, Nr. 32). **Die KI legt dazu einen Vergleich vor, bevor S3 abgenommen wird** — dann ist es eine Entscheidung mit Zahlen, nicht mit Vermutungen.

---

## 5 · Die Reihenfolge, auf eine Seite

| # | Wer | Was | Blockiert |
|---|---|---|---|
| **1** | **[M]** | `cruizy-code` anlegen und verbinden | **S0** |
| **2** | [KI] | **S0** — Gerüst, `CLAUDE.md`, Architekturregeln, Ordnerbaum, lokale Versionsverwaltung | — |
| **3** | [KI] | **S1** — Datenmodell, Löschkaskaden, Export · geprüft gegen die lokale Datenbank | — |
| **4** | [KI] | **S2** — Standortarchitektur · mit Trilaterationstest | — |
| **5** | [KI] | **S3** — Bildpipeline mit Steckplatz für Stufe 1 und Prüfanbieter | — |
| **6** | **[M]** | **Serverdaten** nennen · Docker einrichten · Subdomain zeigen lassen | **S4** |
| **7** | [KI] + [M] | **Entwicklungsserver** aufsetzen, Sicherung einmal zurückspielen | **S4** |
| **8** | [KI] | **S4 bis S13** — der Rest des Baus | — |
| **9** | **[M]** | **Fernablage** anhängen, sobald sie steht | nichts, aber je früher je besser |
| **10** | **[M]** | Apple- und Google-Konto, Gerätepool | S7, S12, S13 |
| **11** | **[M]** | **Nach dem Bau:** Fachanwalt → Korrekturen → Code-Prüfung → Hash-Anbieter und Prüfanbieter → Gründung → Produktionsserver → Steuerberater | **den Betrieb mit echten Menschen** |

**Der eine Satz zur Reihenfolge:** Schritt 1 kostet eine Minute und null Euro, und danach läuft der Bau vier Sitzungen weit ohne eine weitere Menschenhandlung.

---

## Was dieses Dokument nicht ist

Keine Bestellung, keine Beauftragung, kein Vertrag. Alle Preise sind **Annahmen**, soweit nicht mit Abrufdatum belegt — Apple und Google sind nicht erfragt, der Gerätepool ist der Modellwert aus A-52. Die Messwerte in Abschnitt 1 gelten für den **27.09.2026**; Freigabelisten können sich ändern, und dann ändert sich die Empfehlung zur Fernablage mit.

## Quellen

**Projektintern:** `start-der-code-phase.md` (A-67) · `code-planer.md` · `claude-code-kickoff-struktur.md` · `../01-steuerung/beschluesse-2026-09-27.md` (Abschnitte 9 und 10) · `../01-steuerung/offene-entscheidungen.md` (Nr. 94, 99 bis 103) · `../10-recht-gruendung/maildienst-nachtrag-2026-09.md` (A-42) · `../10-recht-gruendung/hash-abgleich-zugangswege.md` (A-08) · `../50-produkt-prototyp/produktspezifikation.md` (M-02, AK-M02-07 bis -13) · `../00-grundlagen/grundsatzbeschluesse.md` (G-01) · `../40-finanzen-foerderung/finanzmodell.xlsx` (A-52).

**Gemessen am 27.09.2026** in der Arbeitsumgebung der KI und in der Linux-Umgebung des Claude-Desktop-Programms: Werkzeugversionen, Erreichbarkeit der genannten Adressen, Start von PostgreSQL 16 mit PostGIS 3.4, eine npm-Installation. Keine externen Quellen; nichts davon ist erfragt oder bestellt.
