import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import {
  CustomtextService, MessageDialogComponent, MessageDialogData, MessageType,
  MainDataService
} from '../../shared/shared.module';
import { AuthData } from '../../app.interfaces';
import { BackendService } from '../../backend.service';

@Component({
  templateUrl: './code-input.component.html',
  styles: [
    'mat-card {margin: 10px;}',
    '.mat-card-box {background-color: var(--tc-box-background)}',
    '.mat-card {display: flex; justify-content: start; flex-direction: column; flex-wrap: wrap}',
    '.mat-card-content {flex-grow: 1; overflow: auto}'
  ]
})
export class CodeInputComponent implements OnInit {
  @ViewChild('codeInputControl') codeInputControl: FormControl;
  problemText = '';

  codeinputform = new FormGroup({
    code: new FormControl('', [Validators.required, Validators.minLength(2)])
  });

  constructor(
    private router: Router,
    public messageDialog: MatDialog,
    public cts: CustomtextService,
    public bs: BackendService,
    public mds: MainDataService
  ) { }

  // eslint-disable-next-line class-methods-use-this
  ngOnInit(): void {
    setTimeout(() => {
      this.mds.appSubTitle$.next('Bitte Code eingeben');
      const element = <HTMLElement>document.querySelector('.mat-input-element[formControlName="code"]');
      if (element) {
        element.focus();
      }
    });
  }

  codeinput(): void {
    const codeData = this.codeinputform.value;
    if (codeData.code.length === 0) {
      this.messageDialog.open(MessageDialogComponent, {
        width: '400px',
        data: <MessageDialogData>{
          title: `${this.cts.getCustomText('login_codeInputTitle')}: Leer`,
          content: this.cts.getCustomText('login_codeInputPrompt'),
          type: MessageType.error
        }
      });
    } else {
      this.mds.setSpinnerOn();
      this.bs.codeLogin(codeData.code).subscribe(
        authData => {
          this.mds.setSpinnerOff();
          this.problemText = '';
          if (typeof authData === 'number') {
            const errCode = authData as number;
            if (errCode === 400) {
              this.problemText = 'Der Code ist leider nicht gültig. Bitte noch einmal versuchen';
            } else {
              this.problemText = 'Problem bei der Anmeldung.';
              // app.interceptor will show error message
            }
          } else {
            const authDataTyped = authData as AuthData;
            this.mds.setAuthData(authDataTyped);
            this.router.navigate(['/r']);
          }
        }
      );
    }
  }

  resetLogin(): void {
    this.mds.setAuthData();
    this.router.navigate(['/']);
  }
}
