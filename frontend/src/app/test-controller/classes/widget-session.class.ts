import { Observable, Subscription, timer } from 'rxjs';
import { SharedParameter } from '../interfaces/verona.interfaces';
import { VowStartCommand, WidgetParameter } from '../interfaces/widget.interfaces';
import { parseWidgetMessage } from '../util/widget-message.util';

const READY_TIMEOUT_MS = 15000;

// Session ids only have to be unique within the page, so a counter is enough.
let lastSessionId = 0;

export interface WidgetSessionOptions {
  // the widget's iframe window: messages from elsewhere are ignored, the start command goes there
  window: Window;
  // all messages the Testcenter window receives
  messages: Observable<MessageEvent>;
  parameters: WidgetParameter[];
  sharedParameters: SharedParameter[];
  // state from an earlier session, handed to the widget at the start
  state?: string;
  onReady: () => void;
  onStateChanged: (state: string | undefined, sharedParameters: SharedParameter[] | undefined) => void;
  // state is the latest one received, from the return message or an earlier state change
  onReturn: (state: string | undefined, saveState: boolean) => void;
  onError: (error: Error) => void;
}

type SessionStatus =
  { status: 'waiting' } |
  { status: 'running'; sessionId: string; latestTimeStamp: number; state: string | undefined } |
  { status: 'finished' };

// Runs the message exchange with one opened widget: wait for ready, send the start command, receive state changes
// until the widget asks to return. Knows nothing about windows or specific widgets.
export class WidgetSession {
  private readonly subscriptions = new Subscription();
  private readonly readyTimeout: Subscription;
  private session: SessionStatus = { status: 'waiting' };

  constructor(private readonly options: WidgetSessionOptions) {
    this.readyTimeout = timer(READY_TIMEOUT_MS)
      .subscribe(() => this.fail(new Error('Widget did not report ready in time')));
    this.subscriptions.add(this.readyTimeout);
    this.subscriptions.add(options.messages.subscribe(event => this.handleMessage(event)));
  }

  close(): void {
    this.session = { status: 'finished' };
    this.subscriptions.unsubscribe();
  }

  private fail(error: Error): void {
    this.close();
    this.options.onError(error);
  }

  private handleMessage(event: MessageEvent): void {
    const data: unknown = event.data;
    if (event.source !== this.options.window || data === null || typeof data !== 'object' || !('type' in data)) {
      return;
    }
    if (data.type === 'vowReadyNotification') {
      if (this.session.status === 'waiting') this.start();
      return;
    }
    if (this.session.status !== 'running') return;
    const session = this.session;

    let message;
    try {
      message = parseWidgetMessage(data);
    } catch (error) {
      console.warn('Widget message rejected:', error, data);
      return;
    }
    if (message.sessionId !== session.sessionId) {
      console.warn('Widget message for another session rejected:', data);
      return;
    }

    // The timeStamp is there to ignore messages that arrive later than a newer one.
    if (message.timeStamp >= session.latestTimeStamp) {
      session.latestTimeStamp = message.timeStamp;
      if (message.state !== undefined) session.state = message.state;
      if (message.state !== undefined || message.sharedParameters !== undefined) {
        this.options.onStateChanged(message.state, message.sharedParameters);
      }
    }
    if (message.type === 'vowReturnRequested') {
      this.close();
      this.options.onReturn(session.state, message.saveState);
    }
  }

  private start(): void {
    lastSessionId += 1;
    const sessionId = String(lastSessionId);
    const command: VowStartCommand = {
      type: 'vowStartCommand',
      sessionId,
      parameters: this.options.parameters,
      sharedParameters: this.options.sharedParameters,
      ...(this.options.state !== undefined ? { state: this.options.state } : {})
    };
    this.readyTimeout.unsubscribe();
    this.session = { status: 'running', sessionId, latestTimeStamp: -Infinity, state: this.options.state };
    this.options.window.postMessage(command, '*');
    this.options.onReady();
  }
}
