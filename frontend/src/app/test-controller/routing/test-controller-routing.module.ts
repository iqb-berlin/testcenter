import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UnitActivateGuard } from './unit-activate.guard';
import { UnitDeactivateGuard } from './unit-deactivate.guard';
import { UnithostComponent } from '../components/unithost/unithost.component';
import { TestControllerComponent } from '../components/test-controller/test-controller.component';
import { TestStatusComponent } from '../components/test-status/test-status.component';
import { TestControllerDeactivateGuard } from './test-controller-deactivate.guard';
import { TestControllerErrorPausedActivateGuard } from './test-controller-error-paused-activate.guard';

const routes: Routes = [
  { // under some circumstances we get to the status page without having a test-Id
    path: 'status',
    component: TestStatusComponent
  },
  {
    path: ':t',
    component: TestControllerComponent,
    canDeactivate: [TestControllerDeactivateGuard],
    children: [
      { // no unit resolved yet (fresh navigation from '/t/<testId>', or a reload-recovery bounce
        // from UnitActivateGuard) - deliberately componentless (`children: []` is only there to
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
        canActivate: [TestControllerErrorPausedActivateGuard, UnitActivateGuard],
        canDeactivate: [UnitDeactivateGuard]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TestControllerRoutingModule { }
