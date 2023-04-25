import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MainDataService } from '../../shared/shared.module';
import { AuthData } from '../../app.interfaces';
import { BackendService } from '../../backend.service';

@Component({
  templateUrl: './login.component.html',
  styles: [
    '.status-card {background: var(--tc-box-background)}',
    '.mat-form-field {display: block}',
    '.mat-card {width: 400px;}',
    '.login-buttons {justify-content: space-between; margin-left: 8px;}',
    '.version-label {position: fixed; bottom: 0; right: 0; background: rgba(255,255,255, 0.3); padding: 1px 3px}'
  ]
})

export class LoginComponent implements OnInit, OnDestroy {
  static oldLoginName = '';
  private routingSubscription: Subscription | null = null;
  returnTo = '';
  problemText = '';
  showPassword = false;

  loginForm = new FormGroup({
    name: new FormControl(LoginComponent.oldLoginName, [Validators.required, Validators.minLength(3)]),
    pw: new FormControl('', [Validators.required, Validators.minLength(7)])
  });

  constructor(
    public mainDataService: MainDataService,
    private backendService: BackendService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.mainDataService.stopLoadingAnimation();
    this.mainDataService.appSubTitle$.next('Bitte anmelden');
    this.routingSubscription = this.route.params
      .subscribe(params => { this.returnTo = params.returnTo; });
  }

  login(loginType: 'admin' | 'login' = 'login'): void {
    const loginData = this.loginForm.value;
    LoginComponent.oldLoginName = loginData.name;
    this.mainDataService.showLoadingAnimation();
    this.problemText = '';
    this.backendService.login(loginType, loginData.name, loginData.pw).subscribe({
      next: authData => {
        this.mainDataService.stopLoadingAnimation();
        const authDataTyped = authData as AuthData;
        this.mainDataService.setAuthData(authDataTyped);
        if (this.returnTo) {
          this.router.navigateByUrl(this.returnTo).then(navOk => {
            if (!navOk) {
              this.router.navigate(['/r']);
            }
          });
        } else {
          this.router.navigate(['/r']);
        }
      },
      error: error => {
        this.mainDataService.stopLoadingAnimation();
        if (error.code === 400) {
          this.problemText = 'Anmeldedaten sind nicht gültig. Bitte noch einmal versuchen!';
        } else if (error.code === 401) {
          this.problemText = 'Anmeldung abgelehnt. Anmeldedaten sind noch nicht freigeben.';
        } else if (error.code === 204) {
          this.problemText = 'Anmeldedaten sind gültig, aber es sind keine Arbeitsbereiche oder Tests freigegeben.';
        } else if (error.code === 410) {
          this.problemText = 'Anmeldedaten sind abgelaufen';
        } else {
          this.problemText = 'Problem bei der Anmeldung.';
          throw error;
        }
        this.loginForm.reset();
      }
    });
  }

  clearWarning(): void {
    this.problemText = '';
  }

  ngOnDestroy(): void {
    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
  }
}
