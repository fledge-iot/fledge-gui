import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AlertService, PackagesLogService, PingService, ProgressBarService } from '../../../services';
import { sortBy } from 'lodash';
import { ViewLogsComponent } from './view-logs/view-logs.component';
import { POLLING_INTERVAL } from '../../../utils';
import { interval, Subject, Subscription } from 'rxjs';
import { takeUntil, takeWhile } from 'rxjs/operators';

@Component({
  selector: 'app-packages-log',
  templateUrl: './packages-log.component.html',
  styleUrls: ['./packages-log.component.css']
})
export class PackagesLogComponent implements OnInit, OnDestroy {
  public logList = [];

  @ViewChild(ViewLogsComponent) viewLogsModal: ViewLogsComponent;

  public isAlive: boolean;
  public refreshInterval = POLLING_INTERVAL;
  destroy$: Subject<boolean> = new Subject<boolean>();
  private subscription: Subscription;

  constructor(private packagesLogService: PackagesLogService,
    private ngProgress: ProgressBarService,
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
    this.getPackagesLog();
    this.subscription = interval(this.refreshInterval)
      .pipe(takeWhile(() => this.isAlive), takeUntil(this.destroy$)) // only fires when component is alive
      .subscribe(() => {
        this.getPackagesLog(true);
      });
  }

  public getPackagesLog(autoRefresh = false) {
    /** request start */
    if (autoRefresh === false) {
      this.ngProgress.start();
    }
    this.packagesLogService.getPackageLogs().
      subscribe(
        (data) => {
          if (autoRefresh === false) {
            this.ngProgress.done();
          }
          this.logList = sortBy(data['logs'], (obj) => obj.timestamp).reverse();
        },
        error => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public async downloadLogs(logLink: string): Promise<void> {
    const blob = await this.packagesLogService.getLog(logLink);
    const url = window.URL.createObjectURL(blob);
    // create a custom anchor tag
    const a = document.createElement('a');
    a.href = url;
    a.download = logLink;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /**
   * toggle view logs modal and pass info
   * @param logLink link of the log to show
   */
  public showLogs(logLink: string) {
    this.viewLogsModal.toggleModal(true, logLink);
  }

  /**
   * Reload package log list
   * @param notify
   */
  onNotify() {
    this.getPackagesLog();
  }

  toggleAutoRefresh(event: any) {
    this.isAlive = event.target.checked;
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
    this.subscription = interval(this.refreshInterval)
      .pipe(takeWhile(() => this.isAlive), takeUntil(this.destroy$)) // only fires when component is alive
      .subscribe(() => {
        this.getPackagesLog(true);
      });
  }

  public ngOnDestroy(): void {
    this.isAlive = false;
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
    this.subscription.unsubscribe();
  }

}
