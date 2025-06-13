import {
  bufferWhen, concatMap, last, map, scan, takeUntil, takeWhile, withLatestFrom
} from 'rxjs/operators';
import {
  BehaviorSubject,
  forkJoin,
  from,
  fromEvent,
  interval,
  lastValueFrom,
  merge,
  Observable,
  of,
  Subject,
  Subscription, tap,
  timer
} from 'rxjs';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BookletConfigData } from 'testcenter-common/classes/booklet-config-data.class';
import { MatDialog } from '@angular/material/dialog';
import { TimerData } from '../classes/test-controller.classes';
import {
  Booklet,
  BufferEvent,
  BufferEventType,
  bufferTypes,
  isTestlet,
  KeyValuePairNumber,
  KeyValuePairString,
  MaxTimerEvent,
  NavigationDirection, NavigationDirectionValue,
  NavigationLeaveRestrictionValue,
  NavigationState,
  StateReportEntry,
  TestControllerState,
  Testlet,
  TestletLockTypes,
  TestStateKey,
  TestStateUpdate,
  Unit,
  UnitDataParts,
  UnitNavigationTarget, UnitStateKey,
  UnitStateUpdate,
  WindowFocusState
} from '../interfaces/test-controller.interfaces';
import { BackendService } from './backend.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
  CustomtextService,
  MainDataService,
  TestMode
} from '../../shared/shared.module';
import {
  isVeronaProgress,
  VeronaNavigationDeniedReason,
  VeronaProgressIncompleteValues
} from '../interfaces/verona.interfaces';
import { MissingBookletError } from '../classes/missing-booklet-error.class';
import { MessageService } from '../../shared/services/message.service';
import { AppError } from '../../app.interfaces';
import { isIQBVariable } from '../interfaces/iqb.interfaces';
import { TestStateUtil } from '../util/test-state.util';
import { ConditionUtil } from '../util/condition.util';

@Injectable({
  providedIn: 'root'
})
export class TestControllerService {
  testId = '';
  readonly state$ = new BehaviorSubject<TestControllerState>('INIT');

  workspaceId = 0;

  totalLoadingProgress = 0;

  testMode = new TestMode();

  // TODO hide those behind functions, this will be way easier with ts 5.5
  booklet: Booklet | null = null;
  units: { [sequenceId: number]: Unit } = {};
  testlets: { [testletId: string] : Testlet } = {};
  unitAliasMap: { [unitId: string] : number } = {};

  currentUnitSequenceId: number = -Infinity;
  get currentUnit(): Unit | null {
    return this.units[this.currentUnitSequenceId];
  }

  timers$ = new Subject<TimerData>();
  timers: KeyValuePairNumber = {}; // TODO remove the redundancy with timers$
  currentTimerId = '';
  private timerIntervalSubscription: Subscription | null = null;
  timerWarningPoints: number[] = [];

  readonly windowFocusState$ = new Subject<WindowFocusState>(); // TODO why observable?

  private _navigationDenial$ = new Subject<{ sourceUnitSequenceId: number, reason: VeronaNavigationDeniedReason[] }>();

  get navigationDenial$(): Observable<{ sourceUnitSequenceId: number, reason: VeronaNavigationDeniedReason[] }> {
    return this._navigationDenial$;
  }

  private players: { [filename: string]: string } = {};
  private testState: { [key in TestStateKey]?: string } = {};

  navigation$: Subject<NavigationState> = new BehaviorSubject<NavigationState>({
    targets: {
      next: null,
      previous: null,
      first: null,
      last: null,
      end: null
    },
    directions: {
      forward: 'yes',
      backward: 'yes'
    }
  });

  private readonly bufferEventBus$ = new Subject<BufferEvent>();
  private readonly closeBuffers$ = new Subject<string>();
  private readonly unitDataPartsBuffer$ = new Subject<UnitDataParts>();
  private readonly unitStateBuffer$ = new Subject<UnitStateUpdate>();
  private readonly testStateBuffer$ = new Subject<TestStateUpdate>();
  private readonly subscriptions: { [key: string]: Subscription } = {};

  constructor(
    private router: Router,
    private bs: BackendService,
    private ms: MessageService,
    private mds: MainDataService,
    private cts: CustomtextService,
    public confirmDialog: MatDialog
  ) {
    this.setupUnitDataPartsBuffer();
    this.setupUnitStateBuffer();
    this.setupTestStateBuffer();
  }

