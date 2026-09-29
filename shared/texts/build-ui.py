#!/usr/bin/env python3
"""Erzeugt ui-de.json — Texte der Oberfläche und der Serverantworten, die (noch)
keine ST-ID aus dem Systemtext-Entwurf haben. Alle Einträge sind ENTWURF.
Aufruf: python3 shared/texts/build-ui.py"""
import json, os

T = {
  # ───── allgemeine Fehler und Hinweise ─────
  'UI-EINGABE-PRUEFEN': 'Bitte prüf deine Eingabe.',
  'UI-NICHT-VERFUEGBAR': 'Das ist nicht mehr verfügbar.',
  'UI-ZU-VIELE': 'Das waren gerade zu viele Versuche. Bitte warte einen Moment.',
  'UI-ZU-SPAET': 'Dafür ist es jetzt zu spät.',
  'UI-LINK-UNGUELTIG': 'Dieser Link ist nicht mehr gültig.',
  'UI-NEU-ANMELDEN': 'Bitte gib zur Sicherheit noch einmal dein Passwort oder einen Code ein.',
  'UI-TESTBETRIEB-EINLADUNG': 'Wir sind gerade im Testbetrieb. Zum Registrieren brauchst du einen Einladungscode.',
  'UI-TESTBETRIEB-HINWEIS': 'Testbetrieb — bitte nur erfundene Angaben und keine echten Fotos von dir.',
  'UI-WARTEFRIST': 'Die Wartefrist läuft noch.',

  # ───── Anmeldung, Codes ─────
  'UI-ANMELDUNG-FALSCH': 'Anmeldedaten stimmen nicht.',
  'UI-CODE-FALSCH': 'Der Code stimmt nicht.',
  'UI-CODE-NEU': 'Der Code ist abgelaufen. Lass dir einen neuen schicken.',
  'UI-CODE-WARTEN': 'Bitte warte kurz, bevor du einen neuen Code anforderst.',
  'UI-PASSWORT-KURZ': 'Das Passwort braucht mindestens {zahl} Zeichen.',
  'UI-NUMMER-UNGUELTIG': 'Diese Nummer können wir nicht verwenden.',
  'UI-APPLE-AUS': 'Anmelden mit Apple ist gerade nicht verfügbar.',
  'UI-EINWILLIGUNG-FEHLT': 'Bevor es weitergeht, brauchen wir deine Einwilligung.',
  'UI-EINWILLIGUNG-NEU': 'Der Text der Einwilligung hat sich geändert. Bitte lies ihn noch einmal.',
  'UI-SCHLUESSEL-FALSCH': 'Dieser Schlüssel passt nicht.',
  'UI-SCHLUESSEL-ABGELAUFEN': 'Das hat zu lange gedauert. Bitte versuch es noch einmal.',
  'UI-SCHLUESSEL-FEHLER': 'Der Schlüssel ließ sich nicht prüfen.',
  'UI-SCHLUESSEL-SYNC': 'Dieser Schlüssel wird mit anderen Geräten geteilt. Wir brauchen einen, der nur auf diesem Gerät liegt.',
  'UI-WHR-TITEL': 'Wiederherstellung deines Kontos',

  # ───── Konto- und Altersstatus ─────
  'UI-ALTER-UNTER-18': 'Bevor du weitermachen kannst, brauchen wir eine Altersprüfung.',
  'UI-PROFIL-FEHLT': 'Leg zuerst dein Profil an.',
  'UI-KONTO-EINGESCHRAENKT': 'Dein Konto ist eingeschränkt. Du kannst lesen, aber nichts senden.',
  'UI-KONTO-GESPERRT': 'Dein Konto ist gesperrt. In deinen Mitteilungen steht, warum — und wie du widersprechen kannst.',
  'UI-STUFE2-SCHON': 'Diese Prüfung hast du schon bestanden.',
  'UI-FOTOPRUEFUNG-EINWILLIGUNG': 'Für die Fotoprüfung brauchen wir deine ausdrückliche Zustimmung.',
  'UI-FOTOPRUEFUNG-FOTO': 'Wähl zuerst ein Foto aus deinem Profil.',
  'UI-FOTOPRUEFUNG-VERSUCHE': 'Du hast die Fotoprüfung heute schon oft versucht. Morgen geht es wieder.',

  # ───── Profil ─────
  'UI-NAME-UNGUELTIG': 'Der Name darf höchstens {max} Zeichen lang sein und keine Links oder Nummern enthalten.',
  'UI-MERKMALE-MAX': 'Du kannst höchstens {max} Merkmale wählen.',
  'UI-FOTOS-MAX': 'Mehr als acht Fotos gehen nicht.',
  'UI-SORT-AQ-AUS': 'Diese Sortierung gibt es nur, wenn deine eigene Antwortquote eingeschaltet ist.',
  'UI-KEIN-UNKENNTLICHES-FOTO': 'Du hast kein unkenntlich gemachtes Foto, das sich freischalten ließe.',

  # ───── Standort ─────
  'UI-ZONEN-MAX': 'Mehr als {max} Zonen gehen nicht.',
  'UI-ZONE-RADIUS': 'Der Radius muss zwischen {min} und {max} km liegen.',

  # ───── Gast ─────
  'UI-GAST-PAUSE': 'Die Vorschau ist für heute vorbei. Registrier dich, um weiterzumachen.',
  'UI-GAST-NETZ': 'Von diesem Netz aus wurde die Vorschau heute schon oft geöffnet.',

  # ───── Gespräche, Album ─────
  'UI-TREFFPUNKT-SPAETER': 'Das geht erst, wenn ihr beide geschrieben habt.',
  'UI-VERFALL-NICHT-DU': 'Nur wer das Verschwinden eingeschaltet hat, kann es ausschalten.',
  'UI-ALBUM-LEER': 'Dein Album ist noch leer.',
  'UI-ALBUM-MAX': 'Dein Album hat höchstens {max} Bilder.',
  'UI-ALBUM-NICHT-JETZT': 'Ein Album kannst du erst anbieten, wenn Bilder in diesem Gespräch erlaubt sind.',

  # ───── Melden, Entscheidungen, Widerspruch ─────
  'UI-MEL-INTIM': 'Intime Bilder ohne Einwilligung',
  'UI-MELDEN-INHALT-WEG': 'Dieser Inhalt ist nicht mehr da und lässt sich nicht mehr melden.',
  'UI-MELDEN-KONTAKT': 'Bitte gib einen Namen und eine E-Mail-Adresse an, damit wir dir antworten können.',
  'UI-MELDUNG-ENTSCHIEDEN': 'Deine Meldung {fallnummer}',
  'UI-DIE-PERSON': 'die Person',
  'UI-EINEN-INHALT': 'einen Inhalt von dir',
  'UI-DEIN-FOTO': 'dein Foto',
  'UI-DEIN-KONTO-EINGESCHRAENKT': 'dein Konto (du kannst lesen, aber nichts senden)',
  'UI-DEIN-KONTO-GESPERRT': 'dein Konto',
  'UI-ENTSCHEIDUNG-BLEIBT': 'kein Verstoß',
  'UI-ENTSCHEIDUNG-INHALT-ENTFERNT': 'Inhalt entfernt',
  'UI-ENTSCHEIDUNG-EINGESCHRAENKT': 'Konto eingeschränkt',
  'UI-ENTSCHEIDUNG-GESPERRT': 'Konto gesperrt',
  'UI-ENTSCHEIDUNG-AN-BEHOERDE': 'an die zuständige Behörde weitergegeben',
  'UI-ENTSCHEIDUNG-BETROFFEN': 'Eine Entscheidung zu deinem Konto',
  'UI-FOTO-ABGELEHNT-TITEL': 'Dein Foto wurde nicht freigegeben',
  'UI-WEGE-DAGEGEN': 'Du kannst innerhalb der Frist widersprechen. Ein anderer Mensch als der, der entschieden hat, prüft das. Außerdem steht dir die außergerichtliche Streitbeilegung und der Rechtsweg offen.',
  'UI-WIDERSPRUCH-LAEUFT': 'Zu dieser Entscheidung läuft schon ein Widerspruch.',
  'UI-WIDERSPRUCH-FRIST': 'Du kannst innerhalb von {stunden} Stunden widersprechen — unter „Ich“ → „Mitteilungen“.',
  'UI-WIDERSPRUCH-ENTSCHIEDEN': 'Dein Widerspruch {fallnummer}',
  'UI-WIDERSPRUCH-BLEIBT': 'Die Entscheidung bleibt bestehen.',
  'UI-WIDERSPRUCH-AUFGEHOBEN': 'Die Entscheidung ist aufgehoben. Alles ist wiederhergestellt.',
  'UI-WIDERSPRUCH-ABGEMILDERT': 'Die Entscheidung ist abgemildert.',
  'UI-WIDERSPRUCH-OFFENLEGUNG': 'Hinweis: Die Person, die über deinen Widerspruch entschieden hat, hat die ursprüngliche Entscheidung mit freigegeben. Wir sind zurzeit nur zu zweit.',
  'UI-WIDERSPRUCH-HASH-WEG': 'Zu dieser Entscheidung können wir keine Einzelheiten nennen. Der Weg dagegen führt über die zuständige Behörde.',
  'UI-SPERRE-TITEL': 'Eine Entscheidung zu deinem Konto',
  'UI-SPERRE-AB': 'Gilt ab: {zeit}',
  'UI-SPERRE-LOESCHUNG': 'Nach Ablauf aller Fristen wird das Konto gelöscht.',
  'UI-SPERRE-AUFGEHOBEN-TITEL': 'Dein Konto ist wieder frei',
  'UI-SPERRE-AUFGEHOBEN-TEXT': 'Die Einschränkung deines Kontos ist aufgehoben. Du kannst alles wieder wie vorher nutzen.',

  # ───── Check-in ─────
  'UI-CHECKIN-FRAGE-TEXT': 'Alles in Ordnung? Tipp auf „Mir geht’s gut“.',
  'UI-CHECKIN-MAIL-BETREFF': 'Nachricht',
  'UI-CHECKIN-WEITERREICHEN': 'Bitte öffnen',
  'UI-CHECKIN-ZEIT': 'Der Beginn muss zwischen jetzt und den nächsten 24 Stunden liegen.',

  # ───── Ereignisse ─────
  'UI-EREIGNIS-ABGESAGT': 'Diese Veranstaltung ist abgesagt.',
  'UI-EREIGNIS-VORBEI': 'Diese Veranstaltung ist vorbei.',

  # ───── Datenkonto ─────
  'UI-EXPORT-FEHLER': 'Deine Datenkopie ließ sich nicht erstellen. Bitte fordere sie noch einmal an.',
  'UI-RUECKMELDUNG-ANTWORT': 'Antwort auf deine Rückmeldung',

  # ───── Mails (Betreff und erster Satz ohne Anlass und ohne Produktnamen) ─────
  'UI-MAIL-HILFE-EINGANG': 'Wir haben deine Nachricht unter der Fallnummer {fallnummer} erhalten. Ein Mensch liest sie und antwortet dir an diese Adresse.',
  'UI-MAIL-MELDUNG-EINGANG': 'Wir haben deine Nachricht unter der Fallnummer {fallnummer} erhalten. Wir melden uns, sobald entschieden ist.',
  'UI-MAIL-ANTWORT-EINLEITUNG': 'Hier ist unsere Antwort zu deinem Fall {fallnummer}.',
  'UI-MAIL-ORT-BETREFF': 'Vorgang {nummer}',
  'UI-MAIL-ORT-TEXT': 'Bitte bestätige deine Adresse mit diesem Link: {link}\n\nDanach prüft ein Mensch die Anfrage {nummer}, in der Regel innerhalb von 24 Stunden. Wenn du nichts angefragt hast, ignoriere diese Mail.',
  'UI-MAIL-ORT-BESTAETIGT': 'Deine Anfrage {nummer} ist bestätigt. Der Eintrag trägt jetzt das Kennzeichen „vom Ort bestätigt“.',
  'UI-MAIL-ORT-ENTFERNT': 'Deine Anfrage {nummer} ist bestätigt. Der Eintrag ist entfernt und wird nicht wieder aufgenommen.',
  'UI-MAIL-ORT-ABGELEHNT': 'Deine Anfrage {nummer} konnten wir nicht bestätigen. Grund: {grund}',
  'UI-MAIL-ORT-RUECKFRAGE': 'Zu deiner Anfrage {nummer} haben wir eine Rückfrage:\n\n{frage}\n\nAntworte einfach auf diese Mail.',
  'UI-MAIL-TERMIN-BETREFF': 'Deine Einreichung',

  # ───── Moderationswerkzeug ─────
  'UI-MOD-ANMELDEN': 'Bitte melde dich an.',
  'UI-MOD-RECHT': 'Dafür hat deine Rolle keine Berechtigung.',
  'UI-MOD-GRUND': 'Ohne Begründung wird nichts ausgeführt.',
  'UI-MOD-ZWEITE-PERSON': 'Dafür braucht es die Freigabe einer zweiten Person.',
  'UI-MOD-EIGENER-ANTRAG': 'Den eigenen Antrag kann niemand selbst freigeben.',
  'UI-MOD-EIGENER-FALL': 'Über die eigene Entscheidung entscheidet eine andere Person.',
  'UI-MOD-NACH-21': 'Ab 21 Uhr werden keine Hash-Fälle mehr geöffnet. Die Frist lässt das zu.',
  'UI-MOD-TAGESGRENZE': 'Heute sind es schon zwei Hash-Fälle. Übergib den Fall an die zweite Person oder an die Beschwerdestelle.',
  'UI-MOD-SCHON-ENTSCHIEDEN': 'Dieser Fall ist schon entschieden.',
  'UI-MOD-KEIN-KONTO': 'Zu diesem Fall gibt es kein Konto (mehr).',
  'UI-MOD-BEZUG-FEHLT': 'Ohne gültige Fall- oder Meldenummer geht das nicht.',
  'UI-MOD-ANTRAG-OFFEN': 'Zu diesem Konto ist schon ein Antrag offen.',
  'UI-MOD-NEUER-GRUND': 'Mit genau diesem Grund wurde schon einmal abgelehnt. Ein neuer Anlauf braucht einen neuen Grund.',
  'UI-MOD-NICHTS-AUFZUHEBEN': 'Dieses Konto ist weder eingeschränkt noch gesperrt.',
  'UI-MOD-HASH-WIDERSPRUCH': 'Einen Hash-Fall entscheidet nicht das Werkzeug, sondern die Behörde.',
  'UI-MOD-KATEGORIE-WIDERSPRUCH': 'Kategorie 7 ist kein Vorgang, sondern ein Widerspruch.',
  'UI-MOD-ERST-RUECKFRAGE': 'Für diesen Ort gibt es mehrere Anfragen. Erst Rückfrage bei allen stellen.',
  'UI-MOD-PRUEFLISTE': 'Ohne alle fünf Prüfpunkte keine Freigabe.',
  'UI-MOD-ORT-GESPERRT': 'Dieser Ort wurde auf eigenen Wunsch entfernt und wird nicht wieder aufgenommen.',
  'UI-MOD-ENTWURF-VORHANDEN': 'Zu diesem Fall gibt es schon einen Entwurf.',
  'UI-MOD-TEXT-BESTAETIGEN': 'Der Sachverhalt muss gelesen und bestätigt sein.',
  'UI-MOD-PARAMETER-TYP': 'Dieser Wert passt nicht zum Parameter.',
  'UI-MOD-ANSPRECHPERSON-FEHLT': 'Ohne hinterlegte Ansprechperson lässt sich der Hash-Abgleich nicht einschalten.',
  'UI-MOD-ABGLEICH-FEHLT': 'Es ist kein Abgleichdienst angebunden (HASH_PROVIDER).',
  'UI-MOD-AUS-VORGANG': 'Aus dem Vorgang {nummer} des Kontaktservice.',
  'UI-MOD-NOTFALL-1': 'Ärztlicher Bereitschaftsdienst: 116117',
  'UI-MOD-NOTFALL-2': 'TelefonSeelsorge: 0800 111 0 111 und 0800 111 0 222',

  # ───── Hilfe: Kategorien (kontaktservice-und-tickets.md 2.3) ─────
  'UI-HLF-KAT-1': 'Jemand ist in Gefahr',
  'UI-HLF-KAT-2': 'Belästigung, Drohung, verbotener Inhalt',
  'UI-HLF-KAT-3': 'Ich komme nicht in mein Konto',
  'UI-HLF-KAT-4': 'Zahlung und Abo',
  'UI-HLF-KAT-5': 'Etwas funktioniert nicht',
  'UI-HLF-KAT-6': 'Meine Daten — Auskunft, Löschung, Export, Widerspruch',
  'UI-HLF-KAT-7': 'Mein Konto wurde eingeschränkt',
  'UI-HLF-KAT-8': 'Ein Ort oder eine Veranstaltung',
  'UI-HLF-KAT-9': 'Presse, Behörde, rechtliche Anfrage',
  'UI-HLF-KAT-10': 'Etwas anderes',
}

