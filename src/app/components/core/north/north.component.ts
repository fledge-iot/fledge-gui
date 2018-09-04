import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { sortBy } from 'lodash';
import { Observable } from 'rxjs/Rx';
import { AnonymousSubscription } from 'rxjs/Subscription';

import { AlertService, NorthService, PingService } from '../../../services';
import { POLLING_INTERVAL } from '../../../utils';
import { NorthTaskModalComponent } from './north-task-modal/north-task-modal.component';


@Component({
  selector: 'app-north',
  templateUrl: './north.component.html',
  styleUrls: ['./north.component.css']
})

export class NorthComponent implements OnInit, OnDestroy {
  public task: string;
  public tasks: any;

  public refreshInterval = POLLING_INTERVAL;
  private timerSubscription: AnonymousSubscription;
  public showSpinner = false;

  constructor(private northService: NorthService,
    private ping: PingService,
    private alertService: AlertService,
    private router: Router) { }

  @ViewChild(NorthTaskModalComponent) northTaskModal: NorthTaskModalComponent;

  ngOnInit() {
    this.showLoadingSpinner();
    this.getNorthTasks();
    this.ping.pingIntervalChanged.subscribe((timeInterval: number) => {
      this.refreshInterval = timeInterval;
    });
  }

  addNorthInstance() {
    this.router.navigate(['/north/add']);
  }

  public getNorthTasks(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = null;
    }
    this.northService.getNorthTasks().
      subscribe(
        (data) => {
          this.tasks = data;
          this.tasks = sortBy(this.tasks, function (obj) {
            return !obj.enabled + obj.processName.toLowerCase();
          });
          if (this.refreshInterval > 0) {
            this.enableRefreshTimer();
          }
          this.hideLoadingSpinner();
        },
        error => {
          this.hideLoadingSpinner();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  openNorthTaskModal(task) {
    this.task = task;
    // call child component method to toggle modal
    this.northTaskModal.toggleModal(true);
  }

  public ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = null;
    }
  }

  private enableRefreshTimer(): void {
    this.timerSubscription = Observable.timer(this.refreshInterval)
      .subscribe(() => this.getNorthTasks());
  }

  onNotify() {
    this.getNorthTasks();
  }

  public showLoadingSpinner() {
    this.showSpinner = true;
  }

  public hideLoadingSpinner() {
    this.showSpinner = false;
  }
}
