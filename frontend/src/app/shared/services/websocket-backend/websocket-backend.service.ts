import {
  Inject, Injectable, OnDestroy, SkipSelf
} from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { WebsocketService } from '../websocket/websocket.service';
import { ConnectionStatus, ConnectionStatusWs } from '../../interfaces/websocket-backend.interfaces';

@Injectable()
export abstract class WebsocketBackendService<T> extends WebsocketService implements OnDestroy {
  protected abstract pollingEndpoint: string;
  protected abstract pollingInterval: number;
  protected abstract wsChannelName: string;
  protected abstract initialData: T;

  data$: BehaviorSubject<T> | null = null;
  connectionStatus$: BehaviorSubject<ConnectionStatus> = new BehaviorSubject<ConnectionStatus>('initial');

  private wsConnectionStatusSubscription: Subscription | null = null;
  private wsDataSubscription: Subscription | null = null;
  private pollingTimeoutId: number | null = null;

  protected connectionClosed = true;

  constructor(
    @Inject('BACKEND_URL') protected serverUrl: string,
    @SkipSelf() protected http: HttpClient
  ) {
    super();
  }

  ngOnDestroy(): void {
    this.cutConnection();
  }

  protected observeEndpointAndChannel(): Observable<T> {
    if (!this.data$) {
      this.data$ = new BehaviorSubject<T>(this.initialData);
      this.pollEndpointAndSubscribeWs();
    }
    return this.data$;
  }

  private pollEndpointAndSubscribeWs(): void {
    this.connectionClosed = false;

    this.unsubscribeFromWebsocket();

    this.connectionStatus$.next('polling-fetch');

    this.http
      .get<T>(this.serverUrl + this.pollingEndpoint, { observe: 'response' })
      .subscribe((response: HttpResponse<T>) => {
        if (!this.data$) {
          return;
        }
        if (!response.body) {
          return;
        }
        this.data$.next(response.body);
        if (response.headers.has('SubscribeURI')) {
          this.wsUrl = response.headers.get('SubscribeURI') as string;
          this.subScribeToWsChannel();
        } else {
          this.connectionStatus$.next('polling-sleep');
          this.scheduleNextPoll();
        }
      });
  }

  cutConnection(): void {
    this.unsubscribeFromWebsocket();
    this.completeConnection();

    if (this.pollingTimeoutId) {
      clearTimeout(this.pollingTimeoutId);
      this.pollingTimeoutId = null;
    }

    this.data$ = null;
  }

  private scheduleNextPoll(): void {
    if (this.pollingTimeoutId) {
      clearTimeout(this.pollingTimeoutId);
    }

    this.pollingTimeoutId = window.setTimeout(
      () => {
        if (!this.connectionClosed) {
          this.pollEndpointAndSubscribeWs();
        }
      },
      this.pollingInterval
    );
  }

  private unsubscribeFromWebsocket() {
    if (this.wsConnectionStatusSubscription) {
      this.wsConnectionStatusSubscription.unsubscribe();
      this.wsConnectionStatusSubscription = null;
    }

    if (this.wsDataSubscription) {
      this.wsDataSubscription.unsubscribe();
      this.wsDataSubscription = null;
    }
  }

  private subScribeToWsChannel() {
    if (this.wsDataSubscription) {
      return;
    }

    this.wsDataSubscription = this.getChannel<T>(this.wsChannelName)
      .subscribe((dataObject: T) => this.data$?.next(dataObject)); // subscribe only next, not complete!

    this.wsConnectionStatusSubscription = this.wsConnected$
      .pipe(
        tap((wsConnected: ConnectionStatusWs) => {
          if (wsConnected === 'disconnected') {
            this.scheduleNextPoll();
          }
        }),
        map((wsc: ConnectionStatusWs): ConnectionStatus => (wsc === 'connected' ? 'ws-online' : 'ws-offline'))
      )
      .subscribe(this.connectionStatus$);
  }
}
