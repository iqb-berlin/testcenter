# Lasttest

## Vorüberlegungen

### Ziel

Bei der technischen Vorbereitung einer Lernstandserhebung muss abgeschätzt werden, wie viele Schülerinnen und Schüler mit einer bestimmten Software-/Hardwarekonstellation, ggf. verteilt über Tage oder Wochen, den fraglichen Test absolvieren können. Diese Abschätzung führt dann in Folge zu Entscheidungen auf institutioneller (welche Abteilungen/Firmen müssen eingebunden werden?), finanzieller (Server kosten Geld!) und administrativer Ebene (wie groß kann/muss das Zeitfenster sein?). Es müssen Verträge geschlossen werden, Schulen frühzeitig informiert und Serversysteme installiert und konfiguriert werden.

Unter einem Lasttest versteht man die Belastbarkeit auf der Serverseite. Klar muss hierbei sein, dass die Verbindungsqualität sowie die Infrastruktur in der Schule sowie die Leistungsfähigkeit der Endgeräte ausgeblendet werden. Ein Lasttest muss also hier die Belastbarkeit einer Testcenter-Installation aus Sicht der Verantwortlichen einer Lernstandserhebung ermitteln. Da es keine Standard-Lernstandserhebung gibt, muss ein Lasttest stets konkret bezogen auf die Datenmenge eines bestimmten Leistungstests bzw. einer Befragung sein. Außerdem dienen Lasttests der Verbesserung der Programmierung, denn Performance und Stabilität sind Qualitätsmerkmale einer Software. Hier müssen dann verschiedene Szenarien vorgesehen werden.

### Beschreibung des Ladeverhaltens

Die kritische Phase bei einer Lernstandserhebung mit dem Testcenter ist das Laden der Testinhalte. Um Verzögerungen während des Testablaufs zu verhindern (dies würde die Vergleichbarkeit der Ergebnisse gefährden), müssen die Testinhalte (auch Bilder, Audio-/Videosequenzen) geladen werden, bevor der Testperson etwas präsentiert wird. Das Testcenter kann jedoch auch so konfiguriert werden, dass die ersten Seiten angezeigt werden können, nachdem der erste Block geladen wurde (lazy loading). Diese Ladestrategie muss jedoch mit Bedacht gewählt werden: Es muss genügend Zeit im ersten Block zugebracht werden, damit das Betreten des nächsten Blockes nicht verzögert wird.

Alle Testinhalte sollen also zu Beginn vom Server geladen werden. Vorher muss noch eine Anmeldung am Testsystem erfolgreich sein, damit das richtige Testheft zugewiesen wird und die Antworten der richtigen Person zugeordnet werden. Nach dem Ladevorgang präsentiert der Browser nacheinander die Aufgaben, wobei die Antworten bzw. der Status der Bearbeitung sofort an den Server geschickt werden. Mit Blick auf den Lasttest stellt jedoch die Phase der Bearbeitung und des Speicherns der Antworten einen relativ geringen Anteil an der Belastung des Servers dar. Im Vergleich zum anfänglichen Laden sind das sehr kleine Datenpakete. Für einen Lasttest wird also die anfängliche Ladephase simuliert: Aufruf der Startseite, Eingeben der Login-Daten, Laden der Testinhalte.

Die Testinhalte bestehen aus mehreren Dateien. Technisch ist jedoch sichergestellt, dass pro Testperson nur eine Datei gleichzeitig abgerufen wird - Inhalte werden also nacheinander und nicht parallel abgerufen. Dieses serielle Laden verhindert, dass wenige Testpersonen viele parallele Ladevorgänge auslösen und früh alles geladen haben, andere Testpersonen jedoch durch die Begrenzung der Netzverbindungen keine Ladevorgänge auslösen können und sehr lange auf die Testinhalte warten.

### Indikatoren

