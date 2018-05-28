import { Component, OnInit, ViewChild } from '@angular/core';
import { SchedulesService, AlertService } from '../../../../services/index';
import { UpdateScheduleComponent } from '../../scheduler/update-schedule/update-schedule.component';
import Utils from '../../../../utils';
import { CreateScheduleComponent } from '../create-schedule/create-schedule.component';
import { NgProgress } from 'ngx-progressbar';
import { AlertDialogComponent } from '../../../common/alert-dialog/alert-dialog.component';

enum weekDays {
  Mon = 1,
  Tue = 2,
  Wed = 3,
  Thu = 4,
  Fri = 5,
  Sat = 6,
  Sun = 7
}

@Component({
  selector: 'app-scheduled-process',
  templateUrl: './scheduled-process.component.html',
  styleUrls: ['./scheduled-process.component.css']
})
export class ScheduledProcessComponent implements OnInit {
  constructor() { }
  ngOnInit() { }
}
