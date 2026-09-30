# Cruizy — Corporate Design

Ein Leitfaden für alles, was nach außen geht: E-Mails, das Moderationswerkzeug, spätere
Webseiten. Grundhaltung wie in der App: **ruhig, dunkel, ein einziger kühler Akzent, kein
Regenbogen** — und **diskret**. Wer Cruizy nutzt, entscheidet selbst, wer davon erfährt.

## Logo

| Datei | Einsatz |
|---|---|
| `cruizy-logo-hell.svg` | Logo auf dunklen Flächen (Standard) |
| `cruizy-logo-dunkel.svg` | Logo auf hellen Flächen |
| `cruizy-symbol.svg` | Symbol mit Fläche (Favicon, Profilbild in Kanälen, App-Kachel des Werkzeugs) |
| `cruizy-symbol-transparent.svg` | Symbol ohne Fläche |
| `cruizy-wortmarke-hell.svg` / `-dunkel.svg` | nur die Wortmarke |
| `*-mail.png`, `cruizy-symbol-*.png` | Rasterfassungen (E-Mail, Discord) |

**Idee:** Das Symbol ist ein offenes **C** — der Weg, den man geht (*cruisen*). In der Öffnung
sitzt ein **Punkt**: „du bist hier“ — ohne genauen Ort, so wie die App Standorte nur grob zeigt.
Die Wortmarke ist eine Monolinie mit runden Enden, immer klein geschrieben; der i-Punkt trägt
den Akzent.

- Schutzraum rundum: mindestens die Höhe des Punkts × 2.
- Mindestgröße: Symbol 16 px, Logo 24 px hoch.
- Nicht verzerren, nicht einfärben (außer hell/dunkel), keine Schatten, keine Verläufe.
- Neu erzeugen: `python3 shared/brand/build-brand.py`, danach `node backend/scripts/brand-png.mjs`.

## Farben

| Name | Wert | Einsatz |
|---|---|---|
| Grund | `#11141a` | Hintergrund, Kopf der E-Mails |
| Fläche | `#191d25` | Karten auf dunklem Grund |
| Fläche 2 | `#222733` | Eingabefelder, Chips |
| Linie | `#2e3441` | Trennlinien auf dunklem Grund |
| Text | `#e8ecf2` | Text auf dunklem Grund |
| Leise | `#9aa3b2` | Nebentext auf dunklem Grund |
| **Akzent** | `#5aa9ff` | Symbol, Hervorhebungen auf dunklem Grund |
| Akzent dunkel | `#2f6fc0` | Knöpfe und Verweise auf hellem Grund (Kontrast mit Weiß ≥ 4,5 : 1) |
| Papier | `#f3f5f8` | Hintergrund heller E-Mails |
| Tinte | `#1b2029` | Text auf hellem Grund |
| Warnung / Gefahr / Gut | `#f0b429` / `#ff6b6b` / `#5fd0a4` | nur für Zustände, nie als Schmuck |

Die Werte stehen auch in `frontend/tailwind.config.js` und `backend/src/providers/mail-design.ts`.

## Schrift

Systemschrift — `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
sans-serif`; für Codes `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`. **Keine
Webschriften Dritter** (Datenschutz, Ladezeit). Überschriften fett, Fließtext 16 px / 24 px.

## Formen und Ton

- Runde Ecken: Karten 18 px, Knöpfe und Felder 12 px, Chips voll rund.
- Ein Hauptknopf je Ansicht, in der Akzentfarbe.
- Sprache: du, kurz, freundlich, konkret. Keine Ausrufezeichen-Kaskaden, keine Emojis in
  Systemtexten.

## E-Mails

- Jede Mail geht als HTML **und** als reiner Text. Aufbau: dunkler Kopf mit Logo, helle Karte
  mit Überschrift, Inhalt, ggf. Code-Feld oder Knopf, kleine Fußzeile. Im Dunkelmodus des
  Mailprogramms wird die Karte dunkel.
- Das Logo hängt als eingebettetes Bild an (`cid:`) — keine externen Bilder, keine Zählpixel.
- **Diskretion:** Betreff und Vorschauzeile nennen weder „Cruizy“ noch den Anlass
  (AK-F02-06). Mails an Dritte (Check-in) sind immer neutral — ohne Logo, ohne Namen (AK-F55-15).
- `MAIL_BRANDING=dezent` in `.env` schaltet für alle Nutzer-Mails die neutrale Fassung ein.

## Wo das Logo nicht erscheint

In der **App selbst** (Startbildschirm, Tab-Titel, Icon) bleibt die Tarnung („Notizen“,
„Rechner“ …) — das Logo steht dort bewusst nicht.
