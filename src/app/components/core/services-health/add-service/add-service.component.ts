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

  public toggleModal(isOpen: Boolean, form: NgForm) {
    const add_service_modal = <HTMLDivElement>document.getElementById('add_service_modal');
    if (isOpen) {
      add_service_modal.classList.add('is-active');
      return;
    }
    if (form != null) {
      this.resetForm(form);
    }
    add_service_modal.classList.remove('is-active');
  }

  addService(form: NgForm) {
    this.servicesHealthService.addService(form.value)
      .subscribe(
        () => {
          this.toggleModal(false, form);
          this.alertService.success('Service added successfully.');
          this.notify.emit();
          this.resetForm(form);
        },
        (error) => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  resetForm(form: NgForm) {
    form.controls['name'].reset();
    form.controls['type'].reset('south');
    form.controls['enabled'].reset(true);
    form.controls['plugin'].reset();
  }
}
