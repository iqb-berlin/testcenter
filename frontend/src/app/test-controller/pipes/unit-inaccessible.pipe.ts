import { Pipe, PipeTransform } from '@angular/core';
import { TestletLockType, Unit } from '../interfaces/test-controller.interfaces';
import { TestControllerService } from '../services/test-controller.service';

@Pipe({
  name: 'unit_inaccessible'
})
export class UnitInaccessiblePipe implements PipeTransform {
  // lockedDirectly and locked are part of unit,
  // but we take it as parameters to detect changes corretcly
  // since subobjects are not tracked by the pipe
  // https://docs.angular.lat/guide/pipes#detecting-pure-changes-to-primitives-and-object-references
  // eslint-disable-next-line class-methods-use-this
  transform(unit: Unit, lockedDirectly: boolean, locked?: TestletLockType): boolean {
    return TestControllerService.unitIsInaccessible(unit);
  }
}
