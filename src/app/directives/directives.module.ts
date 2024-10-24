import { NgModule } from '@angular/core';

import { CustomJsonDirective } from './custom-json-validator.directive';
import { CustomMaxDirective } from './custom-max-validator.directive';
import { CustomMinDirective } from './custom-min-validator.directive';
import { EqualValidatorDirective } from './equal-validator.directive';
import { InputMaskDirective } from './input-mask.directive';
import { InputTrimDirective } from './input-trim.directive';
import { NumberOnlyDirective } from './number-only.directive';
import { AccessControlDirective } from './access-control.directive';
import { DisableUntilResponseDirective } from './disable-until-response.directive';
import { IntegerOnlyDirective } from './integer-only.directive';
import { EmptySpaceValidatorDirective } from './empty-space-validator.directive';
import { FloatOnlyDirective } from './float-only.directive';
import { MaxLengthDirective } from './max-length.directive';

@NgModule({
  imports: [],
  declarations: [
    NumberOnlyDirective, CustomMinDirective,
    EqualValidatorDirective, InputMaskDirective,
    InputTrimDirective, CustomMinDirective,
    CustomMaxDirective, CustomJsonDirective,
    AccessControlDirective, DisableUntilResponseDirective,
    IntegerOnlyDirective, EmptySpaceValidatorDirective,
    FloatOnlyDirective, MaxLengthDirective
  ],
  exports: [
    NumberOnlyDirective, EqualValidatorDirective,
    InputMaskDirective, InputTrimDirective,
    CustomMinDirective, CustomMaxDirective,
    CustomJsonDirective, AccessControlDirective,
    DisableUntilResponseDirective, IntegerOnlyDirective,
    EmptySpaceValidatorDirective, FloatOnlyDirective,
    MaxLengthDirective]
})
export class DirectivesModule { }
