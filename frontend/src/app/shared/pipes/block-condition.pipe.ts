import { Pipe, PipeTransform } from '@angular/core';
import { BlockCondition } from '../interfaces/booklet.interfaces';
import { BlockConditionUntil } from '../../unit/block-condition.until';

@Pipe({
  name: 'blockcondition'
})
export class BlockConditionPipe implements PipeTransform {
  // eslint-disable-next-line class-methods-use-this
  transform(condition: BlockCondition): string {
    return BlockConditionUntil.stringyfy(condition);
  }
}