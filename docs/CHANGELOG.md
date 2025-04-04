---
layout: default
---
## [next]
### neue Features
* Beim (Neu-)Laden des Testcenters wird ein Banner angezeigt, der auf veraltete Versionen hinweist. Dieser soll die Testleitung im Fehlerfall bei der Kommunikation des Fehlers unterstützen.

### Verbesserung
* Testleitungskonsole: Die Testhefte werden sind nun in einem Akkordion-Element positioniert und können nach einem extra Klick angezeigt werden. Das räumt visuell das Starter-Menü auf und rückt den Fokus auf die eigentliche Funktionalität der Testleitungkonsole zurück.
* Links zu externen Seiten wurden gelöscht, um das Navigieren auf fremde Seiten zu vermeiden, während man sich in der PWA befindet.
* Der API Call 'system-config' zeigt nun auch die Liste der unterstützten Browser an. Diese Information kann von Konsumenten genutzt werden, um ihre eigene Logik für veraltete Browser darzustellen.

### Bugfix
* Werden in der Testtakers.xml die Werte für `validTo` geändert, dann wird dies nun sowohl auf der Login-Ebene, als auch auf der individuellen Session-Ebene angewandt. Es verhält sich nun wie erwartet.
* Die Häufigkeit mit der fälschlicherweise die gleichen Tests (Booklets) mehrmals pro Person angezeigt werden, ist minimiert worden.
* Auf der Starterseite wird nun immer der Text des customtext `login_subtitle` angezeigt. Vorher wurde immer der Subtitle der vorher besuchten Seite angezeigt.
* Modi mit dem Wert `forceTimeRestrictions=false` (RUN-DEMO, MONITOR-GROUP, MONITOR-STUDY, RUN-REVIEW, RUN-TRIAL, SYS-CHECK-LOGIN), sind nun korrekterweise nicht von Zeitbeschränkten Blöck in ihrer Navigation eingeschränkt.

## Custom Texts
* neue Felder
  * `gm_show_monitor` -> Titel für Monitorfunktion
  * `gm_show_test` -> Titel für Testüberprüfung
  * `login_subtitle` -> Titel für Starter-Seite
  * `login_unsupportedBrowserBanner` -> Inhalt für den Browser-Banner

## 16.0.2
### Bugfixes
* Testleitungskonsole: Dialog für das Festlegene einer neuen Restzeit für einen zeitgesteuerten Block erlaubt jetzt die manuelle Eingabe, damit die Funktion auf allen Geräten genutzt werden kann. Eine nicht valide Zahl (kleiner als 0, größer als Maximalzeit, keine Zahl) resultiert in keinem Sprung.
* Content Security Policy (CSP) wurde angepasst, um die Verwendung des Webworkers auf allen Browsern zu ermöglichen.
* Eingabefeld für Code ist nicht mehr Autocapitalize. Dies sollte die Eingabe von Codes auf mobilen Geräten erleichtern.

## 16.0.1
### Verbesserungen
* Testleiterkonsole ist beim ersten Aufruf immer nach der Spalte "Teilnehmer".
* Der ablaufende Timer wird nun mit einem Webworker im Browser umgesetzt. Sollte eine Testperson eine längere Zeit nicht den Fokus auf dem Testcenter-Tab haben, so läuft die Zeit nun unbeirrt weiter.
* Adminbereich: Die Gruppen im Tab "Ergebniss/Antworten" zeigen die einzigartige ID als Tooltip an, hilfreich wenn es das selbe Label mehrmals gibt
* Testleiterkonsole: Das Blocklabel zeigt nun die BlockId mit 'Block 1' an, statt nur '1' (wenn kein Label für den Block gesetzt wurde)
* Die Websocket Verbindung funktioniert nun auch weiterhin, nachdem der Broadcasting-Service neu gestartet wird.

## 16.0.0
### Kubernetes
* Die Helm Chart für das Deployment des Testcenters hat die Version 1.0.0 erreicht und stellt damit eine erste stabile Version des Deployments auf Kubernetes dar.

### Deployment-Hinweis
* Das Testcenter kann auf dem Hostsystem nur noch unter dem in der .env Datei angegebenen `HOSTNAME` und der subdomain www.`HOSTNAME` aufgerufen werden. Dies mach andere Subdomainen frei für das Hosten von zukünftigen Tools wie z.B. Grafana.

