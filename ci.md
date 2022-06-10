# CI

## Events
* Push on Branch
* Pull Request
* Push on Master
* Tag + Release
* Tag (Beta)

## Schritte
* Build
* FE unit test
* FE e2e test (cypress gegen mock)
* BE unit
* BE dredd
* BE init-tests
* BS unit
* linting xyz
* docs generieren

==================================================

Entwickeln mit Docker

[PRO]
- keine lokalen Abhängigkeiten (außer docker, docker-compose, bash)
  -- apache
  -- mySql
  -- node/npm
  -- chrome
  -- php + Erweiterungen + xDebug
- Ein Kommando und alles läuft (wenn man keinen lokalen server auf port 80 laufen hat xD)
- CI benutzt die selben kommandos wie lokal 

[CONTRA]
- lokalen apache muss konfiguriert werden
- IDE Features laufen einfacher (code coverage)
- komplizierte Einrichtung
 -- IDE Zugriff auf packages
 -- Dateirechte 
- Geschwindigkeit (overhead)
- CI muss docker in docker