Die Serverkapazität wird zum Schluss über die Anzahl von Testpersonen ausgedrückt, die gleichzeitig einen Test starten und nach einer zumutbaren Wartezeit mit der Beantwortung beginnen können. Es gibt also zwei relevante und miteinander verbundene Indikatoren: **Anzahl Testpersonen** und **Ladezeit**. Je mehr Testpersonen einen Test starten, desto größer ist die Ladezeit. Das bedeutet praktisch, dass für mehrere Testpersonen-Szenarien (500, 1.000, 2.000 usw.) die Ladezeiten ermittelt werden und dann in der Gegenüberstellung bewertet wird, bei welcher Anzahl der Testpersonen die Ladezeit noch akzeptabel ist.

Ein Lasttest weist üblicherweise außerdem die **Fehlerrate** aus. Mit steigender Last erhöht sich der Anteil der gescheiterten Datei-Abrufe. Wenn der Server überlastet ist, lehnt er weitere Verbindungen ab. Die Programmierung des Testcenters versucht die Verbindungsaufnahme mehrfach (5 Wiederholungen mit progressiver Verzögerung), und ein Fehler wird erst dann an die Testperson gemeldet, wenn alle Versuche fehlgeschlagen sind. Dann kann die Testperson ggf. nach einer Pause mit einem Neuladen der Webseite den Ladevorgang neu anstoßen. Als Fehler gilt hier, wenn alle 5 Ladeversuche gescheitert sind und die Testperson eine Fehlermeldung bekommt.

Nach der Ermittlung der Werte für viele Testpersonen werden diese dann über den Median zu einem Wert zusammengefasst. Der Median eignet sich besser als der Mittelwert, weil die Wirkung extremer Messwerte (Ausreißer) abgeschwächt wird.

### Methodik des Lasttests

### Warum reicht nicht ein Standard-Test für Webserver?

Man könnte annehmen, dass es sich beim IQB-Testcenter um eine Webseite handelt und einen üblichen Lasttest beauftragen. Auch hier wird berichtet, wieviele Personen gleichzeitig Zugriff haben können. Aus folgenden Gründen sind Standard-Tests jedoch problematisch:

* Das Besucherverhalten wird als lose, teilweise zufällige Abfolge von Navigationsentscheidungen simuliert. Seiten werden oft vollständig geladen, manchmal wird aber auch das Laden abgebrochen durch eine andere Navigation. Das ist beim Testcenter eigenen Lasttest nicht der Fall.
* Es wird pro Besucher zugelassen, dass mehrere Ladevorgänge parallel angestoßen werden (eine Webseite hat üblicherweise mehrere Elemente wie z. B. Bilder). Wenn dies passiert, belastet ein Besucher den Server mehrfach. Das dieses Verhalten beim Testcenter nicht vorgesehen ist, wird durch dieses Testverhalten die Kapazität des Testcenters systematisch unterschätzt.
* Es wird ein praktisch unendlich aktiver Besucher simuliert. Dadurch kann nicht ermittelt werden, wann ein Testheft geladen wurde. Weiterhin behindert eine einmal gestartete Testperson folgende Teilnehmer - es gibt keine Entlastung nach der Ladephase zugunsten anderer Testpersonen. Dadurch wird die Kapazität des Testcenters systematisch unterschätzt und es fehlt die wichtige Information über die Ladezeit.

### Eigenprogrammierung

Leider sind die verfügbaren Open Source-Systeme zum Bauen eines Lasttests (z. B. Locust, Tsung) stets auf den oben beschriebenen Standardfall ausgerichtet. Es sind viele Zufallsfaktoren eingebaut, sodass sich ein streng serielles Laden kaum realisieren lässt. Das IQB verwendet daher eine eigene Programmierung für Lasttests, die die Aufrufe in der Startphase korrekt nachstellt:

1. Anmeldung am Testsystem; für alle folgenden Requests wird das bei der Anmeldung erhaltene Auth-Token verwendet
2. Nach erfolgreicher Anmeldung Abruf der Daten: Testheft (also Liste der erforderlichen Dateien)
3. Abruf der Dateien

