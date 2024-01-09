import { Directive, Input } from '@angular/core';
import { UntypedFormControl, NG_VALIDATORS, Validator } from '@angular/forms';

@Directive({
  selector: '[minValue][formControlName],[minValue][formControl],[minValue][ngModel]',
  providers: [{ provide: NG_VALIDATORS, useExisting: CustomMinDirective, multi: true }]
})
export class CustomMinDirective implements Validator {
  @Input()
  minValue: number;

  validate(c: UntypedFormControl): { [key: string]: any } {
    const v = c.value;
    return (+v < +this.minValue) ? { 'minValue': true } : null;
  }
}
