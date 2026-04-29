// a less type-restrictive version of the keyvalue pipe
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'properties'
})
export class PropertiesPipe implements PipeTransform {
  // eslint-disable-next-line class-methods-use-this
  transform(object: object): Array<{ key: string, value: unknown }> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore // Any is explicitly wanted here!
    return Object.keys(object).map(key => ({ key, value: object[key] }));
  }
}
