import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DateFormatterPipe } from '../../../pipes';
import { StatisticsService } from '../../../services';
import { ChartModule } from '../../common/chart';
import { NumberInputDebounceModule } from '../../common/number-input-debounce/number-input-debounce.module';
import { Routes, RouterModule } from '@angular/router';
import { SupportComponent } from './support.component';


const routes: Routes = [
  {
    path: '',
    component: SupportComponent
  }
];

@NgModule({
  declarations: [
    SupportComponent
  ],
  imports: [
    RouterModule.forChild(routes),
    FormsModule,
    CommonModule,
    NumberInputDebounceModule,
    ChartModule
  ],
  providers: [StatisticsService, DateFormatterPipe],
  exports: []
})
export class SupportModule { }
