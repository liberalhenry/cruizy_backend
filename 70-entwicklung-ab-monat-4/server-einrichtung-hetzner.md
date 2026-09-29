# Cruizy-Entwicklungsserver auf einem Hetzner-VPS — Schritt für Schritt

**Erstellt: 28.09.2026 · Aufgabe A-71 · Für: Nicolas Greulich**
**Paketfassung 1.0 · Alle Webangaben am 28.09.2026 abgerufen, Quellen am Ende.**

> **Das hier ist die gepflegte Fassung im Projektordner.** Inhaltsgleich liegt sie als
> `ANLEITUNG.md` im Paket `server-paket/cruizy-server-setup.zip` — das ist die
> Mitnahmefassung für den Server. Ändert sich etwas, ändert es sich **hier** zuerst,
> und das Paket wird neu erzeugt.

---

> ## ⚠ Was dieser Server ist und was nicht
>
> Das hier wird der **Entwicklungsserver**: Bauen, Prüfläufe, Staging. **Nicht die Produktion.**
>
> **Eine Regel gilt ohne Ausnahme für die ganze Bauzeit: auf diesem Server liegen ausschließlich erfundene Daten.** Keine Wartelistenadressen, keine Interviewaufnahmen, keine Umfrageantworten, keine echten Profile. Solange das gilt, werden keine personenbezogenen Daten verarbeitet, und es braucht **keinen Auftragsverarbeitungsvertrag**. Ab dem ersten echten Menschen greift die DSGVO vollständig — dann gilt Abschnitt 12.

---

## Auf einen Blick

| | |
|---|---|
| **Dauer** | 60 bis 90 Minuten, davon viel Warten auf Downloads |
| **Was entsteht** | Ubuntu-Server, gehärtet · Docker · selbst gehostetes Supabase mit PostgreSQL und PostGIS · tägliche Sicherung mit einmal geprobter Rückspielung |
| **Erreichbarkeit** | **nichts** aus dem Internet außer SSH. Die Oberfläche kommt über einen SSH-Tunnel. Ein Zugang mit Verschlüsselung folgt später (Abschnitt 10) |
| **Der wichtigste Einzelschritt** | **Abschnitt 2: der Standort.** Falsch gewählt und der ganze Datenschutzansatz des Projekts ist gebrochen |
| **Die Prüfung, die sich lohnt** | **Abschnitt 8: der Rauchtest.** Er fängt einen bekannten Fehler ab, der sonst erst in Sitzung S2 auffällt — und dann teuer ist |

---

## 1 · Was du brauchst, bevor du anfängst

| | |
|---|---|
| Ein **SSH-Schlüsselpaar** auf deinem Rechner | Prüfen mit `ls ~/.ssh/id_ed25519.pub`. Fehlt es: `ssh-keygen -t ed25519 -C "cruizy"` |
| Ein **Hetzner-Cloud-Konto** | <https://console.hetzner.cloud> |
| Dieses Paket | `cruizy-server-setup.zip` |
| Etwa **60 bis 90 Minuten** am Stück | Die SSH-Härtung sollte man nicht halb fertig stehen lassen |

---

## 2 · Den Server bestellen — und der eine Punkt, bei dem nichts schiefgehen darf

### 2.1 Der Standort

Hetzner hat sechs Standorte *(abgerufen 28.09.2026)*:

| Standort | Kürzel | Land | Für Cruizy |
|---|---|---|---|
| **Falkenstein** | `fsn1` | Deutschland | ✔ **nimm den** |
| **Nürnberg** | `nbg1` | Deutschland | ✔ gleichwertig |
| **Helsinki** | `hel1` | Finnland | ✔ EU, auch in Ordnung |
| Ashburn, Virginia | `ash` | **USA** | ✖ **niemals** |
| Hillsboro, Oregon | `hil` | **USA** | ✖ **niemals** |
| Singapur | `sin` | Singapur | ✖ **niemals** |

