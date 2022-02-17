/* eslint-disable no-console */
import { Inject, Injectable } from '@angular/core';
import {
  BehaviorSubject, from, Observable, of, Subject, Subscription, throwError
} from 'rxjs';
import {
  concatMap, distinctUntilChanged, last, map, shareReplay, switchMap, tap
} from 'rxjs/operators';
import { CustomtextService, MainDataService } from '../../shared/shared.module';
import {
  isLoadingFileLoaded, isNavigationLeaveRestrictionValue, LoadedFile, LoadingProgress, StateReportEntry, TaggedString,
  TestControllerState, TestData, TestLogEntryKey, TestStateKey, UnitNavigationTarget, UnitStateKey
} from '../interfaces/test-controller.interfaces';
import { TestMode } from '../../config/test-mode';
import {
  EnvironmentData, NavigationLeaveRestrictions, Testlet, UnitDef
} from '../classes/test-controller.classes';
import { TestControllerService } from './test-controller.service';
import { BackendService } from './backend.service';
import { LocalStorage } from '../utils/local-storage.util';
// eslint-disable-next-line import/extensions
import { BookletConfig } from '../../config/booklet-config';

@Injectable({
  providedIn: 'root'
})
export class TestLoaderService {
  private loadStartTimeStamp = 0;
  private unitContentLoadSubscription: Subscription = null;
  private environment: EnvironmentData; // TODO (possible refactoring) outsource to a service or what
  private lastUnitSequenceId = 0;
  private unitContentLoadingQueue: TaggedString[] = [];
  private totalLoadingProgressParts: { [loadingId: string]: number } = {};

  constructor(
    @Inject('APP_VERSION') public appVersion: string,
    @Inject('IS_PRODUCTION_MODE') public isProductionMode: boolean,
    public tcs: TestControllerService,
    private bs: BackendService,
    private cts: CustomtextService
  ) {
  }

  async loadTest(): Promise<void> {
    let testData: TestData;
    try {
      this.reset();

      this.tcs.testStatus$.next(TestControllerState.LOADING);
      LocalStorage.setTestId(this.tcs.testId);

      testData = await this.bs.getTestData(this.tcs.testId).toPromise();
      this.tcs.testMode = new TestMode(testData.mode);
      this.restoreRestrictions(testData.laststate);
      this.tcs.rootTestlet = this.getBookletFromXml(testData.xml);

      await this.loadUnits();
      this.prepareUnitContentLoadingQueueOrder(testData.laststate.CURRENT_UNIT_ID || '1');
      this.tcs.rootTestlet.lockUnitsIfTimeLeftNull();
    } catch (e) {
      return Promise.reject(e);
    }
    return this.loadUnitContents()
      .then(() => {
        this.resumeTest(testData.laststate);
      });
    // when this promise resolves, it is allowed to start the test
  }

  reset(): void {
    this.unsubscribeTestSubscriptions();

    // Reset TestMode to be Demo, before the correct one comes with getTestData
    // TODO maybe it would be better to retrieve the testmode from the login
    this.tcs.testMode = new TestMode();
    this.tcs.resetDataStore();

    this.tcs.totalLoadingProgress = 0;
    this.totalLoadingProgressParts = {};

    this.environment = new EnvironmentData(this.appVersion);
    this.loadStartTimeStamp = Date.now();
    this.unitContentLoadingQueue = [];
  }

  private resumeTest(lastState: { [k in TestStateKey]?: string }): void {
    this.tcs.resumeTargetUnitSequenceId =
      this.tcs.rootTestlet.getSequenceIdByUnitAlias(lastState[TestStateKey.CURRENT_UNIT_ID]) || 1;
    if (lastState[TestStateKey.CONTROLLER] && (lastState[TestStateKey.CONTROLLER] === TestControllerState.PAUSED)) {
      this.tcs.testStatus$.next(TestControllerState.PAUSED);
      this.tcs.setUnitNavigationRequest(UnitNavigationTarget.PAUSE);
      return;
    }
    this.tcs.testStatus$.next(TestControllerState.RUNNING);
    this.tcs.setUnitNavigationRequest(this.tcs.resumeTargetUnitSequenceId.toString());
  }

  private restoreRestrictions(lastState: { [k in TestStateKey]?: string }): void {
    Object.keys(lastState).forEach(stateKey => {
      switch (stateKey) {
        case (TestStateKey.TESTLETS_TIMELEFT):
          this.tcs.maxTimeTimers = JSON.parse(lastState[stateKey]);
          break;
        case (TestStateKey.TESTLETS_CLEARED_CODE):
          this.tcs.clearCodeTestlets = JSON.parse(lastState[stateKey]);
          break;
        default:
      }
    });
  }

