import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PipesModule } from '../../../pipes/pipes.module';
import { SharedModule } from '../../../shared.module';
import { ChartModule } from '../../common/chart';
import { DashboardComponent } from './dashboard.component';
import { StatisticsService } from '../../../services/statistics.service';
import { DateFormatterPipe } from '../../../pipes';

@NgModule({
  declarations: [
    DashboardComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    PipesModule,
    ChartModule,
    SharedModule
  ],
  providers: [
    StatisticsService,
    DateFormatterPipe
  ]
})
export class DashboardModule { }
