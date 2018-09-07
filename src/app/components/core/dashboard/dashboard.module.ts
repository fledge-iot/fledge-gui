import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardComponent } from '.';
import { NumberInputDebounceModule } from '../../common/number-input-debounce/number-input-debounce.module';
import { NgProgressModule } from 'ngx-progressbar';
import { ChartModule } from '../../common/chart';
import { StatisticsService } from '../../../services';
import { DateFormatterPipe } from '../../../pipes';

@NgModule({
  declarations: [
    DashboardComponent
  ],
  imports: [
    FormsModule,
    CommonModule,
    NumberInputDebounceModule,
    NgProgressModule,
    ChartModule,
  ],
  providers: [StatisticsService, DateFormatterPipe],
  exports: []
})
export class DashboardModule { }
