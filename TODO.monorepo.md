# TODO
CI
[x] CI einrichten (siehe CI.md)
[-] Browserstack -> huaning
[?] CI: benutzt anscheinend eine alte docker-compose version
[x] CI: mehrere Artefakte gleichzeitig funktionieren nicht
[-] eigenen Runner für Projekt

Install Script
[x] Ports auswählen (setup #22)
[R] update.sh mit neuen releases klarkommen -> 1maliges ausführen Skript
[x] Soll das install script generisch bleiben oder zum Projekt ziehen?


Ordner Struktur
[ ] docker-compose in eigenes Verzeichnis
[ ] docker Kram in den Unterprojekten ebenfalls
[ ] Ordnerstruktur / Docker/compose files überdenken: Ordner test & script zusammenfassen? (weil sie beide den runner verwenden)
[ ] sqlite Datei in Testordner überführen

Docker
[-] port 80 loswerden (https://madewithlove.com/blog/software-engineering/get-rid-of-ports-in-your-docker-development-setup-with-traefik/)
[x] docker repository ist nicht von außen erreichbar -> reagieren? -> Dockerfile beilegen


Misc
[x] SimplePlayer beilegen, statt runterladen
[ ] Besseren namen für dredd-tests finden und einsetzen -> api-test
[-] XML dokumentationen erzeugen
[x] Hardcode BROADCAST_SERVICE_URI_SUBSCRIBE
[x] $TESTUSER_NAME don't have to be env
[-] Do something with dredd-report
[x] node_modules / npm workspaces struktur evaluieren 
[P] ua-parser hack raus FE docker
[x] package-lock.json?
[P] funktoniert das Rollback überhaupt bei den SQl-patches?
[x] next.sql als anonyme neue version (wenn die neue versionsnummer noch nicht feststeht)
[ ] Tickets zusammenführen

Cypress
[x] Letzten Stand besorgen
[x] Gegen Testdaten testen (nicht auf Ursprungszustand verlassen)
[x] CSS-Selektoren überarbeiten
[x] Ordner- und Dateinamen
[x] watch e2e-tests also with docker

Frontend
[R] FileSaver selber schreiben - in Typescript (includes Ordner weg)
[P] dependencies entschlacken
[ ] angular 14
[ ] enable "strictNullChecks": true, is tsconfig
[ ] node 16
[ ] fe css-warnings (flex)
[x] fe/cypress -> huaning branch (https://github.com/iqb-berlin/testcenter-frontend/tree/e2e/cypress)
[-] fe/breakpoints
[P] warum zwei ua-parser dependencies
[P] polyfill raus (auch aus NPM)
[ ] apache statt nginx! (Frontend Nginx: add_header Cache-Control no-store;)

Broadcasting_Service
[ ] enable "strictNullChecks": true, is tsconfig
[R] node 16
[R] nest update


Backend
[P] salt konfigurierbar
[x] Config-Folder persistieren?
[x] PHP 8.1 -> im extra branch; lieber erst NACH dem resync mit dem alten Repo reinziehen?
[R] CORS?
[P] BE container shall stop when initialize fails


Docs
[ ] Installation local


