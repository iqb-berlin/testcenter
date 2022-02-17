exports.superStates = {
  pending: {
    tooltip: 'Test noch nicht gestartet',
    icon: 'person_outline',
    description: 'The test has not been started yet.'
  },
  locked: {
    tooltip: 'Test gesperrt',
    icon: 'lock',
    description: 'This state is reached if the participant pressed ' +
      'the "Quit"-button or a supervisor hit the "Quit all"-button'
  },
  error: {
    tooltip: 'Es ist ein Fehler aufgetreten!',
    icon: 'error',
    class: 'danger',
    description: 'An error has occurred a the participants computer. Probably a network error or the like, ' +
      'but can also indicate bugs and should be investigated if possible. The participant should reload ' +
      'his browser and get support if the problem still exists.'
  },
  controller_terminated: {
    tooltip: 'Testausführung wurde beendet und kann wieder aufgenommen werden. ' +
      'Der Browser des Teilnehmers ist nicht verbunden und muss neu geladen werden!',
    icon: 'sync_problem',
    class: 'danger',
    description: 'Test execution has been completed and can be resumed. The browser of the participant is not ' +
      'connected and must be reloaded! Condition occurs when the "Unlock"-Button was used in the group monitor.'
  },
  connection_lost: {
    tooltip: 'Seite wurde verlassen oder Browserfenster geschlossen!',
    icon: 'error',
    class: 'danger',
    description: 'The connection to the participant\'s browser is demolished. He could have closed the ' +
      'window or the network connection is demolished.'
  },
  paused: {
    tooltip: 'Test pausiert',
    icon: 'pause'
  },
  focus_lost: {
    tooltip: 'Fenster/Tab wurde verlassen!',
    icon: 'warning',
    class: 'danger',
    description: 'Another window or another tab was selected, but the site is still open and connected.'
  },
  idle: {
    tooltip: 'Test ist 5 Minuten oder länger inaktiv!',
    icon: 'hourglass_full',
    description: 'The participant was idle for five minutes or longer. This state can only be displayed on polling ' +
      'mode and is intended to be a fallback for the case that the participant\'s browser or computer was shut down ' +
      'and not able to report the lost connection. It\' s not appropriate to measure testees behaviour.'
  },
  connection_websocket: {
    tooltip: 'Test läuft, Verbindung ist live',
    icon: 'play_circle_filled',
    class: 'success',
    description: 'Test runs and participant is connected in live mode (= WebSocket).'
  },
  connection_polling: {
    tooltip: 'Test läuft',
    icon: 'play_circle_outline',
    class: 'success',
    description: 'Test runs and participant is connected in the polling mode connection. This si a fallback for the ' +
      'case that the live-mode is not possible due to the supervisor\'s browser or a technical error. It works the ' +
      'same but the monitors performance is less smooth because new data is polled every 5 seconds and not pushed' +
      'when there is anything.'
  },
  ok: {
    tooltip: 'Test läuft',
    icon: 'play_circle_filled',
    description: 'Test seems to run but the connection type is unknown. This is is more or less a fallback state ' +
      'which indicates, that nothing is known about the test except for it\'s existence. This could be the case in ' +
      'various error-scenarios or misconfigurations but should not happen in general. It should be investigated, ' +
      'but most likely the test can be continued safely since the error is more likely on the monitor\'s side.'
  }
};
