import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MainDataService } from '@shared/shared.module';
import { AppError, AuthData } from '@app/app.interfaces';
import { BackendService } from '@app/backend.service';
import { ThemeService } from '@shared/services/theme.service';
import { TextFieldFormComponent } from './text-field-form.component';
import { FabFormComponent } from './fab-form/fab-form.component';

@Component({
  templateUrl: './code-input.component.html',
  styleUrl: './code-input.component.scss',
  imports: [
    TextFieldFormComponent,
    FabFormComponent
  ]
})
export class CodeInputComponent {
  mode: 'text-field' | 'keypad-symbols' | 'keypad-numbers';
  problemText = '';
  problemCode = 0;

  constructor(private router: Router, public bs: BackendService, public mds: MainDataService,
              public themeService: ThemeService) {
    this.mode = this.themeService.activeTheme.codeInputMode || 'text-field';
  }

  protected onSubmit(code: string | null) {
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
