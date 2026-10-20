# Taschenrechner-Konfiguration im Booklet

Der Booklet-Parser unterstützt die folgende Konfiguration. Die benötigte
Booklet-XSD-Erweiterung ist noch nicht veröffentlicht. Uploads mit aktiver
Schema-Prüfung akzeptieren die Deklaration deshalb noch nicht. Bei einer laufenden
und geladenen Unit mit `show="yes"` erscheint ein Taschenrechner-Symbol
im Kopfbereich neben dem Menü für Neuladen und Vollbild. Der Tooltip und die
Beschriftung für Screenreader lauten „Taschenrechner“. Die Schaltfläche ist auch
verfügbar, wenn die Schaltflächen für Neuladen und Vollbild ausgeblendet sind.
Das Rechnermodul wird als Workspace-Ressource bereitgestellt.

## Rechnermodul bereitstellen

Laden Sie eine Verona-Widget-HTML-Datei in den Arbeitsbereich hoch. Die Metadaten
müssen `"type": "WIDGET"` und `"model": "CALCULATOR"` oder `"model": "CALC"` angeben. Beide Namen
werden auch beim Ready/Start-Austausch als Taschenrechner erkannt.

Wenn beide Modelle verfügbar sind, verwendet Testcenter `CALCULATOR`. Nur wenn
dafür keine Datei vorliegt, wird `CALC` verwendet. Innerhalb eines Modells gilt
vorläufig die Auswahl der letzten Datei in der vom Backend sortierten Liste.
Diese Liste ist nach Dateiänderungszeit und bei Gleichstand nach Dateiname
sortiert. Die Regel vergleicht keine Versionsnummern.

Ohne passende Datei zeigt der Taschenrechner-Aufruf einen Hinweis an die
Testleitung, ein Modul hochzuladen. Schlägt der Download der ausgewählten Datei
fehl, erscheint der bestehende Ladefehler. Testcenter wechselt dann nicht
automatisch zu einer anderen Datei.

Die Moduldatei muss die gewünschten Rechnerfunktionen und Konfigurationsparameter
selbst unterstützen. Der Modellname allein bestätigt keine vollständige
Unterstützung aller Parameter.

## XML-Deklaration

Jedes `<Testlet>` erlaubt höchstens ein direktes `<Calculator>`-Kindelement.
Es steht nach dem optionalen `<Restrictions>` und vor Units oder Testlets.

```xml
<Testlet id="math">
  <Calculator show="yes" mode="SCIENTIFIC" journalLines="5" maxImageWidthPx="200">
    <Journal>[]</Journal>
  </Calculator>
  <Unit id="task" label="Mathematik"/>
</Testlet>
```

| Einstellung | Erlaubte Werte | Bei fehlender Angabe |
| --- | --- | --- |
| `show` | `yes`, `no` | Pflichtattribut jeder Deklaration |
| `mode` | `SIMPLE`, `SCIENTIFIC` | `SIMPLE` |
| `journalLines` | Nichtnegative ganze Zahl | `0`, kein sichtbares Journal |
| `maxImageWidthPx` | Positive ganze Zahl | `200` |
| `<Journal>` | JSON-Array mit `asLatex` und `asImage` als Zeichenfolgen je Eintrag | `[]` |

Ganzzahlige Einstellungen dürfen `9007199254740991` nicht überschreiten, damit
Testcenter sie ohne Genauigkeitsverlust verarbeiten kann. Dezimalbrüche und
Exponentialschreibweise sind ungültig.

