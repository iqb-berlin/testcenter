import { Component, OnInit } from '@angular/core';
import { MainDataService } from '../shared/shared.module';

@Component({
    templateUrl: './superadmin.component.html',
    styleUrls: ['./superadmin.component.css'],
    standalone: false
})
export class SuperadminComponent implements OnInit {
  constructor(
    public mds: MainDataService
  ) { }

  navLinks = [
    { path: 'users', label: 'Admins' },
    { path: 'workspaces', label: 'Arbeitsbereiche' },
    { path: 'settings', label: 'Einstellungen' }
  ];

  ngOnInit():void {
    setTimeout(() => this.mds.appSubTitle$.next('Systemverwaltung'));
  }
}
