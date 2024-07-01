import {
  bufferWhen, map, startWith, takeUntil, tap
} from 'rxjs/operators';
import {
  BehaviorSubject, firstValueFrom, interval, merge, Observable, Subject, Subscription, timer
} from 'rxjs';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ResponseValueType as IQBVariableValueType } from '@iqb/responses';
import { TimerData } from '../classes/test-controller.classes';
import {
  Booklet, isTestlet, KeyValuePairNumber,
  KeyValuePairString,
  MaxTimerEvent,
  TestControllerState, Testlet, TestletLockTypes,
  TestStateKey, TestStateUpdate, Unit,
  UnitDataParts,
  UnitNavigationTarget,
  UnitStateUpdate,
  WindowFocusState
} from '../interfaces/test-controller.interfaces';
import { BackendService } from './backend.service';
import {
  BlockCondition, BlockConditionSource,
  BookletConfig, MainDataService, sourceIsConditionAggregation,
  sourceIsSingleSource, sourceIsSourceAggregation,
  TestMode
} from '../../shared/shared.module';
import { isVeronaProgress, VeronaNavigationDeniedReason } from '../interfaces/verona.interfaces';
import { MissingBookletError } from '../classes/missing-booklet-error.class';
import { MessageService } from '../../shared/services/message.service';
import { AppError } from '../../app.interfaces';

import { IqbVariableUtil } from '../util/iqb-variable.util';
import { AggregatorsUtil } from '../util/aggregators.util';
import { IQBVariableStatusList, isIQBVariable } from '../interfaces/iqb.interfaces';
import { TestStateUtil } from '../util/test-state.util';

@Injectable({
  providedIn: 'root'
})
export class TestControllerService {
  static readonly unitDataBufferMs = 60000;
  static readonly unitStateBufferMs = 10000;

  testId = '';
  state$ = new BehaviorSubject<TestControllerState>('INIT');

  workspaceId = 0;

  totalLoadingProgress = 0;

  testMode = new TestMode();
  bookletConfig = new BookletConfig();

  units: { [sequenceId: number]: Unit } = {};
  testlets: { [testletId: string] : Testlet } = {};
  unitAliasMap: { [unitId: string] : number } = {};

  get currentUnit(): Unit {
    return this.units[this.currentUnitSequenceId];
  }

  private _booklet: Booklet | null = null;
  get booklet(): Booklet | null {
    if (!this._booklet) {
      // console.trace();
      // throw new MissingBookletError();
    }
    return this._booklet;
  }

  set booklet(booklet: Booklet) {
    this._booklet = booklet;
  }

  get sequenceLength(): number { // TODO X can/must this be replaced with sequenceBounds?
    return Object.keys(this.units).length;
  }

  timers$ = new Subject<TimerData>();
  timers: KeyValuePairNumber = {}; // TODO remove the redundancy with timers$
  currentTimerId = '';
  private timerIntervalSubscription: Subscription | null = null;
  timerWarningPoints: number[] = [];

  resumeTargetUnitSequenceId = 0;

  windowFocusState$ = new Subject<WindowFocusState>();

  private _navigationDenial$ = new Subject<{ sourceUnitSequenceId: number, reason: VeronaNavigationDeniedReason[] }>();

  get navigationDenial$(): Observable<{ sourceUnitSequenceId: number, reason: VeronaNavigationDeniedReason[] }> {
    return this._navigationDenial$;
  }

  private _currentUnitSequenceId$: BehaviorSubject<number> = new BehaviorSubject<number>(-Infinity);
  get currentUnitSequenceId(): number {
    return this._currentUnitSequenceId$.getValue();
  }

  set currentUnitSequenceId(v: number) {
    this._currentUnitSequenceId$.next(v);
  }

  get currentUnitSequenceId$(): Observable<number> {
    return this._currentUnitSequenceId$.asObservable();
  }

  private players: { [filename: string]: string } = {};

  testStructureChanges$ = new BehaviorSubject<void>(undefined);
  private closeBuffers$ = new Subject<void>();
  private unitDataPartsToSave$ = new Subject<UnitDataParts>();
  private unitDataPartsToSaveSubscription: Subscription | null = null;
  private unitDataPartsBufferClosed$ = new Subject<void>();