Im Journal steht der neueste Eintrag am Ende. Der Parser prüft die JSON-Syntax
und die beiden Zeichenfolgen pro Eintrag. Er erhält den Inhalt unverändert und
dekodiert keine Bilder. Die [Rechner-Spezifikation](https://iqb-specifications.github.io/concepts/plugins/widget.html#taschenrechner)
beschreibt das Bildformat. XML-Sonderzeichen müssen maskiert werden oder innerhalb
eines CDATA-Abschnitts stehen. Ein leeres `<Journal/>` ist kein gültiges JSON-Array.

## Vererbung und Überschreiben

Ohne eigene Deklaration erben alle Nachfahren die vollständige Konfiguration des
Eltern-Testlets. Eine eigene `<Calculator>`-Deklaration ersetzt diese vollständig.
Ausgelassene Einstellungen erhalten die Standardwerte; einzelne Attribute werden
nicht mit den Einstellungen der Vorfahren kombiniert.

```xml
<Testlet id="outer">
  <Calculator show="yes" mode="SCIENTIFIC" journalLines="5"/>
  <Testlet id="inherits">
    <Unit id="scientific" label="Wissenschaftlicher Rechner mit fünf Journalzeilen"/>
  </Testlet>
  <Testlet id="disabled">
    <Calculator show="no"/>
    <Unit id="hidden" label="Kein Taschenrechner"/>
    <Testlet id="reenabled">
      <Calculator show="yes"/>
      <Unit id="simple" label="Einfacher Rechner ohne sichtbares Journal"/>
    </Testlet>
  </Testlet>
</Testlet>
```

`show="no"` gilt auch für Nachfahren, bis eine eigene Deklaration die Einstellung
ersetzt. Ohne anwendbare Deklaration ist kein Taschenrechner konfiguriert.
Eine Deklaration direkt unter `<Units>`, innerhalb von `<Restrictions>` oder
innerhalb einer `<Unit>` ist ungültig.

Die ausgewertete Konfiguration liegt auf dem jeweiligen Testlet. Testcontroller
und Gruppen-Monitor verwenden dafür denselben Parser. Im Testcontroller ist sie
über `unit.parent.calculator` verfügbar. Der Parser ändert keine Widget-Zustände
und speichert das Journal nicht als Testantwort.


## Parameter und Zustand beim Öffnen

Jeder Aufruf übergibt alle vier Parameter als Zeichenfolgen:

| Booklet-Einstellung | Widget-Parameter |
| --- | --- |
| `mode` | `MODE` |
| `journalLines` | `JOURNAL_LINES` |
| `maxImageWidthPx` | `MAX_IMAGE_WIDTH_PX` |
| `<Journal>` | `JOURNAL` |

Das konfigurierte Journal wird bei jedem Start als `JOURNAL` übergeben. Bereits
akzeptierte Widget-Zustände werden unabhängig davon über das Feld `state`
wiederhergestellt, auch wenn der gespeicherte Zustand eine leere Zeichenfolge ist.
Testcenter ersetzt den gespeicherten Zustand nicht durch das konfigurierte Journal.
Das Modul entscheidet, wie es seine Parameter und seinen Startzustand verarbeitet.

Testcenter hält den Rechnerzustand pro Unit und Widget-Ressource im Arbeitsspeicher.
Units mit derselben Rechnerkonfiguration haben jeweils ein eigenes Journal. Beim
Zurückkehren zu einer Unit wird deren bisheriger Zustand wiederhergestellt, auch
wenn dieselbe Unit-Datei an anderer Stelle im Testheft erneut verwendet wird.
Eine Pause erhält die Zustände. Beim Neuladen oder Verlassen des Testlaufs werden
sie gelöscht; Testcenter speichert die Journale nicht in der Datenbank.

Die Parameter werden auch dann übergeben, wenn eine hochgeladene Modulversion
`MODE` oder `JOURNAL` noch nicht auswertet. Testcenter passt das Modul nicht an und
verwendet keine Ersatzdarstellung für diese Parameter.

Während des Ladens, einer Pause und nach Testende ist die Schaltfläche verborgen.
Vor dem Öffnen werden die aktuelle Unit und ihre Freigabe erneut geprüft. Beim
gewöhnlichen Schließen kehrt der Fokus zur Schaltfläche zurück. Bei einem
Unit-Wechsel oder einer Pause schließt das Fenster ohne Fokus-Rückgabe an die
verlassene Ansicht. Die vorhandenen Laufzeitregeln für Widget-Zustände bleiben
bestehen.

## Ergebnisfenster für die letzte Rechnung

Beim gewöhnlichen Schließen des Taschenrechners erscheint ein kleines
Ergebnisfenster, wenn der letzte Journaleintrag im akzeptierten Zustand ein
`asImage` enthält. Unterstützt werden PNG- und JPEG-Bilder als Base64-Daten-URL.
Das Fenster zeigt das vom Modul gelieferte Bild mit Formel und Ergebnis. Es
blockiert keine Eingaben in der Unit und lässt sich an seiner Titelleiste mit der
Maus verschieben.

Die Schließen-Schaltfläche minimiert das Ergebnisfenster. Eine feste Schaltfläche
„Letzte Rechnung“ bleibt am unteren rechten Bildschirmrand sichtbar und öffnet es
wieder. Diese Schaltfläche hat keine Funktion zum Entfernen. Ein neues Ergebnis
ersetzt das vorherige Bild und öffnet das Ergebnisfenster erneut. Ohne neues
verwendbares Bild bleibt das bisherige Ergebnis erhalten.

Das Ergebnis bleibt innerhalb des Testlaufs über Unit-Wechsel hinweg erhalten.
Fenster und Schaltfläche sind nur sichtbar, wenn die aktuelle Unit geladen ist,
der Test läuft und der Taschenrechner freigegeben ist. Während eines modalen
Dialogs sind sie ebenfalls verborgen. Wird die Freigabe wieder wirksam, erscheint
die vorherige Darstellung, auch wenn sie minimiert war.

Ein erzwungenes Schließen, etwa beim Unit-Wechsel oder bei einer Pause, öffnet
kein neues Ergebnisfenster. Bereits angezeigte Ergebnisse bleiben im Speicher.
Beim Zurücksetzen, Abmelden oder Verlassen des Testlaufs werden sie gelöscht.
Nach einer Änderung der Fenstergröße wird die Position zurückgesetzt, damit das
Ergebnisfenster erreichbar bleibt.
