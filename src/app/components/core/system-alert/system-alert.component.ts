import { Component, Input } from '@angular/core';
import { AlertService, SystemAlertService, ProgressBarService } from '../../../services';
import { SystemAlerts } from './../../../models/system-alert';

@Component({
  selector: 'app-system-alert',
  templateUrl: './system-alert.component.html',
  styleUrls: ['./system-alert.component.css']
})

export class SystemAlertComponent {
  @Input() alertCount: number;
  systemAlerts = SystemAlerts['alerts'];

  constructor(
    private alertService: AlertService,
    private systemAlertService: SystemAlertService,
    public ngProgress: ProgressBarService) {
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
        });
  }

  applyClass(urgency: string) {
    console.log('urgency', urgency);
    // if (urgency.toLowerCase() === "normal") {
    //   WIP
    // }
  }
}
