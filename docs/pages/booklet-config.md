---
layout: default
---

# Testheft-Konfiguration
 
Testhefte (booklets) können in der XML-Datei innerhalb eines _BookletConfig_-Blockes definiert werden.
Beispiel:
```
<BookletConfig>
    <Config key="force_responses_complete">OFF</CustomText>
    <Config key="unit_navibuttons">ARROWS_ONLY</CustomText>
</BookletConfig>
```

## Liste der Parameter

>### Ladeverhalten beim Start
> loading_mode
> 
> * "lazy" - Start sobald der erste Block (_testlet_) geladen ist. Laden des restlichen Testheftes wird im Hintergrund fortgesetzt.<br>
> Dieser Modus kann zu uneinheitlichen Ladezeiten der Testteilnehmer:innen führen!
> * "eager" - Start sobald alle Inhalte geladen sind<br><br>
> _Standard: lazy_

>### Protokollierung
> logPolicy
> * "disabled" - Ausgeschaltet
> * "lean" - Nur wichtige Meldungen
> * "rich" - Alles außer debug-Informationen
> * "debug" - Auch debug-Informationen<br><br>
> _Standard: rich_

>### Seitendarstellung
> pagingMode
> * "separate" - Separate Seiten zum Blättern
> * "concat-scroll" - Seiten werden untereinander dargestellt - ohne Blättern.
> * "concat-scroll-snap" - Seiten werden untereinander dargestellt mit Einratfunktion an Seitenanfängen<br><br>
> _Standard: separate_

>### Seitennavigation (innerhalb einer Aufgabe)
> page_navibuttons
> * "OFF" - Keine Seitennavigation unterstützen (übernimmt ggf. die Aufgabe selbst)
> * "SEPARATE_BOTTOM" - Seitennavigation über getrennte Button-Leiste - unten<br><br>
> _Standard: SEPARATE_BOTTOM_

>### Aufgabennavigation
> unit_navibuttons
> * "OFF" - Keine Knöpfe für Aufgabennavigation anzeigen (übernimmt ggf. die Aufgabe selbst)
> * "ARROWS_ONLY" - Nur die Knöpfe für 'Weiter' und 'Zurück' anzeigen
> * "FULL" - Knöpfe für 'Weiter' und 'Zurück' und dazwischen kleine Knöpfe für jede Aufgabe<br><br>
> _Standard: FULL_

>### Seitliches Menü 
> unit_menu
> * "OFF" - Ausgeblendet
> * "FULL" - Eingeblendet<br><br>
> _Standard: OFF_

>### Verlassen unvollständig angezeigter Aufgaben
> force_presentation_complete
> * "OFF" - Verlassen erlaubt
> * "ALWAYS" - Verlassen immer verboten
> * "ON" - Verlassen nur beim vorwärts Blättern verboten<br><br>
> _Standard: OFF_

>### Verlassen unvollständig bearbeiteter Aufgaben
> force_response_complete
> * "OFF" - Verlassen erlaubt
> * "ALWAYS" - Verlassen immer verboten
> * "ON" - Verlassen nur beim vorwärts Blättern verboten<br><br>
> _Standard: OFF_

>### Aussehen Unit-Navigation-Knöpfe
> controller_design
> * "2018" - Runde Schalter
> * "2022" - Eckige Schalter<br><br>
> _Standard: 2022_

>### Kopfbereich
> unit_screenheader<br><br>
>Legt fest, ob im obersten Seitenbereich Platz für Logo, Navigations-Buttons u. ä. gelassen wird.
> * "OFF" - Kein Seitenkopf. Achtung: Logo bleibt sichtbar (überlappt).
> * "WITH_UNIT_TITLE" - Seitenkopf wird angezeigt mit Titel der Unit (s. Booklet-XML)
> * "WITH_BOOKLET_TITLE" - Seitenkopf wird angezeigt mit Titel des Booklets (s. Booklet-XML)
> * "WITH_BLOCK_TITLE" - Seitenkopf wird angezeigt mit Titel des Aufgabenblocks (s. Booklet-XML)
> * "EMPTY" - Seitenkopf wird angezeigt (leer)<br><br>
> _Standard: EMPTY_

