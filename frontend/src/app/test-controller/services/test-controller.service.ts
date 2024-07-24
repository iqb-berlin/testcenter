import {
  bufferTime, concatMap, filter, map, takeUntil
} from 'rxjs/operators';
import {
  BehaviorSubject, interval, Observable, Subject, Subscription, timer
} from 'rxjs';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { MaxTimerData, Testlet, UnitWithContext } from '../classes/test-controller.classes';
import {
  KeyValuePairNumber,
  KeyValuePairString,
  LoadingProgress,
  MaxTimerDataType,
  StateReportEntry,
  TestControllerState,
  TestStateKey,
  UnitDataParts,
  UnitNavigationTarget,
  UnitStateUpdate,
  WindowFocusState
} from '../interfaces/test-controller.interfaces';
import { BackendService } from './backend.service';
import { BookletConfig, TestMode } from '../../shared/shared.module';
import { VeronaNavigationDeniedReason } from '../interfaces/verona.interfaces';
import { MissingBookletError } from '../classes/missing-booklet-error.class';
import { MessageService } from '../../shared/services/message.service';
import { AppError } from '../../app.interfaces';

@Injectable({
  providedIn: 'root'
})
export class TestControllerService {
  static readonly unitDataBufferMs = 1000;
  static readonly unitStateBufferMs = 2500;

  testId = '';
  testStatus$ = new BehaviorSubject<TestControllerState>(TestControllerState.INIT);
  testStatusEnum = TestControllerState;

  workspaceId = 0;

  testStructureChanges$ = new BehaviorSubject<void>(undefined);

  totalLoadingProgress = 0;

  clearCodeTestlets: string[] = [];

  testMode = new TestMode();
  bookletConfig = new BookletConfig();
  rootTestlet: Testlet | null = null;

  maxTimeTimer$ = new Subject<MaxTimerData>();
  currentMaxTimerTestletId = '';
  private maxTimeIntervalSubscription: Subscription | null = null;
  maxTimeTimers: KeyValuePairNumber = {};
  timerWarningPoints: number[] = [];

  currentUnitDbKey = '';
  currentUnitTitle = '';

  currentPageIndex: number = -1;
  currentPageLabel: string = '';

  allUnitIds: string[] = [];

  windowFocusState$ = new Subject<WindowFocusState>();

  resumeTargetUnitSequenceId = 0;

  originalUnitId = this.rootTestlet?.getUnitAt(this.currentUnitSequenceId)?.unitDef.id ?? '';

  private _navigationDenial = new Subject<{ sourceUnitSequenceId: number, reason: VeronaNavigationDeniedReason[] }>();
  get navigationDenial(): Observable<{ sourceUnitSequenceId: number, reason: VeronaNavigationDeniedReason[] }> {
    return this._navigationDenial;
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

  /**
   * the structure of this service is weird: instead of distributing the UnitDefs into the several arrays
   * below we could store a single array with UnitDefs (wich would be a flattened version of the root testlet). Thus
   * we would could get rid of all those arrays, get-, set- and has- functions. I leave this out for the next
   * refactoring. Also those data-stores are only used to transfer restored data from loading process to the moment of
   * sending vopStartCommand. They are almost never updated.
   * TODO simplify data structure
   */
  private players: { [filename: string]: string } = {};
  private unitDefinitions: { [sequenceId: number]: string } = {};
  private unitStateDataParts: { [sequenceId: number]: KeyValuePairString } = {};
  private unitPresentationProgressStates: { [sequenceId: number]: string | undefined } = {};
  private unitResponseProgressStates: { [sequenceId: number]: string | undefined } = {};
  private unitStateCurrentPages: { [sequenceId: number]: string | undefined } = {};
  private unitContentLoadProgress$: { [sequenceId: number]: Observable<LoadingProgress> } = {};
  private unitDefinitionTypes: { [sequenceId: number]: string } = {};
  private unitResponseTypes: { [sequenceId: number]: string } = {};

  private unitDataPartsToSave$ = new Subject<UnitDataParts>();
  private unitDataPartsToSaveSubscription: Subscription | null = null;

  private unitStateToSave$ = new Subject<UnitStateUpdate>();
  private unitStateToSaveSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private bs: BackendService,
    private messageService: MessageService
  ) {
    this.setupUnitDataPartsBuffer();
    this.setupUnitStateBuffer();
  }

