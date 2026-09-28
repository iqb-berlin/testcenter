# Gruppenmonitor Statusmeldungen

Dies sind die verschiedenen Zustände laufender Tests, die im Gruppenmonitor angezeigt werden können.

Hintergrund: Es gibt eine Vielzahl möglicher Kombinationen von Zustandswerten eines laufenden Tests.
Manche Zustände werden vom Frontend gemeldet, wie z. B. `CONTROLLER`, andere kommen vom
Backend, etwa ob ein Test gesperrt ist. Ein Zustand umfasst eine Menge von Werten, die beschreiben,
ob der Test gestartet wurde, welche Unit zuletzt angezeigt wurde, die verbleibende Zeit, ein etwaiger
Fehler, ob der Test gesperrt ist usw. Dabei sind verschiedene Kombinationen möglich — ein Test kann
gleichzeitig gesperrt und pausiert sein. Um die Anzeige für die Testleitung übersichtlicher zu gestalten,
werden diese Kombinationen auf die folgenden Zustände (intern als Super-States bezeichnet) verdichtet.
Die Reihenfolge spiegelt die Priorität wider: Liegt ein Fehler vor, ist der Super-State `error`
— unabhängig davon, ob der Test gleichzeitig pausiert ist oder nicht.

<!--@include: ../generated/test-session-super-states.md-->
