import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { DirectivesModule } from '../../../directives/directives.module';
import { RolesGuard } from '../../../guards';
import { PipesModule } from '../../../pipes/pipes.module';
import { SharedModule } from '../../../shared.module';
import { PluginService } from '../../../services';
import { AlertDialogModule } from '../../common/alert-dialog/alert-dialog.module';
import { AddTaskWizardComponent } from './add-task-wizard/add-task-wizard.component';
import { NorthTaskModalComponent } from './north-task-modal/north-task-modal.component';
import { NorthComponent } from './north.component';
import { FilterModule } from '../filter/filter.module';
import { DragDropModule } from '@angular/cdk/drag-drop';

const routes: Routes = [
  {
    path: '',
    component: NorthComponent
  },
  {
    path: 'add',
    component: AddTaskWizardComponent,
    canActivate: [RolesGuard]
  },
  {
    path: ':name/details',
    component: NorthTaskModalComponent
  }
];

@NgModule({
  declarations: [
    NorthComponent,
    // AddTaskWizardComponent,
    NorthTaskModalComponent
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    RouterModule.forChild(routes),
    DragDropModule,
    AlertDialogModule,
    PipesModule,
    DirectivesModule,
    FilterModule,
    SharedModule
  ],
  providers: [RolesGuard, PluginService],
})
export class NorthModule { }
