import { Component, OnInit } from '@angular/core';
import { AuditService, AlertService } from '../services/index';
import { NgProgress } from 'ngx-progressbar';

@Component({
  selector: 'app-audit-log',
  templateUrl: './audit-log.component.html',
  styleUrls: ['./audit-log.component.css']
})
export class AuditLogComponent implements OnInit {
  public logSourceList = [];
  public logSeverityList = [];
  public audit: any;
  public totalCount: any;

  limit = 20;
  offset = 0;
  public source: String = '';
  public severity: String = '';

  page = 1;             // Default page is 1 in pagination
  recordCount = 0;
  tempOffset = 0;       // Temporary offset during pagination
  totalPagesCount = 0;

  isInvalidLimit = false;
  isInvalidOffset = false;

  constructor(private auditService: AuditService, private alertService: AlertService, public ngProgress: NgProgress) { }

  ngOnInit() {
    this.getLogSource();
    this.getLogSeverity();
    this.getAuditLogs();
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
      this.limit = 20;
    }
    if (this.offset > 0) {
      this.tempOffset = (((this.page) - 1) * this.limit) + this.offset;
    } else {
      this.tempOffset = ((this.page) - 1) * this.limit;
    }
    this.getAuditLogs();
  }

  public getLogSource() {
    this.auditService.getLogSource().
      subscribe(
      data => {
        if (data.error) {
          console.log('error in response', data.error);
          this.alertService.error(data.error.message);
          return;
        }
        this.logSourceList = data.logCode;
        console.log('Log code', this.logSourceList);
      },
      error => { console.log('error', error); });
  }

  public getLogSeverity() {
    this.auditService.getLogSeverity().
      subscribe(
      data => {
        if (data.error) {
          console.log('error in response', data.error);
          this.alertService.error(data.error.message);
          return;
        }
        this.logSeverityList = data.logSeverity;
        console.log('Log severity ', this.logSeverityList);
      },
      error => { console.log('error', error); });
  }

  public setLimit(limit) {
    this.isInvalidLimit = false;
    if (+limit > 1000) {
      this.isInvalidLimit = true; // limit range validation 
      return;
    }
    if (this.page !== 1) {
      this.page = 1;
      this.tempOffset = this.offset;
    }
    if (limit === '' || limit == 0 || limit === null || limit === undefined) {
      limit = 20;
    }
    this.limit = limit;
    console.log('Limit: ', this.limit);
    this.totalPages();
    this.getAuditLogs();
  }

  public setOffset(offset: number) {
    this.isInvalidOffset = false;
    if (offset > 2147483647) {
      this.isInvalidOffset = true; // offset range validation
      return;
    }

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
    this.getAuditLogs();
  }

  public getAuditLogs(): void {
    if (this.limit == null) {
      this.limit = 0;
    }
    if (this.offset == null) {
      this.offset = 0;
    }
    this.auditLogSubscriber();
  }

  public filterSource(type, event) {
    if (type === 'source') {
      this.source = event.target.value.trim().toLowerCase() === 'source' ? '' : event.target.value.trim().toLowerCase();
    }
    if (type === 'severity') {
      this.severity = event.target.value.trim().toLowerCase() === 'severity' ? '' : event.target.value.trim().toLowerCase();
    }
    if (this.offset !== 0) {
      this.recordCount = this.totalCount - this.offset;
    }
    this.auditLogSubscriber();
  }

  auditLogSubscriber() {
    /** request started */
    this.ngProgress.start();
    this.auditService.getAuditLogs(this.limit, this.tempOffset, this.source, this.severity).
      subscribe(
      data => {
        /** request completed */
        this.ngProgress.done();
        if (data.error) {
          console.log('error in response', data.error);
          this.alertService.error(data.error.message);
          return;
        }
        this.audit = data.audit;
        this.totalCount = data.totalCount;
        console.log('Audit Logs', this.audit, 'Total count', this.totalCount);
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
        console.log('error', error);
      });
  }
}
