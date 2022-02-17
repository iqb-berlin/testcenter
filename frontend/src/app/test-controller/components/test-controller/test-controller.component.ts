/* eslint-disable no-console */
import { ActivatedRoute, Router } from '@angular/router';
import {
  Component, ElementRef, HostListener, Inject, OnDestroy, OnInit, ViewChild
} from '@angular/core';
import {
  Subscription
} from 'rxjs';
import {
  debounceTime, distinctUntilChanged, filter, map
} from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomtextService, MainDataService } from '../../../shared/shared.module';
import {
  AppFocusState,
  Command, MaxTimerDataType,
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
import { MaxTimerData } from '../../classes/test-controller.classes';
import { ApiError } from '../../../app.interfaces';

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

  private timerRunning = false;

  timerValue: MaxTimerData = null;
  unitNavigationTarget = UnitNavigationTarget;
  unitNavigationList: UnitNaviButtonData[] = [];
  debugPane = false;
  sidebarOpen = false;
  unitScreenHeader: string = '';

  @ViewChild('navButtons') navButtons: ElementRef;

  constructor(
    @Inject('APP_VERSION') public appVersion: string,
    @Inject('IS_PRODUCTION_MODE') public isProductionMode: boolean,
    public mds: MainDataService,
    public tcs: TestControllerService,
    private bs: BackendService,
    private reviewDialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute,
    private cts: CustomtextService,
    public cmd: CommandService,
    private tls: TestLoaderService
  ) {
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.mds.progressVisualEnabled = false;

      this.subscriptions.errorReporting = this.mds.appError$
        .pipe(filter(e => !!e))
        .subscribe(() => this.tcs.errorOut());

      this.subscriptions.testStatus = this.tcs.testStatus$
        .pipe(distinctUntilChanged())
        .subscribe(status => this.logTestControllerStatusChange(status));

      this.subscriptions.appWindowHasFocus = this.mds.appWindowHasFocus$
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
        .subscribe(params => {
          this.tcs.testId = params.t;
          this.tls.loadTest()
            .then(() => {
              this.startAppFocusLogging();
              this.startConnectionStatusLogging();
              this.setUnitScreenHeader();
            })
            .catch((error: string | Error | ApiError) => {
              console.log('error', error);
              if (typeof error === 'string') {
                // interceptor already pushed mds.appError$
                return;
              }
              if (error instanceof Error) {
                this.mds.appError$.next({
                  label: 'Kritischer Fehler',
                  description: error.message,
                  category: 'PROBLEM'
                });
              }
              if (error instanceof ApiError) {
                this.mds.appError$.next({
                  label: error.code === 423 ? 'Test ist gesperrt' : 'Problem beim Laden des Tests',
                  description: error.info,
                  category: 'PROBLEM'
                });
              }
            });
        });

      this.subscriptions.maxTimer = this.tcs.maxTimeTimer$
        .subscribe(maxTimerEvent => this.handleMaxTimer(maxTimerEvent));

      this.subscriptions.currentUnit = this.tcs.currentUnitSequenceId$
        .subscribe(() => {
          this.refreshUnitMenu();
          this.setUnitScreenHeader();
        });
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
      if (this.tcs.testStatus$.getValue() === TestControllerState.ERROR) {
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
    if (this.tcs.rootTestlet === null) {
      this.snackBar.open('Kein Testheft verfügbar.', '', { duration: 5000 });
    } else {
      const authData = MainDataService.getAuthData();
      const dialogRef = this.reviewDialog.open(ReviewDialogComponent, {
        data: <ReviewDialogData>{
          loginname: authData.displayName,
          bookletname: this.tcs.rootTestlet.title,
          unitTitle: this.tcs.currentUnitTitle,
          unitDbKey: this.tcs.currentUnitDbKey
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (typeof result !== 'undefined') {
          if (result !== false) {
            const targetSelection = result.target;
            ReviewDialogComponent.oldName = result.sender;
            if (targetSelection === 'u') {
              this.bs.saveUnitReview(
                this.tcs.testId,
                this.tcs.currentUnitDbKey,
                result.priority,
                dialogRef.componentInstance.getCategories(),
                result.sender ? `${result.sender}: ${result.entry}` : result.entry
              ).subscribe(ok => {
                if (!ok) {
                  this.snackBar.open('Konnte Kommentar nicht speichern', '', { duration: 5000 });
                } else {
                  this.snackBar.open('Kommentar gespeichert', '', { duration: 5000 });
                }
              });
            } else {
              this.bs.saveTestReview(
                this.tcs.testId,
                result.priority,
                dialogRef.componentInstance.getCategories(),
                result.sender ? `${result.sender}: ${result.entry}` : result.entry
              ).subscribe(ok => {
                if (!ok) {
                  this.snackBar.open('Konnte Kommentar nicht speichern', '', { duration: 5000 });
                } else {
                  this.snackBar.open('Kommentar gespeichert', '', { duration: 5000 });
                }
              });
            }
          }
        }
      });
    }
  }

  handleCommand(commandName: string, params: string[]): void {
    switch (commandName.toLowerCase()) {
      case 'debug':
        this.debugPane = params.length === 0 || params[0].toLowerCase() !== 'off';
        if (this.debugPane) {
          console.log('select (focus) app window to see the debugPane');
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
        this.tcs.testStatus$.next(TestControllerState.RUNNING);
        this.tcs.setUnitNavigationRequest(navTarget, true);
        break;
      case 'terminate':
        this.tcs.terminateTest('BOOKLETLOCKEDbyOPERATOR', true, params.indexOf('lock') > -1);
        break;
      case 'goto':
        this.tcs.testStatus$.next(TestControllerState.RUNNING);
        // eslint-disable-next-line no-case-declarations
        let gotoTarget: string;
        if ((params.length === 2) && (params[0] === 'id')) {
          gotoTarget = (this.tcs.allUnitIds.indexOf(params[1]) + 1).toString(10);
        } else if (params.length === 1) {
          gotoTarget = params[0];
        }
        if (gotoTarget && gotoTarget !== '0') {
          this.tcs.resumeTargetUnitSequenceId = 0;
          this.tcs.interruptMaxTimer();
          this.tcs.setUnitNavigationRequest(gotoTarget, true);
        }
        break;
      default:
    }
  }

  private handleMaxTimer(maxTimerData: MaxTimerData): void {
    switch (maxTimerData.type) {
      case MaxTimerDataType.STARTED:
        this.snackBar.open(this.cts.getCustomText('booklet_msgTimerStarted') +
          maxTimerData.timeLeftMinString, '', { duration: 5000 });
        this.timerValue = maxTimerData;
        break;
      case MaxTimerDataType.ENDED:
        this.snackBar.open(this.cts.getCustomText('booklet_msgTimeOver'), '', { duration: 5000 });
        this.tcs.maxTimeTimers[maxTimerData.testletId] = 0;
        if (this.tcs.testMode.saveResponses) {
          this.bs.updateTestState(
            this.tcs.testId,
            [<StateReportEntry>{
              key: TestStateKey.TESTLETS_TIMELEFT,
              timeStamp: Date.now(),
              content: JSON.stringify(this.tcs.maxTimeTimers)
            }]
          );
        }
        this.timerRunning = false;
        this.timerValue = null;
        if (this.tcs.testMode.forceTimeRestrictions) {
          this.tcs.rootTestlet.setTimeLeft(maxTimerData.testletId, 0);
          const nextUnlockedUSId = this.tcs.rootTestlet.getNextUnlockedUnitSequenceId(this.tcs.currentUnitSequenceId);
          this.tcs.setUnitNavigationRequest(nextUnlockedUSId.toString(10), true);
        }
        break;
      case MaxTimerDataType.CANCELLED:
        this.snackBar.open(this.cts.getCustomText('booklet_msgTimerCancelled'), '', { duration: 5000 });
        this.tcs.rootTestlet.setTimeLeft(maxTimerData.testletId, 0);
        this.tcs.maxTimeTimers[maxTimerData.testletId] = 0;
        if (this.tcs.testMode.saveResponses) {
          this.bs.updateTestState(
            this.tcs.testId,
            [<StateReportEntry>{
              key: TestStateKey.TESTLETS_TIMELEFT,
              timeStamp: Date.now(),
              content: JSON.stringify(this.tcs.maxTimeTimers)
            }]
          );
        }
        this.timerValue = null;
        break;
      case MaxTimerDataType.INTERRUPTED:
        this.tcs.rootTestlet.setTimeLeft(maxTimerData.testletId, this.tcs.maxTimeTimers[maxTimerData.testletId]);
        this.timerValue = null;
        break;
      case MaxTimerDataType.STEP:
        this.timerValue = maxTimerData;
        if ((maxTimerData.timeLeftSeconds % 15) === 0) {
          this.tcs.maxTimeTimers[maxTimerData.testletId] = Math.round(maxTimerData.timeLeftSeconds / 60);
          if (this.tcs.testMode.saveResponses) {
            this.bs.updateTestState(
              this.tcs.testId,
              [<StateReportEntry>{
                key: TestStateKey.TESTLETS_TIMELEFT,
                timeStamp: Date.now(),
                content: JSON.stringify(this.tcs.maxTimeTimers)
              }]
            );
          }
        }
        if ((maxTimerData.timeLeftSeconds / 60) === 5) {
          this.snackBar.open(this.cts.getCustomText('booklet_msgSoonTimeOver5Minutes'), '', { duration: 5000 });
        } else if ((maxTimerData.timeLeftSeconds / 60) === 1) {
          this.snackBar.open(this.cts.getCustomText('booklet_msgSoonTimeOver1Minute'), '', { duration: 5000 });
        }
        break;
      default:
    }
  }

  private refreshUnitMenu(): void {
    this.sidebarOpen = false;
    this.unitNavigationList = [];
    if (!this.tcs.rootTestlet) {
      return;
    }
    const unitCount = this.tcs.rootTestlet.getMaxSequenceId() - 1;
    for (let sequenceId = 1; sequenceId <= unitCount; sequenceId++) {
      const unitData = this.tcs.rootTestlet.getUnitAt(sequenceId);
      this.unitNavigationList.push({
        sequenceId,
        shortLabel: unitData.unitDef.naviButtonLabel,
        longLabel: unitData.unitDef.title,
        testletLabel: unitData.testletLabel,
        disabled: unitData.unitDef.locked,
        isCurrent: sequenceId === this.tcs.currentUnitSequenceId
      });
    }
    if (this.navButtons) {
      setTimeout(() => {
        this.navButtons.nativeElement.querySelector('.current-unit')
          .scrollIntoView({ inline: 'center' });
      }, 50);
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  private setUnitScreenHeader(): void {
    if (!this.tcs.rootTestlet || !this.tcs.currentUnitSequenceId) {
      this.unitScreenHeader = '';
      return;
    }
    switch (this.tcs.bookletConfig.unit_screenheader) {
      case 'WITH_UNIT_TITLE':
        this.unitScreenHeader = this.tcs.rootTestlet.getUnitAt(this.tcs.currentUnitSequenceId).unitDef.title;
        break;
      case 'WITH_BOOKLET_TITLE':
        this.unitScreenHeader = this.tcs.rootTestlet.title;
        break;
      case 'WITH_BLOCK_TITLE':
        this.unitScreenHeader = this.tcs.rootTestlet.getUnitAt(this.tcs.currentUnitSequenceId).testletLabel;
        break;
      default:
        this.unitScreenHeader = '';
    }
  }

  ngOnDestroy(): void {
    Object.keys(this.subscriptions)
      .filter(subscriptionKey => this.subscriptions[subscriptionKey])
      .forEach(subscriptionKey => {
        this.subscriptions[subscriptionKey].unsubscribe();
        this.subscriptions[subscriptionKey] = null;
      });
    this.tls.reset();

    this.mds.progressVisualEnabled = true;
  }

  @HostListener('window:unload', ['$event'])
  unloadHandler(): void {
    if (this.cmd.connectionStatus$.getValue() !== 'ws-online') {
      this.bs.notifyDyingTest(this.tcs.testId);
    }
  }
}
