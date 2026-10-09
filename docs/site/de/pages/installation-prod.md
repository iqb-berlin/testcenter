# Installation für die Produktion

Diese Installation lädt vorgefertigte Docker-Images herunter und verwendet sie. Docker Compose wird genutzt, um die Images zu verwalten und Netzwerk, Datenspeicherung usw. einzurichten.

## Voraussetzungen

### Benötigte Software
- [Docker](https://docs.docker.com/engine/install/ubuntu/#installation-methods)
- [Docker Compose](https://docs.docker.com/compose/install/other/#on-linux)

### Optionale Software

- [Make](https://www.gnu.org/software/make/)

Make-Skripte werden verwendet, um die Anwendung zu steuern. Dies kann auch manuell erfolgen.

## Installation

- Herunterladen des Installationsskripts einer Veröffentlichung (Release)
  (hier die [aktuellste Version](https://github.com/iqb-berlin/testcenter/releases/latest))

- Ausführung des Skripts:
```
bash install.sh
```

## Datenbank-Setup

Datenbankschema einrichten:
```
make testcenter-init
```
Nur einmal vor dem ersten Start notwendig. `make testcenter-update` führt dies automatisch als Teil eines Updates aus.
Der Befehl kann problemlos wiederholt werden: Es werden nur fehlende Elemente angewendet. Da er auch die Workspace-Dateien einliest, ist dies auch der Weg, wie die Anwendung Dateien erkennt, die manuell in das Daten-Volume abgelegt wurden.

## Starten & Beenden

Anwendung im Hintergrund ausführen:
```
make testcenter-up
```

Anwendung mit Log-Informationen im Vordergrund ausführen:
```
make testcenter-up-fg
```

Anwendung beenden:
```
make testcenter-stop
```

Log-Ausgabe anzeigen:
```
make testcenter-logs
```

## Aktualisierung

Um eine Installation auf die neueste Version zu aktualisieren, folgendes im Installationsverzeichnis ausführen:
```
make testcenter-update
```

## Sicherung und Wiederherstellung

Eine Installation speichert ihren Zustand an zwei Orten: der **Datenbank** (Konten, Logins, Testergebnisse) und den **Datendateien** (Units, Booklets, Testteilnehmer-Dateien, Ressourcen). Ein Backup ist nur dann verwendbar, wenn beide Teile aus dem gleichen Zeitpunkt stammen. Es wird daher empfohlen, beide zu sichern.

```
make testcenter-backup
```

Damit wird ein zeitlich markierter Backup-Satz in das Installationsverzeichnis geschrieben, z. B.:

```
backup/2026-09-08T10-42-00Z/
├── iqb_tba_testcenter.sql   # die Datenbank
├── backend_vol.tar.gz       # die Datendateien
└── manifest                 # Version, Datenbankeinstellungen, Prüfsummen beider Artefakte
```

Die Anwendung kann während der Erstellung eines Backups weiterlaufen.
Um einen Backup-Satz wiederherzustellen, muss der Bezeichner des Datensatzes angegeben werden:

```
make testcenter-restore BACKUP=backup/2026-09-08T10-42-00Z
make testcenter-up
```

Die Wiederherstellung prüft zunächst das Manifest und bricht ab, wenn ein Artefakt beschädigt oder fehlend ist oder wenn der Satz mit einem anderen `DB_DATABASE` oder `DB_USER` erstellt wurde als die Installation konfiguriert ist – eine solche Wiederherstellung würde nicht die ursprüngliche Installation erzeugen. Danach wird die Anwendung angehalten, beide Teile ersetzt und die Anwendung im angehaltenen Zustand belassen. Es muss dann erneut gestartet werden. Eine Wiederherstellung **ersetzt** die Datendateien: Alles, was nicht im Backup enthalten ist, ist danach verschwunden.

`make testcenter-update` erstellt vor einer Änderung automatisch einen eigenen Backup-Satz, der mit demselben Befehl wiederhergestellt werden kann.

#### Notfallwiederherstellung auf einer neuen Maschine

1. Installieren derselben Version, mit der der Backup-Satz erstellt wurde (die Version ist im Manifest vermerkt; die Wiederherstellung warnt, falls sie nicht übereinstimmt).
2. `DB_DATABASE`, `DB_USER` und `PASSWORD_SALT` aus der alten `.env.prod` in die neue übernehmen. Die ersten beiden sind im Manifest vermerkt, sodass die Wiederherstellung mitteilt, falls sie nicht übereinstimmen; die dritte Variable ist es nicht (siehe unten für die Folgen beim Fehlen). `DB_PASSWORD` gehört **nicht** dazu: Dieses kann neu gewählt werden, solange es vor dem ersten Start der Datenbank gesetzt wird.
3. Kopieren des Backups in das `backup`-Verzeichnis der neuen Installation.
4. `make testcenter-restore BACKUP=backup/<set>` ausführen und dann `make testcenter-up`.

#### Was ein Backup-Satz nicht enthält

Die letzte Konfiguration – `.env.prod`, `config/` und `secrets/` – ist kein Teil eines Backup-Satzes, sodass ein Satz keine Geheimnisse enthält und überall gespeichert werden kann. Eine Kopie der Konfiguration sollte separat aufbewahrt werden. Ohne sie kann eine neue Installation nicht unter dem gleichen Hostnamen und TLS-Zertifikaten erreicht werden. Zudem müssen drei Werte aus `.env.prod` mit dem Satz übereinstimmen, damit eine Wiederherstellung die ursprüngliche Installation erzeugt:

- `DB_DATABASE` und `DB_USER` sind im Manifest vermerkt. `make testcenter-restore` bricht vor einer Änderung ab, wenn einer davon abweicht. Beide können auch aus dem Dump selbst ausgelesen werden, falls die alte `.env.prod` nicht mehr existiert: der Datenbankname aus der Zeile `CREATE DATABASE`, der Benutzername aus den Zeilen `OWNER TO`.
- `PASSWORD_SALT` kann nicht aus einem Backup-Satz wiederhergestellt werden – nur ein Fingerabdruck (z. B. ein Hash) davon ist vermerkt. Das ist ausreichend und erzeugt bei der Wiederherstellung eine Warnung, dass er abweicht. Testdaten, Workspaces und Testteilnehmer-Logins sind von der Abweichung nicht betroffen, aber Administrator-Konten schon. Ihre gespeicherten Passwörter gehören zum anderen Salt, und niemand kann sich anmelden.

In diesem letzten Fall ist das alte Salt nicht für die Wiederherstellung nötig. Einem Systemadministrator muss ein neues Passwort unter dem Salt, das die Installation jetzt hat, zugewiesen und dieses dann verwendet werden, um die verbleibenden Konten im Webinterface zurückzusetzen:

```
docker compose --env-file .env.prod --file docker-compose.yml --file docker-compose.prod.yml \
  run --rm --no-deps --entrypoint php backend \
  -r 'echo password_hash(hash_hmac("sha256", "NEW_PASSWORD", getenv("PASSWORD_SALT")), PASSWORD_BCRYPT, ["cost" => 10]), "\n";'
```

Der angezeigte Hash muss dann in das Konto eingetragen werden mit `make testcenter-connect-db`:

```
UPDATE users SET password = '<hash>' WHERE name = 'super';
```

#### Wiederherstellung nur eines Teils

`testcenter-dump-db`, `testcenter-restore-db`, `testcenter-export-backend-vol` und `testcenter-import-backend-vol` arbeiten jeweils an einem einzelnen Teil, standardmäßig in `backup/temp`, und akzeptieren das Argument `BACKUP=` wie die oben genannten Befehle. Zu beachten ist, dass eine Datenbank und Datendateien aus unterschiedlichen Zeitpunkten nicht zusammenpassen: Workspaces, deren Inhalt fehlt, bleiben leer, und die Anwendung gibt dies beim Start aus.

### Anmeldung

Nach der Installation sind zwei Logins vorbereitet:

- Benutzername `super` und Passwort `user123` als Admin-Benutzer

- Benutzername `test` und Passwort `user123` sowie Code `xxx` als Test-Teilnehmer

**Es wird dringend empfohlen, zumindest das Passwort unter „System-Admin“ zu ändern.**