  setupUnitDataPartsBuffer(): void {
    this.destroySubscription('unitDataPartsBuffer'); // important when called from unit-test with fakeAsync

    const closingSignal = this.createClosingSignal('unit_responses_buffer_time');

    this.subscriptions.unitDataPartsBuffer = this.unitDataPartsBuffer$
      .pipe(
        bufferWhen(closingSignal.factory),
        map(TestStateUtil.sortDataParts),
        withLatestFrom(closingSignal.tracker$)
      )
      .subscribe(([buffer, closer]) => {
        let trackedVariablesChanged = false;
        buffer
          .forEach(changedDataPartsPerUnit => {
            trackedVariablesChanged = this.updateVariables(
              this.unitAliasMap[changedDataPartsPerUnit.unitAlias],
              changedDataPartsPerUnit.unitStateDataType,
              changedDataPartsPerUnit.dataParts
            );
          });

        if (trackedVariablesChanged) {
          this.evaluateConditions();
        }

        this.bufferEventBus$.next({ type: 'unitData', event: 'closed', id: String(closer) });

        if (this.testMode.saveResponses) {
          forkJoin(
            buffer.map(changedDataPartsPerUnit => this.bs.updateDataParts(
              this.testId,
              changedDataPartsPerUnit.unitAlias,
              this.units[this.unitAliasMap[changedDataPartsPerUnit.unitAlias]].id,
              changedDataPartsPerUnit.dataParts,
              changedDataPartsPerUnit.unitStateDataType
            ))
          )
            .subscribe({
              complete: () => this.bufferEventBus$.next({ type: 'unitData', event: 'saved', id: String(closer) })
            });
        } else {
          this.bufferEventBus$.next({ type: 'unitData', event: 'saved', id: String(closer) });
        }
      });
  }

  private createClosingSignal(
    configSetting: keyof BookletConfigData
  ): { tracker$: Observable<string>, factory: () => Observable<string> } {
    const tracker$ = new Subject<string>();

    const factory = () => {
      const closer$ = merge(
        timer(Number(this.booklet?.config[configSetting] || 100000)).pipe(map(() => 'timer')),
        this.closeBuffers$
      );
      closer$.subscribe(tracker$);
      return closer$;
    };
    return { tracker$, factory };
  }

  setupUnitStateBuffer(): void {
    this.destroySubscription('unitStateBuffer');
    const closingSignal = this.createClosingSignal('unit_state_buffer_time');
    this.subscriptions.unitStateBuffer = this.unitStateBuffer$
      .pipe(
        bufferWhen(closingSignal.factory),
        map(TestStateUtil.sort),
        withLatestFrom(closingSignal.tracker$)
      )
      .subscribe(([buffer, closer]) => {
        this.bufferEventBus$.next({ type: 'unitState', event: 'closed', id: String(closer) });
        if (!this.testMode.saveResponses) {
          this.bufferEventBus$.next({ type: 'unitState', event: 'saved', id: String(closer) });
        } else {
          from(buffer).pipe(
            concatMap(patch => this.bs.patchUnitState(patch, this.units[this.unitAliasMap[patch.unitAlias]].id))
          ).subscribe(
            {
              complete: () => this.bufferEventBus$.next({ type: 'unitState', event: 'saved', id: String(closer) })
            }
          );
        }
      });
  }

  setupTestStateBuffer(): void {
    this.destroySubscription('testStateBuffer');
    const closingSignal = this.createClosingSignal('test_state_buffer_time');
    this.subscriptions.testStateBuffer = this.testStateBuffer$
      .pipe(
        bufferWhen(closingSignal.factory),
        map(TestStateUtil.sort),
        withLatestFrom(closingSignal.tracker$)
      )
      .subscribe(([buffer, closer]) => {
        this.bufferEventBus$.next({ type: 'testState', event: 'closed', id: String(closer) });
        if (!this.testMode.saveResponses) {
          this.bufferEventBus$.next({ type: 'testState', event: 'saved', id: String(closer) });
        } else {
          forkJoin(
            buffer
              .filter(patch => !!patch.testId)
              .map(patch => this.bs.patchTestState(patch))
          ).subscribe(
            () => { this.bufferEventBus$.next({ type: 'testState', event: 'saved', id: String(closer) }); }
          );
        }
      });
  }

  setTestState(key: TestStateKey, content: string): void {
    if (this.testState[key] === content) return;
    this.testState[key] = content;
    this.testStateBuffer$.next(<TestStateUpdate>{
      testId: this.testId,
      unitAlias: '',
      state: [{ key, content, timeStamp: Date.now() }]
    });
  }

  destroySubscription(name: string): void {
    this.subscriptions[name]?.unsubscribe();
    delete this.subscriptions[name];
  }

