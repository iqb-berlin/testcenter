import { Directive, Input } from '@angular/core';

@Directive({
  selector: '[appTemplateContext]'
})
export class TemplateContextDirective<T> {
  @Input() appTemplateContext?: T;

  static ngTemplateContextGuard<T>(
    directive: TemplateContextDirective<T>,
    context: unknown
  ): context is T {
    console.log('!', context);
    return true;
  }
}
