---
layout: default
---

# Testtaker: Textersetzungen
{: .no_toc }

Dieses Dokument beschreibt, wie die benutzerdefinierten Texte in die Anwendung integriert werden und
listet alle möglichen Schlüssel auf. Die Textersetzungen können im Feld: `<CustomTexts>` für alle Logins hinterlegt werden.

```
<CustomTexts>
    <CustomText key="login_testEndButtonText">Test beenden</CustomText>
    <CustomText key="login_bookletSelectPrompt">Bitte wählen</CustomText>
...
</CustomTexts>
```

## Textersetzungen System-Check
{: .no_toc }

Textersetzungen für den System-Check werden im Konfigurationsfeld der **System-Check-XML** angegeben
.
```
<Config>
    <UploadSpeed ...
    <DownloadSpeed ...
    <CustomText key="syscheck_questionsintro">...</CustomText>
    <CustomText key="app_intro1">...</CustomText>
...
</Config>
```
## Inhalt
{: .no_toc }
1. TOC
{:toc}
# Anmeldeseite (`login_*`)

Texte für die Anmeldeseite und allgemeine UI-Elemente.

## `login_bookletSelectPromptMany`

Aufforderung, aus der Liste der gefundenen Tests einen auszusuchen (auf Schalter klicken)

Standard: Bitte klicke auf eine der Schaltflächen auf der linken Seite, um einen Test zu starten!

## `login_bookletSelectPromptNull`

Nachricht für den Fall, dass Booklet(s) beendet wurden und keine weiteren zur Verfügung stehen

Standard: Beendet. Es können keine weiteren Testhefte gestartet werden.

## `login_bookletSelectPromptOne`

Aufforderung, den einen gefundenen Test anzuklicken (auf Schalter klicken)

Standard: Bitte klicke auf die Schaltfläche auf der linken Seite, um den Test zu starten!

## `login_codeInputErrorBody`

Haupttext des Fehlertext bei falscher Codeinegabe

Standard: Versuche es noch einmal.

## `login_codeInputErrorTitle`

Titelzeile des Fehlertext bei falscher Codeinegabe

Standard: Ups, falscher Code!

## `login_codeInputPrompt`

Aufforderung, Code einzugeben (bei einem zweistufigen Login-Prozess)

Standard: Bitte Log-in eingeben, der auf dem Zettel steht!

## `login_codeInputTitle`

Titel des Eingabeformulares für den Code

Standard: Log-in eingeben

## `login_pagesNaviPrompt`

Aufforderungstext, weitere Seiten einer Unit auszuwählen, z. B. 'Wähle hier andere Seiten dieser Aufgabe:'

Standard: Weitere Seiten:

## `login_sidepanel_subtitle`

Untertitel des seitlichen Infobereichs auf der Anmeldeseite

Standard: Das IQB-Testcenter ist eine Anwendung des Instituts zur Qualitätsentwicklung im Bildungswesen (IQB) zur Durchführung digitaler Tests und Befragungen. Der Zugang ist mit den Zugangsdaten möglich, die Sie vorab erhalten haben.

## `login_sidepanel_title`

Titel des seitlichen Infobereichs auf der Anmeldeseite

Standard: Willkommen im IQB‑Testcenter

## `login_subtitle`

Titel für Starter-Seite

Standard: Testauswahl

## `login_testEndButtonLabel`

Schalterbeschriftung für 'Test beenden'

Standard: Test beenden

## `login_testResumeButtonLabel`

Schalterbeschriftung für 'Test fortsetzen'

Standard: Test fortsetzen

## `login_unsupportedBrowser`

Warnung-Banner, wenn ein nicht unterstützer Browser verwendet wird. Ersetzungen (%s): Browser-Name, Browser-Version.

Standard: Ihr Browser %s %s ist veraltet und könnte zu Fehlern führen. Bitte verwenden Sie eine aktuelle Version.

