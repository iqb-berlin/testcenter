import { Observable, Subscription, timer } from 'rxjs';
import { WidgetCall, WidgetParameter, WidgetStartCommand } from '../interfaces/widget.interfaces';
import { widgetEvent } from '../util/widget-event.util';
import { widgetName } from '../util/widget-start.util';

interface WidgetSessionOptions {
  call: WidgetCall;
  window: Window;
  messages: Observable<MessageEvent>;
  sharedParameters: WidgetParameter[];
  state: string | undefined;
  onReady: (name: string) => void;
  onState: (state: string) => void;
  onSharedParameters: (parameters: WidgetParameter[]) => void;
  onReturn: (state: string | undefined, saveState: boolean) => void;
  onError: (error: unknown) => void;
}

export class WidgetSession {
  private readonly subscriptions = new Subscription();
  private readonly timeout: Subscription;
  private session: { kind: 'waiting' } | {
    kind: 'running'; id: string; latestTimestamp: number; state: string | undefined;
  } | { kind: 'finished' } = { kind: 'waiting' };

  constructor(private readonly options: WidgetSessionOptions) {
    this.timeout = timer(15000).subscribe(() => this.fail(new Error('Widget ready timeout')));
    this.subscriptions.add(this.timeout);
    this.subscriptions.add(options.messages.subscribe(event => this.handleMessage(event)));
  }

  close(): void {
    this.session = { kind: 'finished' };
    this.subscriptions.unsubscribe();
  }

  private fail(error: unknown): void {
    this.close();
    this.options.onError(error);
  }

  private handleMessage(event: MessageEvent): void {
    const message: unknown = event.data;
    if (event.source !== this.options.window || message === null || typeof message !== 'object' ||
      !('type' in message) || this.session.kind === 'finished') return;
    if (message.type === 'vowReadyNotification') {
      if (this.session.kind === 'waiting') this.start('metadata' in message ? message.metadata : undefined);
      return;
    }
    if (this.session.kind !== 'running' ||
      (message.type !== 'vowStateChangedNotification' && message.type !== 'vowReturnRequested')) return;
    const session = this.session;
    let update;
    try {
      update = widgetEvent(message);
    } catch (error) {
      console.warn('Widget message rejected:', this.options.call.widgetType, error);
      return;
    }
    if (update.sessionId !== session.id) {
      console.warn('Widget message has wrong session:', this.options.call.widgetType, update.sessionId);
      return;
    }
    if (update.timeStamp >= session.latestTimestamp) {
      session.latestTimestamp = update.timeStamp;
      if (update.state !== undefined) {
        session.state = update.state;
        this.options.onState(update.state);
      }
      if (update.sharedParameters !== undefined) this.options.onSharedParameters(update.sharedParameters);
    }
    if (update.type === 'vowReturnRequested' && this.session === session) {
      this.close();
      this.options.onReturn(session.state, update.saveState);
    }
  }

  private start(metadata: unknown): void {
    try {
      const name = widgetName(metadata, this.options.call.widgetType);
      const command: WidgetStartCommand = {
        type: 'vowStartCommand',
        sessionId: Array.from(crypto.getRandomValues(new Uint8Array(16)),
                              byte => byte.toString(16).padStart(2, '0')).join(''),
        parameters: this.options.call.parameters,
        sharedParameters: this.options.sharedParameters,
        ...(this.options.state !== undefined ? { state: this.options.state } : {})
      };
      this.session = { kind: 'running', id: command.sessionId, latestTimestamp: -Infinity, state: this.options.state };
      this.timeout.unsubscribe();
      this.options.window.postMessage(command, '*');
      if (this.options.state !== undefined) this.options.onState(this.options.state);
      this.options.onReady(name);
    } catch (error) { this.fail(error); }
  }
}
