import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SyscheckComponent } from './syscheck/syscheck.component';
import { ResultsComponent } from './results/results.component';
import { FilesComponent } from './files/files.component';
import { TestsComponent } from './tests/tests.component';
import { WorkspaceComponent } from './workspace.component';

const routes: Routes = [
  {
    path: ':ws',
    component: WorkspaceComponent,
    children: [
      { path: '', redirectTo: 'monitor', pathMatch: 'full' },
      { path: 'files', component: FilesComponent },
      { path: 'syscheck', component: SyscheckComponent },
      { path: 'results', component: ResultsComponent },
      { path: 'tests', component: TestsComponent },
      { path: '**', component: FilesComponent }
    ]
  }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WorkspaceRoutingModule { }
