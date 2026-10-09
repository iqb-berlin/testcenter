# Konfiguration für die Produktionsumgebung

Einstellungen können in der Datei `.env.prod` angepasst werden.
Prüfen Sie nach jedem Update der Testcenter-Version, ob neue Konfigurationen zur Datei `.env.prod-template` hinzugefügt wurden, und ziehen Sie in Betracht, diese in Ihre `.env.prod`-Datei zu übernehmen.

## TLS

TLS-Zertifikate können manuell oder über einen ACME-Anbieter wie „Let’s Encrypt“ oder „Sectigo“ verwaltet werden.
Wenn Sie sich für einen ACME-Anbieter entscheiden, fragt der Installationsprozess alle notwendigen Konfigurationsdaten ab, füllt die `.env`-Datei aus und erstellt zusätzliche Konfigurationsdateien.
Bei manueller Verwaltung muss das TLS-Zertifikat `certificate.pem` und der private TLS-Schlüssel `private_key.pem` heißen; beide müssen im Ordner _/secrets/traefik/certs_ abgelegt werden.
Werden keine Zertifikate konfiguriert, werden selbstsignierte Zertifikate generiert und verwendet. Dies kann zu einer Browser-Warnung führen.

## Datenbank

Die Datenbank läuft als Container innerhalb des anwendungseigenen Netzwerks und wird nicht nach außen (auf dem Host) freigegeben. Sie wird über drei Einstellungen in der `.env.prod` konfiguriert:

```
DB_DATABASE=iqb_tba_testcenter
DB_USER=iqb_tba_db_user
DB_PASSWORD=<wird während der Installation generiert>
```

Die Installation generiert das Passwort zufällig. Host und Port sind nicht konfigurierbar: Das Backend erreicht die Datenbank immer unter `db` auf Port 5432. Die `POSTGRES_*`-Variablen, die das Datenbank-Image erwartet, werden aus den drei obigen Einstellungen abgeleitet. Setzen Sie diese nicht selbst.

`DB_PASSWORD` wird nur angewendet, während die Datenbank beim allerersten Start erstellt wird. Eine spätere Änderung in der `.env.prod` ändert das Passwort in der bestehenden Datenbank nicht, sodass sich das Backend nicht mehr anmelden kann. Ändern Sie es an beiden Stellen:

```
make testcenter-connect-db
```
```
ALTER USER iqb_tba_db_user WITH PASSWORD 'neues passwort';
```

Setzen Sie danach denselben Wert in der `.env.prod` und starten Sie die Anwendung mit `make testcenter-restart` neu.

`make testcenter-connect-db` öffnet eine `psql`-Eingabeaufforderung im Datenbank-Container für diese und jede andere Datenbankaufgabe. Dies funktioniert unabhängig vom Inhalt von `DB_PASSWORD`, da Verbindungen aus dem Inneren des Containers kein Passwort benötigen.

## Cache-Dienst

Der Cache-Dienst ist ein Redis-Container (`cache-server`) innerhalb des anwendungseigenen Netzwerks. Er dient drei Zwecken:

- Der Dateiserver prüft jeden Download von Testressourcen gegen die Gruppen-Token, die das Backend dort speichert.
- Anmeldungen in den Modi `monitor-group` und `monitor-study` werden nach 5 fehlgeschlagenen Anmeldeversuchen gesperrt, bis 30 Minuten seit dem letzten fehlgeschlagenen Versuch vergangen sind. Das Backend zählt die Versuche im Cache-Dienst.
- Bei `REDIS_CACHE_FILES=true` hält der Dateiserver dort auch ganze Dateien bereit.

Er wird in der `.env.prod` konfiguriert:

```
REDIS_PASSWORD=<wird während der Installation generiert>
REDIS_MEMORY_MAX=1gb
REDIS_CACHE_FILES=false
```

Host und Port sind nicht konfigurierbar: Das Backend und der Dateiserver erreichen den Cache-Dienst immer als `cache-server` auf Port 6379.

Der Dateiserver kann mit `FILE_SERVER_ENABLED=false` ausgeschaltet werden. Das Backend liefert Testressourcen dann selbst aus. Nur in diesem Fall kann das Backend ohne den Cache-Dienst laufen, indem `REDIS_PASSWORD` leer gelassen wird. Fehlgeschlagene Anmeldeversuche werden dann nicht gezählt.