# Testheft-Ansicht (`booklet_*`)

Texte für die Testheft-Ansicht, Navigation und Dialoge.

## `booklet_blockLockedByAfterLeave`

Block kann nicht noch einmal betreten werden

Standard: Block kann nicht noch einmal betreten werden

## `booklet_codeToEnterPrompt`

Dialogbox für die Eingabe eines Freigabewortes: Aufforderung für die Eingabe eines Freigabewortes

Standard: Bitte gib das Freigabewort ein, das angesagt wurde!

## `booklet_codeToEnterTitle`

Dialogbox für die Eingabe eines Freigabewortes

Standard: Aufgabenblock ist gesperrt, Freigabewort benötigt

## `booklet_codeToEnterWarning`

Dialogbox für die Eingabe eines Freigabewortes: Warnung über Groß-/Kleinschreibung

Standard: Im Eingabefeld werden automatisch alle Buchstaben groß geschrieben.

## `booklet_console_warning`

Warnung, die auf der Browserkonsole erscheinen soll

Standard: Du bist offenbar ein richtiger Experte und hast die Konsole geöffnet. Klasse! *sarcastic clapping*
Gehe nun schnell zurück zum Test, du hast sonst nicht genug Zeit für die Aufgaben.

## `booklet_errormessage`

Nachricht an die Testperson, wenn ein schwerer Fehler aufgetreten ist

Standard: Leider gab es ein technisches Problem. Versuche Folgendes:

1. Lade die Seite neu. Drücke dafür die Taste F5 oder am Tablet das Neu-Laden-Symbol oben rechts neben der Internetadresse.

Funktioniert nicht? Dann...

2. Melde dich mit deinen Zugangsdaten in einem anderen Browser neu an (Browser: Mozilla Firefox, Google Chrome, Apple Safari).

Funktioniert auch nicht? Dann...

3. Melde dich mit deinen Zugangsdaten an einem anderen Gerät neu an. Spreche das aber vorher mit der Lehrkraft bzw. Testleitung ab.

## `booklet_loading`

Test wird geladen

Standard: Bitte warten

## `booklet_lockedBlock`

Zeit von zeitgesteuertem Aufgabenblock ist abgelaufen

Standard: Aufgabenzeit ist abgelaufen

## `booklet_lockedByAfterLeave`

Aufgabe kann nicht noch einmal betreten werden

Standard: Aufgabe kann nicht noch einmal betreten werden

## `booklet_msgNavigationDeniedText_presentationIncomplete`

Text der Nachricht, dass nicht weitergeblättert werden kann, solange die Aufgabe nicht vollständig gesehen worden ist.

Standard: Es müssen erst alle Audio-Dateien vollständig abgespielt werden und auf allen Seiten bis ganz nach unten gescrollt werden.

## `booklet_msgNavigationDeniedText_responsesIncomplete`

Titel der Nachricht, dass nicht weitergeblättert werden kann, solange die Aufgabe nicht vollständig bearbeitet worden ist.

Standard: Es müssen erst alle Teilaufgaben bearbeitet werden.

## `booklet_msgNavigationDeniedTitle`

Titel der Nachricht, dass nicht weitergeblättert werden kann, solange die Aufgabe nicht vollständig bearbeitet / gesehen worden ist.

Standard: Aufgabe darf nicht verlassen werden

## `booklet_msgSoonTimeOver`

Nachricht, dass für die Bearbeitung eines Abschnittes noch x min Zeit ist

Standard: Du hast noch %s Minute(n) Zeit für die Bearbeitung der Aufgaben in diesem Abschnitt.

## `booklet_msgTimeOver`

Nachricht, dass die Bearbeitungszeit für einen Abschnitt abgelaufen ist.

Standard: Die Bearbeitung des Abschnittes ist beendet.

## `booklet_msgTimerCancelled`

Nachricht, dass die Bearbeitung eines Abschnittes mit Timer abgebrochen wurde

