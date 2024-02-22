/* eslint-disable no-console */
import { Injectable } from '@angular/core';
import {
  BehaviorSubject, from, Observable, of, Subject, Subscription
} from 'rxjs';
import {
  concatMap, distinctUntilChanged, last, map, shareReplay, switchMap, tap
} from 'rxjs/operators';
import { CodingScheme, Response as IQBVariable } from '@iqb/responses';
import {
  CustomtextService,
  TestMode,
  UnitDef,
  TestletDef,
  BookletDef,
  ContextInBooklet,
  BlockCondition,
  BlockConditionSource,
  sourceIsConditionAggregation,
  sourceIsSourceAggregation, sourceIsSingleSource
} from '../../shared/shared.module';
import {
  isLoadingFileLoaded,
  LoadedFile,
  LoadingProgress,
  StateReportEntry,
  LoadingQueueEntry,
  TestControllerState,
  TestData,
  TestLogEntryKey,
  TestStateKey,
  UnitData,
  UnitNavigationTarget,
  Testlet, Booklet, Unit, isUnit, TestletLockTypes
} from '../interfaces/test-controller.interfaces';
import { EnvironmentData } from '../classes/test-controller.classes';
import { TestControllerService } from './test-controller.service';
import { BackendService } from './backend.service';
import { AppError } from '../../app.interfaces';
import { BookletParserService } from '../../shared/services/booklet-parser.service';

@Injectable({
  providedIn: 'root'
})
export class TestLoaderService extends BookletParserService<Unit, Testlet, Booklet> {
  private loadStartTimeStamp = 0;
  private resourcesLoadSubscription: Subscription | null = null;
  private environment: EnvironmentData; // TODO (possible refactoring) outsource to a service or what
  private loadingQueue: LoadingQueueEntry[] = [];
  private totalLoadingProgressParts: { [loadingId: string]: number } = {};

  constructor(
    public tcs: TestControllerService,
    private bs: BackendService,
    private cts: CustomtextService
  ) {
    super();
    this.environment = new EnvironmentData();
  }

  async loadTest(): Promise<void> {
    this.reset();
    const ts = Date.now();

    this.tcs.state$.next(TestControllerState.LOADING);

    const testData = await this.bs.getTestData(this.tcs.testId).toPromise();
    if (!testData) {
      return; // error is already thrown
    }

    this.tcs.workspaceId = testData.workspaceId;
    this.tcs.testMode = new TestMode(testData.mode);
    this.tcs.booklet = this.getBookletFromXml(testData.xml);

    this.tcs.timerWarningPoints =
      this.tcs.bookletConfig.unit_time_left_warnings
        .split(',')
        .map(x => parseInt(x, 10))
        .filter(x => !Number.isNaN(x));

    await this.loadUnits(testData);
    this.prepareUnitContentLoadingQueueOrder(testData.laststate.CURRENT_UNIT_ID || '1');

    // eslint-disable-next-line consistent-return
    return this.loadResources(testData)
      .then(() => {
        console.log({ loaded: (Date.now() - ts) });
        this.resumeTest(testData.laststate);
      });
  }

  reset(): void {
    this.unsubscribeTestSubscriptions();

    // Reset TestMode to be Demo, before the correct one comes with getTestData
    // TODO maybe it would be better to retrieve the testmode from the login
    this.tcs.testMode = new TestMode();
    this.tcs.reset();

    this.tcs.totalLoadingProgress = 0;
    this.totalLoadingProgressParts = {};

    this.environment = new EnvironmentData();
    this.loadStartTimeStamp = Date.now();
    this.loadingQueue = [];
  }

  private resumeTest(lastState: { [k in TestStateKey]?: string }): void {
    if (!this.tcs.booklet) {
      throw new AppError({ description: '', label: 'Booklet not loaded yet.', type: 'script' });
    }

    this.restoreRestrictions(lastState);

    const currentUnitId = lastState[TestStateKey.CURRENT_UNIT_ID];
    this.tcs.resumeTargetUnitSequenceId = currentUnitId ? this.tcs.unitAliasMap[currentUnitId] : 1;

    if (
      (lastState[TestStateKey.CONTROLLER] === TestControllerState.TERMINATED_PAUSED) ||
      (lastState[TestStateKey.CONTROLLER] === TestControllerState.PAUSED)
    ) {
      this.tcs.state$.next(TestControllerState.PAUSED);
      this.tcs.setUnitNavigationRequest(UnitNavigationTarget.PAUSE);
      return;
    }
    this.tcs.state$.next(TestControllerState.RUNNING);
    this.tcs.setUnitNavigationRequest(this.tcs.resumeTargetUnitSequenceId.toString());
  }

