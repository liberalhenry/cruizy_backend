# Systemtext-Bibliothek — Erstfassung

> ## ⚠ ENTWURF — Vorfassung vor den Interviews
> **Nicht verwenden, bevor Menschen die Endfassung geschrieben haben.** Handbuch A lässt KI bei Systemtexten nur als Entwurf zu; Handbuch B sieht für die Endfassung 2.000 € Texterbudget vor. Diese Bibliothek ist das Briefing dafür — und zugleich die Grundlage, auf die sich Wireframes (A-15), Spezifikation (A-29) und Nutzerabläufe (A-30) mit den IDs beziehen.
> **Zeitplan-Regel:** Was von den Interviews abhängt, wird vor den Interviews nicht finalisiert. Die Sprache der Zielgruppe, die Namen der Absichten und die Antwortquoten-Bänder gehören nach A-19 noch einmal auf den Tisch. Taxonomie-Texte entstehen erst nach dem bezahlten Gegenlesen (Nr. 13).
> Produktname überall als `[NAME]` — er ist nicht entschieden.

Erstellt: 15.09.2026, 15:39 Uhr · Aufgabe A-14 · Rolle: UX-Texter · Fenster **V2**, als Vorfassung vorgezogen
Grundlagen: Handbuch A (Abschnitt 5 „Alleinstellung, Bedienung, Gestaltung“, Funktionskatalog, Rechtsauflagen, KI-Regeln) · Handbuch B (Abonnements, Feedbackwege) · `moderationsarchitektur.md` (A-37) · `../30-marketing-kanaele/krisenkommunikation-vorlagen.md` (A-18) · `../70-entwicklung-ab-monat-4/code-planer.md` · `../01-steuerung/wettbewerbsbeobachtung-log.md` (R-01)
Gehört zu: A-15 · A-29 · A-30 · A-36 · Entscheidungen Nr. 13, 30, 39, 40, 46 und neu Nr. 47 bis 51

---

## Auf einen Blick

- **325 Einträge in 18 Bereichen**, davon 310 mit Text und 15 bewusst offene Platzhalter.
- **Status:** 24 festgelegt (Handbuch A wörtlich) · 3 gesetzlicher Wortlaut · 266 Entwurf · 32 hängen an einer offenen Entscheidung.
- **Prüfung, programmatisch:** alle Zeichengrenzen eingehalten · ein Ausrufezeichen, und zwar in einer festgelegten Formulierung (⚠) · keine Emojis · durchschnittlich 6,1 Wörter je Satz · 99,4 % der Sätze haben höchstens 15 Wörter · Lesbarkeitsindex LIX 29,1 („leicht“ liegt unter 40).

**Die fünf Befunde, die vor der Endfassung entschieden sein müssen:**

1. **Ein festgelegter Satz aus Handbuch A stimmt nicht mehr in jedem Fall.** „Ein Gericht kann es über unseren Prüfpartner“ (ST-FEST-03) setzt eine Identifizierung voraus. Nach reiner Altersschätzung — und die ist nach R-01 bei der KJM als Identifizierungsmodul anerkannt — kennt auch der Prüfpartner niemanden. Dazu kommt „für Täter uninteressant“, eine Wirkungsbehauptung nahe an § 5 UWG. → neue Entscheidung **Nr. 51**
2. **Drei Schutzfunktionen des MVP lassen sich in einer Web-App nicht so bauen, wie Handbuch A sie beschreibt:** Schnellverstecken durch Tippen auf die Geräterückseite (F58), ein nachträglich änderbares Tarnsymbol (F59) und die Bildschirmfoto-Sperre (F63). Das MVP ist aber eine Web-App. → neue Entscheidung **Nr. 47**
3. **Zonen könnten gegen Prinzip 6 verstoßen.** Handbuch A stellt weitere Zonen ins Abo. Schützt eine Zone — etwa rund um die eigene Wohnung —, liegt damit Schutz hinter einer Bezahlschranke. → neue Entscheidung **Nr. 48**
4. **Das Web-Abo braucht rechtliche Gestaltung, die mit der Diskretion kollidiert.** Verlängerung nur auf unbestimmte Zeit mit Monatskündigung (§ 309 Nr. 9 BGB), sofortige Kündigungsbestätigung in Textform (§ 312k Abs. 4 BGB), ein Abrechnungsname auf dem Kontoauszug, ein Absender im Posteingang — jedes davon kann outen. → neue Entscheidung **Nr. 49**, Anwaltsfrage in Nachtrag 02
5. **Handbuch B will das Jahresabo vorausgewählt, Handbuch A verbietet dunkle Muster.** Eine Vorauswahl ist nicht per se unzulässig — aber die Abwägung gehört getroffen, nicht übersehen. → neue Entscheidung **Nr. 50**

Dazu kommen **gut zwei Dutzend Stellen, die Handbuch A nicht festlegt**, die aber jede Oberfläche braucht — von den Namen der Genauigkeitsstufen bis zum Mechanismus des Check-ins. Sie stehen in Abschnitt 21 und gehen als „⚠ zu klären“ in die Spezifikation A-29.

---

## 0 · Gebrauchsanweisung

| Was | Regel |
|---|---|
| **Aufbau** | Jede Zeile ist ein Text an genau einer Stelle der App. Die ID bleibt stabil; A-15, A-29 und A-30 verweisen darauf. |
| **Status** | **FEST** = aus Handbuch A wörtlich, nicht umformulieren · **GESETZ** = gesetzlicher Wortlaut · **ENTWURF** = Vorschlag zur Endfassung · **OFFEN** = hängt an einer Entscheidung, Text folgt |
| **Zeichen** | inklusive Leerzeichen, für die deutsche Fassung. Platzhalter zählen mit ihrer angenommenen Länge: `{name}` 20, `{datum}` 10, `{fallnummer}` 10, `{grund}` 60, `{begruendung}` 120, `{zahl}` 3. Bei großer Schrift wird umbrochen, nie abgeschnitten (Handbuch A). |
| **Platzhalter** | `{…}` füllt die App · `[GROSSBUCHSTABEN]` = hier fehlt eine Entscheidung oder ein Rechtstext |
| **Buttons** | höchstens etwa 20 Zeichen, möglichst mit einem Verb, kein „Jetzt …“ außer dort, wo das Gesetz es verlangt |
| **Endfassung** | durch Menschen, nach den Interviews, mit dem Texterbudget aus Handbuch B. Rechtstexte ausschließlich vom Fachanwalt. |

---

## 1 · Stilregeln

| Regel | Quelle | Stand in diesem Dokument |
|---|---|---|
| Du, kurze Sätze, keine Anbiederung, Zielgruppe 18 bis 60 | Handbuch A, Gestaltungssystem | Ø 6,1 Wörter je Satz |
| Keine Ausrufezeichen, keine Emojis | Handbuch A | 1 Ausrufezeichen (ST-FEST-05, ⚠), 0 Emojis |
| Nie absolute Sicherheitsaussagen; „verifiziert“ nie gleich „sicher“ | Handbuch A; § 5 UWG | Wörter unter Beobachtung in Abschnitt 20, jede Fundstelle begründet |
| Fehlermeldungen immer dreiteilig: was passiert ist · was zu tun ist · wie es weitergeht; nie „Ein Fehler ist aufgetreten“ | Handbuch A, Mikro-UX | Abschnitt 8 |
| Bezahlaufforderungen nie blockierend, nie im Chat, höchstens alle 30 Tage je Funktion, nie mit Haptik | Handbuch A | Abschnitt 18 |
| Einfache Sprache: Alltagswörter, aktive Verben, ein Gedanke je Satz | WCAG, Handbuch A (Barrierefreiheit) | LIX 29,1 |
| Keine Pronomen, die ein Geschlecht unterstellen | Taxonomie, Nr. 13 | Personen heißen `{name}` oder „die Person“; alle Pronomen im Text beziehen sich auf Sachen |
| Der Sperrbildschirm liest mit | Handbuch A, Push | Mitteilungen ohne Namen, ohne Vorschau, ohne verräterische Wörter |

**Wortliste**

| Wir sagen | Wir sagen nicht | Warum |
|---|---|---|
| Konto | Account | Alltagswort |
| Alter bestätigen, Altersprüfung | Verifizierung (in Bedientexten) | verständlicher; „verifiziert“ klingt nach „sicher“ |
| geprüft, Prüfzeichen | sicher, vertrauenswürdig, echt verifiziert | § 5 UWG |
| grobe Entfernung | anonym, unsichtbar (für Standort) | beides verspricht mehr, als die Architektur hält |
| Mitteilung | Push, Benachrichtigung | Alltagswort |
| Gespräch (im Fließtext) · Chats (Reitername, fest) | Konversation, Match | Handbuch A kennt keine Übereinstimmungslogik |
| freundlich absagen | ghosten, abblitzen | Ton |
| einschränken, entfernen (Inhalte) · sperren (nur Konten) | bannen, löschen (bei Moderation) | trennt Inhalts- von Kontoentscheidungen (Art. 22 DSGVO) |
| Prüfpartner | Drittanbieter, Dienstleister | Handbuch A, festgelegte Formulierungen |
| die Person, `{name}` | er, ihn, der Nutzer | Taxonomie |

---

## 2 · Festgelegte Formulierungen

Wörtlich aus Handbuch A. **Drei davon brauchen vor der Freigabe eine Entscheidung** (ST-FEST-01, -03, -05).

| ID | Ort / Kontext | Text | max. Zeichen | Status | Hinweis |
|---|---|---|---|---|---|
| ST-FEST-01 | Altersprüfung, Einstieg vor der ersten Nachricht | Damit hier echte Menschen schreiben und keine Bots: Bestätige einmal kurz, dass du 18+ bist. | 100 | FEST | Wörtlich Handbuch A. ⚠ „einmal kurz“ stimmt nur, wenn der erste Weg klappt. Wird die Altersschätzung mit Puffer gewählt (Nr. 39, Weg 4), braucht ein Teil der Jüngeren einen zweiten Schritt (ST-VER-11). |
| ST-FEST-02 | Selfie-Prüfung, vor der Aufnahme | Wir sehen dein Selfie nie. Unser Prüfpartner löscht es sofort nach der Prüfung — wir bekommen nur ja oder nein. | 120 | FEST | Wörtlich. Nur verwenden, wenn die Sofortlöschung im Vertrag zugesichert ist — Handbuch A macht sie zum Ausschlusskriterium. Läuft die Schätzung auf dem Gerät (wie bei FaceAssure), kann der Satz nach der Anbieterwahl präziser werden. |
| ST-FEST-03 | Altersprüfung, Einblendung „Warum?“ | Wir können dich nicht identifizieren. Ein Gericht kann es über unseren Prüfpartner. Genau deshalb ist diese App für Täter uninteressant. | 140 | FEST | ⚠ Wörtlich, aber so nicht freigabefähig. (1) Satz 2 stimmt nur nach einer Identifizierung (eID, Ausweisabgleich); nach reiner Altersschätzung kennt auch der Prüfpartner keine Identität. (2) „für Täter uninteressant“ ist eine Wirkungsbehauptung nahe an einer absoluten Sicherheitsaussage (§ 5 UWG). Ersatz für Identifizierungswege: ST-VER-10. Entscheidung Gründer, Prüfung Anwalt. |
| ST-FEST-04 | Sicherheitszentrum, Kopf; Hilfeseite | Wir bauen den sichersten Raum, den wir technisch bauen können — und sagen dir offen, wo seine Grenzen liegen. | 110 | FEST | Wörtlich. Der Superlativ ist durch „den wir technisch bauen können“ eingeschränkt — nicht kürzen, sonst wird er absolut. |
| ST-FEST-05 | Höflicher Ausstieg, der gesendete Text | Danke dir — für mich passt es gerade nicht. Alles Gute! | 60 | FEST | ⚠ Widerspruch in Handbuch A: Der festgelegte Text endet mit Ausrufezeichen, die Tonregel verbietet Ausrufezeichen in Systemtexten. Für Beibehaltung spricht: Es ist eine Nachricht im Namen des Nutzers, kein Bedientext. Alternative: „Danke dir — für mich passt es gerade nicht. Alles Gute.“ Entscheidung Gründer. |
| ST-FEST-06 | Onboarding, Wartelistenseite, Store-Text | Dein Standort gehört dir, und du siehst jederzeit, wie genau er ist. | 80 | FEST | Einer der „fünf Sätze“, wörtlich. |
| ST-FEST-07 | wie ST-FEST-06 | Dein Gesicht zeigst du, wem du willst — und bist trotzdem sichtbar. | 80 | FEST | wörtlich |
| ST-FEST-08 | wie ST-FEST-06 | Erste Nachricht: nur Text — und wir helfen dir dabei. | 60 | FEST | wörtlich |
| ST-FEST-09 | wie ST-FEST-06 | Absagen dauert einen Tipp und schadet dir nicht. | 60 | FEST | wörtlich; „schadet dir nicht“ ist durch F19 gedeckt (die Absage zählt als Antwort) |
| ST-FEST-10 | wie ST-FEST-06 | Was dich schützt, kostet nie etwas. | 40 | FEST | wörtlich; bindende Zusage (Alleinstellungsmerkmal 13) |

