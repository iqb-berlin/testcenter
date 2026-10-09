# E2E-Tests

Die Anwendung enthält eine umfangreiche Cypress Testsuite. Nachfolgend wird beschrieben, wie diese genutzt werden kann.

## Starten der Cypress Testsuite

**Installation:** Clone this repository

**Initialisierung:** `make init`

### Cypress GUI benutzen

`make test-system`

### CLI benutzen

`test-system-headless` Führt alle Tests im Verzeichnis *.e2e/src/e2e* in der Konsole aus.

`make test-system-headless spec=Test-Controller/demo` für einen bestimmten Test in der Konsole aus. In diesem Beispiel den Test für eine Demo-Mode Durchführung.

## Pfad zu den Testdateien

Alle Testfälle befinden sich in diesem Verzeichnis: **/e2e/src/e2e**. Hier können weitere Testfälle hinzugefügt werden, diese werden dann in der Cypress-GUI zur Auswahl angeboten.

## Gruppen der Testsuite und deren Bedeutung

### Booklet-Config

Hier wird der Großteil der zur Verfügung stehenden [Booklet-Konfigurations-Parameter](https://iqb.pages.cms.hu-berlin.de/testcenter/de/pages/booklet-config.html#list-of-parameters) geprüft.

### Group-Monitor

Es werden grundsätzliche Funktionen des Gruppenmonitors getestet. Aktuell wird das Navigieren von Testpersonen durch den Gruppenmonitor noch nicht getestet, da hierfür ein entsprechender Client simuliert werden müsste.

### Session-Management

**hot-modes:**

Hier werden die Grundfunktionen der Modi: `hot-restart` und `hot-return` getestet. In diesem Fall, ob Antworten und Logs gespeichert werden und ob sich die Modi bzgl. Anmeldung so verhalten, wie vorgesehen:

* hot-restart: Bei erneuter Anmeldung wird eine neue Person angenommen und der Test wird neu gestartet
* hot-return: Bei erneuter Anmeldung wird dieselbe Testperson angenommen und der Test wird fortgesetzt

**login-possibilities:**

Es werden die verschiedenen Anmeldevarianten getestet (Link, Code etc.).

**login-sink:**

Prüft die Anzahl ungültiger Anmeldeversuche und die zeitlich befristete Sperrung für Neueingaben.

**testtakers-content:**

Es wird getestet, dass nur eine gültige Testtaker-XML geladen werden kann. Bspw. dürfen keine gleichen Group-IDs oder Loginnamen in der Testtaker-XML  angelegt sein.

**time-limited access:**

Es wird die zeitliche Gültigkeit von Zugängen geprüft.

### Super-Admin

Es werden alle Funktionen des Super-Admins getestet.

### System-Check

Es werden die Grundfunktionen eines System-Checks getestet und der erzeugte Bericht wird auf Richtigkeit geprüft.

### Test-Controller

Es werden die [folgenden](https://pages.cms.hu-berlin.de/iqb/testcenter/de/pages/test-mode.html) spezifischen Funktionen der Modi: **demo**, **hot-restart**, **hot-return** und **review** geprüft:

Mit dem Test: **time-restrictions** werden zeitliche Beschränkungen getestet.

In dem Test *nav-restriction-bklt-config.cy.ts* werden die Booklet-Konfigurationsparameter: `presentation-complete` `response-complete` getestet. "Nav" steht an dieser Stelle für Navigation.

In dem Test *nav-restriction-testlet.cy.ts* werden die im Testlet zur Verfügung stehenden Parameter: `presentation-complete` `response-complete` getestet.

### Workspace-Admin

Es werden alle Funktionen eines Workspace-Admins getestet. Dazu gehört bspw. das Laden von Testdateien in einen Arbeitsbereich, das Herunterladen von Antworten und vieles mehr.

### utils

Hier befinden sich alle Routinen, die mehrfach in den Tests Verwendung finden.
