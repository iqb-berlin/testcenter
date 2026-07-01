---
layout: default
---

```
<?xml version="1.0" encoding="utf-8"?>
<Testtakers xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  xsi:noNamespaceSchemaLocation="https://w3id.org/iqb/spec/testcenter-testtaker-xml/18.0">

  <Metadata>
    <Description></Description>
  </Metadata>

  <CustomTexts>
    <CustomText key="booklet_codeToEnterTitle">Bitte Code eingeben</CustomText>
  </CustomTexts>

  <Profiles>
    <GroupMonitor>
      <Profile
        id="small"
        label="Superklein"
        blockColumn="hide"
        unitColumn="hide"
        groupColumn="hide"
        bookletColumn="hide"
        bookletStatesColumns=""
        view="small"
        filterLocked="yes"
        filterPending="yes"
      >
        <Filter label="Reduced Booklet" type="equal" field="bookletLabel" value="Reduced Booklet" />
      </Profile>
      <Profile
        id="all"
        label="Alles zeigen"
        blockColumn="show"
        unitColumn="show"
        groupColumn="show"
        bookletColumn="show"
        bookletStatesColumns="level bonus"
        view="full"
        filterLocked="no"
        filterPending="no"
        autoselectNextBlock="no"
      >
      </Profile>
    </GroupMonitor>
  </Profiles>

  <Group id="sample_group" validFrom="1/3/2020 10:00" label="Primary Sample Group">

    <AssetAssignments>
      <Asset slot="logo">bildLogo-1.png</Asset>
      <Asset slot="codeInputIllustration">bildCode.jpg</Asset>
    </AssetAssignments>

    <Login mode="run-hot-return" name="test" pw="user123">
      <Booklet>BOOKLET.SAMPLE-1</Booklet>
      <AssetAssignments>
        <Asset slot="logo">bildLogo-2.png</Asset>
      </AssetAssignments>
      <ViewSettings>
        <theme>Primar</theme>
        <codeInput>
          <type>text-field</type>
          <length>3</length>
        </codeInput>
        <monitorBookletVisibility>hidden</monitorBookletVisibility>
      </ViewSettings>
    </Login>

    <Login mode="run-hot-return" name="test2" pw="user123">
      <Booklet>BOOKLET.SAMPLE-2</Booklet>
      <ViewSettings>
        <theme>Sekundar</theme>
        <codeInput>
          <type>keypad-numbers</type>
          <length>3</length>
        </codeInput>
      </ViewSettings>
    </Login>
    
    <Login mode="monitor-group" name="test-group-monitor" pw="user123">
      <Profile id="all" />
      <Profile id="small" />
      <ViewSettings>
        <monitorBookletVisibility>hidden</monitorBookletVisibility>
      </ViewSettings>
    </Login>
    <Login mode="sys-check-login" name="sys-check" />
  </Group>

</Testtakers>
```

# Root-Elemente

## Metadata

Optionale Metadaten zur Beschreibung der Testtaker-Datei. Wird nicht in der Anwendung angezeigt.

## ▪ `metadata.description` (`string`)

Freitextbeschreibung der Datei, z. B. zur Dokumentation des Verwendungszwecks.


## CustomTexts (optional)

Optionale Textersetzungen für UI-Labels. Die verfügbaren Schlüssel sind in der Custom-Texts-Dokumentation aufgeführt.

→ Siehe [Testtaker-Textersetzungen](custom-texts.html)

## Groups

Mindestens eine Login-Gruppe. Alle Logins müssen einer Gruppe zugeordnet sein. Gruppen-IDs müssen installationsweit eindeutig sein.

