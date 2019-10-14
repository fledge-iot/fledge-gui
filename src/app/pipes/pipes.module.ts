import { NgModule } from '@angular/core';

import { DateFormatterPipe, FilterPipe, KeysPipe, SearchPipe} from '.';

@NgModule({
  declarations: [DateFormatterPipe, KeysPipe, FilterPipe, SearchPipe],
  exports: [DateFormatterPipe, KeysPipe, FilterPipe, SearchPipe]
})
export class PipesModule { }
