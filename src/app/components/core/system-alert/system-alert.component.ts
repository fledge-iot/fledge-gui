import { Component, Input, EventEmitter } from '@angular/core';
import { AlertService, SystemAlertService, ProgressBarService, RolesService } from '../../../services';
import { SystemAlerts } from './../../../models/system-alert';

@Component({
  selector: 'app-system-alert',
  templateUrl: './system-alert.component.html',
  styleUrls: ['./system-alert.component.css']
})

export class SystemAlertComponent {
  @Input() alertCount: number;
  systemAlerts = SystemAlerts['alerts'];
  public reenableButton = new EventEmitter<boolean>(false);

  constructor(
    private alertService: AlertService,
    private systemAlertService: SystemAlertService,
    public ngProgress: ProgressBarService,
    private rolesService: RolesService) {
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
      (data) => {
        this.systemAlerts = data['alerts'];
        console.log('systemAlerts', this.systemAlerts)
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

  performAction() {
    console.log('WIP');
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

  applyClass(urgency: string) {
    if (urgency.toLowerCase() === "critical") {
      return "has-text-danger";
    }
    if (urgency.toLowerCase() === "high") {
      return "has-text-warning";
    }
    if (urgency.toLowerCase() === "normal") {
      return "has-text-grey-light";
    }
    if (urgency.toLowerCase() === "low") {
      return "text-grey-lighter";
    }
  }
}
