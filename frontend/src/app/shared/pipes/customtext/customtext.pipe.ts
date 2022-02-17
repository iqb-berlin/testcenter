import { Pipe, PipeTransform } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { CustomtextService } from '../../services/customtext/customtext.service';

@Pipe({
  name: 'customtext'
})
export class CustomtextPipe implements PipeTransform {
  constructor(private cts: CustomtextService) {}

  transform(defaultValue: string, key: string, ...replacements: string[]): Observable<string> {
    return of('...')
      .pipe(
        switchMap(() => this.cts.getCustomText$(key)),
        map(customText => (!customText ? (defaultValue || key) : customText)),
        map(customText => {
          replacements
            .forEach(replacement => {
              // eslint-disable-next-line no-param-reassign
              customText = customText.replace('%s', replacement);
            });
          return customText;
        })
      );
  }
}
