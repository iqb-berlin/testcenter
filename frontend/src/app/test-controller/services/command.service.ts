import {
  Inject, Injectable, OnDestroy
} from '@angular/core';
import {
  of, Subject, Subscription, timer
} from 'rxjs';
import {
  concatMap,
  distinctUntilChanged,
  filter,
  ignoreElements,
  map,
  mergeMap,
  startWith,
  switchMap,
  tap
} from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import {
  Command, CommandKeyword, commandKeywords, isKnownCommand, TcPublicApi, TestControllerState
} from '../interfaces/test-controller.interfaces';
import { TestControllerService } from './test-controller.service';
import { WebsocketBackendService } from '../../shared/shared.module';

type TestStartedOrStopped = 'started' | 'terminated' | '';

@Injectable({
  providedIn: 'root'
})
export class CommandService extends WebsocketBackendService<Command[]> implements OnDestroy {
  command$: Subject<Command> = new Subject<Command>();

  protected initialData = [];
  protected pollingEndpoint = '';
  protected pollingInterval = 5000;
  protected wsChannelName = 'commands';

  private commandReceived$: Subject<Command> = new Subject<Command>();
  private commandSubscription: Subscription | null = null;
  private testStartedSubscription: Subscription | null = null;
  private executedCommandIds: number[] = [];

  constructor(
    @Inject('IS_PRODUCTION_MODE') public isProductionMode: boolean,
    private tcs: TestControllerService,
    @Inject('BACKEND_URL') serverUrl: string,
    protected override http: HttpClient
  ) {
    super(serverUrl, http);

    this.setUpGlobalCommandsForDebug();

    this.commandSubscription = this.subscribeReceivedCommands();
    this.testStartedSubscription = this.subscribeTestStarted();
  }

  static commandToString(command: Command): string {
    return [command.keyword, ...command.arguments].join(' ');
  }

  private static testStartedOrStopped(testStatus: TestControllerState): TestStartedOrStopped {
    if (['RUNNING', 'PAUSED'].includes(testStatus)) {
      return 'started';
    }
    if (['TERMINATED_PAUSED', 'TERMINATED', 'ERROR'].includes(testStatus)) {
      return 'terminated';
    }
    return '';
  }

  // services are normally meant to live forever, so unsubscription *should* be unnecessary
  // this unsubscriptions are only for the case, the project's architecture will be changed dramatically once
  // while not having a OnInit-hook services *do have* an OnDestroy-hook (see: https://v9.angular.io/api/core/OnDestroy)
  override ngOnDestroy(): void {
    if (this.commandSubscription) {
      this.commandSubscription.unsubscribe();
    }
    if (this.testStartedSubscription) {
      this.testStartedSubscription.unsubscribe();
    }
  }

  private subscribeReceivedCommands(): Subscription {
    return this.commandReceived$
      .pipe(
        filter((command: Command) => (this.executedCommandIds.indexOf(command.id) < 0)),
        // min delay between items
        concatMap((command: Command) => timer(1000).pipe(ignoreElements(), startWith(command))),
        mergeMap((command: Command) =>
          // eslint-disable-next-line
          this.http.patch(`${this.serverUrl}test/${this.tcs.testId}/command/${command.id}/executed`, {})
            .pipe(
              map(() => command),
              tap(cmd => this.executedCommandIds.push(cmd.id))
            ))
      ).subscribe(command => this.command$.next(command));
  }

  private subscribeTestStarted(): Subscription {
    if (typeof this.testStartedSubscription !== 'undefined') {
      this.testStartedSubscription?.unsubscribe();
    }

    return this.tcs.state$
      .pipe(
        distinctUntilChanged(),
        map(CommandService.testStartedOrStopped),
        filter(testStartedOrStopped => testStartedOrStopped !== ''),
        map(testStartedOrStopped => (((testStartedOrStopped === 'started') && (this.tcs.testMode.receiveRemoteCommands)) ? `test/${this.tcs.testId}/commands` : '')),
        filter(newPollingEndpoint => newPollingEndpoint !== this.pollingEndpoint),
        switchMap((pollingEndpoint: string) => {
          this.pollingEndpoint = pollingEndpoint;
          if (this.pollingEndpoint) {
            return this.observeEndpointAndChannel();
          }
          this.cutConnection();
          return of([]);
        }),
        switchMap(commands => of(...commands))
      ).subscribe(this.commandReceived$);
  }

  private setUpGlobalCommandsForDebug() {
    (window as { tc: TcPublicApi } & Window & typeof globalThis).tc =
      commandKeywords
        .reduce((acc, keyword) => {
          acc[keyword] = args => { this.commandFromTerminal(keyword, args); };
          return acc;
        }, <{ [key in CommandKeyword]: (arr: string[]) => void; } & object>{});
  }

  private commandFromTerminal(keyword: string, args: string[]): void {
    const newArgs = (typeof args === 'undefined') ? [] : args;
    const id = Math.round(Math.random() * -10000000);
    const command = {
      keyword,
      arguments: newArgs,
      id,
      timestamp: Date.now()
    };
    if (!isKnownCommand(keyword)) {
      return;
    }
    this.command$.next(command);
  }
}
