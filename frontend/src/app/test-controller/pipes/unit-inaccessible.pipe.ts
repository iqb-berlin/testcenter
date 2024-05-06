import { Pipe, PipeTransform } from '@angular/core';
import { Unit } from '../interfaces/test-controller.interfaces';
import { TestControllerService } from '../services/test-controller.service';

@Pipe({
  name: 'unit_inaccessible'
})
export class UnitInaccessiblePipe implements PipeTransform {
  constructor(
    private tcs: TestControllerService
  ) {
  }

  transform(unit: Unit): boolean {
    console.log('transform');
    return this.tcs.unitIsInaccessible(unit);
  }
}