  private unitStateToSave$ = new Subject<UnitStateUpdate>();
  private unitStateToSaveSubscription: Subscription | null = null;
  private testStateToSave$ = new Subject<TestStateUpdate>();
  private testStateToSaveSubscription: Subscription | null = null;
  private testState: { [key in TestStateKey]?: string } = {};

  constructor(
    private router: Router,
    private bs: BackendService,
    private messageService: MessageService,
    private mds: MainDataService
  ) {
    this.setupUnitDataPartsBuffer();
    this.setupUnitStateBuffer();
    this.setupTestStateBuffer();
  }

  setupUnitDataPartsBuffer(): void {
    this.destroyUnitDataPartsBuffer(); // important when called from unit-test with fakeAsync

    const sortDataPartsByUnit = (dataPartsBuffer: UnitDataParts[]): UnitDataParts[] => {
      // TODO what if test changed?
      const sortedByUnit = dataPartsBuffer
        .reduce(
          (agg, dataParts) => {
            if (!agg[dataParts.unitAlias]) agg[dataParts.unitAlias] = [];
            agg[dataParts.unitAlias].push(dataParts);
            return agg;
          },
          <{ [unitAlias: string]: UnitDataParts[] }>{}
        );
      return Object.keys(sortedByUnit)
        .map(unitAlias => ({
          unitAlias,
          dataParts: Object.assign({}, ...sortedByUnit[unitAlias].map(entry => entry.dataParts)),
          // verona4 does not support different dataTypes for different Chunks
          unitStateDataType: sortedByUnit[unitAlias][0].unitStateDataType
        }));
    };

    this.unitDataPartsBufferClosed$
      .subscribe(() => {
        console.log('buffer closed');
      });

    this.unitDataPartsToSave$
      .pipe(
        tap(data => console.log({ data })),
        bufferWhen(() => merge(interval(TestControllerService.unitDataBufferMs), this.closeBuffers$)),
        tap(buffer => console.log({ buffer })),
        map(sortDataPartsByUnit),
        tap(applyBuffer => console.log({ applyBuffer })),
        map(buffer => ({ buffer, id: Math.random() }))
      )
      .subscribe(({ buffer, id }) => {
        let trackedVariablesChanged = false;
        buffer
          .forEach(changedDataPartsPerUnit => {
            trackedVariablesChanged = this.updateVariables(
              this.unitAliasMap[changedDataPartsPerUnit.unitAlias],
              changedDataPartsPerUnit.unitStateDataType,
              changedDataPartsPerUnit.dataParts
            );
          });

        if (trackedVariablesChanged && this.booklet?.config.evaluate_testlet_conditions === 'LIVE') {
          this.evaluateConditions();
        }

        console.log('buffer ready', id, buffer.length);
        this.closeBuffer();

        if (this.testMode.saveResponses) {
          buffer
            .forEach(changedDataPartsPerUnit => {
              this.bs.updateDataParts(
                this.testId,
                changedDataPartsPerUnit.unitAlias,
                changedDataPartsPerUnit.dataParts,
                changedDataPartsPerUnit.unitStateDataType
              );
            });
        }
      });
  }

  setupUnitStateBuffer(): void {
    this.destroyUnitStateBuffer();
    this.unitStateToSaveSubscription = this.unitStateToSave$
      .pipe(
        bufferWhen(() => merge(interval(TestControllerService.unitStateBufferMs), this.closeBuffers$)),
        map(TestStateUtil.sort)
      )
      .subscribe(updates => {
        if (!this.testMode.saveResponses) return;
        updates
          .forEach(patch => this.bs.patchUnitState(patch));
      });
  }

  setupTestStateBuffer(): void {
    this.destroyTestStateBuffer();
    this.testStateToSaveSubscription = this.testStateToSave$
      .pipe(
        bufferWhen(() => merge(interval(TestControllerService.unitStateBufferMs), this.closeBuffers$)),
        map(TestStateUtil.sort)
      )
      .subscribe(updates => {
        if (!this.testMode.saveResponses) return;
        console.log('TTT:S', updates);
        updates
          .filter(patch => !!patch.testId)
          .forEach(patch => this.bs.patchTestState(patch));
      });
  }

