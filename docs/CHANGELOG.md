---
layout: default
---

## [next]
### Performance
* Das Backend allgemein wurde performanter und resourcen-sparendergemacht, indem der selbst implementierte Autoloader entfernt und mit dem deutlich effizienteren Autoloader von composer ersetzt wurde.

### Neue Features
* In der Übersicht der Arbeitsbereiche für den Super-Admin wird nun das letzte Änderungsdatum angezeigt, um
  die Verwaltung zu erleichtern.  

# Changelog & Upgrade Information

## 14.10.0
###  XML-Austausch-Formate
* In der Definition der Unit-XMLs gibt es eine Variablenliste. Bei den Variablen wurde die Restriktionen für 
  die Variablen-ID gelockert, das Attribut `page` hinzugefügt. Die XML-basierte Variablenliste wird vermutlich 
  mittelfristig zugunsten einer JSON-basierten aufgegeben. d

### Bugfixes
* Ein kritischer Bug sorgte dafür, dass das Hochladen von Dateien sowie das Hochfahren des Systems *extrem* lange 
  dauern konnte, wenn viele Dateien in den Arbeitsbereichen lagen. Dieser ist behoben.
* Für das Einlesen der Workspaces beim Hochfahren des Testcenters wurde mehr Speicher freigegeben.
* Ein kritischer Fehler im Netzwerkgeschwindigkeitstest wurde behoben.

## 14.9.0
### XML-Austausch-Formate
* Das `<Metadata>`-Element der Unit-XML wurde erweitert um die möglichen Kindelemente `<Transcript>` und `<Reference>`.
  Dies sind vorübergehende Felder füt die Verarbeitung im IQB-Studio, die nach der Einführung des geplanten Metadaten-
  standards wieder entfernt werden. 

## 14.8.0
### Bugfixes
* Wiederherstellen gelöschter Logins auf anderem Workspace wird verhindert: Hatte man einen Login gelöscht, die damit
  erhobenen Daten jedoch nicht, und hatte man anschließend einen gleichlautenden login auf einem anderen workspace
  erstellt, so wurde dieser mit den Daten und Booklets des alten verbunden. Dies ist nun behoben. 
* Das Hochladen mehrerer Dateien im Workspace-Adminbereich wird nun mit einem einzigen Request durchgeführt. Dies führt 
  dazu, dass man z. B. eine Unit-xml und die dazugehörige voud-Datei gleichzeitig hochladen kann.
* Status "untätig" im Gruppen-Monitor ("Testleitungskonsole") wird verlässlich nach 5 bis 8 Minuten angezeigt. 
  Zuvor wurde er unter bestimmten Umständen nicht korrekt angezeigt.

### Änderungen
* Wenn einem Testtaker nur ein Testheft zugeteilt ist, dann wird man nach erfolgreichem Login nicht mehr zur 
  Testheft-Übersicht weitergeleitet. Stattdessen wird das Testheft direkt gestartet.

## 14.7.0
### Neue Features
* Neue Rolle Studienmonitor (`monitor-study`). Der Studienmonitor hat Zugriff auf alle Gruppen per 
  Gruppen-Monitor. Weitere Funktionen sind geplant. 

### Verbesserungen
* Rückmeldung beim Hochladen von Testtakers-Dateien über bereits vorhandene Logins oder Gruppen verbessert. 
* Teilnehmer können auch mit dem Gruppen-Monitor ("Testleitungskonsole") nicht in zeitgesteuerte Blöcke verschoben
  werden, wenn deren Zeit abgelaufen ist. Dies wird im Gruppen-Monitor nun auch visuell dargestellt.

### Sicherheit
* Content-Security-Policy hinzugefügt.
* Unsichere Abhängigkeiten im Broadcasting Service entfernt


