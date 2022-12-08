import { Component, OnInit } from '@angular/core';
import { MainDataService } from '../../shared/shared.module';
import { AuthData } from '../../app.interfaces';

@Component({
  selector: 'status-card',
  templateUrl: './status-card.component.html'
})
export class StatusCardComponent implements OnInit {
  loginName = '';
  loginAuthority: string[] = [];

  constructor(public mainDataService: MainDataService) { }

  ngOnInit(): void {
    this.mainDataService.authData$.subscribe((authData: AuthData) => {
      this.loginAuthority = [];
      this.loginName = '';
      if (!authData) {
        return;
      }
      this.loginName = authData.displayName;
      if (authData.access.workspaceAdmin) {
        this.loginAuthority.push('Verwaltung von Testinhalten');
      }
      if (authData.access.superAdmin) {
        this.loginAuthority.push('Verwaltung von Nutzerrechten und von grundsätzlichen Systemeinstellungen');
      }
      if (authData.access.test) {
        if (authData.access.test.length > 1) {
          this.loginAuthority.push('Ausführung/Ansicht von Befragungen oder Testheften');
        } else {
          this.loginAuthority.push('Ausführung/Ansicht einer Befragung oder eines Testheftes');
        }
      }
      if (authData.access.workspaceMonitor) {
        if (authData.access.workspaceMonitor.length > 1) {
          this.loginAuthority.push('Beobachtung/Prüfung der Durchführung von Befragungen oder Kompetenztests');
        } else {
          this.loginAuthority.push('Beobachtung/Prüfung der Durchführung einer Befragung oder eines Kompetenztests');
        }
      }
      if (authData.access.testGroupMonitor) {
        this.loginAuthority.push('Beobachtung/Prüfung einer Testgruppe');
      }
      if (authData.flags.indexOf('codeRequired') >= 0) {
        this.loginAuthority.push('Code-Eingabe erforderlich');
      }
    });
  }
}
