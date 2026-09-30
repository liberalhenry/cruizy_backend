"""Oberflächentexte der Funktionen aus den Issues #11–#30 (Herbst 2026). Alle ENTWURF.
Wird von build-ui.py eingelesen — nicht allein aufrufen."""

NEU = {
  # ───── #12 Entfernungen ─────
  'UI-KM-UNTER-1': '< 1 km',
  'UI-KM': '{km} km',

  # ───── #13 Profil ─────
  'UI-PROFIL-UEBER-MICH': 'Über mich',
  'UI-PROFIL-GROESSE': 'Größe (cm)',
  'UI-PROFIL-GEWICHT': 'Gewicht (kg)',
  'UI-PROFIL-POSITION': 'Position',
  'UI-PROFIL-KOERPERTYP': 'Körpertyp',
  'UI-KOERPERTYP-MAX': 'Höchstens {max} Körpertypen.',
  'UI-PROFIL-KINKS': 'Kinks und Fetische',
  'UI-PROFIL-KINKS-ERKL': 'Ganz freiwillig. Was du auswählst, steht sichtbar in deinem Profil. Du kannst es jederzeit wieder entfernen.',
  'UI-KINKS-MAX': 'Höchstens {max} Angaben.',
  'UI-PROFIL-FREITEXT-ZAEHLER': '{zahl}/{max}',
  'UI-PROFIL-KEINE-ANGABE': 'Keine Angabe',
  'UI-PROFIL-TIPPEN-BEARBEITEN': 'Tippen zum Bearbeiten',
  'UI-FOTOS-ANZAHL': '{zahl} von {max} Fotos',
  'UI-PROFIL-VORSCHAU': 'So sehen dich andere',
  'UI-TAB-ICH-PROFIL': 'Ich',
  'UI-FOTO-IN-PRUEFUNG': 'in Prüfung',
  'UI-FOTO-ALS-ERSTES': 'Als erstes Foto zeigen',
  'UI-APP-NEUES': 'Neues',

  # ───── #22 Raster ─────
  'UI-RASTER-TRENNER': 'Das war’s in {x} km. Etwas weiter weg (bis {y} km):',
  'UI-RASTER-NEU-REIHE': 'Neu in deiner Nähe',
  'UI-RASTER-NEU': 'Neu',
  'UI-RASTER-RADIUS': 'Umkreis',
  'UI-RASTER-RADIUS-WERT': '{km} km',
  'UI-RASTER-RADIUS-ERKL': 'Alle, die in diesem Umkreis sichtbar sind, siehst du immer — nur die Reihenfolge wird gemischt.',
  'UI-RASTER-ERWEITERN': 'Auch Profile außerhalb meines Radius anzeigen',
  'UI-RASTER-ERWEITERN-ERKL': 'Sind es weniger als {zahl}, zeigen wir darunter Profile weiter weg — getrennt, bis höchstens {km} km.',
  'UI-RASTER-ENDE': 'Das sind alle.',
  'UI-RASTER-LEER': 'Im Umkreis von {km} km ist gerade niemand zu sehen.',
  'UI-RASTER-LEER-ERWEITERN': 'Umkreis vergrößern',
  'UI-RASTER-LAEDT': 'Lädt weitere Profile …',
  'UI-RASTER-UMKREIS-TITEL': 'Umkreis',
  'UI-RASTER-ANWENDEN': 'Übernehmen',
  'UI-RASTER-TRAVEL': 'Du stöberst in {ort}.',

  # ───── #20 Suche und Filter ─────
  'UI-SUCHE': 'Suchen',
  'UI-SUCHE-TITEL': 'Namen suchen',
  'UI-SUCHE-PLATZHALTER': 'Name',
  'UI-SUCHE-ZU-KURZ': 'Mindestens {zahl} Zeichen.',
  'UI-SUCHE-KEINE': 'Niemand mit diesem Namen im Umkreis von {km} km.',
  'UI-SUCHE-ERKL': 'Gesucht wird im Umkreis von {km} km — nur Profile, die gefunden werden möchten. Die Filter gelten auch hier.',
  'UI-SUCHE-TREFFER': '{zahl} Treffer',
  'UI-EINST-AUFFINDBAR': 'Über die Namenssuche auffindbar',
  'UI-EINST-AUFFINDBAR-ERKL': 'Aus: Andere finden dich nicht über deinen Namen. Im Raster bleibst du sichtbar.',
  'UI-FILTER-GEWICHT': 'Gewicht (kg)',
  'UI-FILTER-GROESSE': 'Größe (cm)',
  'UI-FILTER-KOERPERTYP': 'Körpertyp',
  'UI-FILTER-KINKS': 'Kinks und Fetische',
  'UI-FILTER-POSITION': 'Position',
  'UI-FILTER-ANTWORTET': 'Antwortet meistens oder besser',
  'UI-FILTER-MIT-FOTO': 'Nur mit Foto',
  'UI-FILTER-AKTIV': '{zahl} aktiv',
  'UI-FILTER-BEREICH-AN': 'Bereich festlegen',
  'UI-FILTER-ODER': 'Mindestens eins davon',

  # ───── #18 Travel (Grundlage für das Raster) ─────
  'UI-TRAVEL-BEENDEN': 'Zurück zu meinem Ort',
  'UI-TRAVEL-BALD-REIHE': 'Bald in der Gegend',
  'UI-TRAVEL-BALD-KURZ': 'Bald in {ort}',
}

# Bestehende Texte, die sich durch die Issues ändern
ERSETZT = {
  'UI-FOTOS-MAX': 'Mehr als {max} Fotos gehen nicht.',
}
