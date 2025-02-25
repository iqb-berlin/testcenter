# Optimierung am Testcode

* soweit wie sinnvoll Entfernung von "should". Hintergrund: Unnötige Codezeilen
* Bereichsselektoren (data-cy) für "contains". Hintergrund: Sonst wird nach dem Contain im weiten Feld gesucht
* soweit möglich Reg-Ex-Ausdrücke in "contains" vermeiden. Hintergrund: Führt stellenweise zur Verlangsamung des Tests führt

## to do

* wenn Fehler mit gesperrten Booklets in demo und review behoben ist, shoul(not.exist) wieder rein nehmen
* demo und review-mode: Hier erscheinen manchmal entsprechende Snackbars nicht und der Test scheitert --> mit Nam besprechenext]
### Verbesserungen
* Unterschiedliche Custom Texts wurden aufeinander abgestimmt, sodass das Ändern eines Labels auch andere Stellen beeinflusst, die das gleiche Label tragen sollten

### Bugfixes
* `ARROWS_ONLY` innerhalb der Booklet Konfigurationen verhält sich nun wie erwartet

## 15.5.0
### neue Features
* Unit.XML: <BaseVariables> -> <Variable> vom `type` 'json' und 'no-value' können beim Upload gelesen werden

### Verbesserungen
* Wenn die Testleiterkonsole ein SuS über die `Springe zu BLOCK` Funktion in einen zeitgesteuert