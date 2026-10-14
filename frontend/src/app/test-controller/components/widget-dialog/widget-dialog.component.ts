import { Component, Inject, Signal } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type WidgetDialogStatus = 'loading' | 'loaded' | 'error';

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
        @case ('loaded') { <p>Widget geladen.</p> }
        @case ('error') {
          <p>Das Widget konnte nicht geladen werden. Bitte schließen Sie das Fenster.</p>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: flex; position: relative; height: 100%; background: white; }
    .close { position: absolute; top: 10px; right: 10px; }
    .status { margin: auto; padding: 60px 20px; text-align: center; }
  `]
})
export class WidgetDialogComponent {
  readonly status: WidgetDialogData['status'];

  constructor(@Inject(MAT_DIALOG_DATA) data: WidgetDialogData) {
    this.status = data.status;
  }
}