### Bugfix
* (Testleiterkonsole) Bei Öffnen eines zeitgesteuerten Blocks und Neuvergabe einer Zeit werden nun auch mehrstellige Zahlen richtigerweise erfasst.
* In einem Randfall flossen die Logs einer Unit in die der nächsten ein (rein additiv und nicht Datenzerstörend). Dies ist behoben.
* In der Testleitungskonsole wird beim Aktivieren des 'Alle-auswählen' Toggles nun auch immer ALLE (inkl. noch nicht angemeldete) Testpersonen ausgewählt, zu sehen an der farblichen Markierung.
* 'Test beenden' durch die Testleitungskonsole überstimmt die Booklet Einstellung `<TimeMax leave="forbidden">` und führt zum sofortigen Testabbruch.

### Verbesserungen
* Das Updateverhalten im Docker-Deployment wurde sowohl in den Logs als auch in der Arbeitsweise verbessert, was in Zukunft umfangreichere Migrationsskripte erlauben wird.
* Die Testleitungskonsole trackt zuverlässiger die aktuelle Unit der einzelnen Testpersonen.
* Befehle zum Test beenden

## 15.6.0
### Verbesserungen
* Unterschiedliche Custom Texts wurden aufeinander abgestimmt, sodass das Ändern eines Labels auch andere Stellen beeinflusst, die das gleiche Label tragen sollten
* Die e2e Tests laufen nun schneller und sind verständlicher geschrieben 

### Bugfix
* `ARROWS_ONLY` innerhalb der Booklet Konfigurationen verhält sich nun wie erwartet
* Zeitgesteuerte Blöcke werden in Demo- und ähnlichen Modi wieder nicht mehr gesperrt, wie es sein soll.
* Navigation in der Verzweigung funktionierte nicht korrekt in Kombination mit der Freigabewort-Beschränkung, wenn das
  Freigabewort in einer höheren Schachtelungstiefe als den optionalen Testlets gesetzt wurde.
* Verzweigung funktioniert mit Codierschemata, auch wenn Variablen umbenannt worden sind. 
* Text im Feld von `<codeToEnter>` (Booklet.XML) wird bei der Codeeingabe angezeigt, wenn gegeben.

## 15.5.0
### neue Features
* Unit.XML: <BaseVariables> -> <Variable> vom `type` 'json' und 'no-value' können beim Upload gelesen werden

### Verbesserungen
* Wenn die Testleiterkonsole ein SuS über die `Springe zu BLOCK` Funktion in einen zeitgesteuerten Block schiebt, der bereits geschlossen war, so wird dies in den Logs nun mit einem zusätzlichen Hinweis `(closed timeblock reopened)` versehen
* Beim Springen in einen zeitgesperrten Block muss nun auch die neue Restzeit festgelegt werden, die alle SuS bekommen. Der höchstmögliche Wert richtet sich dabei nach der höchsten eingestellten `timeMax` aller in der Selektion ausgesuchten SuS.
* Die Testleitungskonsole zeigt nun direkt beim betreten in einen zeitbeschränkten Block dessen aktiven Status an, statt erst nach 15 Sekunden
* Der Text im `Springe zu` Button in der Testleitungskonsole zeigt nun den Text an, der im Customtext `Spalte: Block (gm_col_blockLabel)` angelegt ist
* Änderungen an der Navigation in der Testleitungskonsole:
  * Mehrere Klicks auf denselben Block in der `Vollständig` und `Nur Blöcke` hat nun folgendes Verhalten
    * 1 Klick - Nur der Block wird ausgesucht
    * 2 Klicks - Alle Blöcke von derselben Art werden ausgesucht
    * 3 Klicks - Die bisherige Auswahl wird aufgehoben
  * Deselektierung aller Blöcke passiert nicht mehr mit einem Klick auf einen beliebigen Punkt in der angezeigten Tabelle
  * Das Auswählen aller Blöcke bei einem einmaligen Klick sollte nun viel weniger auftreten
* Die Buttons des Dialogfelds, das erscheint bevor man einen Block zu sperrenden Block verlässt, wurden farblich und textlich verändert, sodass der Default Button nun die Aktion 'Auf der Seite bleiben' darstellt.
 
### Bugfix
* Sobald ein Arbeitsplatz im Adminbereich mehr als 1000 Dateien beinhaltet, werden die kumulativen Dateigrößen nicht mehr berechnet, um das Einfrieren des Browsers zu verhindern. Ein Hinweis im Frontend weist darauf hin, dass die Berechnung nicht stattgefunden hat.

### Accessibility
* Die Buttons im Starter-Menü sind nun mit der Tab Taste navigierbar

