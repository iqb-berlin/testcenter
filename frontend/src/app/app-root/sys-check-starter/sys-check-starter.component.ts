import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BackendService } from '../../backend.service';
import { MainDataService } from '../../shared/shared.module';
import { SysCheckInfo } from '../../app.interfaces';

@Component({
    templateUrl: './sys-check-starter.component.html',
    styleUrls: ['./sys-check-starter.component.css'],
    standalone: false
})
export class SysCheckStarterComponent implements OnInit {
  checkConfigList: SysCheckInfo[] = [];
  loading = false;

  constructor(public mainDataService: MainDataService,
              private bs: BackendService,
              private router: Router) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.mainDataService.appSubTitle$.next('System-Check Auswahl');
      this.loading = true;
      this.bs.getSysCheckInfosAcrossWorkspaces().subscribe(myConfigs => {
        this.checkConfigList = myConfigs || [];
        this.loading = false;
      });
    });
  }

  buttonStartCheck(checkInfo: SysCheckInfo): void {
    this.router.navigate([`/check/${checkInfo.workspaceId}/${checkInfo.name}`]);
  }
}