  private loadUnits(): Promise<number> {
    const sequence = [];
    for (let i = 1; i < this.lastUnitSequenceId; i++) {
      this.totalLoadingProgressParts[`unit-${i}`] = 0;
      this.totalLoadingProgressParts[`player-${i}`] = 0;
      this.totalLoadingProgressParts[`content-${i}`] = 0;
      sequence.push(i);
    }
    return from(sequence)
      .pipe(
        concatMap(nr => this.loadUnit(this.tcs.rootTestlet.getUnitAt(nr).unitDef, nr))
      )
      .toPromise();
  }

  private loadUnit(unitDef: UnitDef, sequenceId: number): Observable<number> {
    return this.bs.getUnitData(this.tcs.testId, unitDef.id, unitDef.alias)
      .pipe(
        switchMap(unit => {
          if (typeof unit === 'boolean') {
            return throwError(`error requesting unit ${this.tcs.testId}/${unitDef.id}`);
          }

          this.incrementTotalProgress({ progress: 100 }, `unit-${sequenceId}`);

          this.tcs.setUnitPresentationProgress(sequenceId, unit.state[UnitStateKey.PRESENTATION_PROGRESS]);
          this.tcs.setUnitResponseProgress(sequenceId, unit.state[UnitStateKey.RESPONSE_PROGRESS]);
          this.tcs.setUnitDataCurrentPage(sequenceId, unit.state[UnitStateKey.CURRENT_PAGE_ID]);
          this.tcs.setUnitStateDataParts(sequenceId, unit.dataParts);
          this.tcs.setUnitStateDataType(sequenceId, unit.unitStateDataType);

          unitDef.playerId = unit.playerId;
          if (unit.definitionRef) {
            this.unitContentLoadingQueue.push(<TaggedString>{
              tag: sequenceId.toString(),
              value: unit.definitionRef
            });
          } else {
            this.tcs.setUnitDefinitionType(sequenceId, unit.playerId);
            this.tcs.setUnitDefinition(sequenceId, unit.definition);
            this.tcs.setUnitLoadProgress$(sequenceId, of({ progress: 100 }));
            this.incrementTotalProgress({ progress: 100 }, `content-${sequenceId}`);
          }

          if (this.tcs.hasPlayer(unit.playerId)) {
            this.incrementTotalProgress({ progress: 100 }, `player-${sequenceId}`);
            return of(sequenceId);
          }

          // this.tcs.addPlayer(unit.playerId, '');
          const playerFileId = TestControllerService.normaliseId(unit.playerId, 'html');
          return this.bs.getResource(this.tcs.testId, playerFileId, true)
            .pipe(
              tap((progress: LoadedFile | LoadingProgress) => {
                this.incrementTotalProgress(
                  isLoadingFileLoaded(progress) ? { progress: 100 } : progress,
                  `player-${sequenceId}`
                );
              }),
              last(),
              map((player: LoadedFile) => {
                this.tcs.addPlayer(unit.playerId, player.content);
                return sequenceId;
              })
            );
        })
      );
  }

  private prepareUnitContentLoadingQueueOrder(currentUnitId: string = '1'): void {
    const currentUnitSequenceId = this.tcs.rootTestlet.getSequenceIdByUnitAlias(currentUnitId);
    const queue = this.unitContentLoadingQueue;
    let firstToLoadQueuePosition;
    for (firstToLoadQueuePosition = 0; firstToLoadQueuePosition < queue.length; firstToLoadQueuePosition++) {
      if (Number(queue[firstToLoadQueuePosition % queue.length].tag) >= currentUnitSequenceId) {
        break;
      }
    }
    const offset = ((firstToLoadQueuePosition % queue.length) + queue.length) % queue.length;
    this.unitContentLoadingQueue = queue.slice(offset).concat(queue.slice(0, offset));
  }

