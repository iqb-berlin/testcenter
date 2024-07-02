import { Pipe, PipeTransform } from '@angular/core';
import { BlockCondition } from '../interfaces/booklet.interfaces';
import { BlockConditionUtil } from '../../unit/block-condition.util';

@Pipe({
  name: 'blockcondition'
})
export class BlockConditionPipe implements PipeTransform {
  // eslint-disable-next-line class-methods-use-this
  transform(condition: BlockCondition): string {
    return BlockConditionUtil.stringyfy(condition);
  }
}