Typ: Array aus  → Siehe [Group](#group)

## Profiles (optional)

Optionale Definitionen von Gruppenmonitor-Profilen. Profile steuern Spalten, Filter und Ansichten im Gruppenmonitor und werden in Logins per ID referenziert.

### `GroupMonitor`

Liste von Profilen für den Gruppenmonitor.

Typ: Array aus  → Siehe [GroupMonitorProfile](#groupmonitorprofile)


---
# Kind-Elemente

> Hier werden die Attribute der Kind-Elemente beschrieben.


## Group

Eine Gruppe von Logins, z. B. eine Schulklasse. Die ID muss installationsweit eindeutig sein. Antwortdaten werden der Gruppe zugeordnet.

## ▪ `Group.id` (`string` • `Pflichtfeld`)

Eindeutige Kennung der Gruppe. Muss über alle Arbeitsbereiche der gesamten Testcenter-Installation hinweg eindeutig sein.

## ▪ `Group.label` (`string` • `Pflichtfeld`)

Anzeigename der Gruppe, z. B. im Gruppenmonitor oder in der Fortschrittsanzeige.

## ▪ `Group.validTo` (`string`)

Login- und Personen-Token dieser Gruppe sind nur bis zu diesem Zeitpunkt gültig. Format: dd/mm/yyyy hh:mm. Wird weggelassen, gilt die Gruppe zeitlich unbegrenzt (oder bis validFor abläuft).

Beispiele: `31/12/2025 18:00`

## ▪ `Group.validFrom` (`string`)

Login- und Personen-Token dieser Gruppe können erst ab diesem Zeitpunkt erstellt werden. Format: dd/mm/yyyy hh:mm.

Beispiele: `01/09/2025 08:00`

## ▪ `Group.validFor` (`integer`)

Login- und Personen-Token sind für die angegebene Anzahl Minuten nach ihrer Erstellung gültig. Sind sowohl validFor als auch validTo angegeben, gilt der früher eintretende Zeitpunkt.

## ▪ `Group.assetAssignment` (`array`)

Optionale Zuweisung von externen Assets zu benannten Slots für alle Logins der Gruppe. Login-eigene Zuweisungen überschreiben Gruppen-Zuweisungen für denselben Slot.

Typ: Array aus  → Siehe [Asset](#asset)

## ▪ `Group.logins` (`array` • `Pflichtfeld`)

Mindestens ein Login innerhalb der Gruppe. Loginnamen müssen installationsweit eindeutig sein.

Typ: Array aus  → Siehe [Login](#login)



## Login

Ein einzelner Login-Eintrag. Definiert Zugangsdaten, Modus und zugewiesene Booklets oder Profile.

## ▪ `Login.name` (`string` • `Pflichtfeld`)

Anmeldename. Muss installationsweit eindeutig sein. Empfehlung: Mindestens 5 Zeichen, nur Kleinbuchstaben und Ziffern, keine Umlaute.

## ▪ `Login.pw` (`string`)

Optionales Kennwort. Wird weggelassen, ist die Anmeldung nur per Name (z. B. über URL oder QR-Code) möglich.

## ▪ `Login.mode` (`enum` • `Pflichtfeld`)

Legt die Rolle und das Verhalten des Logins fest.

Erlaubte Werte:
* `run-hot-return`: Reguläre Testdurchführung mit allen Booklet-Restriktionen. Bei erneuter Anmeldung werden Antworten wiederhergestellt und der Test fortgesetzt.
* `run-hot-restart`: Reguläre Testdurchführung mit allen Booklet-Restriktionen. Bei erneuter Anmeldung wird ein neuer Testdurchgang gestartet — vorherige Antworten werden ignoriert. Geeignet für Befragungen mit unbekanntem Personenkreis.
* `run-trial`: Testdurchführung mit den meisten Booklet-Restriktionen. Antworten werden gespeichert. Dient dem Testen der Antwortverarbeitung.
* `run-review`: Testdurchführung ohne Restriktionen. Antworten werden nicht dauerhaft gespeichert. Review-Kommentare sind möglich.
* `run-demo`: Testdurchführung ohne Restriktionen und ohne Speicherung. Kein Review möglich. Geeignet für Vorführungen.
* `run-simulation`: Testdurchführung mit allen Restriktionen, aber ohne Speicherung von Antwortdaten. Für automatische Qualitätsprüfungen.
* `monitor-group`: Gruppenmonitor für Testleitungen. Zeigt Fortschritt aller Logins der eigenen Gruppe und ermöglicht direkte Steuerung.
* `monitor-study`: Studienmonitor. Zeigt alle Gruppen des Arbeitsbereiches. Geeignet für Support-Rollen.
* `sys-check-login`: Versteckt den System-Check auf der Login-Seite. Zugriff nur nach Anmeldung in diesem Arbeitsbereich.

## ▪ `Login.booklets` (`array`)

Liste der zugewiesenen Booklets. Darf nicht zusammen mit 'profiles' angegeben werden.

Typ: Array aus  → Siehe [Booklet](#booklet)

## ▪ `Login.profiles` (`array`)

Liste von Gruppenmonitor-Profil-Referenzen. Darf nicht zusammen mit 'booklets' angegeben werden.

Typ: Array aus  → Siehe [Profile](#profile)

## ▪ `Login.assetAssignment` (`array`)

Optionale Zuweisung von externen Assets zu benannten Slots, spezifisch für diesen Login.

Typ: Array aus  → Siehe [Asset](#asset)

## ▪ `Login.viewSettings` (`object`)

Optionale Einstellungen zur Darstellung der Login-Oberfläche.

Struktur:  → Siehe [ViewSetting](#viewsetting)



## Booklet

Zuweisung eines Booklets zu einem Login. Das Booklet wird über seine ID referenziert und muss im Arbeitsbereich vorhanden sein.

## ▪ `Booklet.id` (`string` • `Pflichtfeld`)

Referenz auf die ID eines im Arbeitsbereich vorhandenen Booklets.

## ▪ `Booklet.codes` (`string`)

Leerzeichen-getrennte Liste von Personencodes. Ermöglicht zweistufige Anmeldung: Alle Personen teilen denselben Login, werden aber über ihren Personencode individuell identifiziert.

Beispiele: `x4u t5a z9i`



## Profile

Verweis auf ein im 'profiles'-Abschnitt definiertes Gruppenmonitor-Profil.

## ▪ `Profile.id` (`string` • `Pflichtfeld`)

ID eines im profiles/groupMonitor-Abschnitt definierten Profils.



## Asset

Weist eine externe Ressource einem benannten Slot zu. Slot-Namen müssen pro Login oder Gruppe eindeutig sein.

## ▪ `Asset.slot` (`enum` • `Pflichtfeld`)

Name des Slots, dem das Asset zugewiesen wird. Jeder Slot steht für einen bestimmten Anzeigebereich oder eine Funktion in der Oberfläche.

Erlaubte Werte:
* `logo`: Logo, das in der Kopfzeile der Anwendung angezeigt wird.
* `loginIllustration`: Illustration im seitlichen Infobereich der Anmeldeseite.
* `codeInputIllustration`: Illustration auf der Seite zur Personencode-Eingabe (zweistufiger Login).
* `codeInputCompanion`: Begleitende Grafik oder Animation auf der Personencode-Eingabeseite.
* `starterCompanion`: Begleitende Grafik oder Animation auf der Starter-Seite (Testheftauswahl).
* `starterCardDone`: Grafik, die auf einer Testheft-Karte angezeigt wird, wenn der Test abgeschlossen ist.
* `loadingProgress`: Grafik oder Animation, die während des Ladevorgangs angezeigt wird.
* `confirmDialog`: Grafik, die in Bestätigungsdialogen angezeigt wird.

## ▪ `Asset.value` (`string` • `Pflichtfeld`)

Referenz auf die Ressource, z. B. ein Dateiname oder eine ID.



## ViewSetting

Darstellungseinstellungen für die Login-Oberfläche.

## ▪ `ViewSetting.theme` (`string`)

Name des zu verwendenden UI-Themes.

## ▪ `ViewSetting.codeInput` (`object`)

Konfiguration der Eingabemaske für den Personencode bei zweistufiger Anmeldung.

Struktur:  → Siehe [codeInput](#codeinput)

## ▪ `ViewSetting.monitorBookletVisibility` (`enum`)

Steuert, wie Testhefte der Gruppe in der Gruppenmonitor-Übersicht standardmäßig dargestellt werden.

Erlaubte Werte:
* `visible`: Testhefte sind sichtbar ausgeklappt.
* `collapsed`: Testhefte sind eingeklappt.
* `hidden`: Testhefte werden nicht angezeigt.



## codeInput

Konfiguration der Eingabemaske für den Personencode bei zweistufiger Anmeldung.

## ▪ `codeInput.type` (`enum` • `Pflichtfeld`)

Art der Eingabemaske für den Personencode.

Erlaubte Werte:
* `text-field`: Normales Texteingabefeld.
* `keypad-symbols`: Tastatur mit Symbolen.
* `keypad-symbols-alt`: Alternative Tastatur mit Symbolen.
* `keypad-numbers`: Zahlentastatur.

## ▪ `codeInput.length` (`integer`)

Erwartete Länge des Personencodes in Zeichen. Mindestens 3.



## GroupMonitorProfile

Ein Profil für den Gruppenmonitor. Steuert Spalten, Ansicht, Filter und Automatisierungen. Wird in Logins mit dem Modus monitor-group per ID referenziert.

## ▪ `GroupMonitorProfile.id` (`string` • `Pflichtfeld`)

Eindeutige Kennung des Profils innerhalb der Datei.

## ▪ `GroupMonitorProfile.label` (`string`)

Anzeigename des Profils.

## ▪ `GroupMonitorProfile.blockColumn` (`enum`)

Sichtbarkeit der Block-Spalte im Gruppenmonitor.

Erlaubte Werte:
* `show`: Spalte wird angezeigt.
* `hide`: Spalte wird ausgeblendet.

## ▪ `GroupMonitorProfile.unitColumn` (`enum`)

Sichtbarkeit der Unit-Spalte im Gruppenmonitor.

Erlaubte Werte:
* `show`: Spalte wird angezeigt.
* `hide`: Spalte wird ausgeblendet.

## ▪ `GroupMonitorProfile.groupColumn` (`enum`)

Sichtbarkeit der Gruppen-Spalte im Gruppenmonitor.

Erlaubte Werte:
* `show`: Spalte wird angezeigt.
* `hide`: Spalte wird ausgeblendet.

## ▪ `GroupMonitorProfile.bookletColumn` (`enum`)

Sichtbarkeit der Testheft-Spalte im Gruppenmonitor.

Erlaubte Werte:
* `show`: Spalte wird angezeigt.
* `hide`: Spalte wird ausgeblendet.

## ▪ `GroupMonitorProfile.bookletStatesColumns` (`string`)

Kommagetren Liste von State-IDs, deren Werte als eigene Spalten im Gruppenmonitor angezeigt werden.

Beispiele: `difficulty,language`

## ▪ `GroupMonitorProfile.view` (`enum`)

Detailgrad der Gruppenmonitor-Ansicht.

Erlaubte Werte:
* `full`: Vollständige Ansicht mit allen Details.
* `medium`: Mittlere Detailstufe.
* `small`: Kompakte Ansicht.

## ▪ `GroupMonitorProfile.filterPending` (`enum`)

Steuert, ob Testpersonen mit noch nicht gestarteten Tests standardmäßig gefiltert werden.

Erlaubte Werte:
* `yes`: Filter ist aktiv.
* `no`: Filter ist nicht aktiv.

## ▪ `GroupMonitorProfile.filterLocked` (`enum`)

Steuert, ob gesperrte Testpersonen standardmäßig gefiltert werden.

Erlaubte Werte:
* `yes`: Filter ist aktiv.
* `no`: Filter ist nicht aktiv.

## ▪ `GroupMonitorProfile.autoselectNextBlock` (`enum`)

Steuert, ob der nächste Block automatisch ausgewählt wird, wenn alle Testpersonen den aktuellen Block abgeschlossen haben.

Erlaubte Werte:
* `yes`: Filter ist aktiv.
* `no`: Filter ist nicht aktiv.

## ▪ `GroupMonitorProfile.filters` (`array`)

Liste vordefinierter Filter, die in diesem Profil aktiv sind.

Typ: Array aus  → Siehe [MonitorFilter](#monitorfilter)



## MonitorFilter

Ein vordefinierter Filter für den Gruppenmonitor.

## ▪ `MonitorFilter.label` (`string`)

Anzeigename des Filters.

## ▪ `MonitorFilter.field` (`enum`)

Das Feld, nach dem gefiltert wird.

Erlaubte Werte:
* `bookletLabel`
* `personLabel`
* `state`
* `blockLabel`
* `groupName`
* `bookletId`
* `unitId`
* `unitLabel`
* `blockId`
* `testState`
* `mode`
* `bookletSpecies`
* `bookletStates`

## ▪ `MonitorFilter.type` (`enum`)

Art des Vergleichs zwischen Feldwert und dem angegebenen Wert.

Erlaubte Werte:
* `equal`: Exakter Vergleich.
* `substring`: Feldwert enthält den angegebenen Wert.
* `regex`: Feldwert entspricht dem regulären Ausdruck.

## ▪ `MonitorFilter.value` (`string`)

Der Vergleichswert für den Filter.

## ▪ `MonitorFilter.subValue` (`string`)

Optionaler Unterwert für zusammengesetzte Felder (z. B. bei bookletStates).

## ▪ `MonitorFilter.not` (`boolean`)

Wenn true, wird der Filter negiert — es werden nur Einträge angezeigt, die die Bedingung nicht erfüllen.

Standard: `false`


