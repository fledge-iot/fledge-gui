import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ScheduledProcessComponent } from './scheduled-process/scheduled-process.component';
import { ListTasksComponent } from './list-tasks/list-tasks.component';
import { CreateScheduleComponent } from './create-schedule/create-schedule.component';
import { UpdateScheduleComponent } from './update-schedule/update-schedule.component';
import { NgProgressModule } from 'ngx-progressbar';
import { ModalComponent } from '../modal/modal.component';
import { SchedulesService } from '../services';
import { NgxMaskModule } from 'ngx-mask';
import { PipesModule } from '../pipes/pipes.module';

@NgModule({
  declarations: [
    ScheduledProcessComponent,
    ListTasksComponent,
    CreateScheduleComponent,
    UpdateScheduleComponent,
    ModalComponent
  ],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    NgProgressModule,
    NgxMaskModule,
    PipesModule
  ],
  providers: [SchedulesService],
  exports: [ModalComponent]
})
export class SchedulerModule {

}
