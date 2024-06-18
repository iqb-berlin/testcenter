import { ActivatedRoute } from '@angular/router';
import {
  Component, HostListener, Inject, OnDestroy, OnInit
} from '@angular/core';
import { Subscription, combineLatest } from 'rxjs';
import {
  debounceTime, distinctUntilChanged, filter, map
} from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
  CustomtextService,
  MainDataService
} from '../../../shared/shared.module';
import {
  AppFocusState,
  Command, MaxTimerEvent,
  ReviewDialogData,
  StateReportEntry,
  TestControllerState,
  TestStateKey, UnitNaviButtonData,
  UnitNavigationTarget,
  WindowFocusState
} from '../../interfaces/test-controller.interfaces';
import { BackendService } from '../../services/backend.service';
import { TestControllerService } from '../../services/test-controller.service';
import { ReviewDialogComponent } from '../review-dialog/review-dialog.component';
import { CommandService } from '../../services/command.service';
import { TestLoaderService } from '../../services/test-loader.service';
import { TimerData } from '../../classes/test-controller.classes';
import { MissingBookletError } from '../../classes/missing-booklet-error.class';
import { AppError } from '../../../app.interfaces';

@Component({
  templateUrl: './test-controller.component.html',
  styleUrls: ['./test-controller.component.css']
})
export class TestControllerComponent implements OnInit, OnDestroy {
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
  unitNavigationTarget = UnitNavigationTarget;
  unitNavigationList: Array<UnitNaviButtonData> = [];
  nextUnitButton = {
    visible: true,
    enabled: false
  };

  previousUnitButton = {
    visible: true,
    enabled: false
  };

  debugPane = false;
  unitScreenHeader: string = '';

  firstAccessibleUnit: number = 1;
  lastAccessibleUnit: number = Infinity;

