import { NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormControl, FormGroup, ReactiveFormsModule, Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { Observer } from 'rxjs';
import { solveChallengeWorkers } from 'altcha-lib';
import { AuthData } from '@app/app.interfaces';
import { BackendService } from '@app/backend.service';
import { MainDataService } from '@shared/services/maindata/maindata.service';
import { HeaderService } from '@shared/services/header.service';
import { FooterService } from '@shared/services/footer.service';
import { AlertComponent, UserAgentService } from '@shared/shared.module';

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
    AlertComponent,
    NgClass
  ],
  styleUrl: './admin-login.component.css'
})

export class AdminLoginComponent implements OnInit, OnDestroy {
  static oldLoginName = '';
  problemText = '';
  problemLevel: 'error' | 'warning' = 'error';
  problemCode = 0;
  showPassword = false;
  admin = 'person';
  unsupportedBrowser: [string, string] | [] = [];

  loginForm = new FormGroup({
    name: new FormControl(AdminLoginComponent.oldLoginName, [Validators.required, Validators.minLength(3)]),
    pw: new FormControl('', [Validators.required])
  });

  constructor(public mainDataService: MainDataService, private headerService: HeaderService,
              private backendService: BackendService, private router: Router, private footerService: FooterService) { }

  ngOnInit(): void {
    this.headerService.title = 'Anmelden';
    this.checkBrowser();
    this.footerService.showFooter.set(true);
  }

  ngOnDestroy(): void {
    this.footerService.showFooter.set(false);
  }

  adminLogin(): void {
    const loginData = this.loginForm.value;
    if (!loginData.name || !loginData.pw) {
      return;
    }
    const name = loginData.name;
    const password = loginData.pw;
    AdminLoginComponent.oldLoginName = name;
    this.problemText = '';
    this.problemCode = 0;

    if (!this.mainDataService.appConfig?.bruteForceProtection.includes('admin')) {
      this.backendService.adminLogin(name, password).subscribe(this.getAdminLoginSubscription());
      return;
    }

    this.admin = 'sync';
    this.backendService.createChallenge({ loginType: 'admin', name, password }).subscribe({
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
            return;
          }
          this.backendService.createSession(
            challenge.algorithm,
            challenge.challenge,
            challenge.salt,
            challenge.signature,
            solvedChallenge.number
          ).subscribe(this.getAdminLoginSubscription());
        }, error => {
          this.problemText = 'Problem bei der Anmeldung.';
          throw error;
        }).finally(() => {
          this.admin = 'person';
        });
      },
      error: error => {
        this.problemText = 'Problem bei der Anmeldung.';
        this.admin = 'person';
        throw error;
      }
    });
  }

  private getAdminLoginSubscription(): Partial<Observer<AuthData>> {
    return {
      next: authData => {
        this.mainDataService.setAuthData(authData);
        this.router.navigate(['/r/starter']);
      },
      error: error => {
        this.admin = 'person';
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
    };
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
