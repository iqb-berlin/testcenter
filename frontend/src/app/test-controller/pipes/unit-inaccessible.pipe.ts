import { Pipe, PipeTransform } from '@angular/core';
import { Unit } from '../interfaces/test-controller.interfaces';
import { TestControllerService } from '../services/test-controller.service';

@Pipe({
  name: 'unit_inaccessible'
})
export class UnitInaccessiblePipe implements PipeTransform {
  // eslint-disable-next-line class-methods-use-this
  transform(unit: Unit): boolean {
    return TestControllerService.unitIsInaccessible(unit);
  }
}
