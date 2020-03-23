import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DashboardComponent } from '.';
import { DateFormatterPipe } from '../../../pipes';
import { StatisticsService } from '../../../services';
import { NumberInputDebounceModule } from '../../common/number-input-debounce/number-input-debounce.module';
import * as PlotlyJS from 'plotly.js/dist/plotly.js';
import { PlotlyModule } from 'angular-plotly.js';

PlotlyModule.plotlyjs = PlotlyJS;

@NgModule({
  declarations: [
    DashboardComponent
  ],
  imports: [
    FormsModule,
    CommonModule,
    NumberInputDebounceModule,
    PlotlyModule
  ],
  providers: [StatisticsService, DateFormatterPipe],
  exports: []
})
export class DashboardModule { }