  setupUnitDataPartsBuffer(): void {
    this.destroyUnitDataPartsBuffer(); // important when called from unit-test with fakeAsync
    this.destroyUnitStateBuffer();
    // the last buffer when test gets terminated is lost. Seems not to be important, but noteworthy
    this.unitDataPartsToSaveSubscription = this.unitDataPartsToSave$
      .pipe(
        bufferTime(TestControllerService.unitDataBufferMs),
        filter(dataPartsBuffer => !!dataPartsBuffer.length),
        concatMap(dataPartsBuffer => {
          const sortedByUnit = dataPartsBuffer
            .reduce(
              (agg, dataParts) => {
                if (!agg[dataParts.unitDbKey]) agg[dataParts.unitDbKey] = [];
                agg[dataParts.unitDbKey].push(dataParts);
                return agg;
              },
              <{ [unitId: string]: UnitDataParts[] }>{}
            );
          return Object.keys(sortedByUnit)
            .map(unitId => ({
              unitDbKey: unitId,
              dataParts: Object.assign({}, ...sortedByUnit[unitId].map(entry => entry.dataParts)),
              // verona4 does not support different dataTypes for different Chunks
              unitStateDataType: sortedByUnit[unitId][0].unitStateDataType
            }));
        })
      )
      .subscribe(changedDataParts => {
        this.bs.updateDataParts(
          this.testId,
          changedDataParts.unitDbKey,
          changedDataParts.dataParts,
          changedDataParts.unitStateDataType
        );
      });
  }

  setupUnitStateBuffer(): void {
    this.unitStateToSaveSubscription = this.unitStateToSave$
      .pipe(
        bufferTime(TestControllerService.unitStateBufferMs),
        filter(stateBuffer => !!stateBuffer.length),
        concatMap(stateBuffer => Object.values(
          stateBuffer
            .reduce(
              (agg, stateUpdate) => {
                if (!agg[stateUpdate.unitDbKey]) {
                  agg[stateUpdate.unitDbKey] = <UnitStateUpdate>{ unitDbKey: stateUpdate.unitDbKey, state: [] };
                }
                agg[stateUpdate.unitDbKey].state.push(...stateUpdate.state);
                return agg;
              },
              <{ [unitId: string]: UnitStateUpdate }>{}
            )
        ))
      )
      .subscribe(aggregatedStateUpdate => {
        this.bs.updateUnitState(
          this.testId,
          aggregatedStateUpdate.unitDbKey,
          this.originalUnitId,
          aggregatedStateUpdate.state
        );
      });
  }

  destroyUnitDataPartsBuffer(): void {
    if (this.unitDataPartsToSaveSubscription) this.unitDataPartsToSaveSubscription.unsubscribe();
  }

  destroyUnitStateBuffer(): void {
    if (this.unitStateToSaveSubscription) this.unitStateToSaveSubscription.unsubscribe();
  }

  resetDataStore(): void {
    this.players = {};
    this.unitDefinitions = {};
    this.unitStateDataParts = {};
    this.rootTestlet = null;
    this.clearCodeTestlets = [];
    this.currentUnitSequenceId = 0;
    this.currentUnitDbKey = '';
    this.currentUnitTitle = '';
    if (this.maxTimeIntervalSubscription !== null) {
      this.maxTimeIntervalSubscription.unsubscribe();
      this.maxTimeIntervalSubscription = null;
    }
    this.currentMaxTimerTestletId = '';
    this.maxTimeTimers = {};
    this.unitPresentationProgressStates = {};
    this.unitResponseProgressStates = {};
    this.unitStateCurrentPages = {};
    this.unitDefinitionTypes = {};
    this.unitResponseTypes = {};
    this.timerWarningPoints = [];
    this.workspaceId = 0;
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
    unitDbKey: string,
    sequenceId: number,
    dataParts: KeyValuePairString,
    unitStateDataType: string
  ): void {
    const changedParts:KeyValuePairString = {};

    Object.keys(dataParts)
      .forEach(dataPartId => {
        if (!this.unitStateDataParts[sequenceId]) {
          this.unitStateDataParts[sequenceId] = {};
        }
        if (
          !this.unitStateDataParts[sequenceId][dataPartId] ||
          (this.unitStateDataParts[sequenceId][dataPartId] !== dataParts[dataPartId])
        ) {
          this.unitStateDataParts[sequenceId][dataPartId] = dataParts[dataPartId];
          changedParts[dataPartId] = dataParts[dataPartId];
        }
      });
    if (Object.keys(changedParts).length && this.testMode.saveResponses) {
      this.unitDataPartsToSave$.next({ unitDbKey, dataParts: changedParts, unitStateDataType });
    }
  }

