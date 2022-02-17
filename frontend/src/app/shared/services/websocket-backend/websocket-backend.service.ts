import {
  Inject, Injectable, OnDestroy, SkipSelf
} from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import {
  catchError, map, skipWhile, tap
} from 'rxjs/operators';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { ApiError } from '../../../app.interfaces';
import { WebsocketService } from '../websocket/websocket.service';
import { ConnectionStatus } from '../../interfaces/websocket-backend.interfaces';

@Injectable()
export abstract class WebsocketBackendService<T> extends WebsocketService implements OnDestroy {
  protected abstract pollingEndpoint: string;
  protected abstract pollingInterval: number;
  protected abstract wsChannelName: string;
  protected abstract initialData: T;

  data$: BehaviorSubject<T>;
  connectionStatus$: BehaviorSubject<ConnectionStatus> = new BehaviorSubject<ConnectionStatus>('initial');

  private wsConnectionStatusSubscription: Subscription = null;
  private wsDataSubscription: Subscription = null;
  private pollingTimeoutId: number = null;

  protected connectionClosed = true;

  constructor(
    @Inject('SERVER_URL') protected serverUrl: string,
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
      this.pollNext();
    }
    return this.data$;
  }

  private pollNext(): void {
    this.connectionClosed = false;

    this.unsubscribeFromWebsocket();

    this.connectionStatus$.next('polling-fetch');

    this.http
      .get<T>(this.serverUrl + this.pollingEndpoint, { observe: 'response' })
      .pipe(
        // TODO interceptor should have interfered and moved to error-page
        // https://github.com/iqb-berlin/testcenter-frontend/issues/53
        catchError((err: ApiError) => {
          this.connectionStatus$.next('error');
          return new Observable<T>();
        })
      )
      .subscribe((response: HttpResponse<T>) => {
        this.data$.next(response.body);
        if (response.headers.has('SubscribeURI')) {
          this.wsUrl = response.headers.get('SubscribeURI');
          this.subScribeToWsChannel();
        } else {
          this.connectionStatus$.next('polling-sleep');
          this.scheduleNextPoll();
        }
      });
  }

  cutConnection(): void {
    this.unsubscribeFromWebsocket();
    this.closeConnection();

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
        if (!this.connectionClosed) { this.pollNext(); }
      },
      this.pollingInterval
    );
  }

  private unsubscribeFromWebsocket() {
    if (this.wsConnectionStatusSubscription) {
      this.wsConnectionStatusSubscription.unsubscribe();
    }

    if (this.wsDataSubscription) {
      this.wsDataSubscription.unsubscribe();
    }
  }

  private subScribeToWsChannel() {
    this.wsDataSubscription = this.getChannel<T>(this.wsChannelName)
      .subscribe((dataObject: T) => this.data$.next(dataObject)); // subscribe only next, not complete!

    this.wsConnectionStatusSubscription = this.wsConnected$
      .pipe(
        skipWhile((item: boolean) => item === null), // skip pre-init-state
        tap((wsConnected: boolean) => {
          if (!wsConnected) {
            this.scheduleNextPoll();
          }
        }),
        map((wsConnected: boolean): ConnectionStatus => (wsConnected ? 'ws-online' : 'ws-offline'))
      )
      .subscribe(this.connectionStatus$);
  }
}
