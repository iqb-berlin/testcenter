# Installation für die Entwicklung

Diese Installationsmethode bietet mehr Optionen, um auf Daten und Logs zuzugreifen,
Einstellungen detaillierter zu ändern, Fehler zu finden und sogar Code an deine Bedürfnisse anzupassen.

Technisch gesehen wird der gesamte Quellcode ausgecheckt und die Anwendungsmodule werden gebaut, wie es Entwickler tun.
Das gesamte Angular-Entwicklungsframework wird mit allen Werkzeugen installiert.
Der Build-Prozess enthält alle Unit- und E2E-Tests, die wir vorbereitet haben.

Es sollte bestimmte Vorkenntnisse bestehen:

* Versionsverwaltung (Git)
* Unix Bash und Dateibearbeitung
* Umgang mit Docker

## Voraussetzungen

* [Docker 20](https://docs.docker.com/engine/install/ubuntu/#installation-methods) und [Docker-Compose-Plugin](https://docs.docker.com/compose/install/linux/) installieren 
* Make 4.3 installieren.

**Obwohl alle folgenden Schritte auch in einer anderen Betriebssystemumgebung möglich wären,
gehen wir hier von einem Unix/Linux-System aus.**

## 1. Installieren

Klone dieses Repository.

## 2. Konfigurieren

`make init`

> :Warnung: Dies erstellt Konfigurationsdateien mit Werten, die nur für Entwicklungszwecke gedacht sind.
> Für die Produktionsumgebung müssen die Dateien angepasst werden.

Die wichtigsten Konfigurationsdateien sind:

* `.env.dev` – Diese Datei enthält sensible Informationen zum Datenbankzugriff und Benutzer-Logins.

* `frontend/src/environments/environment.ts` – Hier werden Informationen über den Backend-Zugriff für die Frontend-Komponente gespeichert.

In der generierten Datei `.env.dev` muss eine wichtige Einstellung vorgenommen werden.
In der ersten Zeile muss die Variable _HOSTNAME_ auf die IP oder den Hostnamen der Maschine gesetzt werden,
unter der sie erreichbar ist, falls `localhost` nicht funktioniert.

`make init-backend`

Installiert das Datenbankschema, wendet neue Patches an und liest das data-dir – den Dev-Stack.

## 3. Ausführen

`make build`

Bauen aller Images des Projekts oder ein bestimmtes als Dev-Images.
Optional: Baue nur einen bestimmten Service, z. B. `service=backend`

`make up`

Starten der Anwendung (d. h. erstellen und starten aller Anwendungscontainer).
Optional: Start nur eines bestimmten Service, z. B. `service=backend`

**Hinweis: Zuvor sollte der lokale Webserver beendet werden, um Port 80 freizugeben**

# 4. Aktualisieren

`git pull`

Aktualisiere das lokale Repository.

`make build`

Erneutes Bauen.

# Anmeldung

Nach der Installation sind zwei Logins vorbereitet:

- Benutzername `super` und Passwort `user123` als Admin-Benutzer

- Benutzername `test` und Passwort `user123` sowie Code `xxx` als Test-Teilnehmer