> **Warum das keine Geschmacksfrage ist.** Grundsatzbeschluss **G-01** des Projekts lautet: *„Auftragsverarbeiter mit Sitz oder Datenhaltung in den Vereinigten Staaten von Amerika werden nicht eingesetzt."* Dieser Satz trägt die gesamte Außendarstellung — Einseiter, Einwand-Handbuch, Förderpräsentation und die Antwort auf die Frage, warum Cruizy anders ist als die bestehenden Anbieter. Ein Server in Ashburn bricht ihn, auch wenn zunächst nur Testdaten darauf liegen, weil aus einem Entwicklungsserver erfahrungsgemäß der Produktionsserver wird.
>
> **Empfehlung: Falkenstein.** Deutschland, größter Standort, und die Sicherungsspeicher (Storage Box) liegen dort ebenfalls — das spart später Übertragungswege.

### 2.2 Die Größe

Supabase nennt als Mindestanforderung für Entwicklung **2 Kerne, 4 GB Arbeitsspeicher, 40 GB SSD** *(abgerufen 28.09.2026)*.

| | Empfehlung |
|---|---|
| **Kerne** | 4 — die Bildverarbeitung (imgproxy) und Prüfläufe danken es |
| **Arbeitsspeicher** | **8 GB.** Mit 4 GB startet der Stack, aber ein Container kann beim Hochfahren vom System abgeschossen werden. Das Vorprüfskript legt deshalb 2 GB Auslagerungsspeicher an |
| **Platte** | 80 GB — Abbilder, Datenbank, Sicherungen und Protokolle zusammen |
| **Prozessorart** | Für den Anfang gleich. Die ARM-Reihe (`CAX`) ist günstiger, aber **nicht alle Abbilder gibt es für ARM** — nimm für den Entwicklungsserver einen x86-Typ (`CX` oder `CPX`), dann fällt diese Fehlerquelle weg |

**Preise nennen wir hier nicht** — sie ändern sich, und wir haben sie nicht erfragt. Der Preisrechner in der Hetzner-Konsole zeigt sie beim Anlegen an. *(ANNAHME A-72: rund 10 bis 20 € im Monat für die genannte Größe — nicht erfragt, vor der Buchung selbst prüfen.)*

### 2.3 Beim Anlegen einstellen

| | |
|---|---|
| **Abbild** | **Ubuntu 24.04 LTS** |
| **Standort** | Falkenstein (siehe 2.1) |
| **SSH-Schlüssel** | **Deinen öffentlichen Schlüssel jetzt hinterlegen.** Dann kommt kein Passwort per Mail, und Schritt 4 wird einfacher |
| **Backups** | Hetzners eigene Sicherung kannst du dazubuchen. Sie ersetzt Abschnitt 11 **nicht** — sie sichert die ganze Maschine, nicht die Datenbank in einem wiederherstellbaren Zustand. Beides zusammen ist richtig |
| **IPv4** | ja. Ohne IPv4 wird vieles unnötig kompliziert |
| **Firewall (Hetzner)** | Kannst du zusätzlich einschalten: eingehend nur Port 22. Das liegt **vor** dem Server und fängt auch das ab, was Docker an ufw vorbeischiebt |
| **Name** | z. B. `cruizy-dev-fsn1` |

---

## 3 · Erste Anmeldung und Paket hochladen

Von **deinem** Rechner, nicht vom Server:

```bash
ssh root@<SERVER-IP>
```

Beim ersten Mal fragt SSH nach dem Fingerabdruck — vergleiche ihn mit dem, den die Hetzner-Konsole anzeigt, und bestätige mit `yes`.

Dann das Paket hochladen (neues Fenster auf deinem Rechner):

```bash
scp cruizy-server-setup.zip root@<SERVER-IP>:/root/
```

Auf dem Server entpacken:

```bash
apt-get update && apt-get install -y unzip
unzip -q /root/cruizy-server-setup.zip -d /root/
cd /root/cruizy-server-setup
ls -la
```

