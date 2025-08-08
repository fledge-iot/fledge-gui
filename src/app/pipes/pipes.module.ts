import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HasAttachedDebuggerPipe } from '../components/core/debugger/has-attached-debugger.pipe';
import { DateFormatterPipe } from './date-formatter-pipe';
import { KeysPipe } from './keys';
import { CaseInsensitiveSearchPipe } from './case-insensitive-search.pipe';
import { SearchPipe } from './search.pipe';
import { TruncatePipe } from './truncate.pipe';
import { TruncateMiddleOfTextPipe } from './truncate-middle-of-text.pipe';
import { FilterPipe } from './filter';

@NgModule({
  imports: [CommonModule],
  declarations: [
    DateFormatterPipe,
    FilterPipe,
    KeysPipe,
    CaseInsensitiveSearchPipe,
    SearchPipe,
    TruncatePipe,
    TruncateMiddleOfTextPipe,
    HasAttachedDebuggerPipe
  ],
  exports: [
    DateFormatterPipe,
    FilterPipe,
    KeysPipe,
    CaseInsensitiveSearchPipe,
    SearchPipe,
    TruncatePipe,
    TruncateMiddleOfTextPipe,
    HasAttachedDebuggerPipe
  ]
})
export class PipesModule { }
