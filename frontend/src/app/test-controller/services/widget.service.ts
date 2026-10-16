import { Injectable, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { combineLatest, merge, Subscription } from 'rxjs';
import { distinctUntilChanged, first, tap } from 'rxjs/operators';
import { MainDataService } from '@shared/shared.module';
import { WidgetDialogComponent, WidgetDialogData } from '../components/widget-dialog/widget-dialog.component';
import { WidgetSession } from '../classes/widget-session.class';
import { isLoadingFileLoaded } from '../interfaces/test-controller.interfaces';
import { WidgetCall, WidgetParameter } from '../interfaces/widget.interfaces';
import { BackendService } from './backend.service';
import { TestControllerService } from './test-controller.service';
import { parseWidgetCall, widgetParameters } from '../util/widget-start.util';

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

interface ActiveWidgetDialog {
  ref: MatDialogRef<WidgetDialogComponent>;
  subscriptions: Subscription;
  restoreFocus: boolean;
}

@Injectable()
export class WidgetService implements OnDestroy {
  private readonly subscriptions = new Subscription();
  private readonly states = new Map<string, string>();
  private activeDialog: ActiveWidgetDialog | undefined;

  constructor(private readonly tcs: TestControllerService,
              private readonly mds: MainDataService,
              private readonly backend: BackendService,
              private readonly dialog: MatDialog) {
    this.subscriptions.add(this.tcs.runReset$.subscribe(() => {
      this.close();
      this.states.clear();
    }));
    this.subscriptions.add(merge(
      this.tcs.currentUnitSequenceId$.pipe(distinctUntilChanged()),
      this.tcs.state$.pipe(distinctUntilChanged()),
      this.mds.authData$
    ).subscribe(() => this.close()));
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
    }, () => playerIframe.contentWindow === playerWindow, (state, saveState, activeDialog) => {
      if (saveState && activeDialog.restoreFocus && playerIframe.isConnected &&
        playerIframe.contentWindow === playerWindow && this.tcs.currentUnitSequenceId === unitSequenceId) {
        playerWindow.postMessage({
          type: 'vopWidgetReturn', sessionId: parsedCall.sessionId,
          ...(parsedCall.callId !== undefined ? { callId: parsedCall.callId } : {}),
          ...(state !== undefined ? { state } : {})
        }, '*');
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
    this.openHost({ ...request, resourcePath, model: 'CALCULATOR' });
  }

  private launch(
    { resourcePath, model, parameters, trigger, state }: HostWidgetRequest,
    canRestoreFocus: () => boolean = () => true,
    onReturn?: (state: string | undefined, saveState: boolean, dialog: ActiveWidgetDialog) => void
  ): void {
    const activeDialog = this.openDialog(`Widget ${model}`, trigger, canRestoreFocus);
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
              state: state ?? this.states.get(resourcePath),
              onReady: name => view.showRunning(name),
              onState: state => this.states.set(resourcePath, state),
              onSharedParameters: parameters => this.tcs.addSharedParameters(parameters),
              onReturn: (state, saveState) => {
                activeDialog.ref.close();
                onReturn?.(state, saveState, activeDialog);
              },
              onError: (error) => {
                console.error('Widget startup failed:', resourcePath, error);
                view.showStartupError();
              }
            });
            session = widgetSession;
            activeDialog.subscriptions.add(() => widgetSession.close());
          });
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
    this.activeDialog.ref.close();
  }

  ngOnDestroy(): void {
    this.close();
    this.states.clear();
    this.subscriptions.unsubscribe();
  }

  private openDialog(
    name: string, trigger: HTMLElement, canRestoreFocus: () => boolean = () => true
  ): ActiveWidgetDialog {
    const unitSequenceId = this.tcs.currentUnitSequenceId;
    const ref = this.dialog.open<WidgetDialogComponent, WidgetDialogData>(WidgetDialogComponent, {
      data: { name },
      ariaModal: true,
      autoFocus: 'dialog',
      delayFocusTrap: false,
      restoreFocus: false,
      disableClose: true,
      width: '95vw',
      height: '95vh',
      maxWidth: '95vw',
      maxHeight: '95vh',
      panelClass: 'widget-dialog',
      exitAnimationDuration: 0
    });
    const activeDialog = { ref, subscriptions: new Subscription(), restoreFocus: true };
    this.activeDialog = activeDialog;
    ref.beforeClosed().subscribe(() => activeDialog.subscriptions.unsubscribe());
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
