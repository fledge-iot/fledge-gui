import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { DirectivesModule } from '../../../directives/directives.module';
import { PipesModule } from '../../../pipes/pipes.module';
import { SharedModule } from '../../../shared.module';
import { AlertDialogModule } from '../../common/alert-dialog/alert-dialog.module';
import { ListSchedulesComponent } from './list-schedules/list-schedules.component';
import { UpdateScheduleComponent } from './update-schedule/update-schedule.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { ScheduleTypeResolver } from './update-schedule/schedule-type.resolver';
import { canDeactivateGuard } from '../../../guards/can-deactivate/can-deactivate.guard';

const routes: Routes = [
  {
    path: '',
    component: ListSchedulesComponent
  },

  {
    path: ':id',
    component: UpdateScheduleComponent,
    resolve: {
      data: ScheduleTypeResolver
    },
    canDeactivate: [canDeactivateGuard]
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
    SharedModule,
    NgSelectModule
  ],
  providers: [],
  exports: []
})
export class SchedulerModule { }
