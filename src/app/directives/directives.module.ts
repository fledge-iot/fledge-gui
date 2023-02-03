import { NgModule } from '@angular/core';

import { CustomJsonDirective } from './custom-json-validator.directive';
import { CustomMaxDirective } from './custom-max-validator.directive';
import { CustomMinDirective } from './custom-min-validator.directive';
import { EqualValidatorDirective } from './equal-validator.directive';
import { InputMaskDirective } from './input-mask.directive';
import { InputTrimDirective } from './input-trim.directive';
import { NumberOnlyDirective } from './number-only.directive';
import { RestrictSpecialCharDirective } from './restrict-special-char.directive';
import { AccessControlDirective } from './access-control.directive';

@NgModule({
  imports: [],
  declarations: [NumberOnlyDirective, RestrictSpecialCharDirective, CustomMinDirective, EqualValidatorDirective, InputMaskDirective,
    InputTrimDirective, CustomMinDirective, CustomMaxDirective, CustomJsonDirective, AccessControlDirective],
  exports: [NumberOnlyDirective, RestrictSpecialCharDirective, EqualValidatorDirective, InputMaskDirective, InputTrimDirective,
    CustomMinDirective, CustomMaxDirective, CustomJsonDirective, AccessControlDirective]
})
export class DirectivesModule { }