## 16.0.0-alpha
### Kubernetes
* Erste kubernetes-Deployment via Helm möglich. Im Github Release kann das Installationsskript `helm-install-tc.sh` genutzt werden, um die Helm Charts im Kubernetes-Cluster zu installieren.
  * Vorasussetzungen:
    * Ein Kubernetes-Cluster
    * Zugriff via `kubectl` auf den Cluster
    * Helm 3

## 15.4.0
### neue Features
* Adaptive Testen, Bonusaufgaben und Filterführung
  * Verschiedenste Szenarien von Verzweigungen oder optionalen Aufgaben in Booklets sind nun möglich:
    Siehe: https://iqb-berlin.github.io/tba-info/Testcenter/Adaptives_Testen/
  * Varianten verschiedener des desselben Booklets sind nun möglich in dem Ver
    (z. B. mit und ohne Befragung, mit Anleitung für Tablet oder mit Anleitung für PC)
    Siehe: https://iqb-berlin.github.io/tba-info/Testcenter/Adaptives_Testen/#konfiguration-in-der-testtaker-xml
  * Filtern nach Bestimmten Bookletzuständen im Gruppenmonitor ist nun möglich.
* "Forward only" Modus:
  * Booklet-Parameter `unit_navibuttons` hat nun die Option `FORWARD_ONLY`, so das nur der Vorwortknopf gezeigt wird.
  * Neue Restriction `<LockafterLeaving>` erlaubt das automatische (und endgültige sperren) nach Verlassen der Unit,
    um sicherzustellen, dass in einem Szenario, in dem nur vorwärtsgegangen werden darf, auch nicht über die Address-
    zeile, die Browsernavigation, das Seitenmenü oder andere Weise zurücknavigiert werden kann.

### Verbesserungen
* Entlastung des Servers durch deutliche Reduktion von redundanten Calls.
* Überarbeiteter Testcontroller reduziert fehlerhafte und seltsame Zustände im Fall von sehr langsamen oder
  sehr schnellen Vorgängen im laufenden Test.
* Es werden viel mehr Datentypen abseits von `text/html` durch den File-Service komprimiert. Dadurch wird das Laden 
  vieler Dateitypen nun schneller.  
* Für eine bessere Lesbarkeit und intuitivere Konfiguration wird die Ordnerstruktur der Installation geändert. Diese
  wurden bereits in Version 15.3.4 eingeführt und werden nun weiter ausgebaut.
* Gruppen-Monitor:
  * Ein bereits gesperrtes Testlet wird nun wieder entsperrt, wenn der Gruppen-Monitor einen Teilnehmer dorthin
    navigiert. Handelt es sich um einen zeitgesteuertes Testlet, beginnt die Zeit wieder von vorn. In diesem Fall muss 
    die Bewegung vom Testleiter bestätigt werden.  
  * Neue custom texts: 'gm_control_goto_unlock_blocks_confirm_headline' und 'gm_control_goto_unlock_blocks_confirm_text'
  * Kommandos vom Gruppen-Monitor erscheinen nun im Testlog. Dies dient vor allem der Nachvollziehbarkeit der
    Ereignisse, wenn zum Beispiel ein bereits geschlossener zeitgesteuerter Block wieder geöffnet wurde.
  * Wird der "Springe zu"-Knopf im Gruppenmonitor verwendet, wird die Auswahl der Testteilnehmer nicht mehr für den 
    folgenden Block beibehalten. Dieses Verhalten kann durch eine neue Einstellung in der Testtakers.xml im Gruppen-
    Monitor-Profil ausgewählt werden `autoselectNextBlock="no"`.
  * Diverse visuelle Verbesserungen

### Bugfix
* Das Starten eines neuen Booklets wurde nicht automatisch auf GM angezeigt, sondern der Browser musste neu geladen
  werden.
* Beim Einloggen über URL eines Gruppen-Monitors mit nur einem Booklet wurde dieses Booklet automatisch gestartet, statt
  dass der Monitor erreicht wird.
* Beim Hochladen einer Testtakers-Datei, die Logins oder Gruppen-Ids verwendet, die bereits auf einem anderen Workspace
  vergeben sind, werden die bereits bestehenden Logins und Workspace korrekt in der Fehlermeldung benannt.
* Wurde eine Testtaker-Datei erneut hochgeladen, in der eine Gruppen-Id zu einem bestehenden Login verändert wurde, 
  konnte dieser login sich nicht mehr einloggen. Nun wird die Gruppe-Id bestehender Logins aktualisiert.
* Seitenzahl im Studienmonitor wird korrekt angezeigt.
* Beim Wegspeichern von Antworten und Unit-States wird der TimeStamp der Erhebung beachtet, nicht die Reihenfolge
  in der die Daten beim Server ankommen. Dies konnte bei verzögertem netzwerk u. U. zu geringfügigen Datenverlust
  führen.
