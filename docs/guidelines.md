# Guide for writing changelog
- There are 3 possible sections: "Neue Funktionen", "Änderungen", "Fehlerbehebungen"
  - If there are no items fitting to any section it may be left out
- Notes in those sections are meant for end users, they contain no technical details
- Technical details are kept in a separate section "Technisches"

It follows the general template.

# <version string>
## Neue Funktionen
- Testtakers-XML: `<Login>` akzeptiert nun ein optionales Kind-Element `<ViewSettings monitorBookletVisibility="visible|collapsed|hidden"/>` für `monitor-group`-Logins. Damit kann gesteuert werden, ob die Testheft-Liste im Startmenu sichtbar, eingeklappt oder nicht sichtbar angezeigt wird (Standard: `visible`).

## Änderungen
- GET /getResults
  - Das Löschen einzelner Testläufe über den Admin-Bereich führt nun zu einem aktualisierten timestamp in diesem Endpunkt.
- Testtakers.xml:
  - `<Login code="..." />` kann nun auch aus rein numerischen Werten bestehen.

## Fehlerbehebungen
- Testleitungskonsole:
  - Navigieren in einen derzeit geöffneten Block navigiert nun wieder erfolgreich in die erste Unit des Blocks.
  - Navigieren in einen zuvor gesperrten Block (Zeitsperre, LockAfterLeaving) nun in allen Fällen möglich.

## Technisches
- Zeiten der Healthchecks wurden angepasst. Die Docker Container sollten dadurch bei einem `make up` schneller hochfahren.
- SQL injection bug in Endpunkt <xy> behoben