>### Unit-Titel
> unit_title
> * "OFF" - Keine Titelzeile
> * "ON" - Eine Zeile wird eingeblendet mit dem Unit-Titel (s. Booklet-XML)<br><br>
> _Standard: ON_

>### Anzeige verbleibender Zeit
> unit_show_time_left
> * "OFF" - Die verbleibende Zeit wird nicht angezeigt.
> * "ON" - Die verbleibende Zeit wird angezeigt.<br><br>
> _Standard: OFF_

>### Warnmeldung über verbleibende Zeit 
> unit_time_left_warnings<br><br>
>Konfiguriert, bei wie vielen verbleibenden Minuten im zeitbeschränkten Block eine Warnung angezeigt werden soll. Beliebige Werte sind möglich. Der Wert "10,5,1" würde zum Beispiel bedeuten, dass bei zehn, fünf und bei einer verbleibenden Minute jeweils eine Warnung angezeigt wird. Wird der Parameter angegeben, aber leer gelassen oder enthält keine Zahlen, so werden keine Warnungen dieser Art angezeigt.
> * 5,1<br><br>
> _Standard: keiner_

>### Test-Beenden-Knopf im Player anzeigen
> show_end_button_in_player<br><br>
>Manche Player können einen Test-Beenden-Knopf anzeigen, wenn es es ihnen vom Testcenter erlaubt wird. Diese Einstellung legt fest, wann das der Fall ist.
> * "OFF" - Den Test-Beenden-Button im Player nie anzeigen.
> * "ALWAYS" - Den Test-Beenden-Button im Player immer anzeigen.
> * "ONLY_LAST_UNIT" - Den Test-Beenden-Button im Player nur in der letzten Unit anzeigen.<br><br>
> _Standard: OFF_

>### Seitenposition bei erneuten Aufruf
> restore_current_page_on_return<br><br>
>Legt fest, ob, wenn (z. B.) nach einem Neuladen eine Unit wieder geöffnet wird, zur letzten geöffneten Seite gesprungen werden soll.
> * "OFF" - Beim Zurückkehren zur Unit auf Seite 1 beginnen
> * "ON" - Beim Zurückkehren zur Unit auf der letzten gesehenen Seite beginnen<br><br>
> _Standard: OFF_

>### Test-Beenden via Player
> allow_player_to_terminate_test<br><br>
>Legt fest, ob der Player des laufenden Test beenden darf, in dem er z. B. einen entsprechenden Navigationsknopf zeigt.
> * "OFF" - Der Player darf den laufenden Test nicht beenden.
> * "LAST_UNIT" - Der Player darf den laufenden Test nur Beenden, wenn die letzte Unit erreicht ist.
> * "ON" - Der Player darf den laufenden Test immer beenden. (`force_presentation_complete` und `force_response_complete` gelten trotzdem!).<br><br>
> _Standard: ON_

>### Test nach dem Beenden sperren
> lock_test_on_termination
> Ein gesperrter Test kann nicht erneut geöffnet und bearbeitet werden. Dadurch wird Betrug verhindert.
> Es kann allerdings zu Problemen führen, wenn ein Test versehentlich beendet/gesperrt wird. Dieser kann dann nur über den 
> Gruppenmonitor entsperrt werden.
> * "ON" - Test wird gesperrt, wenn er beendet wird
> * "OFF" - Test kann nach dem Beenden wieder aufgerufen werden<br><br>
> _Standard: OFF_

>### Abfrage zur Vollbild-Anzeige
> ask_for_fullscreen<br><br>
> Legt fest, ob beim Starten des Tests eine Abfrage erscheinen soll, ihn im Vollbild anzuzeigen.
> * "ON" - Wird angezeigt
> * "OFF" - Nicht angezeigt<br><br>
> _Standard: OFF_

>### show_fullscreen_button
> show_fullscreen_button<br><br>
> Legt fest, ob ein Knopf zur Vollbild-Anzeige in der Titelleiste eingeblendet werden soll.
> * "ON" - Wird angezeigt
> * "OFF" - Nicht angezeigt<br><br>
> _Standard: OFF_