* Durch extrem schnelle Beenden und Erneutes starten eines Tests war es möglich, Restriktionen zu umgehen.
* Im Systemcheck XML: Das Attribut `required` wird nun korrekt ausgewertet, wenn es auf `false` gesetzt ist. Vorher 
  wurde die Existenz des Attributs als `true` interpretiert.
* Unit-XML Validierung: Wird beim `from` Attribut eine Unit-ID einer nicht einzigartigen Unit angegeben, die mehrfach 
  genutzt wird, so ist dies richtigerweise ein Fehler. Dieser Fehler wird nun bereits während der Validierung beim 
  Hochladen angezeigt, und nicht erst beim Abspielen der Unit. Referenzierungen in geschachtelten Bedingungen werden 
  nun auch besser validiert.

## 15.3.4
### bugfixes
* Fixes in installer und updater script

## 15.3.0

### neue Features
* Workspace-Admins können nun ihr eigenes Passwort ändern. Dies ist im Startmenü nach dem Login möglich. Bei Neusetzen
  des Passwortes wird man automatisch ausgeloggt, um das neue Passwort direkt zu testen.
* Wenn der Super-Admin einen neuen Workspace-Admin einrichtet oder sein Passwort ändert, dann muss dieser Workspace-
  Admin sich beim erstmaligen Einloggen ein neues Passwort geben. Dieser Aufruf tritt bei jeder Rücksetzung durch den
  Super-Admin erneut auf.

### Verbesserungen
* Wenn ein Passwort geändert wird, sei es über den Super-Admin oder über den eigenen Workspace-Admin, dann wird das  
  Passwort zur Sicherheit ein weiteres Mal abgefragt. Dies soll Fehler beim Schreiben des neuen Passworts verhindern.
* Im Super-Admin wird über eine kleine Snackbar über das erfolgreiche Ändern des Passwortes informiert.
* Neue Version des Verona Simple Player 6.0.2 in den Sampledata hinterlegt.

### Bugfixes
* Automatisches Senden von Fehlerberichten funktioniert wieder. (Es muss dazu vom Administrator der Testcenter-Instanz
  eingerichtet worden sein.)
* Ein 'sys-check-login' Login kann genutzt werden, um mehrere Sessions gleichzeititig zu starten. Mehrere Geräte können 
  sich mit einem gemeinsamen Systemcheck Login einloggen.
* Der Netzwerktest innerhalb des Systemchecks wird beim Verlassen des Systemchecks zurückgesetzt und startet automatisch
  beim Wiedereintritt neu.
* Je nachdem, ob man eingeloggt oder uneingeloggt den Systemcheck betritt, wird man beim Neuladen der Website auf die
  entsprechende Startpage für (Un-)Eingeloggte weitergeleitet.
  
### API Changes
* `GET /workspace/{ws_id}/report/response` gibt nun auch `originalUnitId` aus
* `DELETE /workspace/{ws_id}/sys-check/reports`:
  * gibt bei 200 immer ein Array mit [deleted, did_not_exist, not_allowed, was_used] aus
* `GET /session` 
  * gibt unter dem Admintoken nun `id: int|null` aus
  * gibt unter dem Admintoken nun `pwSetByAdmin: boolean|null` aus
* `PATCH /user/{user_id}/password` kann nun als Super-Admin oder Workspace-Admin (unter Vorbehalt, dass die zu ändernde
  `{user_id}` übereinstimmt mit der user_id des Request Tokens) aufgerufen werden


## 15.3.0-alpha3
### neue Features
* Die Navigation des SystemChecks wurde überarbeitet.
  * Wenn SysChecks über den "sys-check-login" Modus durchgeführt werden, werden die Login Name und Passwort genutzt, um
    das Senden der SystemCheck-Berichte zu authorisieren. In diesen Szenarien fallen das Eingeben von Report-Passwort 
    und Schul-ID aus.
  * "sys-check-login" Logins können auch mit Passwort geschützt werden
  * Die Anmeldung im Syscheck über die URL/<loginname> ist möglich, wenn kein Passwort gesetzt ist
  * Die Antworten, die in den SysChecks gegeben werden, sind nun auch Teil der SystemCheck-Berichte
* Konfigurierbare Testleitungskonsole und Filter nach Sitzungen:
  * schnelles Filtern nach Person
  * Eigene Filter können definiert werden
  * Layout und Filter können in Profiles für Gruppen-Monitor-Accounst vorbelegt werden 

