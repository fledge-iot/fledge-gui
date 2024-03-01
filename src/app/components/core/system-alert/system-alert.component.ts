import { Component, Input } from '@angular/core';
import { AlertService, SystemAlertService, ProgressBarService } from '../../../services';

@Component({
  selector: 'app-system-alert',
  templateUrl: './system-alert.component.html',
  styleUrls: ['./system-alert.component.css']
})

export class SystemAlertComponent {
  @Input() alertCount: number;

  constructor(
    private alertService: AlertService,
    private systemAlertService: SystemAlertService,
    public ngProgress: ProgressBarService) {
  }

  ngOnInit() {
    console.log('alertCount', this.alertCount);
  }

  getAlerts() {
    this.ngProgress.start();
    this.systemAlertService.getAlerts().
      subscribe(
        (data) => {
          this.ngProgress.done();
          console.log('data', data);
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
}
