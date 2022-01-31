import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertService, ProgressBarService, ServicesApiService, SharedService } from '../../../../services';
import { ControlDispatcherService } from '../../../../services/control-dispatcher.service';
import { DialogService } from '../confirmation-dialog/dialog.service';
import { groupBy } from 'lodash';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-add-control-acl',
  templateUrl: './add-control-acl.component.html',
  styleUrls: ['./add-control-acl.component.css']
})
export class AddControlAclComponent implements OnInit {
  services = [];
  selectedServicesList = [];
  name: string;

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
        this.services = res.services.map((s: any) => {
          s.select = false;
          return s;
        });
        this.services = groupBy(this.services, 'type');
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

  public toggleDropDown(id: string) {
    const activeDropDowns = Array.prototype.slice.call(document.querySelectorAll('.dropdown.is-active'));
    if (activeDropDowns.length > 0) {
      if (activeDropDowns[0].id !== id) {
        activeDropDowns[0].classList.remove('is-active');
      }
    }
    const dropDown = document.querySelector(`#${id}`);
    dropDown.classList.toggle('is-active');
  }

  selectService(service) {
    Object.keys(this.services).map(key => {
      console.log('service', this.services[key]);
      this.services[key].map(s => {
        s.select = false;
        if (s.name === service.name) {
          this.selectedServicesList.push(service);
          s.select = true;
        }
        return s;
      });
    });
  }

  selectACLType(type: string) {
    console.log('type', type);
  }

  onSubmit(form: NgForm) {
    console.log('form', form);
  }


}
