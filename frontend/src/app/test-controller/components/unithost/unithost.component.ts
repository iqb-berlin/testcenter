/* eslint-disable no-console */
import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import {
  Component, HostListener, OnInit, OnDestroy
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  TestStateKey,
  WindowFocusState,
  PendingUnitData,
  StateReportEntry,
  UnitStateKey,
  UnitPlayerState, LoadingProgress, UnitNavigationTarget
} from '../../interfaces/test-controller.interfaces';
import { BackendService } from '../../services/backend.service';
import { TestControllerService } from '../../services/test-controller.service';
import { MainDataService } from '../../../shared/shared.module';
import {
  VeronaNavigationDeniedReason, VeronaNavigationTarget, VeronaPlayerConfig, VeronaProgress
} from '../../interfaces/verona.interfaces';
import { Testlet, UnitControllerData } from '../../classes/test-controller.classes';

declare let srcDoc;

@Component({
  templateUrl: './unithost.component.html',
  styleUrls: ['./unithost.component.css']
})

export class UnithostComponent implements OnInit, OnDestroy {
  private iFrameHostElement: HTMLElement;
  private iFrameItemplayer: HTMLIFrameElement;
  private subscriptions: { [tag: string ]: Subscription } = {};
  leaveWarning = false;

  showPageNav = false;

  currentUnitSequenceId = -1;

  private itemplayerSessionId = '';
  private postMessageTarget: Window = null;
  private pendingUnitData: PendingUnitData = null; // TODO this is redundant, get rid of it

  knownPages: { id: string; label: string }[];
  unitsLoading$: BehaviorSubject<LoadingProgress[]> = new BehaviorSubject<LoadingProgress[]>([]);
  unitsToLoadLabels: string[];

  currentUnit: UnitControllerData;
  currentPageIndex: number;
  unitNavigationTarget = UnitNavigationTarget;

  clearCodes = {};
  codeRequiringTestlets: Testlet[] = [];

  constructor(
    public tcs: TestControllerService,
    private mds: MainDataService,
    private bs: BackendService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.iFrameHostElement = <HTMLElement>document.querySelector('#iframe-host');
    this.iFrameItemplayer = null;
    this.leaveWarning = false;
    setTimeout(() => {
      this.subscriptions.postMessage = this.mds.postMessage$
        .subscribe(messageEvent => this.handleIncomingMessage(messageEvent));
      this.subscriptions.routing = this.route.params
        .subscribe(params => this.open(Number(params.u)));
      this.subscriptions.navigationDenial = this.tcs.navigationDenial
        .subscribe(navigationDenial => this.handleNavigationDenial(navigationDenial));
    });
  }

  ngOnDestroy(): void {
    Object.values(this.subscriptions).forEach(subscription => subscription.unsubscribe());
  }

