import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { PaginationComponent } from '.';

@NgModule({
  declarations: [
    PaginationComponent
  ],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule
  ],
  providers: [],
  exports: [PaginationComponent]
})
export class PaginationModule { }
