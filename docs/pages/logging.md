# Dokumentation der Log-Events (Testcenter)

Diese Datei dokumentiert alle Log-Events, die vom Testcenter angelegt werden. Dieser Stand entspricht `master`; historische Versionen werden nicht dokumentiert.

Es gibt zwei Log-Arten:

- **TestLog** — Informationen zur gesamten Test-Session, geschrieben in die Tabelle `test_logs`.
- **UnitLog** — Informationen aktuellen Unit innerhalb einer Test-Session, geschrieben in die Tabelle `unit_logs`.

Beide Log-Einträge bestehen aus einem `logKey` (Ereignis-Name), einem `timeStamp` (Unix-Zeitstempel in Millisekunden) und einem optionalen `logContent` (arbiträre Zusatzdaten, meist JSON-kodiert). In den meisten Fällen ist der logKey ausreichend als Information.

## TestLog-Events

| logKey | Wann wird geloggt | Bedeutung / Zweck | logContent |
|---|---|---|---|
| `LOADCOMPLETE` | Wenn alle Ressourcen einer Test-Session (Units, Definitionen, Schemas) geladen sind und der Test startbereit ist. Nur wenn `saveResponses` aktiv ist. | Markiert das Ende der Ladephase. Enthält Umgebungsinformationen (Browser, Betriebssystem, Ladezeit). | JSON mit `environment`-Objekt (u. a. `loadTime` in ms) |
| `command executed` | Nachdem ein vom Gruppen-Monitor gesendetes Kommando (z. B. `pause`, `resume`, `terminate`, `goto`, `debug`) im Test-Frontend ausgeführt wurde. | Audit-Trail über vom Monitor gesteuerte Eingriffe in eine Test-Session. | Serialisierter Kommando-String (Keyword + Argumente) |
| `locked by monitor` | Wenn ein Gruppen-Monitor eine Test-Session (oder mehrere) über das Monitor-Interface sperrt. | Nachvollziehen, wer eine Session gesperrt hat. | Numerische User-ID des Monitors |
| Freier Text (Lock-Message) | Wenn eine Session per `PATCH /test/{id}/lock` gesperrt wird (z. B. regulärer Test-Abschluss durch den Testteilnehmer). | Dokumentiert Sperr-Ereignis mit einer optional übergebenen Begründung. | Kein separater Content — die Begründung steht direkt im `logKey`. |
| `"CONNECTION"` | Bei automatischen Zustandsänderungen der Verbindung — insbesondere wenn das Backend von `LOST` auf `POLLING` zurückwechselt, sobald wieder Requests eingehen. | Verbindungsverlust und Wiederherstellung nachvollziehen. | Neuer Wert des CONNECTION-States (z. B. `POLLING`, `LOST`, `OK`) |
| State-Keys via `PATCH /test/{id}/state` | Bei jeder Änderung des Test-States, die vom Frontend gemeldet wird. Jeder gepatchte Key erzeugt einen TestLog-Eintrag mit demselben Key. | Historie aller Test-State-Übergänge. | Neuer Wert (JSON-kodiert) |

Mögliche State-Keys (aus `TestState`, `frontend/.../test-controller.interfaces.ts:85`):

- `CURRENT_UNIT_ID` — Aktuell angezeigte Unit.
- `TESTLETS_TIMELEFT` — Restzeiten für Testlets mit Zeitbegrenzung.
- `TESTLETS_CLEARED_CODE` — Testlets, die per Freigabe-Code entsperrt wurden.
- `TESTLETS_LOCKED_AFTER_LEAVE` — Testlets, die nach Verlassen gesperrt wurden.
- `BOOKLET_STATES` — Aggregierte Booklet-Zustände.
- `UNITS_LOCKED_AFTER_LEAVE` — Units, die nach Verlassen gesperrt wurden.
- `FOCUS` — Fenster-Fokus-Status des Test-Frontends.
- `CONTROLLER` — Zustand des Test-Controllers (`LOADING`, `RUNNING`).
- `CONNECTION` — Verbindungsstatus (siehe oben).
- `SHARED_PARAMETERS` — Über Units geteilte Parameter.

## UnitLog-Events

| logKey | Wann wird geloggt | Bedeutung / Zweck | logContent |
|---|---|---|---|
| `Runtime Error: {code}` | Wenn ein Verona-Player einen Runtime-Fehler meldet (z. B. fehlende Session-ID, fehlende Unit-Definition, falsche Session-ID, nicht unterstützter Definitions- oder State-Typ, generischer Runtime-Fehler). Nur wenn `saveResponses` aktiv und die Unit ermittelbar ist. | Player-seitige Fehler festhalten, um Fehlbedienungen und Player-/Definitions-Inkompatibilitäten auszuwerten. | Fehler-Meldung (Text, ggf. leer) |
| Player-Logs (`vopStateChangedNotification.log`) | Wenn ein Verona-Player über die `vopStateChangedNotification`-Message eigene Log-Einträge sendet. `logKey` und `content` werden vom Player bestimmt und vom Testcenter unverändert übernommen. | Player-spezifische Ereignisse (siehe Doku des jeweiligen Players — Aspect, Speedtest, StarS usw.). | Vom Player definiert |
| State-Keys via `PATCH /test/{id}/unit/{unit}/state` | Bei jeder Änderung des Unit-States (z. B. Seitenwechsel, Fortschritts-Updates), die vom Frontend gemeldet wird. Jeder gepatchte Key erzeugt einen UnitLog-Eintrag mit demselben Key. | Historie der Unit-Bearbeitung (Seiten, Fortschritt, Player-Ladezustand). | Neuer Wert des jeweiligen State-Keys |

Mögliche State-Keys (aus `UnitState`, `frontend/.../test-controller.interfaces.ts:98`):

- `PLAYER` — Zustand des Player-Prozesses (`LOADING`, `RUNNING`).
- `CURRENT_PAGE_ID` — ID der aktuell angezeigten Seite innerhalb der Unit.
- `CURRENT_PAGE_NR` — Nummer der aktuell angezeigten Seite.
- `PAGE_COUNT` — Anzahl der Seiten der Unit.
- `PRESENTATION_PROGRESS` — Verona-Fortschritt der Präsentation (`none`, `some`, `complete`).
- `RESPONSE_PROGRESS` — Verona-Fortschritt der Antworten (`none`, `some`, `complete`).


## Nicht enthalten in dieser Doku

- Log-Events, die von Playern (Aspect, Speedtest, StarS, …) selbst definiert und über `vopStateChangedNotification` gesendet werden — diese sind Player-spezifisch und müssen in der jeweiligen Player-Doku beschrieben werden.
