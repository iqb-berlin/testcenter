import { Directive, Input } from '@angular/core';

@Directive({
  selector: '[appTemplateContext]'
})
export class TemplateContextDirective<T> {
  @Input() appTemplateContext?: T | undefined;

  static ngTemplateContextGuard<T>(
    directive: TemplateContextDirective<T>,
    context: unknown
  ): context is T {
    return true;
  }
}