---

## 3 · Konto anlegen und Onboarding

**Ablauf:** Gastmodus (drei Minuten, F1) → Schritt 1 „So läuft es hier“ → Schritt 2 „Konto anlegen“ mit Einwilligung und der Zusage zu Sicherheitsmitteilungen → Schritt 3 „Wie willst du hier auftauchen?“ → Raster. Auf iPhones folgt am Ende der Hinweis zum Home-Bildschirm, weil Mitteilungen dort sonst nicht ankommen; er kommt noch einmal bei der ersten Mitteilungsabfrage (ST-REC-10). **Nicht im Onboarding:** Standort, Mitteilungen, Kamera (Rechteabfragen nie auf Vorrat) und die Altersprüfung (erst vor der ersten Nachricht).

| ID | Ort / Kontext | Text | max. Zeichen | Status | Hinweis |
|---|---|---|---|---|---|
| ST-KON-01 | Gastmodus, Leiste oben | Du schaust als Gast. Fotos bleiben unscharf, bis du ein Konto hast. | 80 | ENTWURF | F1: Raster mit unkenntlichen Fotos ohne Konto |
| ST-KON-02 | Gastmodus, Restzeit | Noch {minuten} Minuten als Gast | 32 | ENTWURF |  |
| ST-KON-03 | Gastmodus, Ende | Die drei Minuten sind um. Mit einem Konto siehst du Fotos und kannst schreiben. | 90 | ENTWURF | Kein Bezahl-, sondern ein Kontofenster — Prinzip 1 betrifft es nicht, trotzdem mit Ausweg (ST-KON-05) |
| ST-KON-04 | Button | Konto anlegen | 20 | ENTWURF |  |
| ST-KON-05 | Button | Zurück zum Start | 20 | ENTWURF |  |
| ST-KON-10 | Onboarding Schritt 1, Titel | So läuft es hier | 40 | ENTWURF | Schritt 1 von 3 |
| ST-KON-11 | Onboarding Schritt 1, Text | Du stellst selbst ein, wie genau dein Standort ist. Die erste Nachricht ist Text. Absagen dauert einen Tipp. | 120 | ENTWURF | drei der fünf Sätze, verdichtet |
| ST-KON-12 | Button | Weiter | 20 | ENTWURF |  |
| ST-KON-20 | Onboarding Schritt 2, Titel | Konto anlegen | 40 | ENTWURF | Schritt 2 von 3 |
| ST-KON-21 | Onboarding Schritt 2, Text | Wir brauchen nur eine E-Mail-Adresse und ein Passwort. Keinen Klarnamen, keine Telefonnummer. | 110 | ENTWURF | F2 |
| ST-KON-22 | Button | Mit E-Mail weiter | 20 | ENTWURF |  |
| ST-KON-23 | Button | Mit Apple anmelden | 20 | ENTWURF | Beschriftung nach Apples Vorgaben für die deutsche Fassung prüfen |
| ST-KON-24 | Hinweis unter dem Apple-Button | Tipp: Wähle „E-Mail-Adresse verbergen“. Dann kennen wir deine echte Adresse nicht. | 95 | ENTWURF | F3; Menübezeichnung vor dem Bau mit der aktuellen iOS-Fassung abgleichen |
| ST-KON-25 | Hilfe: Warum nicht Google oder Facebook? | Anmelden mit Google oder Facebook bieten wir nicht an. Diese Werbekonzerne würden sonst erfahren, dass du diese App nutzt. | 130 | ENTWURF | Handbuch A, Streichliste |
| ST-KON-26 | Satz über der Einwilligung | Schon ein Konto hier verrät etwas Persönliches über dich. Deshalb fragen wir ausdrücklich, bevor wir etwas speichern. | 125 | ENTWURF | Rahmen für ST-KON-27 |
| ST-KON-27 | Einwilligung nach Art. 9 DSGVO | [WORTLAUT VOM FACHANWALT] | — | OFFEN | Rechtstext — Stufe 4 der KI-Arbeitsteilung, keine KI-Fassung. Muss die Rechtsnachfolge vorsehen (Nr. 12). |
| ST-KON-28 | Zusage Sicherheitsmitteilungen, Titel | Wichtige Mitteilungen nur in der App | 40 | ENTWURF | Ergänzung aus A-18, Entscheidung Nr. 46 |
| ST-KON-29 | Zusage Sicherheitsmitteilungen, Text 1 | Mitteilungen zu deiner Sicherheit bekommst du nur hier in der App, nie per E-Mail. | 90 | ENTWURF | Das „nie“ ist eine Zusage über unser eigenes Handeln, keine Sicherheitsaussage — deshalb zulässig. Voraussetzung: der In-App-Bereich (A-29). |
| ST-KON-30 | Zusage Sicherheitsmitteilungen, Text 2 | Per E-Mail schreiben wir dir nur, wenn du selbst etwas angestoßen hast, zum Beispiel ein neues Passwort. | 110 | ENTWURF | Muss mit ST-MAIL-* und der Kündigungsbestätigung (ST-ABO-32, ⚠) übereinstimmen |
| ST-KON-31 | Zusage Sicherheitsmitteilungen, Text 3 | Kommt eine andere E-Mail, die angeblich von uns ist, öffne keine Links darin. | 85 | ENTWURF | Schutz vor gefälschten E-Mails (A-18) |
| ST-KON-32 | Button | Verstanden | 20 | ENTWURF |  |
| ST-KON-40 | Onboarding Schritt 3, Titel | Wie willst du hier auftauchen? | 40 | ENTWURF | Schritt 3 von 3 |
| ST-KON-41 | Onboarding Schritt 3, Text | Ein Foto, ein Name, eine Absicht. Alles lässt sich später ändern. | 80 | ENTWURF |  |
| ST-KON-42 | Foto-Option 1 | Foto zeigen | 30 | ENTWURF |  |
| ST-KON-43 | Foto-Option 2 | Foto unkenntlich machen | 30 | ENTWURF | F11 |
| ST-KON-44 | Foto-Option 3 | Nur eine farbige Initiale | 30 | ENTWURF | F13 |
| ST-KON-45 | Erklärung zu Option 2 | Dein Foto wird so unscharf, dass man dich nicht erkennt. Dabei wird Bildinformation gelöscht — das Original lässt sich daraus nicht wiederherstellen. | 160 | ENTWURF | F11: 32×42-Zwischenstufe, „Information zerstört statt verdeckt“. Die Aussage stimmt nur, wenn die Architektur genau so gebaut wird (PRÜFUNG ERFORDERLICH im Code). |
| ST-KON-46 | Ergänzung zu Option 2 | Mit der Fotoprüfung sehen andere trotzdem: echte Person, nur ohne Gesicht. | 85 | ENTWURF | Alleinstellungsmerkmal 3; Prüfzeichen nur nach F6 |
| ST-KON-47 | Name, Hilfetext | Ein Vorname oder ein Spitzname. Deinen echten Namen brauchen wir nicht. | 80 | ENTWURF | F2 |
| ST-KON-48 | Absicht, Überschrift | Was suchst du gerade? | 30 | ENTWURF |  |
| ST-KON-49 | Absicht, Hilfetext | Deine Absicht läuft von selbst ab. Danach steht bei dir wieder „Offen“. | 80 | ENTWURF | F14 |
| ST-KON-50 | Button | Fertig | 20 | ENTWURF |  |
| ST-KON-60 | iPhone: Home-Bildschirm, Titel | Auf den Home-Bildschirm legen | 40 | ENTWURF | Nur Safari auf iOS; Code-Planer: Web-Push erst nach diesem Schritt |
| ST-KON-61 | iPhone: Home-Bildschirm, Text | Auf dem iPhone kommen Mitteilungen nur an, wenn die App auf deinem Home-Bildschirm liegt. Tippe auf „Teilen“ und dann auf „Zum Home-Bildschirm“. | 160 | ENTWURF | Menübezeichnungen mit der aktuellen iOS-Fassung abgleichen |
| ST-KON-62 | iPhone: Symbol vorher wählen | Such dir vorher ein Symbol aus. Auf dem iPhone lässt es sich danach nicht mehr ändern. | 95 | ENTWURF | ⚠ Nach bisheriger Kenntnis übernimmt iOS Änderungen am Manifest einer hinzugefügten Web-App nicht; vor dem Bau prüfen (A-29, F59). |
| ST-KON-63 | Button | Zeig mir, wie | 20 | ENTWURF |  |
| ST-KON-64 | Button | Nicht jetzt | 20 | ENTWURF |  |

---

## 4 · E-Mails, die wir überhaupt schicken

Nur zwei Anlässe, beide vom Nutzer selbst ausgelöst: der Bestätigungscode und das neue Passwort. Kein App-Name im Betreff, keine Vorschauzeile, die etwas verrät. **Offen:** der Absendername, und ob die Kündigungsbestätigung nach § 312k Abs. 4 BGB per E-Mail gehen muss (ST-ABO-32) — dann wäre sie der dritte Anlass und bräuchte dieselbe Zurückhaltung.

| ID | Ort / Kontext | Text | max. Zeichen | Status | Hinweis |
|---|---|---|---|---|---|
| ST-MAIL-01 | Absendername aller E-Mails | [NEUTRALER ABSENDER] | 24 | OFFEN | ⚠ Ein erkennbarer App-Name im Posteingang kann outen. Neutraler Absender gegen Wiedererkennbarkeit abwägen; ob Pflichtangaben für Geschäfts-E-Mails hineingehören, prüft der Anwalt (Nachtrag 02, Frage 5). |
| ST-MAIL-02 | Bestätigungscode, Betreff | Dein Bestätigungscode | 30 | ENTWURF | kein App-Name im Betreff |
| ST-MAIL-03 | Bestätigungscode, Vorschauzeile | Code für deine Anmeldung | 30 | ENTWURF |  |
| ST-MAIL-04 | Bestätigungscode, Text | Dein Code lautet {code}. Er gilt {minuten} Minuten. Hast du keinen Code angefordert, ignoriere diese E-Mail. | 120 | ENTWURF |  |
| ST-MAIL-05 | Passwort, Betreff | Neues Passwort festlegen | 30 | ENTWURF |  |
| ST-MAIL-06 | Passwort, Text | Du hast ein neues Passwort angefordert. Der Link gilt {minuten} Minuten: {link}. Warst du das nicht, ignoriere diese E-Mail. Dein Passwort bleibt dann gleich. | 200 | ENTWURF |  |

---

## 5 · Rechteabfragen

Immer zuerst eine eigene Erklärung, dann die Abfrage des Systems — nie umgekehrt und nie auf Vorrat: Standort beim ersten Rasteraufruf, Mitteilungen bei der ersten Nachricht, Kamera beim ersten Upload (Handbuch A). **In der Web-App lässt sich der Text der Browser-Abfrage nicht ändern**; die eigene Erklärung trägt dort die ganze Last. Die Systemtexte der nativen Apps (ST-REC-30 bis 32) folgen in Phase 2.

