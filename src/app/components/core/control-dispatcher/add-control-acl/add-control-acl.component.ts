import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertService, ProgressBarService, ServicesApiService, SharedService } from '../../../../services';
import { ControlDispatcherService } from '../../../../services/control-dispatcher.service';
import { DialogService } from '../confirmation-dialog/dialog.service';
import { groupBy } from 'lodash';

@Component({
  selector: 'app-add-control-acl',
  templateUrl: './add-control-acl.component.html',
  styleUrls: ['./add-control-acl.component.css']
})
export class AddControlAclComponent implements OnInit {
  services = [];

  constructor(private cdRef: ChangeDetectorRef,
    private route: ActivatedRoute,
    private controlService: ControlDispatcherService,
    private alertService: AlertService,
    private ngProgress: ProgressBarService,
    private dialogService: DialogService,
    private servicesApiService: ServicesApiService,
    public sharedService: SharedService) { }

  ngOnInit(): void {
    this.getAllServices();
  }

  public getAllServices() {
    /** request start */
    this.ngProgress.start();
    this.servicesApiService.getAllServices()
      .subscribe((res: any) => {
        /** request done */
        this.ngProgress.done();
        this.services = groupBy(res.services, 'type');
        console.log('service', this.services);

      },
        (error) => {
          /** request done */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public toggleDropdown() {
    const dropDown = document.querySelector('#acl-service-dropdown');
    dropDown.classList.toggle('is-active');
  }

}
