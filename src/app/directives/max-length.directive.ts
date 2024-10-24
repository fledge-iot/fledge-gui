import { Directive, Input } from '@angular/core';
import { NG_VALIDATORS, UntypedFormControl, Validator } from '@angular/forms';

@Directive({
  selector: '[maxLength][formControlName],[maxLength][formControl],[maxLength][ngModel]',
  providers: [{ provide: NG_VALIDATORS, useExisting: MaxLengthDirective, multi: true }]
})
export class MaxLengthDirective implements Validator {
  @Input() maxLength: number;

  validate(control: UntypedFormControl): { [key: string]: any } {
    return this.hasValidLength(control.value) && control.value.length > this.maxLength
      ? { 'maxLength': true } : null;
  }
  hasValidLength(value: any): boolean {
    return value != null && typeof value.length === 'number';
  }
}
