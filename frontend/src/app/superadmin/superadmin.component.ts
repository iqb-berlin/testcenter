import { Component, OnInit } from '@angular/core';
import { MainDataService } from '../shared/shared.module';
import { HeaderService } from '../core/header.service';

@Component({
    templateUrl: './superadmin.component.html',
    styleUrls: ['./superadmin.component.css'],
    standalone: false
})
export class SuperadminComponent implements OnInit {
  constructor(public mds: MainDataService, private headerService: HeaderService) { }

  navLinks = [
    { path: 'users', label: 'Admins' },
    { path: 'workspaces', label: 'Arbeitsbereiche' },
    { path: 'settings', label: 'Einstellungen' }
  ];

  ngOnInit():void {
    setTimeout(() => this.mds.appSubTitle$.next('Systemverwaltung'));
    this.headerService.title = 'Systemverwaltung';
    this.headerService.showAccountPanel = true;
  }
}
