import { Component, ElementRef, Inject, OnDestroy, ViewChild, signal } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { DialogResizeDirective } from './dialog-resize.directive';

export type WidgetDialogStatus = 'loading' | 'starting' | 'running' | 'download-error' | 'startup-error' |
  'missing-calculator';

export interface WidgetWindowBounds {
  width: number;
  height: number;
  left: number;
  top: number;
}

export interface WidgetDialogData {
  name: string;
}

@Component({
  selector: 'tc-widget-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, CdkDrag, CdkDragHandle, DialogResizeDirective],
  template: `
    <header cdkDrag #drag="cdkDrag" cdkDragRootElement=".cdk-overlay-pane"
            cdkDragBoundary=".cdk-overlay-container">
      <h2 mat-dialog-title cdkDragHandle
          (pointerdown)="capturePointer($event)">{{ name() }}</h2>
      <button aria-label="Widget schließen" mat-icon-button mat-dialog-close="user_called">
        <mat-icon svgIcon="close"></mat-icon>
      </button>
    </header>
    <div class="status" aria-live="polite" role="status">
      @switch (status()) {
        @case ('loading') { <p>Widget wird geladen …</p> }
        @case ('starting') { <p>Widget wird gestartet …</p> }
        @case ('startup-error') {
          <p>Das Widget konnte nicht gestartet werden. Bitte schließen Sie das Fenster.</p>
        }
        @case ('download-error') {
          <p>Das Widget konnte nicht geladen werden. Bitte schließen Sie das Fenster.</p>
        }
        @case ('missing-calculator') {
          <p>Kein Taschenrechner verfügbar. Bitte informieren Sie die Testleitung.</p>
          <p>Im Arbeitsbereich muss ein Widget mit dem Modell CALCULATOR oder CALC hochgeladen werden.</p>
        }
      }
    </div>
    <div #frameHost class="frame-host"></div>
    <button class="resize" aria-label="Widget-Größe ändern" title="Widget-Größe ändern"
            [tcDialogResize]="drag">◢</button>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; position: relative; height: 100%; background: white; }
    header { display: flex; align-items: center; flex-shrink: 0; }
    h2 { flex: 1; margin: 0; padding: 8px 16px; cursor: move; touch-action: none; user-select: none; }
    h2::before { display: none; }
    header button { margin-right: 8px; }
    .resize {
      position: absolute; right: 0; bottom: 0; width: 24px; height: 24px;
      padding: 0; border: 0; border-radius: 4px; cursor: nwse-resize; touch-action: none;
      color: var(--mat-sys-on-surface); background: var(--mat-sys-surface-container);
    }
    .frame-host { flex: 1; min-height: 0; }
    .status:has(p) { margin: auto; padding: 60px 20px; text-align: center; }
  `]
})
export class WidgetDialogComponent implements OnDestroy {
  @ViewChild('frameHost', { static: true }) private frameHost!: ElementRef<HTMLElement>;
  readonly status = signal<WidgetDialogStatus>('loading');
  readonly name = signal('Widget');
  private iframe: HTMLIFrameElement | undefined;
  @ViewChild(CdkDrag, { static: true }) private drag!: CdkDrag;

  constructor(@Inject(MAT_DIALOG_DATA) data: WidgetDialogData) {
    this.name.set(data.name);
  }

  get windowBounds(): WidgetWindowBounds {
    const { width, height, left, top } = this.drag.getRootElement().getBoundingClientRect();
    return { width, height, left, top };
  }

  capturePointer(event: PointerEvent): void {
    // Keep drag events in the host document when crossing the widget iframe.
    if (event.currentTarget instanceof HTMLElement) event.currentTarget.setPointerCapture(event.pointerId);
  }

  start(html: string, initialize: (widgetWindow: Window) => void, colorScheme?: 'light' | 'dark'): void {
    this.status.set('starting');
    const iframe = document.createElement('iframe');
    this.iframe = iframe;
    iframe.title = this.name();
    iframe.style.cssText = 'display:block;width:100%;height:100%;border:0;';
    if (colorScheme) {
      // Apply the theme before the iframe can paint its default colors.
      const doc = new DOMParser().parseFromString(html, 'text/html');
      doc.documentElement.style.colorScheme = colorScheme;
      doc.body.style.colorScheme = colorScheme;
      const doctype = doc.doctype ? new XMLSerializer().serializeToString(doc.doctype) : '';
      html = `${doctype}\n${doc.documentElement.outerHTML}`;
    }
    this.frameHost.nativeElement.appendChild(iframe);
    const widgetWindow = iframe.contentWindow;
    if (!widgetWindow) throw new Error('Widget iframe has no window');
    // Install the protocol listener before executing any widget script.
    initialize(widgetWindow);
    iframe.srcdoc = html;
  }

  showRunning(name: string): void {
    this.name.set(name);
    if (this.iframe) this.iframe.title = name;
    this.status.set('running');
  }

  showStartupError(): void {
    this.removeIframe();
    this.status.set('startup-error');
  }

  showDownloadError(): void {
    this.status.set('download-error');
  }

  showMissingCalculator(): void {
    this.status.set('missing-calculator');
  }

  ngOnDestroy(): void {
    this.removeIframe();
  }

  private removeIframe(): void {
    this.iframe?.remove();
    this.iframe = undefined;
  }
}
