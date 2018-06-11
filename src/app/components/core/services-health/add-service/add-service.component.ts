import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { NgForm } from '@angular/forms';

import { AlertService, ServicesHealthService } from '../../../../services';

@Component({
  selector: 'app-add-service',
  templateUrl: './add-service.component.html',
  styleUrls: ['./add-service.component.css']
})
export class AddServiceComponent implements OnInit {
  selectedType = 'south';
  isEnabled = true;
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  constructor(private servicesHealthService: ServicesHealthService, private alertService: AlertService) { }
  ngOnInit() {

  }

  public toggleModal(isOpen: Boolean) {
    const add_service_modal = <HTMLDivElement>document.getElementById('add_service_modal');
    if (isOpen) {
      add_service_modal.classList.add('is-active');
      return;
    }
    add_service_modal.classList.remove('is-active');
  }

  addService(form: NgForm) {
    this.servicesHealthService.addService(form.value)
      .subscribe(
        () => {
          this.notify.emit();
          this.toggleModal(false);
          this.alertService.success('Service added successfully.');
          form.reset();
        },
        (error) => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }
}
