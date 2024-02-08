import {
  BehaviorSubject, combineLatest, merge, Subscription
} from 'rxjs';
import {
  Component, HostListener, OnInit, OnDestroy, ViewChild, ElementRef
} from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  TestStateKey,
  WindowFocusState,
  PendingUnitData,
  StateReportEntry,
  UnitStateKey, Testlet,
  UnitPlayerState, LoadingProgress, UnitNavigationTarget, Unit, isUnit
} from '../../interfaces/test-controller.interfaces';
import { BackendService } from '../../services/backend.service';
import { TestControllerService } from '../../services/test-controller.service';
import { MainDataService } from '../../../shared/shared.module';
import {
  VeronaNavigationDeniedReason, VeronaNavigationTarget, VeronaPlayerConfig, VeronaProgress
} from '../../interfaces/verona.interfaces';
import { AppError } from '../../../app.interfaces';

@Component({
  templateUrl: './unithost.component.html',
  styleUrls: ['./unithost.component.css']
})

export class UnithostComponent implements OnInit, OnDestroy {
  @ViewChild('iframeHost') private iFrameHostElement!: ElementRef;
  private iFrameItemplayer: HTMLIFrameElement | null = null;
  private subscriptions: { [tag: string ]: Subscription } = {};
  leaveWarning = false;

  currentUnitSequenceId = -1;

  private itemplayerSessionId = '';
  private postMessageTarget: Window = window;
  private pendingUnitData: PendingUnitData | null = null; // TODO this is redundant, get rid of it

  knownPages: { id: string; label: string }[] = [];
  unitsLoading$: BehaviorSubject<LoadingProgress[]> = new BehaviorSubject<LoadingProgress[]>([]);
  unitsToLoadLabels: string[] = [];

  currentUnit: Unit | null = null;
  currentPageIndex: number = -1;
  unitNavigationTarget = UnitNavigationTarget;
  clearCode: string = '';

  constructor(
    public tcs: TestControllerService,
    private mds: MainDataService,
    private bs: BackendService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.iFrameItemplayer = null;
    this.leaveWarning = false;
    setTimeout(() => {
      this.subscriptions.postMessage = this.mds.postMessage$
        .subscribe(messageEvent => this.handleIncomingMessage(messageEvent));
      this.subscriptions.routing = merge(this.route.queryParamMap, this.route.params)
        .subscribe((params: Params) => (params.u ? this.open(Number(<Params>params.u)) : this.reload()));
      this.subscriptions.navigationDenial = this.tcs.navigationDenial
        .subscribe(navigationDenial => this.handleNavigationDenial(navigationDenial));
    });
  }

  ngOnDestroy(): void {
    Object.values(this.subscriptions).forEach(subscription => subscription.unsubscribe());
  }