  async closeBuffer(reasonType: string, trackEvent: BufferEventType = 'closed'): Promise<NavigationState> {
    const closingSignalId = `${reasonType}:${Math.random()}`;

    const closingBufferListener = this.bufferEventBus$
      .pipe(
        scan(
          (agg, current) => {
            if ((current.id === closingSignalId) && (current.event === trackEvent)) {
              agg.add(current);
            }
            return agg;
          },
          new Set<BufferEvent>()
        ),
        takeWhile(collectedEvents => collectedEvents.size < bufferTypes.length, true),
        withLatestFrom(this.navigation$),
        map(([collectedEvents, navigation]) => navigation)
      );

    setTimeout(() => this.closeBuffers$.next(closingSignalId));
    return lastValueFrom(closingBufferListener);
  }

  reset(): void {
    this.players = {};

    this.currentUnitSequenceId = 0;

    this.booklet = null;
    this.units = {};
    this.testlets = {};
    this.unitAliasMap = {};

    this.timerWarningPoints = [];
    this.workspaceId = 0;

    this.timers = {};
    this.testState = {};

    if (this.timerIntervalSubscription !== null) {
      this.timerIntervalSubscription.unsubscribe();
      this.timerIntervalSubscription = null;
    }
    this.currentTimerId = '';
  }

  updateUnitStateDataParts(unitSequenceId: number, dataParts: KeyValuePairString, unitStateDataType: string): void {
    const unit = this.getUnit(unitSequenceId);

    const changedParts: KeyValuePairString = {};
    Object.keys(dataParts)
      .forEach(dataPartId => {
        if (
          !unit.dataParts[dataPartId] ||
          (unit.dataParts[dataPartId] !== dataParts[dataPartId])
        ) {
          unit.dataParts[dataPartId] = dataParts[dataPartId];
          changedParts[dataPartId] = dataParts[dataPartId];
        }
      });
    if (Object.keys(changedParts).length) {
      this.unitDataPartsBuffer$.next({
        testId: this.testId,
        unitAlias: unit.alias,
        dataParts: changedParts,
        unitStateDataType
      });
    }
    this.updateNavigationState(); // now, not after buffer is closed, because it affects forward/backward, not choice
  }

  updateUnitState(unitSequenceId: number, unitStateUpdate: StateReportEntry<UnitStateKey>[]): void {
    const unit = this.getUnit(unitSequenceId);

    const setUnitState = (stateKey: string, value: string): void => {
      if (stateKey === 'RESPONSE_PROGRESS' && isVeronaProgress(value)) {
        unit.state.RESPONSE_PROGRESS = value;
      }

      if (stateKey === 'PRESENTATION_PROGRESS' && isVeronaProgress(value)) {
        unit.state.PRESENTATION_PROGRESS = value;
      }

      if (stateKey === 'CURRENT_PAGE_ID') {
        unit.state.CURRENT_PAGE_ID = value;
      }
    };

    const changedStates = unitStateUpdate
      .filter(state => !!state.content)
      .filter(changedState => {
        const oldState = unit.state[changedState.key];
        if (oldState) {
          return oldState !== changedState.content;
        }
        return true;
      });
    changedStates
      .forEach(changedState => setUnitState(changedState.key, changedState.content));
    if (changedStates.length) {
      this.unitStateBuffer$.next({
        unitAlias: unit.alias,
        testId: this.testId,
        state: changedStates
      });
    }
  }

  addPlayer(fileName: string, player: string): void {
    this.players[fileName] = player;
  }

  hasPlayer(fileName: string): boolean {
    return fileName in this.players;
  }

  getPlayer(fileName: string): string {
    return this.players[fileName];
  }

  clearTestlet(testletId: string): void {
    if (!this.testlets[testletId] || !this.testlets[testletId].restrictions.codeToEnter?.code) {
      return;
    }
    this.testlets[testletId].locks.code = false;
    this.updateLocks();
    const unlockedTestlets = Object.values(this.testlets)
      .filter(t => t.restrictions.codeToEnter?.code && !t.locks.code)
      .map(t => t.id);
    this.setTestState('TESTLETS_CLEARED_CODE', JSON.stringify(unlockedTestlets));
  }

  leaveLockTestlet(testletId: string): void {
    this.testlets[testletId].locks.afterLeave = true;
    this.updateLocks();
    const lockedTestlets = Object.values(this.testlets)
      .filter(t => (t.restrictions.lockAfterLeaving?.scope === 'testlet') && t.locks.afterLeave)
      .map(t => t.id);
    this.setTestState('TESTLETS_LOCKED_AFTER_LEAVE', JSON.stringify(lockedTestlets));
  }