## 14.6.0
### Änderungen
* Im Gruppen-Monitor ("Testleitungskonsole") werden Tests, die noch nicht gestartet worden sind, nicht mehr 
  mitgesteuert. Wenn vor dieser Änderung beispielsweise alle Teilnehmer in den zweiten Block geschoben worden sind,
  starteten Teilnehmer, die die Studie später nachholten bei block zwei. Da dieses Verhalten bei Nachhol-Sitzungen
  hinderlich war, wurde es nun geändert. Noch nicht gestartete Tests sind gar nicht anwählbar, gesperrte Tests sind es,
  werden aber nicht automatisch mitselektiert, damit man sie anwählen und wieder entsperren kann.

### Neue Features
* Es kann nun gesteuert werden, wann beim Bearbeiten von zeitbeschränkten Blocks Warnungen angezeigt werden sollen. 
  Der Standard ist weiterhin bei noch 5 und bei noch einer verbleibenden Minute.
  Hierfür gibt es nun den Booklet-Parameter `unit_time_left_warnings` und den Customtext-Token `booklet_msgTimerStarted`

### Sicherheit
* Sitzungen werden beim Log-Out auch serverseitig deaktiviert.
* Kleine eventuell für XSS-Angriffe nutzbare Sicherheitslücke behoben.  

### Bugfixes
* Abgelaufene und wieder freigegebene Sitzungen können ohne Leerung des Browser-Caches wieder verwendet werden
* Hatte man in einer Instanz einmal die Workspace-Admin-Ansicht geladen, konnte danach kein Test mehr gestartet werden,
  ohne dass die Seite neu geladen wurde. Dies ist behoben.
* Nachrichten im Seiten-panel des Gruppen-Monitors verschwinden wieder nach einiger Zeit.

## 14.5.1
### Bugfixes
* Gruppen im Modus `run-review` werden in der Workspace-Übersicht "Ergebnisse/Antworten" wieder angezeigt, 
  wenn es reviews gibt. 

## 14.5.0
### Sicherheit
* Softwareupdate: Aktuelle Versionen von PHP und Apache
* Information Disclosure: Backend-Calls liefern die Versionen von PHP Apache nicht mehr aus
* Unzureichende Entropie bei Session-Tokens beseitigt
* Enumerierung von Admin-Benutzernamen durch timing-attacks erschwert

### Bugfixes
* *Schwerer Fehler behoben*: Mehr als 15-20 Anmeldungen gleichzeitig mit einem Login im Modus `hot-run-restart` führten
  in der Version 14.4.0 zu Fehlern.
* Es werden *keine* Einträge in der Workspace-Übersicht "Ergebnisse/Antworten" mehr durch Testdurchgänge im Demomode erzeugt. 

### Verbesserungen
* Personen die sich mit ein und selben Login im Modus `hot-run-restart` angemeldet haben, erhalten nun keine 
  fortlaufende Nummer mehr als Bezeichner (in den Ergebnisdaten), sondern einen Code. Ein Fortlaufender bezeichner hat
  sich als technisch nicht verlässlich möglich erweisen, wenn Anmeldungen gleichzeitig vorn statten gehen.

## 14.4.0
### Verbesserungen
* Localstorage muss nach Update des Testcenters nicht mehr gelöscht werden

### UI
* Super-Adminbereich: Arbeitsbereiche können durch Namensänderungen nicht mehr denselben Namen tragen

### Bugfixes
* "Leerzeilen-Problem" gelöst: Unter bestimmten Umständen konnten, wenn z. B. mehrere Sessions eines logins im 
  `hot-run-restart`-Modus gleichzeitig gestartet werden, doppelte Sessions erzeugt werden. Der Effekt waren zusätzliche
  "Leerzeilen" in den Ergebnisdaten.   
* Startvorgang bricht nicht mehr ab, wenn fehlerhafte XMLs im Workspace liegen.

## 14.3.0
### Bugfixes
* SysCheck: Units mit externer Definition funktionieren wieder
* Logins verbleiben nicht mehr in der Datenbank nach dem Löschen eines Workspaces.
* Das Löschen von Dateien, die von anderen verwendetet werden (z. B. Units in einem Booklet), werden wieder korrekt
  verhindert.
* Zeitanzeige in Demo- und Review-Modus repariert

### UI
* Adminbereich: Arbeitsbereich kann durch Änderung der URl gewechselt werden

