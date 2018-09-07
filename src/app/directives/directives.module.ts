import { NgModule } from '@angular/core';
import { NumberOnlyDirective } from './number-only.directive';
import { EqualValidatorDirective } from './equal-validator.directive';
import { InputMaskDirective } from './input-mask.directive';
import { InputTrimDirective } from './input-trim.directive';
import { CustomMinDirective } from './custom-min-validator.directive';
import { CustomMaxDirective } from './custom-max-validator.directive';
import { CustomJsonDirective } from './custom-json-validator.directive';


@NgModule({
  imports: [],
  declarations: [NumberOnlyDirective, CustomMinDirective, EqualValidatorDirective, InputMaskDirective,
    InputTrimDirective, CustomMinDirective, CustomMaxDirective, CustomJsonDirective],
  exports: [NumberOnlyDirective, EqualValidatorDirective, InputMaskDirective, InputTrimDirective,
    CustomMinDirective, CustomMaxDirective, CustomJsonDirective]
})
export class DirectivesModule { }
