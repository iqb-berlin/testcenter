import { Injectable, OnDestroy, signal } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { combineLatest, merge, Subscription, timer } from 'rxjs';
import { distinctUntilChanged, first, tap } from 'rxjs/operators';
import { MainDataService } from '@shared/shared.module';
import {
  WidgetDialogComponent, WidgetDialogData, WidgetDialogStatus
} from '../components/widget-dialog/widget-dialog.component';
import { isLoadingFileLoaded } from '../interfaces/test-controller.interfaces';
import { BackendService } from './backend.service';
import { TestControllerService } from './test-controller.service';
import { widgetName, widgetParameters, WidgetStartCommand } from '../util/widget-start.util';
import { widgetEvent } from '../util/widget-event.util';

interface WidgetRequest {
  call: unknown;
  source: MessageEventSource | null;
  playerIframe: HTMLIFrameElement | null;
}

@Injectable()
export class WidgetService implements OnDestroy {
  private readonly subscriptions = new Subscription();
  private activeDialog: {
    ref: MatDialogRef<WidgetDialogComponent>;
    download: Subscription;
    restoreFocus: boolean;
  } | undefined;

  constructor(private readonly tcs: TestControllerService,
              private readonly mds: MainDataService,
              private readonly backend: BackendService,
              private readonly dialog: MatDialog) {
    this.subscriptions.add(merge(
      this.tcs.currentUnitSequenceId$.pipe(distinctUntilChanged()),
      this.tcs.state$.pipe(distinctUntilChanged()),
      this.mds.authData$
    ).subscribe(() => this.close()));
    this.subscriptions.add(this.dialog.afterOpened.subscribe(ref => {
      if (ref !== this.activeDialog?.ref) this.close();
    }));
  }

