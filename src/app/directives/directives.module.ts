import { NgModule } from '@angular/core';
import { NumberOnlyDirective } from './number-only.directive';
import { EqualValidatorDirective } from './equal-validator.directive';
import { InputMaskDirective } from './input-mask.directive';
import { InputTrimDirective } from './input-trim.directive';


@NgModule({
  imports: [],
  declarations: [NumberOnlyDirective, EqualValidatorDirective, InputMaskDirective, InputTrimDirective],
  exports: [NumberOnlyDirective, EqualValidatorDirective, InputMaskDirective, InputTrimDirective]
})
export class DirectivesModule { }
