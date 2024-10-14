import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CustomtextService, MainDataService } from '../../shared/shared.module';
import { AppError, AuthData } from '../../app.interfaces';
import { BackendService } from '../../backend.service';

@Component({
  templateUrl: './code-input.component.html',
  styles: [
    '.mat-mdc-card {width: 400px;}'
  ]
})
export class CodeInputComponent implements OnInit {
  @ViewChild('codeInputControl') codeInputControl!: FormControl;
  problemText = '';
  problemCode = 0;

  codeinputform = new FormGroup({
    code: new FormControl('', [Validators.required, Validators.minLength(2)])
  });

  constructor(
    private router: Router,
    public cts: CustomtextService,
    public bs: BackendService,
    public mds: MainDataService
  ) { }

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
    this.problemText = '';
    this.problemCode = 0;

    this.bs.codeLogin(codeData.code ?? '').subscribe({
      next: authData => {
        const authDataTyped = authData as AuthData;
        this.mds.setAuthData(authDataTyped);
        if (authData.claims.test.length === 1 && Object.keys(authData.claims).length === 1) {
          this.bs.startTest(authData.claims.test[0].id).subscribe(testId => {
            this.router.navigate(['/t', testId]);
          });
        } else {
          this.router.navigate(['/r']);
        }
      },
      error: (error: AppError) => {
        this.problemCode = error.code || 777;
        if (error.code === 400) {
          this.problemText = 'Der Code ist leider nicht gültig. Bitte noch einmal versuchen';
        } else if (error.code === 429) {
          this.problemText = 'Zu viele Fehlversuche! Probieren Sie es zu einem späteren Zeitpunkt noch einmal.';
        } else {
          this.problemText = 'Problem bei der Anmeldung.';
          throw error;
        }
      }
    });
  }

  resetLogin(): void {
    this.mds.logOut();
  }
}
