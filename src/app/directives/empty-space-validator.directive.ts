import { Directive } from '@angular/core';
import { NG_VALIDATORS, Validator, AbstractControl } from '@angular/forms';

@Directive({
  selector: '[nospaceValidator]',
  providers: [{ provide: NG_VALIDATORS, useExisting: EmptySpaceValidatorDirective, multi: true }]
})
export class EmptySpaceValidatorDirective implements Validator {

  constructor() { }

  nospaceValidator(control: AbstractControl): { [s: string]: boolean } {
    if (control.value && control.value.trim() === '') {
      return { nospace: true };
    }
  }

  validate(control: AbstractControl): { [key: string]: any } | null {
    return this.nospaceValidator(control);
  }
}