import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatToolbar } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { MatDivider } from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';
import { HeaderService } from '@shared/services/header.service';
import { MainDataService } from '@shared/services/maindata/maindata.service';
import { filter } from 'rxjs/operators';
import { MessageService } from '@shared/services/message.service';
import { AssetService } from '@shared/services/asset.service';

@Component({
  selector: 'tc-header',
  imports: [
    MatToolbar,
    RouterLink,
    MatTooltipModule,
    MatIconButton,
    MatIcon,
    OverlayModule,
    MatButton,
    MatMenu,
    MatMenuTrigger,
    MatDivider
  ],
  templateUrl: 'header.component.html',
  styleUrl: 'header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  @ViewChild('logoutDialogTemplate') logoutDialogTemplate!: TemplateRef<unknown>;
  logoLink: string[] = ['/r'];
  userRights: string[] = [];
  protected logoURL?: string;
  protected confirmDialogImgSrc?: string;
  protected isLoginRoute: boolean = false;

  constructor(public headerService: HeaderService,
              public mainDataService: MainDataService,
              public assetService: AssetService,
              private messageService: MessageService,
              private router: Router) {
    router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.isLoginRoute = router.url.includes('code-input') ||
                                   router.url.includes('login');
      this.logoLink = this.isLoginRoute ? ['/r/login'] : ['/r'];
    });

    assetService.assetSlots$.subscribe(() => {
      this.logoURL = assetService.getAssetSrc('logo');
    });

    this.mainDataService.authData$.subscribe(authData => {
      if (!authData) return;
      this.userRights = [];
      if (authData.claims.workspaceAdmin) {
        this.userRights.push('Verwaltung von Testinhalten');
      }
      if (authData.claims.superAdmin) {
        this.userRights.push('Verwaltung von Nutzerrechten und von grundsätzlichen Systemeinstellungen');
      }
      if (authData.claims.test) {
        if (authData.claims.test.length > 1) {
          this.userRights.push('Ausführung/Ansicht von Befragungen oder Testheften');
        } else {
          this.userRights.push('Ausführung/Ansicht einer Befragung oder eines Testheftes');
        }
      }
      if (authData.claims.workspaceMonitor) {
        if (authData.claims.workspaceMonitor.length > 1) {
          this.userRights.push('Beobachtung/Prüfung der Durchführung von Befragungen oder Kompetenztests');
        } else {
          this.userRights.push('Beobachtung/Prüfung der Durchführung einer Befragung oder eines Kompetenztests');
        }
      }
      if (authData.claims.testGroupMonitor) {
        this.userRights.push('Beobachtung/Prüfung einer Testgruppe');
      }
      if (authData.flags.indexOf('codeRequired') >= 0) {
        this.userRights.push('Code-Eingabe erforderlich');
      }
    });
  }

  ngOnInit() {
    this.confirmDialogImgSrc = this.assetService.getAssetSrc('confirmDialog');
  }

  protected logout() {
    if (this.isLoginRoute) {
      this.mainDataService.logOut();
    } else {
      this.messageService.showConfirmDialog({
        title: 'Sicher, dass du dich abmelden möchtest?',
        contentTemplate: this.logoutDialogTemplate,
        confirmText: 'Abmelden',
        cancelText: 'Hier bleiben'
      }).subscribe((result: boolean | undefined) => {
        if (result) this.mainDataService.logOut();
      });
    }
  }

  ngOnDestroy(): void {
    this.userRights = [];
    this.headerService.reset();
  }
}