**Prüfsumme vergleichen** — sie steht in `FASSUNG.txt` und in der Chatnachricht, mit der du das Paket bekommen hast:

```bash
sha256sum /root/cruizy-server-setup.zip
```

Stimmt sie nicht überein, **nicht weitermachen**: dann ist unterwegs etwas verändert worden.

---

## 4 · Vorprüfung

```bash
sudo bash skripte/00-vorpruefung.sh
```

Ändert nichts. Prüft Betriebssystem, Kerne, Arbeitsspeicher, Platte, Auslagerungsspeicher, belegte Anschlüsse, Uhrzeit und ob die drei Adressen erreichbar sind, ohne die die Einrichtung scheitert.

**Läuft es rot aus, erst das beheben.** Jeder rote Punkt kostet später mehr Zeit als jetzt.

---

## 5 · Grundhärtung

```bash
sudo bash skripte/01-grundhaertung.sh
```

Was passiert:

| | |
|---|---|
| **Dienstnutzer `cruizy`** | wird angelegt, mit `sudo`-Recht, ohne Passwort — Anmeldung nur per Schlüssel |
| **SSH** | root-Anmeldung aus, Passwortanmeldung aus, nur `cruizy` darf sich anmelden, höchstens 3 Versuche |
| **Firewall** | alles zu außer SSH |
| **fail2ban** | 3 Fehlversuche in 10 Minuten → 1 Stunde gesperrt |
| **Sicherheitsaktualisierungen** | automatisch. **Neustarts ausdrücklich nicht** — die bleiben eure Entscheidung |
| **Zeitzone** | Europe/Berlin |
| **Auslagerungsspeicher** | 2 GB, falls weniger als 1 GB da war |

> ### ⚠ Der Moment, in dem man sich aussperrt
>
> Das Skript schaltet die Passwortanmeldung ab. Es prüft vorher, ob für `cruizy` ein Schlüssel hinterlegt ist, und bricht sonst ab — aber **prüfe trotzdem selbst**, bevor du das Fenster schließt:
>
> ```bash
> # ZWEITES Fenster auf deinem Rechner, das erste offen lassen:
> ssh cruizy@<SERVER-IP>
> ```
>
> Klappt das, ist alles gut. Klappt es nicht, hast du im ersten Fenster noch root und kannst `/etc/ssh/sshd_config.d/10-cruizy.conf` löschen und `systemctl reload ssh` aufrufen.

Danach als `cruizy` weiterarbeiten und das Paket mitnehmen:

```bash
sudo cp -r /root/cruizy-server-setup /opt/cruizy/paket
sudo chown -R cruizy:cruizy /opt/cruizy/paket
exit
ssh cruizy@<SERVER-IP>
cd /opt/cruizy/paket
```

---

## 6 · Docker

```bash
sudo bash skripte/02-docker.sh
```

Holt Docker aus der offiziellen Paketquelle, begrenzt die Container-Protokolle auf 5 × 20 MB je Container (sonst füllen sie mit der Zeit die Platte), nimmt `cruizy` in die Gruppe `docker` auf und macht einen Funktionstest.

**Danach einmal ab- und wieder anmelden** — die Gruppenzugehörigkeit greift erst bei einer neuen Sitzung:

```bash
exit
ssh cruizy@<SERVER-IP>
cd /opt/cruizy/paket
docker ps    # muss ohne sudo funktionieren
```

---

## 7 · Supabase holen und Geheimnisse erzeugen

```bash
bash skripte/03-supabase-holen.sh
```

**Ohne `sudo`.** Was passiert:

1. Das offizielle Supabase-Verzeichnis wird geholt (Zweig `self-hosted/v0.8.2`, siehe Abschnitt 14) und nach `/opt/cruizy/supabase` kopiert.
2. Der genaue Feststand wird in `/opt/cruizy/HERKUNFT.txt` notiert — **damit später nachvollziehbar ist, gegen welchen Stand gebaut wurde.**
3. Die offiziellen Skripte `utils/generate-keys.sh` und `utils/add-new-auth-keys.sh` erzeugen alle Geheimnisse und das JWT-Schlüsselpaar.
4. `.env` wird auf `600` gesetzt und auf stehengebliebene Beispielwerte durchsucht.
5. **`docker-compose.override.yml` wird erzeugt** und bindet jeden veröffentlichten Anschluss auf `127.0.0.1`.

