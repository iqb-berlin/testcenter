import { AsyncPipe } from '@angular/common';
import {
  Component, ElementRef, inject, input, output
} from '@angular/core';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CustomtextPipe } from '@shared/shared.module';
import { Calculation } from '../../util/calculator-state.util';

// A small movable card with the calculator's newest calculation, so the test taker still sees it with the calculator
// closed. Lies over the area it is placed in; only the card itself takes pointer input.
@Component({
  selector: 'tc-calculator-peek',
  imports: [AsyncPipe, CdkDrag, CdkDragHandle, CustomtextPipe, MatIcon, MatIconButton],
  template: `
    <section data-cy="calculator-peek" cdkDrag [cdkDragBoundary]="host">
      <header>
        <h2 cdkDragHandle (pointerdown)="capturePointer($event)">
          {{ 'Letzte Rechnung' | customtext:'booklet_calculatorPeekTitle' | async }}
        </h2>
        <button matIconButton data-cy="calculator-peek-close"
                [attr.aria-label]="'Letzte Rechnung schließen' | customtext:'booklet_calculatorPeekClose' | async"
                (click)="closed.emit()">
          <mat-icon svgIcon="close"></mat-icon>
        </button>
      </header>
      <img draggable="false" [src]="calculation().image" [alt]="calculation().latex">
    </section>
  `,
  styles: `
    :host { position: absolute; inset: 8px; z-index: 10; pointer-events: none; }
    section {
      position: absolute; top: 0; right: 16px; display: flex; flex-direction: column;
      max-width: 100%; max-height: 100%; overflow: hidden; pointer-events: auto;
      background-color: white; border: 1px solid var(--mat-sys-primary); border-radius: 12px;
      box-shadow: var(--mat-sys-level3);
    }
    header { display: flex; align-items: center; background-color: var(--mat-sys-secondary); }
    h2 {
      flex: 1; min-width: 0; margin: 0; padding: 8px 16px; cursor: move; touch-action: none; user-select: none;
      font: var(--mat-sys-title-medium); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    header button { margin-right: 4px; }
    img { display: block; max-width: 100%; height: auto; padding: 16px; box-sizing: border-box; }
  `
})
export class CalculatorPeekComponent {
  readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly calculation = input.required<Required<Calculation>>();
  readonly closed = output<void>();

  // Keeps the drag events in the Testcenter document when the pointer crosses the unit's iframe.
  capturePointer(event: PointerEvent): void {
    if (event.currentTarget instanceof HTMLElement) event.currentTarget.setPointerCapture(event.pointerId);
  }
}
