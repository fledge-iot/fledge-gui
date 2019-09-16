import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DashboardComponent } from '.';
import { DateFormatterPipe } from '../../../pipes';
import { StatisticsService } from '../../../services';
import { ChartModule } from '../../common/chart';
import { NumberInputDebounceModule } from '../../common/number-input-debounce/number-input-debounce.module';

@NgModule({
  declarations: [
    DashboardComponent
  ],
  imports: [
    FormsModule,
    CommonModule,
    NumberInputDebounceModule,
    ChartModule,
  ],
  providers: [StatisticsService, DateFormatterPipe],
  exports: []
})
export class DashboardModule { }
