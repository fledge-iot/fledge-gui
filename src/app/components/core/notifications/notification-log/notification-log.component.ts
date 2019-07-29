import { Component, OnInit } from '@angular/core';
import { AlertService, ProgressBarService, AuditService } from '../../../../services';
import { MAX_INT_SIZE } from '../../../../utils';

@Component({
  selector: 'app-notification-log',
  templateUrl: './notification-log.component.html',
  styleUrls: ['./notification-log.component.css']
})
export class NotificationLogComponent implements OnInit {
  public logSourceList = [];
  public logSeverityList = [];
  public notificationLogs: any;
  public totalCount: any;
  public DEFAULT_LIMIT = 20;
  public MAX_RANGE = MAX_INT_SIZE;
  limit = this.DEFAULT_LIMIT;
  offset = 0;
  public source = '';
  public severity = '';

  page = 1;             // Default page is 1 in pagination
  recordCount = 0;
  tempOffset = 0;       // Temporary offset during pagination
  totalPagesCount = 0;

  isInvalidLimit = false;
  isInvalidOffset = false;

  constructor(private auditService: AuditService,
    private progress: ProgressBarService,
    private alertService: AlertService) { }

  ngOnInit() {
    this.getLogSource();
    this.getLogSeverity();
    this.getNotificationLogs();
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
  onLast(): void {
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

  public toggleDropDown(id: string) {
    const activeDropDowns = Array.prototype.slice.call(document.querySelectorAll('.dropdown.is-active'));
    if (activeDropDowns.length > 0) {
      if (activeDropDowns[0].id !== id) {
        activeDropDowns[0].classList.remove('is-active');
      }
    }
    const dropDown = document.querySelector(`#${id}`);
    dropDown.classList.toggle('is-active');
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
    this.getNotificationLogs();
  }

  public getLogSource() {
    this.auditService.getLogSource().
      subscribe(
        (data: any) => {
          this.logSourceList = data.logCode
            .filter((log: any) => /NTF/.test(log.code));
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public getLogSeverity() {
    this.auditService.getLogSeverity().
      subscribe(
        (data: any) => {
          this.logSeverityList = data.logSeverity;
          this.severity = this.logSeverityList.find(severity => severity.name.toLowerCase() === 'information').name;
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public setLimit(limit) {
    this.isInvalidLimit = false;
    if (+limit > this.MAX_RANGE) {
      this.isInvalidLimit = true; // limit range validation
      return;
    }
    if (this.page !== 1) {
      this.page = 1;
      this.tempOffset = this.offset;
    }
    if (limit === '' || limit === 0 || limit === null || limit === undefined) {
      limit = this.DEFAULT_LIMIT;
    }
    this.limit = limit;
    console.log('Limit: ', this.limit);
    this.totalPages();
    this.getNotificationLogs();
  }

  public setOffset(offset: number) {
    this.isInvalidOffset = false;
    if (offset > this.MAX_RANGE) {
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
    this.getNotificationLogs();
  }

  public filterSource(type: string, code: string) {
    this.limit = this.DEFAULT_LIMIT;
    this.offset = 0;
    this.tempOffset = 0;
    this.recordCount = 0;
    if (this.page !== 1) {
      this.page = 1;
    }

    if (type === 'source') {
      this.source = code.trim().toLowerCase() === 'source' ? '' : code.trim().toLowerCase();
    }
    if (type === 'severity') {
      this.severity = code.trim().toLowerCase() === 'severity' ? '' : code.trim().toLowerCase();
    }
    this.getNotificationLogs();
  }

  getNotificationLogs() {
    if (this.limit == null) {
      this.limit = 0;
    }
    if (this.offset == null) {
      this.offset = 0;
    }
    /** request started */
    this.progress.start();
    this.auditService.getAuditLogs(this.limit, this.tempOffset, this.source, this.severity).
      subscribe(
        (data: any) => {
          /** request completed */
          this.progress.done();
          this.notificationLogs = data.audit
            .filter((log: any) => /NTF/.test(log.source));
          this.totalCount = this.notificationLogs.length;
          if (this.offset !== 0) {
            this.recordCount = this.totalCount - this.offset;
          } else {
            this.recordCount = this.totalCount;
          }
          this.totalPages();
        },
        error => {
          /** request completed */
          this.progress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  filterByName(name: string) {
    if (!name) {
      this.getNotificationLogs();
    } else {
      this.notificationLogs = this.notificationLogs.filter((log: any) =>
        log.details.name.trim().toLowerCase().includes(name.trim().toLowerCase()));
    }
  }
}
