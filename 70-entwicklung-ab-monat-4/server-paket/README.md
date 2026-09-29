# Server-Paket — zum Hochladen auf den Server

**Dieses Verzeichnis enthält genau eine Datei zum Hochladen.** Es ist kein Dokumentenordner.

| | |
|---|---|
| **Datei** | `cruizy-server-setup.zip` |
| **Größe** | 39 KB · 18 Dateien |
| **Fassung** | 1.0 · erstellt 28.09.2026 · Aufgabe A-71 |
| **Prüfsumme (SHA-256)** | `7a01832d76773c237555c1d5bc34f501ed3c6ac6b4dc0b94c98b371aa3178922` |
| **Wofür** | Einrichtung des **Entwicklungsservers** auf einem Hetzner-VPS mit Ubuntu 24.04 LTS |
| **Für wen** | Nicolas Greulich |

## Hochladen

```bash
scp cruizy-server-setup.zip root@<SERVER-IP>:/root/
```

Auf dem Server:

```bash
apt-get update && apt-get install -y unzip
unzip -q /root/cruizy-server-setup.zip -d /root/
cd /root/cruizy-server-setup
sha256sum /root/cruizy-server-setup.zip   # muss mit der Prüfsumme oben übereinstimmen
cat LIESMICH.md
```

## Die Anleitung

Steht **im Paket** als `ANLEITUNG.md` und **daneben im Projektordner** als
`../server-einrichtung-hetzner.md` — beide sind inhaltsgleich. Die Fassung im
Projektordner ist die, die mitgepflegt wird; die im Paket ist die Mitnahmefassung.

## Der eine Punkt vorab

**Der Standort des Servers muss Falkenstein, Nürnberg oder Helsinki sein.**
Ashburn, Hillsboro und Singapur brechen Grundsatzbeschluss **G-01**.
Begründung in der Anleitung, Abschnitt 2.1.

## Was geprüft ist und was nicht

**Geprüft:** Syntax aller Skripte (`bash -n`) und `shellcheck` ohne Befund · Gültigkeit der
erzeugten YAML-Datei · `sql/10-postgis.sql` und der Rauchtest gegen eine echte
PostgreSQL-Instanz mit PostGIS 3.4, in beiden Fällen — PostGIS frisch angelegt **und**
PostGIS bereits in einem anderen Schema vorhanden · der Nachweis, dass `geometry` über die
Rolle `authenticator` auflöst · das Vorprüfskript im Lauf · Prüfsummen nach dem Ein- und
Auspacken.

**Nicht geprüft:** kein Lauf gegen einen echten Hetzner-VPS. Was dort abweicht, gehört in
`PRUEFLISTE.md` und zurück an die KI.
