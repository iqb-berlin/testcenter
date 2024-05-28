/* eslint-disable no-console */
import { Injectable } from '@angular/core';
import {
  BehaviorSubject, from, Observable, of, Subject, Subscription
} from 'rxjs';
import {
  concatMap, distinctUntilChanged, last, map, shareReplay, switchMap, tap
} from 'rxjs/operators';
import { CustomtextService, BookletConfig, TestMode } from '../../shared/shared.module';
import {
  isLoadingFileLoaded,
  isNavigationLeaveRestrictionValue,
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
  UnitStateKey, MaxTimeLeaveValue, maxTimeLeaveValues
} from '../interfaces/test-controller.interfaces';
import { EnvironmentData, NavigationLeaveRestrictions, Testlet } from '../classes/test-controller.classes';
import { TestControllerService } from './test-controller.service';
import { BackendService } from './backend.service';
import { AppError } from '../../app.interfaces';

@Injectable({
  providedIn: 'root'
})
export class TestLoaderService {
  private loadStartTimeStamp = 0;
  private unitContentLoadSubscription: Subscription | null = null;
  private environment: EnvironmentData; // TODO (possible refactoring) outsource to a service or what
  private lastUnitSequenceId = 0;
  private unitContentLoadingQueue: LoadingQueueEntry[] = [];
  private totalLoadingProgressParts: { [loadingId: string]: number } = {};

  constructor(
    public tcs: TestControllerService,
    private bs: BackendService,
    private cts: CustomtextService
  ) {
    this.environment = new EnvironmentData();
  }

  async loadTest(): Promise<void> {
    this.reset();
    const ts = Date.now();

    this.tcs.testStatus$.next(TestControllerState.LOADING);

    const testData = await this.bs.getTestData(this.tcs.testId).toPromise();
    if (!testData) {
      return; // error is already thrown
    }

    this.tcs.workspaceId = testData.workspaceId;
    this.tcs.testMode = new TestMode(testData.mode);
    this.restoreRestrictions(testData.laststate);
    this.tcs.rootTestlet = this.getBookletFromXml(testData.xml);

    this.tcs.timerWarningPoints =
      this.tcs.bookletConfig.unit_time_left_warnings
        .split(',')
        .map(x => parseInt(x, 10))
        .filter(x => !Number.isNaN(x));

    await this.loadUnits(testData);
    this.prepareUnitContentLoadingQueueOrder(testData.laststate.CURRENT_UNIT_ID || '1');
    this.tcs.rootTestlet.lockUnitsIfTimeLeftNull();

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
    if (!this.tcs.rootTestlet) {
      throw new AppError({ description: '', label: 'Booklet not loaded yet.', type: 'script' });
    }
    const currentUnitId = lastState[TestStateKey.CURRENT_UNIT_ID];
    this.tcs.resumeTargetUnitSequenceId = currentUnitId ?
      this.tcs.rootTestlet.getSequenceIdByUnitAlias(currentUnitId) :
      1;
    if (
      (lastState[TestStateKey.CONTROLLER] === TestControllerState.TERMINATED_PAUSED) ||
      (lastState[TestStateKey.CONTROLLER] === TestControllerState.PAUSED)
    ) {
      this.tcs.testStatus$.next(TestControllerState.PAUSED);
      this.tcs.setUnitNavigationRequest(UnitNavigationTarget.PAUSE);
      return;
    }
    this.tcs.testStatus$.next(TestControllerState.RUNNING);
    this.tcs.setUnitNavigationRequest(this.tcs.resumeTargetUnitSequenceId.toString());
  }

  private restoreRestrictions(lastState: { [k in TestStateKey]?: string }): void {
    if (lastState[TestStateKey.TESTLETS_TIMELEFT]) {
      this.tcs.maxTimeTimers = JSON.parse(lastState[TestStateKey.TESTLETS_TIMELEFT]);
    }
    if (lastState[TestStateKey.TESTLETS_CLEARED_CODE]) {
      this.tcs.clearCodeTestlets = JSON.parse(lastState[TestStateKey.TESTLETS_CLEARED_CODE]);
    }
  }