  private handleIncomingMessage(messageEvent: MessageEvent): void {
    const msgData = messageEvent.data;
    const msgType = msgData.type;
    let msgPlayerId = msgData.sessionId;
    if ((msgPlayerId === undefined) || (msgPlayerId === null)) {
      msgPlayerId = this.itemplayerSessionId;
    }

    // todo: remove 'player'
    switch (msgType) {
      case 'vopReadyNotification':
      case 'player':
        // TODO add apiVersion check
        if (!this.pendingUnitData || this.pendingUnitData.playerId !== msgPlayerId) {
          this.pendingUnitData = {
            unitDefinitionType: '',
            unitDefinition: '',
            unitState: {
              unitStateDataType: '',
              dataParts: {},
              presentationProgress: 'none',
              responseProgress: 'none'
            },
            playerId: '',
            currentPage: null
          };
        }
        if (this.tcs.testMode.saveResponses) {
          this.bs.updateUnitState(this.tcs.testId, this.currentUnit.unitDef.alias, [<StateReportEntry>{
            key: UnitStateKey.PLAYER, timeStamp: Date.now(), content: UnitPlayerState.RUNNING
          }]);
        }
        this.postMessageTarget = messageEvent.source as Window;

        this.postMessageTarget.postMessage({
          type: 'vopStartCommand',
          sessionId: this.itemplayerSessionId,
          unitDefinition: this.pendingUnitData.unitDefinition,
          unitDefinitionType: this.pendingUnitData.unitDefinitionType,
          unitState: this.pendingUnitData.unitState,
          playerConfig: this.getPlayerConfig()
        }, '*');

        // TODO maybe clean up memory?

        break;

      case 'vopStateChangedNotification':
        if (msgPlayerId === this.itemplayerSessionId) {
          console.log('vopStateChangedNotification', msgData);
          if (msgData.playerState) {
            const { playerState } = msgData;

            if (playerState.validPages) {
              this.knownPages = Object.keys(playerState.validPages)
                .map(id => ({ id, label: playerState.validPages[id] }));
            }

            this.currentPageIndex = this.knownPages.findIndex(page => page.id === playerState.currentPage);

            if (typeof playerState.currentPage !== 'undefined') {
              const pageId = playerState.currentPage;
              const pageNr = this.knownPages.indexOf(playerState.currentPage) + 1;
              const pageCount = this.knownPages.length;
              if (this.knownPages.length > 1 && this.knownPages.indexOf(playerState.currentPage) >= 0) {
                this.tcs.newUnitStateCurrentPage(
                  this.currentUnit.unitDef.alias,
                  this.currentUnitSequenceId,
                  pageNr,
                  pageId,
                  pageCount
                );
              }
            }
          }
          const unitDbKey = this.currentUnit.unitDef.alias;
          if (msgData.unitState) {
            const { unitState } = msgData;
            const { presentationProgress, responseProgress } = unitState;

            if (presentationProgress) {
              this.tcs.updateUnitStatePresentationProgress(unitDbKey, this.currentUnitSequenceId, presentationProgress);
            }

            if (responseProgress) {
              this.tcs.newUnitStateResponseProgress(unitDbKey, this.currentUnitSequenceId, responseProgress);
            }

            if (unitState?.dataParts) {
              // in pre-verona4-times it was not entirely clear if the stringification of the dataParts should be made
              // by the player itself ot the host. To maintain backwards-compatibility we check this here.
              Object.keys(unitState.dataParts)
                .forEach(dataPartId => {
                  if (typeof unitState.dataParts[dataPartId] !== 'string') {
                    unitState.dataParts[dataPartId] = JSON.stringify(unitState.dataParts[dataPartId]);
                  }
                });
              this.tcs.updateUnitStateDataParts(unitDbKey, this.currentUnitSequenceId,
                unitState.dataParts, unitState.unitStateDataType);
            }
          }
          if (msgData.log) {
            this.bs.addUnitLog(this.tcs.testId, unitDbKey, msgData.log);
          }
        }
        break;

      case 'vopUnitNavigationRequestedNotification':
        if (msgPlayerId === this.itemplayerSessionId) {
          // support Verona2 and Verona3 version
          const target = msgData.target ? `#${msgData.target}` : msgData.targetRelative;
          this.tcs.setUnitNavigationRequest(target);
        }
        break;

      case 'vopWindowFocusChangedNotification':
        if (msgData.hasFocus) {
          this.tcs.windowFocusState$.next(WindowFocusState.PLAYER);
        } else if (document.hasFocus()) {
          this.tcs.windowFocusState$.next(WindowFocusState.HOST);
        } else {
          this.tcs.windowFocusState$.next(WindowFocusState.UNKNOWN);
        }
        break;

      default:
        console.log(`processMessagePost ignored message: ${msgType}`);
        break;
    }
  }

