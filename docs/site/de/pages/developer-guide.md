# Entwicklerhandbuch

Vor dem Erzeugen eines Pull-Requests (PR) sollte der **Mitwirkungsleitfaden** gelesen werden.

## Anwendungsstruktur

Der Quellcode und damit die Anwendung sind in drei Submodule unterteilt:

* Frontend: Angular-basierte Komponenten, die als Single-Page-Anwendung in den Browser geladen werden.

* Backend: PHP-basierte Komponenten, die die meisten Anfragen des Frontends bearbeiten und die Verbindung zur Datenbank herstellen.

* Broadcaster: Zusätzliche Serverkomponente, die Websocket-Verbindungen zwischen Frontend und Backend ermöglicht.

## Debugging

Xdebug ist in den Dev-Container integriert. Um Xdebug zu nutzen, sind folgende Schritte notwendig:

• Browser-Erweiterung: Es wird eine Erweiterung benötigt (wie die genannte Xdebug-ext), um Debugging-Sitzungen per Klick im Browser zu starten.
• IDE-Schlüssel (IDE Key): In den Einstellungen der Browser-Erweiterung muss als Kennung IDEA hinterlegt werden, damit die Verbindung zur JetBrains-Entwicklungsumgebung korrekt zugeordnet wird.
• Funktionsweise: Nach diesen Schritten kommuniziert der Webbrowser direkt mit IntelliJ IDEA, sodass Haltepunkte (Breakpoints) gesetzt und Code Schritt für Schritt untersucht werden kann.

## Code Richtlinien

Siehe **Stil-Leitfaden**.

## Dokumentation

Wie diese Dokumentation erstellt wird und wie man sie lokal ausführt, ist in
[docs/README.md](https://github.com/iqb-berlin/testcenter/blob/master/docs/README.md) beschrieben.
