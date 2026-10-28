# Taschenrechner-Konfiguration im Booklet

Der Booklet-Parser unterstützt die folgende Konfiguration. Die benötigte
Booklet-XSD-Erweiterung ist noch nicht veröffentlicht. Uploads mit aktiver
Schema-Prüfung akzeptieren die Deklaration deshalb noch nicht. Die
Taschenrechner-Schaltfläche und die Übergabe der Booklet-Einstellungen folgen in
späteren Schritten. Das Rechnermodul wird als Workspace-Ressource bereitgestellt.

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
