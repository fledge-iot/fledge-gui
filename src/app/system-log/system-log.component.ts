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
  DEFAULT_LIMIT = 50;
  limit = this.DEFAULT_LIMIT;
  offset = 0;

  page = 1;
  recordCount = 0;
  tempOffset = 0;
  totalPagesCount = 0;

  constructor(private systemLogService: SystemLogService, private alertService: AlertService, public ngProgress: NgProgress) { }

  ngOnInit() {
    this.getSysLogs();
  }

  /**
   *  Go to the page on which user clicked in pagination
   */
  goToPage(n: number): void {
    this.page = n;
    this.setLimitOffset();
  }

  /**
   *  Go to the next page
   */
  onNext(): void {
    this.page++;
    this.setLimitOffset();
  }

  /**
   *  Go to the first page
   */
  onFirst(): void {
    this.page = 1;
    this.setLimitOffset();
  }

  /**
  *  Calculate number of pages for pagination based on total records;
  */
  public totalPages() {
    this.totalPagesCount = Math.ceil(this.recordCount / this.limit) || 0;
  }

  public setLimit(limit) {
    if (this.page !== 1) {
      this.page = 1;
      this.tempOffset = this.offset;
    }
    if (limit === '' || limit == 0 || limit === null || limit === undefined) {
      limit = this.DEFAULT_LIMIT;
    }
    this.limit = limit;
    console.log('Limit: ', this.limit);
    this.totalPages();
    this.getSysLogs();
  }

  public setOffset(offset: number) {
    if (this.page !== 1) {
      this.page = 1;
    }
    if (offset === null || offset === undefined) {
      offset = 0;
    }
    this.offset = offset;
    console.log('Offset: ', this.offset);
    this.tempOffset = offset;
    this.totalPages();
    this.getSysLogs();
  }

  /**
   *  Go to the last page
   */
  onLast(n: number): void {
    const p = Math.ceil(this.recordCount / this.limit) || 0;
    this.page = p;
    this.setLimitOffset();
  }

  /**
   *  Go to the previous page
   */
  onPrev(): void {
    this.page--;
    this.setLimitOffset();
  }

  /**
   *  Set limit and offset (it is internally called by goToPage(), onNext(), onPrev(), onFirst(), onLast() methods)
   */
  setLimitOffset() {
    if (this.limit === 0) {
      this.limit = this.DEFAULT_LIMIT;
    }
    if (this.offset > 0) {
      this.tempOffset = (((this.page) - 1) * this.limit) + this.offset;
    } else {
      this.tempOffset = ((this.page) - 1) * this.limit;
    }
    this.getSysLogs();
  }

  public filterSource(event) {
    this.limit = this.DEFAULT_LIMIT;
    this.offset = 0;
    this.tempOffset = 0;
    this.source = event.target.value.trim().toLowerCase() === 'all' ? '' : event.target.value.trim().toLowerCase();
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
          this.totalCount = data.count;
          console.log('System Logs', this.logs, 'Total count', this.totalCount);
          if (this.offset !== 0) {
            this.recordCount = this.totalCount - this.offset;
          } else {
            this.recordCount = this.totalCount;
          }
          this.totalPages();
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