  private handleIncomingMessage(messageEvent: MessageEvent): void {
    if (!this.currentUnit) {
      return;
    }
    const msgData = messageEvent.data;
    const msgType = msgData.type;
    let msgPlayerId = msgData.sessionId;
    if ((msgPlayerId === undefined) || (msgPlayerId === null)) {
      msgPlayerId = this.itemplayerSessionId;
    }

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
        this.tcs.updateUnitState(
          this.currentUnitSequenceId,
          {
            alias: this.currentUnit.alias,
            state: [<StateReportEntry>{
              key: UnitStateKey.PLAYER,
              timeStamp: Date.now(),
              content: UnitPlayerState.RUNNING
            }]
          }
        );
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
        console.log(msgData);
        if (msgPlayerId === this.itemplayerSessionId) {
          if (msgData.playerState) {
            const { playerState } = msgData;

            if (playerState.validPages) {
              this.knownPages = Object.keys(playerState.validPages)
                .map(id => ({ id, label: playerState.validPages[id] }));
            }

            this.currentPageIndex = this.knownPages.findIndex(page => page.id === playerState.currentPage);

            if (typeof playerState.currentPage !== 'undefined') {
              const pageId = playerState.currentPage;
              const pageNr = Object.keys(playerState.validPages).indexOf(playerState.currentPage) + 1;
              const pageCount = this.knownPages.length;
              if (this.knownPages.length > 1 && playerState.validPages[playerState.currentPage]) {
                this.tcs.updateUnitState(
                  this.currentUnitSequenceId,
                  {
                    alias: this.currentUnit.alias,
                    state: [
                      { key: UnitStateKey.CURRENT_PAGE_NR, timeStamp: Date.now(), content: pageNr.toString() },
                      { key: UnitStateKey.CURRENT_PAGE_ID, timeStamp: Date.now(), content: pageId },
                      { key: UnitStateKey.PAGE_COUNT, timeStamp: Date.now(), content: pageCount.toString() }
                    ]
                  }
                );
              }
            }
          }
          if (msgData.unitState) {
            const { unitState } = msgData;
            const timeStamp = Date.now();

            this.tcs.updateUnitState(
              this.currentUnitSequenceId,
              {
                alias: this.currentUnit.alias,
                state: [
                  { key: UnitStateKey.PRESENTATION_PROGRESS, timeStamp, content: unitState.presentationProgress },
                  { key: UnitStateKey.RESPONSE_PROGRESS, timeStamp, content: unitState.responseProgress }
                ]
              }
            );

            if (unitState?.dataParts) {
              // in pre-verona4-times it was not entirely clear if the stringification of the dataParts should be made
              // by the player itself ot the host. To maintain backwards-compatibility we check this here.
              Object.keys(unitState.dataParts)
                .forEach(dataPartId => {
                  if (typeof unitState.dataParts[dataPartId] !== 'string') {
                    unitState.dataParts[dataPartId] = JSON.stringify(unitState.dataParts[dataPartId]);
                  }
                });
              this.tcs.updateUnitStateDataParts(
                this.currentUnit.alias,
                this.currentUnitSequenceId,
                unitState.dataParts,
                unitState.unitStateDataType
              );
            }
          }
          if (msgData.log) {
            this.bs.addUnitLog(this.tcs.testId, this.currentUnit.alias, msgData.log);
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
        // eslint-disable-next-line no-console
        console.log(`processMessagePost ignored message: ${msgType}`);
        break;
    }
  }

  private open(currentUnitSequenceId: number): void {
    this.currentUnitSequenceId = currentUnitSequenceId;
    this.tcs.currentUnitSequenceId = this.currentUnitSequenceId;

    while (this.iFrameHostElement.nativeElement.hasChildNodes()) {
      this.iFrameHostElement.nativeElement.removeChild(this.iFrameHostElement.nativeElement.lastChild);
    }

    this.currentPageIndex = -1;
    this.knownPages = [];

    this.currentUnit = this.tcs.getUnit(this.currentUnitSequenceId);

    this.mds.appSubTitle$.next(this.currentUnit.label);

    if (this.subscriptions.loading) {
      this.subscriptions.loading.unsubscribe();
    }

    let unitsToLoadIds: number[] = [];
    const addChildren = (testlet: Testlet) => {
      testlet.children.forEach(child => {
        if (isUnit(child)) {
          unitsToLoadIds.push(child.sequenceId);
        } else {
          addChildren(child);
        }
      });
    };
    if (this.currentUnit.parent) {
      addChildren(this.currentUnit.parent);
    } else {
      unitsToLoadIds = [this.tcs.currentUnitSequenceId];
    }

    const unitsToLoad = unitsToLoadIds
      .map(unitSequenceId => this.tcs.getUnitLoadProgress$(unitSequenceId));

    this.unitsToLoadLabels = unitsToLoadIds
      .map(unitSequenceId => this.tcs.getUnit(unitSequenceId).label);

    this.subscriptions.loading = combineLatest<LoadingProgress[]>(unitsToLoad)
      .subscribe({
        next: value => {
          this.unitsLoading$.next(value);
        },
        error: err => {
          console.log(err);
          this.mds.appError = new AppError({
            label: `Unit konnte nicht geladen werden. ${err.info}`,
            description: (err.info) ? err.info : err,
            type: 'network'
          });
        },
        complete: () => this.prepareUnit()
      });
  }

  private prepareUnit(): void {
    if (!this.currentUnit) {
      throw new Error('Unit not loaded');
    }
    this.unitsLoading$.next([]);

    if (this.tcs.testMode.saveResponses) {
      this.bs.updateTestState(this.tcs.testId, [{
        key: TestStateKey.CURRENT_UNIT_ID, timeStamp: Date.now(), content: this.currentUnit.alias
      }]);
      this.tcs.updateUnitState(
        this.currentUnitSequenceId,
        {
          alias: this.currentUnit.alias,
          state: [{ key: UnitStateKey.PLAYER, timeStamp: Date.now(), content: UnitPlayerState.LOADING }]
        }
      );
    }

    if (this.tcs.testMode.presetCode) {
      // this.currentUnit.codeRequiringTestlets // TODO X REIMPLEMENT!
      //   .forEach(testlet => { this.clearCodes[testlet.id] = testlet.restrictions?.codeToEnter?.code || ''; });
    }

    this.runUnit();
  }

  private runUnit(): void {
    if (!this.currentUnit) {
      throw new Error('Unit not loaded');
    }

    if (this.currentUnit.parent.locked) {
      return;
    }

    this.startTimerIfNecessary();

    this.itemplayerSessionId = Math.floor(Math.random() * 20000000 + 10000000).toString();

    this.pendingUnitData = {
      playerId: this.itemplayerSessionId,
      unitDefinition: this.tcs.getUnitDefinition(this.currentUnitSequenceId),
      currentPage: this.tcs.getUnitStateCurrentPage(this.currentUnitSequenceId),
      unitDefinitionType: this.tcs.currentUnit.playerId,
      unitState: {
        dataParts: this.tcs.getUnitStateDataParts(this.currentUnitSequenceId),
        unitStateDataType: this.tcs.getUnitResponseType(this.currentUnitSequenceId),
        presentationProgress: <VeronaProgress> this.tcs.getUnitPresentationProgress(this.currentUnitSequenceId),
        responseProgress: <VeronaProgress> this.tcs.getUnitResponseProgress(this.currentUnitSequenceId)
      }
    };
    this.leaveWarning = false;

    this.prepareIframe();
  }

  private startTimerIfNecessary(): void {
    if (!this.currentUnit?.parent.timerId) {
      return;
    }
    if (this.tcs.currentTimerId &&
      (this.currentUnit.parent.timerId === this.tcs.currentTimerId)
    ) {
      return;
    }
    this.tcs.startTimer(this.tcs.units[this.currentUnit.sequenceId].parent);
  }

  private prepareIframe(): void {
    if (!this.currentUnit) {
      return;
    }
    this.iFrameItemplayer = <HTMLIFrameElement>document.createElement('iframe');
    if (!('srcdoc' in this.iFrameItemplayer)) {
      this.mds.appError = new AppError({
        label: 'Veralteter Browser',
        description: 'Ihr browser is veraltet oder inkompatibel mit dieser Anwendung!',
        type: 'general'
      });
      return;
    }
    this.iFrameItemplayer.setAttribute('class', 'unitHost');
    this.adjustIframeSize();
    this.iFrameHostElement.nativeElement.appendChild(this.iFrameItemplayer);
    this.iFrameItemplayer.setAttribute('srcdoc', this.tcs.getPlayer(this.currentUnit.playerFileName));
  }

  private adjustIframeSize(): void {
    this.iFrameItemplayer?.setAttribute('height', String(this.iFrameHostElement.nativeElement.clientHeight));
  }

  private reload(): void {
    if (!this.currentUnitSequenceId || !this.currentUnit) {
      return;
    }
    this.open(this.currentUnitSequenceId);
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.iFrameItemplayer && this.iFrameHostElement) {
      this.adjustIframeSize();
    }
  }

