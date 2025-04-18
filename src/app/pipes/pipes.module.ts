import { NgModule } from '@angular/core';

import { DateFormatterPipe, FilterPipe, KeysPipe, SearchPipe, TruncatePipe, TruncateMiddleOfTextPipe } from '.';
import { HasAttachedDebuggerPipe } from '../components/core/debugger/has-attached-debugger.pipe';

@NgModule({
  declarations: [DateFormatterPipe, KeysPipe, FilterPipe, SearchPipe, TruncatePipe, TruncateMiddleOfTextPipe, HasAttachedDebuggerPipe],
  exports: [DateFormatterPipe, KeysPipe, FilterPipe, SearchPipe, TruncatePipe, TruncateMiddleOfTextPipe, HasAttachedDebuggerPipe]
})
export class PipesModule { }
