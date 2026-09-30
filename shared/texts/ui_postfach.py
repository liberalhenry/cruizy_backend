"""Oberflächentexte für Postfach, Tickets und Teams im Werkzeug (nach 0.4.0). Alle ENTWURF.
Wird von build-ui.py eingelesen — nicht allein aufrufen."""

NEU = {
  # ───── Owner ohne Begründung: neutraler Text für Nutzer ─────
  'UI-MOD-GRUND-NEUTRAL': 'Nach Prüfung durch unser Team.',
  'UI-SUP-GRUND-NEUTRAL': 'Damit wir dir bei deiner Anfrage helfen können.',

  # ───── Postfach und Tickets ─────
  'UI-PF-MELDUNG': 'Meldung',
  'UI-PF-WIDERSPRUCH': 'Widerspruch',
  'UI-PF-RUECKMELDUNG': 'Rückmeldung',
  'UI-PF-OHNE-BESCHREIBUNG': '(Ohne Beschreibung gemeldet.)',
  'UI-PF-WEITERGEGEBEN': 'Von {von} an {an} weitergegeben ({person}).',
  'UI-PF-SCHON-IM-TEAM': 'Das Ticket liegt schon bei diesem Team.',
  'UI-PF-KEIN-GEGENUEBER': 'Zu diesem Ticket gibt es niemanden, dem wir schreiben könnten.',
  'UI-HLF-KAT-ALLGEMEIN': 'Allgemeine Frage',
}

ERSETZT: dict[str, str] = {}
