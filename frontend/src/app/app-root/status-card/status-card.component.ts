import { Component, OnInit } from '@angular/core';
import { MainDataService } from '../../shared/shared.module';

@Component({
    selector: 'tc-status-card',
    templateUrl: './status-card.component.html',
    standalone: false
})
export class StatusCardComponent implements OnInit {
  loginName = '';
  loginAuthority: string[] = [];

  constructor(public mainDataService: MainDataService) { }

  ngOnInit(): void {
    this.mainDataService.authData$.subscribe(authData => {
      this.loginAuthority = [];
      this.loginName = '';
      if (!authData) {
        return;
      }
      this.loginName = authData.displayName;
      if (authData.claims.workspaceAdmin) {
        this.loginAuthority.push('Verwaltung von Testinhalten');
      }
      if (authData.claims.superAdmin) {
        this.loginAuthority.push('Verwaltung von Nutzerrechten und von grundsätzlichen Systemeinstellungen');
      }
      if (authData.claims.test) {
        if (authData.claims.test.length > 1) {
          this.loginAuthority.push('Ausführung/Ansicht von Befragungen oder Testheften');
        } else {
          this.loginAuthority.push('Ausführung/Ansicht einer Befragung oder eines Testheftes');
        }
      }
      if (authData.claims.workspaceMonitor) {
        if (authData.claims.workspaceMonitor.length > 1) {
          this.loginAuthority.push('Beobachtung/Prüfung der Durchführung von Befragungen oder Kompetenztests');
        } else {
          this.loginAuthority.push('Beobachtung/Prüfung der Durchführung einer Befragung oder eines Kompetenztests');
        }
      }
      if (authData.claims.testGroupMonitor) {
        this.loginAuthority.push('Beobachtung/Prüfung einer Testgruppe');
      }
      if (authData.flags.indexOf('codeRequired') >= 0) {
        this.loginAuthority.push('Code-Eingabe erforderlich');
      }
    });
  }
}
