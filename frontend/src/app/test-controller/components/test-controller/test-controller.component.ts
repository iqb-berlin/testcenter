import { ActivatedRoute } from '@angular/router';
import {
  Component, HostListener, Inject, OnDestroy, OnInit, ViewChild
} from '@angular/core';
import { Subscription } from 'rxjs';
import {
  debounceTime, distinctUntilChanged, filter, map
} from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
  CustomtextService,
  MainDataService, UserAgentService,
  BackendService as SharedBackendService
} from '../../../shared/shared.module';
import { UiVisibilityService } from '../../../shared/services/ui-visibility.service';
import {
  Command, MaxTimerEvent,
  UnitNavigationTarget,
  WindowFocusState
} from '../../interfaces/test-controller.interfaces';
import { BackendService } from '../../services/backend.service';
import { TestControllerService } from '../../services/test-controller.service';
import { CommandService } from '../../services/command.service';
import { TestLoaderService } from '../../services/test-loader.service';
import { TimerData } from '../../classes/test-controller.classes';
import { MissingBookletError } from '../../classes/missing-booklet-error.class';
import { AppError } from '../../../app.interfaces';
import { ReviewPanelComponent } from '../review-panel/review-panel.component';

@Component({
    templateUrl: './test-controller.component.html',
    styleUrls: ['./test-controller.component.css'],
    standalone: false
})
export class TestControllerComponent implements OnInit, OnDestroy {
  @ViewChild(ReviewPanelComponent) reviewComponent?: ReviewPanelComponent;

  private subscriptions: { [key: string]: Subscription | null } = {
    errorReporting: null,
    testStatus: null,
    routing: null,
    appWindowHasFocus: null,
    appFocus: null,
    command: null,
    maxTimer: null,
    connectionStatus: null
  };

  timerValue: TimerData | null = null;

  debugPane = false;
  sideNavContent: 'unit-menu' | 'review-form' = 'unit-menu';

