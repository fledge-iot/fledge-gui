import { Directive, Input } from '@angular/core';
import { NG_VALIDATORS, Validator, FormControl } from '@angular/forms';

@Directive({
  selector: '[jsonValue][formControlName],[jsonValue][formControl],[jsonValue][ngModel]',
  providers: [{ provide: NG_VALIDATORS, useExisting: CustomJsonDirective, multi: true }]
})
export class CustomJsonDirective implements Validator {
  @Input()
  jsonValue: string;
  parseError: boolean;
  validate(c: FormControl): { [key: string]: any } {
    const v = c.value;
    try {
      this.jsonValue = JSON.parse(v);
      this.parseError = false;
    } catch (ex) {
      this.parseError = true;
    }
    return (this.parseError) ? { 'jsonValue': true } : null;
  }
}
