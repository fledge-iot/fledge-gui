import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NumberInputDebounceComponent } from './number-input-debounce.component';

@NgModule({
  declarations: [
    NumberInputDebounceComponent
  ],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule
  ],
  providers: [],
  exports: [NumberInputDebounceComponent]
})
export class NumberInputDebounceModule { }