Der Server, der geprüft wird, hat eine definierte Ausgangssituation. Das bedeutet, dass stets dieselben Testinhalte bereit stehen und sich noch niemand vorher angemeldet hat. Für jede Testperson wird ein separates Login bereitgestellt. Wenn also eine Last von 10.000 Testpersonen erzeugt werden soll, hält der Server 10.000 Logins bereit, die die ausführende Testsuite benutzt.

Der Server, der die Last erzeugt, muss hierfür sehr viele Prozesse gleichzeitig managen können. Diese Bedingung erfüllt die genutzte Computersprache Go hinreichend.

Im Moment ist die Programmierung auf die Anforderungen des IQB ausgerichtet. Nach der Diskussion mit Fachleuten auf dem Gebiet des Lasttests und weiterer Erprobung würden wir die Software so ausbauen, dass sie einfach durch Dritte installiert und genutzt werden kann (MIT-Lizenz). Auf der Liste der gewünschten Features stehen noch Einbeziehung von Daten aus dem Monitoring des angegriffenen Systems (Docker stats bzw. Informationen über CPU-Auslastung, RAM usw.), Automatisierung des Testcenter-Content-Uploads und einfache Parametrisierung der Testläufe.

### Szenarien

Es werden zwei Parameter der Testung variiert:

* gleichzeitige Anzahl der Testpersonen: 100, 1.000, 2.000, 5.000, 10.000, 20.000; hierbei erfolgt real eine Streckung der Login-Anfragen: maximal 100 Anmeldungen pro Sekunde (sonst wird ein DoS-Angriffszenario simuliert)
* Gesamtgröße des Content: klein (70 kB), mittel (20 MB), groß (38 MB)

Das IQB betreibt zwei konstante Server, damit die Ergebnisse der Lasttests vergleichbar sind. Hier ist das Ziel nicht, eine spezifische Lernstandserhebung vorzubereiten, sondern Versionen des Testcenters auf Veränderungen des Lastverhaltens zu prüfen. Die Serverausstattung wird bewusst nicht variiert.

### Strategien bei unbefriedigenden Lasttest-Ergebnissen

Um die Lücke zwischen der erforderlichen Kapazität und den ermittelten Werten zu verringern, bieten sich folgende Strategien an:

* Verringerung der Testheft-Größe:
  * Sind alle Bilder, Audio- und Videosequenzen unverzichtbar?
  * Könnte man die Auflösung von Bildern, Audio- und Videosequenzen verringern bei vertretbarem Qualitätsverlust?
  * Könnte man ein Testheft aufteilen in mehrere Testhefte?
* Streckung des Testzeitraumes: Bereits eine Teilung der Testpopulation und dann Versatz um eine (Unterrichts-)Stunde würde die tägliche Kapazität verdoppeln; entsprechend wäre der Gewinn bei der Ausdehnung der Testung auf eine Woche

Bevor man nun die teure Serverkapazität erhöht sollte man sicherstellen, dass die anderen Infrastruktur-Komponenten noch Reserven haben. Wenn die Anbindung der Schulen an das Internet, die Verteilung in der Schule (WLAN-Access-Points) sowie die Endgeräte keinen Engpass bilden, sollten mehr Server bereitgestellt werden:

* Aufsetzen mehrerer getrennter Server jeweils mit einer Testcenter-Installation; Aufteilen der Testpopulation mit fixer Zuweisung des Servers; späteres manuelles Zusammenführen der Antwortdaten,
* (derzeit noch nicht verfügbar) Installation des Testcenters auf einem System mit Lastverteilung (z. B. Kubernetes), wodurch die Administration erleichtert wird; Achtung: Auch in diesem Fall muss eine höhere Serverausstattung bereitgestellt werden (die Synchronisation der Datenbank-Inhalte erzeugt zusätzliche Last).