| ID | Ort / Kontext | Text | max. Zeichen | Status | Hinweis |
|---|---|---|---|---|---|
| ST-REC-01 | Standort, beim ersten Rasteraufruf, Titel | Wer ist in deiner Nähe? | 40 | ENTWURF | Rechteabfrage nie auf Vorrat (Handbuch A) |
| ST-REC-02 | Standort, Text | Dafür brauchen wir deinen Standort. Andere sehen nur eine grobe Entfernung wie „1–3 km“. Deine genaue Position geben wir nicht weiter. | 140 | ENTWURF | F70. Sobald die Ortsfreigabe auf Zeit (F50, V2) kommt, ergänzen: „… es sei denn, du teilst sie selbst.“ |
| ST-REC-03 | Button | Standort erlauben | 20 | ENTWURF | löst danach die Abfrage des Browsers oder Systems aus |
| ST-REC-04 | Button | Ohne Standort weiter | 22 | ENTWURF |  |
| ST-REC-05 | Standort abgelehnt | Ohne Standort können wir dir keine Profile in deiner Nähe zeigen. Du kannst ihn jederzeit in den Einstellungen erlauben. | 130 | ENTWURF | ⚠ Was das Raster ohne Freigabe zeigt, legt Handbuch A nicht fest (F29 verlangt nur: nie leer) → A-29 |
| ST-REC-06 | Standort im Browser blockiert | Dein Browser blockiert den Standort. Erlaube ihn in den Browser-Einstellungen für diese Seite und lade die App neu. | 120 | ENTWURF | Web-App-Fassung |
| ST-REC-10 | Mitteilungen, bei der ersten Nachricht, Titel | Soll dein Telefon Bescheid sagen? | 40 | ENTWURF |  |
| ST-REC-11 | Mitteilungen, Text 1 | Wir melden dir neue Nachrichten in deinen Gesprächen — ohne Namen und ohne Vorschau. | 95 | ENTWURF | Handbuch A, Mikro-UX: Push ohne Absender und Vorschau |
| ST-REC-12 | Mitteilungen, Text 2 | Neue Anfragen lösen keine Mitteilung aus. Von 23 bis 8 Uhr ist Ruhe. | 75 | ENTWURF | Ruhezeiten sind die Voreinstellung, änderbar (ST-PUSH-20) |
| ST-REC-13 | Button | Mitteilungen erlauben | 22 | ENTWURF |  |
| ST-REC-14 | Button | Ohne Mitteilungen | 20 | ENTWURF |  |
| ST-REC-15 | Hinweis Web-App | Je nach Browser steht in einer Mitteilung auch die Internetadresse. Das können wir nicht abschalten. | 110 | ENTWURF | ⚠ auf den Zielgeräten prüfen, bevor der Satz verwendet wird (A-29) |
| ST-REC-16 | Mitteilungen abgelehnt | Mitteilungen sind aus. Neue Nachrichten siehst du, wenn du die App öffnest. | 85 | ENTWURF |  |
| ST-REC-30 | iOS-Systemabfrage Standort, ab nativer App | Damit du Profile in deiner Nähe siehst. Andere sehen nur eine grobe Entfernung. | 100 | ENTWURF | Zweckangabe in der App-Konfiguration (Phase 2) |
| ST-REC-31 | iOS-Systemabfrage Kamera, ab nativer App | Für Fotos in deinem Profil und in Gesprächen. Ortsangaben entfernen wir aus jedem Bild. | 100 | ENTWURF | wie ST-REC-30 |
| ST-REC-32 | iOS-Systemabfrage Fotos, ab nativer App | Damit du Fotos aus deiner Galerie hochladen kannst. | 60 | ENTWURF | wie ST-REC-30 |
| ST-REC-20 | Kamera, beim ersten Upload, Titel | Foto aufnehmen | 40 | ENTWURF |  |
| ST-REC-21 | Kamera, Text | Dafür brauchen wir kurz die Kamera. Ortsangaben und Gerätedaten entfernen wir aus jedem Bild, bevor irgendetwas anderes damit passiert. | 150 | ENTWURF | F72 |
| ST-REC-22 | Button | Kamera erlauben | 20 | ENTWURF |  |
| ST-REC-23 | Button | Aus der Galerie wählen | 22 | ENTWURF |  |
| ST-REC-24 | Kamera abgelehnt | Ohne Kamera kannst du trotzdem ein Foto aus deiner Galerie wählen. | 75 | ENTWURF |  |

---

## 6 · Standort, Entfernung, Aktivität, Zonen

| ID | Ort / Kontext | Text | max. Zeichen | Status | Hinweis |
|---|---|---|---|---|---|
| ST-STO-01 | Kopfzeile, dauerhaft sichtbar | Standort: {stufe} | 24 | OFFEN | F69. ⚠ Handbuch A benennt die Genauigkeitsstufen nicht → Bezeichnungen in A-29 festlegen |
| ST-STO-02 | Tipp auf die Kopfzeile | Wie genau soll dein Standort sein? Andere sehen ohnehin nur eine grobe Entfernung. | 95 | ENTWURF |  |
| ST-STO-10 | Entfernungsband 1 | unter 1 km | 12 | FEST | genau vier Bänder, keine Meterangaben (Handbuch A) |
| ST-STO-11 | Entfernungsband 2 | 1–3 km | 12 | FEST |  |
| ST-STO-12 | Entfernungsband 3 | 3–10 km | 12 | FEST |  |
| ST-STO-13 | Entfernungsband 4 | über 10 km | 12 | FEST |  |
| ST-STO-14 | Raster, Abschnitt Ferne (F25) | Weiter weg | 20 | ENTWURF | Nähe und Ferne sichtbar getrennt |
| ST-STO-15 | Erklärung zum Abschnitt Ferne | Hier ist gerade wenig los. Darunter siehst du Profile weiter weg — getrennt, damit nichts näher wirkt, als es ist. | 120 | ENTWURF |  |
| ST-STO-20 | Aktivitätsband 1 | jetzt | 12 | FEST | kein grüner Onlinepunkt (F20) |
| ST-STO-21 | Aktivitätsband 2 | unter 1 Std. | 12 | FEST |  |
| ST-STO-22 | Aktivitätsband 3 | heute | 12 | FEST |  |
| ST-STO-23 | Aktivitätsband 4 | diese Woche | 12 | FEST |  |
| ST-STO-24 | Aktivitätsband 5 | länger her | 12 | FEST |  |
| ST-STO-30 | Zonen, Titel | Zonen | 20 | ENTWURF | F60 |
| ST-STO-31 | Zonen, Text | In einer Zone wird dein Standort anders behandelt, zum Beispiel rund um dein Zuhause. Eine Zone ist kostenlos. | 120 | OFFEN | ⚠ Handbuch A sagt nicht, was eine Zone bewirkt. Und: Schützt eine Zone, verträgt sich „weitere Zonen im Abo“ schlecht mit Prinzip 6 und dem Schutzversprechen → A-29, Gründer. |

---

## 7 · Leere Zustände

**Das Raster ist nie leer** (F29). Handbuch A verlangt eine feste Reihenfolge der Ersatzinhalte, nennt sie aber nicht. Vorschlag für A-29: (1) Profile weiter weg, sichtbar getrennt · (2) Wochenaktive im Umkreis von 50 km · (3) Verweis auf „Heute“.

| ID | Ort / Kontext | Text | max. Zeichen | Status | Hinweis |
|---|---|---|---|---|---|
| ST-LEER-01 | Raster, wenig los | In deiner Nähe ist gerade wenig los. | 45 | ENTWURF | F29: nie ein leeres Raster |
| ST-LEER-02 | Ersatzinhalt: weiter weg | Weiter weg sind {zahl} Profile. Wir zeigen sie getrennt, damit du weißt, wie weit es ist. | 100 | ENTWURF | ⚠ Handbuch A verlangt eine feste Reihenfolge der Ersatzinhalte, nennt sie aber nicht. Vorschlag: weiter weg → Wochenaktive → Heute (A-29) |
| ST-LEER-03 | Ersatzinhalt: Wochenaktive (F27) | Diese Woche waren {zahl} Leute im Umkreis von 50 km aktiv. Sie sind gerade nicht online — deine Nachricht wartet, bis sie reinschauen. | 140 | ENTWURF | schaltet sich unter 20 Profilen im 10-km-Umkreis zu |
| ST-LEER-04 | Ersatzinhalt: Heute | In „Heute“ siehst du, wo heute etwas los ist. | 50 | ENTWURF |  |
| ST-LEER-05 | Filter ohne Treffer | Mit diesen Filtern gibt es gerade keine Treffer. Nimm einen Filter heraus, dann siehst du wieder mehr. | 110 | ENTWURF | F26, Trefferzähler zeigt 0 |
| ST-LEER-10 | Anfragen, leer | Keine neuen Anfragen. Wer dir zum ersten Mal schreibt, landet hier — ohne Mitteilung und ohne Zähler. | 110 | ENTWURF | F42 |
| ST-LEER-11 | Gespräche, leer | Noch keine Gespräche. Schreib jemandem aus dem Raster. Wenn dir nichts einfällt, schlagen wir dir einen Einstieg vor. | 130 | ENTWURF | F44 |
| ST-LEER-12 | Archiv, leer | Das Archiv ist leer. Beendete Gespräche liegen hier 24 Stunden. | 70 | ENTWURF | F46; ⚠ was nach 24 Stunden geschieht, in A-29 festlegen |
| ST-LEER-13 | Merkliste, leer | Deine Merkliste ist leer. Wen du dir merkst, erfährt davon nichts. | 75 | ENTWURF | F21 |
| ST-LEER-20 | Heute, keine Ereignisse | Heute steht in deiner Nähe noch nichts im Kalender. Orte, die geöffnet haben, siehst du auf der Karte. | 115 | ENTWURF |  |
| ST-LEER-21 | Heute, keine Orte | Hier kennen wir noch keine Orte. Wir gehen Stadt für Stadt vor — zuerst [STADT]. | 90 | ENTWURF | Handbuch B: Dichte vor Fläche |
| ST-LEER-22 | Heute, Karte ohne Personen | Gerade sind hier zu wenige Leute, um sie auf der Karte zu zeigen. | 70 | ENTWURF | F30: nur grobe Cluster. ⚠ Mindestgröße eines Clusters festlegen (A-29) |
| ST-LEER-30 | Offline, Leiste | Offline. Du siehst den letzten Stand. | 40 | ENTWURF | Handbuch A: letztes Raster und alle Chats lesbar |
| ST-LEER-31 | Offline, Nachricht im Ausgang | Wird gesendet, sobald du wieder Netz hast. | 45 | ENTWURF |  |

---

## 8 · Fehlermeldungen

Jede Meldung hat drei Teile. Ein Beispiel, auseinandergenommen:

| Teil | ST-FEH-01 |
|---|---|
| Was passiert ist | Keine Verbindung. |
| Was zu tun ist | Prüf dein Netz — |
| Wie es weitergeht | wir versuchen es gleich automatisch noch mal. |

