import { Component, ElementRef, Inject, Signal } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type WidgetDialogStatus = 'loading' | 'starting' | 'running' | 'download-error' | 'startup-error';

export interface WidgetDialogData {
  status: Signal<WidgetDialogStatus>;
}

@Component({
  selector: 'tc-widget-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <button class="close" aria-label="Widget schließen" mat-icon-button
            mat-dialog-close>
      <mat-icon>close</mat-icon>
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
      }
    </div>
    <div class="frame-host"></div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; position: relative; height: 100%; background: white; }
    .close { position: absolute; top: 10px; right: 10px; }
    .frame-host { flex: 1; min-height: 0; }
    .status:has(p) { margin: auto; padding: 60px 20px; text-align: center; }
  `]
})
export class WidgetDialogComponent {
  readonly status: WidgetDialogData['status'];

  constructor(@Inject(MAT_DIALOG_DATA) data: WidgetDialogData,
              private readonly element: ElementRef<HTMLElement>) {
    this.status = data.status;
  }

  setName(name: string): void {
    this.element.nativeElement.closest('[role="dialog"]')?.setAttribute('aria-label', name);
  }

  createIframe(title: string): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    iframe.title = title;
    iframe.style.cssText = 'width:100%;height:100%;border:0;';
    this.element.nativeElement.querySelector('.frame-host')?.appendChild(iframe);
    return iframe;
  }

}