  private loadUnitContents(): Promise<void> {
    // we don't load files in parallel since it made problems, when a whole class tried it at once
    const unitContentLoadingProgresses$: { [unitSequenceID: number] : Subject<LoadingProgress> } = {};
    this.unitContentLoadingQueue
      .forEach(unitToLoad => {
        unitContentLoadingProgresses$[Number(unitToLoad.tag)] =
          new BehaviorSubject<LoadingProgress>({ progress: 'PENDING' });
        this.tcs.setUnitLoadProgress$(
          Number(unitToLoad.tag),
          unitContentLoadingProgresses$[Number(unitToLoad.tag)].asObservable()
        );
      });

    return new Promise<void>((resolve, reject) => {
      if (this.tcs.bookletConfig.loading_mode === 'LAZY') {
        resolve();
      }

      this.unitContentLoadSubscription = from(this.unitContentLoadingQueue)
        .pipe(
          concatMap(queueEntry => {
            const unitSequenceID = Number(queueEntry.tag);

            const unitContentLoading$ = this.bs.getResource(this.tcs.testId, queueEntry.value)
              .pipe(shareReplay());

            unitContentLoading$
              .pipe(
                map(loadingFile => {
                  if (!isLoadingFileLoaded(loadingFile)) {
                    return loadingFile;
                  }
                  this.tcs.setUnitDefinition(unitSequenceID, loadingFile.content);
                  return { progress: 100 };
                }),
                distinctUntilChanged((v1, v2) => v1.progress === v2.progress),
                tap(progress => this.incrementTotalProgress(progress, `content-${unitSequenceID}`))
              )
              .subscribe(unitContentLoadingProgresses$[unitSequenceID]);

            return unitContentLoading$;
          })
        )
        .subscribe({
          error: reject,
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
    let rootTestlet: Testlet = null;
    const oParser = new DOMParser();
    const oDOM = oParser.parseFromString(xmlString, 'text/xml');

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
    rootTestlet = new Testlet(0, IdElement.textContent, LabelElement.textContent);
    const unitsElements = oDOM.documentElement.getElementsByTagName('Units');
    if (unitsElements.length > 0) {
      const customTextsElements = oDOM.documentElement.getElementsByTagName('CustomTexts');
      if (customTextsElements.length > 0) {
        const customTexts = TestLoaderService.getChildElements(customTextsElements[0]);
        const customTextsForBooklet = {};
        for (let childIndex = 0; childIndex < customTexts.length; childIndex++) {
          if (customTexts[childIndex].nodeName === 'Text') {
            const customTextKey = customTexts[childIndex].getAttribute('key');
            if ((typeof customTextKey !== 'undefined') && (customTextKey !== null)) {
              customTextsForBooklet[customTextKey] = customTexts[childIndex].textContent;
            }
          }
        }
        this.cts.addCustomTexts(customTextsForBooklet);
      }

      const bookletConfigElements = oDOM.documentElement.getElementsByTagName('BookletConfig');

      this.tcs.bookletConfig = new BookletConfig();
      this.tcs.bookletConfig.setFromKeyValuePairs(MainDataService.getTestConfig());
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

  private addTestletContentFromBookletXml(targetTestlet: Testlet, node: Element,
                                          navigationLeaveRestrictions: NavigationLeaveRestrictions) {
    const childElements = TestLoaderService.getChildElements(node);
    if (childElements.length > 0) {
      let codeToEnter = '';
      let codePrompt = '';
      let maxTime = -1;
      let forcePresentationComplete = navigationLeaveRestrictions.presentationComplete;
      let forceResponseComplete = navigationLeaveRestrictions.responseComplete;

      let restrictionElement: Element = null;
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
              codePrompt = restrictionElements[childIndex].textContent;
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
          }
          if (restrictionElements[childIndex].nodeName === 'DenyNavigationOnIncomplete') {
            const presentationComplete = restrictionElements[childIndex].getAttribute('presentation');
            if (isNavigationLeaveRestrictionValue(presentationComplete)) {
              forcePresentationComplete = presentationComplete;
            }
            const responseComplete = restrictionElements[childIndex].getAttribute('response');
            if (isNavigationLeaveRestrictionValue(responseComplete)) {
              forceResponseComplete = responseComplete;
            }
          }
        }
      }

      if (codeToEnter.length > 0) {
        targetTestlet.codeToEnter = codeToEnter;
        targetTestlet.codePrompt = codePrompt;
      }
      targetTestlet.maxTimeLeft = maxTime;
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
            childElements[childIndex].getAttribute('label'),
            unitAliasClear,
            childElements[childIndex].getAttribute('labelshort'),
            newNavigationLeaveRestrictions
          );
          this.lastUnitSequenceId += 1;
        } else if (childElements[childIndex].nodeName === 'Testlet') {
          const testletId: string = childElements[childIndex].getAttribute('id');
          let testletLabel: string = childElements[childIndex].getAttribute('label');
          testletLabel = testletLabel ? testletLabel.trim() : '';

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