> ### Warum Schritt 5 wichtiger ist, als er aussieht
>
> Docker trägt seine Weiterleitungsregeln **unterhalb** von ufw in die Firewall ein. Ein Container, der `0.0.0.0:5432` öffnet, ist damit aus dem Internet erreichbar — obwohl `ufw status` „deny incoming" meldet. Das ist kein Fehler von ufw, sondern die dokumentierte Arbeitsweise von Docker, und es ist eine der häufigsten Ursachen für offen im Netz stehende Datenbanken.
>
> Das Skript liest die tatsächliche Compose-Konfiguration aus und biegt jeden offenen Anschluss um. Es rät nicht, wie die Dienste heißen — damit funktioniert es auch, wenn Supabase seine Dienste umbenennt.

### Drei Werte musst du von Hand setzen

```bash
nano /opt/cruizy/supabase/.env
```

| Schlüssel | Vorläufig eintragen | Später, mit Unterdomain |
|---|---|---|
| `SUPABASE_PUBLIC_URL` | `http://127.0.0.1:8000` | `https://<unterdomain>` |
| `API_EXTERNAL_URL` | `http://127.0.0.1:8000` | `https://<unterdomain>` |
| `SITE_URL` | `http://127.0.0.1:3000` | die Adresse der Anwendung |
| `DASHBOARD_USERNAME` | frei wählbar | |
| `DASHBOARD_PASSWORD` | **langes, zufälliges Passwort** — z. B. `openssl rand -base64 24` | |

Das Passwort für die Datenbank hat das Skript erzeugt; es steht in derselben Datei unter `POSTGRES_PASSWORD`. **Verwende dort nur Buchstaben und Ziffern** — Sonderzeichen brechen die Verbindungszeichenfolgen mancher Dienste *(Hinweis der Supabase-Dokumentation, abgerufen 28.09.2026)*.

---

## 8 · Starten, PostGIS einrichten, Rauchtest

```bash
bash skripte/04-starten-und-postgis.sh
```

Das ist der inhaltlich wichtigste Schritt. Er holt die Abbilder, startet den Stack, wartet bis die Datenbank antwortet, meldet die Postgres-Fassung, richtet PostGIS ein — und fährt danach einen **Rauchtest**.

### Was der Rauchtest prüft und warum es ihn braucht

Für selbst gehostetes Supabase ist mehrfach berichtet worden, dass Abfragen mit PostGIS **im SQL-Editor laufen, über `rpc()` aber scheitern** — mit `type "geometry" does not exist` *(Fehlerbericht 27295 im Supabase-Verzeichnis, abgerufen 28.09.2026)*. Ursache ist der Suchpfad der Rolle, mit der PostgREST verbindet: Das Schema, in dem die PostGIS-Typen liegen, steht nicht darin.

**Für Cruizy ist das kein Randfall.** Die gesamte Standortarchitektur — Entfernungsbänder, Rasterzellen, der Trilaterationsschutz — rechnet mit `geometry` über genau diesen Weg. Fällt es erst in Sitzung S2 auf, steht das Datenmodell schon.

`sql/10-postgis.sql` behebt es, und zwar so:

| | |
|---|---|
| 1 | PostGIS wird ins Schema `extensions` gelegt, nicht nach `public` — `public` bleibt für die eigenen Tabellen frei |
| 2 | **Eine vorhandene PostGIS-Installation wird nicht verschoben.** Das Skript liest aus, in welchem Schema sie tatsächlich liegt, und baut den Suchpfad danach. Das Verschieben von PostGIS zwischen Schemata ist fehleranfällig; der Suchpfad ist die verlässlichere Stelle |
| 3 | Der Suchpfad wird für **alle** beteiligten Rollen gesetzt: `anon`, `authenticated`, `service_role`, `authenticator` — **und für `postgres` und `supabase_admin`**, weil mit denen die Migrationen laufen. Ohne sie scheitert schon ein `CREATE TABLE` mit einer `geometry`-Spalte |
| 4 | Zusätzlich auf Datenbankebene, für Werkzeuge, die mit einer hier nicht aufgeführten Rolle verbinden |

Der Rauchtest legt dann eine Wegwerf-Tabelle mit einer `geometry`-Spalte an, fragt sie **als `anon` über die Rolle `authenticator`** ab — genau so, wie PostgREST es tut — und zusätzlich **über die REST-Schnittstelle**. Kommt die Entfernung zurück, trägt der Stack. Danach räumt er sich selbst weg.

**Scheitert der Rauchtest, bricht das Skript ab.** Das ist Absicht: Weiterbauen auf einem Stack, der `geometry` nicht auflöst, kostet mehr als hier stehenzubleiben.

### Zur Postgres-Fassung

Neuinstallationen bekommen seit Mitte Juni 2026 **PostgreSQL 17** *(Supabase-Änderungsprotokoll, abgerufen 28.09.2026)* — das ist die Fassung, die die Produktspezifikation nennt. Das Skript meldet, was tatsächlich läuft. Steht dort etwas anderes, ist das kein Hindernis für den Bau, gehört aber in die Abnahme.

### Die Oberfläche ansehen

Von **deinem** Rechner:

```bash
ssh -L 8000:127.0.0.1:8000 cruizy@<SERVER-IP>
```

Solange das Fenster offen ist, im Browser: **<http://127.0.0.1:8000>** — Anmeldung mit `DASHBOARD_USERNAME` und `DASHBOARD_PASSWORD`.

---

## 9 · Wenn der Rauchtest scheitert

| Meldung | Ursache | Abhilfe |
|---|---|---|
| `type "geometry" does not exist` **als anon** | Suchpfad greift nicht | `docker compose restart rest` — PostgREST hält seine Verbindungen und liest den Suchpfad erst bei einer neuen. Dann Rauchtest erneut |
| dasselbe **auch nach dem Neustart** | Rolle übersehen | `docker compose exec -T db psql -U postgres -c "\du"` zeigt alle Rollen. Fehlt eine in `sql/10-postgis.sql`, dort ergänzen und noch einmal laufen lassen |
| dasselbe, **hartnäckig** | Dokumentierte Notlösung | PostGIS zusätzlich nach `public`: `CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;` — funktioniert laut Fehlerbericht, verschmutzt aber `public` mit einigen hundert Funktionen. Nur, wenn nichts anderes hilft, und dann vermerken |
| REST antwortet gar nicht | Tor nicht bereit | `docker compose logs --tail=50` ansehen. Der Datenbankteil des Rauchtests ist dann trotzdem aussagekräftig |
| Ein Dienst startet nicht | meist Arbeitsspeicher | `docker compose logs <dienst> --tail=50`. Bei 4 GB: Auslagerungsspeicher prüfen (`free -h`) |

---

## 10 · Sicherung

```bash
sudo bash skripte/05-sicherung-einrichten.sh
```

| | |
|---|---|
| **Was gesichert wird** | Datenbank per `pg_dumpall` (also **mit Rollen und deren Suchpfaden** — genau die, die PostGIS tragbar machen), dazu `.env`, die Anschlussbindung, die Herkunftsdatei und der Objektspeicher |
| **Wann** | täglich, zu einer zufällig gewählten Minute nach 3 Uhr. Verpasste Läufe werden nachgeholt |
| **Wie lange** | 14 Tage |
| **Geprüft wird** | jede Sicherung sofort: gültiges gzip, plausible Größe, Postgres-Abzug im Inhalt |
| **Und einmal richtig** | Das Skript spielt die erste Sicherung **in eine Wegwerf-Datenbank zurück** und zählt, wie viele Tabellen entstehen. Die laufende Datenbank bleibt unberührt |

