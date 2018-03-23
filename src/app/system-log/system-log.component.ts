import { Component, OnInit } from '@angular/core';
import { SystemLogService, AlertService } from '../services/index';
import { NgProgress } from 'ngx-progressbar';

@Component({
  selector: 'app-system-log',
  templateUrl: './system-log.component.html',
  styleUrls: ['./system-log.component.css']
})
export class SystemLogComponent implements OnInit {
  public logs: any;
  public source: String = '';
  public totalCount: any;

  limit = 20;
  offset = 0;

  recordCount = 0;
  tempOffset = 0;
  totalPagesCount = 0;

  constructor(private systemLogService: SystemLogService, private alertService: AlertService, public ngProgress: NgProgress) { }

  ngOnInit() {
    this.getSysLogs();
  }

  public setLimit(limit) {
    this.limit = limit;
    console.log('Limit: ', this.limit);
    this.getSysLogs();
  }

  public setOffset(offset: number) {
    this.offset = offset;
    console.log('Offset: ', this.offset);
    this.tempOffset = offset;
    this.getSysLogs();
  }

  public filterSource(event) {
    this.source = event.target.value.trim().toLowerCase() === 'all' ? '' : event.target.value.trim().toLowerCase();
    if (this.offset !== 0) {
      this.recordCount = this.totalCount - this.offset;
    }
    this.getSysLogs();
  }

  public getSysLogs() {
    /** request started */
    this.ngProgress.start();
    this.systemLogService.getSysLogs(this.limit, this.tempOffset, this.source).
      subscribe(
        data => {
          /** request completed */
          this.ngProgress.done();
          this.logs = data.logs;
          this.totalCount = data.totalCount;
          console.log('System Logs', this.logs, 'Total count', this.totalCount);
          if (this.offset !== 0) {
            this.recordCount = this.totalCount - this.offset;
          } else {
            this.recordCount = this.totalCount;
          }
        },
        error => {
          /** request completed */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }
}
