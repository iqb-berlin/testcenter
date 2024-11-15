import {
  BehaviorSubject, combineLatest, merge, Subscription
} from 'rxjs';
import {
  Component, HostListener, OnInit, OnDestroy, ViewChild, ElementRef
} from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  Testlet, LoadingProgress, isUnit, NavigationState, isEqualNavigation
} from '../../interfaces/test-controller.interfaces';
import { BackendService } from '../../services/backend.service';
import { TestControllerService } from '../../services/test-controller.service';
import { MainDataService } from '../../../shared/shared.module';
import {
  isVeronaNavigationTarget,
  Verona5ValidPages,
  Verona6ValidPages,
  VeronaNavigationDeniedReason,
  VeronaPlayerConfig,
  VeronaPlayerRuntimeErrorCodes, VeronaUnitState, VopStartCommand
} from '../../interfaces/verona.interfaces';
import { AppError } from '../../../app.interfaces';
import { distinctUntilChanged } from 'rxjs/operators';

@Component({
  templateUrl: './unithost.component.html',
  styleUrls: ['./unithost.component.css']
})

export class UnithostComponent implements OnInit, OnDestroy {
  @ViewChild('iframeHost') private iFrameHostElement!: ElementRef;
  private iFrameItemplayer: HTMLIFrameElement | null = null;
  private subscriptions: { [tag: string ]: Subscription } = {};
  leaveWarning = false;

  private playerSessionId = '';
  private postMessageTarget: Window = window;

  resourcesLoading$: BehaviorSubject<LoadingProgress[]> = new BehaviorSubject<LoadingProgress[]>([]);
  resourcesToLoadLabels: string[] = [];

