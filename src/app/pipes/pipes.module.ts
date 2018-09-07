import { NgModule } from '@angular/core';
import { DateFormatterPipe, KeysPipe, FilterPipe } from '.';

@NgModule({
  declarations: [DateFormatterPipe, KeysPipe, FilterPipe],
  exports: [DateFormatterPipe, KeysPipe, FilterPipe]
})
export class PipesModule { }
