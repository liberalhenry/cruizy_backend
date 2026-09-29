# Standortanzeige — Ersatzpunkt, Travel und die Entfernung, die man sieht

> ## ⚠ Konzept, keine Zusage
>
> **Stand 26.09.2026 · Beschlüsse Nr. 48 (19.09.), Nr. 77 (21.09.), Nr. 85 und Teil 4 (26.09.) · offen: nichts**
> Setzt beide Beschlüsse um und verbindet sie mit den Zonen (F60), der Reiseankündigung (F28) und den verbindlichen Entfernungsbändern aus Handbuch A.

---

## Auf einen Blick

| | |
|---|---|
| **Zwei getrennte Regler** | **„Mein angezeigter Ort"** — was andere von mir sehen · **„Ich suche in"** — was ich sehe |
| **Kostenlos** | echter Ort (gerundet) oder **Ersatzpunkt 2 bis 30 km** vom echten Ort (die Untergrenze ist ein Vorschlag, Abschnitt 3) · Suche in der eigenen Region |
| **Im Abo (Travel)** | angezeigter Ort **weiter als 30 km** · Suche in **einer anderen Region** · unsichtbar in einer Zone |
| **Immer eine Entfernung** | ja — aus einem der vier Bänder; bei Ersatzpunkt vom Ersatzpunkt aus gerechnet, mit dem Hinweis **„ungefährer Ort"** |
| **Nie genauer als 500 m** | **schon erfüllt, und zwar strenger:** Handbuch A legt verbindlich vier Bänder fest, das feinste ist **„unter 1 km"**, Meterangaben gibt es nirgends |
| **Reisende sind erkennbar** | im Profil und im Gespräch: **„auf Reisen"** statt einer Entfernung |

---

## 1 · Die zwei Regler

Der wichtigste Satz dieses Konzepts: **Was andere von mir sehen und was ich sehe, sind zwei verschiedene Dinge.**

| | **„Mein angezeigter Ort"** | **„Ich suche in"** |
|---|---|---|
| **Was er ändert** | die Entfernung, die andere bei mir sehen | welche Menschen ich im Raster sehe |
| **Kostenlos** | echter Ort, gerundet (F70) · **oder Ersatzpunkt 2 bis 30 km** | meine Region |
| **Im Abo** | Ersatzpunkt weiter als 30 km | eine andere Region |
| **Wer davon erfährt** | andere sehen „ungefährer Ort" bzw. „auf Reisen" | niemand — es ist meine Sicht |

**Warum getrennt:** Wäre der Ersatzpunkt auch die eigene Sicht, sähe man, solange man die Wohnung schützt, nicht mehr, wer tatsächlich in der Nähe ist. Die Schutzfunktion würde zur Augenbinde — und genau dann abgeschaltet, wenn sie gebraucht wird. Getrennt bleibt der Schutz an, ohne etwas zu kosten.

---

## 2 · Die Entfernung, die angezeigt wird

### Die vier Bänder gelten unverändert

Handbuch A, Mikro-UX — **verbindlich:** *„Genau vier: unter 1 km · 1–3 km · 3–10 km · über 10 km. Keine Meterangaben, nirgends."*

**Henrys Vorgabe „nie genauer als 500 Meter" ist damit übererfüllt.** Das feinste, was jemals angezeigt wird, ist „unter 1 km" — dahinter können 50 Meter oder 950 Meter stecken, und niemand kann sie unterscheiden. Zusätzlich wird jeder Standort vor jeder Berechnung auf eine Rasterzelle gerundet (F70, FV-02), und eine Sortierung nach Metern gibt es nicht (FV-04).

**Die Rückfrage dazu:** Falls du ein **feineres** Band „unter 500 m" wolltest — also mehr Anreiz statt mehr Schutz —, widerspricht das der verbindlichen Festlegung in Handbuch A und bräuchte einen Grundsatzbeschluss. **Ich rate davon ab:** Je feiner das Band, desto leichter lässt sich jemand durch Abfragen aus mehreren Richtungen eingrenzen.

### Wer was sieht

| Die Person nutzt | Andere sehen | Hinweis |
|---|---|---|
| **echten Ort** | Band vom gerundeten echten Ort | — |
| **Ersatzpunkt bis 30 km** | Band **vom Ersatzpunkt** aus | **„ungefährer Ort"** |
| **angezeigten Ort über 30 km** (Travel) | **kein Band**, sondern „auf Reisen" | wie bei der Reiseankündigung, FV-44 |
| **Unsichtbar in einer Zone** (Abo) | nichts — die Person erscheint nicht | — |

### Die Nebenwirkung, offen gesagt

Wenn A einen Ersatzpunkt nutzt und B nicht, sehen beide **verschiedene** Bänder für dieselbe Strecke: B sieht A „3–10 km" entfernt (vom Ersatzpunkt aus), A sieht B „unter 1 km" (vom eigenen echten Ort aus). Das ist **gewollt** — genau daraus besteht der Schutz. Der Hinweis „ungefährer Ort" an A's Profil sagt B, dass die Entfernung nicht wörtlich zu nehmen ist. Das Genauere klären die beiden im Gespräch, wie du geschrieben hast.

