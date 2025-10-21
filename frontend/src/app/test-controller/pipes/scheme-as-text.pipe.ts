// a less type-restrictive version of the keyvalue pipe
import { Pipe, PipeTransform } from '@angular/core';
import { CodingScheme } from '@iqb/responses';

@Pipe({
    name: 'schemeastext',
    standalone: false
})
export class SchemeAsTextPipe implements PipeTransform {
  // eslint-disable-next-line class-methods-use-this
  transform(scheme: CodingScheme): string {
    return scheme.asText().map(t => t.label || t.id).join();
  }
}
