import { NgModule } from '@angular/core';

import { DateFormatterPipe, FilterPipe, KeysPipe, SearchPipe, TruncatePipe } from '.';

@NgModule({
  declarations: [DateFormatterPipe, KeysPipe, FilterPipe, SearchPipe, TruncatePipe],
  exports: [DateFormatterPipe, KeysPipe, FilterPipe, SearchPipe, TruncatePipe]
})
export class PipesModule { }