  private restoreRestrictions(lastState: { [k in TestStateKey]?: string }): void {
    this.tcs.timers = lastState[TestStateKey.TESTLETS_TIMELEFT] ?
      JSON.parse(lastState[TestStateKey.TESTLETS_TIMELEFT]) :
      {};
    const clearedTestlets = lastState[TestStateKey.TESTLETS_CLEARED_CODE] ?
      JSON.parse(lastState[TestStateKey.TESTLETS_CLEARED_CODE]) :
      [];
    const afterLeaveLocked = lastState[TestStateKey.TESTLETS_LOCKED_AFTER_LEAVE] ?
      JSON.parse(lastState[TestStateKey.TESTLETS_LOCKED_AFTER_LEAVE]) :
      [];

    Object.keys(this.tcs.testlets)
      .forEach(testletId => {
        this.tcs.testlets[testletId].locks.code =
          !!this.tcs.testlets[testletId].restrictions.codeToEnter?.code && !clearedTestlets.includes(testletId);
        this.tcs.testlets[testletId].locks.time =
          !!this.tcs.testlets[testletId].restrictions.timeMax?.minutes &&
          ((typeof this.tcs.timers[testletId] !== 'undefined') && !this.tcs.timers[testletId]);
        this.tcs.testlets[testletId].locks.afterLeave =
          !!this.tcs.testlets[testletId].restrictions.lockAfterLeaving && afterLeaveLocked.includes(testletId);
      });

    const afterLeaveLockedUnits = lastState[TestStateKey.UNITS_LOCKED_AFTER_LEAVE] ?
      JSON.parse(lastState[TestStateKey.UNITS_LOCKED_AFTER_LEAVE]) :
      [];
    afterLeaveLockedUnits
      .forEach((unitSequenceId: string | number) => {
        this.tcs.units[Number(unitSequenceId)].lockedAfterLeaving = true;
      });

    this.tcs.evaluateConditions();
  }

  private loadUnits(testData: TestData): Promise<number | undefined> {
    const sequence = [];
    for (let i = 1; i <= this.tcs.sequenceLength; i++) {
      this.totalLoadingProgressParts[`unit-${i}`] = 0;
      this.totalLoadingProgressParts[`player-${i}`] = 0;
      this.totalLoadingProgressParts[`content-${i}`] = 0;
      this.totalLoadingProgressParts[`scheme-${i}`] = 0;
      sequence.push(i);
    }
    return from(sequence)
      .pipe(
        concatMap((sequenceId: number) => this.loadUnit(sequenceId, testData))
      )
      .toPromise();
  }

  private loadUnit(sequenceId: number, testData: TestData): Observable<number> {
    const unit = this.tcs.getUnit(sequenceId);
    const resources = testData.resources[unit.id.toUpperCase()];
    if (!resources) {
      throw new Error(`No resources for unitId: \`${unit.id}\`.`);
    }
    if (!(resources.usesPlayer && resources.usesPlayer.length)) {
      throw new Error(`Unit has no player: \`${unit.id}\`)`);
    }
    unit.playerFileName = resources.usesPlayer[0];

    const definitionFile = (resources.isDefinedBy && resources.isDefinedBy.length) ? resources.isDefinedBy[0] : null;
    const schemeFile = (resources.usesScheme && resources.usesScheme.length) ? resources.usesScheme[0] : null;

    if (!schemeFile) {
      this.incrementTotalProgress({ progress: 100 }, `scheme-${sequenceId}`);
    } else {
      this.loadingQueue.push({ sequenceId, file: schemeFile, type: 'scheme' });
    }

    if (testData.firstStart && definitionFile) {
      // we don't need to call `[GET] /test/{testID}/unit` when this is the first test and no inline definition
      this.incrementTotalProgress({ progress: 100 }, `unit-${sequenceId}`);
      this.loadingQueue.push({ sequenceId, file: definitionFile, type: 'definition' });
      return this.getPlayer(testData, sequenceId, unit.playerFileName);
    }

    return this.bs.getUnitData(this.tcs.testId, unit.id, unit.alias)
      .pipe(
        switchMap((unitData: UnitData) => {
          if (!unitData) {
            throw new Error(`Unit is empty ${this.tcs.testId}/${unit.id}.`);
          }

          this.incrementTotalProgress({ progress: 100 }, `unit-${sequenceId}`);

          this.tcs.units[sequenceId].state = unitData.state;
          this.tcs.units[sequenceId].responseType = unitData.unitResponseType;
          this.tcs.updateVariables(sequenceId, unitData.unitResponseType, unitData.dataParts);
          this.tcs.units[sequenceId].dataParts = unitData.dataParts;

          if (definitionFile) {
            this.loadingQueue.push({ sequenceId, file: definitionFile, type: 'definition' });
          } else {
            // inline unit definition
            this.tcs.units[sequenceId].definition = unitData.definition;
            this.tcs.units[sequenceId].loadingProgress.definition = of({ progress: 100 });
            this.incrementTotalProgress({ progress: 100 }, `definition-${sequenceId}`);
          }

          return this.getPlayer(testData, sequenceId, unit.playerFileName);
        })
      );
  }

