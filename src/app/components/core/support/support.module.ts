import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DateFormatterPipe } from '../../../pipes';
import { StatisticsService } from '../../../services';
import { NumberInputDebounceModule } from '../../common/number-input-debounce/number-input-debounce.module';
import { Routes, RouterModule } from '@angular/router';
import { AuthCheckGuard } from '../../../guards';
import { SupportComponent } from './support.component';


const routes: Routes = [
  {
    path: '',
    component: SupportComponent,
    canActivate: [AuthCheckGuard]
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
    NumberInputDebounceModule
  ],
  providers: [StatisticsService, DateFormatterPipe],
  exports: []
})
export class SupportModule { }
