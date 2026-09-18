import { Injectable, TemplateRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { InfoDialogComponent } from '@shared/components/dialog/info-dialog.component';
import { ThemeService } from '@shared/services/theme.service';
import { MainDataService } from '@shared/services/maindata/maindata.service';
import { ToastContent, ToastService } from '@shared/services/toast.service';
import { ConfirmDialogComponent } from '../components/dialog/confirm-dialog.component';
import { ErrorDialogComponent } from '@shared/components/dialog/error-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  constructor(private dialog: MatDialog, private toastService: ToastService,
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
  showSnackbar(text: ToastContent, actionText: string = 'Schließen', duration: number = 5000): Observable<void> {
    return this.toastService.showSnackbar(text, actionText, duration);
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

  showErrorDialog(errorMessage?: string): void {
    this.dialog.open(ErrorDialogComponent, {
      data: errorMessage,
      disableClose: true,
      autoFocus: 'dialog'
    });
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
