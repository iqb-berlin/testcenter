import { Injectable, OnDestroy, signal } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { combineLatest, merge, Subscription } from 'rxjs';
import { distinctUntilChanged, first, tap } from 'rxjs/operators';
import { MainDataService } from '@shared/shared.module';
import {
  WidgetDialogComponent, WidgetDialogData, WidgetWindowBounds
} from '../components/widget-dialog/widget-dialog.component';
import { WidgetSession } from '../classes/widget-session.class';
import { isLoadingFileLoaded } from '../interfaces/test-controller.interfaces';
import { WidgetCall, WidgetParameter } from '../interfaces/widget.interfaces';
import { BackendService } from './backend.service';
import { TestControllerService } from './test-controller.service';
import { parseWidgetCall, widgetParameters } from '../util/widget-start.util';
import { widgetModelCandidates } from '../util/widget-model.util';
import { CalculatorResult, calculatorFormula, calculatorResult } from '../util/calculator-result.util';

interface WidgetRequest {
  call: unknown;
  source: MessageEventSource | null;
  playerIframe: HTMLIFrameElement | null;
}

export interface HostWidgetRequest {
  resourcePath: string;
  model: string;
  parameters: WidgetParameter[];
  trigger: HTMLElement;
  state?: string;
}

export type CalculatorWidgetRequest = Pick<HostWidgetRequest, 'parameters' | 'trigger' | 'state'>;

type WidgetCloseReason = 'widget_return' | 'user_called' | 'host_triggered';

interface ActiveWidgetDialog {
  ref: MatDialogRef<WidgetDialogComponent, WidgetCloseReason>;
  subscriptions: Subscription;
  restoreFocus: boolean;
}

@Injectable()
export class WidgetService implements OnDestroy {
  private readonly subscriptions = new Subscription();
  private readonly states = new Map<string, string>();
  private readonly windowBounds = new Map<string, WidgetWindowBounds>();
  private activeDialog: ActiveWidgetDialog | undefined;
  private readonly lastCalculatorResult = signal<CalculatorResult | undefined>(undefined);
  readonly calculatorResult = this.lastCalculatorResult.asReadonly();

  dismissCalculatorResult(): void {
    this.lastCalculatorResult.set(undefined);
  }

  constructor(private readonly tcs: TestControllerService,
              private readonly mds: MainDataService,
              private readonly backend: BackendService,
              private readonly dialog: MatDialog) {
    this.subscriptions.add(this.tcs.runReset$.subscribe(() => {
      this.close();
      this.states.clear();
      this.windowBounds.clear();
      this.lastCalculatorResult.set(undefined);
    }));
    this.subscriptions.add(merge(
      this.tcs.currentUnitSequenceId$.pipe(distinctUntilChanged()),
      this.tcs.state$.pipe(distinctUntilChanged()),
      this.mds.authData$
    ).subscribe(() => this.close()));
    this.subscriptions.add(merge(
      this.tcs.currentUnitSequenceId$.pipe(distinctUntilChanged()),
      this.mds.authData$
    ).subscribe(() => this.dismissCalculatorResult()));
    this.subscriptions.add(this.dialog.afterOpened.subscribe((ref) => {
      if (ref !== this.activeDialog?.ref) this.close();
    }));
  }

