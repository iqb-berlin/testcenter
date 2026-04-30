import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA, MatDialogClose, MatDialogContent, MatDialogTitle
} from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { DialogData } from '@shared/services/message.service';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'app-info-dialog',
  imports: [
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    MatIcon,
    MatIconButton,
    NgTemplateOutlet
  ],
  template: `
    <div class="header-line">
      <h2 mat-dialog-title>Anleitung</h2>
      <button matIconButton mat-dialog-close>
        <mat-icon svgIcon="close"></mat-icon>
      </button>
    </div>
    <mat-dialog-content>
      @if (data.contentTemplate) {
        <ng-container *ngTemplateOutlet="data.contentTemplate"></ng-container>
      } @else {
        <p>{{ data.content }}</p>
      }
    </mat-dialog-content>
  `,
  styles: `
    .header-line {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      padding-top: 20px;
      padding-right: 25px;
    }
    .header-line .mdc-icon-button {
      color: var(--mat-sys-primary);
      border: 1px solid var(--mat-sys-primary);
      border-radius: 12px;
    }
    /*Fit hover indicator to actual dimensions */
    :host ::ng-deep .header-line .mdc-icon-button .mat-mdc-button-persistent-ripple {
      border-radius: inherit;
    }
    mat-dialog-content.mat-mdc-dialog-content {
      padding-top: 10px;
    }
    .mdc-dialog__title::before {
      height: auto;
    }
  `
})
export class InfoDialogComponent {
  data = inject<DialogData>(MAT_DIALOG_DATA);
}
