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
  UnitStateKey,
  UnitPlayerState, LoadingProgress, UnitNavigationTarget
} from '../../interfaces/test-controller.interfaces';
import { BackendService } from '../../services/backend.service';
import { TestControllerService } from '../../services/test-controller.service';
import { MainDataService } from '../../../shared/shared.module';
import {
  Verona5ValidPages, Verona6ValidPages,
  VeronaNavigationDeniedReason, VeronaNavigationTarget, VeronaPlayerConfig, VeronaProgress
} from '../../interfaces/verona.interfaces';
import { Testlet, UnitWithContext } from '../../classes/test-controller.classes';
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

  pages: Verona5ValidPages = {};
  pageLabels: string[] = [];
  currentPageIndex: number = -1;

  unitsLoading$: BehaviorSubject<LoadingProgress[]> = new BehaviorSubject<LoadingProgress[]>([]);
  unitsToLoadLabels: string[] = [];

  currentUnit: UnitWithContext | null = null;
  unitNavigationTarget = UnitNavigationTarget;

  clearCodes: { [testletId: string]: string } = {};
  codeRequiringTestlets: Testlet[] = [];

  constructor(
    public tcs: TestControllerService,
    private mainDataService: MainDataService,
    private bs: BackendService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.iFrameItemplayer = null;
    this.leaveWarning = false;
    setTimeout(() => {
      this.subscriptions.postMessage = this.mainDataService.postMessage$
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
            unitDbKey: this.currentUnit.unitDef.alias,
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
        if (msgPlayerId === this.itemplayerSessionId) {
          if (msgData.playerState) {
            const { playerState } = msgData;

            this.readPages(playerState.validPages);
            this.currentPageIndex = Object.keys(this.pages).indexOf(playerState.currentPage);

            if (typeof playerState.currentPage !== 'undefined') {
              const pageId = playerState.currentPage;
              const pageNr = Object.keys(this.pages)[pageId] + 1; // only for humans to read in the logs
              const pageCount = Object.keys(this.pages).length;
              if (Object.keys(this.pages).length > 1 && this.pages[playerState.currentPage]) {
                this.tcs.updateUnitState(
                  this.currentUnitSequenceId,
                  {
                    unitDbKey: this.currentUnit.unitDef.alias,
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
          const unitDbKey = this.currentUnit.unitDef.alias;
          if (msgData.unitState) {
            const { unitState } = msgData;
            const timeStamp = Date.now();

            this.tcs.updateUnitState(
              this.currentUnitSequenceId,
              {
                unitDbKey,
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
                unitDbKey,
                this.currentUnitSequenceId,
                unitState.dataParts,
                unitState.unitStateDataType
              );
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
        // eslint-disable-next-line no-console
        console.log(`processMessagePost ignored message: ${msgType}`);
        break;
    }
  }

  private readPages(validPages: Verona5ValidPages | Verona6ValidPages): void {
    this.pages = { };
    if (!Array.isArray(validPages)) {
      // Verona 2-5
      this.pages = validPages;
    } else {
      // Verona > 6
      validPages
        .forEach((page, index) => {
          // there are some versions of aspect who send a corrupted format without page.id
          this.pages[String(page.id ?? index)] = page.label ?? String(index + 1);
        });
    }
    this.pageLabels = Object.values(this.pages);
  }

  private open(currentUnitSequenceId: number): void {
    if (!this.tcs.rootTestlet) {
      throw new Error('Booklet not loaded');
    }
    this.currentUnitSequenceId = currentUnitSequenceId;
    this.tcs.currentUnitSequenceId = this.currentUnitSequenceId;

    while (this.iFrameHostElement.nativeElement.hasChildNodes()) {
      this.iFrameHostElement.nativeElement.removeChild(this.iFrameHostElement.nativeElement.lastChild);
    }

    this.currentPageIndex = -1;
    this.pages = { };
    this.pageLabels = [];

    this.currentUnit = this.tcs.getUnitWithContext(this.currentUnitSequenceId);

    this.mainDataService.appSubTitle$.next(this.currentUnit.unitDef.title);

    if (this.subscriptions.loading) {
      this.subscriptions.loading.unsubscribe();
    }

    const unitsToLoadIds = this.currentUnit.maxTimerRequiringTestlet ?
      this.tcs.rootTestlet.getAllUnitSequenceIds(this.currentUnit.maxTimerRequiringTestlet.id) :
      [currentUnitSequenceId];

    const unitsToLoad = unitsToLoadIds
      .map(unitSequenceId => this.tcs.getUnitLoadProgress$(unitSequenceId));

    this.unitsToLoadLabels = unitsToLoadIds
      .map(unitSequenceId => this.tcs.getUnitWithContext(unitSequenceId).unitDef.title);

    this.subscriptions.loading = combineLatest<LoadingProgress[]>(unitsToLoad)
      .subscribe({
        next: value => {
          this.unitsLoading$.next(value);
        },
        error: err => {
          this.mainDataService.appError = new AppError({
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
    this.tcs.currentUnitDbKey = this.currentUnit.unitDef.alias;
    this.tcs.currentUnitTitle = this.currentUnit.unitDef.title;

    if (this.tcs.testMode.saveResponses) {
      this.bs.updateTestState(this.tcs.testId, [{
        key: TestStateKey.CURRENT_UNIT_ID, timeStamp: Date.now(), content: this.currentUnit.unitDef.alias
      }]);
      this.tcs.updateUnitState(
        this.currentUnitSequenceId,
        {
          unitDbKey: this.currentUnit.unitDef.alias,
          state: [{ key: UnitStateKey.PLAYER, timeStamp: Date.now(), content: UnitPlayerState.LOADING }]
        }
      );
    }

    if (this.tcs.testMode.presetCode) {
      this.currentUnit.codeRequiringTestlets
        .forEach(testlet => { this.clearCodes[testlet.id] = testlet.codeToEnter; });
    }

    this.runUnit();
  }

  private runUnit(): void {
    if (!this.currentUnit) {
      throw new Error('Unit not loaded');
    }
    this.codeRequiringTestlets = this.tcs.getUnclearedTestlets(this.currentUnit);

    if (this.codeRequiringTestlets.length) {
      return;
    }

    if (this.currentUnit.unitDef.lockedByTime) {
      return;
    }

    this.startTimerIfNecessary();

    this.itemplayerSessionId = Math.floor(Math.random() * 20000000 + 10000000).toString();

    this.pendingUnitData = {
      playerId: this.itemplayerSessionId,
      unitDefinition: this.tcs.getUnitDefinition(this.currentUnitSequenceId),
      currentPage: this.tcs.getUnitStateCurrentPage(this.currentUnitSequenceId),
      unitDefinitionType: this.fileNameToId(this.tcs.getUnitDefinitionType(this.currentUnitSequenceId)),
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

  // eslint-disable-next-line class-methods-use-this
  private fileNameToId(fileName: string): string {
    // TODO get a secured ID info from the backend instead
    return (fileName?.split('/').pop() ?? '').replace(/\.[Hh][Tt][Mm][Ll]/, '');
  }

  private startTimerIfNecessary(): void {
    if (!this.currentUnit?.maxTimerRequiringTestlet) {
      return;
    }
    if (this.tcs.currentMaxTimerTestletId &&
      (this.currentUnit.maxTimerRequiringTestlet.id === this.tcs.currentMaxTimerTestletId)
    ) {
      return;
    }
    this.tcs.startMaxTimer(this.currentUnit.maxTimerRequiringTestlet);
  }

  private prepareIframe(): void {
    if (!this.currentUnit) {
      return;
    }
    this.iFrameItemplayer = <HTMLIFrameElement>document.createElement('iframe');
    if (!('srcdoc' in this.iFrameItemplayer)) {
      this.mainDataService.appError = new AppError({
        label: 'Veralteter Browser',
        description: 'Ihr browser is veraltet oder inkompatibel mit dieser Anwendung!',
        type: 'general'
      });
      return;
    }
    this.iFrameItemplayer.setAttribute('class', 'unitHost');
    this.adjustIframeSize();
    this.iFrameHostElement.nativeElement.appendChild(this.iFrameItemplayer);
    this.iFrameItemplayer.setAttribute('srcdoc', this.tcs.getPlayer(this.currentUnit.unitDef.playerFileName));
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
    const groupToken = this.mainDataService.getAuthData()?.groupToken;
    const resourceUri = this.mainDataService.appConfig?.fileServiceUri ?? this.bs.backendUrl;
    const playerConfig: VeronaPlayerConfig = {
      enabledNavigationTargets: UnithostComponent.getEnabledNavigationTargets(
        this.currentUnitSequenceId,
        1,
        this.tcs.allUnitIds.length,
        this.tcs.bookletConfig.allow_player_to_terminate_test
      ),
      logPolicy: this.tcs.bookletConfig.logPolicy,
      pagingMode: this.tcs.bookletConfig.pagingMode,
      unitNumber: this.currentUnitSequenceId,
      unitTitle: this.tcs.currentUnitTitle,
      unitId: this.currentUnit.unitDef.alias,
      stateReportPolicy: 'eager', // for pre-verona-4-players which does not report by default
      directDownloadUrl: `${resourceUri}file/${groupToken}/ws_${this.tcs.workspaceId}/Resource`
    };
    if (this.pendingUnitData?.currentPage && (this.tcs.bookletConfig.restore_current_page_on_return === 'ON')) {
      playerConfig.startPage = this.pendingUnitData.currentPage;
    }
    return playerConfig;
  }

  private static getEnabledNavigationTargets(
    nr: number,
    min: number,
    max: number,
    terminationAllowed: 'ON' | 'OFF' | 'LAST_UNIT' = 'ON'
  ): VeronaNavigationTarget[] {
    const navigationTargets: VeronaNavigationTarget[] = [];
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

  gotoNextPage(): void {
    this.gotoPage(this.currentPageIndex + 1);
  }

  gotoPreviousPage(): void {
    this.gotoPage(this.currentPageIndex - 1);
  }

  gotoPage(targetPageIndex: number): void {
    this.postMessageTarget?.postMessage({
      type: 'vopPageNavigationCommand',
      sessionId: this.itemplayerSessionId,
      target: Object.keys(this.pages)[targetPageIndex]
    }, '*');
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
    if (!this.currentUnit) {
      throw new Error('Unit not loaded');
    }
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
