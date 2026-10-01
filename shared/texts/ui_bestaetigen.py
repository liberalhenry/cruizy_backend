"""Oberflächentexte ohne Testbetrieb: Was das Team bestätigt, wenn ein Prüf- oder Versandweg fehlt. Alle ENTWURF.
Wird von build-ui.py eingelesen — nicht allein aufrufen."""

NEU = {
  # ───── Codes ohne Versand (kein SMTP bzw. kein Telegram-Bot) ─────
  'UI-TEAM-WARTET': 'Unser Team hat noch nicht bestätigt.',
  'UI-CODE-OHNE-VERSAND': 'Wir können gerade keine Codes verschicken. Ein Mensch aus unserem Team bestätigt deine Angabe — meist innerhalb weniger Stunden. Diese Seite geht dann von selbst weiter. Du kannst sie auch schließen und dich später einfach anmelden.',
  'UI-GERAET-OHNE-VERSAND': 'Wir können gerade keinen Code an deine Nummer schicken. Ein Mensch aus unserem Team bestätigt die Anmeldung auf diesem Gerät. Diese Seite geht dann von selbst weiter.',
  'UI-RESET-OHNE-VERSAND': 'Wir können gerade keine Codes verschicken. Schreib uns über die Hilfe — wir helfen dir, wieder in dein Konto zu kommen.',
  'UI-ZWEITER-WEG-OHNE-VERSAND': 'Wir können gerade keine Codes verschicken. Unser Team bestätigt die neue Angabe; sie erscheint dann hier von selbst.',
  'UI-TEAM-WARTET-KURZ': 'Wartet auf unser Team …',

  # ───── Stufe 2 und Fotoprüfung ohne Prüfpartner ─────
  'UI-TEAMPRUEFUNG-WEG': 'Prüfung durch unser Team',
  'UI-TEAMPRUEFUNG-TITEL': 'Prüfung durch unser Team',
  'UI-TEAMPRUEFUNG-ERKL-STUFE2': 'Fotografiere die Seite deines Ausweises mit dem Geburtsdatum (Name, Adresse und Nummer darfst du abdecken) und mach ein Selfie mit der Geste unten. Ein Mensch aus unserem Team prüft beides, meist innerhalb von {stunden} Stunden. Danach löschen wir die Bilder.',
  'UI-TEAMPRUEFUNG-ERKL-FOTO': 'Mach ein Selfie mit der Geste unten. Ein Mensch aus unserem Team vergleicht es mit deinen Profilfotos, meist innerhalb von {stunden} Stunden. Danach löschen wir das Selfie.',
  'UI-TEAMPRUEFUNG-GESTE': 'Zeig auf dem Selfie: {geste}',
  'UI-TEAMPRUEFUNG-AUSWEIS': 'Foto vom Ausweis',
  'UI-TEAMPRUEFUNG-SELFIE': 'Selfie mit Geste',
  'UI-TEAMPRUEFUNG-SENDEN': 'An unser Team senden',
  'UI-TEAMPRUEFUNG-GESENDET': 'Danke! Unser Team prüft deine Bilder, meist innerhalb von {stunden} Stunden. Du bekommst eine Mitteilung.',
  'UI-TEAMPRUEFUNG-LAEUFT': 'Deine Bilder liegen bei unserem Team. Du bekommst eine Mitteilung, sobald entschieden ist.',
  'UI-TEAMPRUEFUNG-STUFE2-TITEL': 'Stufe 2',
  'UI-TEAMPRUEFUNG-STUFE2-OK': 'Deine Prüfung für Stufe 2 ist bestanden.',
  'UI-TEAMPRUEFUNG-STUFE2-NEIN': 'Wir konnten Stufe 2 anhand deiner Bilder nicht bestätigen. Du kannst es mit neuen Bildern noch einmal versuchen.',
  'UI-TEAMPRUEFUNG-FOTO-TITEL': 'Fotoprüfung',
  'UI-TEAMPRUEFUNG-FOTO-OK': 'Deine Fotoprüfung ist bestanden — dein Profil trägt jetzt das Prüfzeichen.',
  'UI-TEAMPRUEFUNG-FOTO-NEIN': 'Dein Selfie passte nicht eindeutig zu deinen Profilfotos. Du kannst es noch einmal versuchen.',

  # ───── Cruizy Date ohne Anbieter ─────
  'UI-TEAMPRUEFUNG-DATE-TITEL': 'Cruizy Date',
  'UI-TEAMPRUEFUNG-DATE-OK': 'Dein Selfie ist bestätigt — du kannst dein Date-Profil jetzt fertigstellen.',
  'UI-TEAMPRUEFUNG-DATE-NEIN': 'Dein Selfie passte nicht eindeutig zu deinem ersten Date-Foto. Du kannst es noch einmal versuchen.',
  'UI-DATE-TEAM-PRUEFT': 'Unser Team vergleicht dein Selfie mit deinem ersten Foto, meist innerhalb von {stunden} Stunden. Du bekommst eine Mitteilung.',
}

ERSETZT = {
  'UI-MODZEIT-HASH-AUS': 'Der Abgleich mit bekannten Missbrauchsdarstellungen ist noch nicht angebunden — deshalb prüft ein Mensch aus unserem Team jedes Profilbild, bevor es sichtbar wird.',
}
