import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { unitActivateGuard } from './unit-activate.guard';
import { unitDeactivateGuard } from './unit-deactivate.guard';
import { UnithostComponent } from '../components/unithost/unithost.component';
import { TestControllerComponent } from '../components/test-controller/test-controller.component';
import { TestStatusComponent } from '../components/test-status/test-status.component';
import { testControllerDeactivateGuard } from './test-controller-deactivate.guard';
import { testControllerErrorPausedActivateGuard } from './test-controller-error-paused-activate.guard';

const routes: Routes = [
  { // under some circumstances we get to the status page without having a test-Id
    path: 'status',
    component: TestStatusComponent
  },
  {
    path: ':t',
    component: TestControllerComponent,
    canDeactivate: [testControllerDeactivateGuard],
    children: [
      { // no unit resolved yet (fresh navigation from '/t/<testId>', or a reload-recovery bounce
        // from unitActivateGuard) - deliberately componentless (`children: []` is only there to
        // satisfy Angular's route-config validation) so nothing mounts into the outlet here.
        // TestControllerComponent shows the shared loading animation itself while state$ is
        // 'LOADING'; once TestLoaderService resolves where to resume, it navigates to 'status' or
        // 'u/:u' below.
        path: '',
        pathMatch: 'full',
        children: []
      },
      {
        path: 'status',
        component: TestStatusComponent
      },
      {
        path: 'u/:u',
        component: UnithostComponent,
        canActivate: [testControllerErrorPausedActivateGuard, unitActivateGuard],
        canDeactivate: [unitDeactivateGuard]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TestControllerRoutingModule { }
