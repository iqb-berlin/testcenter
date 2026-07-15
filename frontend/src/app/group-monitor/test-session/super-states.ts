import { TestSessionSuperState } from '../group-monitor.interfaces';

export interface IconData {
  icon: string;
  tooltip: string;
  class?: string;
  description?: string;
}

export const superStates: Partial<Record<TestSessionSuperState, IconData>> = {
  pending: {
    tooltip: 'Test noch nicht gestartet',
    icon: 'person_outline',
    description: 'Der Test wurde noch nicht gestartet.'
  },
  locked: {
    tooltip: 'Test gesperrt',
    icon: 'lock',
    description: 'Dieser Zustand wird erreicht, wenn die Testperson den „Test beenden"-Knopf gedrückt hat ' +
      'oder eine Testleitung den „Alle beenden"-Knopf betätigt hat.'
  },
  error: {
    tooltip: 'Es ist ein Fehler aufgetreten!',
    icon: 'error',
    class: 'danger',
    description: 'Auf dem Gerät der Testperson ist ein Fehler aufgetreten — wahrscheinlich ein Netzwerkfehler ' +
      'oder Ähnliches. Der Fehler kann aber auch auf einen Programmfehler hinweisen und sollte nach Möglichkeit ' +
      'untersucht werden. Die Testperson sollte den Browser neu laden und bei anhaltenden Problemen Unterstützung ' +
      'anfordern.'
  },
  controller_terminated: {
    tooltip: 'Testausführung wurde beendet und kann wieder aufgenommen werden. ' +
      'Der Browser des Teilnehmers ist nicht verbunden und muss neu geladen werden!',
    icon: 'sync_problem',
    class: 'danger',
    description: 'Die Testausführung wurde beendet und kann wieder aufgenommen werden. Der Browser der ' +
      'Testperson ist nicht verbunden und muss neu geladen werden. Dieser Zustand tritt auf, wenn der ' +
      '„Entsperren"-Knopf im Gruppenmonitor verwendet wurde.'
  },
  connection_lost: {
    tooltip: 'Seite wurde verlassen oder Browserfenster geschlossen!',
    icon: 'warning_amber',
    class: 'danger',
    description: 'Die Verbindung zum Browser der Testperson wurde unterbrochen. Die Testperson hat ' +
      'möglicherweise das Fenster geschlossen oder die Netzwerkverbindung ist abgebrochen.'
  },
  paused: {
    tooltip: 'Test pausiert',
    icon: 'pause',
    description: 'Der Test wurde durch den Monitor pausiert.'
  },
  focus_lost: {
    tooltip: 'Fenster/Tab wurde verlassen!',
    icon: 'warning',
    class: 'danger',
    description: 'Ein anderes Fenster oder ein anderer Tab wurde in den Vordergrund gebracht, ' +
      'die Seite ist jedoch weiterhin geöffnet und verbunden.'
  },
  idle: {
    tooltip: 'Test ist 5 Minuten oder länger inaktiv!',
    icon: 'hourglass_full',
    description: 'Die Testperson war fünf Minuten oder länger inaktiv. Dieser Zustand kann nur im ' +
      'Polling-Modus angezeigt werden und dient als Fallback für den Fall, dass der Browser oder das Gerät ' +
      'der Testperson unerwartet beendet wurde und den Verbindungsabbruch nicht mehr melden konnte. ' +
      'Er ist nicht geeignet, um das Verhalten von Testpersonen zu messen.'
  },
  connection_websocket: {
    tooltip: 'Test läuft, Verbindung ist live',
    icon: 'play_circle',
    class: 'success',
    description: 'Der Test läuft und die Testperson ist im Live-Modus verbunden (WebSocket).'
  },
  connection_polling: {
    tooltip: 'Test läuft',
    icon: 'play_circle_outline',
    class: 'success',
    description: 'Der Test läuft und die Testperson ist über eine Polling-Verbindung verbunden. ' +
      'Dies ist ein Fallback für den Fall, dass der Live-Modus aufgrund des Browsers der Testleitung ' +
      'oder eines technischen Fehlers nicht verfügbar ist. Die Funktionsweise ist identisch, jedoch ' +
      'ist die Anzeige im Monitor weniger flüssig, da neue Daten alle 5 Sekunden abgerufen und nicht ' +
      'sofort übertragen werden.'
  },
  ok: {
    tooltip: 'Test läuft',
    icon: 'play_circle',
    description: 'Der Test scheint zu laufen, der Verbindungstyp ist jedoch unbekannt. Dies ist ein ' +
      'Fallback-Zustand, der anzeigt, dass über den Test außer seiner bloßen Existenz nichts bekannt ist. ' +
      'Er kann in verschiedenen Fehlerszenarien oder bei Fehlkonfigurationen auftreten, sollte aber ' +
      'regulär nicht vorkommen. Der Zustand sollte untersucht werden — der Test kann in den meisten ' +
      'Fällen jedoch sicher fortgesetzt werden, da der Fehler wahrscheinlich auf der Seite des ' +
      'Monitors liegt.'
  }
};