**Warum B's Entfernung für A nichts über A verrät:** A's Sicht wird aus A's echtem Ort berechnet, aber nur A sieht sie. Was an B's Gerät geht, wird ausschließlich aus A's Ersatzpunkt berechnet.

---

## 3 · Der Ersatzpunkt

| | |
|---|---|
| **Was er ist** | ein selbst gewählter Punkt, von dem aus andere die Entfernung sehen |
| **Wo er liegen darf** | kostenlos bis **30 km** vom echten Ort (P-ERSATZPUNKT-MAX-KM); weiter weg ist Travel |
| **Wie nah er liegen darf — Vorschlag vom 21.09.2026** | **mindestens 2 km** vom echten Ort (P-ERSATZPUNKT-MIN-KM). Ein Punkt 300 Meter neben der Wohnung zeigt anderen dasselbe Band wie die Wohnung selbst — er würde „ungefährer Ort“ anzeigen, ohne etwas zu schützen. 2 km liegen außerhalb des feinsten Bandes „unter 1 km“ und mindestens eine grobe Rasterzelle (2 × 2 km, FV-01) weiter. **Dazu als Voreinstellung:** Die App schlägt einen zufälligen Punkt in diesem Ring vor, die Person kann ihn verschieben — dann liegt der Punkt nicht dort, wo man ihn aus Bequemlichkeit hinlegt |
| **Wann er gilt** | in einer **Zone** (F60) — etwa rund um die Wohnung — oder immer, je nach Einstellung |
| **Warum 30 km eine Schutzgrenze ist und keine Preisgrenze** | Der Angriff, gegen den er schützt, ist das Eingrenzen der Wohnung durch wiederholte Abfragen. Weil jede Entfernung, die andere sehen, nur vom Ersatzpunkt aus berechnet wird (AK-F60-07), führt dieses Eingrenzen zum Ersatzpunkt, nicht zur Wohnung — sofern er den Mindestabstand einhält. Ein Punkt weiter als 30 km schützt nicht besser, er ist nur nützlicher für etwas anderes — für das Reisen |

**Was der Ersatzpunkt nicht verhindert:** dass jemand im Gespräch erfährt, wo man wirklich wohnt, weil man es ihm erzählt. Das ist eine Entscheidung der Person, nicht der App.

---

## 4 · Die Zonen mit dem neuen Zuschnitt (F60)

Nach Nr. 48 hat jede Zone **eine** von zwei Wirkungen:

| Wirkung | Was sie tut | Preis |
|---|---|---|
| **Ersatzpunkt** | In der Zone sehen andere die Entfernung vom Ersatzpunkt aus | **kostenlos** |
| **Unsichtbar** | In der Zone erscheint die Person nirgends | **im Abo** |

**Wie viele Zonen (Vorschlag):** bis zu **fünf** für alle (P-ZONEN-MAX) — Wohnung, Arbeit, Familie, und Luft. **Keine Bezahlschranke bei der Zahl der Zonen mit Ersatzpunkt,** denn das ist Schutz, und Schutz kostet nach Prinzip 6 nichts. Die Obergrenze gilt für alle gleich und ist eine technische, keine verkaufte. **Die bisherige Regel „eine Zone gratis, weitere im Abo" (Handbuch A) ist damit überholt** — sie stand genau so zur Entscheidung, und Nr. 48 hat anders entschieden.

**Die Unterscheidung, die Nr. 48 trägt:** Gegen das Eingrenzen der Wohnung schützt der Ersatzpunkt so gut wie die Unsichtbarkeit — sofern er den Mindestabstand einhält. Unsichtbar ist bequemer, weil man nicht verschoben wird, sondern gar nicht auftaucht. *(Korrigiert am 21.09.2026: Hier stand „schützt vollständig“ — das verspricht mehr, als die App belegen kann.)* **Was Unsichtbarkeit zusätzlich leistet:** Niemand sieht, dass man überhaupt in der Gegend aktiv ist. Wer davor Schutz braucht — etwa vor einer bestimmten Person —, hat dafür das Blockieren (F61), kostenlos. **Das ist die Auslegung von Prinzip 6, die am 19.09.2026 beschlossen wurde, und sie wird in den Systemtexten offen ausgesprochen** (ST-STO-40).

---

## 5 · Travel — was dazugehört

**Beschlossen (Nr. 48, Nr. 77):** In einer anderen Region umsehen und schreiben kostet.

| Bestandteil | Was | Status |
|---|---|---|
| **„Ich suche in"** eine andere Region | Raster und Karte der Zielregion sehen und dort schreiben | **beschlossen, im Abo** |
| **Angezeigter Ort über 30 km** | in einer anderen Region erscheinen | **beschlossen, im Abo** |
| **Reiseankündigung** (F28, Handbuch A, Phase 2) | bis 14 Tage vorher in der Zielstadt sichtbar, mit Zeitraum | **beschlossen 26.09.2026 (Nr. 85): im Travel-Paket** |