### Verbesserungen
* Veränderter Anwendungsparameter für Broadcasting-Service
  - Kann nun mittels BROADCAST_SERVICE_ENABLED an- und abgeschaltet werden
  - Die zugehörigen URLs werden dynamisch anhand dieses Schalters generiert und
    tauchen nicht mehr in der Konfigurationsdatei (.env) auf

### Sicherheit
* Ausschalten der Unterstützung für veraltete TLS-Versionen 1.0 and 1.1
* Einschränkung der verfügbaren TLS-Cipher-Suiten
  - TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
  - TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
  - TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256
  - TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384
  - TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256
  - TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384

### :warning: Hinweis für Administratoren
Falls der Update-Mechanismus nicht verwendet wird, muss das environment-file (.env) entsprechend angepasst werden:
- `TLS=off` / `TLS=on` muss gegen TLS_ENABLED=no/TLS_ENABLED=yes ersetzt werden.
- `BROADCAST_SERVICE_URI_PUSH` und `BROADCAST_SERVICE_URI_SUBSCRIBE` können entfernt werden. Stattdessen wird der 
  Parameter `BROADCAST_SERVICE_ENABLED=true` (=false) verwendet, um zu bestimmen, ob Websocket-Verbdinungen versucht werden sollen.


## 14.2.0
### Bugfixes
* Benutzerdefinierte Beschriftungen (CustomTexts) werden korrekt zurückgesetzt, wenn neu eingeloggt bzw. ein 
  neues Booklet geladen wird. 
* Die Zeitbeschränkung kann nicht mehr durch Click auf das IQB-Logo umgangen werden

### Sicherheit
* Updates sehr vieler NPM-Pakete, Basis-Images und anderer Komponenten
* CORS wurde aktiviert
* Verschiedene tls-security-headers hinzugefügt


## 14.1.0
### Bugfixes
* Kleiner Fehler behoben beim Aufräumen der DB, wenn Dateien gelöscht werden.
* Kleiner Fehler behoben beim Laden von Playern, deren Dateiname von der ID abweicht.
* Das Löschen von abhängigen Dateien wurde nicht korrekt blockiert.
* XML-Dateien, die ein BOM enthalten, können trotzdem verwendet werden.

### :warning: Hinweis für Administratoren

Die folgende Hinweise sind nur relevant, falls nicht das Standardsetup samt Update-Mechanismus verwendet wird.