### Bugfixes
* Wenn man sich über einen Link einloggt, wird nun richtigerweise direkt in den Test/SystemCheck weitergeleitet, sofern
  das Login nur einen UnitBlock (Booklet) enthält bzw. nur ein SystemCheck im Workspace liegt.

### Sicherheit
* Accountsperre bei mehr als fünf falschen Passworteingaben für Adminaccounts und Monitorlogins.
* Zusätzliche TLS cipher suites und Strict Server Name Indication aktiviert


## 15.2.0
### neue Features
* Überarbeitetes neues Format für Reviews:
  * Alle Reviewdateien beinhalten zusätzlich eine Spalte (CSV) / Feld (JSON) mit dem ursprünglichen Unitnamen, für
    den Fall, dass dieser in der Spalte UnitName durch dessen Alias ersetzt wurde.
  * Beim Erstellen eines Kommentars kann man jetzt auch die Seite angeben, auf die sich der Kommentar bezieht und ist
    damit eine weitere Stufe granularer als die Unitebene.
  * Die Werte in den Spalten/Feldern sind R-lesbarer: : gegen _ erstezt, X gegen TRUE ersetzt.
  * Autor und Kommentareintrag sind nun zwei verschiedene Spalten.
  * Die Datei beinhaltet auch Informationen zum User-Agent, sprich Browserinformationen, des Autors von Kommentaren.
  * Das neue Format lsässt sich durch einen zusätzlichen Parameter im Endpunkt bzw. einen neuen Knopf in der GUI
    erzeugen. Das alte ist (noch) ebenfalls verfügbar.

* Workspace-Dateiübersicht:
  * Mit einem Klick auf eine Datei werden nun alle abhängigen Dateien gekennzeichnet. 
    Damit lässt sich feststellen, welche Dateien vorher bzw. zeitgleich gelöscht werden müssen, um eine Datei 
    erfolgreich zu löschen ohne den 'Löschen' Button erst clicken zu müssen wird.
  * Die Dateien werden schneller angezeigt, da bestimmte Angaben, zum Beispiel die Gesamtgröße eines Booklets erst
    später berechnet werden.
  
* Neuer Modus: `sys-check-login`
  * SysChecks sind nun erst verfügbar, wenn man sich eingeloggt hat in diesem Modus.
  * Rückwärtskompatibilität: Gibt es in der gesamten Instanz keinen Login in diesem Modus, so stehen alle SysChecks
    wie gehabt auf der Startseite ohne login bereit.

### Bugfix
* Wenn es zum Timeout kam, wurde die Sperrung des Workspaces während des Uploads wurde nicht mehr korrekt aufgehoben.   

### Verbesserungen
* Nach dem Speichern eines SysCheck-Berichts wird ein deutliches Feedback gegeben, dass der Bericht gespeichert wurde. 
* Die Uploadgeschwindigkeit für einzelne Dateien im Workspace-Admin wurde erheblich verbessert.
* Systemstart radikal beschleunigt, indem nur veränderte Workspaces neu eingelesen werden.

### Deployment
* dpgk, welches aus nicht-Debian Versionen fehlt, wird für den updater nicht mehr benötigt.
* Es wurden weitere Umgebungsvariablen eingeführt. Diese lauten "OVERWRITE_INSTALLATION", "SKIP_READ_FILES", "SKIP_DB_INTEGRITY" und "NO_SAMPLE_DATA". 
  Der default Wert all dieser Variablen ist "no". Wenn einer der Variablen auf "yes" gesetzt wird so werden zusätzliche Parameter beim Initialisieren 
  des Backends mitgegeben. Diese Umgebungsvariablen können nur manuell gesetzt werden und die einzelnen Parameter sind im .env File genauer beschrieben.
* Das benötigte PHP memory_limit für den Datei-Upload im Workspace-Admin wurde verringert, da dieser nun effizienter arbeitet.

### Development
* make Befehle für Unit Tests können nun mit einem 'target' Argument aufgerufen werden, um gezielt nur bestimmte Tests auszuführen.
* make backend-refresh-autoload baut nun den BE Container neu auf, um sicherzustellen, dass alle Klassen geladen werden können.
* mixed type können als Argumente in CLI print-functions gegeben werden.
* Während Initialization-Tests werden Fake-Patches angelegt. Diese werden nun nach erfolgreichen Abschluss der Tests
    wieder gelöscht. Damit können Initialization Tests mehrmals hintereinander gestartet werden.

## 15.1.8
### Bugfix
* Fehlermeldung nach Anlegen eines neuen Users entfernt (Endpunkt liefert userID zurück nicht Namen)