  private open(currentUnitSequenceId: number): void {
    this.currentUnitSequenceId = currentUnitSequenceId;
    this.tcs.currentUnitSequenceId = this.currentUnitSequenceId;
    this.mds.appSubTitle$.next(`Aufgabe ${this.currentUnitSequenceId}`);

    while (this.iFrameHostElement.hasChildNodes()) {
      this.iFrameHostElement.removeChild(this.iFrameHostElement.lastChild);
    }

    this.currentPageIndex = undefined;
    this.knownPages = [];

    this.currentUnit = this.tcs.rootTestlet.getUnitAt(this.currentUnitSequenceId);

    if (this.subscriptions.loading) {
      this.subscriptions.loading.unsubscribe();
    }

    const unitsToLoadIds = this.currentUnit.maxTimerRequiringTestlet ?
      this.tcs.rootTestlet.getAllUnitSequenceIds(this.currentUnit.maxTimerRequiringTestlet?.id) :
      [currentUnitSequenceId];

    const unitsToLoad = unitsToLoadIds
      .map(unitSequenceId => this.tcs.getUnitLoadProgress$(unitSequenceId));

    this.unitsToLoadLabels = unitsToLoadIds
      .map(unitSequenceId => this.tcs.rootTestlet.getUnitAt(unitSequenceId).unitDef.title);

    this.subscriptions.loading = combineLatest<LoadingProgress[]>(unitsToLoad)
      .subscribe({
        next: value => {
          this.unitsLoading$.next(value);
        },
        error: err => {
          this.mds.appError$.next({
            label: `Unit konnte nicht geladen werden. ${err.info}`, // TODO which item failed?
            description: (err.info) ? err.info : err,
            category: 'PROBLEM'
          });
        },
        complete: () => this.prepareUnit()
      });
  }

  private prepareUnit(): void {
    this.unitsLoading$.next([]);
    this.tcs.currentUnitDbKey = this.currentUnit.unitDef.alias;
    this.tcs.currentUnitTitle = this.currentUnit.unitDef.title;

    if (this.tcs.testMode.saveResponses) {
      this.bs.updateTestState(this.tcs.testId, [<StateReportEntry>{
        key: TestStateKey.CURRENT_UNIT_ID, timeStamp: Date.now(), content: this.currentUnit.unitDef.alias
      }]);
      this.bs.updateUnitState(this.tcs.testId, this.currentUnit.unitDef.alias, [<StateReportEntry>{
        key: UnitStateKey.PLAYER, timeStamp: Date.now(), content: UnitPlayerState.LOADING
      }]);
    }

    if (this.tcs.testMode.presetCode) {
      this.currentUnit.codeRequiringTestlets
        .forEach(testlet => { this.clearCodes[testlet.id] = testlet.codeToEnter; });
    }

    this.runUnit();
  }

  private runUnit(): void {
    this.codeRequiringTestlets = this.currentUnit.codeRequiringTestlets
      .filter(testlet => !this.tcs.clearCodeTestlets.includes(testlet.id));

    if (this.codeRequiringTestlets.length) {
      return;
    }

    if (this.currentUnit.unitDef.locked) {
      return;
    }

    this.startTimerIfNecessary();

    this.itemplayerSessionId = Math.floor(Math.random() * 20000000 + 10000000).toString();

    this.pendingUnitData = {
      playerId: this.itemplayerSessionId,
      unitDefinition: this.tcs.getUnitDefinition(this.currentUnitSequenceId),
      currentPage: this.tcs.getUnitStateCurrentPage(this.currentUnitSequenceId),
      unitDefinitionType: this.tcs.getUnitDefinitionType(this.currentUnitSequenceId),
      unitState: {
        dataParts: this.tcs.getUnitStateDataParts(this.currentUnitSequenceId),
        unitStateDataType: this.tcs.getUnitStateDataType(this.currentUnitSequenceId),
        presentationProgress: <VeronaProgress> this.tcs.getUnitPresentationProgress(this.currentUnitSequenceId),
        responseProgress: <VeronaProgress> this.tcs.getUnitResponseProgress(this.currentUnitSequenceId)
      }
    };
    this.leaveWarning = false;

    this.prepareIframe();
  }

  private startTimerIfNecessary(): void {
    if (this.currentUnit.maxTimerRequiringTestlet === null) {
      return;
    }
    if (this.tcs.currentMaxTimerTestletId &&
      (this.currentUnit.maxTimerRequiringTestlet.id === this.tcs.currentMaxTimerTestletId)
    ) {
      return;
    }
    this.tcs.startMaxTimer(
      this.currentUnit.maxTimerRequiringTestlet.id,
      this.currentUnit.maxTimerRequiringTestlet.maxTimeLeft
    );
  }

