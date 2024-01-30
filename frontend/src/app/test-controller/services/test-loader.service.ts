/* eslint-disable no-console */
import { Injectable } from '@angular/core';
import {
  BehaviorSubject, from, Observable, of, Subject, Subscription
} from 'rxjs';
import {
  concatMap, distinctUntilChanged, last, map, shareReplay, switchMap, tap
} from 'rxjs/operators';
import {
  CustomtextService, TestMode, UnitDef, TestletDef, BookletDef, ContextInBooklet
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
  UnitStateKey, Testlet, Booklet, Unit, isUnit
} from '../interfaces/test-controller.interfaces';
import { EnvironmentData } from '../classes/test-controller.classes';
import { TestControllerService } from './test-controller.service';
import { BackendService } from './backend.service';
import { AppError } from '../../app.interfaces';
import { BookletParserService } from '../../shared/services/booklet-parser.service'; // TODO from shared module

@Injectable({
  providedIn: 'root'
})
export class TestLoaderService extends BookletParserService<Unit, Testlet, Booklet> {
  private loadStartTimeStamp = 0;
  private unitContentLoadSubscription: Subscription | null = null;
  private environment: EnvironmentData; // TODO (possible refactoring) outsource to a service or what
  private unitContentLoadingQueue: LoadingQueueEntry[] = [];
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
    this.restoreRestrictions(testData.laststate);

    this.tcs.timerWarningPoints =
      this.tcs.bookletConfig.unit_time_left_warnings
        .split(',')
        .map(x => parseInt(x, 10))
        .filter(x => !Number.isNaN(x));

    await this.loadUnits(testData);
    this.prepareUnitContentLoadingQueueOrder(testData.laststate.CURRENT_UNIT_ID || '1');
    // this.tcs.rootTestlet.lockUnitsIfTimeLeftNull(); TODO X what was this?

    // eslint-disable-next-line consistent-return
    return this.loadUnitContents(testData)
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
    this.tcs.resetDataStore();

    this.tcs.totalLoadingProgress = 0;
    this.totalLoadingProgressParts = {};

