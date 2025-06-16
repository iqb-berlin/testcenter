// eslint-disable-next-line max-classes-per-file
import { Injectable, NgModule } from '@angular/core';
import {
  Routes,
  RouterModule,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';
import { Observable } from 'rxjs';
import { SysCheckComponent } from './sys-check.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { NetworkCheckComponent } from './network-check/network-check.component';
import { SysCheckDataService } from './sys-check-data.service';
import { QuestionnaireComponent } from './questionnaire/questionnaire.component';
import { ReportComponent } from './report/report.component';
import { UnitCheckComponent } from './unit-check/unit-check.component';

@Injectable()
export class SysCheckChildCanActivateGuard {
  constructor(
    private router: Router,
    private ds: SysCheckDataService
  ) {
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    if (this.ds.checkConfig && this.ds.loadConfigComplete) {
      return true;
    }
    this.router.navigate(['/']); // TODO not ideal for not-logged in users (see commitmsg for more)
    return false;
  }
}

const routes: Routes = [
  {
    path: ':workspace-id/:sys-check-name',
    component: SysCheckComponent,
    children: [
      {
        path: '',
        redirectTo: 'w',
        pathMatch: 'full'
      },
      {
        path: 'w',
        component: WelcomeComponent
      },
      {
        path: 'n',
        component: NetworkCheckComponent,
        canActivate: [SysCheckChildCanActivateGuard]
      },
      {
        path: 'q',
        component: QuestionnaireComponent,
        canActivate: [SysCheckChildCanActivateGuard]
      },
      {
        path: 'r',
        component: ReportComponent,
        canActivate: [SysCheckChildCanActivateGuard]
      },
      {
        path: 'u',
        component: UnitCheckComponent,
        canActivate: [SysCheckChildCanActivateGuard]
      }]
  }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SysCheckRoutingModule { }
