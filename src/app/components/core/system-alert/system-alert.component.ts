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
  sortByKey = 'Timestamp';
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

  public toggleDropdown() {
    const dropDown = document.querySelector('#system-alert-dd');
    dropDown.classList.toggle('is-active');
    if (dropDown.classList.contains('is-active')) {
      this.getAlerts();
    }
  }

  getAlerts() {
    this.systemAlertService.getAlerts().
    subscribe(
      (data: SystemAlerts) => { 
        let criticalUrgencyAlerts = [];
        let highUrgencyAlerts = [];
        let normalUrgencyAlerts = [];
        let lowUrgencyAlerts = [];

        // Groupby 'urgency' and sorted by 'timestamp'
        data.alerts.forEach(alert => {
          alert['buttonText'] = this.getButtonText(alert.message);
          switch (alert.urgency.toLowerCase()) {
            case 'critical':
              criticalUrgencyAlerts.push(alert);
              break;
            case 'high':
              highUrgencyAlerts.push(alert);
              break;
            case 'normal':
              normalUrgencyAlerts.push(alert);
              break;
            case 'low':
              lowUrgencyAlerts.push(alert);
              break;
            default:
              break;
          }
        });
        const SortedCriticalUrgency = this.sortAlertsByTimestamp(criticalUrgencyAlerts);
        const SortedHighUrgency = this.sortAlertsByTimestamp(highUrgencyAlerts);
        const SortedNormalUrgency = this.sortAlertsByTimestamp(normalUrgencyAlerts);
        const SortedLowUrgency = this.sortAlertsByTimestamp(lowUrgencyAlerts);   
        this.systemAlerts = SortedCriticalUrgency.concat(SortedHighUrgency, SortedNormalUrgency, SortedLowUrgency);
      },
      error => {
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      }
    );
  }

  sortAlerts() {
    if (this.sortByKey === 'Timestamp') {
      this.systemAlerts = this.sortAlertsByTimestamp(this.systemAlerts);
      this.sortByKey = 'Urgency';
    } else {
      this.systemAlerts = this.sortAlertsByUrgency();
      this.sortByKey = 'Timestamp';
    }
  }

  sortAlertsByTimestamp(alerts) {
    return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  sortAlertsByUrgency() {
    return this.systemAlerts.sort((a, b) => a.urgency.localeCompare(b.urgency));
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
