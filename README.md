# IQB Testcenter

Diese Angular-Programmierung ist die serverseitige Web-Anwendung für das Online-Testen des IQB. Über diesen Weg 
wird die Programmierung allen Interessierten zur Verfügung gestellt. Eine Anleitung zum Installieren und Konfigurieren wird 
schrittweise an dieser Stelle folgen.

# Installation

1) Als erstes ist die Datenbankstruktur anzulegen. Dazu existieren zwei Create-Scripte, eines für MySQL, eines für PostgreSQL. 
2) Dann ist die Datei 'vo_code/DBConnectionData.json' so anzupassen, dass der PDO-Zugriff auf die Datenbank erfolgen kann.
3) Alle Dateien *.php und *.xsd auf den Server kopieren unter Beibehaltung der Ordner. 'tmp' und 'unused' kann ignoriert werden.
4) Auf dem Server den Ordner 'vo_data' anlegen.
5) .htaccess so anpassen, dass der Zugriff auf vo_* unterbunden wird (Sicherheitsaspekte): RedirectMatch 404 ^/vo_.*$
6) <serveradresse>/create aufrufen: Damit wird in der Datenbank ein Superuser angelegt (der kann dann die anderen User anlegen).
<br>or: run `sudo ---user=www-data scripts/initialize.php --user-name=super --user-password=user_password --workspace=workspace --test_login_name=a --test_login_password=another_pw`
to create a superuser, a workspace with some sample data and a test-login  
7) Build der Angular-Programmierungen testcenter-iqb-ng und testcenter-admin-iqb-ng (letzere in den Ordner /admin) übertragen.
  
# Testing

The following technology is / will be used in the development of this project:

![Browserstack logo](https://ocba2.iqb.hu-berlin.de/browserstack/logo-smaller.png)

