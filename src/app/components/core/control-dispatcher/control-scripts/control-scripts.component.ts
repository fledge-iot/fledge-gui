import { Component, OnInit } from '@angular/core';
import { AlertService, ProgressBarService } from '../../../../services';
import { ControlDispatcherService } from '../../../../services/control-dispatcher.service';

@Component({
  selector: 'app-control-scripts',
  templateUrl: './control-scripts.component.html',
  styleUrls: ['./control-scripts.component.css']
})
export class ControlScriptsComponent implements OnInit {
  controlScripts: any = [];

  constructor(
    private controlService: ControlDispatcherService,
    private alertService: AlertService,
    private ngProgress: ProgressBarService) { }

  ngOnInit(): void {
    this.showControlDispatcherService();
  }

  showControlDispatcherService() {
    /** request started */
    this.ngProgress.start();
    this.controlService.fetchControlServiceScripts()
      .subscribe((data: any) => {
        this.ngProgress.done();
        this.controlScripts = data.scripts;
        console.log(this.controlScripts);

      }, error => {
        /** request completed */
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

}
