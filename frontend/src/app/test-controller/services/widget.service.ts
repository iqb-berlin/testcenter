import { Injectable, OnDestroy, signal } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { merge, Subscription } from 'rxjs';
import { distinctUntilChanged, first } from 'rxjs/operators';
import { MainDataService } from '@shared/shared.module';
import {
  WidgetDialogComponent, WidgetDialogData, WidgetDialogStatus
} from '../components/widget-dialog/widget-dialog.component';
import { isLoadingFileLoaded } from '../interfaces/test-controller.interfaces';
import { BackendService } from './backend.service';
import { TestControllerService } from './test-controller.service';

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
    activeDialog.download.add(this.backend.getResource(this.tcs.workspaceId, resourcePath)
      .pipe(first(isLoadingFileLoaded)).subscribe({
        next: file => {
          console.log('Widget HTML downloaded:', { resourcePath, htmlLength: file.content.length });
          status.set('loaded');
        },
        error: error => {
          console.error('Widget HTML download failed:', resourcePath, error);
          status.set('error');
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