Standard: Die Bearbeitung des Abschnittes wurde abgebrochen.

## `booklet_msgTimerStarted`

Nachricht, dass der Timer für die Bearbeitung eines Abschnittes gestartet wurde

Standard: Die Bearbeitungszeit für diesen Abschnitt hat begonnen: 

## `booklet_pausedmessage`

Nachricht an die Testperson, wenn der Test vom System unterbrochen wurde

Standard: Der Test wurde kurz angehalten.

## `booklet_requestFullscreen`

Text für Dialogfeld 'Vollbild aktivieren?'

Standard: Soll das Vollbild aktiviert werden?

## `booklet_starterContinueTestButtonLabel`

Hauptmenü: Beschriftung für den Knopf um Test fortzusetzen

Standard: Weiter

## `booklet_starterLockedTestButtonLabel`

Hauptmenü: Beschriftung für den Knopf bei gesperrtem Test

Standard: Fertig

## `booklet_starterStartTestButtonLabel`

Hauptmenü: Beschriftung für den Knopf um Test zu starten

Standard: Starten

## `booklet_starterViewTestButtonLabel`

Hauptmenü: Beschriftung für den Knopf um Test anzusehen

Standard: Ansehen

## `booklet_tasklisttitle`

Titel für die Auflistung der Aufgaben (Schalter)

Standard: Aufgaben

## `booklet_warningLeaveTextPrompt-testlet`

Text für Warnung (Dialogbox) eines nur einmal betretbaren Bereiches.

Standard: Du verlässt einen Bereich zu dem du später nicht zurückkehren kannst. Trotzdem weiterblättern?

## `booklet_warningLeaveTextPrompt-unit`

Text für Warnung (Dialogbox) eines nur einmal betretbaren Bereiches.

Standard: Du verlässt eine Aufgabe zu der du später nicht zurückkehren kannst. Trotzdem weiterblättern?

## `booklet_warningLeaveTimerBlockTextPrompt`

Schalterbeschriftung für 'Zurück zum Test'

Standard: Du verlässt einen zeitbeschränkten Bereich und kannst nicht zurückkehren. Trotzdem weiterblättern?

## `booklet_warningLeaveTimerBlockTitle`

Titel für Warnung (Dialogbox) vor dem vorzeitigen Verlassen eines Abschnittes mit Timer

Standard: Aufgabenabschnitt verlassen?

## `booklet_warningLeaveTitle-testlet`

Titel für Warnung (Dialogbox) eines nur einmal betretbaren Bereiches.

Standard: Aufgabenbereich verlassen?

## `booklet_warningLeaveTitle-unit`

Titel für Warnung (Dialogbox) einer nur einmal betretbaren Aufgabe.

Standard: Aufgabe verlassen?

# System-Check (`syscheck_*`)

Texte für den System-Check.

## `syscheck_intro`

Text auf der ersten Seite des System-Checks

Standard: Dieser Systemcheck soll gewährleisten, dass das von Ihnen verwendete Endgerät für eine bestimmte Befragung oder Testung geeignet ist.

## `syscheck_questionsRequiredMessage`

Nachricht an die Testperson, wenn einige Fragen, die als 'required' markiert sind, nicht beantwortet wurden

Standard: Bitte prüfen Sie die Eingaben (unvollständig):

## `syscheck_questionsintro`

Aufforderung, die Fragen (Questionnaire) zu beantworten

Standard: Bitte bearbeiten Sie die nachfolgenden Fragen.

## `syscheck_report_aboutPassword`

Dialog 'Bericht senden': Text über das Passworteingabefeld

Standard: Nur berechtigten Personen ist das Speichern erlaubt. Bitte geben Sie unten das System-Check-Kennwort ein, das Sie von der Projektleitung erhalten haben!

## `syscheck_report_aboutReportId`

Dialog 'Bericht senden': Text über das Passworteingabefeld

