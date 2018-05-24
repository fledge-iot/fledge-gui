import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MomentDatePipe } from '.';
@NgModule({
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule],
  declarations: [MomentDatePipe],
  exports: [MomentDatePipe]
})
export class PipesModule {

}
