import { Directive, Input } from '@angular/core';
import { NG_VALIDATORS, Validator, FormControl } from '@angular/forms';

@Directive({
  selector: '[minValue][formControlName],[minValue][formControl],[minValue][ngModel]',
  providers: [{ provide: NG_VALIDATORS, useExisting: CustomMinDirective, multi: true }]
})
export class CustomMinDirective implements Validator {
  @Input()
  minValue: number;

  validate(c: FormControl): { [key: string]: any } {
    const v = c.value;
    return (+v < +this.minValue) ? { 'minValue': true } : null;
  }
}
