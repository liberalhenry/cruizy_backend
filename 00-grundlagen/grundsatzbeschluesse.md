# Grundsatzbeschlüsse

**Was hier steht:** Regeln, die die Gründer für das gesamte Vorhaben festgelegt haben und die über einzelnen Dokumenten stehen. Sie gelten wie die Handbücher — mit einem Unterschied: Die Handbücher sind Wahrheitsquellen und werden nicht bearbeitet; **dieses Dokument wächst.**

**Warum es getrennt steht:** Die Projektregel lautet, dass Handbuch A und Handbuch B unverändert bleiben und Widersprüche benannt statt stillschweigend aufgelöst werden. Ein Grundsatz, der nach dem Erscheinen der Handbücher beschlossen wurde, kann deshalb nicht in sie hineingeschrieben werden. Er steht hier und **geht den Handbüchern vor**, wo beide dasselbe regeln.

**Rangfolge bei Widerspruch:** Grundsatzbeschluss → Handbuch A / Handbuch B → abgeleitete Dokumente.

---

## G-01 · Datenschutz als Maßstab, nicht als Mindestmaß

*Beschlossen am 19.09.2026. Grundlage: Entscheidung Nr. 58.*

> Cruizy hält nicht das gesetzliche Mindestmaß des Datenschutzes ein, sondern strebt an, es zu übertreffen. Auftragsverarbeiter mit Sitz oder Datenhaltung in den Vereinigten Staaten von Amerika werden nicht eingesetzt.
>
> Lässt sich eine notwendige Funktion nachweislich nicht anders erbringen, ist ein Ausweichen zulässig — als **begründete Einzelentscheidung**, die dokumentiert, befristet und mit der Verpflichtung versehen wird, sie bei erster Gelegenheit zurückzunehmen.

**Was das praktisch heißt:**

| | |
|---|---|
| **Regelfall** | Anbieter mit Sitz und Datenhaltung im EWR. Ein Rechenzentrum in der EU genügt nicht, wenn das Unternehmen amerikanischem Recht unterliegt |
| **Ausnahme** | nur nach dokumentierter Prüfung, dass es keine gleichwertige Alternative gibt |
| **Form der Ausnahme** | Eintrag in die Liste unten: Anbieter, Zweck, geprüfte Alternativen, Frist, Wiedervorlage |
| **Was nie ausgenommen wird** | personenbezogene Daten nach Art. 9 DSGVO, Standortdaten, Bildinhalte, Chatinhalte, Fehlerprotokolle mit Nutzerbezug |

**Betroffene offene Punkte:** Nr. 58 (Sentry, RevenueCat) — **Alternativen geprüft am 20.09.2026 (A-53):** GlitchTip oder Bugsink im Selbstbetrieb, RevenueCat in Phase 1 nicht nötig, Web-Zahlung über einen EU-Anbieter; die Ausnahmeliste bleibt leer. Weiter offen: Nr. 63 (Maildienst), Nr. 7 (Verifizierungsanbieter), K10 (Anmeldung mit Apple).

### Liste der Ausnahmen

*Stand 19.09.2026: keine. Jede künftige Ausnahme wird hier mit Datum, Begründung und Wiedervorlagefrist eingetragen.*

| Anbieter | Zweck | Geprüfte Alternativen | Befristet bis | Beschlossen am |
|---|---|---|---|---|
| — | — | — | — | — |

---

## G-02 · Im Zweifel den oberen Rand finanzieren

**Beschlossen am 26.09.2026** (zu Nr. 90, im Wortlaut: „immer lieber etwas zu viel Geld als zu wenig planen").

**Der Grundsatz:** Wo das Finanzmodell eine **Spanne** nennt, wird gegen den **mittleren** Wert geplant und der **obere** finanziert. Die Finanzierungsfolge muss den oberen Rand tragen können, auch wenn die Zahl nach außen die mittlere ist.

**Was er praktisch bedeutet:**

| | |
|---|---|
| Gesamtbedarf | **233.053 €** nach außen (realistisch, Nr. 38) — die Finanzierungsfolge legt auf **275.861 €** aus, die Differenz von **42.808 €** wird als Reserve benannt, nicht verschwiegen |
| Einzelposten mit Spanne | Die Planung nimmt die Mitte (Code-Prüfung 18.900 €, CSD zum Start 6.000 €); die Finanzierungsfolge muss den oberen Rand tragen (Code-Prüfung 25.920 €, CSD 10.000 €) |
| Was der Grundsatz **nicht** ist | keine Erlaubnis, teurer zu planen. Die Planzahl bleibt die mittlere; nur die **Erreichbarkeit** des oberen Randes wird verlangt |

**Wo er angewandt wird:** `../40-finanzen-foerderung/finanzmodell.xlsx`, Blatt „Finanzierungswege", Abschnitt 7 · `../40-finanzen-foerderung/kapitalbedarf-gegenrechnung.md` · alle Außendokumente.

---

## G-03 · Was im Engpass nie gestrichen wird

**Beschlossen am 21.09.2026 (Nr. 16), ergänzt am 26.09.2026 (Teil 4).** Handbuch B, Teil IX nennt vier Positionen, die auch im Liquiditätsengpass bleiben. Seit dem 26.09.2026 sind es **fünf**:

1. **Externer Datenschutzbeauftragter**
2. **Hash-Abgleich** (Bildprüfung gegen bekanntes Missbrauchsmaterial)
3. **Cyber- und Betriebshaftpflicht**
4. **Rechtsrückstellung**
5. **Die vollständige Prüfung des Codes vor dem Start** (Nr. 73) — **neu am 26.09.2026**

**Warum der fünfte Punkt etwas kostet, das die anderen vier nicht kosten:** Er ist mit **18.900 €** die teuerste Einzelposition der Liste und fällt genau in die Zeit, in der das Geld am knappsten ist. Ihn in die Liste zu nehmen heißt: Im Engpass wird eher der CSD-Auftritt der Folgejahre gestrichen, eher die externe Gestaltung, eher die eigene Lebenshaltung gekürzt. **Ohne diesen Punkt wäre Nr. 73 eine Absichtserklärung und kein Beschluss.**

Ausgenommen von der Streichreihenfolge bleibt außerdem der **CSD-Auftritt zum Start** (Nr. 16, 21.09.2026) — gestrichen werden dürfen nur die Folgejahre.

**Wo er angewandt wird:** `../01-steuerung/zusagen-tor-2-und-notfall.md`, Abschnitt 2.

---

## Wo die Grundsätze sonst noch stehen

Jedes Dokument, das einen Grundsatz anwendet, verweist auf ihn — nicht umgekehrt. Dieses Dokument bleibt kurz.

- Herleitung und Wortlaut der Beschlüsse: `../01-steuerung/beschluesse-2026-09-19.md`, `../01-steuerung/beschluesse-2026-09-21.md`, `../01-steuerung/beschluesse-2026-09-26.md`
- Status aller Entscheidungen: `../01-steuerung/offene-entscheidungen.md`
- Wahrheitsquellen: Handbuch A und Handbuch B in diesem Ordner