**Warum die Probe-Rückspielung nicht wegzulassen ist:** Art. 32 Abs. 1 lit. c DSGVO verlangt die Fähigkeit, die Verfügbarkeit personenbezogener Daten **rasch wiederherzustellen**. Eine Sicherung, die nie zurückgespielt wurde, ist eine Vermutung, keine Fähigkeit. Diese eine Probe ist der Unterschied.

Jederzeit wiederholbar:

```bash
CRUIZY_PROBE=1 bash /opt/cruizy/sicherung/zurueckspielen.sh /opt/cruizy/sicherungen/db_<datum>.sql.gz
```

---

## 11 · Was danach noch fehlt — offen benannt

### 11.1 Die zweite Kopie

Die Sicherungen liegen **auf demselben Server wie die Daten**. Gegen einen Plattenfehler hilft das. Gegen Verlust des Servers, ein versehentliches Löschen oder eine Erpressung nicht.

**Vorschlag:** eine Hetzner Storage Box in Falkenstein, per `rclone` oder `restic` verschlüsselt beschickt. Sobald der Standort steht, schreibe ich das Skript dazu — es gehört nicht in dieses Paket, weil es Zugangsdaten braucht, die es noch nicht gibt.

### 11.2 Verschlüsselter Zugang von außen

Solange nur über den SSH-Tunnel zugegriffen wird, braucht es kein Zertifikat. Sobald eine Unterdomain auf den Server zeigt:

1. `A`-Eintrag der Unterdomain auf die Server-IP.
2. `ufw allow 80/tcp && ufw allow 443/tcp`
3. Caddy installieren, `vorlagen/Caddyfile.vorlage` anpassen (Unterdomain, Mailadresse).
4. In `.env` die drei URLs auf `https://<unterdomain>` umstellen, Stack neu starten.

**Die Oberfläche bleibt auch dann hinter dem Tunnel.** Die Vorlage sperrt sie ausdrücklich; das Tor bleibt für die Programmierschnittstelle.

### 11.3 Überwachung

Noch nicht eingerichtet. Ohne sie merkt niemand, wenn die Platte voll läuft oder ein Dienst stehen bleibt. Für einen Entwicklungsserver ist das vertretbar; vor der Testphase nicht mehr.

### 11.4 Geheimnisse

Sie stehen in `.env` auf der Platte. Die Supabase-Dokumentation empfiehlt für den Produktivbetrieb einen Geheimnisverwalter *(abgerufen 28.09.2026)*. **Für den Entwicklungsserver mit erfundenen Daten ist `.env` in Ordnung** — für die Produktion nicht, und das gehört in die Entscheidung über den Produktionsserver (Nr. 103).

---

## 12 · Wenn doch einmal echte Daten daraufsollen

Dann gilt ab diesem Moment alles auf einmal:

| | |
|---|---|
| 1 | **Auftragsverarbeitungsvertrag mit Hetzner.** Er ist **nicht** Teil der AGB, sondern gesondert abzuschließen — im Kundenkonto unter `accounts.hetzner.com/account/dpa`, per digitaler Zustimmung, ohne Unterschrift *(abgerufen 28.09.2026)* |
| 2 | **Liste der Unterauftragsverarbeiter** zu den Unterlagen nehmen: `hetzner.com/AV/subunternehmer.pdf` |
| 3 | **Nachweise:** Hetzner nennt **DIN ISO/IEC 27001:2022** für alle Rechenzentren; **TÜV Rheinland (i-sec GmbH)** prüft die technischen und organisatorischen Maßnahmen jährlich, und wer einen AVV abgeschlossen hat, bekommt die Prüfprotokolle über das Kundenkonto *(abgerufen 28.09.2026)*. Genau das verlangen Folgenabschätzung und Store-Antrag |
| 4 | **Verarbeitungsübersicht und Folgenabschätzung** um diesen Server ergänzen |
| 5 | **Verschlüsselte Sicherung an einem zweiten Ort** (11.1) |
| 6 | **Überwachung** (11.3) und **Geheimnisverwalter** (11.4) |