  private getPlayerConfig(): VeronaPlayerConfig {
    if (!this.currentUnit) {
      throw new Error('Unit not loaded');
    }
    const groupToken = this.mds.getAuthData()?.groupToken;
    const resourceUri = this.mds.appConfig?.fileServiceUri ?? this.bs.backendUrl;
    const playerConfig: VeronaPlayerConfig = {
      enabledNavigationTargets: UnithostComponent.getEnabledNavigationTargets(
        this.currentUnitSequenceId,
        this.tcs.getSequenceBounds(),
        this.tcs.bookletConfig.allow_player_to_terminate_test
      ),
      logPolicy: this.tcs.bookletConfig.logPolicy,
      pagingMode: this.tcs.bookletConfig.pagingMode,
      unitNumber: this.currentUnitSequenceId,
      unitTitle: this.tcs.currentUnit.label,
      unitId: this.currentUnit.alias,
      directDownloadUrl: `${resourceUri}file/${groupToken}/ws_${this.tcs.workspaceId}/Resource`
    };
    if (this.pendingUnitData?.currentPage && (this.tcs.bookletConfig.restore_current_page_on_return === 'ON')) {
      playerConfig.startPage = this.pendingUnitData.currentPage;
    }
    return playerConfig;
  }

  private static getEnabledNavigationTargets(
    nr: number,
    bounds: [min: number, max: number],
    terminationAllowed: 'ON' | 'OFF' | 'LAST_UNIT' = 'ON'
  ): VeronaNavigationTarget[] {
    const navigationTargets: VeronaNavigationTarget[] = [];
    if (nr < bounds[1]) {
      navigationTargets.push('next');
    }
    if (nr > bounds[0]) {
      navigationTargets.push('previous');
    }
    if (nr !== bounds[0]) {
      navigationTargets.push('first');
    }
    if (nr !== bounds[1]) {
      navigationTargets.push('last');
    }
    if (terminationAllowed === 'ON') {
      navigationTargets.push('end');
    }
    if ((terminationAllowed === 'LAST_UNIT') && (nr === bounds[1])) {
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
    if (!this.currentUnit || (!this.currentUnit.parent.locked)) {
      throw new Error('Unit not loaded');
    }

    const requiredCode =
      (this.currentUnit.parent.locked.through.restrictions?.codeToEnter?.code || '').toUpperCase().trim();
    const givenCode = this.clearCode.toUpperCase().trim();

    if (requiredCode === givenCode) {
      this.tcs.clearTestlet(this.currentUnit.parent.locked.through.id);
      this.runUnit();
    } else {
      this.snackBar.open(
        `Freigabewort '${givenCode}' für '${this.currentUnit.parent.locked.through.label}' stimmt nicht.`,
        'OK',
        { duration: 3000 }
      );
      this.clearCode = '';
    }
  }

  onKeydownInClearCodeInput($event: KeyboardEvent): void {
    if ($event.key === 'Enter') {
      this.verifyCodes();
    }
  }
}