  open({ call, source, playerIframe }: WidgetRequest): void {
    if (this.activeDialog || this.dialog.openDialogs.length) {
      console.warn('Widget call ignored while a dialog is active:', call);
      return;
    }
    const widgetType = call !== null && typeof call === 'object' && 'widgetType' in call ?
      call.widgetType : undefined;
    const resourcePath = typeof widgetType === 'string' ? this.tcs.getWidgetResourcePath(widgetType) : undefined;
    if (resourcePath === undefined) {
      console.log('No uploaded widget found for vopWidgetCall:', call);
      return;
    }
    console.log('vopWidgetCall resolved:', resourcePath, call);
    const unitSequenceId = this.tcs.currentUnitSequenceId;
    const status = signal<WidgetDialogStatus>('loading');
    const ref = this.dialog.open<WidgetDialogComponent, WidgetDialogData>(WidgetDialogComponent, {
      data: { status: status.asReadonly() },
      ariaLabel: `Widget ${typeof widgetType === 'string' ? widgetType : resourcePath}`,
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
    const activeDialog = { ref, download: new Subscription(), restoreFocus: true };
    this.activeDialog = activeDialog;
    ref.beforeClosed().subscribe(() => activeDialog.download.unsubscribe());
    ref.afterClosed().subscribe(() => {
      if (this.activeDialog === activeDialog) this.activeDialog = undefined;
      if (activeDialog.restoreFocus && playerIframe?.isConnected && playerIframe.contentWindow === source &&
          this.tcs.currentUnitSequenceId === unitSequenceId && !this.dialog.openDialogs.length) {
        playerIframe.focus();
      }
    });
    activeDialog.download.add(combineLatest([
      this.backend.getResource(this.tcs.workspaceId, resourcePath).pipe(
        first(isLoadingFileLoaded),
        tap(file => console.log('Widget HTML downloaded:', { resourcePath, htmlLength: file.content.length }))
      ),
      ref.afterOpened()
    ]).pipe(first()).subscribe({
        next: ([file]) => {
          let iframe: HTMLIFrameElement | undefined;
          const startup = new Subscription();
          activeDialog.download.add(startup);
          const fail = (error: unknown): void => {
            console.error('Widget startup failed:', resourcePath, error);
            startup.unsubscribe();
            iframe?.remove();
            status.set('startup-error');
          };
          try {
            const parameters = widgetParameters(
              call !== null && typeof call === 'object' && 'parameters' in call ? call.parameters : undefined
            );
            const sharedParameters = widgetParameters(this.tcs.sharedParameters);
            const state = call !== null && typeof call === 'object' && 'state' in call ? call.state : undefined;
            if (state !== undefined && typeof state !== 'string') throw new Error('Invalid widget state');
            status.set('starting');
            iframe = ref.componentInstance.createIframe(`Widget ${widgetType}`);
            const widgetWindow = iframe.contentWindow;
            if (!widgetWindow) throw new Error('Widget iframe has no window');
            const playerWindow = playerIframe?.contentWindow;
            const playerSession = call !== null && typeof call === 'object' && 'sessionId' in call ?
              call.sessionId : undefined;
            const callId = call !== null && typeof call === 'object' && 'callId' in call ? call.callId : undefined;
            if (!playerWindow || playerWindow !== source || typeof playerSession !== 'string' || !playerSession ||
                (callId !== undefined && typeof callId !== 'string')) throw new Error('Invalid widget requester');
            let session: { kind: 'waiting' } | {
              kind: 'running'; id: string; latestTimestamp: number; state: string | undefined;
            } | { kind: 'finished' } = { kind: 'waiting' };
            const timeout = timer(15000).subscribe(() => fail(new Error('Widget ready timeout')));
            startup.add(timeout);
            startup.add(this.mds.postMessage$.subscribe(event => {
              const message: unknown = event.data;
              if (event.source !== widgetWindow || message === null || typeof message !== 'object' ||
                  !('type' in message) || session.kind === 'finished') return;
              if (message.type === 'vowReadyNotification') {
                if (session.kind !== 'waiting') return;
                try {
                  const name = widgetName('metadata' in message ? message.metadata : undefined, String(widgetType));
                  const command: WidgetStartCommand = {
                    type: 'vowStartCommand', sessionId: Array.from(crypto.getRandomValues(new Uint8Array(16)),
                      byte => byte.toString(16).padStart(2, '0')).join(''), parameters, sharedParameters,
                    ...(state !== undefined ? { state } : {})
                  };
                  session = { kind: 'running', id: command.sessionId, latestTimestamp: -Infinity, state };
                  timeout.unsubscribe();
                  if (iframe) iframe.title = name;
                  ref.componentInstance.setName(name);
                  widgetWindow.postMessage(command, '*');
                  status.set('running');
                } catch (error) { fail(error); }
                return;
              }
              if (session.kind !== 'running' ||
                  (message.type !== 'vowStateChangedNotification' && message.type !== 'vowReturnRequested')) return;
              let update;
              try { update = widgetEvent(message); } catch (error) {
                console.warn('Widget message rejected:', resourcePath, error);
                return;
              }
              if (update.sessionId !== session.id) {
                console.warn('Widget message has wrong session:', resourcePath, update.sessionId);
                return;
              }
              if (update.timeStamp >= session.latestTimestamp) {
                session.latestTimestamp = update.timeStamp;
                if (update.state !== undefined) session.state = update.state;
              }
              if (update.type === 'vowReturnRequested') {
                const finalState = session.state;
                session = { kind: 'finished' };
                const canReturn = update.saveState && activeDialog.restoreFocus && playerIframe.isConnected &&
                  playerIframe.contentWindow === playerWindow && this.tcs.currentUnitSequenceId === unitSequenceId;
                ref.close();
                if (canReturn) playerWindow.postMessage({
                  type: 'vopWidgetReturn', sessionId: playerSession,
                  ...(callId !== undefined ? { callId } : {}),
                  ...(finalState !== undefined ? { state: finalState } : {})
                }, '*');
              }
            }));
            // The listener and timeout exist before any widget script executes.
            iframe.srcdoc = file.content;
          } catch (error) { fail(error); }
        },
        error: error => {
          console.error('Widget HTML download failed:', resourcePath, error);
          status.set('download-error');
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
    this.subscriptions.unsubscribe();
  }
}