| ID | Ort / Kontext | Text | max. Zeichen | Status | Hinweis |
|---|---|---|---|---|---|
| ST-FEH-01 | Keine Verbindung | Keine Verbindung. Prüf dein Netz — wir versuchen es gleich automatisch noch mal. | 85 | ENTWURF | Muster: was passiert ist / was zu tun ist / wie es weitergeht |
| ST-FEH-02 | Serverfehler | Bei uns ist etwas schiefgegangen, nicht bei dir. Versuch es in ein paar Minuten noch mal. | 95 | ENTWURF | Ab V2 (Statusseite F73) ergänzen: „Auf unserer Statusseite siehst du, ob wir schon daran arbeiten.“ |
| ST-FEH-03 | Zeitüberschreitung | Das hat zu lange gedauert. Tipp auf „Erneut versuchen“. Deine Eingaben sind noch da. | 90 | ENTWURF | Letzter Satz nur, wenn die Eingaben technisch erhalten bleiben |
| ST-FEH-04 | Anmeldung abgelaufen | Deine Anmeldung ist abgelaufen. Melde dich neu an — deine Chats sind noch da. | 80 | ENTWURF |  |
| ST-FEH-10 | Bild zu groß | Das Bild ist zu groß. Wähle eines unter {mb} MB, dann geht es direkt weiter. | 95 | ENTWURF |  |
| ST-FEH-11 | Dateiformat | Dieses Format können wir nicht lesen. Nimm ein Foto im Format {formate}. | 80 | ENTWURF | Formate in A-29 festlegen |
| ST-FEH-12 | Foto abgelehnt (F10) | Dieses Foto können wir so nicht zeigen: {grund}. Die Stelle ist markiert. Wähl ein anderes oder leg Einspruch ein. | 170 | ENTWURF | F10: immer konkreter Grund und Bildbereich |
| ST-FEH-13 | Grund 1 für {grund} | im öffentlichen Bereich sind explizite Inhalte nicht erlaubt | 60 | ENTWURF | Zone 1 (A-37) |
| ST-FEH-14 | Grund 2 für {grund} | auf dem Bild stehen Kontaktdaten oder Werbung | 50 | OFFEN | ⚠ Regel noch nicht festgelegt — mit den Nutzungsbedingungen abgleichen |
| ST-FEH-15 | Grund 3 für {grund} | das Bild ist zu dunkel oder zu unscharf, um es zu prüfen | 60 | ENTWURF |  |
| ST-FEH-16 | Foto in Prüfung | Dein Foto wird geprüft. Meist dauert das Sekunden, manchmal bis zu {stunden} Stunden. | 95 | ENTWURF | A-37: unter 2 Stunden tagsüber, unter 12 Stunden insgesamt |
| ST-FEH-17 | Hash-Treffer | [BEWUSST KEIN TEXT — A-36] | — | OFFEN | Was der betroffenen Person mitgeteilt wird, entscheidet der Trefferprozess (Ermittlungsgefährdung) |
| ST-FEH-20 | Standort nicht gefunden | Wir finden deinen Standort gerade nicht. Schalte WLAN ein oder geh ans Fenster, dann klappt es meist. | 110 | ENTWURF |  |
| ST-FEH-21 | Standort ungenau | Dein Standort ist gerade sehr ungenau. Entfernungen können deshalb abweichen. | 80 | ENTWURF |  |
| ST-FEH-30 | Erstkontakt: Bild gesperrt (F43) | Bilder gehen erst, wenn {name} geantwortet hat. Schreib zuerst ein paar Worte. | 95 | ENTWURF | ab V2 um Sprache ergänzen (F49) |
| ST-FEH-31 | Erstkontakt-Grenze erreicht (F57) | Du hast in den letzten 24 Stunden fünf neue Leute angeschrieben. Mit Altersprüfung fällt diese Grenze weg. | 115 | ENTWURF | F57: neue unverifizierte Konten höchstens 5 Erstnachrichten in 24 Stunden |
| ST-FEH-32 | Nachricht zu lang | Die Nachricht ist zu lang. Kürz sie auf {zeichen} Zeichen oder teil sie auf. | 85 | ENTWURF | Höchstlänge in A-29 festlegen |
| ST-FEH-33 | Nachricht nicht gesendet | Nicht gesendet. Tipp darauf, um es noch mal zu versuchen. | 60 | ENTWURF |  |
| ST-FEH-40 | Altersprüfung abgebrochen | Die Prüfung wurde abgebrochen. Du kannst sie jederzeit neu starten. Bis dahin kannst du lesen, aber noch nicht schreiben. | 130 | ENTWURF | F4: ausgelöst vor der ersten Nachricht |
| ST-FEH-41 | Altersprüfung klappt nicht | Die Prüfung hat nicht geklappt. Oft liegt es am Licht oder an der Kamera. Versuch es noch mal oder nimm einen anderen Weg. | 130 | ENTWURF |  |
| ST-FEH-42 | Prüfpartner nicht erreichbar | Unser Prüfpartner ist gerade nicht erreichbar. Versuch es in ein paar Minuten noch mal. | 95 | ENTWURF |  |
| ST-FEH-50 | Zahlung fehlgeschlagen | Die Zahlung hat nicht geklappt, es wurde nichts abgebucht. Prüf deine Angaben oder nimm eine andere Zahlungsart. | 120 | ENTWURF | „nichts abgebucht“ nur, wenn das in diesem Zustand technisch feststeht |
| ST-FEH-51 | Store-Kauf ausstehend | Dein Kauf ist noch nicht bestätigt. Bei Apple und Google kann das ein paar Minuten dauern. | 95 | ENTWURF | ab den nativen Apps (Phase 2) |
| ST-FEH-60 | Export fehlgeschlagen | Dein Download hat nicht geklappt. Wir versuchen es automatisch noch einmal und sagen dir hier Bescheid. | 110 | ENTWURF | F68 |
| ST-FEH-61 | Filtergrenze (F26) | Höchstens zwei Filter gleichzeitig. Nimm einen heraus, bevor du einen neuen wählst. | 90 | ENTWURF |  |
| ST-FEH-62 | Freitext mit ausschließender Formulierung (F18) | Dein Text schließt andere aus, etwa wegen Herkunft oder Körper. Magst du das ändern? Gespeichert ist er trotzdem. | 120 | ENTWURF | ⚠ Handbuch A sagt nur „Prüfung beim Speichern“; der Entwicklungsauftrag S4 sagt „Hinweis, keine Blockade“. Fassung für den Fall Sperre: ST-FEH-63. Entscheidung in A-29. |
| ST-FEH-63 | Freitext, Fassung „Sperre“ | Dein Text schließt andere aus, etwa wegen Herkunft oder Körper. So können wir ihn nicht speichern. Formulier es bitte anders. | 130 | OFFEN | nur falls A-29 die Sperre festlegt |
| ST-FEH-64 | Freitext zu lang | Höchstens 400 Zeichen. Du bist bei {zahl}. | 45 | ENTWURF | F18 |

---

## 9 · Community-Vertrag und Altersprüfung

Vier Zeilen, jede einzeln zu bestätigen, gebündelt mit der Altersprüfung vor der ersten Nachricht (F4, F5). **Zwei Sätze stehen zur Wahl:** Satz A ist konkret und benennt Verhalten; Satz B ist kürzer und allgemeiner. Beide in den Interviews vorlesen und fragen, welcher Satz im Kopf bleibt. Was nicht hineinpasst — etwa das Verbot kommerzieller Angebote —, gehört in die Nutzungsbedingungen, nicht in eine fünfte Zeile.

| ID | Ort / Kontext | Text | max. Zeichen | Status | Hinweis |
|---|---|---|---|---|---|
| ST-CV-00 | Gebündelter Ablauf, Titel | Bevor du schreibst: zwei kurze Schritte | 45 | ENTWURF | F4 und F5 gebündelt |
| ST-CV-01 | Community-Vertrag, Titel | Vier Sätze, die hier gelten | 40 | ENTWURF | F5: vier einzeln zu bestätigende Zeilen, vier ist Obergrenze |
| ST-CV-02 | Einleitung | Bestätige jeden Satz einzeln. Wer dagegen verstößt, kann gesperrt werden — immer erst, nachdem ein Mensch es geprüft hat. | 130 | ENTWURF | Art. 22 DSGVO: keine Kontosperre ohne Menschen |
| ST-CV-03 | Zeile 1 | Ich zeige mich echt: eigene Fotos, eigenes Alter. | 60 | ENTWURF | Satz A |
| ST-CV-04 | Zeile 2 | Ein Nein gilt — auch ein freundliches, auch ein stilles. | 60 | ENTWURF | Satz A |
| ST-CV-05 | Zeile 3 | Was mir jemand privat zeigt, bleibt privat. Ich leite nichts weiter und mache keine Bildschirmfotos. | 110 | ENTWURF | Satz A; passt zu F48 und F63 |
| ST-CV-06 | Zeile 4 | Ich werte niemanden ab — nicht wegen Herkunft, Hautfarbe, Körper, Alter, Geschlechtsidentität oder HIV-Status. | 120 | ENTWURF | Satz A; spiegelt die gestrichenen Ausschlussfilter. ⚠ Liste mit dem Gegenlesen der Taxonomie abstimmen (Nr. 13) |
| ST-CV-07 | Button, aktiv nach vier Haken | Weiter | 20 | ENTWURF |  |
| ST-CV-08 | Verweis | Die vollständigen Regeln stehen in den Nutzungsbedingungen. Diese vier Sätze sind die Kurzfassung. | 110 | ENTWURF | Handbuch A: Kurzfassung, kein Ersatz für die AGB (Art. 14 DSA) |
| ST-CV-13 | Alternative Zeile 1 | Ich bin hier, wer ich auf meinem Profil bin. | 60 | ENTWURF | Satz B — zum Vergleich in den Interviews |
| ST-CV-14 | Alternative Zeile 2 | Ich frage, bevor ich Bilder schicke, und akzeptiere die Antwort. | 70 | ENTWURF | Satz B |
| ST-CV-15 | Alternative Zeile 3 | Private Bilder anderer bleiben bei mir. | 50 | ENTWURF | Satz B |
| ST-CV-16 | Alternative Zeile 4 | Kein Hass und keine Abwertung, egal wegen was. | 55 | ENTWURF | Satz B |

---

## 10 · Altersprüfung, Fotoprüfung, Stufe 2

Die Texte für Stufe 2 (private Alben) sind **OFFEN**, weil sie an zwei Anwaltsfragen hängen (Nr. 1, Nr. 40) und — nach R-01 — an der Wahl des Weges (Nr. 39). Sie sind trotzdem ausformuliert, damit A-15 und A-29 den Zustand „nur Stufe 1“ zeichnen und spezifizieren können.