  open({ call, source, playerIframe }: WidgetRequest): void {
    if (this.activeDialog || this.dialog.openDialogs.length) {
      console.warn('Widget call ignored while a dialog is active:', call);
      return;
    }
    const playerWindow = playerIframe?.contentWindow;
    if (!playerIframe || !playerWindow || playerWindow !== source) {
      console.warn('Invalid widget requester:', call);
      return;
    }
    let parsedCall: WidgetCall;
    try {
      parsedCall = parseWidgetCall(call);
    } catch (error) {
      console.error('Invalid widget call:', error);
      const activeDialog = this.openDialog('Widget', playerIframe, () => playerIframe.contentWindow === playerWindow);
      activeDialog.ref.componentInstance.showStartupError();
      return;
    }
    const resourcePath = this.tcs.getWidgetResourcePath(parsedCall.widgetType);
    if (resourcePath === undefined) {
      console.log('No uploaded widget found for vopWidgetCall:', call);
      return;
    }
    console.log('vopWidgetCall resolved:', resourcePath, call);
    const unitSequenceId = this.tcs.currentUnitSequenceId;
    this.launch({
      resourcePath,
      model: parsedCall.widgetType,
      parameters: parsedCall.parameters,
      trigger: playerIframe,
      ...(parsedCall.state !== undefined ? { state: parsedCall.state } : {})
    }, {
      canRestoreFocus: () => playerIframe.contentWindow === playerWindow,
      onReturn: (state, saveState, activeDialog) => {
        if (saveState && activeDialog.restoreFocus && playerIframe.isConnected &&
          playerIframe.contentWindow === playerWindow && this.tcs.currentUnitSequenceId === unitSequenceId) {
          playerWindow.postMessage({
            type: 'vopWidgetReturn', sessionId: parsedCall.sessionId,
            ...(parsedCall.callId !== undefined ? { callId: parsedCall.callId } : {}),
            ...(state !== undefined ? { state } : {})
          }, '*');
        }
      }
    });
  }

  openHost(request: HostWidgetRequest): void {
    if (this.activeDialog || this.dialog.openDialogs.length) return;
    this.launch(request);
  }

  openCalculator(request: CalculatorWidgetRequest): void {
    if (this.activeDialog || this.dialog.openDialogs.length) return;
    const resourcePath = this.tcs.getWidgetResourcePath('CALCULATOR');
    if (resourcePath === undefined) {
      this.openDialog('Taschenrechner', request.trigger).ref.componentInstance.showMissingCalculator();
      return;
    }
    this.launch({ ...request, resourcePath, model: 'CALCULATOR' }, {
      onClosed: (state) => {
        const result = calculatorResult(state);
        if (result) this.lastCalculatorResult.set(result);
      }
    });
  }

  private launch(
    { resourcePath, model, parameters, trigger, state }: HostWidgetRequest,
    { canRestoreFocus = () => true, onReturn, onClosed }: {
      canRestoreFocus?: () => boolean;
      onReturn?: (state: string | undefined, saveState: boolean, dialog: ActiveWidgetDialog) => void;
      onClosed?: (state: string) => void;
    } = {}
  ): void {
    const testId = this.tcs.testId;
    const stateKey = model === 'CALCULATOR' || model === 'CALC' ?
      JSON.stringify([resourcePath, this.tcs.currentUnitSequenceId]) :
      resourcePath;
    const logUnit = (model === 'CALCULATOR' || model === 'CALC') && this.tcs.testMode.saveResponses ?
      this.tcs.currentUnit :
      null;
    let sessionId: string | undefined;
    let returnReceived = false;
    const log = (key: string, content: Record<string, unknown> = {}, timeStamp = Date.now()): void => {
      if (!logUnit || sessionId === undefined) return;
      this.backend.addUnitLog(testId, logUnit.alias, logUnit.id, [{
        key, timeStamp, content: { sessionId, ...content }
      }]);
    };
    const boundsKey = widgetModelCandidates(model)[0];
    const activeDialog = this.openDialog(`Widget ${model}`, trigger, canRestoreFocus, boundsKey);
    let acceptedState: string | undefined;
    activeDialog.ref.beforeClosed().subscribe((reason) => {
      log('CALCULATOR_CLOSED', { reason: reason ?? 'host_triggered', returnReceived });
    });
    activeDialog.ref.afterClosed().subscribe(() => {
      if (activeDialog.restoreFocus && acceptedState !== undefined) onClosed?.(acceptedState);
    });
    const view = activeDialog.ref.componentInstance;
    activeDialog.subscriptions.add(combineLatest([
      this.backend.getResource(this.tcs.workspaceId, resourcePath).pipe(
        first(isLoadingFileLoaded),
        tap(file => console.log('Widget HTML downloaded:', { resourcePath, htmlLength: file.content.length }))
      ),
      activeDialog.ref.afterOpened()
    ]).pipe(first()).subscribe({
      next: ([file]) => {
        let session: WidgetSession | undefined;
        try {
          const sharedParameters = widgetParameters(this.tcs.sharedParameters);
          view.start(file.content, (widgetWindow) => {
            const widgetSession = new WidgetSession({
              model,
              parameters,
              window: widgetWindow,
              messages: this.mds.postMessage$,
              sharedParameters,
              state: state ?? this.states.get(stateKey),
              onReady: (name, id) => {
                view.showRunning(name);
                sessionId = id;
                log('CALCULATOR_OPENED');
              },
              onState: (state) => {
                acceptedState = state;
                this.states.set(stateKey, state);
              },
              onStateChanged: (state, timeStamp) => {
                if (!logUnit) return;
                const asLatex = calculatorFormula(state);
                if (asLatex !== undefined) {
                  log('CALCULATOR_STATE_CHANGED', { asLatex }, timeStamp);
                }
              },
              onSharedParameters: parameters => this.tcs.addSharedParameters(parameters),
              onReturn: (state, saveState) => {
                returnReceived = true;
                activeDialog.ref.close('widget_return');
                onReturn?.(state, saveState, activeDialog);
              },
              onError: (error) => {
                console.error('Widget startup failed:', resourcePath, error);
                view.showStartupError();
              }
            });
            session = widgetSession;
            activeDialog.subscriptions.add(() => widgetSession.close());
          }, model === 'CALCULATOR' || model === 'CALC' ? 'light' : undefined);
        } catch (error) {
          session?.close();
          console.error('Widget startup failed:', resourcePath, error);
          view.showStartupError();
        }
      },
      error: (error) => {
        console.error('Widget HTML download failed:', resourcePath, error);
        view.showDownloadError();
      }
    }));
  }

