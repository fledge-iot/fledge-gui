import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '../../../guards';
import { DashboardComponent } from '.';
import { NumberInputDebounceModule } from '../../common/number-input-debounce/number-input-debounce.module';
import { NgProgressModule } from 'ngx-progressbar';
import { AngularMultiSelectModule } from 'angular2-multiselect-dropdown/multiselect.component';
import { ChartModule } from '../../common/chart';

@NgModule({
  declarations: [
    DashboardComponent
  ],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    NumberInputDebounceModule,
    NgProgressModule,
    AngularMultiSelectModule,
    ChartModule
  ],
  providers: [],
  exports: []
})
export class DashboardModule { }