**Entschieden am 26.09.2026 (Nr. 85):** alle drei als **ein** Paket in der Stufe PRO. Wer reist, will sehen **und** gesehen werden. Zwei Pakete wären künstlich. Dass F28 in Handbuch A ohne Preis steht, macht die Zuordnung zu einer **Festlegung** — sie ist keine Übernahme.

### Wie Reisende erkennbar sind

| Ort | Was dort steht |
|---|---|
| **Rasterkachel** | statt eines Bandes: **„auf Reisen"** — bei angekündigter Reise mit Zeitraum |
| **Profil** | derselbe Hinweis |
| **Gespräch** | bei der ersten Nachricht eine Zeile: **„schreibt von außerhalb"** — auf Wunsch der schreibenden Person mit Stadt |

**Warum ohne Stadt voreingestellt:** Die Stadt, aus der jemand schreibt, ist eine Angabe über den eigenen Wohnort. Wer sie nennen will, kann es; die App nennt sie nicht ungefragt.

---

## 6 · Was sich in der Spezifikation ändert

| Stelle | Änderung |
|---|---|
| **F60 Zonen** | zwei Wirkungen mit Preiszuschnitt nach Nr. 48; P-ZONEN-FREI ersetzt durch **P-ZONEN-MAX** für alle; neue Akzeptanzkriterien für Ersatzpunkt bis 30 km und den Hinweis „ungefährer Ort" |
| **F70** | unverändert — die Rundung auf Rasterzellen gilt auch für den Ersatzpunkt **und seit dem 26.09.2026 (Teil 4, ⚠ W-27) auch für den Zonenmittelpunkt** |
| **F28** | **ist Teil des Travel-Pakets** (Nr. 85, 26.09.2026) und damit der Stufe PRO |
| **Parameter** | neu: P-ERSATZPUNKT-MAX-KM (30), P-ZONEN-MAX (5), P-ERSATZPUNKT-MIN-KM (2 — **beschlossen 26.09.2026**) |
| **Systemtexte** | ST-STO-40 bis ST-STO-47 |

---

## 7 · Die Texte (Entwürfe)

| ID | Ort | Text |
|---|---|---|
| ST-STO-40 | Zonenwirkung, Erklärung | Mit Ersatzpunkt sehen andere jede Entfernung von diesem Punkt aus, nicht von deinem echten Ort. Unsichtbar zu sein ist bequemer, schützt aber nicht mehr. Deshalb ist der Ersatzpunkt kostenlos und unsichtbar im Abo. |
| ST-STO-41 | Hinweis an einem Profil | ungefährer Ort |
| ST-STO-42 | Erklärung beim Antippen von ST-STO-41 | Diese Person zeigt einen Punkt statt ihres echten Ortes. Die Entfernung gilt ab diesem Punkt — das Genaue klärt ihr im Gespräch. |
| ST-STO-43 | Ersatzpunkt setzen | Setz deinen Punkt 2 bis 30 km von dir entfernt. Andere sehen dann die Entfernung von dort. |
| ST-STO-44 | Ersatzpunkt weiter weg | Weiter als 30 km ist Reisen — das ist im Abo. |
| ST-STO-45 | Kachel, Profil | auf Reisen |
| ST-STO-46 | Gespräch, erste Nachricht | schreibt von außerhalb |
| ST-STO-47 | Ersatzpunkt zu nah | Zu nah an dir — so schützt der Punkt nicht. Wähl einen Punkt mindestens 2 km entfernt. |

**Korrigiert am 21.09.2026:** ST-STO-40 versprach „Niemand kann herausfinden, wo du wirklich bist“, ST-STO-42 „Die Entfernung stimmt ungefähr“. Das Erste ist ein Sicherheitsversprechen, das die App nicht belegen kann; das Zweite stimmt nicht, wenn der Punkt 30 km entfernt liegt. Beide Texte beschreiben jetzt nur, was die App tatsächlich anzeigt.

---

## 8 · Offene Punkte

| | Punkt |
|---|---|
| ~~**Nr. 85**~~ | **entschieden 26.09.2026: ja**, alle drei als ein Paket in PRO |
| **Vorschlag** | P-ZONEN-MAX = 5, für alle gleich |
| ~~**Vorschlag**~~ | **Mindestabstand 2 km beschlossen am 26.09.2026 (Teil 4)**; der zufällig vorgeschlagene Punkt als Voreinstellung bleibt Vorschlag (Abschnitt 3) |
| **Rückfrage** | ein feineres Band „unter 500 m"? (abgeraten, Abschnitt 2) |

---

## Quellen

- Handbuch A, Mikro-UX — Entfernungsbänder, verbindlich; Funktionskatalog F25, F28, F60, F70
- Beschlüsse **Nr. 48** (19.09.2026) und **Nr. 77** (21.09.2026)
- `produktspezifikation.md` — F60, F70, FV-02, FV-04, FV-44, FV-70
