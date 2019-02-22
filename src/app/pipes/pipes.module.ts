import { NgModule } from '@angular/core';

import { DateFormatterPipe, FilterPipe, KeysPipe } from '.';

@NgModule({
  declarations: [DateFormatterPipe, KeysPipe, FilterPipe],
  exports: [DateFormatterPipe, KeysPipe, FilterPipe]
})
export class PipesModule { }