## 15.1.7
### neue Features
* Logins mit der Rolle "monitor-study" haben eine neue Ansicht bekommen. Solche Accounts können von ihrer Startseite nun 
  alle bisher abgegeben Antworten und Ergebnisse von gestarteten Tests innerhalb ihres zugeordneten Workspace sehen. 
  Die Ansicht entspricht der Ergebnisse/Antworten Ansicht eines Super-Admins, ohne jedoch die Rechte zu haben, die 
  Ergebnisse zu downloaden oder zu löschen. Die Ansicht aktualisiert sich alle 10 Sekunden.  

### Sicherheit
* Im Response-Body aller Fehlermeldungen werden HTML-Zeichen maskiert. Damit sollten alle Reflected Cross-Site 
  Scripting Attacken, die aus der Anzeige von unsicheren HTML-Tags entstehen, verhindert werden.
* Eine 0.5s Verzögerung wurde für den Login eines Super Admin eingeführt. Dies ist eine Maßnahme gegen Brute-Force-
  Attacken. Es folgen später weitere Maßnahmen, um auch DOS von verteilten Netzwerken zu verhindern.
* Unsichere TLS-Cipher-Suites entfernt

### Bugfix
* SQL error beim Angabe eines falschen Dateipfades beim Löschen von Dateien wurde behoben. Es wird nun richtigerweise 
  auf den falschen Pfad innerhalb eines 207 response hingewiesen.

### API
* `[PUT] /workspace` gibt bei einem StatusCode 200 auch die angelegte Workspace-Id zurück. `[PUT] /user` gibt analog dazu die 
  userId zurück.

### Administration
* Es existiert nun eine neue Umgebungsvariable 'DOCKERHUB_PROXY' die gesetzt werden kann, falls die Docker Images über einen 
  Proxy geladen werden. Der Standardwert ist ein leerer String.
* Der automatische Neustart abgestürzter Container lässt sich nun mitteln .env-Vriable einstellen (Restart Policy). 

## 15.1.6
### neue Features
* Booklet-XML: Die Zeitbeschränkung erhält einen neuen Schalter `leave`.
  * `<TimeMax minutes="1" leave="forbidden" />` führt dazu, dass vor Ablauf der Zeit *gar nicht* aus dem Testlet
    heraus navigiert werden kann.
  * `<TimeMax minutes="1" leave="confirm" />` führt zu dem gleichen Verhalten wie vorher, wie auch 
    `<TimeMax minutes="1" />`, nämlich das vor Verlassen (und Sperrung) eine Sicherheitsabfrage erfolgt.

### Verbesserungen
* Customtext hinzugefügt für das Label für den Weiter-Button, bei gesperrten units.
* Die verfügbaren Booklets im Starter werden nun in der Reihenfolge angezeigt, in der sie in der Testtakers-XML stehen.

### XML-Austauschformate
* Unit-XML: Element `<ValuePositionLabels>` wird in der Varaiblenliste akzeptiert, so wie es die aktuellen Versionen
  vom IQB-Studio liefern. 

## 15.1.5
### Bugfixes
* Alte Verona3-Player, die nicht standardmäßig `StateReportPolicy` auf `eager` gesetzt haben, funktionieren nun wieder
  korrekt. Dies betrifft z. B. den Aspect-Player.
* Seitennavigation repariert. Es wird der korrekte Index verwendet und Unterstützung für alle Player hergestellt.
* Kann keine Websocket-Verbindung etabliert werden, wird wieder korrekt auf Polling umgeschaltet.
* Um gleichzeitige Uploads auf den gleichen Arbeitsbereich zu verhindern, wird ein Workspace für die Dauer des Uplaods
  für Upload (und löschen) gesperrt. In bestimmten Fehlersituationen wird diese Sperre nicht korrekt aufgehoben und der
  Arbeitsbereich bleibt gesperrt. Sperren, die älter als zwölf Minuten sind, werden in Zukunft ignoriert.

### Verbesserungen
* Limits für Arbeitsspeicher und Ausführungszeit beim Datei-Upload wurden vorübergehend sehr hoch angesetzt, da Aufgrund
  eines Programmierfehlers sehr viel benötigt wird. Dies ist ein vorübergehender Fix um den Upload gewaltiger
  Datei-Mengen auf einmal zu ermöglichen (eine aktuelle Studie verwendet 3500 verschiedene Testhefte). Eine tatsächliche
  Behebung des enormen Speicherbedarfs beim Uplaod wird folgen.

### Deployment
* Es existiert eine neue Umgebungsvariable (RESTART_POLICY) mit der man die Neustart-Richtlinien aller Docker-Container setzen kann. 
  Der Default-Wert ist 'no'. Erlaubte Werte sind: ['no','on-failure','always','unless-stopped'].


