import { AsyncPipe } from '@angular/common';
import { CustomtextPipe } from '@shared/shared.module';
import { Component, ElementRef, Inject, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { WIDGET_WINDOW_LIMITS } from './widget-window.constants';

export type WidgetDialogStatus = 'loading' | 'starting' | 'running' | 'download-error' | 'startup-error' |
  'unavailable';

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
  imports: [
    AsyncPipe, CustomtextPipe, MatDialogModule, MatButtonModule, MatIconModule,
    CdkDrag, CdkDragHandle
  ],
  template: `
    @if (!layoutReady()) {
      <div class="preparation">
        <p role="status" aria-live="polite">
          {{ (status() === 'loading' ? 'Widget wird geladen …' : 'Widget wird gestartet …') |
             customtext: (status() === 'loading' ? 'booklet_widgetLoading' : 'booklet_widgetStarting') | async }}
        </p>
        <button [attr.aria-label]="'Widget schließen' | customtext: 'booklet_widgetClose' | async"
              mat-icon-button mat-dialog-close="user_called">
          <mat-icon svgIcon="close"></mat-icon>
        </button>
      </div>
    }
    <header #windowHeader cdkDrag cdkDragRootElement=".cdk-overlay-pane"
            cdkDragBoundary=".cdk-overlay-container">
      <h2 [attr.aria-label]="name()" mat-dialog-title cdkDragHandle
          (pointerdown)="capturePointer($event)"></h2>
      <button [attr.aria-label]="'Widget schließen' | customtext: 'booklet_widgetClose' | async"
              mat-icon-button mat-dialog-close="user_called">
        <mat-icon svgIcon="close"></mat-icon>
      </button>
    </header>
    <div class="status" aria-live="polite" role="status">
      @switch (status()) {
        @case ('loading') { <p>{{ 'Widget wird geladen …' | customtext: 'booklet_widgetLoading' | async }}</p> }
        @case ('starting') { <p>{{ 'Widget wird gestartet …' | customtext: 'booklet_widgetStarting' | async }}</p> }
        @case ('startup-error') {
          <p>{{ 'Das Widget konnte nicht gestartet werden. Bitte schließen Sie das Fenster.' |
            customtext: 'booklet_widgetStartupError' | async }}</p>
        }
        @case ('download-error') {
          <p>{{ 'Das Widget konnte nicht geladen werden. Bitte schließen Sie das Fenster.' |
            customtext: 'booklet_widgetDownloadError' | async }}</p>
        }
        @case ('unavailable') {
          <p>{{ unavailableMessage() }}</p>
        }
      }
    </div>
    <div #frameHost class="frame-host" [inert]="!layoutReady()"></div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; position: relative; height: 100%; background: white; }
    :host(.preparing) { background: transparent; }
    :host(.preparing) header { visibility: hidden; }
    /* Hidden iframe documents can have their animation frames throttled. */
    :host(.preparing) .frame-host { opacity: 0; }
    :host(.preparing) .status { display: none; }
    .preparation {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      display: flex; align-items: center; gap: 16px; padding: 16px 24px;
      max-width: 90%; box-sizing: border-box; background: white; border-radius: 12px;
    }
    .preparation p { margin: 0; }
    header { display: flex; align-items: center; flex-shrink: 0; height: 48px; }
    h2 {
      flex: 1; min-width: 0; margin: 0; padding: 8px 0; cursor: move;
      overflow-wrap: anywhere; touch-action: none; user-select: none;
    }
    h2::before { display: none; }
    header button { margin-right: 8px; }
    .frame-host { flex: 1; min-width: 0; min-height: 0; position: relative; overflow: hidden; }
    .status:has(p) { margin: auto; padding: 60px 20px; text-align: center; }
  `]
})
export class WidgetDialogComponent implements OnDestroy {
  @ViewChild('windowHeader', { static: true }) private windowHeader!: ElementRef<HTMLElement>;
  @ViewChild('frameHost', { static: true }) private frameHost!: ElementRef<HTMLElement>;
  readonly status = signal<WidgetDialogStatus>('loading');
  readonly name = signal('Widget');
  readonly unavailableMessage = signal('');
  readonly layoutReady = signal(false);
  private iframe: HTMLIFrameElement | undefined;
  private iframeLoaded: Promise<void> = Promise.resolve();
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
    iframe.style.cssText = 'display:block;border:0;width:100%;height:100%;';
    if (colorScheme) {
      // Apply the theme before the iframe can paint its default colors.
      const doc = new DOMParser().parseFromString(html, 'text/html');
      doc.documentElement.style.colorScheme = colorScheme;
      doc.body.style.colorScheme = colorScheme;
      const doctype = doc.doctype ? new XMLSerializer().serializeToString(doc.doctype) : '';
      html = `${doctype}\n${doc.documentElement.outerHTML}`;
    }
    this.frameHost.nativeElement.appendChild(iframe);
    // Appending the iframe loads about:blank synchronously. Wait for srcdoc instead.
    this.iframeLoaded = new Promise(resolve => iframe.addEventListener('load', () => resolve(), { once: true }));
    const widgetWindow = iframe.contentWindow;
    if (!widgetWindow) throw new Error('Widget iframe has no window');
    // Install the protocol listener before executing any widget script.
    initialize(widgetWindow);
    iframe.srcdoc = html;
  }

  showRunning(name: string, preferredWidth?: number): void {
    this.name.set(name);
    if (this.iframe) this.iframe.title = name;
    this.status.set('running');
    void this.fitInitialWindow(preferredWidth);
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

  showUnavailable(message: string): void {
    this.unavailableMessage.set(message);
    this.status.set('unavailable');
    this.showLayout();
  }

  ngOnDestroy(): void {
    this.removeIframe();
  }

  private showLayout(): void {
    // Keep the window within the viewport when revealing it.
    const { left, top, width, height } = this.windowBounds;
    this.dialogRef.updatePosition({
      left: `${Math.max(0, Math.min(left, window.innerWidth - width))}px`,
      top: `${Math.max(0, Math.min(top, window.innerHeight - height))}px`
    });
    this.layoutReady.set(true);
  }

  private async fitInitialWindow(preferredWidth?: number): Promise<void> {
    const iframe = this.iframe;
    await this.iframeLoaded;
    if (!iframe || iframe !== this.iframe || !iframe.contentWindow) return;
    const widgetWindow = iframe.contentWindow;
    // After start-command delivery, allow a complete render cycle in the widget
    // document. A host frame can run before the iframe's rendering callbacks.
    await new Promise<void>(resolve => widgetWindow.requestAnimationFrame(() => {
      widgetWindow.requestAnimationFrame(() => resolve());
    }));
    await iframe?.contentDocument?.fonts.ready;
    if (!iframe || iframe !== this.iframe || !iframe.contentDocument?.body) return;
    const { width, height: contentHeight } = this.measureContent(iframe.contentDocument);
    // Content dimensions exclude the fixed-height host header.
    const headerHeight = this.windowHeader.nativeElement.getBoundingClientRect().height;
    const scale = Math.min(
      (preferredWidth ?? width) / width,
      window.innerWidth * WIDGET_WINDOW_LIMITS.viewportFraction / width,
      Math.max(1, window.innerHeight * WIDGET_WINDOW_LIMITS.viewportFraction - headerHeight) / contentHeight
    );
    iframe.style.width = `${width}px`;
    iframe.style.height = `${contentHeight}px`;
    iframe.style.transformOrigin = 'top left';
    iframe.style.transform = scale !== 1 ? `scale(${scale})` : '';
    this.dialogRef.updateSize(
      `${Math.ceil(width * scale)}px`, `${Math.ceil(contentHeight * scale + headerHeight)}px`
    );
    this.showLayout();
  }

  private measureContent(doc: Document): { width: number; height: number } {
    const { body, documentElement } = doc;
    const elements = [documentElement, body];
    const styles = elements.map(element => element.style.cssText);
    try {
      for (const element of elements) {
        element.style.setProperty('width', 'max-content', 'important');
        element.style.setProperty('height', 'max-content', 'important');
      }
      const content = documentElement.getBoundingClientRect();
      return {
        width: Math.ceil(Math.max(content.width, body.scrollWidth)) || this.frameHost.nativeElement.clientWidth,
        height: Math.ceil(Math.max(content.height, body.scrollHeight)) || this.frameHost.nativeElement.clientHeight
      };
    } finally {
      elements.forEach((element, index) => {
        element.style.cssText = styles[index];
      });
    }
  }

  private removeIframe(): void {
    this.iframe?.remove();
    this.iframe = undefined;
  }
}
