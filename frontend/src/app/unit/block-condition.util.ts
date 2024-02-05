import {
  BlockCondition,
  BlockConditionSource, sourceIsConditionAggregation,
  sourceIsSingleSource,
  sourceIsSourceAggregation
} from '../shared/interfaces/booklet.interfaces';

export class BlockConditionUtil {
  static stringyfy(condition: BlockCondition): string {
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
        .map(BlockConditionUtil.stringyfy)
        .map(s => `(${s})`)
        .join(' AND ')
      );
    }
    nameToken.push('IS', condition.expression.type, `'${condition.expression.value}'`);
    return nameToken.join(' ');
  }
}
