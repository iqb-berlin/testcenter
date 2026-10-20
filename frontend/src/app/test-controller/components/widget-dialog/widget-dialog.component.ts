import { Component, ElementRef, Inject, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { DialogResizeDirective } from './dialog-resize.directive';
import { WidgetFrameSizer } from './widget-frame-sizer.class';

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
  host: { '[class.preparing]': '!layoutReady()' },
  imports: [MatDialogModule, MatButtonModule, MatIconModule, CdkDrag, CdkDragHandle, DialogResizeDirective],
  template: `
    @if (!layoutReady()) {
      <div class="preparation">
        <p role="status" aria-live="polite">
          {{ status() === 'loading' ? 'Widget wird geladen …' : 'Widget wird gestartet …' }}
        </p>
        <button aria-label="Widget schließen" mat-icon-button mat-dialog-close="user_called">
          <mat-icon svgIcon="close"></mat-icon>
        </button>
      </div>
    }
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
    :host(.preparing) { background: transparent; }
    :host(.preparing) header, :host(.preparing) .frame-host, :host(.preparing) .resize { visibility: hidden; }
    :host(.preparing) .status { display: none; }
    .preparation {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      display: flex; align-items: center; gap: 16px; padding: 16px 24px;
      max-width: 90%; box-sizing: border-box; background: white; border-radius: 12px;
    }
    .preparation p { margin: 0; }
    header { display: flex; align-items: center; flex-shrink: 0; }
    h2 {
      flex: 1; min-width: 0; margin: 0; padding: 8px 16px; cursor: move;
      overflow-wrap: anywhere; touch-action: none; user-select: none;
    }
    h2::before { display: none; }
    header button { margin-right: 8px; }
    .resize {
      position: absolute; right: 0; bottom: 0; width: 24px; height: 24px;
      padding: 0; border: 0; border-radius: 4px; cursor: nwse-resize; touch-action: none;
      color: var(--mat-sys-on-surface); background: var(--mat-sys-surface-container);
    }
    .frame-host { flex: 1; min-width: 0; min-height: 0; position: relative; overflow: hidden; }
    .status:has(p) { margin: auto; padding: 60px 20px; text-align: center; }
  `]
})
export class WidgetDialogComponent implements OnDestroy {
  @ViewChild('frameHost', { static: true }) private frameHost!: ElementRef<HTMLElement>;
  readonly status = signal<WidgetDialogStatus>('loading');
  readonly name = signal('Widget');
  readonly layoutReady = signal(false);
  private iframe: HTMLIFrameElement | undefined;
  private frameSizer: WidgetFrameSizer | undefined;
  private readonly dialogRef = inject(MatDialogRef<WidgetDialogComponent>);
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
    iframe.style.cssText = 'position:absolute;display:block;border:0;transform-origin:top left;';
    if (colorScheme) {
      // Apply the theme before the iframe can paint its default colors.
      const doc = new DOMParser().parseFromString(html, 'text/html');
      doc.documentElement.style.colorScheme = colorScheme;
      doc.body.style.colorScheme = colorScheme;
      const doctype = doc.doctype ? new XMLSerializer().serializeToString(doc.doctype) : '';
      html = `${doctype}\n${doc.documentElement.outerHTML}`;
    }
    this.frameHost.nativeElement.appendChild(iframe);
    this.frameSizer = new WidgetFrameSizer(iframe, this.frameHost.nativeElement, (width) => {
      const fittedWidth = Math.min(window.innerWidth * 0.95, Math.max(320, Math.ceil(width)));
      if (this.frameHost.nativeElement.clientWidth !== Math.round(fittedWidth)) {
        this.dialogRef.updateSize(`${fittedWidth}px`, `${this.windowBounds.height}px`);
      }
      return Math.round(fittedWidth);
    }, () => this.showLayout());
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
    this.frameSizer?.start();
  }

  showStartupError(): void {
    this.removeIframe();
    this.status.set('startup-error');
    this.showLayout();
  }

  showDownloadError(): void {
    this.status.set('download-error');
    this.showLayout();
  }

  showMissingCalculator(): void {
    this.status.set('missing-calculator');
    this.showLayout();
  }

  ngOnDestroy(): void {
    this.removeIframe();
  }

  private showLayout(): void {
    this.layoutReady.set(true);
  }

  private removeIframe(): void {
    this.frameSizer?.destroy();
    this.frameSizer = undefined;
    this.iframe?.remove();
    this.iframe = undefined;
  }
}
