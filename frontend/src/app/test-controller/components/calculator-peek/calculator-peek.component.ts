import { Component, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { CdkDrag, DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CalculatorResult } from '../../util/calculator-result.util';

@Component({
  selector: 'tc-calculator-peek',
  imports: [DragDropModule, MatButtonModule, MatIconModule],
  template: `
    <div class="peek-viewport">
      <section class="peek" aria-label="Letzte Rechnung" data-cy="calculator-peek"
               cdkDrag #drag="cdkDrag" cdkDragBoundary=".peek-viewport">
        <header>
          <span class="handle" cdkDragHandle
                (pointerdown)="capturePointer($event)">Letzte Rechnung</span>
          <button aria-label="Ergebnisfenster schließen" mat-icon-button
                  (click)="closed.emit()">
            <mat-icon svgIcon="close"></mat-icon>
          </button>
        </header>
        <div class="image"><img [alt]="result.formula || 'Letzte Rechnung'"
                                [src]="result.image" draggable="false"
                                (load)="drag.resetToBoundary()"></div>
      </section>
    </div>
  `,
  styles: [`
    :host { position: fixed; inset: 8px; z-index: 10; pointer-events: none; }
    :host([hidden]), [hidden] { display: none !important; }
    .peek-viewport { width: 100%; height: 100%; }
    .peek {
      position: absolute; top: min(72px, 10vh); right: 16px;
      display: flex; flex-direction: column; width: max-content;
      box-sizing: border-box; min-width: min(260px, calc(100% - 16px));
      max-width: calc(100% - 16px); max-height: 80%;
      color: var(--mat-sys-on-surface); background: var(--mat-sys-surface);
      border: 1px solid var(--mat-sys-outline); border-radius: 12px;
      box-shadow: var(--mat-sys-level3); pointer-events: auto; overflow: hidden;
    }
    header { display: flex; align-items: center; background: var(--mat-sys-surface-container); }
    .handle { flex: 1; align-self: stretch; padding: 16px; cursor: move; touch-action: none; }
    .image { padding: 16px; overflow: auto; min-height: 0; }
    img { display: block; max-width: 100%; height: auto; background: white; }
  `]
})
export class CalculatorPeekComponent {
  @Input({ required: true }) result!: CalculatorResult;
  @ViewChild(CdkDrag) private drag?: CdkDrag;
  @Output() readonly closed = new EventEmitter<void>();

  capturePointer(event: PointerEvent): void {
    // Keep drag events in the host document when the pointer crosses the player iframe.
    if (event.currentTarget instanceof HTMLElement) event.currentTarget.setPointerCapture(event.pointerId);
  }

  @HostListener('window:resize')
  resetPosition(): void {
    this.drag?.reset();
  }
}
