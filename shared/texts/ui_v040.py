"""Oberflächentexte der Issues #32–#39 (Version 0.4.0). Alle ENTWURF.
Wird von build-ui.py eingelesen — nicht allein aufrufen."""

NEU = {
  # ───── #38 Verstecken: Rückweg ─────
  'UI-TARN-ZURUECK-ALLE': 'Dreimal schnell oben auf den Bildschirm tippen (am Computer: zweimal Escape) und die PIN eingeben. Ohne PIN geht es sofort zurück.',
  'UI-TARN-AUSSERDEM': 'Außerdem:',
  'UI-TARN-VORHER-TITEL': 'So kommst du zurück',
  'UI-TARN-VORHER-OK': 'Verstanden — jetzt verstecken',
  'UI-TARN-OHNE-PIN': 'Du hast noch keine PIN. Dann kann jede Person mit dieser Geste zurück in die App.',

  # ───── #36 Mitteilungen: Knopf dorthin ─────
  'UI-MITTEILUNG-DORTHIN': 'Dorthin ›',
  'UI-MITTEILUNG-ZUR-VERANSTALTUNG': 'Zur Veranstaltung',
  'UI-MITTEILUNG-ZUM-CHAT': 'Zum Chat',
  'UI-MITTEILUNG-ZUR-PRUEFUNG': 'Zur Prüfung',

  # ───── #32 Telegram statt SMS (Texte im Bot: neutral, ohne Produktnamen) ─────
  'UI-TG-WILLKOMMEN': 'Hallo! Hier bekommst du Bestätigungscodes und — wenn du es einschaltest — Benachrichtigungen. Tippe unten auf „Nummer teilen“, damit Codes an deine Nummer hier ankommen.',
  'UI-TG-HILFE': 'Tippe auf „Nummer teilen“, um deine Nummer zu verbinden. Mit /stop trennst du alles wieder.',
  'UI-TG-NUMMER-TEILEN': '📱 Nummer teilen',
  'UI-TG-NUR-EIGENE': 'Bitte teile deine eigene Nummer über den Knopf unten — nicht den Kontakt einer anderen Person.',
  'UI-TG-NUMMER-UNGUELTIG': 'Diese Nummer können wir nicht verwenden.',
  'UI-TG-VERBUNDEN': 'Verbunden. Codes für deine Nummer kommen ab jetzt hier an. Mit /stop trennst du die Verbindung.',
  'UI-TG-GETRENNT': 'Getrennt. Hier kommt nichts mehr an, bis du wieder „Nummer teilen“ tippst.',
  'UI-TG-LINK-ABGELAUFEN': 'Dieser Link ist abgelaufen. Öffne ihn bitte noch einmal aus der App.',
  'UI-TG-KONTO-VERBUNDEN': 'Verbunden. Deine Benachrichtigungen kommen ab jetzt auch hier an. Ausschalten kannst du das in der App unter Einstellungen.',
  'UI-TG-KONTO-GETRENNT': 'Benachrichtigungen kommen hier nicht mehr an.',
  'UI-TG-NICHT-EINGERICHTET': 'Telegram ist gerade nicht verfügbar.',
  'UI-TG-CODE-KOMMT': 'Der Code kommt per Telegram. Beim ersten Mal: Bot öffnen, „Starten“ und dann „Nummer teilen“ tippen — dann kommt der Code sofort.',
  'UI-TG-OEFFNEN': 'Telegram öffnen',
  'UI-TG-CHECKIN-HINWEIS': 'Nachrichten an Telefonnummern gehen über Telegram. Deine Vertrauensperson muss den Bot einmal öffnen und dort „Nummer teilen“ tippen — schick ihr dazu diesen Link:',
  'UI-TG-LINK-KOPIEREN': 'Link kopieren',
  'UI-KONTO-NUMMER-TELEGRAM': 'Telefonnummer (Codes per Telegram)',
  'UI-KONTO-CODE-EINGEBEN': 'Code eingeben',
  'UI-APP-KOPIERT': 'Kopiert.',

  # ───── #35 Mitteilungen per E-Mail / Telegram ─────
  'UI-NF-TITEL': 'Auch außerhalb der App',
  'UI-NF-ERKL': 'Jede Mitteilung, die hier ankommt, bekommst du auf Wunsch zusätzlich per E-Mail oder Telegram. Antworten geht weiterhin nur in der App.',
  'UI-NF-EMAIL': 'Per E-Mail',
  'UI-NF-EMAIL-HINT': 'An deine bestätigte E-Mail-Adresse.',
  'UI-NF-EMAIL-FEHLT': 'Dafür brauchst du eine bestätigte E-Mail-Adresse (unter „Konto sichern“).',
  'UI-NF-TELEGRAM': 'Per Telegram',
  'UI-NF-TELEGRAM-VERBINDEN': 'Mit Telegram verbinden',
  'UI-NF-TELEGRAM-VERBINDEN-ERKL': 'Öffnet unseren Bot in Telegram. Tippe dort auf „Starten“ — fertig. Der Link gilt 30 Minuten.',
  'UI-NF-TELEGRAM-TRENNEN': 'Telegram trennen',
  'UI-NF-TELEGRAM-FEHLT': 'Verbinde zuerst Telegram.',
  'UI-NF-TELEGRAM-AUS': 'Telegram ist auf diesem Server noch nicht eingerichtet.',
  'UI-NF-INHALT': 'Inhalt mitschicken',
  'UI-NF-INHALT-HINT': 'Sonst kommt nur ein Hinweis ohne Inhalt mit Link in die App. Sicherheitsmitteilungen gehen immer ohne Inhalt hinaus.',
  'UI-NF-MAIL-BETREFF': 'Neue Mitteilung',
  'UI-NF-MAIL-VORSCHAU': 'Es gibt etwas Neues für dich.',
  'UI-NF-OHNE-INHALT': 'Es gibt eine neue Mitteilung für dich. Du findest sie, wenn du dich anmeldest.',
  'UI-NF-IN-DER-APP': 'In der App ansehen',
  'UI-NF-GEPRUEFT': 'Aktualisieren',

  # ───── #37 Support-Portal ─────
  'UI-SUP-TITEL': 'Support',
  'UI-SUP-SCHREIBEN': 'Dem Support-Team schreiben',
  'UI-SUP-SCHREIBEN-ERKL': 'Ein Mensch aus unserem Team liest jede Nachricht. Die Antwort kommt hier in der App.',
  'UI-SUP-POSTFACH': 'Deine Anfragen',
  'UI-SUP-LEER': 'Noch keine Anfragen.',
  'UI-SUP-NEU': 'Neu',
  'UI-SUP-DU': 'Du',
  'UI-SUP-TEAM': 'Support-Team',
  'UI-SUP-ANTWORT-PLATZHALTER': 'Antwort an das Team …',
  'UI-SUP-NUR-APP': 'Antworten kannst du nur hier in der App — nicht per E-Mail.',
  'UI-SUP-MAIL-HINWEIS-SCHALTER': 'Bei Antworten per E-Mail benachrichtigen',
  'UI-SUP-MAIL-HINWEIS-ERKL': 'Die E-Mail sagt nur, dass es eine Antwort gibt — lesen und antworten kannst du hier.',
  'UI-SUP-MAIL-HINWEIS': 'Im Vorgang {fallnummer} gibt es etwas Neues für dich. Lesen und antworten kannst du in der App.',
  'UI-SUP-ABGESCHLOSSEN': 'Dieser Vorgang ist abgeschlossen. Schreib uns gern eine neue Nachricht.',
  'UI-SUP-FREIGABE-TITEL': 'Das Team bittet um Einsicht',
  'UI-SUP-FREIGABE-ERKL': 'Damit wir dir helfen können, möchten wir folgende Daten sehen. Ohne deine Zustimmung sehen wir nichts davon. Die Freigabe gilt {tage} Tage, und du kannst sie jederzeit zurücknehmen.',
  'UI-SUP-BEREICH-KONTO': 'Kontodaten — Anmeldeweg, Status, bestätigte Wege (gekürzt), Geräte- und Sitzungsanzahl, Abo',
  'UI-SUP-BEREICH-PROFIL': 'Profildaten — Name, Alter, Absicht, Fotoanzahl, Einstellungen, Date-Status (kein Standort, keine Nachrichten)',
  'UI-SUP-BEREICH-DIAGNOSE': 'Diagnosedaten dieses Geräts — App-Version, Browser, Bildschirm, Sprache, Mitteilungs- und Speicherstatus, letzte Fehlermeldungen der App',
  'UI-SUP-GRUND': 'Begründung des Teams:',
  'UI-SUP-FREIGEBEN': 'Freigeben',
  'UI-SUP-ABLEHNEN': 'Ablehnen',
  'UI-SUP-WIDERRUFEN': 'Freigabe zurücknehmen',
  'UI-SUP-STATUS-offen': 'wartet auf deine Entscheidung',
  'UI-SUP-STATUS-freigegeben': 'freigegeben bis {bis}',
  'UI-SUP-STATUS-abgelehnt': 'abgelehnt',
  'UI-SUP-STATUS-widerrufen': 'zurückgenommen',
  'UI-SUP-STATUS-abgelaufen': 'abgelaufen',
  'UI-SUP-N-FREIGABE-TITEL': 'Frage zu deiner Anfrage {fallnummer}',
  'UI-SUP-N-FREIGABE': 'Das Support-Team bittet um Einsicht in einige Daten, um dir helfen zu können. Du entscheidest in der App, ob du sie freigibst.',
  'UI-SUP-ANFRAGE-OFFEN': 'Es gibt schon eine offene Anfrage in diesem Vorgang.',
  'UI-SUP-KEINE-FREIGABE': 'Dafür gibt es keine gültige Freigabe.',

  # ───── #39 Heute ─────
  'UI-HEUTE-ZEITRAUM': 'Zeitraum',
}

ERSETZT = {
  'UI-KONTO-GERAETECODE': 'Neues Gerät: Wir haben dir einen Code per Telegram geschickt.',
}
