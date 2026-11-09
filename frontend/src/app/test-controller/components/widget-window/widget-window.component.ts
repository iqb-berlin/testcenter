import { AsyncPipe } from '@angular/common';
import {
  Component, ElementRef, OnDestroy, computed, inject, signal, viewChild
} from '@angular/core';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogTitle } from '@angular/material/dialog';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CustomtextPipe } from '@shared/shared.module';

export interface WidgetWindowData {
  title: string;
}

export type WidgetWindowStatus = 'loading' | 'starting' | 'running' | 'unavailable' | 'error';

// texts for the window while it doesn't show a running widget
const statusTexts: Record<Exclude<WidgetWindowStatus, 'running'>, { text: string; key: string }> = {
  loading: { text: 'Widget wird geladen …', key: 'booklet_widgetLoading' },
  starting: { text: 'Widget wird gestartet …', key: 'booklet_widgetStarting' },
  unavailable: { text: 'Das Widget ist nicht verfügbar.', key: 'booklet_widgetUnavailable' },
  error: { text: 'Im Widget ist ein Fehler aufgetreten.', key: 'booklet_widgetError' }
};

// A movable window that shows one widget in an iframe. Its size is set by whoever opens it (the widgets fill the
// space they are given), it knows nothing about specific widgets or the message exchange.
@Component({
  selector: 'tc-widget-window',
  imports: [
    AsyncPipe, CdkDrag, CdkDragHandle, CustomtextPipe, MatDialogClose, MatDialogTitle, MatIcon, MatIconButton
  ],
  template: `
    <header cdkDrag cdkDragRootElement=".cdk-overlay-pane"
            cdkDragBoundary=".cdk-overlay-container">
      <h2 mat-dialog-title cdkDragHandle (pointerdown)="capturePointer($event)">
        {{ data.title }}
      </h2>
      <button matIconButton mat-dialog-close
              [attr.aria-label]="'Widget schließen' | customtext:'booklet_widgetClose' | async">
        <mat-icon svgIcon="close"></mat-icon>
      </button>
    </header>
    @if (statusText(); as statusText) {
      <p class="status" role="status">
        {{ statusText.text | customtext:statusText.key | async }}
      </p>
    }
    <div #frameHost class="frame-host" [class.hidden]="status() !== 'running'"></div>
  `,
  styles: `
    /* border and tinted title bar set the window off from white players */
    :host {
      display: flex; flex-direction: column; position: relative; height: 100%; overflow: hidden;
      box-sizing: border-box; border: 1px solid var(--mat-sys-primary); border-radius: inherit;
    }
    header { display: flex; align-items: center; flex-shrink: 0; background-color: var(--mat-sys-secondary); }
    h2 {
      flex: 1; min-width: 0; margin: 0; padding: 8px 16px; cursor: move; touch-action: none; user-select: none;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    h2::before { display: none; }
    header button { margin-right: 8px; }
    .status {
      position: absolute; top: 50%; left: 0; right: 0; margin: 0; padding: 24px; text-align: center;
      transform: translateY(-50%);
    }
    .frame-host { flex: 1; min-height: 0; }
    /* hidden, but laid out at its final size, so the widget can arrange itself while it starts */
    .frame-host.hidden { visibility: hidden; }
  `
})
export class WidgetWindowComponent implements OnDestroy {
  readonly data = inject<WidgetWindowData>(MAT_DIALOG_DATA);
  readonly status = signal<WidgetWindowStatus>('loading');
  readonly statusText = computed(() => {
    const status = this.status();
    return status === 'running' ? undefined : statusTexts[status];
  });

  private readonly frameHost = viewChild.required<ElementRef<HTMLElement>>('frameHost');
  private iframe: HTMLIFrameElement | undefined;

  // Keeps the drag events in the Testcenter document when the pointer crosses the widget's iframe.
  capturePointer(event: PointerEvent): void {
    if (event.currentTarget instanceof HTMLElement) event.currentTarget.setPointerCapture(event.pointerId);
  }

  // Loads the widget. `connect` gets the widget's window before any widget code runs, so no message gets lost.
  start(html: string, connect: (widgetWindow: Window) => void): void {
    this.removeIframe();
    const iframe = document.createElement('iframe');
    iframe.title = this.data.title;
    iframe.style.cssText = 'display: block; border: 0; width: 100%; height: 100%;';
    this.frameHost().nativeElement.appendChild(iframe);
    this.iframe = iframe;
    this.status.set('starting');
    connect(iframe.contentWindow as Window);
    iframe.srcdoc = html;
  }

  showRunning(): void {
    this.status.set('running');
  }

  showUnavailable(): void {
    this.status.set('unavailable');
  }

  showError(): void {
    this.removeIframe();
    this.status.set('error');
  }

  ngOnDestroy(): void {
    this.removeIframe();
  }

  private removeIframe(): void {
    this.iframe?.remove();
    this.iframe = undefined;
  }
}
