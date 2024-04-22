import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StudyMonitorComponent } from '../components/study-monitor/study-monitor.component';

const routes: Routes = [
  { path: ':ws', component: StudyMonitorComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StudyMonitorRoutingModule { }