Standard: Die ermittelten bzw. eingegebenen Informationen werden in der Datenbank so gespeichert, dass eine zusammenfassende Auswertung für eine bestimmte Studie möglich ist. Um den Bericht einem bestimmten Projekt oder einer Studie zuordnen zu können, geben Sie bitte einen kurzen Text ein, der dann als Titel für den Bericht verwendet wird!

## `syscheck_report_id`

Dialog 'Bericht senden': Platzhalter für das ID-Eingabefeld vor dem Senden des Berichts

Standard: Schul-ID

## `syscheck_unitPrompt`

Titelzeile über der Aufgabe

Standard: Bitte prüfen Sie die folgenden Aufgaben-Elemente

# Gruppenmonitor (`gm_*`)

Texte für den Gruppenmonitor.

## `gm_auto_checkall`

Der 'Immer alle Auswählen'-Schalter

Standard: Alle Tests gleichzeitig steuern

## `gm_codetoenter_unlock_tooltip`

Tooltip Passwort-geschützter Bereich geöffnet

Standard: Block wurde geöffnet

## `gm_col_blockLabel`

Spalte: Block

Standard: Block

## `gm_col_bookletLabel`

Spalte: Testheft

Standard: Testheft

## `gm_col_groupName`

Spalte: Gruppe

Standard: Gruppe

## `gm_col_personLabel`

Spalte: Teilnehmer

Standard: Teilnehmer

## `gm_col_state`

Spalte: Aktivität

Standard: Aktivität

## `gm_col_unitLabel`

Spalte: Aufgabe

Standard: Aufgabe

## `gm_control_finish_everything`

Control: Testung beenden

Standard: Testung beenden

## `gm_control_goto`

Control: Springe zu Block

Standard: Springe zu

## `gm_control_goto_tooltip`

Tooltip über dem 'Springe zu'-Knopf, der erscheint, wenn kein Block gewählt ist

Standard: Bitte Block auswählen

## `gm_control_goto_unlock_blocks_confirm_headline`

Control: Springe zu Block - soll Zeit wiederhergestellt werden? - Überschrift

Standard: Sprung bestätigen

## `gm_control_goto_unlock_blocks_confirm_text`

Control: Springe zu Block - soll Zeit wiederhergestellt werden?

Standard: Zeit wiederherstellen bei Sprung in zeitgesteuerten Block?

## `gm_control_pause`

Control: pause

Standard: Pause

## `gm_control_resume`

Control: weiter

Standard: Weiter

## `gm_control_unlock`

Control: Entsperren

Standard: Test Entsperren

## `gm_control_unlock_success_warning`

Wird angezeigt, wenn Tests entsperrt wurden

Standard: ACHTUNG! Die betreffenden Browser und diese Testleiterkonsole müssen ggf. neu gestartet werden.

## `gm_control_unlock_tooltip`

Tooltip: Freigeben

Standard: Test Freigeben

## `gm_controls`

Überschrift: Test-Steuerung

Standard: Test-Steuerung

## `gm_filter_locked`

Filter: gesperrte ausblenden

Standard: gesperrte

## `gm_filter_not`

Benutzerdefinierter Filter: Nicht

Standard: nicht

## `gm_filter_pending`

Filter: nicht gestartete ausblenden

Standard: nicht gestartete

## `gm_filter_target_blockId`

Benutzerdefinierter Filter: Ziel - Block-Id

Standard: Block-Id

## `gm_filter_target_bookletId`

Benutzerdefinierter Filter: Ziel - TestheftId

Standard: Booklet-Id

## `gm_filter_target_bookletSpecies`

Benutzerdefinierter Filter: Ziel -Testhefttyp

Standard: Testhefttyp

## `gm_filter_target_bookletStates`

Benutzerdefinierter Filter: Ziel - Testheft-Adaptivität-Zustand

Standard: Testheft-Zustand

## `gm_filter_target_groupName`

Benutzerdefinierter Filter: Ziel - Gruppe