  constructor(
    public mainDataService: MainDataService,
    public tcs: TestControllerService,
    private bs: BackendService,
    private reviewDialog: MatDialog,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private cts: CustomtextService,
    public cmd: CommandService,
    private tls: TestLoaderService,
    public dialog: MatDialog,
    @Inject('IS_PRODUCTION_MODE') public isProductionMode: boolean
  ) {
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.mainDataService.clearErrorBuffer();
      this.subscriptions.errorReporting = this.mainDataService.appError$
        .pipe(filter(e => !!e))
        .subscribe(() => this.tcs.errorOut());

      this.subscriptions.testStatus = this.tcs.state$
        .pipe(distinctUntilChanged())
        .subscribe(status => this.logTestControllerStatusChange(status));

      this.subscriptions.appWindowHasFocus = this.mainDataService.appWindowHasFocus$
        .subscribe(hasFocus => {
          this.tcs.windowFocusState$.next(hasFocus ? WindowFocusState.HOST : WindowFocusState.UNKNOWN);
        });

      this.subscriptions.command = this.cmd.command$
        .pipe(
          distinctUntilChanged((command1: Command, command2: Command): boolean => (command1.id === command2.id))
        )
        .subscribe((command: Command) => {
          this.handleCommand(command.keyword, command.arguments);
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
          this.setUnitScreenHeader();
          await this.requestFullScreen();
        });

      this.subscriptions.maxTimer = this.tcs.timers$
        .subscribe(maxTimerEvent => this.handleTimer(maxTimerEvent));

      this.subscriptions.currentUnit = combineLatest([this.tcs.currentUnitSequenceId$, this.tcs.testStructureChanges$])
        .subscribe(() => {
          this.refreshUnitMenu();
          this.setUnitScreenHeader();
        });

      if (!this.isProductionMode) {
        this.debugPane = !!localStorage.getItem('tc-debug');
      }
    });
  }

  private logTestControllerStatusChange = (testControllerState: TestControllerState): void => {
    if (this.tcs.testMode.saveResponses) {
      this.bs.updateTestState(this.tcs.testId, [<StateReportEntry>{
        key: TestStateKey.CONTROLLER, timeStamp: Date.now(), content: testControllerState
      }]);
    }
  };

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
      if (this.tcs.state$.getValue() === TestControllerState.ERROR) {
        return;
      }
      if (newState === WindowFocusState.UNKNOWN) {
        this.bs.updateTestState(this.tcs.testId, [<StateReportEntry>{
          key: TestStateKey.FOCUS, timeStamp: Date.now(), content: AppFocusState.HAS_NOT
        }]);
      } else {
        this.bs.updateTestState(this.tcs.testId, [<StateReportEntry>{
          key: TestStateKey.FOCUS, timeStamp: Date.now(), content: AppFocusState.HAS
        }]);
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
        if (this.tcs.testMode.saveResponses) {
          this.bs.updateTestState(this.tcs.testId, [{
            key: TestStateKey.CONNECTION,
            content: isWsConnected ? 'WEBSOCKET' : 'POLLING',
            timeStamp: Date.now()
          }]);
        }
      });
  }

  showReviewDialog(): void {
    const authData = this.mainDataService.getAuthData();
    if (!authData) {
      throw new AppError({ description: '', label: 'Nicht Angemeldet!' }); // necessary?!
    } else {
      const dialogRef = this.reviewDialog.open(ReviewDialogComponent, {
        data: <ReviewDialogData>{
          loginname: authData.displayName,
          bookletname: this.tcs.booklet?.metadata.label,
          unitTitle: this.tcs.currentUnit.label,
          unitAlias: this.tcs.currentUnit.alias
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (!result) {
          return;
        }
        ReviewDialogComponent.savedName = result.sender;
        this.bs.saveReview(
          this.tcs.testId,
          (result.target === 'u') ? this.tcs.currentUnit.alias : null,
          result.priority,
          dialogRef.componentInstance.getSelectedCategories(),
          result.sender ? `${result.sender}: ${result.entry}` : result.entry
        ).subscribe(() => {
          this.snackBar.open('Kommentar gespeichert', '', { duration: 5000 });
        });
      });
    }
  }

  handleCommand(commandName: string, params: string[]): void {
    switch (commandName.toLowerCase()) {
      case 'debug':
        this.debugPane = params.length === 0 || params[0].toLowerCase() !== 'off';
        if (this.debugPane) {
          // eslint-disable-next-line no-console
          localStorage.setItem('tc-debug', '["main"]');
        } else {
          localStorage.removeItem('tc-debug');
        }
        break;
      case 'pause':
        this.tcs.resumeTargetUnitSequenceId = this.tcs.currentUnitSequenceId;
        this.tcs.pause();
        break;
      case 'resume':
        // eslint-disable-next-line no-case-declarations
        const navTarget =
          (this.tcs.resumeTargetUnitSequenceId > 0) ?
            this.tcs.resumeTargetUnitSequenceId.toString() :
            UnitNavigationTarget.FIRST;
        this.tcs.state$.next(TestControllerState.RUNNING);
        this.tcs.state$.next(TestControllerState.RUNNING);
        this.tcs.setUnitNavigationRequest(navTarget, true);
        break;
      case 'terminate':
        this.tcs.terminateTest('BOOKLETLOCKEDbyOPERATOR', true, params.indexOf('lock') > -1);
        break;
      case 'goto':
        this.tcs.state$.next(TestControllerState.RUNNING);
        // eslint-disable-next-line no-case-declarations
        let gotoTarget: string = '';
        if ((params.length === 2) && (params[0] === 'id')) {
          gotoTarget = (this.tcs.unitAliasMap[params[1]]).toString(10);
        } else if (params.length === 1) {
          gotoTarget = params[0];
        }
        if (gotoTarget && gotoTarget !== '0') {
          this.tcs.resumeTargetUnitSequenceId = 0;
          const targetUnit = this.tcs.getUnit(parseInt(gotoTarget, 10));
          if (targetUnit) {
            if (targetUnit.parent.timerId !== this.tcs.currentUnit.parent.timerId) {
              this.tcs.cancelTimer();
            }
            this.tcs.clearTestlet(targetUnit.parent.id);
          }

          this.tcs.setUnitNavigationRequest(gotoTarget, true);
        }
        break;
      default:
    }
  }

  private async handleTimer(timer: TimerData): Promise<boolean> {
    const minute = timer.timeLeftSeconds / 60;
    switch (timer.type) {
      case MaxTimerEvent.STARTED:
        this.snackBar.open(this.cts.getCustomText('booklet_msgTimerStarted') +
          timer.timeLeftMinString, '', { duration: 5000 });
        this.timerValue = timer;
        this.tcs.updateLocks();
        return true;
      case MaxTimerEvent.ENDED:
        this.snackBar.open(this.cts.getCustomText('booklet_msgTimeOver'), '', { duration: 5000 });
        this.tcs.timers[timer.id] = 0;
        if (this.tcs.testMode.saveResponses) {
          this.bs.updateTestState(
            this.tcs.testId,
            [<StateReportEntry>{
              key: TestStateKey.TESTLETS_TIMELEFT,
              timeStamp: Date.now(),
              content: JSON.stringify(this.tcs.timers)
            }]
          );
        }
        this.timerValue = null;
        this.tcs.currentUnit.parent.locks.time = true;
        this.tcs.updateLocks();
        if (this.tcs.testMode.forceTimeRestrictions) {
          const nextUnlockedUSId = await this.tcs.getNextUnlockedUnitSequenceId(this.tcs.currentUnitSequenceId);
          return this.tcs.setUnitNavigationRequest(nextUnlockedUSId?.toString(10) ?? UnitNavigationTarget.END, true);
        }
        return true;
      case MaxTimerEvent.CANCELLED:
        this.snackBar.open(this.cts.getCustomText('booklet_msgTimerCancelled'), '', { duration: 5000 });
        // this.tcs.setTimeLeft(timer.testletId, 0);
        this.tcs.timers[timer.id] = 0;
        if (this.tcs.testMode.saveResponses) {
          this.bs.updateTestState(
            this.tcs.testId,
            [<StateReportEntry>{
              key: TestStateKey.TESTLETS_TIMELEFT,
              timeStamp: Date.now(),
              content: JSON.stringify(this.tcs.timers)
            }]
          );
        }
        this.timerValue = null;
        this.tcs.currentUnit.parent.locks.time = true;
        this.tcs.updateLocks();
        return true;
      case MaxTimerEvent.INTERRUPTED:
        this.timerValue = null;
        this.tcs.updateLocks();
        return true;
      case MaxTimerEvent.STEP:
        this.timerValue = timer;
        this.tcs.timers[timer.id] = timer.timeLeftSeconds / 60;
        if ((timer.timeLeftSeconds % 15) === 0) {
          this.tcs.timers[timer.id] = timer.timeLeftSeconds / 60;
          if (this.tcs.testMode.saveResponses) {
            this.bs.updateTestState(
              this.tcs.testId,
              [<StateReportEntry>{
                key: TestStateKey.TESTLETS_TIMELEFT,
                timeStamp: Date.now(),
                content: JSON.stringify(this.tcs.timers)
              }]
            );
          }
        }
        if (this.tcs.timerWarningPoints.includes(minute)) {
          const text = this.cts.getCustomText('booklet_msgSoonTimeOver').replace('%s', minute.toString(10));
          this.snackBar.open(text, '', { duration: 5000 });
        }
        return true;
      default:
        return true;
    }
  }

  private async refreshUnitMenu(): Promise<void> {
    this.unitNavigationList = [];
    [this.firstAccessibleUnit, this.lastAccessibleUnit] = await this.tcs.getSequenceBounds();

    let previousBlockLabel: string | null = null;
    for (let sequenceId = 1; sequenceId <= this.tcs.sequenceLength; sequenceId++) {
      const unit = this.tcs.getUnit(sequenceId);

      if (unit.parent.locked?.by === 'condition') {
        // eslint-disable-next-line no-continue
        continue;
      }

      const blockLabel = unit.parent.blockLabel;

      const isOnRoot = unit.parent.id === this.tcs.testlets[this.tcs.booklet?.units.id || ''].id;

      let headline: string | null = null;
      if (blockLabel !== previousBlockLabel) {
        headline = isOnRoot ? '' : blockLabel;
      }
      previousBlockLabel = blockLabel;

      this.unitNavigationList.push({
        sequenceId,
        shortLabel: unit.labelShort,
        longLabel: unit.label,
        disabled: TestControllerService.unitIsInaccessible(unit),
        isCurrent: sequenceId === this.tcs.currentUnitSequenceId,
        headline
      });
    }
    this.refreshNavigationButtons();
  }

  private refreshNavigationButtons(): void {
    this.previousUnitButton.visible = this.tcs.bookletConfig.unit_navibuttons !== 'FORWARD_ONLY';
    this.previousUnitButton.enabled = this.tcs.currentUnitSequenceId > this.firstAccessibleUnit;

    this.nextUnitButton.visible = true;
    this.nextUnitButton.enabled = this.tcs.currentUnitSequenceId < this.lastAccessibleUnit;
  }

  private setUnitScreenHeader(): void {
    if (!this.tcs.currentUnit) {
      return;
    }
    switch (this.tcs.bookletConfig.unit_screenheader) {
      case 'WITH_UNIT_TITLE':
        this.unitScreenHeader = this.tcs.currentUnit.label;
        break;
      case 'WITH_BOOKLET_TITLE':
        this.unitScreenHeader = this.tcs.booklet?.metadata.label || '';
        break;
      case 'WITH_BLOCK_TITLE':
        this.unitScreenHeader = this.tcs.currentUnit.parent.blockLabel;
        break;
      default:
        this.unitScreenHeader = '';
    }
  }

  ngOnDestroy(): void {
    Object.keys(this.subscriptions)
      .filter(subscriptionKey => this.subscriptions[subscriptionKey])
      .forEach(subscriptionKey => {
        this.subscriptions[subscriptionKey]?.unsubscribe();
        this.subscriptions[subscriptionKey] = null;
      });
    this.tls.reset();
    if (this.mainDataService.isFullScreen) {
      document.exitFullscreen();
    }
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

  async requestFullScreen(): Promise<void> {
    if (this.tcs.bookletConfig.ask_for_fullscreen === 'OFF') {
      return;
    }
    if (this.mainDataService.isFullScreen) {
      return;
    }
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
}
