import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { NgProgressModule } from 'ngx-progressbar';
import { SharedModule } from '../../../shared.module';

import { PipesModule } from '../../../pipes/pipes.module';
import { AlertDialogModule } from '../../common/alert-dialog/alert-dialog.module';
import { ListSchedulesComponent } from './list-schedules/list-schedules.component';
import { ListTasksComponent } from './list-tasks/list-tasks.component';
import { ScheduledProcessComponent } from './scheduled-process/scheduled-process.component';
import { UpdateScheduleComponent } from './update-schedule/update-schedule.component';
import { AuthCheckGuard } from '../../../guards';
import { DirectivesModule } from '../../../directives/directives.module';

const routes: Routes = [
  {
    path: '',
    component: ScheduledProcessComponent,
    canActivate: [AuthCheckGuard]
  }
];

@NgModule({
  declarations: [
    ScheduledProcessComponent,
    ListTasksComponent,
    UpdateScheduleComponent,
    ListSchedulesComponent
  ],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    RouterModule.forChild(routes),
    NgProgressModule,
    PipesModule,
    AlertDialogModule,
    DirectivesModule,
    SharedModule
  ],
  providers: [],
  exports: []
})
export class SchedulerModule { }
