import {
  Component, OnDestroy, OnInit, inject
} from '@angular/core';
import { AsyncPipe, NgClass } from '@angular/common';
import {
  FormControl, FormGroup, ReactiveFormsModule, Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observer, Subscription } from 'rxjs';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { AuthData } from '@app/app.interfaces';
import { BackendService } from '@app/backend.service';
import { FooterService } from '@shared/services/footer.service';
import { ThemeService } from '@shared/services/theme.service';
import { HeaderService } from '@shared/services/header.service';
import { AssetService } from '@shared/services/asset.service';
import {
  MainDataService,
  UserAgentService, SharedModule, AlertComponent, CustomtextPipe
} from '../../shared/shared.module';

@Component({
  templateUrl: 'login.component.html',
  styleUrl: 'login.component.scss',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDialogModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    SharedModule,
    AlertComponent,
    AsyncPipe,
    NgClass,
    CustomtextPipe
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
  user = 'school';
  unsupportedBrowser: [string, string] | [] = [];
  username: string | null = null;
  readonly dialog = inject(MatDialog);
  protected illustrationImageSrc?: string;
  altchaLib?: Promise<typeof import('altcha-lib')>;
  altchaLibSubscription?: Subscription;

  loginForm = new FormGroup({
    name: new FormControl(LoginComponent.oldLoginName, [Validators.required, Validators.minLength(3)]),
    pw: new FormControl('')
  });

  constructor(
    public mainDataService: MainDataService,
    private backendService: BackendService,
    private router: Router,
    private route: ActivatedRoute,
    private headerService: HeaderService,
    private footerService: FooterService,
    private themeService: ThemeService,
    protected assetService: AssetService
  ) { }

  ngOnInit(): void {
    this.mainDataService.appSubTitle$.next('Anmelden');
    this.routingSubscription = this.route.params
      .subscribe(params => {
        this.returnTo = params.returnTo;
      });
    this.checkBrowser();
    this.headerService.title = 'Anmelden';
    this.footerService.showFooter.set(true);
    this.assetService.assetSlots$.subscribe(() => {
      this.illustrationImageSrc = this.assetService.getAssetSrc('loginIllustration');
    });
    this.altchaLibSubscription = this.mainDataService.appConfig$.subscribe(appConfig => {
      if (appConfig.bruteForceProtection.includes('login')) {
        this.altchaLib = import('altcha-lib');
      }
    });
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
        if (authData.viewSettings.theme) this.themeService.setTheme(authData.viewSettings.theme);
        this.assetService.refreshAssetSlots();
        this.navigateAfterLogin(authDataTyped);
      },
      error: error => {
        this.problemCode = error.code;
        this.username = loginData.name ?? '';
      }
    });
  }

  passwordInput(): void {
    const loginData = this.loginForm.value;
    if (!this.username) {
      return;
    }
    const name = this.username;
    const password = loginData.pw ?? '';
    this.problemText = '';
    this.problemCode = 0;

    if (!this.mainDataService.appConfig?.bruteForceProtection.includes('login')) {
      this.backendService.login(name, password).subscribe(this.getLoginSubscription());
      return;
    }

    this.user = 'sync';
    this.backendService.createChallenge({ loginType: 'login', name, password }).subscribe({
      next: challenge => {
        this.altchaLib?.then(({ solveChallengeWorkers }) => solveChallengeWorkers(
          `${window.document.baseURI}/altcha-lib/dist/worker.js`,
          8,
          challenge.challenge,
          challenge.salt,
          challenge.algorithm,
          challenge.maxNumber
        )).then(solvedChallenge => {
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
          ).subscribe(this.getLoginSubscription());
        }, error => {
          this.problemText = 'Problem bei der Anmeldung.';
          throw error;
        }).finally(() => {
          this.user = 'school';
        });
      },
      error: error => {
        this.problemText = 'Problem bei der Anmeldung.';
        this.user = 'school';
        throw error;
      }
    });
  }

  private getLoginSubscription(): Partial<Observer<AuthData>> {
    return {
      next: authData => {
        this.mainDataService.setAuthData(authData);
        if (authData.viewSettings.theme) this.themeService.setTheme(authData.viewSettings.theme);
        this.assetService.refreshAssetSlots();
        this.navigateAfterLogin(authData);
      },
      error: error => {
        this.user = 'school';
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
        this.username = null;
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
    this.footerService.showFooter.set(false);
    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
    this.altchaLibSubscription?.unsubscribe();
  }
}
