/* eslint-disable no-console */

import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot, CanActivate, Router
} from '@angular/router';
import { Observable } from 'rxjs';
import { MainDataService } from '../../shared/shared.module';
import { UnitControllerData } from '../classes/test-controller.classes';
import { TestControllerService } from '../services/test-controller.service';

@Injectable()
export class UnitActivateGuard implements CanActivate {
  constructor(
    private tcs: TestControllerService,
    private mds: MainDataService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> | boolean {
    const targetUnitSequenceId: number = Number(route.params.u);
    if (this.tcs.rootTestlet === null) {
      // unit-route got called before test is loaded. This happens on page-reload (F5).
      const testId = Number(route.parent.params.t);
      if (!testId) {
        this.router.navigate(['/']);
        return false;
      }
      // ignore unit-id from route, because test will get last opened unit ID from testStatus.CURRENT_UNIT_ID
      console.log('goto', testId);
      this.router.navigate([`/t/${testId}`]);
      return false;
    }
    const newUnit: UnitControllerData = this.tcs.rootTestlet.getUnitAt(targetUnitSequenceId);
    if (!newUnit) {
      // a unit-nr was entered in the URl which does not exist
      console.warn(`target unit null (targetUnitSequenceId: ${targetUnitSequenceId.toString()})`);
      return false;
    }
    return true;
  }
}