| ID | Ort / Kontext | Text | max. Zeichen | Status | Hinweis |
|---|---|---|---|---|---|
| ST-VER-01 | Erklärbildschirm für Unverifizierte (F9), Titel | Deine Nachricht ist nicht angekommen | 40 | ENTWURF |  |
| ST-VER-02 | Text | {name} lässt nur Nachrichten von Profilen zu, die ihr Alter bestätigt haben. Das ist hier die Voreinstellung, damit weniger Fake-Profile und Bots schreiben. | 170 | ENTWURF | F8: „Nur Verifizierte zulassen“ ist standardmäßig an |
| ST-VER-03 | Text 2 | Bestätige dein Alter, dann kannst du {name} schreiben. | 70 | ENTWURF | ⚠ Ob die nicht zugestellte Nachricht danach zugestellt wird, legt Handbuch A nicht fest → A-29 |
| ST-VER-04 | Button | Alter bestätigen | 20 | ENTWURF |  |
| ST-VER-05 | Button | Später | 20 | ENTWURF |  |
| ST-VER-06 | Wege, Überschrift | Wie willst du dein Alter bestätigen? | 45 | ENTWURF | mehrere Verfahren (F4) |
| ST-VER-07 | Weg: Selfie | Mit einem Selfie — ohne Ausweis | 35 | ENTWURF | Altersschätzung |
| ST-VER-08 | Weg: Ausweis | Mit der Online-Ausweisfunktion | 35 | ENTWURF | eID |
| ST-VER-09 | Weg: Wallet | Mit deiner digitalen Brieftasche | 35 | OFFEN | ⚠ nur, wenn angebunden (Nr. 39); die staatliche Wallet heißt „d-you“ |
| ST-VER-10 | Rückverfolgbarkeit, Ersatz für ST-FEST-03 bei Identifizierung | Wir erfahren nur, ob du volljährig bist. Wer du bist, weiß nur unser Prüfpartner. Er gibt es nur heraus, wenn eine Behörde das gesetzlich verlangen darf. | 160 | ENTWURF | ⚠ Wortlaut vom Anwalt prüfen lassen |
| ST-VER-11 | Schätzung unter der Puffergrenze | Die Schätzung war nicht eindeutig. Das passiert oft, wenn jemand jünger aussieht. Bestätige dein Alter bitte mit deinem Ausweis. | 140 | OFFEN | Nur bei Weg 4 aus Nr. 39 (KJM-Puffer, zuletzt drei Jahre). Kein Wort über das geschätzte Alter. |
| ST-VER-12 | Erfolg | Danke, dein Alter ist bestätigt. Du kannst jetzt schreiben. | 60 | ENTWURF |  |
| ST-VER-13 | Ergebnis: nicht volljährig | Diese App ist nur für Erwachsene, deshalb schalten wir dein Konto nicht frei. Ist das ein Irrtum, bestätige dein Alter mit deinem Ausweis. | 150 | ENTWURF | ⚠ Was mit Konto und Daten passiert, legt A-29 fest |
| ST-VER-14 | Ergänzung für Minderjährige | Du bist unter 18 und suchst jemanden zum Reden? [ANLAUFSTELLE FÜR JUGENDLICHE] | 90 | OFFEN | z. B. Nummer gegen Kummer, 116 111 — vor Veröffentlichung prüfen; queere Jugendberatung vor Ort ergänzen |
| ST-VER-20 | Fotoprüfung (F6), Titel | Zeig, dass deine Fotos echt sind | 40 | ENTWURF | freiwillig, sichtbar belohnt |
| ST-VER-21 | Fotoprüfung, Text | Mach ein Selfie. Passt es zu deinen Profilfotos, bekommt dein Profil ein Prüfzeichen. Freiwillig. | 110 | ENTWURF | ⚠ Wer den Abgleich durchführt und was dabei gespeichert wird, ist offen (biometrische Daten, Nr. 24) → A-29, Anwalt |
| ST-VER-22 | Prüfzeichen, Tipp darauf | Die Fotos dieses Profils passen zur Person. Ob ein Treffen gut läuft, sagt das nicht — pass trotzdem auf dich auf. | 120 | ENTWURF | Handbuch A: „verifiziert“ nie mit „sicher“ gleichsetzen |
| ST-VER-23 | Unkenntliches Bild mit Prüfzeichen | Geprüft, aber ohne Gesicht: echte Person, die ihr Gesicht erst im Gespräch zeigt. | 95 | ENTWURF | Alleinstellungsmerkmal 3, F12 |
| ST-VER-30 | Einstellung (F8) | Nur Nachrichten von geprüften Profilen | 45 | ENTWURF |  |
| ST-VER-31 | Erklärung | Voreinstellung: an. Dann schreiben dir nur Menschen, die ihr Alter bestätigt haben. Kostenlos, immer. | 110 | ENTWURF | „immer“ = Schutzversprechen |
| ST-VER-32 | Beim Ausschalten, zweiter Tipp | Ausschalten? Dann können dir auch Profile ohne Altersprüfung schreiben. | 75 | ENTWURF | F8: mit zwei Tipps abschaltbar |
| ST-VER-33 | Button | Ausschalten | 20 | ENTWURF |  |
| ST-VER-34 | Button | Anlassen | 20 | ENTWURF |  |
| ST-VER-40 | Stufe 2 (private Alben), Titel | Für private Alben: eine zusätzliche Prüfung | 45 | OFFEN | ⚠ nur, wenn Nr. 1 und Nr. 40 so entschieden werden |
| ST-VER-41 | Stufe 2, Text | Private Alben können Inhalte nur für Erwachsene enthalten. Dafür verlangt das Jugendschutzrecht eine zusätzliche Prüfung. Du machst sie einmal und bestätigst dich danach bei jedem Öffnen kurz. | 200 | OFFEN | AVS-Raster: einmalige Identifizierung, Authentifizierung vor jeder Nutzung |
| ST-VER-42 | Stufe 2 abgebrochen | Ohne diese Prüfung bleiben private Alben geschlossen. Alles andere funktioniert wie bisher. | 100 | OFFEN | Nr. 40: Zustand „nur Stufe 1“ |
| ST-VER-43 | Album-Kachel, nur Stufe 1 | Privates Album — für dich noch geschlossen | 45 | OFFEN |  |

---

## 11 · Melden

Melden ist Zone 3 der Moderationsarchitektur: Wer meldet, öffnet die Vertraulichkeit selbst. Die Texte sagen das offen (ST-MEL-13) und versprechen der meldenden Person nicht mehr Anonymität, als ein Gespräch zu zweit hergibt (ST-MEL-17). Die Entscheidungsmitteilungen folgen Art. 16 und 17 DSA; ob eine Entscheidung automatisch fiel, steht dabei (ST-MEL-24).

| ID | Ort / Kontext | Text | max. Zeichen | Status | Hinweis |
|---|---|---|---|---|---|
| ST-MEL-01 | Menüpunkt | Melden | 12 | ENTWURF | F62 |
| ST-MEL-02 | Titel | Was ist passiert? | 30 | ENTWURF |  |
| ST-MEL-03 | Grund | Belästigung oder Drohung | 40 | ENTWURF | ⚠ Kategorien mit den Nutzungsbedingungen abstimmen |
| ST-MEL-04 | Grund | Ungewollte Nacktbilder | 40 | ENTWURF |  |
| ST-MEL-05 | Grund | Fake-Profil oder Betrug | 40 | ENTWURF |  |
| ST-MEL-06 | Grund | Wirkt minderjährig | 40 | ENTWURF |  |
| ST-MEL-07 | Grund | Hass oder Abwertung | 40 | ENTWURF |  |
| ST-MEL-08 | Grund | Sex gegen Geld oder Werbung | 40 | ENTWURF | Streichliste: kein Escort- und Bezahlbereich |
| ST-MEL-09 | Grund | Gewalt oder Gefahr für jemanden | 40 | ENTWURF | löst den Prüfpfad nach Art. 18 DSA aus |
| ST-MEL-10 | Grund | Etwas anderes | 40 | ENTWURF |  |
| ST-MEL-11 | Notfall-Hinweis, immer sichtbar | Bist du oder jemand anderes gerade in Gefahr? Ruf die 112. | 60 | ENTWURF | 112 gilt in Deutschland, Österreich und der Schweiz |
| ST-MEL-12 | Freitext | Magst du kurz beschreiben, was passiert ist? Freiwillig. | 60 | ENTWURF |  |
| ST-MEL-13 | Beim Melden eines Bildes | Wenn du ein Bild meldest, kann jemand von uns es ansehen — sonst könnten wir es nicht prüfen. Jeder Zugriff wird protokolliert. | 140 | ENTWURF | Zone 3 (A-37) |
| ST-MEL-14 | Option | Auch blockieren | 20 | ENTWURF |  |
| ST-MEL-15 | Button | Meldung senden | 20 | ENTWURF |  |
| ST-MEL-16 | Bestätigung | Danke. Deine Meldung hat die Nummer {fallnummer}. Wir antworten dir hier in der App, in der Regel innerhalb von 24 Stunden. | 130 | ENTWURF | A-37: Entscheidung unter 24 Stunden als Selbstverpflichtung |
| ST-MEL-17 | Hinweis zur Vertraulichkeit | Wir sagen {name} nicht, wer gemeldet hat. In einem Gespräch zu zweit kann die Person es sich aber denken. | 120 | ENTWURF | ehrlich statt beruhigend. ⚠ Art. 17 Abs. 3 lit. b DSA mit dem Anwalt abgleichen |
| ST-MEL-18 | Status | Eingegangen am {datum} | 30 | ENTWURF | Statusverlauf (F62) |
| ST-MEL-19 | Status | Wird geprüft | 20 | ENTWURF |  |
| ST-MEL-20 | Status | Entschieden am {datum} | 30 | ENTWURF |  |
| ST-MEL-21 | Entscheidung an die meldende Person | Wir haben entschieden: {entscheidung}. Der Grund: {begruendung} | 200 | ENTWURF | Art. 16 Abs. 5 DSA |
| ST-MEL-22 | Keine Regelverletzung gefunden | Wir haben keinen Verstoß gegen unsere Regeln gefunden. Das heißt nicht, dass dein Eindruck falsch ist. Du kannst {name} jederzeit blockieren. | 160 | ENTWURF |  |
| ST-MEL-23 | Entscheidung an die betroffene Person, Mensch | Wir haben {inhalt} eingeschränkt. Der Grund: {begruendung} Geprüft hat das ein Mensch. Du kannst widersprechen. | 240 | ENTWURF | Art. 17 DSA |
| ST-MEL-24 | Entscheidung an die betroffene Person, automatisch | Wir haben {inhalt} eingeschränkt. Der Grund: {begruendung} Entschieden hat das ein Programm. Wenn du widersprichst, prüft ein Mensch. | 260 | ENTWURF | Art. 17 Abs. 3 lit. c DSA: Hinweis auf automatisierte Mittel. Nur für Inhalte, nie für Konten (Art. 22 DSGVO). |
| ST-MEL-25 | Button | Widersprechen | 20 | ENTWURF |  |
| ST-MEL-26 | Widerspruch eingegangen | Dein Widerspruch ist da. Ein Mensch prüft ihn, in der Regel innerhalb von {stunden} Stunden. | 100 | OFFEN | ⚠ Frist uneinheitlich: Handbuch A 72 Std. (Widerspruch aus der App), A-37 48 Std. (Einspruch gegen Bildablehnung) → A-29 |

---

## 12 · Blockieren

Sofort wirksam, 24 Stunden rücknehmbar, die zweite Sperre endgültig (F61). Nur vor der endgültigen Sperre gibt es eine Rückfrage — weil danach nichts mehr rückgängig zu machen ist.

| ID | Ort / Kontext | Text | max. Zeichen | Status | Hinweis |
|---|---|---|---|---|---|
| ST-BLO-01 | Menüpunkt | Blockieren | 12 | ENTWURF | F61 |
| ST-BLO-02 | Bestätigung nach dem Blockieren | {name} ist blockiert. Ihr seht euch nirgends mehr in der App. | 80 | ENTWURF | sofort wirksam |
| ST-BLO-03 | Rücknahme-Hinweis | Rückgängig machen kannst du das bis {datum}, {uhrzeit} Uhr. | 60 | ENTWURF | 24 Stunden rücknehmbar |
| ST-BLO-04 | Button | Rückgängig | 16 | ENTWURF |  |
| ST-BLO-05 | Hinweis zur Gegenseite | Wir schicken {name} keine Nachricht darüber. | 60 | ENTWURF |  |
| ST-BLO-06 | Zweite Sperre, Warnung | Du hast {name} schon einmal blockiert und wieder freigegeben. Diese Sperre ist endgültig und lässt sich nicht mehr aufheben. | 140 | ENTWURF | „Zweite Sperre endgültig“ — hier ist eine Rückfrage angebracht, weil nichts mehr rückgängig zu machen ist |
| ST-BLO-07 | Button | Endgültig blockieren | 22 | ENTWURF |  |
| ST-BLO-08 | Button | Abbrechen | 16 | ENTWURF |  |
| ST-BLO-09 | Liste, Titel | Blockiert | 20 | ENTWURF |  |
| ST-BLO-10 | Hilfetext | Blockierungen gelten auch nach einem Update oder einer Neuinstallation. | 80 | ENTWURF | serverseitig unveränderlich (Handbuch A) |

---

## 13 · Gespräche

