import { Injectable, TemplateRef, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subject } from 'rxjs';
import { InfoDialogComponent } from '@shared/components/dialog/info-dialog.component';
import { ThemeService } from '@shared/services/theme.service';
import { MainDataService } from '@shared/services/maindata/maindata.service';
import { ConfirmDialogComponent } from '../components/dialog/confirm-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  // We roll our own list instead of Angular Material's `MatSnackBar` because
  // MatSnackBar can only ever show one message at a time - opening a new one
  // instantly dismisses whatever is currently shown.

  // Active toast messages, rendered stacked by `ToastContainerComponent`.
  readonly toasts = signal<ToastMessage[]>([]);
  private toastIdCounter = 0;
  // Per-toast "afterDismissed" notifier - replaces what MatSnackBarRef used to provide.
  private dismissSubjects = new Map<number, Subject<void>>();

  constructor(private dialog: MatDialog,
              private mds: MainDataService, private themeService: ThemeService) {}

  /**
   * Shows a toast message. Multiple messages triggered in quick succession are
   * stacked on top of each other instead of replacing one another, and each is
   * dismissed independently after its own `duration`.
   *
   * `text` is either a plain string, or an array mixing plain strings with
   * `{ emphasized: '...' }` markers.
   *
   * Pass `duration <= 0` to show the message indefinitely.
   *
   * Returns an observable that emits once this particular toast has been dismissed.
   */
  showSnackbar(text: string, actionText: string = 'Schließen', duration: number = 5000): Observable<void> {
    this.toastIdCounter += 1;
    const id = this.toastIdCounter;
    const dismissed$ = new Subject<void>();
    this.dismissSubjects.set(id, dismissed$);
    this.toasts.update(toasts => [...toasts, { id, text, actionText }]);
    if (duration > 0) {
      setTimeout((): void => this.dismissToast(id), duration);
    }
    return dismissed$.asObservable();
  }

  /** Removes a single toast, e.g. once its action button is clicked. */
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

  showConfirmDialog(dialogData: ConfirmDialogData): Observable<boolean> {
    // Any kind of admin or group-monitor is assumed to be adult and gets
    // the unsafe mode, regardless of the theme.
    const userClaims = this.mds.getAuthData()?.claims;
    const isAdmin: boolean =
      typeof userClaims?.superAdmin !== 'undefined' ||
      userClaims?.workspaceAdmin !== undefined ||
      userClaims?.testGroupMonitor !== undefined;
    const safeMode: boolean = !isAdmin && this.themeService.activeTheme.targetAudience === 'children';
    return this.dialog.open(ConfirmDialogComponent, {
      data: { ...dialogData, safeMode },
      autoFocus: 'dialog'
    }).afterClosed();
  }

  showInfoDialog(dialogData: DialogData): Observable<boolean> {
    return this.dialog.open(InfoDialogComponent, {
      data: dialogData,
      autoFocus: 'dialog'
    }).afterClosed();
  }
}

interface BaseDialogData {
  title: string;
}

// Dialog content can be either a string or a template. Template can be used for formatted content.
export type DialogData =
  (BaseDialogData & { content: string; contentTemplate?: never }) |
  (BaseDialogData & { content?: never; contentTemplate: TemplateRef<unknown> });

export type ConfirmDialogData = DialogData & {
  confirmText? : string;
  cancelText? : string;
  safeMode?: boolean;
};

// A single stacked toast message, as rendered by `ToastContainerComponent`.
export interface ToastMessage {
  id: number;
  text: string;
  actionText: string;
}
