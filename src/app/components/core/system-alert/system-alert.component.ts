import { Component, Input, EventEmitter, HostListener } from '@angular/core';
import { AlertService, ProgressBarService, RolesService, SystemAlertService } from '../../../services';
import { SystemAlert, SystemAlerts } from './../../../models/system-alert';
import { Router } from '@angular/router';

@Component({
  selector: 'app-system-alert',
  templateUrl: './system-alert.component.html',
  styleUrls: ['./system-alert.component.css']
})

export class SystemAlertComponent {
  @Input() alertsCount: number;
  systemAlerts = SystemAlerts['alerts'];
  expectedButtonLabels = ['Show Logs', 'Upgrade'];
  sortByKey = 'time';
  showSpinner = true;
  public reenableButton = new EventEmitter<boolean>(false);

  constructor(
    private alertService: AlertService,
    private router: Router,
    private systemAlertService: SystemAlertService,
    public ngProgress: ProgressBarService,
    private rolesService: RolesService) {
  }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    const dropDown = document.querySelector('#system-alert-dd');
    if (dropDown.classList.contains('is-active')) {
      dropDown.classList.remove('is-active');
    }
  }

  ngOnInit() {}

  public showLoadingSpinner() {
    this.showSpinner = true;
  }

  public hideLoadingSpinner() {
    this.showSpinner = false;
  }

  public toggleDropdown() {
    const dropDown = document.querySelector('#system-alert-dd');
    dropDown.classList.toggle('is-active');
    if (dropDown.classList.contains('is-active')) {
      this.showLoadingSpinner();
      this.getAlerts();
    }
  }

  getAlerts() {
    this.systemAlertService.getAlerts().
    subscribe(
      (data: SystemAlerts) => {
        data.alerts.forEach(alert => {
          alert['buttonText'] = this.getButtonText(alert.message);
        });
        this.groupByUrgencySortedByTime(data.alerts);
      },
      error => {
        this.hideLoadingSpinner();
        this.toggleDropdown();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      }
    );
  }

  sortByTimestamp() {
    // toggle the next possible button text
    this.sortByKey = 'urgency';

    return this.systemAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  groupByUrgencySortedByTime(alerts = []) {
    // don't need to pass alerts array as param when clicking on 'Sort by Urgency' link, so assign "this.systemAlerts" to alerts variable in that case
    if (alerts.length === 0) {
      alerts = this.systemAlerts;
    }
    const urgencyOrder = { "Critical": 0, "High": 1, "Normal": 2, "Low": 3 };
    
    // Group by urgency
    const groupedByUrgencyObj = alerts.reduce((alert, item) => {
      if (!alert[item.urgency]) {
        alert[item.urgency] = [];
      }
      alert[item.urgency].push(item);
      return alert;
    }, {});

    // array of alerts Group by sorted urgency
    let groupedByUrgency = Object.keys(groupedByUrgencyObj)
    .sort((a, b) => urgencyOrder[a] - urgencyOrder[b])
    .map((key) => 
    [...groupedByUrgencyObj[key]]
    );

    // Sort each group by timestamp
    groupedByUrgency.forEach(alerts => {
      alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });
    
    const systemAlerts = groupedByUrgency.reduce((a, value) => a.concat(value), []);
    // toggle the next possible button text
    this.sortByKey = 'time';
    
    this.systemAlerts = systemAlerts;
    this.hideLoadingSpinner();
  }

  performAction(alert: SystemAlert) {
    if (alert['buttonText'] === 'Show Logs') {
      this.router.navigate(['logs/syslog'], { queryParams: { source: alert.key } });
    }
    if (alert['buttonText'] === 'Upgrade') {
      this.update();
    }
    this.toggleDropdown();
  }

  update() {
    this.ngProgress.start();
    this.systemAlertService.update()
    .subscribe(
      (data) => {
        this.ngProgress.done();
        this.reenableButton.emit(false);
        this.alertService.success(data['status']);
      },
      error => {
        this.ngProgress.done();
        this.reenableButton.emit(false);
        if (error.status === 0) {
          console.log('service down', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  deleteAlert(key: string) {
    this.ngProgress.start();
    this.systemAlertService.deleteAlert(key).
    subscribe(
      (data: any) => {
        this.ngProgress.done();
        this.reenableButton.emit(false);

        // Remove from local arrays of systemAlerts
        this.systemAlerts = this.systemAlerts.filter(alert => alert.key !== key);
        --this.alertsCount;
        this.alertService.success(data.message, true);
      },
      error => {
        this.ngProgress.done();
        this.reenableButton.emit(false);
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      }
    );
  }

  deleteAllAlerts() {
    this.ngProgress.start();
    this.systemAlertService.deleteAllAlerts().
    subscribe(
      (data: any) => {
        this.ngProgress.done();
        this.reenableButton.emit(false);
        this.alertsCount = 0;
        this.systemAlerts = [];
        this.alertService.success(data.message, true);
      },
      error => {
        this.ngProgress.done();
        this.reenableButton.emit(false);
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      }
    );
  }

  getButtonText(message: string) {
    if (message.includes('restarted')) {
      return "Show Logs";
    }
    if (message.includes('upgrade')) {
      return "Upgrade";
    }
  }

  applyClass(urgency: string) {
    if (urgency.toLowerCase() === "critical") {
      return "has-text-danger";
    }
    if (urgency.toLowerCase() === "high") {
      return "has-text-warning-dark";
    }
    if (urgency.toLowerCase() === "normal") {
      return "text-grey-lighter";
    }
    if (urgency.toLowerCase() === "low") {
      return "has-text-grey-light";
    }
  }

  getAlertTime(timestamp: Date) {
    const moment = require('moment');
    const alertTimestamp = moment.utc(timestamp);
    const currentTime = moment().utc();
    
    const timeDifference = alertTimestamp.isAfter(currentTime) ? alertTimestamp.fromNow() : alertTimestamp.from(currentTime);
    return timeDifference;
  }
}
