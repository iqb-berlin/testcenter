import { Pipe, PipeTransform } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { CustomtextService } from '../../services/customtext/customtext.service';
import { environment } from '../../../../environments/environment';

/** Output depends on the environment.ts. If the given default value is an empty string: *) In Production, the function
 * returns an empty string; *) In Dev the function returns the key argument, for debugging purposes. */
@Pipe({
  name: 'customtext'
})
export class CustomtextPipe implements PipeTransform {
  constructor(private cts: CustomtextService) {}

  transform(defaultValue: string, key: string, ...replacements: Array<string | number>): Observable<string> {
    return of('...')
      .pipe(
        switchMap(() => this.cts.getCustomText$(key)),
        map(customText => {
          if (customText) {
            return customText;
          }
          // TODO change direct call of environment with Inject Token 'IS_PRODUCTION_MODE', somehow didn't work
          return environment.production ? defaultValue : (defaultValue || key);
        }),
        map(customText => {
          replacements
            .map(replacement => (typeof replacement === 'number' ? String(replacement) : replacement))
            .forEach(replacement => {
              // eslint-disable-next-line no-param-reassign
              customText = customText
                .replace('%s', replacement)
                .replace('%date', new Date(replacement).toLocaleString());
            });
          return customText;
        })
      );
  }
}
