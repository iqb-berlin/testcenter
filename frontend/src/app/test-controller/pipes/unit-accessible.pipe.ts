import { Pipe, PipeTransform } from '@angular/core';
import { TestControllerService } from '../test-controller.module';
import { Unit } from '../interfaces/test-controller.interfaces';

@Pipe({
  name: 'unitaccessible'
})
export class UnitAccessiblePipe implements PipeTransform {
  // eslint-disable-next-line class-methods-use-this
  transform(unit: Unit): boolean {
    console.log('HELO PIPE');
    return !TestControllerService.unitIsInaccessible(unit);
  }
}
