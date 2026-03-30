import { Component } from '@angular/core';
import { CodeInputComponent } from '@shared/components/code-input/code-input.component';
import { AppError, AuthData, CodeInputType } from '@app/app.interfaces';
import { Router } from '@angular/router';
import { BackendService } from '@app/backend.service';
import { MainDataService } from '@shared/services/maindata/maindata.service';
import { AsyncPipe } from '@angular/common';
import { CustomtextPipe } from '@shared/pipes/customtext/customtext.pipe';
import { AssetService } from '@shared/services/asset.service';
import { solveChallengeWorkers } from 'altcha-lib';

@Component({
  imports: [
    CodeInputComponent,
    AsyncPipe,
    CustomtextPipe
  ],
  template: `
    <div class="form" [class.full-width]="inputType === 'keypad-symbols-alt'">
      <tc-code-input [inputType]="inputType" [length]="length" [problemText]="problemText"
                     [disabled]="loading"
                     (submitCode)="onSubmit($event)">
        @if (inputType !== 'keypad-symbols-alt') {
          <div class="intro-text">
            <h2>{{ 'login_codeInputTitle' | customtext:'login_codeInputTitle' | async }}</h2>
            <p>{{ 'Welche Symbole stehen auf deinem Zettel?' | customtext:'login_codeInputPrompt' | async }}</p>
          </div>
        }
      </tc-code-input>
    </div>
    <div class="illustration" [class.hidden]="inputType === 'keypad-symbols-alt'">
      @if (illustrationImageSrc){
        <img [src]="illustrationImageSrc" alt="Code input illustration">
      } @else {
        <div class="form"></div>
      }
    </div>
  `,
  styleUrl: 'code-login.component.scss',
  host: {
    '[class.alt-styling]': 'inputType === "keypad-symbols-alt"'
  }
})
export class CodeLoginComponent {
  inputType: CodeInputType = 'text-field';
  length: number | undefined; // only used for keypad input
  problemText = '';
  problemCode = 0;
  loading = false;
  protected illustrationImageSrc?: string;

  constructor(private router: Router, private bs: BackendService, private mds: MainDataService,
              public assetService: AssetService) {
    const authData = this.mds.getAuthData();
    this.inputType = authData?.viewSettings.codeInput?.type || 'text-field';
    this.length = authData?.viewSettings.codeInput?.length;
    this.assetService.assetSlots$.subscribe(() => {
      this.illustrationImageSrc = this.assetService.getAssetSrc('codeInputIllustration');
    });
  }

  protected onSubmit(code: string) {
    if (!code) return;
    this.loading = true;
    this.problemText = '';
    this.problemCode = 0;

    if (this.mds.appConfig?.bruteForceProtection.includes('person')) {
      this.bs.createChallenge({ code }).subscribe({
        next: challenge => {
          solveChallengeWorkers(
            `${window.document.baseURI}/altcha-lib/dist/worker.js`,
            8,
            challenge.challenge,
            challenge.salt,
            challenge.algorithm,
            challenge.maxNumber
          ).then(solvedChallenge => {
            if (!solvedChallenge) {
              this.problemText = 'Problem bei der Anmeldung.';
              this.loading = false;
              return;
            }
            this.bs.createSession(
              challenge.algorithm,
              challenge.challenge,
              challenge.salt,
              challenge.signature,
              solvedChallenge.number
            ).subscribe(this.codeSubscription);
          }, error => {
            this.problemText = 'Problem bei der Anmeldung.';
            this.loading = false;
            throw error;
          });
        },
        error: error => {
          this.problemText = 'Problem bei der Anmeldung.';
          this.loading = false;
          throw error;
        }
      });
      return;
    }

    this.bs.codeLogin(code).subscribe(this.codeSubscription);
  }

  private codeSubscription = {
    next: (authData: AuthData) => {
      this.mds.setAuthData(authData);
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
      this.loading = false;
    }
  };
}