## 15.1.4
### Bugfixes
* Fehler der in ganz neuen (123+) Chrome-based Browsern auftritt behoben: Wenn man in das Eingabefeld für Namen oder
  Passwort in der Login-Maske klickte, und es waren bereits im Browser Zugangsdaten gespeichert,
  kam eine Fehlermeldung (#479, #481).
* Bestimmte Bookletstrukturen führten zu Navigationsproblemen: Wurde die Intro- oder Outro-Units weggelassen (d. h.
  Units am Anfang bzw. Ende des Booklets die nicht Teil eines Testlets sind), und zeitgesteuerte Blöcke verwendet,
  konnte nach Sperrung der Blöcke zu keiner einzigen Unit mehr navigiert werden, was zu einem verwirrenden Zustand und
  Fehlermeldungen führte, wenn man den test neu öffnete. Dies ist nun behoben.
* Globale (d.h. in der Systemverwaltung gesetzte CustomTexts) werden jetzt (wieder) direkt übernommen, ohne, dass die
  Seite neugeladen werden muss (#482)
  

## 15.1.3
### Bugfixes
* kritischer Bug gefixed: Es können wieder Dataien hochgeladen und Workspaces angelegt werden.

## 15.1.2
### Bugfixes
* `run-simluation` - das unit-menu kann wie im hot-modus ausgeblendet werden.

## 15.1.1
### Bugfixes
* Das Testcenter lässt sich wieder auf anderen als den Standardports laufen.

## 15.1.0
:warning: Für ein **Update** ist zwingend [die aktuelle update.sh](https://github.com/iqb-berlin/testcenter/releases/download/15.1.0/update.sh) zu nutzen.

### Verbesserungen
* Login: Passwortfeld zeigt Warnung an, wenn die Feststelltaste aktiviert ist. Das verhindert unbemerkte Falscheingaben.

### Bugfixes
* Wurde man vom Gruppenmonitor in einen Zeitbeschränkten Block verschoben, in dem man sich bereits befand, so wurde
  dieser beendet und gesperrt. Dies ist behoben. (#447)
* Ist ein Fehler vor dem Starten des Testes aufgetreten, konnte der Test nicht mehr gestartet werden und der Browser hat
  sich im zum Teil sogar aufgehangen. Behoben! (#459)
* System-Check: Seitennavigationsleiste repariert
* Login: Bei fehlgeschlagenem Anmeldeversuch werden nicht mehr Teile des Passworts in der Serverantwort angezeigt
* Browserwarning auf der Startseite: Fehlfunktionen behoben.

### Neue Features
* Auf besonderen Wunsch wurden die Restriktionen für Login-Namen gelockert. Es sind nun beliebige Zeichenketten erlaubt.
* Es gibt einen neuen Modus der Durchführung für das Interaktives Übungsmodul: `run-simulation`. Sämtliche Restriktionen
  werden hier angewendet, aber keine Antwortdaten gespeichert. (#454)

### Verbesserungen
* Im run-trial Modus werden nun sowohl Responses und Logs aufgezeichnet als auch die Möglichkeit gegeben,
  ein Review durchzuführen.
* Browserwarning auf der Startseite: Bei Browser-Versionen, die neuer sind als dem System bekannt, wird nicht mehr
  gewarnt. Dies ist zwar fragwürdig, aber der Tatsache zuschulden, dass aktuell nicht regelmäßig genug neue
  Testcenterversionen herausgebracht werden können.

### Sicherheit
* Upgrade auf neuste PHP-Version 8.3.0
* referrer-policy Hinzugefügt
* Backend-Container läuft nicht mehr als root

### Administration
* Sollte der HOSTNAME auf dem das System betrieben wird mit einer www-Subdomain beginnen, so wird automatisch auf die
  Hauptdomain weitergeleitet und das www ignoriert.

## 15.0.1
### Bugfixes
* Die Settings-Seite kann wieder verwendet werden, um die Anwendung zu konfigurieren. (#433)

## 15.0.0
### Performance
* Die Dateiauslieferung beim Laden von Tests läuft nun mittels einem gesonderten Service. Damit kann die
  Auslieferungszeit mindestens verdoppelt werden und der Server wird deutlich entlastet.
* Zusätzlich können auszuliefernde Dateien im Arbeitsspeicher des Servers gecached werden.
* Es wurde ein Puffer für wegzuspeichernde Unit-States eingeführt. Damit kann ein Testcenter-Server während der
  Durchführung entlastet werden.
* Das Backend allgemein wurde performanter und ressourcen-sparender gemacht, indem der selbst implementierte
  Autoloader entfernt und mit dem deutlich effizienteren Autoloader von composer ersetzt wurde.
* Beim ersten Start eines Tests werden keine bisher gespeicherten Antwortdaten abgefragt, da keine existieren können
  und somit Calls ans Backend gespart.

### Neue Features
* In der Übersicht der Arbeitsbereiche für den Super-Admin wird nun das letzte Änderungsdatum angezeigt, um
  die Verwaltung zu erleichtern.
* Error-Reports: Es kann nun im Administrationsbereich ein GitHub-Repositorium angegeben werden, an das Fehlerberichte
  im Fehlerfall gesendet werden können, damit Bugs in Zukunft besser repariert werden können.
* [Experimentell] Testdurchführung optional im Vollbild, steuerbar mit den Booklet-Parametern `ask_for_fullscreen`
  und `show_fullscreen_button`.

### Sicherheit
* Komponenten Aktualisiert: PHP, Angular, Angular-Material, Typescript.
* Es wird eine Warnung bei nicht unterstützten Browsern auf der Startseite angezeigt.

### Verbesserungen
* Das Verhalten im Fehlerfall wurde komplett überarbeitet, um sinnvollere Nachrichten und Optionen anzubieten.
* In der Übersicht "Ergebnisse/Antworten" stehen nun die Labels der Gruppen anstatt der internen IDs.
* Wird ein nicht unterstützter Browser verwendet, so wird dies direkt auf der Startseite angezeigt.
* Es können keine Dateien gelöscht oder hochgeladen werden, wenn auf demselben Arbeitsbereich bereits ein Lösch- oder
  Uploadvorgang läuft. Damit wird verhindert, dass konkurrierende Aktionen sich gegenseitig stören.

### Bugfixes
* Log-Daten: Seitenwechel bei mehrseitigen Aufgaben werden wieder gelogt.

# Changelog & Upgrade Information

## 14.14.0
### Bugfixes
* Schwerer Bug im Session-Management entfernt: Wenn sich ein Gruppen-Monitor anmeldete, wurden alle Sessions von anderen
  Mitgliedern dieser Gruppe plötzlich ungültig.
* CustomTexts aus SysCheck.XMLs werden wieder angezeigt.

### Verbesserungen
* Der Dialog "Bericht Senden" im Systemcheck ist weiter durch die neuen Customtexts ´syscheck_report_aboutPassword´ und
  ´syscheck_report_aboutReportId´ konfigurierbar.
* Das Passwort im Passwortfeld im Dialog "Bericht Senden" im Systemcheck kann nun sichtbar gemacht werden.

## 14.13.0
### Verbesserungen
* Platzhalter für ID-Eingabefeld vor dem Senden des Berichts ist (via CustomTexts) anpassbar. Standardwert wurde von
  "Titel" zu "Schul-ID" geändert.

## 14.12.0
### Verbesserungen
* Überarbeitete Navigationsleiste
* Die Vorwärts- und Zurück-Tasten bleiben jetzt immer neben der eigentlichen Unit-Knöpfen
* Größenreduktion der Unit-Knöpfe, sodass mehr davon vorhanden sein können bevor in die nächste Zeile umgebrochen wird
* Deaktivierte Unit-Knöpfe haben ein helleres Grau

## 14.11.0
### Bugfixes
* Das Verhalten von Version 14.1.0 und vorher der Navigationsleiste wurde wieder hergestellt:
  Sie wird nun wieder mehrzeilig angezeigt, wenn zu viele Units darin sind.
  Dies kann bei sehr vielen Units oder auf einem schmalen Screen dazu führen, dass das die Navigationsleiste über
  die Unit ragt. Es wird empfohlen, bei Testheften mit vielen Aufgaben auf die Navigationsleiste zu verzichten und
  nur die Vorwärts-/Rückwärts-Pfeile anzuzeigen (`unit_navibuttons` auf `ARROWS_ONLY`).
  Stattdessen sollte das Navigationsmenü in der Sidebar angeboten werden (`unit_menu` auf `FULL`).
* Kritischer Fehler der Update-Routine von 14.3.0 zu 14.4.0 behoben.
* Startkommando `make run` repariert.
* Sicherheitsrelevante Header von Backend und Broadcasting-Service werden nun korrekt ausgeliefert*

### Für Administratoren
* die Konfigurationsdatei hieß mal ssl-config.yml, mal tls-config.yml. Nun muss sie immer tls-config.yml heißen.


## 14.10.0
### XML-Austausch-Formate
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