| ID | Ort / Kontext | Text | max. Zeichen | Status | Hinweis |
|---|---|---|---|---|---|
| ST-CHAT-01 | Postfach 1 | Anfragen | 16 | FEST | Name aus Handbuch A |
| ST-CHAT-02 | Postfach 2 | Gespräche | 16 | OFFEN | ⚠ Arbeitstitel — Handbuch A benennt das zweite Postfach nicht |
| ST-CHAT-03 | Erklärung Anfragen | Hier landen erste Nachrichten von Leuten, mit denen du noch nicht geschrieben hast. Sie lösen keine Mitteilung aus. | 120 | ENTWURF | F42 |
| ST-CHAT-04 | Eingabefeld, erster Kontakt | Erste Nachricht: nur Text | 30 | ENTWURF | F43 |
| ST-CHAT-05 | Eisbrecher, Schaltfläche | Einstieg vorschlagen | 22 | ENTWURF | F44 |
| ST-CHAT-06 | Eisbrecher, Hinweis | Der Vorschlag landet im Textfeld. Du kannst ihn ändern, bevor du ihn schickst. | 85 | ENTWURF | kein Direktversand, keine generative KI |
| ST-CHAT-10 | Höflicher Ausstieg, Schaltfläche | Freundlich absagen | 20 | ENTWURF | ⚠ Bezeichnung nicht festgelegt |
| ST-CHAT-11 | Höflicher Ausstieg, fünf Sekunden | Absage wird gesendet … | 25 | ENTWURF | mit Rückgängig (ST-BLO-04), keine Bestätigungsabfrage (F45) |
| ST-CHAT-12 | Nach dem Senden | Absage gesendet. Sie zählt als Antwort. | 45 | ENTWURF | F19 |
| ST-CHAT-13 | Ansicht der Gegenseite | {name} hat freundlich abgesagt. Das Gespräch ist beendet. | 75 | ENTWURF | beidseitige Ablage |
| ST-CHAT-20 | Archiv, Gesprächskopf | Beendet. Liegt 24 Stunden im Archiv. | 40 | ENTWURF | F46 |
| ST-CHAT-21 | Schaltfläche | Gespräch wieder öffnen | 24 | ENTWURF |  |
| ST-CHAT-22 | Hinweis zur Wiedereröffnung | {name} sieht, dass du das Gespräch wieder geöffnet hast. | 75 | ENTWURF | Wiedereröffnung beidseitig sichtbar |
| ST-CHAT-23 | Hinweis | Gesendete Nachrichten lassen sich nicht zurückholen. | 55 | ENTWURF | keine Rücknahme zugestellter Nachrichten |
| ST-CHAT-30 | Verfallende Nachrichten, Schalter | Nachrichten nach 24 Stunden löschen | 40 | ENTWURF | F47 |
| ST-CHAT-31 | Erklärung | Gilt für euch beide: Nachrichten verschwinden nach 24 Stunden auf beiden Seiten. Bildschirmfotos kann das nicht verhindern. | 135 | ENTWURF | ⚠ wer den Schalter setzen darf, legt A-29 fest |
| ST-CHAT-32 | Hinweis im Gespräch | Nachrichten in diesem Gespräch verschwinden nach 24 Stunden. | 65 | ENTWURF |  |
| ST-CHAT-40 | Privates Album, Anfrage | {name} möchte dir ein privates Album zeigen. Willst du es sehen? | 80 | ENTWURF | F48: beidseitige Freigabe |
| ST-CHAT-41 | Button | Ansehen | 16 | ENTWURF |  |
| ST-CHAT-42 | Button | Lieber nicht | 16 | ENTWURF |  |
| ST-CHAT-43 | Wasserzeichen-Hinweis | Private Bilder tragen ein unsichtbares Wasserzeichen. So lässt sich feststellen, von welchem Konto ein weitergegebenes Bild stammt. | 140 | ENTWURF | F48 |
| ST-CHAT-44 | Bildschirmfoto, Android nativ | In privaten Alben sind Bildschirmfotos auf diesem Gerät gesperrt. | 70 | ENTWURF | F63, ab nativer App |
| ST-CHAT-45 | Bildschirmfoto, iPhone nativ | Auf dem iPhone können wir Bildschirmfotos nicht verhindern. Bitte respektiere, was dir privat gezeigt wird. | 115 | ENTWURF | F63: „Der Unterschied wird offen benannt.“ ⚠ Ob die Gegenseite informiert wird, legt Handbuch A nicht fest |
| ST-CHAT-46 | Bildschirmfoto, Web-App | In der Web-App können wir Bildschirmfotos nicht verhindern. Bitte respektiere, was dir privat gezeigt wird. | 115 | ENTWURF | ⚠ In der Web-App (Phase 1) ist auch unter Android keine Sperre möglich → A-29 |
| ST-CHAT-50 | Ein-Tipp-Freischaltung (F12) | Gesicht zeigen | 16 | ENTWURF |  |
| ST-CHAT-51 | Hinweis nach Freischaltung | {name} sieht jetzt dein Profilbild ohne Unschärfe, nur in diesem Gespräch. Du kannst das zurücknehmen — was schon gesehen wurde, bleibt gesehen. | 160 | ENTWURF | Rücknahme wirkt nur vorwärts |
| ST-CHAT-52 | Nach Rücknahme | {name} sieht wieder das unkenntliche Bild. | 60 | ENTWURF |  |
| ST-CHAT-60 | Erstkontakt-Grenze, vorab | Neue Konten ohne Altersprüfung können fünf neue Leute in 24 Stunden anschreiben. | 90 | ENTWURF | F57 |

---

## 14 · Profil

| ID | Ort / Kontext | Text | max. Zeichen | Status | Hinweis |
|---|---|---|---|---|---|
| ST-PRO-01 | Absicht abgelaufen, wischbare Leiste | Deine Absicht ist abgelaufen. Wisch, um sie zu erneuern. | 60 | ENTWURF | F14: keine Vorwarnung |
| ST-PRO-02 | Absicht | Heute Abend | 16 | FEST | in Handbuch A benannt |
| ST-PRO-03 | Absicht | Nur schreiben | 16 | FEST | in Handbuch A benannt |
| ST-PRO-04 | Absicht | [ABSICHT 3] | 16 | OFFEN | ⚠ Handbuch A nennt vier Absichten, benennt aber nur zwei → nach den Interviews festlegen |
| ST-PRO-05 | Absicht | [ABSICHT 4] | 16 | OFFEN | wie ST-PRO-04 |
| ST-PRO-06 | Rückfallzustand | Offen | 16 | FEST | in Handbuch A benannt |
| ST-PRO-07 | Laufzeit | noch {stunden} Std. | 20 | OFFEN | Zeitfenster je Absicht in A-29 festlegen. ⚠ Auch was „Nachtruhe 4–10 Uhr“ genau bewirkt, ist offen. |
| ST-PRO-10 | Antwortquote, Band 1 | [BAND 1] | 24 | OFFEN | ⚠ drei Bänder, nie eine Zahl (F19); Namen offen. Vorschlag zum Testen: „antwortet meist“ · „antwortet oft“ · „antwortet selten“ — das dritte Band vor Verwendung mit Betroffenen prüfen, es kann beschämen |
| ST-PRO-11 | Antwortquote, Band 2 | [BAND 2] | 24 | OFFEN |  |
| ST-PRO-12 | Antwortquote, Band 3 | [BAND 3] | 24 | OFFEN |  |
| ST-PRO-13 | Antwortquote, Erklärung | Zeigt, wie oft jemand auf erste Nachrichten reagiert. Eine freundliche Absage zählt auch. Gewertet werden höchstens 20 erste Nachrichten pro Woche. | 160 | ENTWURF | F19 |
| ST-PRO-14 | Antwortquote ausschalten | Ausschalten? Dann siehst du auch bei anderen keine Antwortquote mehr. | 75 | ENTWURF | „dann symmetrisch“ |
| ST-PRO-20 | Zuletzt aktiv | zuletzt aktiv: {band} | 30 | ENTWURF | Bänder: ST-STO-20 bis 24 |
| ST-PRO-30 | Wen ich sehen möchte (F17), Titel | Wen möchtest du sehen? | 30 | ENTWURF | nur Positivauswahl |
| ST-PRO-31 | Hinweis | Das wirkt nur auf deine eigene Ansicht. Andere erfahren davon nichts. | 75 | ENTWURF |  |
| ST-PRO-40 | Geschlechtsidentität (F16) | [TEXTE NACH DEM GEGENLESEN DURCH BETROFFENE] | — | OFFEN | Nr. 13; Artikel-9-Daten |
| ST-PRO-41 | Sichtbarkeit | Auf meinem Profil zeigen | 30 | ENTWURF | F16: sichtbar nur auf Wunsch |
| ST-PRO-50 | Merken, Schaltfläche | Merken | 12 | ENTWURF | F21 |
| ST-PRO-51 | Merken, Hinweis | Die Person erfährt nicht, dass du sie dir gemerkt hast. | 60 | ENTWURF |  |
| ST-PRO-60 | Fotos, Hinweis | Bis zu 8 Fotos. Jedes wird geprüft, bevor andere es sehen. | 60 | ENTWURF | F10, Zone 1 |
| ST-PRO-61 | Gesundheitsangaben (V2, F22) | Freiwillig. Niemand kann danach filtern. | 45 | ENTWURF | „niemals filterbar“ ist eine Bauvorgabe |

---

## 15 · Sicherheitszentrum

Alles hier ist kostenlos (Prinzip 6). **Drei Texte sind OFFEN, weil die Funktion dahinter in der Web-App anders gebaut werden muss** (ST-SIC-31, -41) oder in Handbuch A nicht beschrieben ist (ST-SIC-12). Ein Sicherheitstext, der mehr verspricht als die Funktion, ist schlimmer als keiner.

| ID | Ort / Kontext | Text | max. Zeichen | Status | Hinweis |
|---|---|---|---|---|---|
| ST-SIC-01 | Einstieg aus jedem Chat (F54) | Sicherheit | 16 | ENTWURF |  |
| ST-SIC-02 | Hinweis | Alles hier ist kostenlos, dauerhaft. | 40 | ENTWURF | Schutzversprechen |
| ST-SIC-10 | Check-in (F55), Titel | Check-in vor dem Treffen | 30 | ENTWURF |  |
| ST-SIC-11 | Check-in, Text | Hinterleg Ort und Uhrzeit deines Treffens. Beides wird verschlüsselt gespeichert, und {name} sieht davon nichts. | 130 | ENTWURF | F55 |
| ST-SIC-12 | Check-in, was dann passiert | [WAS GESCHIEHT, WENN DU DICH NICHT ZURÜCKMELDEST] | — | OFFEN | ⚠ Handbuch A beschreibt den Mechanismus nicht (wer wird wann benachrichtigt?) → A-29. Kein Text, bevor das feststeht. |
| ST-SIC-13 | Button | Check-in anlegen | 20 | ENTWURF |  |
| ST-SIC-14 | Rückmeldung danach | Alles gut gelaufen? Dann tipp auf „Ja“, und wir löschen Ort und Uhrzeit. | 80 | ENTWURF | ⚠ Löschung nach Rückmeldung in A-29 festlegen |
| ST-SIC-20 | Treffpunkt vorschlagen (F56) | Treffpunkt vorschlagen | 24 | ENTWURF |  |
| ST-SIC-21 | Hinweis | Für ein erstes Treffen eignen sich Orte, an denen auch andere sind. Hier siehst du welche in eurer Nähe. | 115 | ENTWURF | verbindet Ortsverzeichnis und Check-in |
| ST-SIC-30 | Schnell verstecken (F58), Titel | Schnell verstecken | 20 | ENTWURF |  |
| ST-SIC-31 | Erklärung, native App | Tippe zweimal auf die Rückseite deines Telefons. Die App zeigt sofort eine harmlose Ansicht. Zurück kommst du mit deiner PIN. | 130 | OFFEN | ⚠ Eine Web-App kann ein Tippen auf die Geräterückseite nicht erkennen → für Phase 1 anderer Auslöser nötig (A-29) |
| ST-SIC-32 | PIN festlegen | Wähle eine PIN aus {n} Ziffern. Du brauchst sie nur hierfür. | 65 | ENTWURF | PIN-Länge in A-29 festlegen |
| ST-SIC-40 | Tarnung (F59), Titel | Symbol und Name ändern | 24 | ENTWURF |  |
| ST-SIC-41 | Tarnung, Text | Wähle ein unauffälliges Symbol und einen anderen Namen für deinen Startbildschirm. | 90 | OFFEN | ⚠ Web-App: Symbol und Name werden beim Hinzufügen festgelegt; spätere Änderungen übernimmt iOS nach bisheriger Kenntnis nicht, Android nur verzögert → A-29 |
| ST-SIC-50 | Mitteilungsbereich, Titel | Mitteilungen | 16 | ENTWURF | neutral betitelt (A-18) |
| ST-SIC-51 | Mitteilungsbereich, leer | Keine Mitteilungen. Wenn wir dir etwas Wichtiges sagen müssen, steht es hier — nicht in einer E-Mail. | 110 | ENTWURF | Zusage ST-KON-29 |
| ST-SIC-60 | Reisewarnung (V2, F64) | Du bist in einem Land, in dem gleichgeschlechtliche Handlungen strafbar sein können. Überleg, ob du die App hier nutzen willst. Im Bereich Sicherheit siehst du, was du einstellen kannst. | 200 | ENTWURF | kostenlos, immer. ⚠ Länderliste und Quelle festlegen |

---

## 16 · Heute