  private loadUnits(testData: TestData): Promise<number | undefined> {
    const sequence = [];
    for (let i = 1; i < this.lastUnitSequenceId; i++) {
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
    const unitDef = this.tcs.getUnitWithContext(sequenceId).unitDef;
    const resources = testData.resources[unitDef.id.toUpperCase()];
    if (!resources) {
      throw new Error(`No resources for unitId: \`${unitDef.id}\`.`);
    }
    if (!(resources.usesPlayer && resources.usesPlayer.length)) {
      throw new Error(`Unit has no player: \`${unitDef.id}\`)`);
    }
    unitDef.playerFileName = resources.usesPlayer[0];

    const definitionFile = (resources.isDefinedBy && resources.isDefinedBy.length) ? resources.isDefinedBy[0] : null;

    if (testData.firstStart && definitionFile) {
      // we don't need to call `[GET] /test/{testID}/unit` when this is the first test and no inline definition
      this.incrementTotalProgress({ progress: 100 }, `unit-${sequenceId}`);
      this.unitContentLoadingQueue.push({ sequenceId, definitionFile });
      return this.getPlayer(testData, sequenceId, unitDef.playerFileName);
    }

    return this.bs.getUnitData(this.tcs.testId, unitDef.id, unitDef.alias)
      .pipe(
        switchMap((unit: UnitData) => {
          if (!unit) {
            throw new Error(`Unit is empty ${this.tcs.testId}/${unitDef.id}.`);
          }

          this.incrementTotalProgress({ progress: 100 }, `unit-${sequenceId}`);

          this.tcs.setUnitPresentationProgress(sequenceId, unit.state[UnitStateKey.PRESENTATION_PROGRESS]);
          this.tcs.setUnitResponseProgress(sequenceId, unit.state[UnitStateKey.RESPONSE_PROGRESS]);
          this.tcs.setUnitStateCurrentPage(sequenceId, unit.state[UnitStateKey.CURRENT_PAGE_ID]);
          this.tcs.setUnitStateDataParts(sequenceId, unit.dataParts);
          this.tcs.setUnitResponseType(sequenceId, unit.unitResponseType);

          if (definitionFile) {
            this.unitContentLoadingQueue.push({ sequenceId, definitionFile });
          } else {
            // inline unit definition
            this.tcs.setUnitPlayerFilename(sequenceId, unitDef.playerFileName);
            this.tcs.setUnitDefinition(sequenceId, unit.definition);
            this.tcs.setUnitLoadProgress$(sequenceId, of({ progress: 100 }));
            this.incrementTotalProgress({ progress: 100 }, `content-${sequenceId}`);
          }

          return this.getPlayer(testData, sequenceId, unitDef.playerFileName);
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

  private prepareUnitContentLoadingQueueOrder(currentUnitId: string = '1'): void {
    if (!this.tcs.rootTestlet) {
      throw new AppError({
        description: '', label: 'Testheft noch nicht verfügbar', type: 'script'
      });
    }
    const currentUnitSequenceId = this.tcs.rootTestlet.getSequenceIdByUnitAlias(currentUnitId);
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

  private getBookletFromXml(xmlString: string): Testlet {
    const oParser = new DOMParser();
    const xmlStringWithOutBom = xmlString.replace(/^\uFEFF/gm, '');
    const oDOM = oParser.parseFromString(xmlStringWithOutBom, 'text/xml');

    if (oDOM.documentElement.nodeName !== 'Booklet') {
      throw Error('Root element fo Booklet should be <Booklet>');
    }
    const metadataElements = oDOM.documentElement.getElementsByTagName('Metadata');
    if (metadataElements.length === 0) {
      throw Error('<Metadata>-Element missing');
    }
    const metadataElement = metadataElements[0];
    const IdElement = metadataElement.getElementsByTagName('Id')[0];
    const LabelElement = metadataElement.getElementsByTagName('Label')[0];
    const rootTestlet = new Testlet(0, IdElement.textContent || '', LabelElement.textContent || '');
    const unitsElements = oDOM.documentElement.getElementsByTagName('Units');
    if (unitsElements.length > 0) {
      const customTextsElements = oDOM.documentElement.getElementsByTagName('CustomTexts');
      if (customTextsElements.length > 0) {
        const customTexts = TestLoaderService.getChildElements(customTextsElements[0]);
        const customTextsForBooklet: { [key: string] : string } = {};
        for (let childIndex = 0; childIndex < customTexts.length; childIndex++) {
          if (customTexts[childIndex].nodeName === 'CustomText') {
            const customTextKey = customTexts[childIndex].getAttribute('key');
            if (customTextKey) {
              customTextsForBooklet[customTextKey] = customTexts[childIndex].textContent || '';
            }
          }
        }
        this.cts.addCustomTexts(customTextsForBooklet);
      }

      const bookletConfigElements = oDOM.documentElement.getElementsByTagName('BookletConfig');

      this.tcs.bookletConfig = new BookletConfig();
      if (bookletConfigElements.length > 0) {
        this.tcs.bookletConfig.setFromXml(bookletConfigElements[0]);
      }

      // recursive call through all testlets
      this.lastUnitSequenceId = 1;
      this.tcs.allUnitIds = [];
      this.addTestletContentFromBookletXml(
        rootTestlet,
        unitsElements[0],
        new NavigationLeaveRestrictions(
          this.tcs.bookletConfig.force_presentation_complete,
          this.tcs.bookletConfig.force_response_complete
        )
      );
    }
    return rootTestlet;
  }

  private addTestletContentFromBookletXml(
    targetTestlet: Testlet,
    node: Element,
    navigationLeaveRestrictions: NavigationLeaveRestrictions
  ) {
    const childElements = TestLoaderService.getChildElements(node);
    if (childElements.length > 0) {
      let codeToEnter = '';
      let codePrompt = '';
      let maxTime = -1;

      let maxTimeLeave: MaxTimeLeaveValue = 'confirm';
      let forcePresentationComplete = navigationLeaveRestrictions.presentationComplete;
      let forceResponseComplete = navigationLeaveRestrictions.responseComplete;

      let restrictionElement: Element | null = null;
      for (let childIndex = 0; childIndex < childElements.length; childIndex++) {
        if (childElements[childIndex].nodeName === 'Restrictions') {
          restrictionElement = childElements[childIndex];
          break;
        }
      }
      if (restrictionElement !== null) {
        const restrictionElements = TestLoaderService.getChildElements(restrictionElement);
        for (let childIndex = 0; childIndex < restrictionElements.length; childIndex++) {
          if (restrictionElements[childIndex].nodeName === 'CodeToEnter') {
            const restrictionParameter = restrictionElements[childIndex].getAttribute('code');
            if ((typeof restrictionParameter !== 'undefined') && (restrictionParameter !== null)) {
              codeToEnter = restrictionParameter.toUpperCase();
              codePrompt = restrictionElements[childIndex].textContent || '';
            }
          }
          if (restrictionElements[childIndex].nodeName === 'TimeMax') {
            const restrictionParameter = restrictionElements[childIndex].getAttribute('minutes');
            if ((typeof restrictionParameter !== 'undefined') && (restrictionParameter !== null)) {
              maxTime = Number(restrictionParameter);
              if (Number.isNaN(maxTime)) {
                maxTime = -1;
              }
            }
            const leaveParameter = restrictionElements[childIndex].getAttribute('leave');
            console.log(1, {leaveParameter,maxTimeLeaveValues});
            if (leaveParameter && maxTimeLeaveValues.includes(leaveParameter)) {

              maxTimeLeave = leaveParameter;
              console.log(2, {maxTimeLeave});
            }
          }
          if (restrictionElements[childIndex].nodeName === 'DenyNavigationOnIncomplete') {
            const presentationComplete = restrictionElements[childIndex].getAttribute('presentation');
            if (presentationComplete && isNavigationLeaveRestrictionValue(presentationComplete)) {
              forcePresentationComplete = presentationComplete;
            }
            const responseComplete = restrictionElements[childIndex].getAttribute('response');
            if (responseComplete && isNavigationLeaveRestrictionValue(responseComplete)) {
              forceResponseComplete = responseComplete;
            }
          }
        }
      }

      if (codeToEnter.length > 0) {
        targetTestlet.codeToEnter = codeToEnter;
        targetTestlet.codePrompt = codePrompt;
      }
      console.log(targetTestlet.title, maxTime, maxTimeLeave);
      targetTestlet.maxTimeLeft = maxTime;
      targetTestlet.maxTimeLeave = maxTimeLeave;
      if (this.tcs.maxTimeTimers) {
        if (targetTestlet.id in this.tcs.maxTimeTimers) {
          targetTestlet.maxTimeLeft = this.tcs.maxTimeTimers[targetTestlet.id];
        }
      }
      const newNavigationLeaveRestrictions =
        new NavigationLeaveRestrictions(forcePresentationComplete, forceResponseComplete);

      for (let childIndex = 0; childIndex < childElements.length; childIndex++) {
        if (childElements[childIndex].nodeName === 'Unit') {
          const unitId = childElements[childIndex].getAttribute('id');
          if (!unitId) {
            throw new AppError({
              description: '', label: `Unit-Id Fehlt in unit nr ${childIndex} von ${targetTestlet.id}`, type: 'xml'
            });
          }
          let unitAlias = childElements[childIndex].getAttribute('alias');
          if (!unitAlias) {
            unitAlias = unitId;
          }
          let unitAliasClear = unitAlias;
          let unitIdSuffix = 1;
          while (this.tcs.allUnitIds.indexOf(unitAliasClear) > -1) {
            unitAliasClear = `${unitAlias}-${unitIdSuffix.toString()}`;
            unitIdSuffix += 1;
          }
          this.tcs.allUnitIds.push(unitAliasClear);

          targetTestlet.addUnit(
            this.lastUnitSequenceId,
            unitId,
            childElements[childIndex].getAttribute('label') ?? '',
            unitAliasClear,
            childElements[childIndex].getAttribute('labelshort') ?? '',
            newNavigationLeaveRestrictions
          );
          this.lastUnitSequenceId += 1;
        } else if (childElements[childIndex].nodeName === 'Testlet') {
          const testletId = childElements[childIndex].getAttribute('id');
          if (!testletId) {
            throw new AppError({
              description: '', label: `Testlet-Id fehlt in unit nr ${childIndex} von ${targetTestlet.id}`, type: 'xml'
            });
          }
          const testletLabel: string = childElements[childIndex].getAttribute('label')?.trim() ?? '';

          this.addTestletContentFromBookletXml(
            targetTestlet.addTestlet(testletId, testletLabel),
            childElements[childIndex],
            newNavigationLeaveRestrictions
          );
        }
      }
    }
  }
}
