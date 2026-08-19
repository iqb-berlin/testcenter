import { Component } from '@angular/core';
import { ToastService } from '@shared/services/toast.service';

// Renders all currently active `ToastService.showSnackbar(...)` messages as a
// vertically stacked list of toasts, so several messages triggered in quick
// succession stay visible at once instead of replacing each other (which is
// the built-in limit of Angular Material's `MatSnackBar`).
// Mounted once, globally, in `AppComponent`.
@Component({
  selector: 'tc-toast-container',
  imports: [],
  template: `
    <div class="toast-stack" aria-live="polite" data-cy="toast-container">
      @for (toast of toastService.toasts(); track toast.id; let i = $index) {
        <div class="toast" [attr.data-cy]="'toast-item-' + i">
          <span class="toast-text" [attr.data-cy]="'toast-text-' + i">
            @for (segment of toast.segments; track $index) {
              <span [class.toast-highlight]="segment.emphasized">{{ segment.text }}</span>
            }
          </span>
          <button
            class="toast-action"
            type="button"
            [attr.data-cy]="'toast-action-' + i"
            (click)="toastService.dismissToast(toast.id)"
          >
            {{ toast.actionText }}
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .toast-stack {
      position: fixed;
      left: 50%;
      bottom: 24px;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      gap: 8px;
      /* Positions the whole stack bottom-center of the viewport, below the
       fatal-error overlay (#main-alert-container in app.component.css, at z-index: 1000) */
      z-index: 900;
      /* "pointer-events: none" lets clicks pass through the empty space around
        the toasts (e.g. when there are none); each .toast below switches it back on for itself.*/
      pointer-events: none;
    }

    /* Reuses Material's own "inverse surface" tokens, i.e. the same
       dark-on-light/light-on-dark contrast MatSnackBar uses by default. */
    .toast {
      display: flex;
      gap: 24px;
      padding: 14px 16px;
      border-radius: 4px;
      background: var(--mat-sys-inverse-surface);
      color: var(--mat-sys-inverse-on-surface);
      pointer-events: auto;
    }

    .toast-action {
      background: none;
      border: none;
      color: var(--mat-sys-inverse-primary);
      cursor: pointer;
    }

    .toast-highlight {
      font-family: monospace;
      font-weight: 700;
      background: var(--mat-sys-inverse-on-surface);
      color: var(--mat-sys-inverse-surface);
      padding: 1px 6px;
      border-radius: 4px;
    }
  `
})
export class ToastContainerComponent {
  constructor(public toastService: ToastService) {}
}