Standard: Gruppe

## `gm_filter_target_mode`

Benutzerdefinierter Filter: Ziel - Modus

Standard: Durchführungsmodus

## `gm_filter_target_testState`

Benutzerdefinierter Filter: Ziel - detaillierter Teststatus

Standard: Detaillierter Teststatus

## `gm_filter_target_unitId`

Benutzerdefinierter Filter: Ziel - Aufgaben-Id

Standard: Aufgaben-Id

## `gm_filter_type_equal`

Benutzerdefinierter Filter: Typ - gleicht

Standard: gleicht

## `gm_filter_type_regex`

Benutzerdefinierter Filter: Typ - Regulärer Ausdruck

Standard: matched regulären Ausdruck

## `gm_filter_type_substring`

Benutzerdefinierter Filter: Typ - enthält

Standard: enthält

## `gm_headline`

Überschrift: Gruppenmonitor

Standard: Gruppenüberwachung

## `gm_hide_controls_tooltip`

Tooltip: Test-Steuerung verbergen

Standard: Test-Steuerung verbergen

## `gm_menu_cols`

Menüeintrag: Spalten

Standard: Spalten

## `gm_menu_cols_states`

Spalte: Booklet-Zustände

Standard: Zustände

## `gm_menu_filter`

Menüeintrag: Sitzungen ausblenden

Standard: Sitzungen ausblenden

## `gm_multiple_booklet_species_warning`

Tooltip über dem 'Immer alle Auswählen'-Schalter, der erscheint, wenn dieser deaktiviert ist

Standard:  - Die verwendeten Booklets sind zu unterschiedlich, um gemeinsam gesteuert zu werden.

## `gm_scroll_down`

Control: Ganz nach unten

Standard: Ganz nach unten

## `gm_selection_info`

Information gewählte Tests. Text-Substitutionen: (Alle/''), Anzahl, (''/s), Anzahl, (''/e)

Standard: %s %s Test%s mit %s Testheft%s ausgewählt.

## `gm_selection_info_none`

Information gewählte Tests: Keiner

Standard: Kein Test gewählt.

## `gm_selection_text`

Der Text im Button bei Auswahl der Testleitungskonsole

Standard: Überwachung starten

## `gm_selection_text_expired`

Der Text im Button bei Auswahl der Testleitungskonsole, wenn die Gruppe abgelaufen ist. $date wird gegen das Ablaufdatum ersetzt.

Standard: Gruppe abgelaufen seit %date.

## `gm_selection_text_scheduled`

Der Text im Button bei Auswahl der Testleitungskonsole, wenn die noch nicht freigegeben abgelaufen ist. $date wird gegen das Freigabedatum ersetzt.

Standard: Gruppe erst freigegeben ab %date.

## `gm_settings_tooltip`

Control: Ansicht

Standard: Ansicht

## `gm_show_monitor`

Titel für Monitorfunktion

Standard: Testgruppen-Überwachung

## `gm_show_test`

Titel für Testüberprüfung

Standard: Testhefte anzeigen

## `gm_timeleft_tooltip`

Tooltip zeitgesteuerter Block: verbleibende Zeit. Ersetzungen (%s): Verbleibende Minuten, Minuten gesamt

Standard: Verbleibende Zeit: %s von %s Minute(n)

## `gm_timemax_tooltip`

Tooltip zeitgesteuerter Block: Noch nicht gestartet. Ersetzung (%s): Minutenzahl, 

Standard: Zeitgesteuerter Block: %s Minute(n)

## `gm_timeup_tooltip`

Tooltip zeitgesteuerter Block: Zeit abgelaufen

Standard: Zeit abgelaufen

## `gm_view_full`

Ansicht: Vollständig

Standard: Vollständig

## `gm_view_medium`

Ansicht: Nur Blöcke

Standard: Nur Blöcke

## `gm_view_small`

Ansicht: Kurz

Standard: Kurz
