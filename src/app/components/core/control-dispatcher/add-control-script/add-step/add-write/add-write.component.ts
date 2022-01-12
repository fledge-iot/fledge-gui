import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ControlContainer, NgForm } from '@angular/forms';
import { ServicesApiService, AlertService } from '../../../../../../services';

@Component({
  selector: 'app-add-write',
  templateUrl: './add-write.component.html',
  styleUrls: ['./add-write.component.css'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class AddWriteComponent implements OnInit {
  services = [];
  selectedService;
  writePayload: any = {
    key: 'write',
    order: 1,
    service: "",
    values: {},
    condition: {
      key: "",
      condition: "",
      value: ""
    }
  };

  @Input() controlIndex;

  @Output() writeEvent = new EventEmitter<any>();

  constructor(private servicesApiService: ServicesApiService,
    private alertService: AlertService) { }

  ngOnInit(): void {
    this.getAllServices(false);
  }

  public getAllServices(caching: boolean) {
    this.servicesApiService.getSouthServices(caching)
      .subscribe((res: any) => {
        this.services = res.services;
        console.log('service', this.services);

      },
        (error) => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
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

  setService(service: any) {
    console.log(service);
    this.selectedService = service.name;
    this.writePayload.service = service.name;
  }

  getWriteValues() {
    console.log(this.writePayload);
    this.writeEvent.emit(this.writePayload);
  }

}
