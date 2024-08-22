---
layout: default
---

# CustomTexts
This application enables changes of texts during runtime. It's an implementation 
of the CustomTextPipe/CustomTextService 
of [iqb-components](https://github.com/iqb-berlin/iqb-components). The idea is, that 
there might be some cases where the standard titles, prompts or explanations are not 
suitable for the specific environment the iqb-testcenter application is run in. One 
could change the source code and rebuild the application, but for minor changes we 
use this text replacement feature 'custom texts'.

This document 
describes the ways to bring the custom texts to the application and lists 
all possible keys.

### Configuration via login configuration
For some tests, the test authority might like to change standard titles, prompts or explanations 
furthermore depending on the testtaker. For example, the questionnaire for teachers 
will use 'Please contact the administrator of the survey' and the booklet for students 
will prompt 'Please ask the test proctor'.

The login configuration goes with the XML file for the longin(s). There is one optional 
section 'CustomTexts' in every login file. Text replacements in this section will apply 
for every login of this file. Example:
```
<CustomTexts>
    <CustomText key="login_testEndButtonText">Test beenden</CustomText>
    <CustomText key="login_bookletSelectPrompt">Bitte wählen</CustomText>
...
</CustomTexts>
```
### Configuration of System check
In the definition file for system checks, there is also one place to define text
replacements:
```
<Config>
    <UploadSpeed ...
    <DownloadSpeed ...
    <CustomText key="syscheck_questionsintro">...</CustomText>
    <CustomText key="app_intro1">...</CustomText>
...
</Config>
```
### List of possible replacements

| Key       | Used for     | Default     |
| :------------- | :---------- | :----------- |
|booketlet_continueButtonLockedUnit|Label für den Button um bei gesperrten Units weiter zuklicken|Weiter|
|booklet_codeToEnterPrompt|Dialogbox für die Eingabe eines Freigabewortes: Aufforderung für die Eingabe eines Freigabewortes|Bitte gib das Freigabewort ein, das angesagt wurde!|
|booklet_codeToEnterTitle|Dialogbox für die Eingabe eines Freigabewortes: Titel|Aufgabenblock ist noch gesperrt|
|booklet_codeToEnterWarning|Dialogbox für die Eingabe eines Freigabewortes: Warnung über Groß-/Kleinschreibung|Im Eingabefeld werden automatisch alle Buchstaben groß geschrieben.|
|booklet_console_warning|Warnung, die auf der Browserkonsole erscheinen soll|Du bist offenbar ein richtiger Experte und hast die Konsole geöffnet. Klasse! *sarcastic clapping*
Gehe nun schnell zurück zum Test, du hast sonst nicht genug Zeit für die Aufgaben.|
|booklet_errormessage|Nachricht an die Testperson, wenn ein schwerer Fehler aufgetreten ist|Leider gab es ein technisches Problem. Versuche Folgendes:

1. Lade die Seite neu. Drücke dafür die Taste F5 oder am Tablet das Neu-Laden-Symbol oben rechts neben der Internetadresse.

Funktioniert nicht? Dann...

2. Melde dich mit deinen Zugangsdaten in einem anderen Browser neu an (Browser: Mozilla Firefox, Google Chrome, Apple Safari).

Funktioniert auch nicht? Dann...

3. Melde dich mit deinen Zugangsdaten an einem anderen Gerät neu an. Spreche das aber vorher mit der Lehrkraft bzw. Testleitung ab.|
|booklet_loading|Test wird geladen|bitte warten|
|booklet_loadingBlock|Meldung wenn ein Zeitgesteuerter Block betreten wurde, der noch nicht geladen wurde|Aufgabenblock wird geladen|
|booklet_loadingUnit|Meldung wenn eine Unit betreten wird, die noch nicht geladen wurde|Aufgabe wird geladen|
|booklet_lockedBlock|Zeit von zeitgesteuertem Aufgabenblock ist abgelaufen|Aufgabenzeit ist abgelaufen|
|booklet_msgNavigationDeniedText_presentationIncomplete|Text der Nachricht, dass nicht weitergeblättert werden kann, solange die Aufgabe nicht vollständig gesehen worden ist.|Es müssen erst alle Audio-Dateien vollständig abgespielt werden und auf allen Seiten bis ganz nach unten gescrollt werden.|
|booklet_msgNavigationDeniedText_responsesIncomplete|Titel der Nachricht, dass nicht weitergeblättert werden kann, solange die Aufgabe nicht vollständig bearbeitet worden ist.|Es müssen erst alle Teilaufgaben bearbeitet werden.|
|booklet_msgNavigationDeniedTitle|Titel der Nachricht, dass nicht weitergeblättert werden kann, solange die Aufgabe nicht vollständig bearbeitet / gesehen worden ist.|Aufgabe darf nicht verlassen werden|
|booklet_msgSoonTimeOver|Nachricht, dass für die Bearbeitung eines Abschnittes noch x min Zeit ist|Du hast noch %s Minute(n) Zeit für die Bearbeitung der Aufgaben in diesem Abschnitt.|
|booklet_msgTimeOver|Nachricht, dass die Bearbeitungszeit für einen Abschnitt abgelaufen ist.|Die Bearbeitung des Abschnittes ist beendet.|
|booklet_msgTimerCancelled|Nachricht, dass die Bearbeitung eines Abschnittes mit Timer abgebrochen wurde|Die Bearbeitung des Abschnittes wurde abgebrochen.|
|booklet_msgTimerStarted|Nachricht, dass der Timer für die Bearbeitung eines Abschnittes gestartet wurde|Die Bearbeitungszeit für diesen Abschnitt hat begonnen: |
|booklet_pausedmessage|Nachricht an die Testperson, wenn der Test vom System unterbrochen wurde|Der Test wurde kurz angehalten.|
|booklet_requestFullscreen|Text für Dialogfeld 'Vollbild aktivieren?'|Soll das Vollbild aktiviert werden?|
|booklet_tasklisttitle|Titel für die Auflistung der Aufgaben (Schalter)|Aufgaben|
|booklet_unitLoading|Untertitel des Ladebalkens, xxx% geladen|geladen|
|booklet_unitLoadingPending|Untertitel des Ladebalkens, wenn Aufgabe geladen werden wird, aber noch nicht dran ist|in der Warteschleife|
|booklet_unitLoadingUnknownProgress|Untertitel des Ladebalkens, wenn Aufgabe geladen wird, Fortschritt aber unbekannt|wird geladen|
|booklet_warningLeaveTimerBlockTextPrompt|Schalterbeschriftung für 'Zurück zum Test'|Du verlässt einen zeitbeschränkten Bereich und kannst nicht zurückkehren. Trotzdem weiterblättern?|
|booklet_warningLeaveTimerBlockTitle|Titel für Warnung (Dialogbox) vor dem vorzeitigen Verlassen eines Abschnittes mit Timer|Aufgabenabschnitt verlassen?|
|gm_auto_checkall|Der 'Immer alle Auswählen'-Schalter|Alle Tests gleichzeitig steuern|
|gm_booklet_error_general|Fehleranzeige im Gruppen monitor: unbekannter Fehler|Fehler beim Zugriff auf Testheft-Datei!|
|gm_booklet_error_missing_file|Fehleranzeige im Gruppen monitor: Kein Zugriff auf Testheft-Datei!|Kein Zugriff auf Testheft-Datei!|
|gm_booklet_error_missing_id|Fehleranzeige im Gruppen monitor: Kein Testheft zugeordnet|Kein Testheft zugeordnet!|
|gm_booklet_error_xml|Fehleranzeige im Gruppen monitor: Invalides XML|Konnte Testheft-Datei nicht lesen!|
|gm_col_activity|Spalte: Aktivität|Aktivität|
|gm_col_booklet|Spalte: Testheft|Testheft|
|gm_col_group|Spalte: Gruppe|Gruppe|
|gm_col_person|Spalte: Teilnehmer|Teilnehmer|
|gm_col_testlet|Spalte: Block|Block|
|gm_col_unit|Spalte: Aufgabe|Aufgabe|
|gm_control_finish_everything|Control: Testung beenden|Testung beenden|
|gm_control_goto|Control: Springe zu Block|Springe zu|
|gm_control_goto_tooltip|Tooltip über dem 'Springe zu'-Knopf, der erscheint, wenn kein Block gewählt ist|Bitte Block auswählen|
|gm_control_pause|Control: pause|pause|
|gm_control_resume|Control: weiter|weiter|
|gm_control_unlock|Control: Entsperren|Test Entsperren|
|gm_control_unlock_success_warning|Wird angezeigt, wenn Tests entsperrt wurden|ACHTUNG! Die betreffenden Browser müssen ggf. neu gestartet werden.|
|gm_control_unlock_tooltip|Tooltip: Freigeben|Test Freigeben|
|gm_controls|Überschrift: Test-Steuerung|Test-Steuerung|
|gm_filter_locked|Filter: gesperrte ausblenden|gesperrte|
|gm_filter_pending|Filter: nicht gestartete ausblenden|nicht gestartete|
|gm_headline|Überschrift: Gruppenmonitor|Gruppenüberwachung|
|gm_hide_controls_tooltip|Tooltip: Test-Steuerung verbergen|Test-Steuerung verbergen|
|gm_menu_activity|Meinueintrag: Aktivität|Aktivität|
|gm_menu_cols|Meinueintrag: Spalten|Spalten|
|gm_menu_filter|Meinueintrag: Sitzungen ausblenden|Sitzungen ausblenden|
|gm_multiple_booklet_species_warning|Tooltip über dem 'Immer alle Auswählen'-Schalter, der erscheint, wenn dieser deaktiviert ist| - Die verwendeten Booklets sind zu unterschiedlich, um gemeinsam gesteuert zu werden.|
|gm_scroll_down|Control: Ganz nach unten|Ganz nach unten|
|gm_selection_info|Information gewählte Tests. Text-Substitutionen: (Alle/''), Anzahl, (''/s), Anzahl, (''/e)|%s %s Test%s mit %s Testheft%s ausgewählt.|
|gm_selection_info_none|Information gewählte Tests: Keiner|Kein Test gewählt.|
|gm_selection_text|Der Text im Button bei Auswahl der Testleitungskonsole|Überwachung starten|
|gm_selection_text_expired|Der Text im Button bei Auswahl der Testleitungskonsole, wenn die Gruppe abgelaufen ist. $date wird gegen das Ablaufdatum ersetzt.|Gruppe abgelaufen seit %date.|
|gm_selection_text_scheduled|Der Text im Button bei Auswahl der Testleitungskonsole, wenn die noch nicht freigegeben abgelaufen ist. $date wird gegen das Freigabedatum ersetzt.|Gruppe erst freigegeben ab %date.|
|gm_settings_tooltip|Control: Ansicht|Ansicht|
|gm_timeleft_tooltip|Tooltip zeitgesteuerter Block: verbleibende Zeit. Ersetzungen (%s): Verbleibende Minuten, Minuten gesamt|Verbleibende Zeit: %s von %s Minute(n)|
|gm_timemax_tooltip|Tooltip zeitgesteuerter Block: Noch nicht gestartet. Ersetzung (%s): Minutenzahl, |Zeitgesteuerter Block: %s Minute(n)|
|gm_timeup_tooltip|Tooltip zeitgesteuerter Block: Zeit abgelaufen|Zeit abgelaufen|
|gm_view_full|Ansicht: Vollständig|Vollständig|
|gm_view_medium|Ansicht: Nur Blöcke|Nur Blöcke|
|gm_view_small|Ansicht: Kurz|Kurz|
|login_bookletSelectPromptMany|Aufforderung, aus der Liste der gefundenen Tests einen auszusuchen (auf Schalter klicken)|Bitte klicke auf eine der Schaltflächen auf der linken Seite, um einen Test zu starten!|
|login_bookletSelectPromptNull|Nachricht für den Fall, dass Booklet(s) beendet wurden und keine weiteren zur Verfügung stehen|Beendet. Es können keine weiteren Testhefte gestartet werden.|
|login_bookletSelectPromptOne|Aufforderung, den einen gefundenen Test anzuklicken (auf Schalter klicken)|Bitte klicke auf die Schaltfläche auf der linken Seite, um den Test zu starten!|
|login_codeInputPrompt|Aufforderung, Code einzugeben (bei einem zweistufigen Login-Prozess)|Bitte Log-in eingeben, der auf dem Zettel steht!|
|login_codeInputTitle|Titel des Eingabeformulares für den Code|Log-in eingeben|
|login_pagesNaviPrompt|Aufforderungstext, weitere Seiten einer Unit auszuwählen, z. B. 'Wähle hier andere Seiten dieser Aufgabe:'|Weitere Seiten:|
|login_testEndButtonLabel|Schalterbeschriftung für 'Test beenden'|Test beenden|
|login_testResumeButtonLabel|Schalterbeschriftung für 'Test fortsetzen'|Test fortsetzen|
|login_unsupportedBrowser|Warnung auf de Startseite, wenn nicht unterstützer Browser verwendet wird. Ersetzungen (%s): Browser-Name, Browser-Version.|Ihr Browser <strong>%s %s</strong> wird von dieser Anwendung leider nicht offiziell unterstützt. Dies kann möglicherweise zu Fehlfunktionen führen! <br> Bitte verwenden Sie eine aktuelle Version von <a href='https://www.getfirefox.org' target='_blank'>Mozilla Firefox</a>, <a href='https://www.google.com/chrome/' target='_blank'>Google Chrome</a>, <a href='https://www.microsoft.com/en-us/edge/download' target='_blank'>Microsoft Edge</a> oder <a href='https://support.apple.com/downloads/safari' target='_blank'>Apple Safari.</a>|
|syscheck_intro|Text auf der ersten Seite des System-Checks|Dieser Systemcheck soll gewährleisten, dass der von Ihnen verwendete Computer für eine bestimmte Befragung oder Testung geeignet ist.|
|syscheck_questionsRequiredMessage|Nachricht an die Testperson, wenn einige Fragen, die als 'required' markiert sind, nicht beantwortet wurden|Bitte prüfen Sie die Eingaben (unvollständig):|
|syscheck_questionsintro|Aufforderung, die Fragen (Questionnaire) zu beantworten|Bitte bearbeiten Sie die nachfolgenden Fragen.|
|syscheck_report_aboutPassword|Dialog 'Bericht senden': Text über das Passworteingabefeld|Nur berechtigten Personen ist das Speichern erlaubt. Bitte geben Sie unten das System-Check-Kennwort ein, das Sie von der Projektleitung erhalten haben!|
|syscheck_report_aboutReportId|Dialog 'Bericht senden': Text über das Passworteingabefeld|Die ermittelten bzw. eingegebenen Informationen werden in der Datenbank so gespeichert, dass eine zusammenfassende Auswertung für eine bestimmte Studie möglich ist. Um den Bericht einem bestimmten '        + 'Projekt oder einer Studie zuordnen zu können, geben Sie bitte einen kurzen Text ein, der dann als Titel für den Bericht verwendet wird!|
|syscheck_report_id|Dialog 'Bericht senden': Platzhalter für das ID-Eingabefeld vor dem Senden des Berichts|Schul-ID|
|syscheck_unitPrompt|Titelzeile über der Aufgabe|Bitte prüfen Sie die folgenden Aufgaben-Elemente|
