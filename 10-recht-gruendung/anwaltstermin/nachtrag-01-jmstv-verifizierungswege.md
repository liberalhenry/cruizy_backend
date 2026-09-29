# Nachtrag 01 zur Anwaltsakte — Verifizierungswege und die Reichweite von § 4 Abs. 2 JMStV

Erstellt: 27.07.2026, 10:05 Uhr · Ergänzung zu `anwaltsakte-cruizy.docx`, Teil B1 (JMStV) und Teil C
**Bitte zusammen mit der Anwaltsakte lesen.** Die Akte stellt die Grundfrage nach der geschlossenen Benutzergruppe. Dieser Nachtrag schärft sie, weil die Antwort inzwischen bezifferbar ist.

---

## Warum dieser Nachtrag existiert

Beim Aufbau des Finanzmodells (A-13) hat sich gezeigt, dass an dieser einen Frage im realistischen Szenario ein Unterschied von **rund 49.000 € Kapitalbedarf** hängt — zwischen dem günstigsten und dem teuersten zulässigen Verfahren. *(Korrektur vom 16.09.2026: Vollständig nachgerechnet sind es **rund 71.000 €** — 95.258 € im günstigsten, 166.548 € im teuersten Fall. Einzelheiten: Hinweis am Anfang von `40-finanzen-foerderung/kapitalbedarf-gegenrechnung.md`. **Stand 21.09.2026:** Mit den Beschlüssen vom September liegt die Spanne bei **143.397 € bis 245.841 €**, also rund **102.000 €**; der Kapitalbedarf der Firma in der Voreinstellung bei 160.253 €.)* Das ist bei einem Gesamtbedarf von etwa 107.000 € kein Randthema, sondern die teuerste Einzelfrage des Vorhabens.

Vollständige Herleitung mit allen Zwischenschritten: `40-finanzen-foerderung/kapitalbedarf-gegenrechnung.md`.

---

## Der Sachverhalt in fünf Sätzen

1. Cruizy führt nach der Zonenarchitektur (`50-produkt-prototyp/moderationsarchitektur.md`) drei getrennte Bereiche: öffentliche Profilbilder, private Kommunikation, gemeldete Inhalte.
2. Der **öffentliche Bereich ist konzeptionell frei von expliziten Inhalten** — alle öffentlichen Bilder werden vorab geprüft.
3. Explizite Inhalte existieren ausschließlich in der **privaten, beidseitig freigegebenen** Kommunikation zwischen zwei erwachsenen Nutzern.
4. Wir planen eine zweistufige Altersprüfung: eine günstige Altersschätzung für alle, eine volle Identifizierung nach dem AVS-Raster nur für den, der den privaten expliziten Bereich betritt.
5. Der Marktstart ist für den **Sommer 2028** vorgesehen; bis dahin ist alles gestaltbar.

---

## Die vier Fragen, in dieser Reihenfolge

### Frage 1 — die teuerste: Reicht § 4 Abs. 2 JMStV in die private Kommunikation hinein?

> **Gilt die Pflicht zur geschlossenen Benutzergruppe auch für Inhalte, die zwei erwachsene Nutzer einander in einem beidseitig freigegebenen privaten Bereich zeigen — oder erfasst sie nur das, was der Anbieter selbst öffentlich zugänglich macht?**

**Warum die Frage so gestellt ist:** Die Norm richtet sich an Angebote in Telemedien. Ob der private Austausch zwischen zwei Nutzern ein „Angebot" des Anbieters in diesem Sinne ist, ist für unser Modell die Weichenstellung. Fällt die Antwort so aus, dass die Pflicht nur den öffentlichen Bereich erfasst, entfällt die zweite Prüfstufe vollständig — und mit ihr der gesamte Kostenblock.

**Was wir nicht wollen:** eine Antwort, die uns entlastet, aber im Aufsichtsverfahren nicht trägt. Lieber eine teure Lösung, die hält.

