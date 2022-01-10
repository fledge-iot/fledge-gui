import { Component, Input, OnInit } from '@angular/core';
import { AlertService, ProgressBarService, ServicesApiService } from '../../../../../services';

@Component({
  selector: 'app-operation',
  templateUrl: './operation.component.html',
  styleUrls: ['./operation.component.css']
})
export class OperationComponent implements OnInit {
  @Input() config: any;
  services = [];

  constructor(private servicesApiService: ServicesApiService,
    private alertService: AlertService,
    private ngProgress: ProgressBarService) { }

  ngOnInit(): void {
    this.getAllServices();
  }

  /**
   * To maintain default key-value order for condition object
   * @returns 0;
   */
  returnZero() {
    return 0
  }

  public toggleDropDown(id: string) {
    const dropdowns = document.getElementsByClassName('dropdown');
    for (let i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('is-active')) {
        openDropdown.classList.toggle('is-active', false);
      } else {
        if (openDropdown.id === id) {
          openDropdown.classList.toggle('is-active');
        }
      }
    }
  }

  public getAllServices() {
    this.servicesApiService.getAllServices()
      .subscribe((res: any) => {
        this.services = res.services;
      },
        (error) => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  setService(service: any) {
    console.log(service);

    this.config.service = service.name;

  }
}
