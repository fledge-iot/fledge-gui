import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgProgressModule } from 'ngx-progressbar';

import { PipesModule } from '../../../pipes/pipes.module';
import { AssetsService, PluginsService, SchedulesService, ServicesHealthService } from '../../../services';
import { SharedModule } from '../../../shared.module';
import { AlertDialogModule } from '../../common/alert-dialog/alert-dialog.module';
import { AddFilterWizardComponent } from './add-filter-wizard/add-filter-wizard.component';

@NgModule({
  declarations: [
   AddFilterWizardComponent
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    NgProgressModule,
    AlertDialogModule,
    SharedModule,
    PipesModule
  ],
  exports: [AddFilterWizardComponent],
  providers: [ServicesHealthService, AssetsService, SchedulesService, PluginsService],
})
export class FilterModule { }