  setTestState(key: TestStateKey, content: string): void {
    console.log('TTT:I', { key, content });
    if (this.testState[key] === content) return;
    console.log('TTT:A', { key, content });
    this.testState[key] = content;
    this.testStateToSave$.next(<TestStateUpdate>{
      testId: this.testId,
      unitAlias: '',
      state: [{ key, content, timeStamp: Date.now() }]
    });
  }

  destroyUnitDataPartsBuffer(): void {
    if (this.unitDataPartsToSaveSubscription) this.unitDataPartsToSaveSubscription.unsubscribe();
    this.unitDataPartsToSaveSubscription = null;
  }

  destroyUnitStateBuffer(): void {
    if (this.unitStateToSaveSubscription) this.unitStateToSaveSubscription.unsubscribe();
    this.unitStateToSaveSubscription = null;
  }

  destroyTestStateBuffer(): void {
    if (this.testStateToSaveSubscription) this.testStateToSaveSubscription.unsubscribe();
    this.testStateToSaveSubscription = null;
  }

  private async closeBuffer(): Promise<null | void> {
    this.closeBuffers$.next();
    return firstValueFrom(this.unitDataPartsBufferClosed$.pipe(startWith(null)));
  }

  reset(): void {
    this.players = {};

    this.currentUnitSequenceId = 0;

    this._booklet = null;
    this.units = {};
    this.testlets = {};
    this.unitAliasMap = {};

    this.timerWarningPoints = [];
    this.workspaceId = 0;

    if (this.timerIntervalSubscription !== null) {
      this.timerIntervalSubscription.unsubscribe();
      this.timerIntervalSubscription = null;
    }
    this.currentTimerId = '';
  }

  // uppercase and add extension if not part
  static normaliseId(id: string, expectedExtension = ''): string {
    let normalisedId = id.trim().toUpperCase();
    const normalisedExtension = expectedExtension.toUpperCase();
    if (normalisedExtension && (normalisedId.split('.').pop() !== normalisedExtension)) {
      normalisedId += `.${normalisedExtension}`;
    }
    return normalisedId;
  }

  updateUnitStateDataParts(
    unitAlias: string,
    dataParts: KeyValuePairString,
    unitStateDataType: string
  ): void {
    const changedParts:KeyValuePairString = {};

    Object.keys(dataParts)
      .forEach(dataPartId => {
        if (
          !this.currentUnit.dataParts[dataPartId] ||
          (this.currentUnit.dataParts[dataPartId] !== dataParts[dataPartId])
        ) {
          this.currentUnit.dataParts[dataPartId] = dataParts[dataPartId];
          changedParts[dataPartId] = dataParts[dataPartId];
        }
      });
    if (Object.keys(changedParts).length) {
      this.unitDataPartsToSave$.next({ unitAlias: unitAlias, dataParts: changedParts, unitStateDataType });
    }
  }

  updateUnitState(unitSequenceId: number, unitStateUpdate: UnitStateUpdate): void {
    unitStateUpdate.state = unitStateUpdate.state
      .filter(state => !!state.content)
      .filter(changedState => {
        const oldState = this.units[unitSequenceId].state[changedState.key];
        if (oldState) {
          return oldState !== changedState.content;
        }
        return true;
      });
    unitStateUpdate.state
      .forEach(changedState => this.setUnitState(unitSequenceId, changedState.key, changedState.content));
    if (unitStateUpdate.state.length) {
      this.unitStateToSave$.next(unitStateUpdate);
    }
  }

