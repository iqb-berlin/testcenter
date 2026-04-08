import { Pipe, PipeTransform } from '@angular/core';
import {
  BlockCondition,
  BlockConditionSource, sourceIsConditionAggregation,
  sourceIsSingleSource,
  sourceIsSourceAggregation
} from '../interfaces/booklet.interfaces';

@Pipe({
  name: 'blockcondition'
})
export class BlockConditionPipe implements PipeTransform {
  static stringyfyCondition(condition: BlockCondition): string {
    const sourceToString =
      (source: BlockConditionSource): string => `${source.type} OF ${source.variable} FROM ${source.unitAlias}`;
    const nameToken = ['IF'];
    if (sourceIsSingleSource(condition.source)) {
      nameToken.push(sourceToString(condition.source));
    }
    if (sourceIsSourceAggregation(condition.source)) {
      nameToken.push(condition.source.type, 'OF');
      nameToken.push(condition.source.sources.map(sourceToString)
        .map(s => `(${s})`)
        .join(' AND ')
      );
    }
    if (sourceIsConditionAggregation(condition.source)) {
      nameToken.push(condition.source.type, 'OF');
      nameToken.push(condition.source.conditions
        .map(BlockConditionPipe.stringyfyCondition)
        .map(s => `(${s})`)
        .join(' AND ')
      );
    }
    nameToken.push('IS', condition.expression.type, `'${condition.expression.value}'`);
    return nameToken.join(' ');
  }

  // eslint-disable-next-line class-methods-use-this
  transform(condition: BlockCondition): string {
    return BlockConditionPipe.stringyfyCondition(condition);
  }
}