  private getPlayer(testData: TestData, sequenceId: number, playerFileName: string) {
    if (this.tcs.hasPlayer(playerFileName)) {
      this.incrementTotalProgress({ progress: 100 }, `player-${sequenceId}`);
      return of(sequenceId);
    }
    return this.bs.getResource(testData.workspaceId, playerFileName)
      .pipe(
        tap((progress: LoadedFile | LoadingProgress) => {
          this.incrementTotalProgress(
            isLoadingFileLoaded(progress) ? { progress: 100 } : progress,
            `player-${sequenceId}`
          );
        }),
        last(),
        map((player: LoadedFile | LoadingProgress) => {
          if (!isLoadingFileLoaded(player)) {
            throw new Error('File Loading Error');
          }
          this.tcs.addPlayer(playerFileName, player.content);
          return sequenceId;
        })
      );
  }

  private prepareUnitContentLoadingQueueOrder(currentUnitId: string): void {
    if (!this.tcs.booklet) {
      throw new AppError({
        description: '', label: 'Testheft noch nicht verfügbar', type: 'script'
      });
    }
    const currentUnitSequenceId = this.tcs.unitAliasMap[currentUnitId];
    const queue = this.loadingQueue;
    let firstToLoadQueuePosition;
    for (firstToLoadQueuePosition = 0; firstToLoadQueuePosition < queue.length; firstToLoadQueuePosition++) {
      if (Number(queue[firstToLoadQueuePosition % queue.length].sequenceId) >= currentUnitSequenceId) {
        break;
      }
    }
    const offset = ((firstToLoadQueuePosition % queue.length) + queue.length) % queue.length;
    this.loadingQueue = queue.slice(offset).concat(queue.slice(0, offset));
  }

  private loadResources(testData: TestData): Promise<void> {
    // we don't load files in parallel since it made problems, when a whole class tried it at once
    const progress$: { [queueIndex: number] : Subject<LoadingProgress> } = {};
    this.loadingQueue
      .forEach((queueEntry, i) => {
        progress$[i] = new BehaviorSubject<LoadingProgress>({ progress: 'PENDING' });
        this.tcs.units[queueEntry.sequenceId].loadingProgress[queueEntry.type] = progress$[i].asObservable();
      });

    return new Promise<void>(resolve => {
      if (this.tcs.bookletConfig.loading_mode === 'LAZY') {
        resolve();
      }

      this.resourcesLoadSubscription = from(this.loadingQueue)
        .pipe(
          concatMap((queueEntry, queueIndex) => {
            const resourceLoading$ =
              this.bs.getResource(testData.workspaceId, queueEntry.file)
                .pipe(shareReplay());

            resourceLoading$
              .pipe(
                map(loadingFile => {
                  if (!isLoadingFileLoaded(loadingFile)) {
                    return loadingFile;
                  }
                  if (queueEntry.type === 'definition') {
                    this.tcs.units[queueEntry.sequenceId].definition = loadingFile.content;
                  } else if (queueEntry.type === 'scheme') {
                    this.tcs.units[queueEntry.sequenceId].scheme = this.getCodingScheme(loadingFile.content);
                  }
                  return { progress: 100 };
                }),
                distinctUntilChanged((v1, v2) => v1.progress === v2.progress),
                tap(progress => this.incrementTotalProgress(progress, `${queueEntry.type}-${queueEntry.sequenceId}`))
              )
              .subscribe(progress$[queueIndex]);

            return resourceLoading$;
          })
        )
        .subscribe({
          complete: () => {
            if (this.tcs.testMode.saveResponses) {
              this.environment.loadTime = Date.now() - this.loadStartTimeStamp;
              this.bs.addTestLog(this.tcs.testId, [<StateReportEntry>{
                key: TestLogEntryKey.LOADCOMPLETE, timeStamp: Date.now(), content: JSON.stringify(this.environment)
              }]);
            }
            this.tcs.totalLoadingProgress = 100;
            if (this.tcs.bookletConfig.loading_mode === 'EAGER') {
              resolve();
            }
          }
        });
    });
  }

  private unsubscribeTestSubscriptions(): void {
    if (this.resourcesLoadSubscription !== null) {
      this.resourcesLoadSubscription.unsubscribe();
      this.resourcesLoadSubscription = null;
    }
  }

