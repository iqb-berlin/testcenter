import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MainDataService } from '@shared/services/maindata/maindata.service';
import { BackendService } from '@app/backend.service';
import { HeaderService } from '@shared/services/header.service';
import { AlertComponent, UserAgentService } from '@shared/shared.module';
import { MatCardModule } from '@angular/material/card';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  templateUrl: './admin-login.component.html',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatIconButton,
    MatIcon,
    RouterLink,
    MatButton,
    AlertComponent
  ],
  styleUrl: './admin-login.component.css'
})

export class AdminLoginComponent implements OnInit {
  static oldLoginName = '';
  problemText = '';
  problemLevel: 'error' | 'warning' = 'error';
  problemCode = 0;
  showPassword = false;
  unsupportedBrowser: [string, string] | [] = [];

  loginForm = new FormGroup({
    name: new FormControl(AdminLoginComponent.oldLoginName, [Validators.required, Validators.minLength(3)]),
    pw: new FormControl('', [Validators.required])
  });

  constructor(public mainDataService: MainDataService, private headerService: HeaderService,
              private backendService: BackendService, private router: Router) { }

  ngOnInit(): void {
    this.headerService.title = 'Anmelden';
    this.checkBrowser();
  }

  adminLogin(): void {
    const loginData = this.loginForm.value;
    if (!loginData.name || !loginData.pw) {
      return;
    }
    AdminLoginComponent.oldLoginName = loginData.name;
    this.problemText = '';
    this.problemCode = 0;
    this.backendService.adminLogin(loginData.name, loginData.pw).subscribe({
      next: authData => {
        this.mainDataService.setAuthData(authData);
        this.router.navigate(['/r/starter']);
      },
      error: error => {
        this.problemCode = error.code;
        if (error.code === 400) {
          this.problemText = 'Anmeldedaten sind nicht gültig. Bitte noch einmal versuchen!';
        } else if (error.code === 401) {
          this.problemText = 'Anmeldung abgelehnt. Anmeldedaten sind noch nicht freigeben.';
        } else if (error.code === 204) {
          this.problemText = 'Anmeldedaten sind gültig, aber es sind keine Arbeitsbereiche oder Tests freigegeben.';
        } else if (error.code === 410) {
          this.problemText = 'Anmeldedaten sind abgelaufen';
        } else if (error.code === 429) {
          this.problemText = 'Zu viele Fehlversuche! Probieren Sie es zu einem späteren Zeitpunkt noch einmal.';
        } else {
          this.problemText = 'Problem bei der Anmeldung.';
          throw error;
        }
        this.problemLevel = 'error';
        this.loginForm.reset();
      }
    });
  }

  checkCapsLock(event: KeyboardEvent): void {
    // some newer edge versions does fire a keyup event when clicking into the textfield, which does not
    // have getModifierState TODO find the route cause of this instead of workaround
    if (typeof event.getModifierState !== 'function') return;
    if (event.getModifierState('CapsLock')) {
      this.problemText = 'Feststelltaste ist aktiviert!';
      this.problemLevel = 'warning';
    }
  }

  clearWarning(): void {
    this.problemText = '';
    this.problemLevel = 'error';
    this.problemCode = 0;
  }

  private checkBrowser() {
    const ua = UserAgentService.resolveUserAgent();
    if (!UserAgentService.userAgentMatches(ua)) {
      this.unsupportedBrowser = [ua.family, ua.version];
    }
  }
}
