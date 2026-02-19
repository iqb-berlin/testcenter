import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import {
  MainDataService,
  WideMessageDialogComponent,
  MessageDialogData,
  SharedModule,
  UserAgentService
} from '../../shared/shared.module';
import { AuthData } from '../../app.interfaces';
import { BackendService } from '../../backend.service';

@Component({
  templateUrl: 'login.component.html',
  styleUrl: 'login.component.css',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDialogModule,
    RouterLink,
    MatButton,
    MatIconButton,
    MatCardModule,
    SharedModule
  ]
})

export class LoginComponent implements OnInit, OnDestroy {
  static oldLoginName = '';
  private routingSubscription: Subscription | null = null;
  returnTo = '';
  problemText = '';
  problemLevel: 'error' | 'warning' = 'error';
  problemCode = 0;
  showPassword = false;
  unsupportedBrowser: [string, string] | [] = [];
  name: string | null = null;
  readonly dialog = inject(MatDialog);

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
    this.mainDataService.appSubTitle$.next('Anmelden');
    this.routingSubscription = this.route.params
      .subscribe(params => { this.returnTo = params.returnTo; });
    this.checkBrowser();
  }

  nameInput(): void {
    const loginData = this.loginForm.value;
    if (!loginData.name) {
      return;
    }
    LoginComponent.oldLoginName = loginData.name;
    this.problemCode = 0;
    // try if login without password (= with empty password) is possible; otherwise, ask for password input
    this.backendService.login(loginData.name, '').subscribe({
      next: authData => {
        const authDataTyped = authData as AuthData;
        this.mainDataService.setAuthData(authDataTyped);
        this.navigateAfterLogin(authDataTyped);
      },
      error: error => {
        this.problemCode = error.code;
        this.name = loginData.name ?? '';
      }
    });
  }

  passwordInput(): void {
    const loginData = this.loginForm.value;
    if (!this.name) {
      return;
    }
    loginData.name = this.name;
    this.problemText = '';
    this.problemCode = 0;
    this.backendService.login(loginData.name, loginData.pw ?? '').subscribe({
      next: authData => {
        const authDataTyped = authData as AuthData;
        this.mainDataService.setAuthData(authDataTyped);
        this.navigateAfterLogin(authDataTyped);
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
        this.name = null;
        this.loginForm.reset();
      }
    });
  }

  openDialog() {
    const dialog = this.dialog.open(WideMessageDialogComponent, {
      width: '80%',
      data: <MessageDialogData>{
        title: 'Anleitung',
        content: '<ul> ' +
          ' <li> Geben Sie in Schritt 1 Ihren Anmeldenamen in das Eingabefeld ein. Klicken Sie dann auf den Button "Weiter".' +
          ' <li> Sie gelangen nun in den nächsten Schritt.".' +
          ' <li> Geben Sie in Schritt 2 Ihr Kennwort in das Eingabefeld ein. Klicken Sie dann auf den Button "Anmelden".' +
          ' <li> Die Startseite des Testcenters wird sich im Anschluss der erfolgreichen Anmeldung öffnen.' +
          ' </ul> '
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

  private navigateAfterLogin(authData: AuthData): void {
    if (this.returnTo) {
      this.router.navigateByUrl(this.returnTo).then(navOk => {
        if (!navOk) {
          this.router.navigate(['/r']);
        }
      });
    } else if (!authData.flags.includes('codeRequired')) {
      // only jump into test, when there is only 1 test, and there are no other claims
      // -> no other possible features or responsibilities in the starter page
      // so a shortcut jump would not hurt a specific workflow
      if (authData.claims.test && authData.claims.test.length === 1 && Object.keys(authData.claims).length === 1) {
        this.backendService.startTest(authData.claims.test[0].id).subscribe({
          next: testId => {
            this.router.navigate(['/t', testId]);
          },
          error: () => {
            this.router.navigate(['/r/starter']);
          }
        });
        // only jump into test, when there is only 1 test, and there are no other claims ->
        // no other possible features or responsibilities in the starter page
        // so a shortcut jump would not hurt a specific workflow
      } else if (authData.claims.sysCheck && authData.claims.sysCheck.length === 1 &&
        Object.keys(authData.claims).length === 1) {
        this.router.navigate(['/check', authData.claims.sysCheck[0].workspaceId, authData.claims.sysCheck[0].id]);
      } else {
        this.router.navigate(['/r/starter']);
      }
    } else {
      this.router.navigate(['/r']);
    }
  }

  ngOnDestroy(): void {
    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
  }
}
