import { NgModule } from '@angular/core';
import { MomentDatePipe, KeysPipe, FilterPipe } from '.';

@NgModule({
  declarations: [MomentDatePipe, KeysPipe, FilterPipe],
  exports: [MomentDatePipe, KeysPipe, FilterPipe]
})
export class PipesModule { }
