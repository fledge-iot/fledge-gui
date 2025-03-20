import { NgModule } from '@angular/core';

import { DateFormatterPipe, FilterPipe, KeysPipe, SearchPipe, TruncatePipe, CenterTruncatePipe } from '.';

@NgModule({
  declarations: [DateFormatterPipe, KeysPipe, FilterPipe, SearchPipe, TruncatePipe, CenterTruncatePipe],
  exports: [DateFormatterPipe, KeysPipe, FilterPipe, SearchPipe, TruncatePipe, CenterTruncatePipe]
})
export class PipesModule { }