### Frage 2 — genügt für die erste Stufe eine Altersschätzung?

> **Reicht für den öffentlichen, nicht expliziten Bereich eine automatisierte Altersschätzung, oder muss auch dort ein Identifizierungsverfahren stehen?**

Hintergrund: Die Unterscheidung zwischen § 4 Abs. 2 JMStV (unzulässige Angebote, geschlossene Benutzergruppe erforderlich) und § 5 JMStV (entwicklungsbeeinträchtigende Angebote, technische Mittel oder Altersstufen genügen) bestimmt, welcher Maßstab für welchen Bereich gilt. Für die Kostenrechnung ist das der zweitgrößte Hebel.

### Frage 3 — erkennt die KJM die eID als gleichwertig an?

> **Das AVS-Raster nennt die eID-Funktion des Personalausweises als Weg der persönlichen Identifizierung. Können wir uns darauf berufen, und gibt es dazu eine Positivbewertung eines Gesamtkonzepts, an dem wir uns orientieren können?**

Hintergrund: Nach unserer Recherche (A-07) hat die KJM sowohl Module als auch Gesamtkonzepte positiv bewertet. Die Unterscheidung ist praktisch bedeutsam — ein positiv bewertetes Gesamtkonzept trägt weiter als ein einzelnes Modul.

### Frage 4 — die einzige Frage, die die Rechnung noch kippen kann

> **Reicht eine einmalige Identifizierung dauerhaft, oder ist eine Wiederholung nach Zeitablauf vorgesehen oder empfohlen?**

Hintergrund: Das AVS-Raster beschreibt eine einmalige Identifizierung, gefolgt von Authentifizierung vor jedem Nutzungsvorgang. Unser Modell rechnet entsprechend: Kosten entstehen nur bei echten Neuzugängen. Müsste dagegen alle ein oder zwei Jahre neu identifiziert werden, stiege die Zahl der kostenpflichtigen Vorgänge erheblich — und die Kostenrechnung wäre neu aufzustellen.

---

## Ein Punkt, der zeitlich wichtig ist: die EUDI-Wallet

Die staatliche EUDI-Wallet ist ab dem **2. Januar 2027** in Deutschland kostenlos für alle verfügbar, aufbauend auf der AusweisApp und der eID des Personalausweises. Eine Altersnachweisfunktion ist ausdrücklich vorgesehen; für den Nachweis genügt die Bestätigung, dass eine Altersgrenze erreicht ist — ohne Übermittlung von Geburtsdatum oder Namen.

> **Frage an Sie:** Ist absehbar, dass ein Altersnachweis über die EUDI-Wallet den Anforderungen des AVS-Rasters genügt? Und falls die KJM sich dazu noch nicht geäußert hat — welchen Weg empfehlen Sie für ein Produkt, das im Sommer 2028 startet?

Für uns ist das keine akademische Frage: Bei einem Start anderthalb Jahre nach Einführung der Wallet wäre es kaufmännisch unvernünftig, die Architektur auf ein Verfahren auszulegen, das dann überholt sein könnte.

---

## Was wir aus diesem Termin mitnehmen möchten

1. Eine Antwort auf Frage 1, die belastbar genug ist, um die Produktarchitektur darauf zu bauen.
2. Eine Empfehlung, welches Verfahren für Stufe 2 wir in der Spezifikation vorsehen sollen.
3. Eine Einschätzung, ob die Zwei-Stufen-Architektur als solche trägt — oder ob sie im Aufsichtsverfahren als Umgehungsversuch gelesen werden könnte. Das ist ausdrücklich nicht unsere Absicht, aber wir möchten es wissen, bevor gebaut wird.

---

*Dieser Nachtrag ist ein Vorbereitungspapier der Gründer, keine Rechtsauffassung. Alle Angaben zur Rechtslage sind Rechercheergebnisse und stehen unter dem Vorbehalt Ihrer Prüfung.*
