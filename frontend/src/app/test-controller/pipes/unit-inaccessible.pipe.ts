import { Pipe, PipeTransform } from '@angular/core';
import { TestletLockType, Unit } from '../interfaces/test-controller.interfaces';
import { TestControllerService } from '../services/test-controller.service';

@Pipe({
    name: 'unit_inaccessible',
    standalone: false
})
export class UnitInaccessiblePipe implements PipeTransform {
  // lockedDirectly and locked are part of unit,
  // but we take it as separate parameters for the sake of change detection
  // https://docs.angular.lat/guide/pipes#detecting-pure-changes-to-primitives-and-object-references
  // eslint-disable-next-line class-methods-use-this
  transform(
    unit: Unit,
    lockedDirectly: boolean, // needed for change detection
    locked: TestletLockType | undefined, // needed for change detection
    currentSequenceId: number,
    forwardAllowed: boolean,
    backwardAllowed: boolean
  ): boolean {
    const position = Math.sign(unit.sequenceId - currentSequenceId);
    if (!forwardAllowed && position === 1) return true;
    if (!backwardAllowed && position === -1) return true;
    if (position === 0) return false;
    return TestControllerService.unitIsInaccessible(unit);
  }
}