  leaveLockUnit(unitSequenceId: number): void {
    this.units[unitSequenceId].lockedAfterLeaving = true;
    const lockedUnits = Object.values(this.units)
      .filter(u => (u.parent.restrictions.lockAfterLeaving?.scope === 'unit') && u.lockedAfterLeaving)
      .map(u => u.sequenceId);
    this.setTestState('UNITS_LOCKED_AFTER_LEAVE', JSON.stringify(lockedUnits));
  }

  getUnit(unitSequenceId: number): Unit {
    if (!this.booklet) { // when loading process was aborted
      throw new MissingBookletError();
    }
    const unit = this.units[unitSequenceId];

    if (!unit) {
      // eslint-disable-next-line no-console
      console.error(`Unit not found: ${unitSequenceId}`);
      throw new AppError({
        label: `Unit not found: ${unitSequenceId}`,
        description: '',
        type: 'script'
      });
    }
    return unit;
  }

  restoreTime(testlet: Testlet, timeGivenByGm: number): void {
    if (!testlet.restrictions?.timeMax) return;
    if (typeof this.timers[testlet.id] === 'undefined') return;
    if (this.timers[testlet.id] > 0) return;
    if (this.timers[testlet.id] <= 0) {
      this.timers[testlet.id] = timeGivenByGm;
    }
    testlet.locks.time = false;
  }

  startTimer(testlet: Testlet): void {
    if (!testlet.restrictions?.timeMax) {
      return;
    }
    const timeLeftMinutes = (this.timers[testlet.id] && (this.timers[testlet.id] > 0)) ?
      Math.min(this.timers[testlet.id], testlet.restrictions.timeMax.minutes) :
      testlet.restrictions.timeMax.minutes;
    if (this.timerIntervalSubscription !== null) {
      this.timerIntervalSubscription.unsubscribe();
    }
    this.timers$.next(new TimerData(timeLeftMinutes, testlet.id, MaxTimerEvent.STARTED));
    this.currentTimerId = testlet.id;

    let timeTicker$ = this.createTicker();
    this.timerIntervalSubscription = timeTicker$
      .pipe(
        takeUntil(
          timer(timeLeftMinutes * 60 * 1000)
        ),
        map(val => (timeLeftMinutes * 60) - val - 1)
      ).subscribe({
        next: val => {
          this.timers$.next(new TimerData(val / 60, testlet.id, MaxTimerEvent.STEP));
        },
        error: e => {
          throw e;
        },
        complete: () => {
          this.timers$.next(new TimerData(0, testlet.id, MaxTimerEvent.ENDED));
          this.finishTimer();
        }
      });
  }

  private finishTimer() {
    if (this.timerIntervalSubscription !== null) {
      this.timerIntervalSubscription.unsubscribe();
    }
    this.timerIntervalSubscription = null;
    this.currentTimerId = '';
  }

  cancelTimer(): void {
    if (this.currentTimerId) {
      this.timers$.next(new TimerData(0, this.currentTimerId, MaxTimerEvent.CANCELLED));
    }
    this.finishTimer();
  }

  interruptTimer(): void {
    if (this.currentTimerId) {
      this.timers$.next(new TimerData(0, this.currentTimerId, MaxTimerEvent.INTERRUPTED));
    }
    this.finishTimer();
  }

