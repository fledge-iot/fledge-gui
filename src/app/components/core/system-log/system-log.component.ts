import { Component, OnInit, OnDestroy } from '@angular/core';
import { interval, Subject } from 'rxjs';
import { takeWhile, takeUntil } from 'rxjs/operators';
import { AlertService, SystemLogService, PingService } from '../../../services';
import { POLLING_INTERVAL } from '../../../utils';

@Component({
  selector: 'app-system-log',
  templateUrl: './system-log.component.html',
  styleUrls: ['./system-log.component.css']
})
export class SystemLogComponent implements OnInit, OnDestroy {
  public logs: any;
  public source: String = '';
  public level: String = '';
  public totalCount: any;
  DEFAULT_LIMIT = 20;
  limit = this.DEFAULT_LIMIT;
  private isAlive: boolean;

  public refreshInterval = POLLING_INTERVAL;
  destroy$: Subject<boolean> = new Subject<boolean>();

  page = 1;
  recordCount = 0;
  totalPagesCount = 0;

  constructor(private systemLogService: SystemLogService,
    private alertService: AlertService,
    private ping: PingService) {
      this.isAlive = true;
      this.ping.pingIntervalChanged
        .pipe(takeUntil(this.destroy$))
        .subscribe((timeInterval: number) => {
          if (timeInterval === -1) {
            this.isAlive = false;
          }
          this.refreshInterval = timeInterval;
        });
    }

  ngOnInit() {
    this.getSysLogs();
    interval(this.refreshInterval)
      .pipe(takeWhile(() => this.isAlive), takeUntil(this.destroy$)) // only fires when component is alive
      .subscribe(() => {
        this.getSysLogs();
      });
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
    this.limit = 0;
    if (this.page !== 1) {
      this.page = 1;
    }
    if (limit === '' || limit === 0 || limit === null || limit === undefined) {
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
    this.totalPages();
    this.getSysLogs();
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

  /**
   *  Set limit and offset (it is internally called by goToPage(), onNext(), onPrev(), onFirst(), onLast() methods)
   */
  setLimitOffset() {
    if (this.limit === 0) {
      this.limit = this.DEFAULT_LIMIT;
    }
    this.getSysLogs();
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

  public filterData(filter: string, value: string) {
    this.limit = 0;
    this.recordCount = 0;
    if (this.page !== 1) {
      this.page = 1;
    }
    if (filter === 'source') {
      this.source = value.trim().toLowerCase() === 'all' ? '' : value.trim().toLowerCase();
    } else {
      this.level = value.trim().toLowerCase() === 'info' ? '' : value.trim().toLowerCase();
    }
    this.getSysLogs();
  }

  public getSysLogs() {
    if (this.limit === 0) {
      this.limit = this.DEFAULT_LIMIT;
    }
    this.systemLogService.getSysLogs(this.limit, this.source, this.level).
      subscribe(
        (data) => {
          const logs = [];
          data['logs'].forEach(l => {
            let fl = l.replace('INFO:', '<span class="tag is-light tag-syslog">INFO:</span>'); // is-info
            fl = fl.replace('WARNING:', '<span class="tag is-warning tag-syslog">WARNING:</span>');
            fl = fl.replace('ERROR:', '<span class="tag is-danger tag-syslog">ERROR:</span>');
            fl = fl.replace('EXCEPTION:', '<span class="tag is-danger tag-syslog">EXCEPTION:</span>');
            logs.push(fl);
          });

          this.logs = logs.reverse();
          this.totalCount = data['count'];
          this.recordCount = this.totalCount;
          this.totalPages();
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public ngOnDestroy(): void {
    this.isAlive = false;
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
