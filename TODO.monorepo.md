# TODO
CI
[ ] CI einrichten (siehe CI.md)
[ ] Browserstack -> huaning
[ ] CI: benutzt anscheinend eine alte docker-compose version
[ ] CI: mehrere Artefakte gleichzeitig funktionieren nicht


install script
[ ] Ports auswählen (setup #22)
[ ] mit neuen releases klarkommen


Docker
[ ] docker-compose in eigenes Verzeichnis
[ ] docker kram in den Unterprojekten ebenfalls
[ ] port 80 loswerden (https://madewithlove.com/blog/software-engineering/get-rid-of-ports-in-your-docker-development-setup-with-traefik/)


Misc
[ ] SimplePlayer beilegen, statt runterladen
[ ] Besseren namen für dredd finden und einsetzen
[ ] XML dokumentationen erzeugen
[ ] hardcode BROADCAST_SERVICE_URI_SUBSCRIBE
[ ] $SUPERUSER_NAME don't have to be env
[ ] do something with dredd-report
[ ] Ordner test & script zusammenfassen? (weil sie beide den runner verwenden)


Cypress
[ ] Letzten Stand besorgen
[ ] Gegen Testdaten testen (nicht auf Ursprungszustand verlassen)
[ ] CSS-Selektoren überarbeiten
[ ] Ordner- und Dateinamen


Frontend
[ ] FileSaver selber schreiben - in Typescript (includes Ordner weg)
[ ] angular 14
[ ] enable "strictNullChecks": true, is tsconfig
[ ] node 16
[ ] fe css-warnings (flex)
[ ] fe/cyprus -> huaning branch (https://github.com/iqb-berlin/testcenter-frontend/tree/e2e/cypress)
[ ] fe/breakpoints
[ ] watch e2e-tests also with docker


Broadcasting_Service
[ ] enable "strictNullChecks": true, is tsconfig
[ ] node 16
[ ] nest updated


Database
[ ] sqlite Datei in Testordner überführen


Backend
[ ] salt konfigurierbar
[ ] Config-Folder persistieren?
[ ] PHP 8.1 -> im extra branch
[ ] CORS?
[ ] BE container shall stop when initialize fails