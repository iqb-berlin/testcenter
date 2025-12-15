import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MainDataService, UserAgentService } from '../../shared/shared.module';
import { AuthData } from '../../app.interfaces';
import { BackendService } from '../../backend.service';
import { HeaderService } from '../../core/header.service';

@Component({
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css',
  standalone: false
})

export class AdminLoginComponent implements OnInit {
  static oldLoginName = '';
  private routingSubscription: Subscription | null = null;
  problemText = '';
  problemLevel: 'error' | 'warning' = 'error';
  problemCode = 0;
  showPassword = false;
  unsupportedBrowser: [string, string] | [] = [];

  loginForm = new FormGroup({
    name: new FormControl(AdminLoginComponent.oldLoginName, [Validators.required, Validators.minLength(3)]),
    pw: new FormControl('', [Validators.required])
  });

  constructor(
    public mainDataService: MainDataService,
    private headerService: HeaderService,
    private backendService: BackendService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

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
        const authDataTyped = authData as AuthData;
        this.mainDataService.setAuthData(authDataTyped);
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