  // TODO remove parameter unitSequenceId. getUnitWithContext is kind of expensive, when this is fixed, we need only...
  // ...unitSequenceId or unitStateUpdate.unitDbKey and can remove the other one
  updateUnitState(unitSequenceId: number, unitStateUpdate: UnitStateUpdate): void {
    unitStateUpdate.state = unitStateUpdate.state
      .filter(state => !!state.content)
      .filter(changedState => {
        const oldState = this.getUnitState(unitSequenceId, changedState.key);
        if (oldState) {
          return oldState !== changedState.content;
        }
        return true;
      });
    unitStateUpdate.state
      .forEach(changedState => this.setUnitState(unitSequenceId, changedState.key, changedState.content));
    if (this.testMode.saveResponses && unitStateUpdate.state.length) {
      this.unitStateToSave$.next(unitStateUpdate);
    }
  }

  // TODO the following two functions are workarounds to the shitty structure of this service (see above)
  private getUnitState(unitSequenceId: number, stateKey: string): string | undefined {
    if (stateKey === 'RESPONSE_PROGRESS') {
      return this.unitResponseProgressStates[unitSequenceId];
    }

    if (stateKey === 'PRESENTATION_PROGRESS') {
      return this.unitPresentationProgressStates[unitSequenceId];
    }

    if (stateKey === 'CURRENT_PAGE_ID') {
      return this.unitStateCurrentPages[unitSequenceId];
    }

    return undefined;
  }