  close(): void {
    if (!this.activeDialog) return;
    this.activeDialog.restoreFocus = false;
    this.activeDialog.ref.close('host_triggered');
  }

  ngOnDestroy(): void {
    this.close();
    this.states.clear();
    this.windowBounds.clear();
    this.lastCalculatorResult.set(undefined);
    this.subscriptions.unsubscribe();
  }

  private openDialog(
    name: string, trigger: HTMLElement, canRestoreFocus: () => boolean = () => true, boundsKey?: string
  ): ActiveWidgetDialog {
    const unitSequenceId = this.tcs.currentUnitSequenceId;
    const bounds = boundsKey === undefined ? undefined : this.windowBounds.get(boundsKey);
    const width = bounds ? Math.min(bounds.width, window.innerWidth * 0.95) : undefined;
    const height = bounds ? Math.min(bounds.height, window.innerHeight * 0.95) : undefined;
    const position = bounds && width !== undefined && height !== undefined ?
      {
        left: `${Math.max(0, Math.min(bounds.left, window.innerWidth - width))}px`,
        top: `${Math.max(0, Math.min(bounds.top, window.innerHeight - height))}px`
      } :
      undefined;
    const ref = this.dialog.open<WidgetDialogComponent, WidgetDialogData, WidgetCloseReason>(WidgetDialogComponent, {
      data: { name },
      ariaModal: true,
      autoFocus: 'dialog',
      delayFocusTrap: false,
      restoreFocus: false,
      disableClose: true,
      width: width === undefined ? '95vw' : `${width}px`,
      height: height === undefined ? '95vh' : `${height}px`,
      position,
      maxWidth: '95vw',
      maxHeight: '95vh',
      panelClass: 'widget-dialog',
      exitAnimationDuration: 0
    });
    const activeDialog: ActiveWidgetDialog = {
      ref, subscriptions: new Subscription(), restoreFocus: true
    };
    this.activeDialog = activeDialog;
    ref.beforeClosed().subscribe(() => {
      if (boundsKey !== undefined) this.windowBounds.set(boundsKey, ref.componentInstance.windowBounds);
      activeDialog.subscriptions.unsubscribe();
    });
    ref.afterClosed().subscribe(() => {
      if (this.activeDialog === activeDialog) this.activeDialog = undefined;
      if (activeDialog.restoreFocus && trigger.isConnected && canRestoreFocus() &&
        this.tcs.currentUnitSequenceId === unitSequenceId && !this.dialog.openDialogs.length) {
        trigger.focus();
      }
    });
    return activeDialog;
  }
}