FAQ = [
  ('Ich komme nicht mehr in mein Konto — was kann ich tun?', 'Auf der Anmeldeseite unter „Passwort vergessen“ schicken wir dir einen Code an deine bestätigte Adresse oder Nummer. Hast du beides nicht mehr, hilft dein Wiederherstellungscode oder der Weg über eine Vertrauensperson.'),
  ('Ich habe meinen Wiederherstellungscode verloren.', 'Solange du angemeldet bist, kannst du unter „Ich“ → „Konto“ einen neuen Code erzeugen. Der alte gilt dann nicht mehr.'),
  ('Warum muss ich mein Alter prüfen lassen, bevor ich schreiben kann?', 'Weil hier nur Volljährige sein dürfen. Wir speichern davon nur „geprüft ja/nein“, den Zeitpunkt und den Weg — kein Ausweisbild, kein Geburtsdatum.'),
  ('Was passiert mit meinem Selfie bei der Altersprüfung?', 'Die Prüfung macht ein Prüfpartner. Wir erhalten nur das Ergebnis. Was der Partner speichert und wie lange, steht in unserer Datenschutzerklärung.'),
  ('Warum sehe ich manche Profile nicht?', 'Wer dich blockiert hat oder wen du blockiert hast, erscheint nicht. Manche Personen sind nur für bestimmte Gruppen sichtbar oder gerade unsichtbar.'),
  ('Wie genau wird mein Standort angezeigt?', 'Nie genau. Wir runden auf ein Raster (ungefähr 2 km oder 500 m, je nach Einstellung) und zeigen anderen nur eine Entfernungsstufe, keine Meter.'),
  ('Was ist eine Zone, und wie viele sind kostenlos?', 'Eine Zone ist ein Bereich, etwa um deine Wohnung. Darin zeigen wir statt deines Ortes einen Ersatzpunkt. Die Zahl der Zonen steht in den Einstellungen.'),
  ('Wie verstecke ich die App auf meinem Gerät?', 'Mit dem schnellen Ausblenden: dreimal schnell auf den Titel oben tippen oder zweimal Escape drücken. Die App wechselt sofort auf eine neutrale Seite.'),
  ('Wie blockiere ich jemanden, und was sieht die Person davon?', 'Im Profil oder Gespräch unter „Blockieren“. Die Person erhält keine Nachricht — sie sieht dich nur nicht mehr. Eine Weile lang kannst du es zurücknehmen.'),
  ('Ich habe jemanden gemeldet — wie geht es weiter?', 'Ein Mensch prüft die Meldung, in der Regel innerhalb von 24 Stunden. Das Ergebnis steht in deinen Mitteilungen. Wer gemeldet hat, sagen wir niemandem.'),
  ('Wie lange bleiben meine Nachrichten gespeichert?', 'Solange das Gespräch besteht. Beendete Gespräche liegen 24 Stunden im Archiv und sind danach bei beiden gelöscht. Verschwindende Nachrichten gehen schon früher.'),
  ('Wie lösche ich mein Konto, und was passiert dann mit meinen Daten?', 'Unter „Ich“ → „Meine Daten“. Du hast danach 30 Tage Zeit, es dir anders zu überlegen. Dann löschen wir alles, bis auf das, was wir gesetzlich aufbewahren müssen.'),
  ('Wie bekomme ich eine Kopie meiner Daten?', 'Unter „Ich“ → „Meine Daten“ → „Kopie anfordern“. Du bekommst eine verschlüsselte ZIP-Datei mit einem Passwort, das nur du kennst.'),
  ('Meine Zahlung ist nicht angekommen.', 'Schreib uns mit der Kategorie „Zahlung und Abo“ — mit dem ungefähren Zeitpunkt. Zahlungsdaten brauchen wir nicht.'),
  ('Wie kündige ich mein Abo?', 'Dort, wo du es abgeschlossen hast. Im Web unter „Ich“ → „Abo“, mit zwei Klicks.'),
  ('Was genau ist im Abo enthalten — und was bleibt kostenlos?', 'Alles, was mit Sicherheit zu tun hat, bleibt kostenlos: Blockieren, Melden, Zonen, Check-in, Ausblenden. Das Abo bringt Komfort, keine Sicherheit.'),
  ('Warum wurde mein Foto abgelehnt?', 'Der Grund steht in deinen Mitteilungen, oft mit der markierten Stelle. Du kannst innerhalb von 48 Stunden Einspruch einlegen — ein Mensch prüft das.'),
  ('Mein Konto wurde eingeschränkt — warum, und was kann ich tun?', 'Der Grund steht in deinen Mitteilungen. Dort kannst du widersprechen. Es entscheidet dann jemand anderes als die Person, die eingeschränkt hat.'),
  ('Wie melde ich einen Ort oder eine Veranstaltung?', 'Über „Schreib uns“ mit der Kategorie „Ein Ort oder eine Veranstaltung“.'),
  ('Wie erreiche ich einen Menschen?', 'Über „Schreib uns“ unten auf dieser Seite. Ein Mensch liest jede Nachricht.'),
]
for i, (q, a) in enumerate(FAQ, 1):
    T[f'UI-FAQ-{i:02d}-F'] = q
    T[f'UI-FAQ-{i:02d}-A'] = a

out = {k: {'t': v, 's': 'ENTWURF'} for k, v in T.items()}
here = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(here, 'ui-de.json'), 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, indent=1, sort_keys=True)
    f.write('\n')
print(len(out), 'Texte geschrieben')
