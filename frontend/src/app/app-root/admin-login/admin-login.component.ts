import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observer, Subscription } from 'rxjs';
import { MainDataService, UserAgentService } from '../../shared/shared.module';
import { AuthData } from '../../app.interfaces';
import { BackendService } from '../../backend.service';
import { HeaderService } from '../../core/header.service';
import { solveChallengeWorkers } from 'altcha-lib';

@Component({
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css',
  standalone: false
})

export class AdminLoginComponent implements OnInit {
  static oldLoginName = '';
  private routingSubscription: Subscription | null = null;
  returnTo = '';
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

  constructor(
    public mainDataService: MainDataService,
    private headerService: HeaderService,
    private backendService: BackendService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.headerService.title = 'Anmelden';
    this.routingSubscription = this.route.params
      .subscribe(params => { this.returnTo = params.returnTo; });
    this.checkBrowser();
  }

  adminLogin(): void {
    const loginData = this.loginForm.value;
    if (!loginData.name || !loginData.pw) {
      return;
    }

    const name = loginData.name
    AdminLoginComponent.oldLoginName = loginData.name;
    this.problemText = '';
    this.problemCode = 0;

    if (loginData.pw) {
      const password = loginData.pw;
      if (this.mainDataService.appConfig?.bruteForceProtection.includes("admin")) {

        this.admin = 'sync';

        this.backendService.createChallenge({ loginType: "admin", name, password }).subscribe({
          next: challenge => {
            const promise = solveChallengeWorkers(
              window.document.baseURI + '/altcha-lib/dist/worker.js',
              8, // no. of workers
              challenge.challenge,
              challenge.salt,
              challenge.algorithm,
              challenge.maxNumber
            );

            promise.then(solvedChallenge => {
              this.backendService.createSession(
                challenge.algorithm,
                challenge.challenge,
                challenge.salt,
                challenge.signature,
                solvedChallenge!.number
              ).subscribe(this.getAdminLoginSubscription());
            }, error => {
              this.problemText = 'Problem bei der Anmeldung.';
              throw error;
            }).finally( () => {
              this.admin='person'
            })
          },
          error: error => {
            this.problemText = 'Problem bei der Anmeldung.';
            this.admin='person'
            throw error;
          }
        });
      }
      else {
        this.backendService.adminLogin(name, password).subscribe(this.getAdminLoginSubscription());
      }
    }
    else {
      this.backendService.adminLogin(name).subscribe(this.getAdminLoginSubscription());
    }
  }

  getAdminLoginSubscription(): Partial<Observer<AuthData>> {
    return {
      next: authData => {

        const authDataTyped = authData;
        this.mainDataService.setAuthData(authDataTyped);

        if (this.returnTo) {

          this.router.navigateByUrl(this.returnTo).then(navOk => {

            if (!navOk) {
              this.router.navigate(['/r']);
            }
          });
        }
        else {
          this.router.navigate(['/r']);
        }
      },
      error: error => {
        this.admin = 'person'
        this.problemCode = error.code;

        if (error.code === 400) {
          this.problemText = 'Anmeldedaten sind nicht gültig. Bitte noch einmal versuchen!';
        }
        else if (error.code === 401) {
          this.problemText = 'Anmeldung abgelehnt. Anmeldedaten sind noch nicht freigeben.';
        }
        else if (error.code === 204) {
          this.problemText = 'Anmeldedaten sind gültig, aber es sind keine Arbeitsbereiche oder Tests freigegeben.';
        }
        else if (error.code === 410) {
          this.problemText = 'Anmeldedaten sind abgelaufen';
        }
        else if (error.code === 429) {
          this.problemText = 'Zu viele Fehlversuche! Probieren Sie es zu einem späteren Zeitpunkt noch einmal.';
        }
        else {
          this.problemText = 'Problem bei der Anmeldung.';
          throw error;
        }
        this.problemLevel = 'error';
        this.loginForm.reset();
      }
    }
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
