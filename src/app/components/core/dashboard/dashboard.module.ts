import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { PipesModule } from '../../../pipes/pipes.module';
import { SharedModule } from '../../../shared.module';
import { ChartModule } from '../../common/chart';
import { DashboardComponent } from './dashboard.component';
import { StatisticsService } from '../../../services/statistics.service';
import { AlertService } from '../../../services/alert.service';
import { PingService } from '../../../services/ping.service';
import { DocService } from '../../../services/doc.service';
import { DateFormatterPipe } from '../../../pipes';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent
  }
];

@NgModule({
  declarations: [
    DashboardComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    PipesModule,
    ChartModule,
    SharedModule
  ],
  providers: [
    StatisticsService,
    AlertService,
    PingService,
    DocService,
    DateFormatterPipe
  ]
})
export class DashboardModule { }
