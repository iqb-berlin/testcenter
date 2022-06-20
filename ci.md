# CI

## Events
* Push on Feature-Branch
  * Build
  * FE unit test
  * BS unit
  * BE unit
  * linting xyz
* Pull Request
  * Build
  * FE unit test
  * FE e2e test (cypress gegen mock)
  * BE unit
  * BE dredd
  * BE init-tests
  * BS unit
  * linting xyz
* Push on Master
  * alles testen (?)
  * docs generieren

----------------------------------------------------------------

* Tag
  * (keine tests noch mal)
  * kreiert produktive docker images
  * deployment auf test-server
  * (macht ein release?)

- Rc-Tag (rc1, rc2, rc3) -> nur ein spezieller Tag  

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





============================================================

Entwickeln mit Docker. Ja.

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




=================================================================

Workflow

A
- Versionsnummer + Docs werden im PR bereits hochgezogen
- Nachteil:
  -- Ein angenommener PR macht alle anderen direkt konfliktend
  -- Im PR sind 10000 docs Dateien immer mit drin

B
- Policy: Nach PR soll einmal das Tag-Script ausgeführt werden und VN hochgezogen etc.
- Nachteil:
  -- Wenn es nicht der Reviewer macht, weiß man evetl. gar nicht, welcher Typ (minor, patch etc.) das jetzt ist
  -- Extra-Commit immer nach dem merge

C
- Durch einen Marker in der CM wird klar, welcher Versionstyp folgen muss. Die CI commited die neue VN und Docs nach Merge von selber
- Nachteil:
  -- Fehleranfällig wegen dem Marker
  -- Extra-Commit immer nach dem merge
  -- wo soll der Marker hin?



Oder Tags? Geht das?

Sideshow-Branch
- Tag: "minor"

Pull-Request angenommen

==> Tag "minor" -> Master

[CI] Tag
-> wenn "minor"
--> ziehe VN hoch, generiere docs
--- delete tag "minor"
--- make tag neue VN

