// a less type-restrictive version of the keyvalue pipe
import { Pipe, PipeTransform } from '@angular/core';
import { CodingSchemeTextFactory } from '@iqb/responses';
import type { VariableCodingData } from '@iqbspecs/coding-scheme';

@Pipe({
  name: 'schemeastext',
})
export class SchemeAsTextPipe implements PipeTransform {
  // eslint-disable-next-line class-methods-use-this
  transform(scheme: VariableCodingData[]): string {
    return CodingSchemeTextFactory.asText(scheme).map(t => t.label || t.id).join();
  }
}
