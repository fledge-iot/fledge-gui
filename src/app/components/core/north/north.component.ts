import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { sortBy } from 'lodash';
import { interval } from 'rxjs';

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
  public showSpinner = false;
  private isAlive: boolean;

  constructor(private northService: NorthService,
    private ping: PingService,
    private alertService: AlertService,
    private router: Router) {
    this.isAlive = true;
    this.ping.pingIntervalChanged.subscribe((timeInterval: number) => {
      if (timeInterval === -1) {
        this.isAlive = false;
      }
      this.refreshInterval = timeInterval;
    });
  }

  @ViewChild(NorthTaskModalComponent) northTaskModal: NorthTaskModalComponent;

  ngOnInit() {
    this.showLoadingSpinner();
    this.getNorthTasks(false);
    interval(this.refreshInterval)
      .takeWhile(() => this.isAlive) // only fires when component is alive
      .subscribe(() => {
        this.getNorthTasks(true);
      });
  }

  addNorthInstance() {
    this.router.navigate(['/north/add']);
  }

  public getNorthTasks(caching: boolean): void {
    this.northService.getNorthTasks(caching).
      subscribe(
        (data) => {
          this.tasks = data;
          this.tasks = sortBy(this.tasks, function (obj) {
            return !obj.enabled + obj.processName.toLowerCase();
          });
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
  }
}

