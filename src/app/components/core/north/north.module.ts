import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { NgProgressModule } from 'ngx-progressbar';

import { DirectivesModule } from '../../../directives/directives.module';
import { AuthCheckGuard } from '../../../guards';
import { PipesModule } from '../../../pipes/pipes.module';
import { SharedModule } from '../../../shared.module';
import { AlertDialogModule } from '../../common/alert-dialog/alert-dialog.module';
import { AddTaskWizardComponent } from './add-task-wizard/add-task-wizard.component';
import { NorthTaskModalComponent } from './north-task-modal/north-task-modal.component';
import { NorthComponent } from './north.component';

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
    PipesModule,
    DirectivesModule,
    SharedModule
  ],
  providers: [],
})
export class NorthModule { }
