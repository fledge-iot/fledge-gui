import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ScheduledProcessComponent } from './scheduled-process/scheduled-process.component';
import { ListTasksComponent } from './list-tasks/list-tasks.component';
import { CreateScheduleComponent } from './create-schedule/create-schedule.component';
import { UpdateScheduleComponent } from './update-schedule/update-schedule.component';
import { NgProgressModule } from 'ngx-progressbar';
import { SchedulesService } from '../../../services';
import { PipesModule } from '../../../pipes/pipes.module';
import { AlertDialogModule } from '../../common/alert-dialog/alert-dialog.module';
import { ListSchedulesComponent } from './list-schedules/list-schedules.component';

import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '../../../guards';
import { InputMaskDirective } from '../../../directives/input-mask.directive';

const routes: Routes = [
  {
    path: '',
    component: ScheduledProcessComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  declarations: [
    ScheduledProcessComponent,
    ListTasksComponent,
    CreateScheduleComponent,
    UpdateScheduleComponent,
    ListSchedulesComponent,
    InputMaskDirective
  ],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    RouterModule.forChild(routes),
    NgProgressModule,
    PipesModule,
    AlertDialogModule
  ],
  providers: [],
  exports: [InputMaskDirective]
})
export class SchedulerModule { }
