import { NgModule } from '@angular/core';

import { DateFormatterPipe, FilterPipe, KeysPipe, SearchPipe, TruncatePipe, TruncateMiddleOfTextPipe } from '.';

@NgModule({
  declarations: [DateFormatterPipe, KeysPipe, FilterPipe, SearchPipe, TruncatePipe, TruncateMiddleOfTextPipe],
  exports: [DateFormatterPipe, KeysPipe, FilterPipe, SearchPipe, TruncatePipe, TruncateMiddleOfTextPipe]
})
export class PipesModule { }
