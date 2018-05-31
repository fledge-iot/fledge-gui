import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardComponent } from '.';
import { NumberInputDebounceModule } from '../../common/number-input-debounce/number-input-debounce.module';
import { NgProgressModule } from 'ngx-progressbar';
import { AngularMultiSelectModule } from 'angular2-multiselect-dropdown/multiselect.component';
import { ChartModule } from '../../common/chart';
import { StatisticsService } from '../../../services';

@NgModule({
  declarations: [
    DashboardComponent
  ],
  imports: [
    FormsModule,
    CommonModule,
    NumberInputDebounceModule,
    NgProgressModule,
    AngularMultiSelectModule,
    ChartModule
  ],
  providers: [StatisticsService],
  exports: []
})
export class DashboardModule { }
