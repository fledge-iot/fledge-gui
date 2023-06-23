import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { PipesModule } from '../../../pipes/pipes.module';
import { AssetsService, FilterService, SchedulesService, ServicesApiService } from '../../../services';
import { SharedModule } from '../../../shared.module';
import { AlertDialogModule } from '../../common/alert-dialog/alert-dialog.module';
import { AddFilterWizardComponent } from './add-filter-wizard/add-filter-wizard.component';
import { FilterAlertComponent } from './filter-alert/filter-alert.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { FilterListComponent } from './filter-list/filter-list.component';
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [
    AddFilterWizardComponent,
    FilterAlertComponent,
    FilterListComponent
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    AlertDialogModule,
    SharedModule,
    DragDropModule,
    PipesModule,
    NgSelectModule
  ],
  exports: [AddFilterWizardComponent, FilterAlertComponent, FilterListComponent],
  providers: [ServicesApiService, AssetsService, SchedulesService, FilterService],
})
export class FilterModule { }