| ID | Ort / Kontext | Text | max. Zeichen | Status | Hinweis |
|---|---|---|---|---|---|
| ST-HEU-01 | Reiter | Heute | 12 | FEST | Handbuch A |
| ST-HEU-02 | Zusage (F32) | Ich komme | 16 | ENTWURF |  |
| ST-HEU-03 | Hinweis zur Zusage | Wer zusagt, sieht die anderen Zusagen. Öffentlich ist die Liste nicht. | 75 | ENTWURF | F32 |
| ST-HEU-04 | Temporäre Gruppe (F33) | Die Gruppe öffnet zwei Stunden vor Beginn und verschwindet 24 Stunden danach. | 85 | ENTWURF |  |
| ST-HEU-05 | Karte, Personen | Personen zeigen wir nur als grobe Gruppe, nie als einzelnen Punkt. | 70 | ENTWURF | F30; „nie“ = Bauvorgabe |

---

## 17 · Datenkonto

Export und Löschung mit je einem Tipp, 30 Tage Karenz (F68). Der Download erscheint in der App, nicht in einer E-Mail — dieselbe Zusage wie bei den Sicherheitsmitteilungen.

| ID | Ort / Kontext | Text | max. Zeichen | Status | Hinweis |
|---|---|---|---|---|---|
| ST-DAT-01 | Datenkonto (F68), Titel | Deine Daten | 20 | ENTWURF |  |
| ST-DAT-02 | Einleitung | Hier siehst du, was wir über dich speichern. Du kannst alles herunterladen oder löschen. | 95 | ENTWURF |  |
| ST-DAT-03 | Button | Daten herunterladen | 22 | ENTWURF | je ein Tipp |
| ST-DAT-04 | Download angefordert | Wir stellen deine Daten zusammen. Das kann bis zu {stunden} Stunden dauern. Den Download findest du dann hier, nicht in einer E-Mail. | 150 | ENTWURF | Zusage ST-KON-29 |
| ST-DAT-05 | Download bereit | Dein Download ist fertig. Er steht {tage} Tage bereit. | 60 | ENTWURF | ⚠ Schutz der Exportdatei in A-29 festlegen |
| ST-DAT-06 | Hinweis zur Datei | Die Datei enthält alles, auch Nachrichten und Fotos. Speichere sie dort, wo sonst niemand hinschaut. | 110 | ENTWURF |  |
| ST-DAT-10 | Button | Konto löschen | 16 | ENTWURF | ein Tipp, 30 Tage Karenz — deshalb ohne Rückfrage |
| ST-DAT-11 | Löschung gestartet | Wir löschen dein Konto und alle Daten nach 30 Tagen. Bis dahin kannst du es dir anders überlegen. | 110 | ENTWURF | F68 |
| ST-DAT-12 | Ergänzung | In dieser Zeit ist dein Profil für andere nicht sichtbar. | 60 | OFFEN | ⚠ Verhalten während der Karenz in A-29 festlegen |
| ST-DAT-13 | Countdown | Dein Konto wird am {datum} gelöscht. | 45 | ENTWURF |  |
| ST-DAT-14 | Button | Löschung abbrechen | 20 | ENTWURF |  |
| ST-DAT-15 | Abgebrochen | Dein Konto bleibt, und dein Profil ist wieder sichtbar. | 60 | ENTWURF |  |
| ST-DAT-16 | Abo-Hinweis beim Löschen | Zahlst du über Apple oder Google, endet dein Abo nicht von selbst. Kündige es dort zusätzlich. | 105 | ENTWURF | Store-Abos laufen unabhängig vom Konto |
| ST-DAT-20 | „Was wir prüfen — und was nicht“ | [TEXT AUS A-37, ABSCHNITT 11 — zwei Fassungen, siehe Abschnitt 17] | — | OFFEN | Hängt am Schalter für Zone 2 (Nr. 30) |

**ST-DAT-20 in zwei Fassungen.** Der Text stammt aus der Moderationsarchitektur (A-37, Abschnitt 11) und ist hier an die Stilregeln angepasst. Welche Fassung gilt, entscheidet der Schalter für Zone 2 — und damit der Anwalt (Nr. 30). Nach R-01 ist Fassung B zum Start die wahrscheinlichere.

> **Fassung A — Abgleich in privater Kommunikation eingeschaltet**
>
> **Was wir prüfen — und was nicht**
>
> **Dein öffentliches Profilbild** schauen wir uns an, bevor es sichtbar wird. Meist macht das ein Programm. Ist es unentschieden, sieht ein Mensch nach. Im öffentlichen Bereich sollen keine expliziten Bilder stehen.
>
> **Was du privat schickst, sieht nur die Person, der du es schickst.** Kein Programm bewertet es, und wir speichern keine Einschätzung dazu.
>
> Eine einzige Prüfung läuft auch dort: ein Abgleich mit bekannten Darstellungen von Kindesmissbrauch. Dafür wird aus deinem Bild eine Zahl berechnet und mit einer Liste verglichen. Aus der Zahl lässt sich dein Bild nicht wiederherstellen. Gibt es keinen Treffer, bleibt nichts davon übrig.
>
> **Die Ausnahme:** Meldet dein Gegenüber ein Bild, muss jemand von uns es ansehen können — sonst wäre die Meldung wertlos. Jeder solche Zugriff wird protokolliert, und wir sehen gegenseitig, wer was geöffnet hat.

> **Fassung B — Abgleich in privater Kommunikation ausgeschaltet**
>
> **Was wir prüfen — und was nicht**
>
> **Dein öffentliches Profilbild** schauen wir uns an, bevor es sichtbar wird. Meist macht das ein Programm. Ist es unentschieden, sieht ein Mensch nach. Im öffentlichen Bereich sollen keine expliziten Bilder stehen.
>
> **Was du privat schickst, sieht nur die Person, der du es schickst.** Kein Programm bewertet es, und wir speichern keine Einschätzung dazu.
>
> **Die Ausnahme:** Meldet dein Gegenüber ein Bild, muss jemand von uns es ansehen können — sonst wäre die Meldung wertlos. Jeder solche Zugriff wird protokolliert, und wir sehen gegenseitig, wer was geöffnet hat.

---

## 18 · Abo

**Was hier bewusst fehlt:** ein Zähler („nur noch heute“), ein durchgestrichener Fantasiepreis, ein Beschämungs-Button, eine Haptik, ein Fenster, das sich nicht wegwischen lässt. Preise sind glatte Beträge (Handbuch B). Kündigen geht mit zwei Tipps aus dem Konto heraus, ohne Rückhaltefragen; die eine freiwillige Frage kommt **nach** der Kündigung.

**⚠ Vorauswahl.** Handbuch B verlangt: „Das Jahresabo sollte im Kaufbildschirm vorausgewählt sein.“ Handbuch A, Prinzip 1: keine dunklen Muster. Eine Vorauswahl ist zulässig, wenn Gesamtpreis, Laufzeit und Verlängerung für jede Option gleich deutlich dastehen — sie wird zum Problem, wenn der Monatspreis groß und der Gesamtpreis klein gedruckt ist. Die Zeilen ST-ABO-10 bis 17 nennen deshalb immer zuerst die Laufzeit, dann den Gesamtpreis, dann den Monatswert. Entscheidung Nr. 50.

| ID | Ort / Kontext | Text | max. Zeichen | Status | Hinweis |
|---|---|---|---|---|---|
| ST-ABO-01 | Abo-Bildschirm, Titel | [NAME] PLUS und PRO | 30 | ENTWURF |  |
| ST-ABO-02 | Einleitung | Alles, was dich schützt, bleibt kostenlos. Ein Abo macht die App bequemer. | 80 | ENTWURF |  |
| ST-ABO-03 | Leistungen PLUS | [PLUS-LEISTUNGEN] | — | OFFEN | ⚠ In den Handbüchern nicht festgelegt; fest steht nur: weitere Zonen im Abo (F60, siehe ST-STO-31) |
| ST-ABO-04 | Leistungen PRO | [PRO-LEISTUNGEN] | — | OFFEN | wie ST-ABO-03 |
| ST-ABO-10 | PLUS, 1 Monat | 1 Monat · 9 € | 20 | ENTWURF | Preise Handbuch B, brutto |
| ST-ABO-11 | PLUS, 3 Monate | 3 Monate · 23 € (7,67 € im Monat) | 40 | ENTWURF |  |
| ST-ABO-12 | PLUS, 6 Monate | 6 Monate · 40 € (6,67 € im Monat) | 40 | ENTWURF |  |
| ST-ABO-13 | PLUS, 12 Monate | 12 Monate · 70 € (5,83 € im Monat) | 40 | ENTWURF |  |
| ST-ABO-14 | PRO, 1 Monat | 1 Monat · 17 € | 20 | ENTWURF |  |
| ST-ABO-15 | PRO, 3 Monate | 3 Monate · 43 € (14,33 € im Monat) | 40 | ENTWURF |  |
| ST-ABO-16 | PRO, 6 Monate | 6 Monate · 76 € (12,67 € im Monat) | 40 | ENTWURF |  |
| ST-ABO-17 | PRO, 12 Monate | 12 Monate · 132 € (11,00 € im Monat) | 40 | ENTWURF |  |
| ST-ABO-18 | Verlängerung | [WORTLAUT ZUR VERLÄNGERUNG — ANWALT] | — | OFFEN | ⚠ § 309 Nr. 9 BGB: Eine automatische Verlängerung ist bei Verbraucherverträgen nur auf unbestimmte Zeit mit höchstens einmonatiger Kündigungsfrist zulässig — „um dieselbe Laufzeit“ wäre für Web-Abos unwirksam (Nachtrag 02, Frage 5) |
| ST-ABO-19 | Kündigen-Hinweis vor dem Kauf | Kündigen kannst du jederzeit mit zwei Tipps in deinem Konto. | 65 | ENTWURF | Handbuch A: zwei Tipps, ohne Rückhaltefragen |
| ST-ABO-20 | Kauf-Button (§ 312j BGB) | Zahlungspflichtig bestellen | 30 | GESETZ | gesetzliches Beispiel für die Beschriftung; Abweichungen nur nach Anwaltsprüfung |
| ST-ABO-21 | Wegwischen | Nicht jetzt | 16 | ENTWURF | kein Beschämen („Nein, ich will keine Vorteile“) |
| ST-ABO-22 | Kontoauszug | Auf deinem Kontoauszug steht: {abrechnungsname} | 55 | OFFEN | ⚠ neutraler Abrechnungsname ist eine Produktentscheidung (A-29) |
| ST-ABO-30 | Kündigungsschaltfläche (§ 312k BGB) | Verträge hier kündigen | 24 | GESETZ | gesetzlicher Wortlaut |
| ST-ABO-31 | Bestätigungsschaltfläche (§ 312k BGB) | Jetzt kündigen | 16 | GESETZ | gesetzlicher Wortlaut („jetzt kündigen“) |
| ST-ABO-32 | Nach der Kündigung | Gekündigt. Dein Abo läuft bis {datum}, danach wird nichts mehr abgebucht. Die Bestätigung kannst du hier speichern. | 130 | ENTWURF | § 312k Abs. 3 BGB: Speichern mit Datum und Uhrzeit. ⚠ Abs. 4 verlangt zusätzlich eine sofortige Bestätigung „auf elektronischem Wege in Textform“ — ob das in der App geht, klärt der Anwalt (Nachtrag 02, Frage 5) |
| ST-ABO-33 | Eine Frage nach der Kündigung | Magst du uns sagen, warum? Freiwillig — die Kündigung ist schon erledigt. | 80 | ENTWURF | Handbuch B: genau eine offene Frage, erst nach der Kündigung |
| ST-ABO-34 | Abo über einen Store | Du zahlst über {store}. Kündigen kannst du dort in den Abo-Einstellungen. Wir bringen dich hin. | 100 | ENTWURF |  |
| ST-ABO-40 | Unterstützer-Beitrag (Handbuch B) | Unterstützen, 5 € im Monat. Dafür gibt es nichts außer einem Abzeichen — und unseren Dank. | 95 | ENTWURF | nie beworben, nur im Abo-Bereich auffindbar |

---

## 19 · Mitteilungen

