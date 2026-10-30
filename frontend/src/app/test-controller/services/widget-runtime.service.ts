import { Injectable, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { combineLatest, merge, Subscription } from 'rxjs';
import { distinctUntilChanged, first, tap } from 'rxjs/operators';
import { CustomtextService, MainDataService, customTextDefaults } from '@shared/shared.module';
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
import { initialWidgetWidth } from '../util/initial-widget-width.util';
import { WIDGET_WINDOW_LIMITS } from '../components/widget-dialog/widget-window.constants';

export interface WidgetRequest {
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

export type WidgetCloseReason = 'widget_return' | 'user_called' | 'host_triggered';

interface ActiveWidgetDialog {
  ref: MatDialogRef<WidgetDialogComponent, WidgetCloseReason>;
  subscriptions: Subscription;
  restoreFocus: boolean;
}

export interface WidgetBehavior {
  colorScheme?: 'light' | 'dark';
  state?: string;
  onReady?: (sessionId: string) => void;
  onState: (state: string) => void;
  onStateChanged?: (state: string, timeStamp: number) => void;
  onClosing?: (reason: WidgetCloseReason, returnReceived: boolean) => void;
  onClosed?: (state: string) => void;
}

@Injectable()
export class WidgetRuntimeService implements OnDestroy {
  private readonly subscriptions = new Subscription();
  private readonly windowPositions = new Map<string, Pick<WidgetWindowBounds, 'left' | 'top'>>();
  private activeDialog: ActiveWidgetDialog | undefined;

  constructor(private readonly tcs: TestControllerService,
              private readonly mds: MainDataService,
              private readonly backend: BackendService,
              private readonly dialog: MatDialog,
              private readonly cts: CustomtextService,
              location: Location) {
    this.subscriptions.add(location.subscribe(() => this.close()));
    this.subscriptions.add(this.tcs.runReset$.subscribe(() => {
      this.close();
      this.windowPositions.clear();
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

  open(
    { call, source, playerIframe }: WidgetRequest,
    behaviorFor: (request: HostWidgetRequest) => WidgetBehavior | undefined = () => undefined
  ): void {
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
      this.showUnavailable(
        `Widget ${parsedCall.widgetType}`,
        this.cts.getCustomText('booklet_widgetUnavailable') ||
        customTextDefaults.booklet_widgetUnavailable.defaultvalue,
        playerIframe,
        () => playerIframe.contentWindow === playerWindow
      );
      return;
    }
    console.log('vopWidgetCall resolved:', resourcePath, call);
    const unitSequenceId = this.tcs.currentUnitSequenceId;
    const request: HostWidgetRequest = {
      resourcePath,
      model: parsedCall.widgetType,
      parameters: parsedCall.parameters,
      trigger: playerIframe,
      ...(parsedCall.state !== undefined ? { state: parsedCall.state } : {})
    };
    this.launch(request, behaviorFor(request), {
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

  openHost(request: HostWidgetRequest, behavior?: WidgetBehavior): void {
    if (this.isBusy()) return;
    this.launch(request, behavior);
  }

  isBusy(): boolean {
    return !!this.activeDialog || !!this.dialog.openDialogs.length;
  }

  showUnavailable(
    name: string, message: string, trigger: HTMLElement, canRestoreFocus: () => boolean = () => true
  ): void {
    if (this.isBusy()) return;
    this.openDialog(name, trigger, canRestoreFocus).ref.componentInstance.showUnavailable(message);
  }

  private launch(
    { resourcePath, model, parameters, trigger, state }: HostWidgetRequest,
    behavior: WidgetBehavior = { onState: () => {} },
    { canRestoreFocus = () => true, onReturn }: {
      canRestoreFocus?: () => boolean;
      onReturn?: (state: string | undefined, saveState: boolean, dialog: ActiveWidgetDialog) => void;
    } = {}
  ): void {
    let returnReceived = false;
    const positionKey = widgetModelCandidates(model)[0];
    const activeDialog = this.openDialog(`Widget ${model}`, trigger, canRestoreFocus, positionKey);
    let acceptedState: string | undefined;
    activeDialog.ref.beforeClosed().subscribe((reason) => {
      behavior.onClosing?.(reason ?? 'host_triggered', returnReceived);
    });
    activeDialog.ref.afterClosed().subscribe(() => {
      if (activeDialog.restoreFocus && acceptedState !== undefined) behavior.onClosed?.(acceptedState);
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
              state: state ?? behavior.state,
              onReady: (name, id) => {
                view.showRunning(name, initialWidgetWidth(model));
                behavior.onReady?.(id);
              },
              onState: (state) => {
                acceptedState = state;
                behavior.onState(state);
              },
              onStateChanged: behavior.onStateChanged,
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
          }, behavior.colorScheme);
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
    this.windowPositions.clear();
    this.subscriptions.unsubscribe();
  }

  private openDialog(
    name: string, trigger: HTMLElement, canRestoreFocus: () => boolean = () => true, positionKey?: string
  ): ActiveWidgetDialog {
    const unitSequenceId = this.tcs.currentUnitSequenceId;
    const savedPosition = positionKey === undefined ? undefined : this.windowPositions.get(positionKey);
    const ref = this.dialog.open<WidgetDialogComponent, WidgetDialogData, WidgetCloseReason>(WidgetDialogComponent, {
      data: { name },
      ariaModal: true,
      autoFocus: 'dialog',
      delayFocusTrap: false,
      restoreFocus: false,
      disableClose: true,
      // Close through the runtime on history changes, before CDK destroys the drag element.
      closeOnNavigation: false,
      width: WIDGET_WINDOW_LIMITS.maxWidth,
      height: WIDGET_WINDOW_LIMITS.maxHeight,
      position: savedPosition ? { left: `${savedPosition.left}px`, top: `${savedPosition.top}px` } : undefined,
      minWidth: 0,
      minHeight: 0,
      maxWidth: WIDGET_WINDOW_LIMITS.maxWidth,
      maxHeight: WIDGET_WINDOW_LIMITS.maxHeight,
      panelClass: 'widget-dialog',
      exitAnimationDuration: 0
    });
    const activeDialog: ActiveWidgetDialog = {
      ref, subscriptions: new Subscription(), restoreFocus: true
    };
    this.activeDialog = activeDialog;
    ref.beforeClosed().subscribe(() => {
      if (positionKey !== undefined) {
        const { left, top } = ref.componentInstance.windowBounds;
        this.windowPositions.set(positionKey, { left, top });
      }
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
