---
layout: default
---

# Booklet config
There are some configuration parameters for adjusting the behaviour during the test.This 
document describes the ways to bring the parameters to the application and lists
all possible keys.
 
## Configuration via booklet XML
The configuration can be set for every single booklet. You need to add one XML-Element 
into the booklet-file. Example:
```
...
</Metadata>
<BookletConfig>
    <Config key="force_responses_complete">OFF</CustomText>
    <Config key="unit_navibuttons">ARROWS_ONLY</CustomText>
...
</BookletConfig>
```

## List of parameters

### loading_mode
Ladeverhalten beim Start
 * **"LAZY" - Start sobald wie möglich, Laden im Hintergrund fortsetzen**
 * "EAGER" - Testheft erst dann starten, wenn alle Inhalte geladen sind

### logPolicy
Erfassen und Speichern von Log-Daten
 * "disabled" - Ausgeschaltet
 * "lean" - Nur wichtige Meldungen
 * **"rich" - Alles außer debug-Informationen**
 * "debug" - Auch debug-Informationen

### pagingMode
pagingMode (https://verona-interfaces.github.io/player/#operation-publish-vopStartCommand)
 * **"separate" - pages are separated**
 * "concat-scroll" - concat-scroll
 * "concat-scroll-snap" - concat-scroll-snap

### page_navibuttons
Navigationsbuttons für die Seitennavigation (innerhalb einer Aufgabe)
 * "OFF" - Keine Seitennavigation unterstützen (übernimmt ggf. die Aufgabe selbst)
 * **"SEPARATE_BOTTOM" - Seitennavigation über getrennte Button-Leiste - unten**

### unit_navibuttons
Navigationsbuttons für die Navigation zwischen den Aufgaben
 * "OFF" - Keine Buttons für Aufgabennavigation anzeigen (übernimmt ggf. die Aufgabe selbst)
 * "ARROWS_ONLY" - Nur die Buttons für 'Weiter' und 'Zurück' anzeigen
 * "FORWARD_ONLY" - Nur der Vorwärtsbutton soll gezeigt werden
 * **"FULL" - Buttons für 'Weiter' und 'Zurück' und dazwischen kleine Buttons für jede Aufgabe anzeigen**

### unit_menu
Der Knopf- für die Unit-Menü-Sidebar soll angezeigt werden
 * **"OFF" - Nein**
 * "FULL" - Ja

### force_presentation_complete
Legt fest, ob eine eine Aufgabe verlassen werden darf, die noch nicht vollständig angezeigt wurde
 * **"OFF" - Das Verlassen der unvollständig betrachteten Aufgabe wird nicht verhindert.**
 * "ALWAYS" - Das Verlassen der unvollständig betrachteten Aufgabe wird verhindert.
 * "ON" - Das Verlassen der unvollständig betrachteten Aufgabe wird verhindert, wenn vorwärts geblättert werden soll.

### force_response_complete
Legt fest, ob eine eine Aufgabe verlassen werden darf, die noch nicht beantwortet wurde
 * **"OFF" - Das Verlassen der unvollständig beantworteten Aufgabe wird nicht verhindert.**
 * "ALWAYS" - Das Verlassen der unvollständig beantworteten Aufgabe wird verhindert.
 * "ON" - Das Verlassen der unvollständig beantworteten Aufgabe wird verhindert, wenn vorwärts geblättert werden soll.

### controller_design
Über diesen Parameter können verschiedene Design-Einstellungen gemeinsam festgelegt werden
 * "2018" - Runde Schalter für die Unit-Navigation
 * **"2022" - Eckige Schalter für die Unit-Navigation**

### unit_screenheader
Legt fest, ob im obersten Seitenbereich Platz für Logo, Navigations-Buttons u. ä. gelassen wird.
 * "OFF" - Kein Seitenkopf. Achtung: Logo bleibt sichtbar (überlappt).
 * "WITH_UNIT_TITLE" - Seitenkopf wird angezeigt mit Titel der Unit (s. Booklet-XML)
 * "WITH_BOOKLET_TITLE" - Seitenkopf wird angezeigt mit Titel des Booklets (s. Booklet-XML)
 * "WITH_BLOCK_TITLE" - Seitenkopf wird angezeigt mit Titel des Aufgabenblocks (s. Booklet-XML)
 * **"EMPTY" - Seitenkopf wird angezeigt (leer)**

### unit_title
Festlegung, ob oberhalb des Unitbereiches eine Zeile mit dem Unit-Titel gezeigt werden soll
 * "OFF" - Keine Titelzeile
 * **"ON" - Eine Zeile wird eingeblendet mit dem Unit-Titel (s. Booklet-XML).**

### unit_show_time_left
Festlegung, ob im obersten Seitenbereich bei einer festgelegten Maximalzeit für einen Testbereich die verbleibende Zeit angezeigt wird.
 * **"OFF" - Die verbleibende Zeit wird nicht angezeigt.**
 * "ON" - Die verbleibende Zeit wird angezeigt.

### unit_time_left_warnings
Konfiguriert, bei wie vielen verbleibenden Minuten im zeitbeschränkten Block eine Warnung angezeigt werden soll. Beliebige Werte sind möglich. Der Wert "10,5,1" würde zum Beispiel bedeuten, dass bei zehn, fünf und bei einer verbleibenden Minute jeweils eine Warnung angezeigt wird. Wird der Parameter angegeben, aber leer gelassen oder enthält keine Zahlen, so werden keine Warnungen dieser Art angezeigt.
 * **5,1**

### show_end_button_in_player
Manche Player können einen Test-Beenden anzeigen, wenn es es ihnen vom Testcenter erlaubt wird. Diese Einstellung legt fest, wann das der Fall ist.
 * **"OFF" - Den Test-Beenden-Button im Player nie anzeigen.**
 * "ALWAYS" - Den Test-Beenden-Button im Player immer anzeigen.
 * "ONLY_LAST_UNIT" - Den Test-Beenden-Button im Player nur in der letzten Unit anzeigen.

### restore_current_page_on_return
Legt fest, ob, wenn (z. B.) nach einem Neuladen eine Unit wieder geöffnet wird, zur letzten geöffneten Seite gesprungen werden soll.
 * **"OFF" - Beim Zurückkehren zur Unit auf Seite 1 beginnen.**
 * "ON" - Beim Zurückkehren zur Unit auf der letzten gesehenen Seite beginnen.

### allow_player_to_terminate_test
Legt fest, ob der Player des laufenden Test beenden darf, in dem er z. B. einen entsprechenden Navigationsknopf zeigt.
 * "OFF" - Der Player darf den laufenden Test nicht beenden.
 * "LAST_UNIT" - Der Player darf den laufenden Test nur Beenden, wenn die letzte Unit erreicht ist.
 * **"ON" - Der Player darf den laufenden test immer beenden. (`force_presentation_complete` und `force_response_complete` gelten trotzdem!).**

### lock_test_on_termination
Legt fest, ob der test gesperrt werden soll, wenn er beendet wird. Dies ist mit Vorsicht zu benutzen.
 * "ON" - Ja, der Test soll gesperrt werden, wenn er beendet wird. Dies ist mit Vorsicht zu benutzen.
 * **"OFF" - Nein, der test kann nach dem Beenden wieder aufgerufen werden, so lange der account aktiv ist.**

### ask_for_fullscreen
Soll beim starten des Booklets eine Aufforderung erscheinen ins Vollbild zu gehen?
 * "ON" - Ja.
 * **"OFF" - Nein.**

### show_fullscreen_button
Soll ein Knopf für Vollbild in der Titelleiste angezeigt werden?
 * "ON" - Ja.
 * **"OFF" - Nein.**

### show_reload_button
Soll ein Knopf für 'Seite neu laden' in der Titelleiste angezeigt werden?
 * "ON" - Ja.
 * **"OFF" - Nein.**

### unit_responses_buffer_time
Speicherfrequenz für Antworten in Ms.
 * **5000**

### unit_state_buffer_time
Speicherfrequenz für Unit-Zustände (zB responseProgress etc.) in Ms.
 * **6000**

### test_state_buffer_time
Speicherfrequenz für Test-Zustände in Ms.
 * **1000**