  private prepareIframe(): void {
    this.iFrameItemplayer = <HTMLIFrameElement>document.createElement('iframe');
    if (!('srcdoc' in this.iFrameItemplayer)) { // in IE11, we use a polyfill. But this can not work with sandbox
      this.iFrameItemplayer.setAttribute('sandbox', 'allow-forms allow-scripts allow-popups');
    }
    this.iFrameItemplayer.setAttribute('class', 'unitHost');
    this.adjustIframeSize();
    this.iFrameHostElement.appendChild(this.iFrameItemplayer);
    srcDoc.set(this.iFrameItemplayer, this.tcs.getPlayer(this.currentUnit.unitDef.playerId), { force: false });
  }

  private adjustIframeSize(): void {
    this.iFrameItemplayer.setAttribute('height', String(this.iFrameHostElement.clientHeight));
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.iFrameItemplayer && this.iFrameHostElement) {
      this.adjustIframeSize();
    }
  }

  private getPlayerConfig(): VeronaPlayerConfig {
    const playerConfig: VeronaPlayerConfig = {
      enabledNavigationTargets: UnithostComponent.getEnabledNavigationTargets(
        this.currentUnitSequenceId,
        1,
        this.tcs.allUnitIds.length,
        this.tcs.bookletConfig.allow_player_to_terminate_test
      ),
      logPolicy: this.tcs.bookletConfig.logPolicy,
      pagingMode: this.tcs.bookletConfig.pagingMode,
      stateReportPolicy: 'eager', // TODO implement stateReportPolicy 'on-demand' and 'none', then this can be
      // stateReportPolicy: this.tcs.bookletConfig.stateReportPolicy,
      unitNumber: this.currentUnitSequenceId,
      unitTitle: this.tcs.currentUnitTitle,
      unitId: this.currentUnit.unitDef.alias,
      directDownloadUrl: `${this.bs.serverUrl}${MainDataService.getAuthData()?.token}/resource`
    };
    if (this.pendingUnitData.currentPage && (this.tcs.bookletConfig.restore_current_page_on_return === 'ON')) {
      playerConfig.startPage = this.pendingUnitData.currentPage;
    }
    return playerConfig;
  }

  private static getEnabledNavigationTargets(
    nr: number, min: number, max: number,
    terminationAllowed: 'ON' | 'OFF' | 'LAST_UNIT' = 'ON'
  ): VeronaNavigationTarget[] {
    const navigationTargets = [];
    if (nr < max) {
      navigationTargets.push('next');
    }
    if (nr > min) {
      navigationTargets.push('previous');
    }
    if (nr !== min) {
      navigationTargets.push('first');
    }
    if (nr !== max) {
      navigationTargets.push('last');
    }
    if (terminationAllowed === 'ON') {
      navigationTargets.push('end');
    }
    if ((terminationAllowed === 'LAST_UNIT') && (nr === max)) {
      navigationTargets.push('end');
    }

    return navigationTargets;
  }

  gotoPage(navigationTarget: string): void {
    if (typeof this.postMessageTarget !== 'undefined') {
      this.postMessageTarget.postMessage({
        type: 'vopPageNavigationCommand',
        sessionId: this.itemplayerSessionId,
        target: navigationTarget
      }, '*');
    }
  }

  private handleNavigationDenial(
    navigationDenial: { sourceUnitSequenceId: number; reason: VeronaNavigationDeniedReason[] }
  ): void {
    if (navigationDenial.sourceUnitSequenceId !== this.currentUnitSequenceId) {
      return;
    }

    this.postMessageTarget.postMessage({
      type: 'vopNavigationDeniedNotification',
      sessionId: this.itemplayerSessionId,
      reason: navigationDenial.reason
    }, '*');
  }

  verifyCodes(): void {
    this.currentUnit.codeRequiringTestlets
      .forEach(
        testlet => {
          if (!this.clearCodes[testlet.id]) {
            return;
          }
          if (testlet.codeToEnter.toUpperCase().trim() === this.clearCodes[testlet.id].toUpperCase().trim()) {
            this.tcs.addClearedCodeTestlet(testlet.id);
            this.runUnit();
          } else {
            this.snackBar.open(
              `Freigabewort '${this.clearCodes[testlet.id]}' für '${testlet.title}' stimmt nicht.`,
              'OK',
              { duration: 3000 }
            );
            delete this.clearCodes[testlet.id];
          }
        }
      );
  }

  onKeydownInClearCodeInput($event: KeyboardEvent): void {
    if ($event.key === 'Enter') {
      this.verifyCodes();
    }
  }
}
