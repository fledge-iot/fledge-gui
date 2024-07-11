import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AlertService, ProgressBarService, RolesService } from '../../../../../services';
import { PerfMonService } from '../../../../../services/perfmon.service';
import { SharedService } from '../../../../../services/shared.service';
import { cloneDeep } from 'lodash';

@Component({
  selector: 'tabuate-performance-monitors',
  templateUrl: './table.component.html',
  // styleUrls: ['./table.component.css']
})
export class PerfMonComponent implements OnInit {
  public showSpinner = false;
  private viewPortSubscription: Subscription;
  viewPort: any = '';
  perfMonitors = [];
  perfMonitorsCopy = [];
  counters = []
  services = []
  selectedCounter = "All"

  constructor(
    public sharedService: SharedService,
    private alertService: AlertService,
    public ngProgress: ProgressBarService,
    public perfMonService: PerfMonService,
    public rolesService: RolesService) { }

  ngOnInit(): void {
    this.viewPortSubscription = this.sharedService.viewport
      .subscribe(viewport => {
        this.viewPort = viewport;
      });
    this.getMonitors();
  }

  setCounter(e) {
    this.selectedCounter = e.target.value;
    console.log(this.selectedCounter);
    if (e.target.value !== 'All') {
      // FIXME
      this.perfMonitors = this.perfMonitorsCopy.filter(item => e.target.value == item.key)
      console.log(this.perfMonitors);

    } else {
      // TODO: Use proper data structure and Reset locally
      this.getMonitors();
    }
  }

  getMonitors() {
    this.ngProgress.start();
    this.perfMonService.getPerformanceMonitors()
      .subscribe(
        (data: any) => {
          /** request completed */
          this.ngProgress.done();
          // for table show (sorted by ts) latest record for each service per counter
          this.counters = Object.keys(data.monitors[0]);
          Object.keys(data.monitors[0]).forEach(k => {
            console.log(k, data.monitors[0][k]);

            const items = Object.keys(data.monitors[0][k]).map(key => {
              return { key, value: data.monitors[0][k][key] }
            })
            console.log(items);
            this.perfMonitors.push({ key: k, value: items });
          });
          this.perfMonitorsCopy = cloneDeep(this.perfMonitors);
          console.log(this.perfMonitors);


          // Should list services and counters
          // then should be able to multiselect services and counters
          // show services dropdown on left and then for counters
          // - We can check if a service does not have pefmon checked then don;t list that
          // we should show chart per counter (and also have a grid/tabular view to allow sort/export)
          // should be able to filter for a time range, t1 to t2, last x units from now

          /// group by services in get all
          // - counter: x, values {"s": [] } or
          // - counter: x, data: [{"service": "s", values":[], {"service": "s2", values":[]}]
          /// monitors/<svc name>
        },
        error => {
          /** request completed */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public ngOnDestroy(): void {
    this.viewPortSubscription.unsubscribe();
  }

}