  private setUnitState(unitSequenceId: number, stateKey: string, value: string): void {
    if (stateKey === 'RESPONSE_PROGRESS') {
      this.unitResponseProgressStates[unitSequenceId] = value;
    }

    if (stateKey === 'PRESENTATION_PROGRESS') {
      this.unitPresentationProgressStates[unitSequenceId] = value;
    }

    if (stateKey === 'CURRENT_PAGE_ID') {
      this.unitStateCurrentPages[unitSequenceId] = value;
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

  setUnitDefinition(sequenceId: number, uDef: string): void {
    this.unitDefinitions[sequenceId] = uDef;
  }

  getUnitDefinition(sequenceId: number): string {
    return this.unitDefinitions[sequenceId];
  }

  setUnitStateDataParts(unitSequenceId: number, dataParts: KeyValuePairString): void {
    this.unitStateDataParts[unitSequenceId] = dataParts;
  }

  getUnitStateDataParts(sequenceId: number): KeyValuePairString {
    return this.unitStateDataParts[sequenceId];
  }

  setUnitPresentationProgress(sequenceId: number, state: string | undefined): void {
    this.unitPresentationProgressStates[sequenceId] = state;
  }

  hasUnitPresentationProgress(sequenceId: number): boolean {
    return sequenceId in this.unitPresentationProgressStates;
  }

  getUnitPresentationProgress(sequenceId: number): string | undefined {
    return this.unitPresentationProgressStates[sequenceId];
  }

  hasUnitResponseProgress(sequenceId: number): boolean {
    return sequenceId in this.unitResponseProgressStates;
  }

  setUnitResponseProgress(sequenceId: number, state: string | undefined): void {
    this.unitResponseProgressStates[sequenceId] = state;
  }

  getUnitResponseProgress(sequenceId: number): string | undefined {
    return this.unitResponseProgressStates[sequenceId];
  }

  getUnitStateCurrentPage(sequenceId: number): string | null {
    return this.unitStateCurrentPages[sequenceId] ?? null;
  }

  setUnitStateCurrentPage(sequenceId: number, pageId: string | undefined): void {
    this.unitStateCurrentPages[sequenceId] = pageId;
  }

  setUnitLoadProgress$(sequenceId: number, progress: Observable<LoadingProgress>): void {
    this.unitContentLoadProgress$[sequenceId] = progress;
  }

  getUnitLoadProgress$(sequenceId: number): Observable<LoadingProgress> {
    return this.unitContentLoadProgress$[sequenceId];
  }

  setUnitPlayerFilename(sequenceId: number, unitDefinitionType: string): void {
    this.unitDefinitionTypes[sequenceId] = unitDefinitionType;
  }

  getUnitDefinitionType(sequenceId: number): string {
    return this.unitDefinitionTypes[sequenceId];
  }

  setUnitResponseType(sequenceId: number, unitResponseType: string): void {
    this.unitResponseTypes[sequenceId] = unitResponseType;
  }

  getUnitResponseType(sequenceId: number): string {
    return this.unitResponseTypes[sequenceId];
  }

  addClearedCodeTestlet(testletId: string): void {
    if (this.clearCodeTestlets.indexOf(testletId) < 0) {
      this.clearCodeTestlets.push(testletId);
      this.testStructureChanges$.next();
      if (this.testMode.saveResponses) {
        this.bs.updateTestState(
          this.testId,
          [<StateReportEntry>{
            key: TestStateKey.TESTLETS_CLEARED_CODE,
            timeStamp: Date.now(),
            content: JSON.stringify(this.clearCodeTestlets)
          }]
        );
      }
    }
  }

  getUnclearedTestlets(unit: UnitWithContext): Testlet[] {
    return unit.codeRequiringTestlets
      .filter(testlet => !this.clearCodeTestlets.includes(testlet.id));
  }

  getUnitIsLockedByCode(unit: UnitWithContext): boolean {
    return this.getFirstSequenceIdOfLockedBlock(unit) !== unit.unitDef.sequenceId;
  }

  getFirstSequenceIdOfLockedBlock(fromUnit: UnitWithContext): number {
    const unclearedTestlets = this.getUnclearedTestlets(fromUnit);
    if (!unclearedTestlets.length) {
      return fromUnit.unitDef.sequenceId;
    }
    return unclearedTestlets
      .reduce((acc, item) => (acc.sequenceId < item.sequenceId ? acc : item))
      .children
      .filter(child => !!child.sequenceId)[0].sequenceId;
  }

  getUnitIsLocked(unit: UnitWithContext): boolean {
    return this.getUnitIsLockedByCode(unit) || unit.unitDef.lockedByTime;
  }

  getUnitWithContext(unitSequenceId: number): UnitWithContext {
    if (!this.rootTestlet) { // when loading process was aborted
      throw new MissingBookletError();
    }
    const unit = this.rootTestlet.getUnitAt(unitSequenceId);
    if (!unit) {
      throw new AppError({
        label: `Unit not found:${unitSequenceId}`,
        description: '',
        type: 'script'
      });
    }
    return unit;
  }

  // the duplication of getUnitWithContext is a temporary fix and is already solved better in testcenter 15.2
  getUnitWithContextSilent(unitSequenceId: number): UnitWithContext | null {
    if (!this.rootTestlet) { // when loading process was aborted
      throw new MissingBookletError();
    }
    return this.rootTestlet.getUnitAt(unitSequenceId);
  }

  getNextUnlockedUnitSequenceId(currentUnitSequenceId: number, reverse: boolean = false): number | null {
    const step = reverse ? -1 : 1;
    let nextUnitSequenceId = currentUnitSequenceId + step;
    let nextUnit: UnitWithContext | null = this.getUnitWithContextSilent(nextUnitSequenceId);
    while (nextUnit !== null && this.getUnitIsLocked(nextUnit)) {
      nextUnitSequenceId += step;
      nextUnit = this.getUnitWithContextSilent(nextUnitSequenceId);
    }
    return nextUnit ? nextUnitSequenceId : null;
  }

  startMaxTimer(testlet: Testlet): void {
    const timeLeftMinutes = (testlet.id in this.maxTimeTimers) ?
      Math.min(this.maxTimeTimers[testlet.id], testlet.maxTimeLeft) :
      testlet.maxTimeLeft;
    if (this.maxTimeIntervalSubscription !== null) {
      this.maxTimeIntervalSubscription.unsubscribe();
    }
    this.maxTimeTimer$.next(new MaxTimerData(timeLeftMinutes, testlet.id, MaxTimerDataType.STARTED));
    this.currentMaxTimerTestletId = testlet.id;
    this.maxTimeIntervalSubscription = interval(1000)
      .pipe(
        takeUntil(
          timer(timeLeftMinutes * 60 * 1000)
        ),
        map(val => (timeLeftMinutes * 60) - val - 1)
      ).subscribe({
        next: val => {
          this.maxTimeTimer$.next(new MaxTimerData(val / 60, testlet.id, MaxTimerDataType.STEP));
        },
        error: e => {
          throw e;
        },
        complete: () => {
          this.maxTimeTimer$.next(new MaxTimerData(0, testlet.id, MaxTimerDataType.ENDED));
          this.currentMaxTimerTestletId = '';
        }
      });
  }

  cancelMaxTimer(): void {
    if (this.maxTimeIntervalSubscription !== null) {
      this.maxTimeIntervalSubscription.unsubscribe();
      this.maxTimeIntervalSubscription = null;
      this.maxTimeTimer$.next(new MaxTimerData(0, this.currentMaxTimerTestletId, MaxTimerDataType.CANCELLED));
    }
    this.currentMaxTimerTestletId = '';
  }

  interruptMaxTimer(): void {
    if (this.maxTimeIntervalSubscription !== null) {
      this.maxTimeIntervalSubscription.unsubscribe();
      this.maxTimeIntervalSubscription = null;
      this.maxTimeTimer$.next(new MaxTimerData(0, this.currentMaxTimerTestletId, MaxTimerDataType.INTERRUPTED));
    }
    this.currentMaxTimerTestletId = '';
  }

  notifyNavigationDenied(sourceUnitSequenceId: number, reason: VeronaNavigationDeniedReason[]): void {
    this._navigationDenial.next({ sourceUnitSequenceId, reason });
  }

  terminateTest(logEntryKey: string, force: boolean, lockTest: boolean = false): void {
    if (
      (this.testStatus$.getValue() === TestControllerState.TERMINATED) ||
      (this.testStatus$.getValue() === TestControllerState.FINISHED)
    ) {
      // sometimes terminateTest get called two times from player
      return;
    }

    const oldTestStatus = this.testStatus$.getValue();
    this.testStatus$.next(
      (oldTestStatus === TestControllerState.PAUSED) ?
        TestControllerState.TERMINATED_PAUSED :
        TestControllerState.TERMINATED
    ); // last state that will and can be logged

    this.router.navigate(['/r/starter'], { state: { force } })
      .then(navigationSuccessful => {
        if (!(navigationSuccessful || force)) {
          this.testStatus$.next(oldTestStatus); // navigation was denied, test continues
          return;
        }
        this.finishTest(logEntryKey, lockTest);
      });
  }

  private finishTest(logEntryKey: string, lockTest: boolean = false): void {
    if (lockTest) {
      this.bs.lockTest(this.testId, Date.now(), logEntryKey);
    } else {
      this.testStatus$.next(TestControllerState.FINISHED); // will not be logged, test is already locked maybe
    }
  }

  setUnitNavigationRequest(navString: string, force = false): void {
    const targetIsCurrent = this.currentUnitSequenceId.toString(10) === navString;
    if (!this.rootTestlet) {
      this.router.navigate([`/t/${this.testId}/status`], { skipLocationChange: true, state: { force } });
    } else {
      switch (navString) {
        case UnitNavigationTarget.ERROR:
        case UnitNavigationTarget.PAUSE:
          this.router.navigate([`/t/${this.testId}/status`], { skipLocationChange: true, state: { force } });
          break;
        case UnitNavigationTarget.NEXT:
          // eslint-disable-next-line no-case-declarations
          const nextUnlockedUnitSequenceId =
            this.getNextUnlockedUnitSequenceId(this.currentUnitSequenceId) ?? this.allUnitIds.length;
          if (!nextUnlockedUnitSequenceId) break;
          this.router.navigate([`/t/${this.testId}/u/${nextUnlockedUnitSequenceId}`], { state: { force } });
          break;
        case UnitNavigationTarget.PREVIOUS:
          // eslint-disable-next-line no-case-declarations
          const previousUnlockedUnitSequenceId =
            this.getNextUnlockedUnitSequenceId(this.currentUnitSequenceId, true) ?? 1;
          this.router.navigate([`/t/${this.testId}/u/${previousUnlockedUnitSequenceId}`], { state: { force } });
          break;
        case UnitNavigationTarget.FIRST:
          this.router.navigate([`/t/${this.testId}/u/1`], { state: { force } });
          break;
        case UnitNavigationTarget.LAST:
          this.router.navigate([`/t/${this.testId}/u/${this.allUnitIds.length}`], { state: { force } });
          break;
        case UnitNavigationTarget.END:
          this.terminateTest(
            force ? 'BOOKLETLOCKEDforced' : 'BOOKLETLOCKEDbyTESTEE',
            force,
            this.bookletConfig.lock_test_on_termination === 'ON'
          );
          break;

        default:
          // eslint-disable-next-line no-case-declarations
          let navNr = parseInt(navString, 10);
          navNr = (navNr <= 1) ? 1 : navNr;
          navNr = (navNr > this.allUnitIds.length) ? this.allUnitIds.length : navNr;
          this.router.navigate(
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
            });
          break;
      }
    }
  }

  errorOut(): void {
    this.totalLoadingProgress = 0;
    this.testStatus$.next(TestControllerState.ERROR);
    this.setUnitNavigationRequest(UnitNavigationTarget.ERROR);
  }

  pause(): void {
    this.interruptMaxTimer();
    this.testStatus$.next(TestControllerState.PAUSED);
    this.setUnitNavigationRequest(UnitNavigationTarget.PAUSE, true);
  }

  isUnitContentLoaded(sequenceId: number): boolean {
    return !!this.unitDefinitions[sequenceId];
  }
}
