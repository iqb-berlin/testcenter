import { Component } from '@angular/core';
import { MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  templateUrl: './login-help-dialog.component.html',
  imports: [
    MatDialogTitle,
    MatIconButton,
    MatIcon,
    MatDialogContent,
    MatDialogClose
  ],
  styleUrl: './login-help-dialog.component.css'
})
export class LoginHelpDialogComponent { }
