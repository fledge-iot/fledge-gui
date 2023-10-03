import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { sortBy } from 'lodash';
import { takeWhile, takeUntil } from 'rxjs/operators';
import { interval, Subscription, Subject } from 'rxjs';

import { AlertService, NorthService, PingService, ProgressBarService, RolesService, SharedService } from '../../../services';
import { POLLING_INTERVAL } from '../../../utils';
import { NorthTaskModalComponent } from './north-task-modal/north-task-modal.component';
import { ViewLogsComponent } from '../logs/packages-log/view-logs/view-logs.component';

@Component({
  selector: 'app-north',
  templateUrl: './north.component.html',
  styleUrls: ['./north.component.css']
})

export class NorthComponent implements OnInit, OnDestroy {
  public task: string;
  public tasks: any;
  viewPort: any = '';

  private viewPortSubscription: Subscription;
  public refreshInterval = POLLING_INTERVAL;
  public showSpinner = false;
  public isAlive: boolean;
  private subscription: Subscription;
  destroy$: Subject<boolean> = new Subject<boolean>();
  constructor(private northService: NorthService,
    private ping: PingService,
    private alertService: AlertService,
    private router: Router,
    public ngProgress: ProgressBarService,
    private sharedService: SharedService,
    public rolesService: RolesService) {
    this.isAlive = true;
    this.ping.pingIntervalChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe((timeInterval: number) => {
        if (timeInterval === -1) {
          this.isAlive = false;
        }
        this.refreshInterval = timeInterval;
      });
    this.subscription = this.sharedService.showLogs.subscribe(showPackageLogs => {
      if (showPackageLogs.isSubscribed) {
        // const closeBtn = <HTMLDivElement>document.querySelector('.modal .delete');
        // if (closeBtn) {
        //   closeBtn.click();
        // }
        this.viewLogsComponent.toggleModal(true, showPackageLogs.fileLink);
        showPackageLogs.isSubscribed = false;
      }
    });
  }

  @ViewChild(ViewLogsComponent) viewLogsComponent: ViewLogsComponent;

  ngOnInit() {
    this.showLoadingSpinner();
    this.getNorthTasks(false);
    interval(this.refreshInterval)
      .pipe(takeWhile(() => this.isAlive), takeUntil(this.destroy$)) // only fires when component is alive
      .subscribe(() => {
        this.getNorthTasks(true);
      });
    this.viewPortSubscription = this.sharedService.viewport.subscribe(viewport => {
      this.viewPort = viewport;
    });
  }

  addNorthInstance() {
    this.router.navigate(['/north/add']);
  }

  public getNorthTasks(caching: boolean): void {
    if (!this.isAlive) {
      this.ngProgress.start();
    }
    this.northService.getNorthTasks(caching)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data) => {
          this.ngProgress.done();
          this.tasks = data;
          this.tasks = sortBy(this.tasks, function (obj) {
            return !obj.enabled + obj.name.toLowerCase();
          });
          this.hideLoadingSpinner();
        },
        error => {
          this.ngProgress.done();
          this.hideLoadingSpinner();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  openNorthTaskModal(task) {
    this.router.navigate(['/north', task.name])
  }

  onNotify() {
    this.getNorthTasks(false);
  }

  public showLoadingSpinner() {
    this.showSpinner = true;
  }

  public hideLoadingSpinner() {
    this.showSpinner = false;
  }

  public ngOnDestroy(): void {
    this.isAlive = false;
    this.subscription.unsubscribe();
    this.viewPortSubscription.unsubscribe();
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}

