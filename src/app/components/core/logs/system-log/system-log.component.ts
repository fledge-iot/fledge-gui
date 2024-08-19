import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { fromEvent, interval, Subject, Subscription } from 'rxjs';
import { takeWhile, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { sortBy } from 'lodash';
import { AlertService, SystemLogService, PingService, ProgressBarService, SchedulesService } from '../../../../services';
import { POLLING_INTERVAL, DEBOUNCE_TIME } from '../../../../utils';

@Component({
  selector: 'app-system-log',
  templateUrl: './system-log.component.html',
  styleUrls: ['./system-log.component.css']
})
export class SystemLogComponent implements OnInit, OnDestroy {
  public logs: any;
  public source = '';
  public level = 'info';
  DEFAULT_LIMIT = 50;
  limit = this.DEFAULT_LIMIT;
  public isAlive: boolean;
  public scheduleData = new Set<string>();

  public refreshInterval = POLLING_INTERVAL;
  destroy$: Subject<boolean> = new Subject<boolean>();
  private subscription: Subscription;
  private fromEventSub: Subscription;

  @ViewChild('search', { static: true }) search: ElementRef

  page = 1;
  offset = 0;
  searchTerm = '';
  keyword = "";
  showConfigButton: boolean = false;
  routePath: string = '';

  @Input() sourceName: string;

  constructor(private systemLogService: SystemLogService,
    private schedulesService: SchedulesService,
    private alertService: AlertService,
    public ngProgress: ProgressBarService,
    private route: ActivatedRoute,
    private router: Router,
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

    this.route.queryParams.subscribe(params => {
      if (params['source']) {
        this.source = params['source'];
        this.getSysLogs();
      }
    });
  }

  ngOnInit() {
    this.getSysLogs();
    this.getSchedules();
    this.subscription = interval(this.refreshInterval)
      .pipe(takeWhile(() => this.isAlive), takeUntil(this.destroy$)) // only fires when component is alive
      .subscribe(() => {
        this.getSysLogs(true);
        this.getSchedules();
      });

    this.fromEventSub = fromEvent(this.search.nativeElement, 'input')    // handle search query
      .pipe(distinctUntilChanged(), debounceTime(DEBOUNCE_TIME))
      .subscribe(() => {
        this.keyword = this.search.nativeElement.value;
        this.getSysLogs();
      })
  }

  ngOnChanges() {
    if (this.sourceName) {
      this.source = this.sourceName;
    }
  }

  public getSchedules(): void {
    this.schedulesService.getSchedules().
      subscribe(
        (data: any) => {
          let serviceNorthTaskSchedules = [];
          data.schedules.forEach(sch => {
            if ('STARTUP' === sch.type.toUpperCase()) {
              serviceNorthTaskSchedules.push(sch);
            }
            // Handle north tasks
            if (['north_c', 'north'].includes(sch.processName)) {
              serviceNorthTaskSchedules.push(sch);
            }
          });
          this.scheduleData = new Set(sortBy(serviceNorthTaskSchedules, (s: any) => {
            return s.name.toLowerCase();
          }));
          if (this.source) {
            this.setRoutePath();
          }
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  /**
   *  Go to the next page
   */
  onNext(): void {
    this.page++;
    this.destroy$.next(true);
    this.setLimitOffset();
  }

  /**
   *  Go to the previous page
   */
  onPrev(): void {
    this.page--;
    if (this.page === 1) {
      this.onFirst();
      return;
    }
    this.setLimitOffset();
  }

  /**
   *  Go to the first page
   */
  onFirst(): void {
    this.page = 1;
    this.limit = this.DEFAULT_LIMIT;
    this.offset = (((this.page) - 1) * this.limit);
    this.getSysLogs();
    this.getSchedules();
    if (this.isAlive) {
      this.destroy$.next(false);
      this.toggleAutoRefresh(this.isAlive)
    }
  }

  /**
   *  Set limit and offset (it is internally called by onNext(), onPrev(), onFirst() methods)
   */
  setLimitOffset() {
    if (this.limit === 0) {
      this.limit = this.DEFAULT_LIMIT;
    }
    this.offset = (((this.page) - 1) * this.limit);
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
    this.offset = 0;
    if (this.page !== 1) {
      this.page = 1;
    }
    if (filter === 'source') {
      this.source = value.trim().toLowerCase() === 'all' ? '' : value.trim();
      if (this.source === '' || this.source === 'storage') {
        this.showConfigButton = false;
      }
      else {
        this.setRoutePath();
      }
    } else {
      this.level = value.trim().toLowerCase() === 'debug' ? '' : value.trim().toLowerCase();
    }
    this.getSysLogs();
  }

  capitalizeInitialWord(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  public getSysLogs(autoRefresh = false) {
    if (autoRefresh === false) {
      this.ngProgress.start();
    }
    if (this.limit === 0) {
      this.limit = this.DEFAULT_LIMIT;
    }
    this.systemLogService.getSysLogs(this.source, this.level, this.limit, this.offset, this.keyword).
      subscribe(
        (data) => {
          if (autoRefresh === false) {
            this.ngProgress.done();
          }
          const logs = [];
          data['logs'].forEach(l => {
            let fl = l.replace('DEBUG:', '<span class="tag is-light tag-syslog">DEBUG:</span>');
            fl = l.replace('INFO:', '<span class="tag is-white tag-syslog">INFO:</span>'); // is-info
            fl = fl.replace('WARNING:', '<span class="tag is-light is-warning tag-syslog">WARNING:</span>');
            fl = fl.replace('ERROR:', '<span class="tag is-light is-danger tag-syslog">ERROR:</span>');
            fl = fl.replace('FATAL:', '<span class="tag is-light is-danger tag-syslog">FATAL:</span>');
            fl = fl.replace('EXCEPTION:', '<span class="tag is-light is-danger tag-syslog">EXCEPTION:</span>');
            logs.push(fl);
          });
          this.logs = logs.reverse();
        },
        error => {
          if (autoRefresh === false) {
            this.ngProgress.done();
          }
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  toggleAutoRefresh(refresh: boolean) {
    this.isAlive = refresh;
    // clear interval subscription before initializing it again
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    /**
     * Set refresh interval to default if Auto Refresh checked and
     * pingInterval is set to manual on settings page
     * */
    if (this.isAlive && this.refreshInterval === -1) {
      this.refreshInterval = POLLING_INTERVAL;
    }

    // start auto refresh
    this.subscription = interval(this.refreshInterval)
      .pipe(takeWhile(() => this.isAlive && this.page === 1), takeUntil(this.destroy$)) // only fires when component is alive
      .subscribe(() => {
        this.getSysLogs(true);
        this.getSchedules();
      });
  }

  setRoutePath() {
    let sourceSchedule: any = [...this.scheduleData].find((sch: any) => sch.name === this.source)
    if (sourceSchedule?.processName.toLowerCase() === 'south_c') {
      this.routePath = '/south';
      this.showConfigButton = true;
    }
    else if (sourceSchedule?.processName.toLowerCase() === 'north_c') {
      this.routePath = '/north';
      this.showConfigButton = true;
    }
    else {
      this.showConfigButton = false;
    }
  }

  navToInstanceConfiguration() {
    this.router.navigate([this.routePath, this.source, 'details'])
  }

  public ngOnDestroy(): void {
    if (this.isAlive) {
      this.isAlive = false;
      this.destroy$.next(true);
      this.destroy$.unsubscribe();
      this.subscription.unsubscribe();
      this.fromEventSub.unsubscribe();
    }
  }
}
