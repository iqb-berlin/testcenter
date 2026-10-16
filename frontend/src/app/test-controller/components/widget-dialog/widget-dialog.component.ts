import { Component, ElementRef, Inject, OnDestroy, ViewChild, signal } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type WidgetDialogStatus = 'loading' | 'starting' | 'running' | 'download-error' | 'startup-error' |
  'missing-calculator';

export interface WidgetDialogData {
  name: string;
}

@Component({
  selector: 'tc-widget-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 class="cdk-visually-hidden" mat-dialog-title>{{ name() }}</h2>
    <button class="close" aria-label="Widget schließen" mat-icon-button
            mat-dialog-close>
      <mat-icon svgIcon="close"></mat-icon>
    </button>
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
  `,
  styles: [`
    :host { display: flex; flex-direction: column; position: relative; height: 100%; background: white; }
    .cdk-visually-hidden { position: absolute; margin: -1px; padding: 0; }
    .close { position: absolute; top: 10px; right: 10px; }
    .frame-host { flex: 1; min-height: 0; }
    .status:has(p) { margin: auto; padding: 60px 20px; text-align: center; }
  `]
})
export class WidgetDialogComponent implements OnDestroy {
  @ViewChild('frameHost', { static: true }) private frameHost!: ElementRef<HTMLElement>;
  readonly status = signal<WidgetDialogStatus>('loading');
  readonly name = signal('Widget');
  private iframe: HTMLIFrameElement | undefined;

  constructor(@Inject(MAT_DIALOG_DATA) data: WidgetDialogData) {
    this.name.set(data.name);
  }

  start(html: string, initialize: (widgetWindow: Window) => void): void {
    this.status.set('starting');
    const iframe = document.createElement('iframe');
    this.iframe = iframe;
    iframe.title = this.name();
    iframe.style.cssText = 'width:100%;height:100%;border:0;';
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