  // TODO X rename?
  setUnitState(unitSequenceId: number, stateKey: string, value: string | undefined): void {
    if ((stateKey === 'RESPONSE_PROGRESS') && ((typeof value === 'undefined') || isVeronaProgress(value))) {
      this.units[unitSequenceId].state.RESPONSE_PROGRESS = value;
    }

    if ((stateKey === 'PRESENTATION_PROGRESS') && ((typeof value === 'undefined') || isVeronaProgress(value))) {
      this.units[unitSequenceId].state.PRESENTATION_PROGRESS = value;
    }

    if (stateKey === 'CURRENT_PAGE_ID') {
      this.units[unitSequenceId].state.CURRENT_PAGE_ID = value;
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
    if (!this._booklet) { // when loading process was aborted
      throw new MissingBookletError();
    }
    const unit = this.units[unitSequenceId];

    if (!unit) {
      // eslint-disable-next-line no-console
      console.trace();
      console.log(`Unit not found:${unitSequenceId}`, this.units);
      throw new AppError({
        label: `Unit not found:${unitSequenceId}`,
        description: '',
        type: 'script'
      });
    }
    return unit;
  }

  // TODO X the duplication of getUnit is a temporary fix, get rid of it
  getUnitSilent(unitSequenceId: number): Unit | null {
    if (!this._booklet) { // when loading process was aborted
      throw new MissingBookletError();
    }
    return this.units[unitSequenceId] || null;
  }

  async getNextUnlockedUnitSequenceId(
    unitSId: number,
    reverse: boolean = false,
    includeSelf: boolean = false
  ): Promise<number | null> {
    return this.closeBuffer()
      .then(() => {
        const step = reverse ? -1 : 1;
        let nextUnitSId = unitSId - (includeSelf ? step : 0);
        let nextUnit: Unit | null;
        do {
          nextUnitSId += step;
          if ((nextUnitSId > this.sequenceLength) || (nextUnitSId < 1)) {
            return null;
          }
          nextUnit = this.getUnitSilent(nextUnitSId);
        } while (nextUnit && TestControllerService.unitIsInaccessible(nextUnit));
        return nextUnit ? nextUnitSId : null;
      });
  }

  startTimer(testlet: Testlet): void {
    if (!testlet.restrictions?.timeMax) {
      return;
    }
    const timeLeftMinutes = (testlet.id in this.timers) ?
      Math.min(this.timers[testlet.id], testlet.restrictions.timeMax.minutes) :
      testlet.restrictions.timeMax.minutes;
    if (this.timerIntervalSubscription !== null) {
      this.timerIntervalSubscription.unsubscribe();
    }
    this.timers$.next(new TimerData(timeLeftMinutes, testlet.id, MaxTimerEvent.STARTED));
    this.currentTimerId = testlet.id;
    this.timerIntervalSubscription = interval(1000)
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
          this.currentTimerId = '';
        }
      });
  }

  cancelTimer(): void {
    if (this.timerIntervalSubscription !== null) {
      this.timerIntervalSubscription.unsubscribe();
      this.timerIntervalSubscription = null;
      this.timers$.next(new TimerData(0, this.currentTimerId, MaxTimerEvent.CANCELLED));
    }
    this.currentTimerId = '';
  }

  interruptTimer(): void {
    if (this.timerIntervalSubscription !== null) {
      this.timerIntervalSubscription.unsubscribe();
      this.timerIntervalSubscription = null;
      this.timers$.next(new TimerData(0, this.currentTimerId, MaxTimerEvent.INTERRUPTED));
    }
    this.currentTimerId = '';
  }

  notifyNavigationDenied(sourceUnitSequenceId: number, reason: VeronaNavigationDeniedReason[]): void {
    this._navigationDenial$.next({ sourceUnitSequenceId, reason });
  }

  async terminateTest(logEntryKey: string, force: boolean, lockTest: boolean = false): Promise<boolean> {
    await this.closeBuffer();
    if (
      (this.state$.getValue() === 'TERMINATED') ||
      (this.state$.getValue() === 'FINISHED')
    ) {
      // sometimes terminateTest get called two times from player
      return true;
    }

    const oldTestStatus = this.state$.getValue();
    this.state$.next(
      (oldTestStatus === 'PAUSED') ?
        'TERMINATED_PAUSED' :
        'TERMINATED'
    ); // last state that will and can be logged

    const navigationSuccessful = await this.router.navigate(['/r/starter'], { state: { force } });
    if (!(navigationSuccessful || force)) {
      this.state$.next(oldTestStatus); // navigation was denied, test continues
      return true;
    }
    return this.finishTest(logEntryKey, lockTest).then(() => true);
  }

  private async finishTest(logEntryKey: string, lockTest: boolean = false): Promise<void> {
    if (lockTest) {
      return this.bs.lockTest(this.testId, Date.now(), logEntryKey).add();
    }
    return this.state$.next('FINISHED'); // will not be logged, test is already locked maybe
  }

  async setUnitNavigationRequest(navString: string, force = false): Promise<boolean> {
    console.log({ navString });
    const targetIsCurrent = this.currentUnitSequenceId.toString(10) === navString;
    if (!this._booklet) {
      return this.router.navigate([`/t/${this.testId}/status`], { skipLocationChange: true, state: { force } });
    }
    switch (navString) {
      case UnitNavigationTarget.ERROR:
      case UnitNavigationTarget.PAUSE:
        return this.router.navigate([`/t/${this.testId}/status`], { skipLocationChange: true, state: { force } });
      case UnitNavigationTarget.NEXT:
        // eslint-disable-next-line no-case-declarations
        const nextUnlockedUnitSequenceId = await this.getNextUnlockedUnitSequenceId(this.currentUnitSequenceId);
        return this.router.navigate([`/t/${this.testId}/u/${nextUnlockedUnitSequenceId}`], { state: { force } });
      case UnitNavigationTarget.PREVIOUS:
        // eslint-disable-next-line no-case-declarations
        const prevUnlockedUnitSequenceId = await this.getNextUnlockedUnitSequenceId(this.currentUnitSequenceId, true);
        return this.router.navigate([`/t/${this.testId}/u/${prevUnlockedUnitSequenceId}`], { state: { force } });
      case UnitNavigationTarget.FIRST:
        // eslint-disable-next-line no-case-declarations
        const first = (await this.getSequenceBounds())[0];
        return this.router.navigate([`/t/${this.testId}/u/${first}`], { state: { force } });
      case UnitNavigationTarget.LAST:
        // eslint-disable-next-line no-case-declarations
        const last = (await this.getSequenceBounds())[1];
        return this.router.navigate([`/t/${this.testId}/u/${last}`], { state: { force } });
      case UnitNavigationTarget.END:
        return this.terminateTest(
          force ? 'BOOKLETLOCKEDforced' : 'BOOKLETLOCKEDbyTESTEE',
          force,
          this.bookletConfig.lock_test_on_termination === 'ON'
        );
      default:
        // eslint-disable-next-line no-case-declarations
        let navNr = parseInt(navString, 10);
        navNr = (navNr <= 1) ? 1 : navNr;
        navNr = (navNr > this.sequenceLength) ? this.sequenceLength : navNr;
        return this.router.navigate(
          [`/t/${this.testId}/u/${navNr}`],
          {
            state: { force },
            // eslint-disable-next-line no-bitwise
            queryParams: targetIsCurrent ? { reload: Date.now() >> 11 } : {}
            //  unit shall be reloaded even if we are there already there
          }
        )
          .then(navOk => {
            if (!navOk && !targetIsCurrent) {
              this.messageService.showError(`Navigation zu ${navString} nicht möglich!`);
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

  pause(): void {
    this.interruptTimer();
    this.state$.next('PAUSED');
    this.setUnitNavigationRequest(UnitNavigationTarget.PAUSE, true);
  }

  updateLocks(): void {
    const activatedLockTypes = TestletLockTypes;

    const updateLocks = (testlet: Testlet, parent: Testlet | null = null): void => {
      testlet.locked = [parent, testlet]
        .filter((item): item is Testlet => !!item)
        .flatMap(item => activatedLockTypes
          .map(lockType => ({ through: item, by: lockType }))
        )
        .find(isLocked => isLocked.through.locks[isLocked.by]) || null;
      testlet.children
        .filter(isTestlet)
        .forEach(child => updateLocks(child, testlet));
    };

    if (!this.booklet) {
      return;
    }

    updateLocks(this.testlets[this.booklet.units.id]);
    this.testStructureChanges$.next();
  }

  static unitIsInaccessible(unit: Unit): boolean {
    if (unit.lockedAfterLeaving) return true;
    if (!unit.parent.locked) return false;
    if ((unit.parent.locked.by === 'code') && (unit.localIndex === 0)) return false;
    return true;
  }

  updateVariables(sequenceId: number, unitStateDataType: string, dataParts: KeyValuePairString): boolean {
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

  codeVariables(sequenceId: number): void {
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
    console.log('evaluateConditions!');
    Object.keys(this.testlets)
      .forEach(testletId => {
        this.testlets[testletId].firstUnsatisfiedCondition =
          this.testlets[testletId].restrictions.if
            .findIndex(condition => !this.isConditionSatisfied(condition));
        this.testlets[testletId].locks.condition = this.testlets[testletId].firstUnsatisfiedCondition > -1;
      });
    this.updateLocks();
    this.updateConditionsInTestState();
  }

  private updateConditionsInTestState(): void {
    // this is a summary of the state of the conditions for navigation-UI, Group-monitor and the like
    const lockedByCondition = Object.values(this.testlets)
      .filter(testlet => testlet.restrictions.if.length && !testlet.locks.condition)
      .map(testlet => testlet.id);
    this.setTestState('TESTLETS_SATISFIED_CONDITION', JSON.stringify(lockedByCondition));
  }

  isConditionSatisfied(condition: BlockCondition): boolean {
    const getSourceValue = (source: BlockConditionSource): string | number | undefined => {
      const var1 = this.units[this.unitAliasMap[source.unitAlias]].variables[source.variable];
      // eslint-disable-next-line default-case
      switch (source.type) {
        case 'Code': return var1.code;
        case 'Value': return IqbVariableUtil.variableValueAsComparable(var1.value);
        case 'Status': return var1.status;
        case 'Score': return var1.score;
      }
      return undefined;
    };

    const getSourceValueAsNumber = (source: BlockConditionSource): number => {
      const var1 = this.units[this.unitAliasMap[source.unitAlias]].variables[source.variable];
      // eslint-disable-next-line default-case
      switch (source.type) {
        case 'Code': return var1.code ?? NaN;
        case 'Value': return IqbVariableUtil.variableValueAsNumber(var1.value);
        case 'Status': return IQBVariableStatusList.indexOf(var1.status);
        case 'Score': return var1.score ?? NaN;
      }
      return NaN;
    };

    let value : IQBVariableValueType | undefined;
    if (sourceIsSingleSource(condition.source)) {
      value = getSourceValue(condition.source);
    }
    if (sourceIsSourceAggregation(condition.source)) {
      const aggregatorName = condition.source.type.toLowerCase();
      const values = condition.source.sources.map(getSourceValueAsNumber);
      if (aggregatorName in AggregatorsUtil && (typeof AggregatorsUtil[aggregatorName] === 'function')) {
        value = AggregatorsUtil[aggregatorName](values);
      }
    }
    if (sourceIsConditionAggregation(condition.source)) {
      if (condition.source.type === 'Count') {
        value = condition.source.conditions
          .map(this.isConditionSatisfied.bind(this))
          .filter(Boolean)
          .length;
      }
    }

    if (typeof value === 'undefined') {
      return false;
    }

    let value2: number | string = condition.expression.value;
    value2 = (typeof value === 'number') ? IqbVariableUtil.variableValueAsNumber(value2) : value2;

    // eslint-disable-next-line default-case
    switch (condition.expression.type) {
      case 'equal':
        return value === value2;
      case 'notEqual':
        return value !== value2;
      case 'greaterThan':
        return IqbVariableUtil.variableValueAsNumber(value) > IqbVariableUtil.variableValueAsNumber(value2);
      case 'lowerThan':
        return IqbVariableUtil.variableValueAsNumber(value) < IqbVariableUtil.variableValueAsNumber(value2);
    }

    return false;
  }

  async getSequenceBounds(): Promise<[number, number]> {
    const first = Object.values(this.units)
      .find(async unit => !(await TestControllerService.unitIsInaccessible(unit)))
      ?.sequenceId || NaN;
    const last = Object.values(this.units)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - findLast is not known in ts-lib es2022, es2023 is not available in ts 5.1
      .findLast(unit => !TestControllerService.unitIsInaccessible(unit))
      ?.sequenceId || NaN;
    return [first, last];
  }
}
