import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { NgProgressModule } from 'ngx-progressbar';

import { AuthCheckGuard } from '../../../guards';
import { SharedModule } from '../../../shared.module';
import { AlertDialogModule } from '../../common/alert-dialog/alert-dialog.module';
import { NorthComponent } from './north.component';
import { AddTaskWizardComponent } from './add-task-wizard/add-task-wizard.component';
import { NorthTaskModalComponent } from './north-task-modal/north-task-modal.component';
import { DirectivesModule } from '../../../directives/directives.module';

import { PipesModule } from '../../../pipes/pipes.module';

const routes: Routes = [

  {
    path: '',
    component: NorthComponent,
    canActivate: [AuthCheckGuard]
  },
  {
    path: 'add',
    component: AddTaskWizardComponent,
    canActivate: [AuthCheckGuard]
  }
];

@NgModule({
  declarations: [
    NorthComponent,
    AddTaskWizardComponent,
    NorthTaskModalComponent
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    RouterModule.forChild(routes),
    NgProgressModule,
    AlertDialogModule,
    SharedModule,
    PipesModule,
    DirectivesModule
  ],
  providers: [],
})
export class NorthModule { }