  constructor(
    public mainDataService: MainDataService,
    public tcs: TestControllerService,
    private bs: BackendService,
    private sharedBs: SharedBackendService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private cts: CustomtextService,
    public cmd: CommandService,
    private tls: TestLoaderService,
    public dialog: MatDialog,
    private uiVisibilityService: UiVisibilityService,
    @Inject('IS_PRODUCTION_MODE') public isProductionMode: boolean
  ) {
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.mainDataService.clearErrorBuffer();
      this.updateLogoVisibility();
      this.subscriptions.errorReporting = this.mainDataService.appError$
        .pipe(filter(e => !!e))
        .subscribe(() => this.tcs.errorOut());

      this.subscriptions.testStatus = this.tcs.state$
        .pipe(distinctUntilChanged())
        .subscribe(status => this.tcs.setTestState('CONTROLLER', status));

      this.subscriptions.appWindowHasFocus = this.mainDataService.appWindowHasFocus$
        .subscribe(hasFocus => {
          this.tcs.windowFocusState$.next(hasFocus ? 'HOST' : 'UNKNOWN');
        });

      this.subscriptions.command = this.cmd.command$
        .pipe(
          distinctUntilChanged((command1: Command, command2: Command): boolean => (command1.id === command2.id))
        )
        .subscribe((command: Command) => {
          this.handleCommand(command.keyword, command.arguments)
            .then(() => {
              this.bs.addTestLog(this.tcs.testId, [{
                key: 'command executed',
                timeStamp: Date.now(),
                content: CommandService.commandToString(command)
              }]);
            });
        });

      this.subscriptions.routing = this.route.params
        .subscribe(async params => {
          this.tcs.testId = params.t;
          try {
            await this.tls.loadTest();
          } catch (err) {
            if (err instanceof MissingBookletError) { // this happens when loading was aborted.
              // eslint-disable-next-line no-console
              console.error(err); // don't swallow error entirely for the case, rootTestlet is missing in loading
              return;
            }
            await Promise.reject(err);
            return;
          }
          this.startAppFocusLogging();
          this.startConnectionStatusLogging();
          this.updateLogoVisibility();
          await this.requestFullScreen();
        });

      this.subscriptions.maxTimer = this.tcs.timers$
        .subscribe(maxTimerEvent => this.handleTimer(maxTimerEvent));

      if (!this.isProductionMode) {
        this.debugPane = !!localStorage.getItem('tc-debug');
      }
    });
  }

  reload() {
    this.sharedBs.clearCache('cache').subscribe();
    // eslint-disable-next-line
    // @ts-ignore: force reload with 'true' only works for firefox so far, that's why we clear cache manually
    setTimeout(() => { window.location.reload(true); }, 100);
  }

  private startAppFocusLogging() {
    if (!this.tcs.testMode.saveResponses) {
      return;
    }
    if (this.subscriptions.appFocus !== null) {
      this.subscriptions.appFocus.unsubscribe();
    }
    this.subscriptions.appFocus = this.tcs.windowFocusState$.pipe(
      debounceTime(500)
    ).subscribe((newState: WindowFocusState) => {
      if (['ERROR', 'TERMINATED'].includes(this.tcs.state$.getValue())) {
        return;
      }
      if (newState === 'UNKNOWN') {
        this.tcs.setTestState('FOCUS', 'HAS_NOT');
      } else {
        this.tcs.setTestState('FOCUS', 'HAS');
      }
    });
  }

  private startConnectionStatusLogging() {
    this.subscriptions.connectionStatus = this.cmd.connectionStatus$
      .pipe(
        map(status => status === 'ws-online'),
        distinctUntilChanged()
      )
      .subscribe(isWsConnected => {
        this.tcs.setTestState('CONNECTION', isWsConnected ? 'WEBSOCKET' : 'POLLING');
      });
  }

  handleCommand(commandName: string, params: string[]): Promise<boolean> {
    switch (commandName.toLowerCase()) {
      case 'debug':
        return this.toggleDebugPane(params);
      case 'pause':
        return this.tcs.pause();
      case 'resume':
        return this.tcs.resume();
      case 'terminate':
        return this.tcs.terminateTest('BOOKLETLOCKEDbyOPERATOR', true, params.indexOf('lock') > -1);
      case 'goto':
        return this.goto(params);
      default:
        return Promise.reject();
    }
  }

  private goto(params: string[]): Promise<boolean> {
    this.tcs.state$.next('RUNNING');
    // eslint-disable-next-line no-case-declarations
    let gotoTarget: string = '';
    if ((params.length > 1) && (params[0] === 'id')) {
      gotoTarget = (this.tcs.unitAliasMap[params[1]]).toString(10);
    } else if (params.length === 1) {
      gotoTarget = params[0];
    }
    if (gotoTarget && gotoTarget !== '0') {
      const targetUnit = this.tcs.units[parseInt(gotoTarget, 10)];
      if (targetUnit) {
        if (targetUnit.parent.timerId !== this.tcs.currentUnit?.parent.timerId) {
          this.tcs.cancelTimer();
          // parse the last word as integer
          this.tcs.restoreTime(targetUnit.parent, parseInt(params[2].trim().split(' ').pop()!, 10));
        }
        targetUnit.parent.locks.afterLeave = false;
        targetUnit.lockedAfterLeaving = false;
        this.tcs.clearTestlet(targetUnit.parent.id);
      }
      return this.tcs.setUnitNavigationRequest(gotoTarget, true);
    }
    return Promise.reject();
  }

  private toggleDebugPane(params: string[]): Promise<boolean> {
    this.debugPane = params.length === 0 || params[0].toLowerCase() !== 'off';
    if (this.debugPane) {
      localStorage.setItem('tc-debug', '["main"]');
    } else {
      localStorage.removeItem('tc-debug');
    }
    return Promise.resolve(true);
  }

  private async handleTimer(timer: TimerData): Promise<boolean> {
    const minute = timer.timeLeftSeconds / 60;
    switch (timer.type) {
      case MaxTimerEvent.STARTED:
        if (this.tcs.shouldShowConfirmationUI()) {
          this.snackBar.open(this.cts.getCustomText('booklet_msgTimerStarted') + timer.timeLeftMinString, '', {
            duration: 5000,
            panelClass: ['snackbar-time-started']
          });
        }
        this.timerValue = timer;
        this.tcs.timers[timer.id] = timer.timeLeftSeconds / 60;
        this.tcs.setTestState('TESTLETS_TIMELEFT', JSON.stringify(this.tcs.timers));
        return true;
      case MaxTimerEvent.ENDED:
        if (this.tcs.shouldShowConfirmationUI()) {
          this.snackBar.open(this.cts.getCustomText('booklet_msgTimeOver'), '', {
            duration: 5000,
            panelClass: ['snackbar-time-ended']
          });
        }
        this.tcs.timers[timer.id] = 0;
        // attention: TODO store timer as well in localStorage to prevent F5-cheating
        this.tcs.setTestState('TESTLETS_TIMELEFT', JSON.stringify(this.tcs.timers));
        this.timerValue = null;
        if (this.tcs.testMode.forceTimeRestrictions) {
          if (this.tcs.currentUnit) {
            this.tcs.currentUnit.parent.locks.time = true;
            this.tcs.updateLocks();
          }
          return this.tcs.setUnitNavigationRequest(
            UnitNavigationTarget.NEXT ?? UnitNavigationTarget.END,
            true
          );
        }
        return true;
      case MaxTimerEvent.CANCELLED:
        if (this.tcs.shouldShowConfirmationUI()) {
          this.snackBar.open(this.cts.getCustomText('booklet_msgTimerCancelled'), '', {
            duration: 5000,
            panelClass: ['snackbar-time-canceled']
          });
        }
        this.tcs.timers[timer.id] = 0;
        // attention: TODO store timer as well in localStorage to prevent F5-cheating
        this.tcs.setTestState('TESTLETS_TIMELEFT', JSON.stringify(this.tcs.timers));
        this.timerValue = null;
        if (this.tcs.testMode.forceTimeRestrictions && this.tcs.currentUnit) {
          this.tcs.currentUnit.parent.locks.time = true;
          this.tcs.updateLocks();
        }
        return true;
      case MaxTimerEvent.INTERRUPTED:
        this.timerValue = null;
        return true;
      case MaxTimerEvent.STEP:
        this.timerValue = timer;
        this.tcs.timers[timer.id] = timer.timeLeftSeconds / 60;
        if ((timer.timeLeftSeconds % 15) === 0) {
          // attention: TODO store timer as well in localStorage to prevent F5-cheating
          this.tcs.setTestState('TESTLETS_TIMELEFT', JSON.stringify(this.tcs.timers));
        }
        if (this.tcs.timerWarningPoints.includes(minute) && this.tcs.shouldShowConfirmationUI()) {
          const text = this.cts.getCustomText('booklet_msgSoonTimeOver').replace('%s', minute.toString(10));
          this.snackBar.open(text, '', {
            duration: 5000,
            panelClass: ['snackbar-timerWarning']
          });
        }
        return true;
      default:
        return true;
    }
  }

  ngOnDestroy(): void {
    Object.keys(this.subscriptions)
      .filter(subscriptionKey => this.subscriptions[subscriptionKey])
      .forEach(subscriptionKey => {
        this.subscriptions[subscriptionKey]?.unsubscribe();
        this.subscriptions[subscriptionKey] = null;
      });
    if (this.mainDataService.isFullScreen) {
      document.exitFullscreen();
    }
    this.uiVisibilityService.setShowConfirmationUI(true);
  }

  @HostListener('window:unload', ['$event'])
  unloadHandler(): void {
    if (!this.tcs.testMode.saveResponses) {
      return;
    }
    if (this.cmd.connectionStatus$.getValue() !== 'ws-online') {
      this.bs.notifyDyingTest(this.tcs.testId);
    }
  }

  async setFullScreen(): Promise<void> {
    if (this.mainDataService.isFullScreen) {
      return;
    }
    const rootElem = document.documentElement;
    if (!rootElem) {
      return;
    }
    if ('requestFullscreen' in rootElem) {
      await rootElem.requestFullscreen();
      return;
    }
    if ('webkitRequestFullscreen' in rootElem) { // iOS
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await rootElem.webkitRequestFullscreen();
    }
  }

  async toggleFullScreen(): Promise<void> {
    if (this.mainDataService.isFullScreen) {
      await document.exitFullscreen();
    } else {
      await this.setFullScreen();
    }
  }

  private updateLogoVisibility(): void {
    this.uiVisibilityService.setShowConfirmationUI(this.tcs.shouldShowConfirmationUI());
  }

  async requestFullScreen(): Promise<void> {
    if (this.tcs.booklet?.config.ask_for_fullscreen === 'OFF') {
      return;
    }
    if (this.mainDataService.isFullScreen) {
      return;
    }

    // todo dont use ignore_ui booklet parameter, as fullscreen without asking leads to errors in the browser
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: 'auto',
      data: <ConfirmDialogData>{
        title: 'Vollbild',
        content: this.cts.getCustomText('booklet_requestFullscreen'),
        confirmbuttonlabel: 'Ja',
        showcancel: true,
        cancelbuttonlabel: 'Nein'
      }
    });
    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed) {
        return;
      }
      await this.setFullScreen();
    });
  }

  protected resetReviewForm() {
    if (this.reviewComponent) {
      this.reviewComponent.resetForm();
      this.reviewComponent.close.emit();
    }
  }

  onSidenavOpened(): void {
    if (this.sideNavContent === 'review-form' && this.reviewComponent) {
      this.reviewComponent.refreshIfListView();
    }
  }
}