Standardmäßig ohne Absender und Vorschau, höchstens eine Mitteilung je Absender in 15 Minuten, Ruhezeit 23 bis 8 Uhr, Anfragen lösen nie eine Mitteilung aus (Handbuch A). **Jede Mitteilung wird so geschrieben, als läse sie jemand anderes auf dem Sperrbildschirm.**

| ID | Ort / Kontext | Text | max. Zeichen | Status | Hinweis |
|---|---|---|---|---|---|
| ST-PUSH-01 | Neue Nachricht | Neue Nachricht | 20 | ENTWURF | ohne Absender und Vorschau (Voreinstellung) |
| ST-PUSH-02 | Mehrere Nachrichten, gebündelt | Neue Nachrichten | 20 | ENTWURF | höchstens eine Mitteilung je Absender in 15 Minuten |
| ST-PUSH-03 | Mit Vorschau, nur nach Einschalten | {name}: {vorschau} | 65 | ENTWURF |  |
| ST-PUSH-04 | Einstellung | Name und Vorschau zeigen | 30 | ENTWURF |  |
| ST-PUSH-05 | Warnung beim Einschalten | Auf dem Sperrbildschirm kann das jeder lesen, der dein Telefon sieht. | 75 | ENTWURF | Handbuch A: Eine Vorschau kann ein Outing sein |
| ST-PUSH-10 | Sicherheitsmitteilung | Neue Mitteilung in der App | 30 | ENTWURF | neutral; öffnet den Mitteilungsbereich |
| ST-PUSH-11 | Treffen mit Zusage beginnt bald | Ein Treffen, dem du zugesagt hast, beginnt bald. | 50 | ENTWURF | F33 |
| ST-PUSH-12 | Check-in, Rückfrage | Kurze Rückmeldung zu deinem Termin? | 40 | ENTWURF | „Termin“ statt „Treffen“ — der Sperrbildschirm liest mit |
| ST-PUSH-13 | Foto freigegeben | Dein Foto ist jetzt sichtbar. | 30 | ENTWURF | optional |
| ST-PUSH-20 | Einstellung Ruhezeit | Ruhezeit von {von} bis {bis} Uhr | 32 | ENTWURF | Voreinstellung 23 bis 8 Uhr |

---

## 20 · Prüfprotokoll

Programmatisch geprüft am 15.09.2026 über alle 310 Einträge mit Text (Platzhalter ausgenommen).

| Prüfung | Ergebnis |
|---|---|
| Doppelte IDs | keine |
| Zeichengrenzen (Platzhalter mit angenommener Länge) | alle eingehalten |
| Ausrufezeichen | 1 — ST-FEST-05, festgelegte Formulierung, als Widerspruch markiert |
| Emojis | keine |
| Sätze | 465 Sätze, 2.822 Wörter, Ø 6,1 Wörter je Satz, längster Satz 18 Wörter (ST-FEST-04, festgelegt) |
| Sätze mit höchstens 15 Wörtern | 99,4 % |
| Lesbarkeitsindex LIX | 29,1 — unter 40 gilt als leicht verständlich |
| Pronomen für Personen | keine; alle gefundenen Pronomen beziehen sich auf Sachen (Standort, Text, Widerspruch, Vorschlag, Raum) |

**Wörter unter Beobachtung** („sicher“, „100 %“, „garantiert“, „niemals“, „nie“, „immer“, „niemand“, „ausgeschlossen“, „anonym“) — 8 Fundstellen, jede begründet:

| ID | Wort | Warum es stehen bleibt |
|---|---|---|
| ST-FEST-02 | nie | festgelegte Formulierung; architektonisch gedeckt, weil das Selfie beim Prüfpartner verarbeitet wird |
| ST-FEST-10 | nie | festgelegte Formulierung; bindende Zusage, keine Sicherheitsaussage |
| ST-KON-29 | nie | Zusage über unser eigenes Handeln („nie per E-Mail“), gefordert von A-18 |
| ST-CV-02 | immer | Verfahrenszusage nach Art. 22 DSGVO (keine Kontosperre ohne Menschen) |
| ST-VER-31 | immer | Schutzversprechen („kostenlos, immer“) |
| ST-PRO-61 | niemand | Bauvorgabe: Gesundheitsangaben sind nicht filterbar |
| ST-HEU-05 | nie | Bauvorgabe F30: kein Einzelpunkt für eine Person |
| ST-DAT-06 | niemand | Rat an den Nutzer, keine Zusage |

Keine einzige Fundstelle behauptet, dass etwas sicher sei.

---

## 21 · Zu klären — Sammelliste

| # | Punkt | Einträge | Wer | Wohin |
|---|---|---|---|---|
| 1 | Rückverfolgbarkeits-Satz stimmt nach reiner Altersschätzung nicht; „für Täter uninteressant“ ist UWG-nah | ST-FEST-03, ST-VER-10 | Gründer + Anwalt | **Nr. 51** |
| 2 | Ausrufezeichen in der festgelegten Absage | ST-FEST-05 | Gründer | Endfassung |
| 3 | „einmal kurz“ bei Altersschätzung mit Puffer | ST-FEST-01, ST-VER-11 | Produkt | A-29, Nr. 39 |
| 4 | Web-App-Grenzen: Rückseiten-Tippen, nachträgliches Tarnsymbol, Bildschirmfoto-Sperre, Internetadresse in Mitteilungen | ST-SIC-31, ST-SIC-41, ST-KON-62, ST-CHAT-44 bis 46, ST-REC-15 | Gründer + Produkt | **Nr. 47**, A-29 |
| 5 | Was eine Zone bewirkt — und ob weitere Zonen im Abo Prinzip 6 verletzen | ST-STO-31, ST-ABO-03 | Gründer | **Nr. 48**, A-29 |
| 6 | Web-Abo: Verlängerung, Kündigungsbestätigung, Abrechnungsname, E-Mail-Absender, Pflichtangaben | ST-ABO-18, -22, -32, ST-MAIL-01 | Anwalt + Gründer | **Nr. 49**, Nachtrag 02 Frage 5 |
| 7 | Vorauswahl des Jahresabos gegen Prinzip 1 | ST-ABO-10 bis 17 | Gründer + Anwalt | **Nr. 50** |
| 8 | Namen der Genauigkeitsstufen | ST-STO-01 | Produkt | A-29 |
| 9 | Absichten 3 und 4, Zeitfenster, Bedeutung der Nachtruhe | ST-PRO-04, -05, -07 | Interviews, Produkt | A-19, A-29 |
| 10 | Namen der drei Antwortquoten-Bänder | ST-PRO-10 bis 12 | Interviews, Betroffene | A-19, A-29 |
| 11 | Name des zweiten Postfachs | ST-CHAT-02 | Produkt | A-29 |
| 12 | Reihenfolge der Ersatzinhalte im Raster; Raster ohne Standortfreigabe | ST-LEER-02, ST-REC-05 | Produkt | A-29 |
| 13 | Mechanismus des Check-ins und Löschung danach | ST-SIC-12, ST-SIC-14 | Produkt | A-29 |
| 14 | Leistungen von PLUS und PRO | ST-ABO-03, -04 | Gründer | A-29, A-20 |
| 15 | Freitextprüfung: Hinweis oder Sperre | ST-FEH-62, -63 | Produkt | A-29 |
| 16 | Widerspruchsfrist 72 oder 48 Stunden | ST-MEL-26 | Produkt | A-29 |
| 17 | Kleinere Festlegungen: Dateiformate und -größe, Nachrichtenlänge, PIN-Länge, Schutz der Exportdatei, Profil während der Löschkarenz, Mindestgröße der Personengruppen auf der Karte, Archiv nach 24 Stunden, wer verfallende Nachrichten einschaltet, Zustellung nach der Altersprüfung, Umgang mit Minderjährigen, Verfahren der Fotoprüfung, Länderliste der Reisewarnung | ST-FEH-10, -11, -32, ST-SIC-32, ST-DAT-05, -12, ST-LEER-12, -22, ST-CHAT-31, ST-VER-03, -13, -21, ST-SIC-60 | Produkt | A-29 |
| 18 | Meldegründe und Ablehnungsgründe mit den Nutzungsbedingungen abstimmen; Vertraulichkeit der meldenden Person | ST-MEL-03 bis 10, ST-MEL-17, ST-FEH-14 | Anwalt | Anwaltstermin |
| 19 | Welche Fassung „Was wir prüfen“ gilt | ST-DAT-20 | Anwalt | Nr. 30 |
| 20 | Community-Vertrag: Satz A oder B; Merkmalsliste der Zeile 4 | ST-CV-03 bis 06, 13 bis 16 | Interviews, Betroffene | A-19, Nr. 13 |
| 21 | Taxonomie-Texte | ST-PRO-40 | Betroffene, bezahlt | Nr. 13 |

---

## 22 · Was bewusst fehlt

| Nicht enthalten | Warum | Wo es hingehört |
|---|---|---|
| Einwilligungstexte, Nutzungsbedingungen, Datenschutzerklärung, Widerrufsbelehrung, Verlängerungsklausel | Rechtstexte — Stufe 4 der KI-Arbeitsteilung | Fachanwalt |
| Eisbrecher-Vorlagen | Sie bauen auf den strukturierten Merkmalen (F15) auf, deren Liste noch nicht steht | neue Aufgabe **A-40** |
| Was nach einem Hash-Treffer gesagt wird | Ermittlungsgefährdung; das entscheidet der Trefferprozess | A-36 |
| Texte für Ortsbetreiber und das Veranstalterportal | B2B, nicht Nutzeroberfläche | R-03, V2 |
| Store-Beschreibungen, Landingpage, Beiträge | Marketing | A-02, A-05, A-06 |
| V2- und V3-Funktionen (außer Reisewarnung und Gesundheitsangaben) | kommen mit ihrer Stufe | spätere Fortschreibung |
| Fremdsprachige Fassungen | Mehrsprachigkeit erst ab der ersten Auslandsstadt (Handbuch A) | Phase 3 |

---

## 23 · Quellen

**Projektintern:** Handbuch A (Gestaltungssystem, festgelegte Formulierungen, Mikro-UX, Funktionskatalog F1–F74, Streichliste, Rechtsauflagen, KI-Einsatz) · Handbuch B (Abonnements und Erlöskette, Feedbackwege) · `moderationsarchitektur.md` (Abschnitte 2, 5, 8, 11) · `../30-marketing-kanaele/krisenkommunikation-vorlagen.md` (Abschnitte 1, 6, 7) · `../30-marketing-kanaele/landingpage-copy-warteliste.md` (Tonfall) · `../70-entwicklung-ab-monat-4/code-planer.md` (Web-Push auf iOS) · `../02-ki-aufgaben/aufgaben-entwicklung.md` (S4: Freitext-Hinweis) · `../01-steuerung/wettbewerbsbeobachtung-log.md` (KJM-Altersschätzung, Wallet „d-you“)

**Extern, abgerufen am 15.09.2026:**

| Was belegt wird | Quelle |
|---|---|
| § 312k Abs. 2 bis 4 BGB — Wortlaut „Verträge hier kündigen“, „jetzt kündigen“, Speichern, Bestätigung in Textform | https://lxgesetze.de/bgb/312k |
| § 309 Nr. 9 BGB — Verlängerung nur auf unbestimmte Zeit mit Monatskündigung (seit 01.03.2022) | https://www.ihk.de/koeln/hauptnavigation/recht-steuern/faire-verbrauchervertraege-5329466 |
| Wie Chrome Änderungen am Manifest installierter Web-Apps übernimmt | https://web.dev/articles/manifest-updates |
| Welche Manifest-Felder sich nach der Installation ändern lassen, iOS eingeschlossen | https://intercom.help/progressier/en/articles/8463795-what-fields-of-a-pwa-s-manifest-can-be-updated-after-installation |

*Hinweis zu § 312j Abs. 3 BGB (Kauf-Button):* Der Gesetzeswortlaut war in diesem Lauf nicht abrufbar. „Zahlungspflichtig bestellen“ ist das in der Fachliteratur durchgängig zitierte gesetzliche Beispiel; vor der Umsetzung prüft der Anwalt die endgültige Beschriftung.
