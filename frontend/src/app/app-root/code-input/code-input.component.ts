import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MainDataService } from '../../shared/shared.module';
import { AppError, AuthData } from '../../app.interfaces';
import { BackendService } from '../../backend.service';
import { ThemeService } from '../../shared/services/theme.service';
import { TextFieldFormComponent } from './text-field-form.component';
import { FabFormComponent } from './fab-form/fab-form.component';
import { solveChallengeWorkers } from "altcha-lib";

@Component({
  templateUrl: './code-input.component.html',
  styleUrl: './code-input.component.scss',
  imports: [
    TextFieldFormComponent,
    FabFormComponent
  ],
  standalone: true
})
export class CodeInputComponent implements OnInit {
  mode: 'text-field' | 'keypad-symbols' | 'keypad-numbers';
  problemText = '';
  problemCode = 0;
  continue = 'arrow_forward';

  private codeSubscription = {
    next: (authData: AuthData) => {
      const authDataTyped = authData;
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
      this.continue = 'arrow_forward'
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
  }

  constructor(private router: Router, public bs: BackendService, public mds: MainDataService,
              public themeService: ThemeService) {
    this.mode = this.themeService.activeTheme.codeInputMode || 'text-field';
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.mds.appSubTitle$.next('Bitte Code eingeben');
      const element = <HTMLElement>document.querySelector('.mat-input-element[formControlName="code"]');
      if (element) {
        element.focus();
      }
    });
  }

  protected onSubmit(code: string | null) {
    this.problemText = '';
    this.problemCode = 0;
    if (code) {
      if (this.mds.appConfig?.bruteForceProtection.includes('person')) {

        this.continue = 'sync'
        this.bs.createChallenge({ code: code }).subscribe({
          next: challenge => {
            const promise = solveChallengeWorkers(window.document.baseURI+'/altcha-lib/dist/worker.js', 8, challenge.challenge, challenge.salt, challenge.algorithm, challenge.maxNumber)
            promise.then( s => {
              this.bs.createSession(challenge.algorithm, challenge.challenge, challenge.salt, challenge.signature, s!.number).subscribe(this.codeSubscription);
            }, error => {
              this.problemText = 'Problem bei der Anmeldung.';
              throw error;
            }).finally( () => {
              this.continue='arrow_forward'
            })
          },
          error: error => {
            this.problemText = 'Problem bei der Anmeldung.';
            this.continue='arrow_forward'
            throw error;
          }
        });
      } else {
        this.bs.codeLogin(code).subscribe(this.codeSubscription);
      }
    } else  {
      this.bs.codeLogin('').subscribe(this.codeSubscription);
    }
  }
}
