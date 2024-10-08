import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GroupMonitorComponent } from './group-monitor.component';

const routes: Routes = [
  { path: ':group-name/:profile-id', component: GroupMonitorComponent },
  { path: ':group-name', component: GroupMonitorComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GroupMonitorRoutingModule { }