  // TODO import the webworker from a seperate file. At time of implementing, some SCP problems occured
  private createTicker(): Observable<number> {
    if (typeof Worker !== 'undefined') {
      const workerCode = `
        let timer;
        let secondsPassed = 0;
        self.onmessage = function(message) {
          switch (message.data) {
            case 'on':
              postMessage(secondsPassed++);
              timer = setInterval(() => postMessage(secondsPassed++), 1000);
              console.log('timeTicker from webworker used');
              break;
            case 'off':
              clearInterval(timer);
          }
        };  
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerTimer = new Worker(URL.createObjectURL(blob));
      return new Observable(subscriber => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const eventHandler = (event) => {
          subscriber.next(event.data);
        };

        workerTimer.addEventListener('message', eventHandler);
        workerTimer.postMessage('on');

        return function unsubscribe () {
          workerTimer.postMessage('off');
          workerTimer.removeEventListener('message', eventHandler);
        };
      });
    } else {
      return interval(1000);
    }

  }

  async terminateTest(logEntryKey: string, force: boolean, lockTest: boolean = false): Promise<boolean> {
    if (this.state$.getValue() === 'TERMINATED') return true; // sometimes terminateTest get called two times

    const navigationSuccessful = await lastValueFrom(this.canDeactivateUnit('/r/starter'));
    if (!(navigationSuccessful || force)) return true;

    this.state$.next((this.state$.getValue() === 'PAUSED') ? 'TERMINATED_PAUSED' : 'TERMINATED');
    await this.closeBuffer(`terminateTest:${logEntryKey}`, 'saved');

    if (lockTest) {
      await lastValueFrom(this.bs.lockTest(this.testId, Date.now(), logEntryKey));
    }

    return this.router.navigate(['/r/starter'], { state: { force: force } });
  }

  async setUnitNavigationRequest(navString: string, force = false): Promise<boolean> {
    if (!this.booklet) {
      return this.router.navigate([`/t/${this.testId}/status`], { skipLocationChange: true, state: { force } });
    }
    let navigation: NavigationState;
    switch (navString) {
      case UnitNavigationTarget.PAUSE:
      case UnitNavigationTarget.ERROR:
        navigation = await this.closeBuffer(`setUnitNavigationRequest(${navString} NEXT`);
        return this.router.navigate([`/t/${this.testId}/status`], { skipLocationChange: true, state: { force } });
      case UnitNavigationTarget.NEXT:
        navigation = await this.closeBuffer(`setUnitNavigationRequest(${navString} NEXT`);
        return this.router.navigate([`/t/${this.testId}/u/${navigation.targets.next}`], { state: { force } });
      case UnitNavigationTarget.PREVIOUS:
        navigation = await this.closeBuffer(`setUnitNavigationRequest(${navString} PREVIOUS`);
        return this.router.navigate([`/t/${this.testId}/u/${navigation.targets.previous}`], { state: { force } });
      case UnitNavigationTarget.FIRST:
        navigation = await this.closeBuffer(`setUnitNavigationRequest(${navString} FIRST`);
        return this.router.navigate([`/t/${this.testId}/u/${navigation.targets.first}`], { state: { force } });
      case UnitNavigationTarget.LAST:
        navigation = await this.closeBuffer(`setUnitNavigationRequest(${navString} LAST`);
        return this.router.navigate([`/t/${this.testId}/u/${navigation.targets.last}`], { state: { force } });
      case UnitNavigationTarget.END:
        return this.terminateTest(
          force ? 'BOOKLETLOCKEDforced' : 'BOOKLETLOCKEDbyTESTEE',
          force,
          this.booklet?.config.lock_test_on_termination === 'ON'
        );
      default:
        // eslint-disable-next-line no-case-declarations
        const targetIsCurrent = this.currentUnitSequenceId.toString(10) === navString;
        return this.router.navigate(
          [`/t/${this.testId}/u/${navString}`],
          {
            state: { force },
            // eslint-disable-next-line no-bitwise
            queryParams: targetIsCurrent ? { reload: Date.now() >> 11 } : {}
            //  unit shall be reloaded even if we are there already there
          }
        )
          .then(navOk => {
            if (!navOk && !targetIsCurrent) {
              // happens when a goto goes to a unit which does exist, but is not accessible
              this.ms.show(`Navigation zu ${navString} nicht erlaubt.`);
            }
            return navOk;
          });
    }
  }

  errorOut(): void {
    this.totalLoadingProgress = 0;
    this.state$.next('ERROR');
    this.setUnitNavigationRequest(UnitNavigationTarget.ERROR);
  }

  pause(): Promise<boolean> {
    this.interruptTimer();
    this.state$.next('PAUSED');
    return this.setUnitNavigationRequest(UnitNavigationTarget.PAUSE, true);
  }

  resume(): Promise<boolean> {
    const target = (this.currentUnitSequenceId > 0) ? String(this.currentUnitSequenceId) : UnitNavigationTarget.FIRST;
    this.state$.next('RUNNING');
    return this.setUnitNavigationRequest(target, true);
  }

  updateLocks(): void {
    const activatedLockTypes = TestletLockTypes;

    const updateLocks = (testlet: Testlet, parents: Testlet[] = []): void => {
      testlet.locked = [...parents, testlet]
        .flatMap(item => activatedLockTypes.map(lockType => ({ through: item, by: lockType })))
        .find(isLocked => isLocked.through.locks[isLocked.by]) || null;
      testlet.children
        .filter(isTestlet)
        .forEach(child => updateLocks(child, [...parents, testlet]));
    };

    if (!this.booklet) {
      return;
    }

    updateLocks(this.testlets[this.booklet.units.id]);
    this.updateNavigationState();
  }

  updateNavigationState(): void {
    if (!this.currentUnitSequenceId) return;
    this.navigation$.next(this.getNavigationState(this.currentUnitSequenceId));
  }

  getNavigationState(fromUnitSequenceId: number): NavigationState {
    let unit: Unit;
    let first = null;
    // eslint-disable-next-line @typescript-eslint/no-shadow
    let last = null;
    let previous = null;
    let next = null;
    for (let sequenceId = 1; sequenceId <= Object.keys(this.units).length; sequenceId++) {
      unit = this.units[sequenceId];
      if (!TestControllerService.unitIsInaccessible(unit)) {
        last = unit.sequenceId;
        if (sequenceId > fromUnitSequenceId && next === null) {
          next = unit.sequenceId;
        }
        if (first === null) {
          first = unit.sequenceId;
        }
        if (sequenceId < fromUnitSequenceId) {
          previous = unit.sequenceId;
        }
      }
    }
    const end = (this.booklet?.config.allow_player_to_terminate_test === 'ON') ||
    ((this.booklet?.config.allow_player_to_terminate_test === 'LAST_UNIT') && (fromUnitSequenceId === last)) ?
      Infinity :
      null;

    let forward: NavigationDirectionValue = 'yes';
    let backward: NavigationDirectionValue = (this.booklet?.config?.unit_navibuttons !== 'FORWARD_ONLY') ? 'yes' : 'no';
    if (this.currentUnit && this.checkCompleteness(this.currentUnit, 'forward').length) {
      forward = 'markedNo';
    }
    if (this.currentUnit && this.checkCompleteness(this.currentUnit, 'backward').length) {
      backward = 'markedNo';
    }

    previous = backward !== 'no' ? previous : null;
    first = backward !== 'no' ? previous : null;

    return {
      directions: { forward, backward },
      targets: {
        next, previous, first, last, end
      }
    };
  }

  checkCompleteness(unit: Unit, direction: NavigationDirection): VeronaNavigationDeniedReason[] {
    if (unit.parent.locked || unit.lockedAfterLeaving) {
      return [];
    }
    const reasons: VeronaNavigationDeniedReason[] = [];
    const checkOnValue = {
      forward: <NavigationLeaveRestrictionValue[]>['ON', 'ALWAYS'],
      backward: <NavigationLeaveRestrictionValue[]>['ALWAYS']
    };
    const presentationCompleteRequired =
      unit.parent?.restrictions?.denyNavigationOnIncomplete?.presentation ||
      this.booklet?.config.force_presentation_complete ||
      'OFF';
    if (
      (checkOnValue[direction].includes(presentationCompleteRequired)) &&
      (unit.state.PRESENTATION_PROGRESS !== 'complete')
    ) {
      reasons.push('presentationIncomplete');
    }
    const responseCompleteRequired =
      unit.parent?.restrictions?.denyNavigationOnIncomplete?.response ||
      this.booklet?.config.force_response_complete ||
      'OFF';
    if (
      (checkOnValue[direction].includes(responseCompleteRequired)) &&
      unit.state.RESPONSE_PROGRESS &&
      (VeronaProgressIncompleteValues.includes(unit.state.RESPONSE_PROGRESS))
    ) {
      reasons.push('responsesIncomplete');
    }
    return reasons;
  }

  static unitIsInaccessible(unit: Unit): boolean {
    if (unit.lockedAfterLeaving) return true;
    if (!unit.parent.locked) return false;
    if (
      (unit.parent.locked.by === 'code') &&
      (unit.localIndex === 0) &&
      (!unit.parent.locks.show) &&
      (!unit.parent.locks.time) &&
      (!unit.parent.locks.afterLeave)
    ) return false; // allow it to enter the first unit of a code-locked block to enter the code
    return true;
  }

  updateVariables(
    sequenceId: number,
    unitStateDataType: string = this.units[sequenceId].responseType || 'unknown',
    dataParts: KeyValuePairString = this.units[sequenceId].dataParts
  ): boolean {
    const isIqbStandard = unitStateDataType.match(/iqb-standard@(\d+)/);
    const iqbStandardVersion = isIqbStandard ? Number(isIqbStandard[1]) : 0;
    if (
      iqbStandardVersion < (this.mds.appConfig?.iqbStandardResponseTypeMin || NaN) ||
      iqbStandardVersion > (this.mds.appConfig?.iqbStandardResponseTypeMax || NaN)
    ) {
      return false;
    }
    const trackedVariables = Object.keys(this.units[sequenceId].variables);
    if (!trackedVariables.length) {
      return false;
    }

    const filterRegex = new RegExp(
      trackedVariables
        .map(varn => `"id":\\s*"${varn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`)
        .join('|')
    );

    let somethingChanged = false;
    Object.values(dataParts)
      .forEach(dataPart => {
        if (!dataPart.match(filterRegex)) {
          // for the sake of performance we check the appearance of the tracked variable in the chunk before JSON.parse
          // see commit message for details
          return;
        }
        const data = JSON.parse(dataPart);
        if (!Array.isArray(data)) {
          return;
        }
        data
          .forEach(variable => {
            if (!isIQBVariable(variable)) {
              return;
            }
            if (typeof this.units[sequenceId].variables[variable.id] === 'undefined') {
              // variable is not tracked
              return;
            }

            if (
              this.units[sequenceId].variables[variable.id].status === variable.status &&
              this.units[sequenceId].variables[variable.id].value === variable.value &&
              this.units[sequenceId].variables[variable.id].code === variable.code &&
              this.units[sequenceId].variables[variable.id].score === variable.score
            ) {
              // nothing has actually changed
              return;
            }

            this.units[sequenceId].variables[variable.id] = variable;
            somethingChanged = true;
          });
      });
    if (somethingChanged && this.units[sequenceId].scheme.variableCodings.length) {
      this.codeVariables(sequenceId);
    }

    return somethingChanged;
  }

  private codeVariables(sequenceId: number): void {
    const baseVars = Object.values(this.units[sequenceId].variables)
      .filter(vari => this.units[sequenceId].baseVariableIds.includes(vari.id));
    this.units[sequenceId].scheme.code(baseVars)
      .forEach(variable => {
        if (variable.id in this.units[sequenceId].variables) {
          this.units[sequenceId].variables[variable.id] = variable;
        }
      });
  }

  evaluateConditions(): void {
    this.updateStates();
    this.onStateOptionChanged();
  }

  onStateOptionChanged(): void {
    this.updateShowLocks();
    this.updateLocks();
    this.saveConditionsTestState();
  }

  private updateStates(): void {
    if (!this.booklet?.states) return;
    const getVar =
      (unitAlias: string, variableId: string) => this.units[this.unitAliasMap[unitAlias]].variables[variableId];
    Object.values(this.booklet.states)
      .forEach(state => {
        const firstMatchingOption =
          Object.values(state.options)
            .find(option => {
              option.firstUnsatisfiedCondition =
                option.conditions
                  .findIndex(condition => !ConditionUtil.isSatisfied(condition, getVar));
              return option.firstUnsatisfiedCondition === -1;
            });
        state.current = firstMatchingOption?.id || state.options[Object.keys(state.options).length - 1].id;
      });
  }

  private updateShowLocks(): void {
    Object.values(this.testlets)
      .forEach(testlet => {
        if (!testlet.restrictions.show) return;
        const current =
          this.booklet?.states[testlet.restrictions.show.if].override ||
          this.booklet?.states[testlet.restrictions.show.if].current;
        testlet.locks.show = current !== testlet.restrictions.show.is;
      });
  }

  private saveConditionsTestState(): void {
    const bookletStates = Object.values(this.booklet?.states || {})
      .reduce(
        (agg, state) => {
          agg[state.id] = state.override || state.current;
          return agg;
        }, <{ [state: string]: string }>{});
    if (!Object.keys(bookletStates).length) return;
    this.setTestState('BOOKLET_STATES', JSON.stringify(bookletStates));
  }

  private checkAndSolveTimer(currentUnit: Unit, newUnit: Unit | null): Observable<boolean> {
    if (!this.currentTimerId) { // leaving unit is not in a timed block
      return of(true);
    }
    if (newUnit && newUnit.parent.timerId && // staying in the same timed block
      (newUnit.parent.timerId === this.currentTimerId)
    ) {
      return of(true);
    }
    if (!this.testMode.forceTimeRestrictions) {
      this.interruptTimer();
      return of(true);
    }
    if (this.testlets[this.currentTimerId].restrictions.timeMax?.leave === 'forbidden') {
      this.ms.show('Es darf erst weiter geblättert werden, wenn die Zeit abgelaufen ist.');
      return of(false);
    }
    if (this.testlets[this.currentTimerId].restrictions.timeMax?.leave === 'allowed') {
      this.cancelTimer();
      return of(true);
    }

    const dialogCDRef = this.confirmDialog.open(ConfirmDialogComponent, {
      width: '500px',
      data: <ConfirmDialogData>{
        title: this.cts.getCustomText('booklet_warningLeaveTimerBlockTitle'),
        content: this.cts.getCustomText('booklet_warningLeaveTimerBlockTextPrompt'),
        confirmbuttonlabel: 'Hier bleiben',
        confirmbuttonreturn: true,
        cancelbuttonlabel: 'Trotzdem weiter',
        showcancel: true
      }
    });
    return dialogCDRef.afterClosed()
      .pipe(
        map(cdresult => {
          if ((typeof cdresult === 'undefined') || (cdresult === true)) {
            return false;
          }
          this.cancelTimer(); // does locking the block
          return true;
        })
      );
  }

  private checkAndSolveCompleteness(currentUnit: Unit, newUnit: Unit | null): Observable<boolean> {
    const direction = (!newUnit || currentUnit.sequenceId < newUnit.sequenceId) ? 'forward' : 'backward';
    const reasons = this.checkCompleteness(currentUnit, direction);
    if (!reasons.length) {
      return of(true);
    }
    return this.notifyNavigationDenied(currentUnit, reasons, direction);
  }

  private notifyNavigationDenied(
    currentUnit: Unit,
    reasons: VeronaNavigationDeniedReason[],
    direction: NavigationDirection
  ): Observable<boolean> {
    if (this.testMode.forceNaviRestrictions) {
      this._navigationDenial$.next({ sourceUnitSequenceId: currentUnit.sequenceId, reason: reasons });

      const dialogCDRef = this.confirmDialog.open(ConfirmDialogComponent, {
        width: '500px',
        data: <ConfirmDialogData>{
          title: this.cts.getCustomText('booklet_msgNavigationDeniedTitle'),
          content: reasons
            .map(r => this.cts.getCustomText(`booklet_msgNavigationDeniedText_${r}`))
            .join(' '),
          confirmbuttonlabel: 'OK',
          confirmbuttonreturn: false,
          showcancel: false
        }
      });
      return dialogCDRef.afterClosed().pipe(map(() => false));
    }
    const reasonTexts = {
      presentationIncomplete: 'Es wurde nicht alles gesehen oder abgespielt.',
      responsesIncomplete: 'Es wurde nicht alles bearbeitet.'
    };
    this.ms.show(
      `Im Testmodus dürfte hier nicht ${(direction === 'forward') ? 'weiter' : ' zurück'} geblättert
      werden: ${reasons.map(r => reasonTexts[r]).join(' ')}.`
    );
    return of(true);
  }

  private checkAndSolveLeaveLocks(currentUnit: Unit, newUnit: Unit | null): Observable<boolean> {
    if (!currentUnit.parent.restrictions.lockAfterLeaving) {
      return of(true);
    }

    const lockScope = currentUnit.parent.restrictions.lockAfterLeaving.scope;

    if ((lockScope === 'testlet') && (newUnit?.parent.id === currentUnit.parent.id)) {
      return of(true);
    }

    const leaveLock = () => {
      if (this.testMode.forceNaviRestrictions) {
        if (lockScope === 'testlet') {
          this.leaveLockTestlet(currentUnit.parent.id);
        }
        if (lockScope === 'unit') {
          this.leaveLockUnit(currentUnit.sequenceId);
        }
      } else {
        this.ms.show(`${lockScope} würde im Testmodus nun gesperrt werden.`);
      }
    };

    if (currentUnit.parent.restrictions.lockAfterLeaving.confirm) {
      const dialogCDRef = this.confirmDialog.open(ConfirmDialogComponent, {
        width: '500px',
        data: <ConfirmDialogData>{
          title: this.cts.getCustomText(`booklet_warningLeaveTitle-${lockScope}`),
          content: this.cts.getCustomText(`booklet_warningLeaveTextPrompt-${lockScope}`),
          confirmbuttonlabel: 'Hier bleiben',
          confirmbuttonreturn: true,
          cancelbuttonlabel: 'Trotzdem weiter',
          showcancel: true
        }
      });
      return dialogCDRef.afterClosed()
        .pipe(
          map(cdresult => {
            if ((typeof cdresult === 'undefined') || (cdresult === true)) {
              return false;
            }
            leaveLock();
            return true;
          })
        );
    }
    leaveLock();
    return of(true);
  }

  canDeactivateUnit(nextStateUrl: string): Observable<boolean> {
    if (nextStateUrl === '/r/route-dispatcher') {
      return of(true);
    }
    if (this.state$.getValue() === 'ERROR') {
      return of(true);
    }

    if (!this.currentUnit) {
      return of(true);
    }

    const currentUnit = this.currentUnit;

    if (this.currentUnit.parent.locked) {
      return of(true);
    }

    let newUnit: Unit | null = null;
    const match = nextStateUrl.match(/t\/(\d+)\/u\/(\d+)$/);
    if (match) {
      const targetUnitSequenceId = Number(match[2]);
      newUnit = this.units[targetUnitSequenceId] || null;
    }

    const forceNavigation = this.router.getCurrentNavigation()?.extras?.state?.force ?? false;
    if (forceNavigation) {
      this.interruptTimer();
      return of(true);
    }

    return from([
      this.checkAndSolveCompleteness.bind(this),
      this.checkAndSolveTimer.bind(this),
      this.checkAndSolveLeaveLocks.bind(this)
    ])
      .pipe(
        concatMap(check => check(currentUnit, newUnit)),
        takeWhile(checkResult => checkResult, true),
        last()
      );
  }
}
