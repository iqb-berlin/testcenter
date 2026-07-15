---
layout: default
---

# Modus der Testdurchführung

Das Testcenter ermöglicht die Durchführung des Tests in verschiedenen Modi.
Für jede Anmeldung wird ein Modus festgelegt. Jeder Modus verfügt über spezifische Eigenschaften. Nachfolgend sind diese Eigenschaften aufgeführt.
### Verfügbare Modi

* `RUN-DEMO` (default): Nur Ansicht (Demo)
* `MONITOR-GROUP`: Testgruppen-Monitor (Demo)
* `MONITOR-STUDY`: Studien-Monitor (Demo)
* `RUN-HOT-RETURN`: Durchführung Test/Befragung
* `RUN-HOT-RESTART`: Durchführung Test/Befragung
* `RUN-REVIEW`: Prüfdurchgang ohne Speichern
* `RUN-TRIAL`: Prüfdurchgang mit Speichern und Reviewfunktionalität
* `RUN-SIMULATION`: Prüfdurchgang ohne Speichern, ohne Reviewfunktionalität aber mit Beschränkungen
* `SYS-CHECK-LOGIN`: Dieser Modus versteckt für alle anderen Logins den System Check. Der Check kann dann nur noch von Logins durchgeführt werden mit diesem Mode

### Merkmale der Modi im Vergleich

| Merkmal / Option |  `RUN-DEMO` | `MONITOR-GROUP` | `MONITOR-STUDY` | `RUN-HOT-RETURN` | `RUN-HOT-RESTART` | `RUN-REVIEW` | `RUN-TRIAL` | `RUN-SIMULATION` | `SYS-CHECK-LOGIN` |
| :--- |  :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Bie jedem Einloggen wird ein neuer Teilnehmer angelegt |   |  |  |  | ✅ |  |  |  |  |
| Es können Reviews abgegeben werden (Kommentare/Einschätzungen zur Unit bzw. zum Test) |   |  |  |  |  | ✅ | ✅ |  |  |
| Es werden Antworten und Logs gespeichert. |   |  |  | ✅ | ✅ |  | ✅ |  |  |
| Alle Zeitbeschränkungen für Testabschnitte werden angewendet. |   |  |  | ✅ | ✅ |  |  | ✅ |  |
| Alle Navigationsbeschränkungen des Booklets werden angewendet (z. B. erst weiter, wenn vollständig angezeigt). |   |  |  | ✅ | ✅ |  |  | ✅ |  |
| Kann im Gruppen-Monitor beobachtet werden |   |  |  | ✅ | ✅ |  | ✅ |  |  |
| Sollte ein Testabschnitt mit einem Freigabewort geschützt sein, wird dieses bei der Eingabebox schon eingetragen. |  ✅ | ✅ | ✅ |  |  | ✅ | ✅ |  |  |
| Sollte eine Maximalzeit für einen Testabschnitt festgelegt sein, wird die verbleibende Zeit angezeigt, auch wenn die Booklet-Konfiguration dies unterbindet. |   |  |  |  |  | ✅ | ✅ |  |  |
| Die Seite mit der Aufgaben-Übersicht wird erlaubt, auch wenn das Booklet dies unterbindet. |   |  |  |  |  | ✅ | ✅ |  |  |
| Kann aus dem Gruppen-Monitor aus gesteuert werden |   |  |  | ✅ | ✅ |  |  |  |  |
| In adaptiven Booklets kann der Pfad selbst gewählt werden und hängt nicht von den Antworten ab. |  ✅ | ✅ | ✅ |  |  | ✅ | ✅ |  |  |
