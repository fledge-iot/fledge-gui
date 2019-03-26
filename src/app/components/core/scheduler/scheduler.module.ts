import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { DirectivesModule } from '../../../directives/directives.module';
import { AuthCheckGuard } from '../../../guards';
import { PipesModule } from '../../../pipes/pipes.module';
import { SharedModule } from '../../../shared.module';
import { AlertDialogModule } from '../../common/alert-dialog/alert-dialog.module';
import { ListSchedulesComponent } from './list-schedules/list-schedules.component';
import { UpdateScheduleComponent } from './update-schedule/update-schedule.component';

const routes: Routes = [
  {
    path: '',
    component: ListSchedulesComponent,
    canActivate: [AuthCheckGuard]
  }
];

@NgModule({
  declarations: [
    UpdateScheduleComponent,
    ListSchedulesComponent
  ],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    RouterModule.forChild(routes),
    PipesModule,
    AlertDialogModule,
    DirectivesModule,
    SharedModule
  ],
  providers: [],
  exports: []
})
export class SchedulerModule { }
