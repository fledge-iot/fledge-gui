import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { NgProgressModule } from 'ngx-progressbar';
import { SharedModule } from '../../../shared.module';

import { InputMaskDirective } from '../../../directives/input-mask.directive';
import { PipesModule } from '../../../pipes/pipes.module';
import { AlertDialogModule } from '../../common/alert-dialog/alert-dialog.module';
import { CreateScheduleComponent } from './create-schedule/create-schedule.component';
import { ListSchedulesComponent } from './list-schedules/list-schedules.component';
import { ListTasksComponent } from './list-tasks/list-tasks.component';
import { ScheduledProcessComponent } from './scheduled-process/scheduled-process.component';
import { UpdateScheduleComponent } from './update-schedule/update-schedule.component';
import { AddTaskWizardComponent } from './add-task-wizard/add-task-wizard.component';
import { AuthCheckGuard } from '../../../guards';

const routes: Routes = [
  {
    path: '',
    component: ScheduledProcessComponent,
    canActivate: [AuthCheckGuard]
  },
  {
    path: 'add-task',
    component: AddTaskWizardComponent,
    canActivate: [AuthCheckGuard]
  }
];

@NgModule({
  declarations: [
    ScheduledProcessComponent,
    ListTasksComponent,
    CreateScheduleComponent,
    UpdateScheduleComponent,
    ListSchedulesComponent,
    InputMaskDirective,
    AddTaskWizardComponent
  ],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    RouterModule.forChild(routes),
    NgProgressModule,
    PipesModule,
    AlertDialogModule,
    SharedModule
  ],
  providers: [],
  exports: [InputMaskDirective]
})
export class SchedulerModule { }
