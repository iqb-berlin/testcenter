import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const samePasswordValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => (control.value.pw === control.value.pw_confirm ?
  null :
  { samePassword: true });
