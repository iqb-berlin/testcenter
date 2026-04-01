import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observer, Subscription } from 'rxjs';
import { MainDataService, UserAgentService } from '../../shared/shared.module';
import { AuthData } from '../../app.interfaces';
import { BackendService } from '../../backend.service';
import { solveChallengeWorkers } from 'altcha-lib';

@Component({
  templateUrl: './login.component.html',
  styles: [
    '.mat-mdc-form-field {display: block}',
    '.mat-mdc-card {width: 400px;}',
    '.rotate {animation: spin 3s linear infinite}'
  ],
  standalone: false
})

export class LoginComponent implements OnInit, OnDestroy {
  static oldLoginName = '';
  private routingSubscription: Subscription | null = null;
  returnTo = '';
  problemText = '';
  problemLevel: 'error' | 'warning' = 'error';
  problemCode = 0;
  showPassword = false;
  user = 'school';
  unsupportedBrowser: [string, string] | [] = [];

  loginForm = new FormGroup({
    name: new FormControl(LoginComponent.oldLoginName, [Validators.required, Validators.minLength(3)]),
    pw: new FormControl('')
  });

  constructor(
    public mainDataService: MainDataService,
    private backendService: BackendService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.mainDataService.appSubTitle$.next('Bitte anmelden');
    this.routingSubscription = this.route.params
      .subscribe(params => { this.returnTo = params.returnTo; });
    this.checkBrowser();
  }

  login(): void {
    const loginData = this.loginForm.value;
    if (!loginData.name) {
      return;
    }
    const name = loginData.name
    LoginComponent.oldLoginName = loginData.name;
    this.problemText = '';
    this.problemCode = 0;
    if (loginData.pw) {
      const password = loginData.pw
      if (this.mainDataService.appConfig?.bruteForceProtection.includes('login')) {

        this.user='sync'
        this.backendService.createChallenge({ loginType: 'login', name, password }).subscribe({
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
              ).subscribe(this.getLoginSubscription());
            }, error => {
              this.problemText = 'Problem bei der Anmeldung.';
              throw error;
            }).finally(() => {
              this.user = 'school'
            })
          },
          error: error => {
            this.problemText = 'Problem bei der Anmeldung.';
            this.user = 'school'
            throw error;
          }
        });
      } else {
        this.backendService.login('login', name, password).subscribe(this.getLoginSubscription());
      }
    } else {
      this.backendService.login('login', name).subscribe(this.getLoginSubscription());
    }
  }


  getLoginSubscription(): Partial<Observer<AuthData>> {
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
        else if (!authData.flags.includes('codeRequired')) {

          if (authData.claims?.test.length === 1 && Object.keys(authData.claims).length === 1) {

            this.backendService.startTest(authData.claims.test[0].id).subscribe({
              next: testId => {
                this.router.navigate(['/t', testId]);
              },
              error: () => {
                this.router.navigate(['/r/starter']);
              }
            });
          }
          else if (
            authData.claims.sysCheck?.length === 1
            && Object.keys(authData.claims).length === 1)
          {
            this.router.navigate(['/check', authData.claims.sysCheck[0].workspaceId, authData.claims.sysCheck[0].id]);
          }
          else {
            this.router.navigate(['/r/starter']);
          }
        } else {
          this.router.navigate(['/r']);
        }
      },
      error: error => {
        this.user='school'
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

  ngOnDestroy(): void {
    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
  }
}
