import { Injectable, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  // We roll our own list instead of Angular Material's `MatSnackBar` because
  // MatSnackBar can only ever show one message at a time - opening a new one
  // instantly dismisses whatever is currently shown.

  readonly toasts = signal<ToastMessage[]>([]);
  private toastIdCounter = 0;
  // Per-toast "afterDismissed" notifier - replaces what MatSnackBarRef used to provide.
  private dismissSubjects = new Map<number, Subject<void>>();

  showSnackbar(text: ToastContent, actionText: string = 'Schließen', duration: number = 5000): Observable<void> {
    this.toastIdCounter += 1;
    const id = this.toastIdCounter;
    const dismissed$ = new Subject<void>();
    this.dismissSubjects.set(id, dismissed$);
    const segments = ToastService.toSegments(text);
    this.toasts.update(toasts => [...toasts, { id, segments, actionText }]);
    if (duration > 0) {
      setTimeout((): void => this.dismissToast(id), duration);
    }
    return dismissed$.asObservable();
  }

  private static toSegments(text: ToastContent): ToastSegment[] {
    if (typeof text === 'string') {
      return [{ text }];
    }
    return text.map(part => (
      typeof part === 'string' ? { text: part } : { text: part.emphasized, emphasized: true })
    );
  }

  dismissToast(id: number): void {
    this.toasts.update(toasts => toasts.filter(toast => toast.id !== id));
    const dismissed$ = this.dismissSubjects.get(id);
    // The auto-dismiss setTimeout scheduled in showSnackbar() is never cancelled,
    // so dismissToast() can genuinely run twice for the same id - once from an
    // early dismissal (e.g. action click) and once when the stale timer still
    // fires afterwards. The `if` below is what makes that harmless.
    if (dismissed$) {
      dismissed$.next();
      dismissed$.complete();
      this.dismissSubjects.delete(id);
    }
  }
}

export interface ToastMessage {
  id: number;
  segments: ToastSegment[];
  actionText: string;
}

export interface ToastSegment {
  text: string;
  emphasized?: boolean;
}

export type ToastContent = string | (string | { emphasized: string })[];