  private incrementTotalProgress(progress: LoadingProgress, file: string): void {
    if (typeof progress.progress !== 'number') {
      return;
    }
    this.totalLoadingProgressParts[file] = progress.progress;
    const sumOfProgresses = Object.values(this.totalLoadingProgressParts).reduce((i, a) => i + a, 0);
    const maxProgresses = Object.values(this.totalLoadingProgressParts).length * 100;
    this.tcs.totalLoadingProgress = (sumOfProgresses / maxProgresses) * 100;
  }

  // eslint-disable-next-line class-methods-use-this
  private getCodingScheme(jsonString: string): CodingScheme {
    try {
      const what = JSON.parse(jsonString);
      const variableCodings = (
        (typeof what === 'object') &&
        (what.variableCodings) &&
        Array.isArray(what.variableCodings)
      ) ?
        what.variableCodings :
        [];
      return new CodingScheme(variableCodings);
    } catch (e) {
      console.warn(e);
    }
    return new CodingScheme([]);
  }

  private getBookletFromXml(xmlString: string): Booklet {
    const booklet = this.parseBookletXml(xmlString);

    const registerChildren = (testlet: Testlet): void => {
      testlet.children
        .forEach(child => {
          // eslint-disable-next-line no-plusplus
          if (isUnit(child)) {
            this.tcs.unitAliasMap[child.alias] = child.sequenceId;
            this.tcs.units[child.sequenceId] = child;
          } else {
            this.tcs.testlets[child.id] = child;
            registerChildren(child);
          }
        });
    };

    this.tcs.testlets[booklet.units.id] = booklet.units;
    registerChildren(booklet.units);

    this.registerTrackedVariables();
    this.tcs.bookletConfig = booklet.config;
    this.cts.addCustomTexts(booklet.customTexts);
    return booklet;
  }

  registerTrackedVariables() {
    const emptyVariable = (id: string): IQBVariable => ({ id, status: 'UNSET', value: null });
    const registerVariablesFromSource = (source: BlockConditionSource): void => {
      this.tcs.units[this.tcs.unitAliasMap[source.unitAlias]].variables[source.variable] =
        emptyVariable(source.variable);
    };
    const registerVariablesFromCondition = (condition: BlockCondition): void => {
      if (sourceIsSingleSource(condition.source)) {
        registerVariablesFromSource(condition.source);
      }
      if (sourceIsSourceAggregation(condition.source)) {
        condition.source.sources.forEach(registerVariablesFromSource);
      }
      if (sourceIsConditionAggregation(condition.source)) {
        condition.source.conditions.forEach(registerVariablesFromCondition);
      }
    };

    Object.values(this.tcs.testlets)
      .flatMap(testlet => testlet.restrictions.if)
      .forEach(registerVariablesFromCondition);
  }

  // eslint-disable-next-line class-methods-use-this
  toBooklet(bookletDef: BookletDef<Testlet>): Booklet {
    return Object.assign(bookletDef, {});
  }

  // eslint-disable-next-line class-methods-use-this
  toTestlet(testletDef: TestletDef<Testlet, Unit>, elem: Element, context: ContextInBooklet<Testlet>): Testlet {
    let timerId = null;
    if (context.parents.length && context.parents[0].timerId) {
      timerId = context.parents[0].timerId;
    } else if (testletDef.restrictions.timeMax?.minutes) {
      timerId = testletDef.id;
    }

    const testlet: Testlet = Object.assign(testletDef, {
      blockLabel: (context.parents.length <= 1) ? testletDef.label : context.parents[context.parents.length - 2].label,
      locks: {
        condition: !!testletDef.restrictions.if.length,
        time: !!testletDef.restrictions.timeMax?.minutes,
        code: !!testletDef.restrictions.codeToEnter?.code,
        afterLeave: false
      },
      firstUnsatisfiedCondition: NaN,
      locked: null,
      timerId
    });
    const lockedBy = TestletLockTypes
      .find(lockType => testlet.locks[lockType]);
    if (lockedBy) {
      testlet.locked = {
        by: lockedBy,
        through: testlet
      };
    }
    return testlet;
  }

  // eslint-disable-next-line class-methods-use-this
  toUnit(unitDef: UnitDef, elem: Element, context: ContextInBooklet<Testlet>): Unit {
    return Object.assign(unitDef, {
      sequenceId: context.global.unitIndex,
      parent: context.parents[0],
      playerFileName: '',
      // type is deprecated but support everything
      playerId: elem.getAttribute('type') || elem.getAttribute('player') || '',
      localIndex: context.localUnitIndex,
      variables: { },
      responseType: undefined,
      state: { },
      definition: '',
      dataParts: {},
      loadingProgress: { },
      lockedAfterLeaving: false,
      scheme: new CodingScheme([])
    });
  }
}
