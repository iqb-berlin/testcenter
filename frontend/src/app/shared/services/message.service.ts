import { Injectable, TemplateRef } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../components/dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { InfoDialogComponent } from '@shared/components/dialog/info-dialog.component';
import { ThemeService } from '@shared/services/theme.service';
import { MainDataService } from '@shared/services/maindata/maindata.service';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  constructor(private _snackBar: MatSnackBar, private dialog: MatDialog,
              private mds: MainDataService, private themeService: ThemeService) {}

  showSnackbar(text: string, actionText: string = 'Schließen'): MatSnackBarRef<TextOnlySnackBar> {
    return this._snackBar.open(text, actionText, {
      duration: 5000
    });
  }

  showConfirmDialog(dialogData: ConfirmDialogData): Observable<boolean> {
    // Any kind of admin is assumed to be adult and gets the unsafe mode, regardless of the theme.
    const userClaims = this.mds.getAuthData()?.claims;
    const isAdmin: boolean =
      typeof userClaims?.superAdmin !== 'undefined' || userClaims?.workspaceAdmin !== undefined;
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