  pages: { [id: string]: string } = {};
  pageLabels: string[] = [];
  currentPageIndex: number = -1;

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
      this.subscriptions.navigationDenial = this.tcs.navigationDenial$
        .subscribe(navigationDenial => this.handleNavigationDenial(navigationDenial));
      this.subscriptions.conditionsEvaluated = this.tcs.navigation$
        .pipe(distinctUntilChanged(isEqualNavigation))
        .subscribe(navigationState => this.updatePlayerConfig(navigationState));
    });
  }

  ngOnDestroy(): void {
    Object.values(this.subscriptions).forEach(subscription => subscription.unsubscribe());
  }

  private async handleIncomingMessage(messageEvent: MessageEvent): Promise<void> {
    if (!this.tcs.currentUnit) {
      return;
    }
    const msgData = messageEvent.data;
    const msgType = msgData.type;
    let msgSessionId = msgData.sessionId;
    if ((msgSessionId === undefined) || (msgSessionId === null)) {
      msgSessionId = this.playerSessionId;
    }
    this.postMessageTarget = messageEvent.source as Window;
    if (msgData.sessionId && (msgSessionId !== this.playerSessionId)) {
      // eslint-disable-next-line no-console
      console.warn('wrong player session id: ', msgData.sessionId, msgData);
      return;
    }

    switch (msgType) {
      case 'vopReadyNotification':
        await this.handleReadyNotification(msgData);
        break;

      case 'vopStateChangedNotification':
        this.handleStateChangedNotification(msgData);
        break;

      case 'vopUnitNavigationRequestedNotification':
        this.handleUnitNavigationRequestedNotification(msgData);
        break;

      case 'vopWindowFocusChangedNotification':
        this.handleWindowFocusChangedNotification(msgData);
        break;

      case 'vopRuntimeErrorNotification':
        this.handleRuntimeError(msgData.code, msgData.message);
        if (this.tcs.testMode.saveResponses) {
          this.bs.addUnitLog(
            this.tcs.testId,
            this.tcs.currentUnit.alias,
            this.tcs.currentUnit.id,
            [
              {
                key: `Runtime Error: ${msgData.code}`,
                content: msgData.message || '',
                timeStamp: Date.now()
              }
            ]
          );
        }
        break;

      default:
        // eslint-disable-next-line no-console
        console.log(`processMessagePost ignored message: ${msgType}`);
        break;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleReadyNotification(msgData: any): Promise<void> {
    // eslint-disable-next-line no-case-declarations
    const playerApiVersion = msgData.apiVersion || msgData.metadata.specVersion;
    // eslint-disable-next-line no-case-declarations
    const playerApiVersionMajor = parseInt(playerApiVersion.split('.').shift() ?? '', 10);

    if (
      this.mds.appConfig && (
        playerApiVersionMajor < this.mds.appConfig.veronaPlayerApiVersionMin ||
        playerApiVersionMajor > this.mds.appConfig.veronaPlayerApiVersionMax
      )
    ) {
      throw new AppError({
        description: `Player uses Verona ${playerApiVersion}, but this testcenter only support 
              ${this.mds.appConfig.veronaPlayerApiVersionMin} to ${this.mds.appConfig.veronaPlayerApiVersionMax}`,
        label: 'Unpassende Verona-Version',
        type: 'verona_player_runtime_error'
      });
    }

    this.tcs.updateUnitState([{ key: 'PLAYER', timeStamp: Date.now(), content: 'RUNNING' }]);

    if (!this.tcs.currentUnit) {
      throw new Error(`Could not start player, because Unit is missing (${this.tcs.currentUnitSequenceId})!`);
    }

    const unitState: VeronaUnitState = {
      dataParts: this.tcs.currentUnit.dataParts
    };

    if (this.tcs.currentUnit.state.PRESENTATION_PROGRESS) {
      unitState.presentationProgress = this.tcs.currentUnit.state.PRESENTATION_PROGRESS;
    }
    if (this.tcs.currentUnit.state.RESPONSE_PROGRESS) {
      unitState.responseProgress = this.tcs.currentUnit.state.RESPONSE_PROGRESS;
    }

    const navigation = await this.tcs.closeBuffer('handleReadyNotification');

    const msg: VopStartCommand = {
      type: 'vopStartCommand',
      sessionId: this.playerSessionId,
      unitDefinition: this.tcs.currentUnit.definition,
      unitDefinitionType: this.tcs.currentUnit.unitDefinitionType,
      unitState,
      playerConfig: this.getPlayerConfig(navigation)
    };
    this.postMessageTarget.postMessage(msg, '*');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleStateChangedNotification(msgData: any): void {
    if (msgData.playerState) {
      const { playerState } = msgData;

      this.readPages(playerState.validPages);
      this.currentPageIndex = Object.keys(this.pages).indexOf(playerState.currentPage);
      if (this.tcs.currentUnit) this.tcs.currentUnit.pageLabels = this.pages;

      if (typeof playerState.currentPage !== 'undefined') {
        const pageId: string = String(playerState.currentPage);
        const pageNr = Object.keys(this.pages).indexOf(pageId) + 1; // human-readable in logs & group monitor
        const pageCount = Object.keys(this.pages).length;
        if (Object.keys(this.pages).length > 1 && this.pages[playerState.currentPage]) {
          this.tcs.updateUnitState([
            { key: 'CURRENT_PAGE_NR', timeStamp: Date.now(), content: pageNr.toString() },
            { key: 'CURRENT_PAGE_ID', timeStamp: Date.now(), content: pageId },
            { key: 'PAGE_COUNT', timeStamp: Date.now(), content: pageCount.toString() }
          ]);
        }
      }
    }
    if (msgData.unitState) {
      const { unitState } = msgData;
      const timeStamp = Date.now();

      this.tcs.updateUnitState([
        { key: 'PRESENTATION_PROGRESS', timeStamp, content: unitState.presentationProgress },
        { key: 'RESPONSE_PROGRESS', timeStamp, content: unitState.responseProgress }
      ]);

      if (unitState?.dataParts) {
        // in pre-verona4-times it was not entirely clear if the stringification of the dataParts should be made
        // by the player itself ot the host. To maintain backwards-compatibility we check this here.
        Object.keys(unitState.dataParts)
          .forEach(dataPartId => {
            if (typeof unitState.dataParts[dataPartId] !== 'string') {
              unitState.dataParts[dataPartId] = JSON.stringify(unitState.dataParts[dataPartId]);
            }
          });
        this.tcs.updateUnitStateDataParts(unitState.dataParts, unitState.unitStateDataType);
      }
    }
    if (msgData.log && this.tcs.currentUnit) {
      this.bs.addUnitLog(this.tcs.testId, this.tcs.currentUnit.alias, this.tcs.currentUnit.id, msgData.log);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleUnitNavigationRequestedNotification(msgData: any): void {
    // support Verona2 and Verona3 version
    const target = msgData.target ? `#${msgData.target}` : msgData.targetRelative;
    this.tcs.setUnitNavigationRequest(target);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleWindowFocusChangedNotification(msgData: any): void {
    if (msgData.hasFocus) {
      this.tcs.windowFocusState$.next('PLAYER');
    } else if (document.hasFocus()) {
      this.tcs.windowFocusState$.next('HOST');
    } else {
      this.tcs.windowFocusState$.next('UNKNOWN');
    }
  }

  private readPages(validPages: Verona5ValidPages | Verona6ValidPages): void {
    this.pages = { };
    if (!Array.isArray(validPages)) {
      // Verona 2-5
      this.pages = validPages;
    } else {
      // Verona > 6
      // covers also some versions of aspect who send a corrupted format
      validPages
        .forEach((page, index) => {
          this.pages[String(page.id ?? index)] = page.label ?? String(index + 1);
        });
    }
    this.pageLabels = Object.values(this.pages);
  }

  // eslint-disable-next-line class-methods-use-this
  private handleRuntimeError(code?: string, message?: string): void {
    // possible reactions on runtimeErrors
    const reactions: { [key: string]: (code: string, message: string) => void } = {
      raiseError: (errorCode, errorMessage) => {
        throw new AppError({
          label: 'Fehler beim Abspielen der Aufgabe',
          description: errorMessage,
          type: 'verona_player_runtime_error',
          code: VeronaPlayerRuntimeErrorCodes.indexOf(errorCode)
        });
      }
    };
    const runTimeErrorReactionMap:
    { [code in typeof VeronaPlayerRuntimeErrorCodes[number]] : keyof typeof reactions } = {
      'session-id-missing': 'raiseError',
      'unit-definition-missing': 'raiseError',
      'wrong-session-id': 'raiseError',
      'unit-definition-type-unsupported': 'raiseError',
      'unit-state-type-unsupported': 'raiseError',
      'runtime-error': 'raiseError'
    };
    reactions[runTimeErrorReactionMap[code || 'runtime-error'] || 'raiseError'](code || '', message || '');
  }

  private open(unitSequenceId: number): void {
    this.tcs.currentUnitSequenceId = unitSequenceId;
    if (!this.tcs.currentUnit) {
      throw new Error(`No such unit: ${unitSequenceId}`);
    }

    while (this.iFrameHostElement.nativeElement.hasChildNodes()) {
      this.iFrameHostElement.nativeElement.removeChild(this.iFrameHostElement.nativeElement.lastChild);
    }

    this.currentPageIndex = -1;
    this.pages = {};
    this.pageLabels = [];

    this.mds.appSubTitle$.next(this.tcs.currentUnit.label);

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
    if (this.tcs.currentUnit.parent) {
      addChildren(this.tcs.currentUnit.parent);
    } else {
      unitsToLoadIds = [this.tcs.currentUnitSequenceId];
    }

    // STAND: statt getUnit this.tcs.units[sequenceId] - warum geht das überhaupt?
    const resourcesToLoad = unitsToLoadIds
      .flatMap(sequenceId => Object.values(this.tcs.getUnit(sequenceId).loadingProgress));

    this.resourcesToLoadLabels = unitsToLoadIds
      .flatMap(sequenceId => Object.keys(this.tcs.getUnit(sequenceId).loadingProgress)
        .map(key => `${this.tcs.getUnit(sequenceId).label} (${key})`)
      );

    this.subscriptions.loading = combineLatest<LoadingProgress[]>(resourcesToLoad)
      .subscribe({
        next: value => {
          this.resourcesLoading$.next(value);
        },
        error: err => {
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
    if (!this.tcs.currentUnit) {
      throw new Error('Unit not loaded');
    }
    this.resourcesLoading$.next([]);

    this.tcs.setTestState('CURRENT_UNIT_ID', this.tcs.currentUnit.alias);
    this.tcs.updateUnitState([{ key: 'PLAYER', timeStamp: Date.now(), content: 'LOADING' }]);

    if (this.tcs.testMode.presetCode) {
      this.clearCode = this.tcs.currentUnit.parent.restrictions.codeToEnter?.code || '';
    }

    this.runUnit();
  }

  private runUnit(): void {
    if (this.tcs.currentUnit && this.tcs.currentUnit.parent.locked) {
      return;
    }

    this.startTimerIfNecessary();
    this.playerSessionId = Math.floor(Math.random() * 20000000 + 10000000).toString();
    this.leaveWarning = false;
    this.prepareIframe();
    this.tcs.updateNavigationState();
  }

  private startTimerIfNecessary(): void {
    if (!this.tcs.currentUnit?.parent.timerId) {
      return;
    }
    if (this.tcs.currentTimerId &&
      (this.tcs.currentUnit.parent.timerId === this.tcs.currentTimerId)
    ) {
      return;
    }
    this.tcs.startTimer(this.tcs.testlets[this.tcs.currentUnit.parent.timerId]);
  }

  private prepareIframe(): void {
    if (!this.tcs.currentUnit) {
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
    this.iFrameItemplayer.setAttribute('srcdoc', this.tcs.getPlayer(this.tcs.currentUnit.playerFileName));
  }

  private adjustIframeSize(): void {
    this.iFrameItemplayer?.setAttribute('height', String(this.iFrameHostElement.nativeElement.clientHeight));
  }

  private reload(): void {
    if (!this.tcs.currentUnitSequenceId || !this.tcs.currentUnit) {
      return;
    }
    this.open(this.tcs.currentUnitSequenceId);
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.iFrameItemplayer && this.iFrameHostElement) {
      this.adjustIframeSize();
    }
  }

  private getPlayerConfig(navigationState: NavigationState): VeronaPlayerConfig {
    if (!this.tcs.currentUnit) throw new Error('Unit not loaded');
    if (!this.tcs.booklet) throw new Error('Booklet not loaded');
    const groupToken = this.mds.getAuthData()?.groupToken;
    const resourceUri = this.mds.appConfig?.fileServiceUri ?? this.bs.backendUrl;
    const playerConfig: VeronaPlayerConfig = {
      enabledNavigationTargets: Object.keys(navigationState.targets)
        .filter(isVeronaNavigationTarget)
        .filter(t => !!navigationState.targets[t])
        .filter(t => navigationState.targets[t] !== this.tcs.currentUnitSequenceId),
      logPolicy: this.tcs.booklet.config.logPolicy,
      pagingMode: this.tcs.booklet.config.pagingMode,
      unitNumber: this.tcs.currentUnitSequenceId,
      unitTitle: this.tcs.currentUnit.label,
      unitId: this.tcs.currentUnit.alias,
      stateReportPolicy: 'eager', // for pre-verona-4-players which does not report by default
      directDownloadUrl: `${resourceUri}file/${groupToken}/ws_${this.tcs.workspaceId}/Resource`
    };
    if (
      this.tcs.currentUnit.state.CURRENT_PAGE_ID &&
      (this.tcs.booklet.config.restore_current_page_on_return === 'ON')
    ) {
      playerConfig.startPage = this.tcs.currentUnit.state.CURRENT_PAGE_ID;
    }
    return playerConfig;
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
      sessionId: this.playerSessionId,
      target: Object.keys(this.pages)[targetPageIndex]
    }, '*');
  }

  private handleNavigationDenial(
    navigationDenial: { sourceUnitSequenceId: number; reason: VeronaNavigationDeniedReason[] }
  ): void {
    if (navigationDenial.sourceUnitSequenceId !== this.tcs.currentUnitSequenceId) {
      return;
    }

    this.postMessageTarget.postMessage({
      type: 'vopNavigationDeniedNotification',
      sessionId: this.playerSessionId,
      reason: navigationDenial.reason
    }, '*');
  }

  verifyCodes(): void {
    if (!this.tcs.currentUnit || (!this.tcs.currentUnit.parent.locked)) {
      throw new Error('Unit not loaded');
    }

    const requiredCode =
      (this.tcs.currentUnit.parent.locked.through.restrictions?.codeToEnter?.code || '').toUpperCase().trim();
    const givenCode = this.clearCode.toUpperCase().trim();

    if (requiredCode === givenCode) {
      this.tcs.clearTestlet(this.tcs.currentUnit.parent.locked.through.id);
      this.runUnit();
    } else {
      this.snackBar.open(
        `Freigabewort '${givenCode}' für '${this.tcs.currentUnit.parent.locked.through.label}' stimmt nicht.`,
        'OK',
        { duration: 3000 }
      );
    }
    this.clearCode = '';
  }

  onKeydownInClearCodeInput($event: KeyboardEvent): void {
    if ($event.key === 'Enter') {
      this.verifyCodes();
    }
  }

  private updatePlayerConfig(navigationState: NavigationState): void {
    if (!this.playerSessionId) {
      return;
    }
    this.postMessageTarget.postMessage({
      type: 'vopPlayerConfigChangedNotification',
      sessionId: this.playerSessionId,
      playerConfig: this.getPlayerConfig(navigationState)
    }, '*');
  }
}