**Der Auftragsverarbeitungsvertrag ist ein Klick und kostet nichts** — wenn du ohnehin im Kundenkonto bist, schließ ihn gleich mit ab. Dann kann dieser Punkt später nicht vergessen werden.

---

## 13 · Abnahme

`PRUEFLISTE.md` im Paket — zehn Punkte zum Abhaken. Bitte ausgefüllt zurück, dann wandert sie als Nachweis in den Projektordner.

---

## 14 · Fassungen und was sich ändern kann

| | |
|---|---|
| **Supabase-Zweig** | `self-hosted/v0.8.2`. Ein anderer geht über `CRUIZY_SUPABASE_ZWEIG=... bash skripte/03-supabase-holen.sh`. Der tatsächlich geholte Feststand landet in `/opt/cruizy/HERKUNFT.txt` |
| **Ubuntu** | 24.04 LTS. 22.04 sollte gehen, ist aber nicht geprüft — das Vorprüfskript sagt es |
| **Was wir nicht prüfen konnten** | Kein Teil dieses Pakets ist gegen einen echten Hetzner-VPS gelaufen. **Geprüft ist:** die Syntax aller Skripte, die Gültigkeit der erzeugten YAML-Datei, und — gegen eine echte PostgreSQL-Instanz mit PostGIS — das gesamte `10-postgis.sql` samt Rauchtest **in beiden Fällen**: PostGIS frisch angelegt und PostGIS bereits im falschen Schema vorhanden. Der Nachweis, dass `geometry` über die Rolle `authenticator` auflöst, ist erbracht worden; er steht im Protokoll des Projektordners |
| **Wenn etwas nicht passt** | Meldung und Skriptname an mich, dann bessere ich nach. Bitte nichts stillschweigend von Hand umbiegen — sonst weicht der Server von der Beschreibung ab, und das fällt erst in der Abnahme auf |

---

## Quellen

Alle am **28.09.2026** abgerufen:

| Was belegt wird | Quelle |
|---|---|
| Hetzner-Standorte und Kürzel; welche in der EU liegen | <https://docs.hetzner.com/de/cloud/general/locations/> |
| ISO/IEC 27001:2022 für alle Rechenzentren; Zutritt, Brandschutz, Strom | <https://www.hetzner.com/unternehmen/rechenzentrum/> |
| Auftragsverarbeitungsvertrag gesondert im Kundenkonto; Unterauftragsverarbeiterliste; TÜV-Rheinland-Prüfung | <https://docs.hetzner.com/de/general/general-terms-and-conditions/data-privacy-faq/> |
| Vorgehen für selbst gehostetes Supabase, Schlüsselskripte, Mindestanforderungen, Sicherheitshinweise | <https://supabase.com/docs/guides/self-hosting/docker> |
| PostGIS über `rpc()`: `type "geometry" does not exist` | <https://github.com/supabase/supabase/issues/27295> |
| PostgreSQL 17 als Standard für Neuinstallationen | <https://supabase.com/changelog/46080-self-hosted-supabase-upgrading-from-pg-15-to-17-breaking-change> |

**Projektintern:** `00-grundlagen/grundsatzbeschluesse.md` (G-01) · `01-steuerung/offene-entscheidungen.md` (Nr. 99, 103) · `70-entwicklung-ab-monat-4/einrichtung-vor-dem-ersten-code.md` (A-70) · `70-entwicklung-ab-monat-4/code-planer.md` (AP-0, AP-2) · `50-produkt-prototyp/produktspezifikation.md` (F60, F70, M-02).

> **Nichts davon ist bestellt, beauftragt oder unterschrieben.** Dieses Paket richtet einen Server ein; es schließt keinen Vertrag.
