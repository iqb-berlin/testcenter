import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UnitActivateGuard, UnitDeactivateGuard } from './unit-route-guards';
import { UnithostComponent } from '../components/unithost/unithost.component';
import { TestControllerComponent } from '../components/test-controller/test-controller.component';
import { TestStatusComponent } from '../components/test-status/test-status.component';
import { TestControllerDeactivateGuard, TestControllerErrorPausedActivateGuard } from './test-controller-route-guards';

const routes: Routes = [
  {
    path: ':t',
    component: TestControllerComponent,
    canDeactivate: [TestControllerDeactivateGuard],
    children: [
      {
        path: '',
        redirectTo: 'status',
        pathMatch: 'full'
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
