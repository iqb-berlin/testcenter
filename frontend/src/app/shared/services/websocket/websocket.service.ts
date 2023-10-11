/* eslint-disable @typescript-eslint/no-explicit-any */
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { catchError, map, share } from 'rxjs/operators';
import { WebSocketMessage } from 'rxjs/internal/observable/dom/WebSocketSubject';

interface WsMessage {
  event: string;
  data: any;
}

export class WebsocketService {
  protected wsUrl = '';
  private wsSubject$: WebSocketSubject<any> | null = null;
  wsConnected$ = new BehaviorSubject<boolean>(false);
  private wsSubscription: Subscription | null = null;

  connect(): void {
    if (!this.wsSubject$) {
      this.wsSubject$ = webSocket({
        deserializer(event: MessageEvent): any {
          return JSON.parse(event.data);
        },
        serializer(value: any): WebSocketMessage {
          return JSON.stringify(value);
        },
        openObserver: {
          next: () => {
            this.wsConnected$.next(true);
          }
        },
        url: this.wsUrl
      });

      this.wsSubscription = this.wsSubject$
        .subscribe({
          next: () => {
          },
          error: () => {
            this.closeConnection();
          },
          complete: () => {
            this.closeConnection();
          }
        });
    }
  }

  protected closeConnection(): void {
    this.wsConnected$.next(false);
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    if (this.wsSubject$) {
      this.wsSubject$.complete();
      this.wsSubject$ = null;
    }
  }

  send(event: string, data: any): void {
    if (!this.wsSubject$) {
      this.connect();
    }

    this.wsSubject$?.next({ event, data });
  }

  getChannel<T>(channelName: string): Observable<T> {
    if (!this.wsSubject$) {
      this.connect();
    }
    if (!this.wsSubject$) {
      throw new Error('Websocket connection failed and fallback as well.');
    }

    return this.wsSubject$?.multiplex(
      () => ({ event: `subscribe:${channelName}` }),
      () => ({ event: `unsubscribe:${channelName}` }),
      message => (message.event === channelName)
    )
      .pipe(
        catchError(() => of()),
        map((event: WsMessage): T => event.data),
        share()
      );
  }
}
