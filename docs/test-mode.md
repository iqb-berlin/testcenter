# Modes for test execution

For the test or the survey, all execution parameters are given by 
the XML definition files. But before the test starts in production (hot) mode, there is 
the need to evaluate the test content and configuration. Then, some restrictions of the 
test may make it really hard to evaluate. For example, it would take too much time if 
you have to wait for the completion of all audio sequences. One could adapt the 
test definition for the evaluation period, but this is dangerous: After evaluation, you 
will change the test definition again and then risk new errors.

Our system allows multiple modes to run the test. Every login carries a token that declares 
this mode. You can first review only the design of the units and its arrangement, 
then switch on some restrictions and store responses, and finally evaluate the 
test like a testtaker.   

* `DEMO` (default): Nur Ansicht (Demo)
* `MONITOR-GROUP`: Testgruppen-Monitor (Demo)
* `HOT`: Durchführung Test/Befragung
* `REVIEW`: Prüfdurchgang ohne Speichern
* `TRIAL`: Prüfdurchgang mit Speichern


|  | `DEMO` | `MONITOR-GROUP` | `HOT` | `REVIEW` | `TRIAL` | 
| :------------- | :-------------: | :-------------: | :-------------: | :-------------: | :-------------: |
|Es können Reviews abgegeben werden (Kommentare/Einschätzungen zur Unit bzw. zum Test)|  |  |  |X |  |
|Es werden Antworten und Logs gespeichert.|  |  |X |  |X |
|Alle Zeitbeschränkungen für Testabschnitte werden angewendet.|  |  |X |  |X |
|Alle Navigationsbeschränkungen des Booklets werden angewendet (z. B. erst weiter, wenn vollständig angezeigt).|  |  |X |  |X |
|Sollte ein Testabschnitt mit einem Freigabewort geschützt sein, wird dieses bei der Eingabebox schon eingetragen.|X |X |  |X |X |
|Sollte eine Maximalzeit für einen Testabschnitt festgelegt sein, wird die verbleibende Zeit angezeigt, auch wenn die Booklet-Konfiguration dies unterbindet.|  |X |  |X |  |
|Die Seite mit der Aufgaben-Übersicht wird erlaubt, auch wenn das Booklet dies unterbindet.|  |  |  |X |  |
|Kann aus dem Gruppen-Monitor aus gesteuert werden|  |  |X |  |  |