    this.environment = new EnvironmentData();
    this.loadStartTimeStamp = Date.now();
    this.unitContentLoadingQueue = [];
  }

  private resumeTest(lastState: { [k in TestStateKey]?: string }): void {
    if (!this.tcs.booklet) {
      throw new AppError({ description: '', label: 'Booklet not loaded yet.', type: 'script' });
    }
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

    Object.keys(this.tcs.testlets)
      .forEach(testletId => {
        this.tcs.testlets[testletId].lockedByCode =
          ('codeToEnter' in this.tcs.testlets[testletId].restrictions) && !clearedTestlets.includes(testletId);
        this.tcs.testlets[testletId].lockedByTime =
          ('timeMax' in this.tcs.testlets[testletId].restrictions) && !(this.tcs.timers[testletId]);
      });
  }

  private loadUnits(testData: TestData): Promise<number | undefined> {
    const sequence = [];
    for (let i = 1; i <= this.tcs.sequenceLength; i++) {
      this.totalLoadingProgressParts[`unit-${i}`] = 0;
      this.totalLoadingProgressParts[`player-${i}`] = 0;
      this.totalLoadingProgressParts[`content-${i}`] = 0;
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

    if (testData.firstStart && definitionFile) {
      // we don't need to call `[GET] /test/{testID}/unit` when this is the first test and no inline definition
      this.incrementTotalProgress({ progress: 100 }, `unit-${sequenceId}`);
      this.unitContentLoadingQueue.push({ sequenceId, definitionFile });
      return this.getPlayer(testData, sequenceId, unit.playerFileName);
    }

    return this.bs.getUnitData(this.tcs.testId, unit.id, unit.id) // TODO X alias ?!?!
      .pipe(
        switchMap((unitData: UnitData) => {
          if (!unitData) {
            throw new Error(`Unit is empty ${this.tcs.testId}/${unit.id}.`);
          }

          this.incrementTotalProgress({ progress: 100 }, `unit-${sequenceId}`);

          this.tcs.setUnitPresentationProgress(sequenceId, unitData.state[UnitStateKey.PRESENTATION_PROGRESS]);
          this.tcs.setUnitResponseProgress(sequenceId, unitData.state[UnitStateKey.RESPONSE_PROGRESS]);
          this.tcs.setUnitStateCurrentPage(sequenceId, unitData.state[UnitStateKey.CURRENT_PAGE_ID]);
          this.tcs.setUnitStateDataParts(sequenceId, unitData.dataParts);
          this.tcs.setUnitResponseType(sequenceId, unitData.unitResponseType);

          if (definitionFile) {
            this.unitContentLoadingQueue.push({ sequenceId, definitionFile });
          } else {
            // inline unit definition
            // this.tcs.setUnitPlayerFilename(sequenceId, unit.playerFileName); // TODO X DAFUQ?
            this.tcs.setUnitDefinition(sequenceId, unitData.definition);

            this.tcs.setUnitLoadProgress$(sequenceId, of({ progress: 100 }));
            this.incrementTotalProgress({ progress: 100 }, `content-${sequenceId}`);
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

  private prepareUnitContentLoadingQueueOrder(currentUnitId: string = '1'): void { // TODO X machte der default Sinn?
    if (!this.tcs.booklet) {
      throw new AppError({
        description: '', label: 'Testheft noch nicht verfügbar', type: 'script'
      });
    }
    const currentUnitSequenceId = this.tcs.unitAliasMap[currentUnitId];
    const queue = this.unitContentLoadingQueue;
    let firstToLoadQueuePosition;
    for (firstToLoadQueuePosition = 0; firstToLoadQueuePosition < queue.length; firstToLoadQueuePosition++) {
      if (Number(queue[firstToLoadQueuePosition % queue.length].sequenceId) >= currentUnitSequenceId) {
        break;
      }
    }
    const offset = ((firstToLoadQueuePosition % queue.length) + queue.length) % queue.length;
    this.unitContentLoadingQueue = queue.slice(offset).concat(queue.slice(0, offset));
  }

  private loadUnitContents(testData: TestData): Promise<void> {
    // we don't load files in parallel since it made problems, when a whole class tried it at once
    const unitContentLoadingProgresses$: { [unitSequenceID: number] : Subject<LoadingProgress> } = {};
    this.unitContentLoadingQueue
      .forEach(unitToLoad => {
        unitContentLoadingProgresses$[Number(unitToLoad.sequenceId)] =
          new BehaviorSubject<LoadingProgress>({ progress: 'PENDING' });
        this.tcs.setUnitLoadProgress$(
          Number(unitToLoad.sequenceId),
          unitContentLoadingProgresses$[Number(unitToLoad.sequenceId)].asObservable()
        );
      });

    return new Promise<void>(resolve => {
      if (this.tcs.bookletConfig.loading_mode === 'LAZY') {
        resolve();
      }

      this.unitContentLoadSubscription = from(this.unitContentLoadingQueue)
        .pipe(
          concatMap(queueEntry => {
            const unitContentLoading$ =
              this.bs.getResource(testData.workspaceId, queueEntry.definitionFile)
                .pipe(shareReplay());

            unitContentLoading$
              .pipe(
                map(loadingFile => {
                  if (!isLoadingFileLoaded(loadingFile)) {
                    return loadingFile;
                  }
                  this.tcs.setUnitDefinition(queueEntry.sequenceId, loadingFile.content);
                  return { progress: 100 };
                }),
                distinctUntilChanged((v1, v2) => v1.progress === v2.progress),
                tap(progress => this.incrementTotalProgress(progress, `content-${queueEntry.sequenceId}`))
              )
              .subscribe(unitContentLoadingProgresses$[queueEntry.sequenceId]);

            return unitContentLoading$;
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
    if (this.unitContentLoadSubscription !== null) {
      this.unitContentLoadSubscription.unsubscribe();
      this.unitContentLoadSubscription = null;
    }
  }

  private static getChildElements(element: Element): Element[] {
    return Array.prototype.slice.call(element.childNodes)
      .filter(e => e.nodeType === 1);
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

  private getBookletFromXml(xmlString: string): Booklet {
    const booklet = this.parseBookletXml(xmlString);

    const registerChildren = (testlet: Testlet): void => {
      testlet.children
        .forEach(child => {
          // eslint-disable-next-line no-plusplus
          if (isUnit(child)) {
            this.tcs.unitAliasMap[child.id] = child.sequenceId;
            this.tcs.units[child.sequenceId] = child;
          } else {
            this.tcs.testlets[child.id] = child;
            registerChildren(child);
          }
        });
    };

    registerChildren(booklet.units);

    this.tcs.sequenceLength = Object.keys(this.tcs.units).length;
    this.tcs.bookletConfig = booklet.config;
    this.cts.addCustomTexts(booklet.customTexts);
    return booklet;
  }

  // eslint-disable-next-line class-methods-use-this
  toBooklet(bookletDef: BookletDef<Testlet>): Booklet {
    return Object.assign(bookletDef, {});
  }

  // eslint-disable-next-line class-methods-use-this
  toTestlet(testletDef: TestletDef<Testlet, Unit>, elem: Element, context: ContextInBooklet<Testlet>): Testlet {
    return Object.assign(testletDef, {
      sequenceId: NaN,
      lockedByTime: false,
      lockedByCode: false,
      context
    });
  }

  // eslint-disable-next-line class-methods-use-this
  toUnit(unitDef: UnitDef, elem: Element, context: ContextInBooklet<Testlet>): Unit {
    return Object.assign(unitDef, {
      sequenceId: context.global.unitIndex,
      codeRequiringTestlets: context.parents.filter(parent => parent?.restrictions?.codeToEnter?.code),
      timerRequiringTestlet:
        (context.parents[context.parents.length - 1] &&
          context.parents[context.parents.length - 1].restrictions?.timeMax?.minutes
        ) ?
          context.parents[context.parents.length - 1] :
          null,
      parent: context.parents[0],
      blockLabel: context.parents.length ? context.parents[context.parents.length - 1].label : 'k', // TODO X k?!
      playerFileName: '',
      localIndex: context.localUnitIndex,
      context
    });
  }
}
