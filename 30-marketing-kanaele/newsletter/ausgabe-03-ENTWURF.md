# Ausgabe 03 — Muster

> **ENTWURF · Stand 15.09.2026 · nicht versenden.** Aufgabe A-17. Diese Ausgabe zeigt Form, Ton und Länge mit Fakten, die heute stimmen. Vor einem Versand wird sie mit dem dann aktuellen Stand **neu geschrieben** — die Belege unten zeigen, wo jede Aussage herkommt. Versand erst, wenn die Warteliste live ist und Nr. 53 entschieden ist.

**Absender:** `{ABSENDER}` · **Antwortadresse:** eine gelesene Adresse, kein „noreply“
**Betreff:** Vier Entfernungen statt Metern  *(30 Zeichen)*
**Vorschauzeile:** Warum du bei uns nie siehst, wie weit genau jemand weg ist.  *(59 Zeichen)*

```
Hallo,

hier ist der Stand der Dinge.

WORAN WIR BAUEN
Bei uns siehst du nie, wie viele Meter jemand entfernt ist. Es gibt genau vier Stufen: unter 1 km, 1 bis 3 km, 3 bis 10 km und über 10 km. Aus drei genauen Entfernungen lässt sich ein Standort berechnen. Deshalb bekommt dein Gerät nie die genaue Position eines anderen. Außerdem stehen jetzt alle Texte der App auf Papier: 325 Stück, vom Knopf bis zur Fehlermeldung.

AUS KÖLN
{TERMINE ODER ORTSPORTRÄT — nur mit Freigabe, höchstens 50 Wörter; sonst entfällt der Abschnitt}

EINE EHRLICHE ZAHL
39 Bildschirme hat unsere App auf dem Papier. Gebaut ist davon noch keiner. Programmiert wird erst, wenn feststeht, dass genug Menschen warten.

Bis zum nächsten Mal
{ABSENDER}

—
Du bekommst diese Mail, weil du dich auf der Warteliste von {NAME} eingetragen hast. Abmelden mit einem Klick: {ABMELDELINK}
{ABSENDER} · {IMPRESSUMSLINK} · {DATENSCHUTZLINK}
```

**Länge:** 143 Wörter einschließlich Gruß und Fußzeile (Grenze: unter 250). Module: „Woran wir bauen“ 66 · „Aus Köln“ Platzhalter · „Eine ehrliche Zahl“ 22.

## Belege

| Aussage | Quelle |
|---|---|
| Vier Entfernungsstufen, keine Meterangaben | Handbuch A, Mikro-UX |
| Keine genaue fremde Position auf dem Gerät | Handbuch A, Funktion 70 („Client erhält nie eine exakte Fremdkoordinate“); A-06, Beitrag zu Entfernungen |
| 325 Systemtexte | `50-produkt-prototyp/systemtexte-ENTWURF.md`, Stand 15.09.2026 |
| 39 Bildschirme, kein Produktivcode vor Tor 1 | `50-produkt-prototyp/wireframes-textspezifikation.md`, Stand 15.09.2026; Handbuch A, Bauplan Phase 0 („kein Produktivcode“) |

## Vor dem Versand

- Der Platzhalter in „Aus Köln“ zeigt, wo der Terminservice andockt (A-16, Abschnitt 6.2). Ohne Freigabe entfällt er.
- Die Zahlen 325 und 39 sind Stand der Vorfassung. Nach den Interviews ändern sie sich (A-14, A-15 ◐).
- Checkliste aus `newsletter-geruest.md`, Abschnitt 8, vollständig abhaken.