* Die Konfigurationsdatei für die Datenbank muss zur Verfügung stehen.
Beispielkommando mit wget:
```
wget -nv -O config/my.cnf https://raw.githubusercontent.com/iqb-berlin/testcenter/14.1.0/scripts/database/my.cnf
```
* Der Name der TLS-Konfigurationsdatei wurde angepasst und zusätzliche Sicherheitseinstellungen hinzugefügt.
Falls der Patch-Mechanismus nicht verwendet wird, kann der Standardinhalt per Hand übertragen werden.
  ([Pfad zur Standardeinstellung](https://raw.githubusercontent.com/iqb-berlin/testcenter/master/dist-src/tls-config.yml))

## 14.0.1

### Bugfixes
* Kleiner Fehler behoben beim Aufräumen der DB, wenn Dateien gelöscht werden.
* Kleiner Fehler behoben beim Laden von Playern, deren Dateiname von der ID abweicht.


## 14.0.0
### :warning: Wichtige Änderungen für Studienleitungen

#### Unit-Definitionen

**Achtung! Diese Änderungen können es unter Umständen nötig machen, ältere Units zu bearbeiten! Wenn die Studien aus
einem aktuellen IQB-Studio exportiert worden sind, sollte es jedoch kein Problem geben, da dann Kennung und
Dateinamen immer identisch sind.**

Die Logik der Playerauswahl hat sich geändert.
In den Unit-Definitions Dateien gibt es im `<Defintion>`- bzw. `<DefintionRef>`-Element 
das Attribut `player`. Dessen Wert wird nun anders interpretiert, nämlich nicht mehr als Dateiname,
sondern als Kennung des Players, wie sie in dessen Metadaten hinterlegt ist.

Zulässig sind folgende Schreibweisen:
`<Defintion player="verona-player-absurd@1.0>`
oder
`<Defintion player="verona-player-absurd-1.0>`

In diesem Beispiel benötigt die Unit einen Player, der die ID `verona-player-absurd` hat und in der 
Version 1.0 vorliegt, vollkommen unabhängig davon, ob die Datei dazu `verona-player-absurd@1.0.0.html`,
`absurd-playerV1.0html`, oder ganz anders heißt.

Vorher wäre dazu ein Player aus einer Datei `verona-player-absurd@1.0.html` bzw. 
`verona-player-absurd-1.0.html`, gesucht worden, egal, was tatsächlich in dieser Datei enthalten gewesen 
wäre. Dabei gab es gewisse Spielräume bei der Schreibweise der Dateinamen, so konnte 
`verona-player-absurd@1.0.html` z. B. eine Datei `verona-player-absurd@1.0.1.HTML` auswählen. 
Die Dateiendung `.html` war optional, daher sehen die ehemaligen Dateiverweise in oft genau aus wie
die jetzigen Kennungen.

Eine genaue Spezifikation einer Patch-Version ist nicht mehr möglich. Alles, was nach der Kennung kommt, 
also zum Beispiel eine dritte Versions-nr wird ignoriert.

Ein Arbeitsbereich kann nun, analog zum IQB-Studio immer nur eine patch-version eines players enthalten, also nicht zugleich eine 
Version 1.2.3 und 1.2.4 desselben players.

### :warning: Wichtige Änderungen für Administratoren
Es wird nun docker-compose v2 verwendet! Docker-compose-standalone wird nicht mehr länger benötigt,
dafür das [compose plugin für docker](https://docs.docker.com/compose/install/linux/).

**Achtung**: Beim ersten hochfahren braucht der Datenbankcontainer wegen des MySQL-updates sehr lange. MySQL führt selbstständig eine Datenmigration durch. Brechen Sie diesen Vorgang keinesfalls ab, da sonst ihre Datenbank beschädigt wird. :warning:

### Performance
Diese Version ist vor allem ein großes Upgrade in Sachen Performance: Besonders heikle Flaschenhälse wurden beseitigt,
sodass Vorgänge wie das Laden eines Tests oder eines Arbeitsbereiches in der Admin-Ansicht
schneller und vor allem mit wesentlich (bis zu quadratisch) weniger Dateizugriffen auskommt.
Damit sollte die Anwendung mit **wesentlich** mehr gleichzeitigen Benutzern arbeiten
können. Vorangegangene Lasttests hatten eine Grenze bei etwa 5000 gleichzeitigen
Ladevorgängen festgestellt.

### Sicherheit
* Es wird eine aktuelle MySQL Version verwendet

## 13.3.1
### Neue Fetaures
* CustomTexts können jetzt (wieder) nicht nur Login-bezogen in der Testtakers.xml sondern auch Testheft bezogen in der Booklet-XML festgelegt werden.
* Die Verona-Schnittstelle wird jetzt auch in der Version 5 unterstützt

### Sicherheit
* "Secure Client Initated Renegotiation" nicht mehr möglich
* TLS 1.2 im Datenbank Container
* Neuste Traefik Version

### UI
* Kleinere Verbesserungen im Bereich SystemCheck
* Die Beschriftung "Überwachung starten" lässt sich nun ändern

## 13.2.2
### Bug Fixes
Zu große Antwort-Daten (durch GeoGebra erzeugt) führten zu Fehlern.

## 13.2.1
### UI
* Bestimmte Schaltflächen im Administrations-Interface bekamen angemessenere Beschriftungen.
* Die Eingabefelder (Login, Code-Eingabe, Freigabewort) mit denen SuS konfrontiert werden können, wurden deutlicher als Eingabefelder gestaltet, da SuS sie sonst von den SuS manchmal nicht als solche erkannt wurden.

## 13.2.0
### Performance
Diese Version enthält eine starke Optimierung der Test-/Arbeitsbereich-Auswahl, die nun sehr viel schneller läd und 
Serverzugriffe spart.

### Bug Fixes
Das update-script wurde repariert!

### Information for developers
#### API
* The Session endpoints `[GET] /session`, `[PUT] /session/person`, `[PUT] /session/login` and `[PUT] /session/admin` 
  return a new format containing not only the IDs, but also the labels and other useful stuff. 
  
  See: https://pages.cms.hu-berlin.de/iqb/testcenter/dist/api/index.html#tag/session-management/paths/~1session/get

  The old format is still delivered as well, but will be removed at some point in the future. 

* Some endpoints are no longer necessary and therefore got deprecated:
  - `[GET] /monitor/group/{group_id}`
  - `[GET] /workspace/{workspace_id}`
 

## 13.1.0
In dieser Version wurde der experimentelle Bereich "Anhang-Verwaltung" hinzugefügt. Da dieses Feature noch im
experimentellen Status ist, ist es zunächst versteckt und undokumentiert. Ein Update ist nur erforderlich, wenn es
genutzt werden soll; weitere nennenswerte Änderungen gibt es nicht. 

## 13.0.0
Für diese Testcenter-Version wurde die gesamte Grundarchitektur der Anwendung überarbeitet, um von jetzt an schneller
und einfacher weitere Verbesserungen und neue Funktionen liefern zu können.
Der Code dieses neuen Testcenters befindet sich unter [einer neuen URL](https://github.com/iqb-berlin/testcenter).

Daneben gibt es große Verbesserungen in folgenden Punkten
- Sicherheit: Aktualisierung auf aktuelle Pakete und Webserver-Komponenten.
- Stabilität: Durch Netzwerkfehler während der laufenden Testung fehlschlagende Aktionen (z. B. Antworten speichern)
  führen nicht mehr zu einer sofortigen Fehleranzeige, sondern können vorher bis zu dreimal erneut versucht werden.
- Kompatibilität: Das Testcenter akzeptiert nun die erweitere Unit-Definition wie sie aktuelle Versionen des IQB-Studios
  produzieren. Alle älteren Units und Player funktionieren weiterhin.

Das Release wird durch zahlreiche kleinere Verbesserungen und Bugfixes abgerundet, z. B.: 
- Zeitgesteuerte Blöcke: Zeit wird durch Pausierung nicht mehr zurückgesetzt, Weiterleitung nach Zeitablauf repariert.
- Verbesserungen in der UI, z. B. im Review-Dialog.
- Bestimmte, gelegentlich bem (Neu-)laden von Testungen auftretende Fehler beseitigt.
- Gelöschte logins, verblieben unter bestimmten Umständen im System; dies ist bereinigt.


### Information for Administrators
#### Migration from old version

1. Although update from previous version *should* be possible seamlessly this update contains a major architectural 
redesign and making a backup before the update __is strongly recommended__. 

2. Rename or remove old installation-dir. (eg `mv testcenter testcenter-backup`).

3. Download and run installer [as put in the readme](https://pages.cms.hu-berlin.de/iqb/testcenter/pages/installation-prod.html).
Use old `.env`-file als reference for DB-credentials and other settings.
__important__ use "t" for the salt settings, because older versions did not accept other salts.



## 13.0.0-rc.7
..


* The Ngnix-Config of the frontend-container is now available for custom edits under /config.

## API Changes
### XML Exchange Formats
* The unit.XML is vastly extended. No breaking changes. 




## Backend 12.4.2
* radically speed up initialization and tests and fix workspace loading issues

## Backend 12.4.1
* Update PHP from 7.4.22 to 7.4.29 (patch) and Apache to 2.4.53 

## Backend 12.4.0
### New Feature: so-called resource-packages. 
Uploaded zip files with the extension .itcr.zip - resource-packages - now get a special treatment:
  1. All files they contain are regarded as resources (Testtakers.xml and such would be handled as resources to).
  2. These files do NOT appear in the file list, not do the get validated
  3. Deleting the package causes all those files to be deleted.
This can be used for special resources which shall be loaded by the player via *directDowlaodURL*. But pay attention:
Those get neither preloaded like the rest of the booklet nor do they count into the size of the calculation of the test!
Example applications: GeoeGebra (needs to fetch 70+ files), or large videos which shall be streamed.
  
You can declare now dependencies of Units to some resource-files or -packages in the unit.xml to make the validator
aware of it:
```
  <Dependencies>
    <File>sample_resource_package.itcr.zip</File>
  </Dependencies>
```

### Bugfixes
* (#241) Fix a bug which occurred, when a Booklet was assigned to a Login with mode='monitor-group'.
* (#388) Fix various bugs in the context of the Zip-File Upload.


## 12.3.3
### Bugfixes
* (#239, #238) Fix file reading issues in initialization

## 12.3.0
### Bugfixes
* (#366) Fix: In live-mode the group-monitor didn't update when Testtakers.XMLs get updated or deleted.

### Result-Data / Group-Monitor 
* (#231) Logins of the same name (created with `hot-run-restart`-mode) get now a number into there display-name to be 
 distinguishable. In result/log-data export, this number is stored in the field `code`. 

## Backend 12.2.3
### Bugfixes
* Fix critical bug in communication between broadcasting-service and backend

## Backend 12.2.1
Set a maximum for filenames in workspace of 120 characters.

## Backend 12.2.2
* massive performance improvement by caching file information in the DB.

## Frontend 12.1.7
* (#385) Fix Bug: If testee is on the please-enter-code-screen and group-monitor moves him to the same block,
  it should become unlocked (but didn't).

## Frontend 2.1.6
* (#382) When "Finish Test" gets hit, NavigationRestrictions will be checked.

## Frontend 12.1.4
* Fix Navigation Bug from 12.1.3: When a testlet had a locking code, but was unlocked, the unit didn't get tested
  for force_presentation_complete/force_response_complete when leaving.

## Frontend 12.1.3
* Various Bugfixes:
* (#361) clock and messages in  demo-mode are broken
* (#373, #359, #376, #358, #374) could not leave unit behind codeword when navigationRestrictions
* (#379, #372) testee was required to enter codeword even when forced into block by monitor

## Frontend 12.1.2
* Fix Login on Safari

## Frontend 12.1.1
* Fix critical bug in debouncing responses between frontend and backend which led to dataloss in case of very fast
  navigation between units

## Frontend 12.1.0
* There are different login-button for admin-users and for testees now.

## Frontend 12.0.3
Various Bugfixes:
* (#341) When you visited a test in demo-mode as a monitor, and terminated it, you returned to the starter but didn't see the monitor-monitor button again. That got fixed.

## Backend 12.0.2
Fixes data-migration from versions before 12.0.0. With the update to version 12.0.0 the way, response-data is stored
changed. Data from existing units should be migrated, but that might fail in some installations. With this patch
12.0.2 this state will be repaired and the remaining data will get migrated.

## Frontend 12.0.2
Various Bugfixes:
* (#341) When you visited a test in demo-mode as a monitor, and terminated it, you returned to the starter but didn't see the monitor-monitor button again. That got fixed.
* (#340) After reload you return to the correct unit now
* (#335) Order of checks when leaving a unit is fixed: First check completeness, then ask for leaving the timed block
* (#347) Dont't check navigationLeaveRestrictions if unit is already time-locked.

Minor Changes
* In "demo" mode "showTimeLeft" is off now
* Use Font Roboto everywhere

## Backend 12.0.1
* Timeout for admin sessions was extended to 10h (from 30min)

### Bugfixes:
* Wrong numbers in Results overview
* Handle bogus Player-Metadata
 

## 12.0.0
This update makes the Tescenter Verona3- and 4 compatible.

### Endpoints
* the responses-output from `/workspace/{ws_id}/responses` and `/workspace/{ws_id}/report/response` 
  now contains the chunk names. eg: `{"all":"{\"key\": \"value\"}"` instead of `{\"key\": \"value\"}`
* new Endpoint `/{auth_token}/resource/{resource_name}` is an alternative way for fetching resources. It can be used as
  `directDownloadUrl`-parameter (see [here](https://verona-interfaces.github.io/player/#operation-publish-vopStartCommand))
  in Verona4-players. 
* Those deprecated endpoints are removed
  * `[GET] /workspace/{ws_id}/logs`
  * `[GET] /workspace/{ws_id}/reviews`
  * `[GET] /workspace/{ws_id}/responses`
  * `[GET] /workspace/{ws_id}/sys-check/reports`

### XSD
* in the `Booklet.xml`-format a new restriction is allowed: `<DenyNavigationOnIncomplete>`. It forbids the leaving of  
  units of a testlet under certain circumstances: if the unit was not presented oder responded completely. The attributes 
  `presentation` and `response` may have the values `OFF`, `ON` and `ALWAYS`. Always tells the testcenter, to check
  the completeness and response-progress everytime the unit shall be left regardless of teh direction. `ON` only checks
  if the testee want to proceed forwards.
* The `Booklet.xsd` now validates correctly that `<unit>`-id must only be unique if no alias is set and otherwise the
  alias must be unique.  

### Database
* The unit-data now gets stored in an additional table `test_data`, not in `tests` anymore to allow chunkwise updates. 
  There will be a data-migration, but depending on the specific format of the player it can be possible, that 
  previously edited units will not be restored correctly. 
* See `scripts/sql-schema/patches.mysql.d/12.0.0`.

## 11.6.0
This update refactors the CSV-output for various data: logs, reviews, test-results and sys-check-reports. 
The CSVs can now all be generated in the backend and retrieved via analogous endpoints. The data is also available 
as JSON. All CSVs contain BOMs now. 

### Endpoints
* The four new endpoints for retrieving reports: 
  * `[GET] /workspace/{ws_id}/report/log`
  * `[GET] /workspace/{ws_id}/report/review`
  * `[GET] /workspace/{ws_id}/report/response`
  * `[GET] /workspace/{ws_id}/report/sys-check`
* The old ones are now deprecated and will be removed soon:
  * `[GET] /workspace/{ws_id}/logs`
  * `[GET] /workspace/{ws_id}/reviews`
  * `[GET] /workspace/{ws_id}/responses`
  * `[GET] /workspace/{ws_id}/sys-check/reports`


## 11.5.0
Fixes some issues in the file-management.

## 11.2.0
Adds the missing second endpoint for the customization-module.
### Endpoints
* contains the new endpoint `[PATCH] /system/config/custom-texts`, which updates the key-value-store for the frontend analogous to customTexts.


## 11.1.0
This update provides the API for the customziation-module.   

### Endpoints
* contains the new endpoint `[PATCH] /system/config/app`, which updates the key-value-store for the frontend analogous to customTexts.
* `[GET] /system/config` provides the key-value store 'app-config' as well.
### Database
* See `scripts/sql-schema/patches.mysql.d/11.1.0`

## 11.0.0
This update contains various changes around the improved Group-Monitor.
### Endpoints
* A new endpoint `[GET] /system/time` was added to retrieve the server's time and time zone.
* A new endpoint where added: `/monitor/group/{group_name}/tests/unlock`
* A new endpoint was added: `[POST] /test/{test_id}/connection-lost`. It can be triggered by a closing browser as well
  as from the broadcasting-service to notify a lost connection to the testController. Note: This endpoint does not
  need any credentials.
### Database
* See `scripts/sql-schema/patches.mysql.d/11.0.0`

## 10.0.0
This update does not contain new functionality. It's about the init/install script, which can do database-migration from
older to newer versions by itself now. The version 10 indicates the beginning of an era with versioned database-schemas.
There is no manual patching necessary anymore after an update. So changes in the DB does not force a new major-version
anymore.

## 9.2.0
### XSD
* Additional elements and attributes needed by teststudio-lite where added. They have no affect for the testcenter at
the moment.

## 9.1.0
### Endpoints
* You can now insert an optional parameter `/alias/{alias}` in the end to obtain data if unit is defined with
an alias in the booklet. This is an HotFix for https://github.com/iqb-berlin/testcenter-frontend/issues/261.

## 9.0.0
The main content of this update is a complete refactoring of the (XML-)File-classes,
Workspace validation and XML-File-Handling. The main goal was to keep validity and
consistency of the workspaces. The refactoring shall also allow more and deeper validation
checks, update scripts and more in the future. The whole part of the software is now backed
with unit-tests galore.
### Requirements
* **PHP 7.4 is now required**
### Endpoints
* The `[GET] /workspace/{id}/validation` endpoint **was removed completely**.
  Validation takes now place on file upload and on `[GET] /workspace/{id}/files`.
* Return-Values and Status-Codes of `[POST] /workspace/{id}/file`
  and `[GET] /workspace/{id}/files` where changed **significantly** to contain the
  file's validation information as well as some metadata to display in the frontend.
### XML
* XML-files without a reference to a XSD-Schema generate a warning now. Currently, 
  the reference can only be done with the `noNamespaceSchemaLocation`-tag! 
* Player-Metadata as defined in [verona2](https://github.com/verona-interfaces/player/blob/master/api/playermetadata.md)
  is supported now.
### Config
* `config/system.json` contains a new (optional) value: `allowExternalXMLSchema` 
  (boolean, defaults to true) . It defines wether the program is allowed to fetch
  XSD schemas from external URLs.

## 8.0.0
The role `monitor-study` / `workspaceMonitor` was removed completely and all functions and endpoints depending on it.
### XML
* Mode `monitor-study` was removed from the `mode`-attribute
### Endpoints
* The following endpoints where removed
* `[PATCH] /{ws_id}/tests/unlock`
* `[PATCH] /{ws_id}/tests/lock`
* `[GET] /{ws_id}/status`
* `[GET] /{ws_id}/booklets/started`

## 7.4.0
### XML
* A new mode for logins is allowed now: `run-demo`

## 7.0.0
### Endpoints
* Log- and State-Endpoints
  * `[patch] \test\{test_id}\state`
  * `[put] \test\{test_id}\log`
  * `[patch] \test\{test_id}\unit\{unit_name}\state`
  * `[put] \test\{test_id}\unit\{unit_name}\log`  
    were changed:
  * They all take items in the form
  ```
  [
    {
       "key": __my_key__,
       "content": __my_content__,
       "timeStamp": 1234567891
    }
  ]
  ```
  * A state change automatically whites a log now.
* `Timestamp` parameter in various endpoints is now `timeStamp` to resemble the Verona 2 Standard

## 6.1.0
### Database
* You have to apply database structure changes,
  see `scripts/sql-schema/patches.mysql.sql`

## 6.0.0
* Hint: Sample Data/Player is still not supporting Verona 2.0 Interface,
  although compatible frontend version expect them!

## 5.0.3
### Config
* You have to manipulate the contents of `config/system.json`: You need now two parameters
  `broadcastServiceUriPush` and `broadcastServiceUriSubscribe` instead of just `broadcastServiceUri`.

## 4.0.0
Introduced the group-monitor for the frist time.
### XML
#### Testtakers
- `name`-attribute of `<group>`-element is now called `<id>`
- introduced optional attribute `label` for `<group>`-element
- in `<Metadata>`-element, only the optional `<Description>` field remains
#### Booklet
- changed defintion of `<Testlet>`-element to get rid of a warning,
  that `<Unit>` was not allowed in some legal constellations
- `id`-attribute is now mandatory for testlets
- `<Units>`-element can not contain `id` or `label` (since it won't be
  visible anywhere anyway), and first `<Restrictions>` can not contain
  `<CodeToEnter>`, which would not make any sense
- Made `<Restriction>` more readable: generic `parameter`-paremater is
  now renamed to `minutes` in context of `<TimeMax>` and to `code` for
  `<CodeToEnter>`-element.
- in `<Metadata>`-element, the elements `<ID>` and `<Label>` are mandatory,
  and `<Description>` is optional, the rest does not exist anymore.
#### SysCheck
- in `<Metadata>`-element, the elements `<ID>` and `<Label>` are mandatory,
  and `<Description>` is optional, the rest does not exist anymore.
#### Unit
- in `<Metadata>`-element, the elements `<ID>` and `<Label>` are mandatory,
  and `<Description>` is optional, the rest does not exist anymore.



