import { Component } from '@angular/core';
import { CodeInputComponent } from '@shared/components/code-input/code-input.component';
import { AppError, AuthData, CodeInputType } from '@app/app.interfaces';
import { Router } from '@angular/router';
import { BackendService } from '@app/backend.service';
import { MainDataService } from '@shared/services/maindata/maindata.service';
import { ThemeService } from '@shared/services/theme.service';
import { AsyncPipe } from '@angular/common';
import { CustomtextPipe } from '@shared/pipes/customtext/customtext.pipe';

@Component({
  imports: [
    CodeInputComponent,
    AsyncPipe,
    CustomtextPipe
  ],
  template: `
    <div class="form">
      <tc-code-input [inputType]="inputType" [length]="length" [problemText]="problemText"
                     (submitCode)="onSubmit($event)">
        @if (inputType !== 'keypad-symbols-alt') {
          <div>
            <h2>{{ 'login_codeInputTitle' | customtext:'login_codeInputTitle' | async }}</h2>
            <p>Welche Symbole stehen auf deinem Zettel?<br>Wähle sie hier aus:</p>
          </div>
        }
      </tc-code-input>
    </div>
    <div class="illustration">
      <img [src]="themeService.activeTheme.imagePaths?.codeInputIllustration" alt="Code input illustration">
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

  constructor(private router: Router, private bs: BackendService, private mds: MainDataService,
              public themeService: ThemeService) {
    const authData = this.mds.getAuthData();
    this.inputType = authData?.viewSettings.codeInput?.type || 'text-field';
    this.length = authData?.viewSettings.codeInput?.length;
  }

  protected onSubmit(code: string) {
    if (!code) return;
    this.problemText = '';
    this.problemCode = 0;

    this.bs.codeLogin(code).subscribe({
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
}
