import { Component, Input, OnInit } from '@angular/core';
import { ControlContainer, FormGroup, NgForm } from '@angular/forms';
import { ServicesApiService, AlertService, SharedService } from '../../../../../../services';

@Component({
  selector: 'app-add-write',
  templateUrl: './add-write.component.html',
  styleUrls: ['./add-write.component.css'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class AddWriteComponent implements OnInit {
  services = []; // south services list

  config;
  @Input() controlIndex; // position
  @Input() step; // step type

  @Input() update = false;

  constructor(
    private servicesApiService: ServicesApiService,
    private alertService: AlertService,
    public sharedService: SharedService,
    private control: NgForm) { }

  ngOnChanges() {
    this.config = this.control.value['steps'][`step-${this.controlIndex}`]['write'];
    if (this.config) {
      this.setOrder();
    }
  }

  ngOnInit(): void {
    this.getAllServices(false);
  }

  public getAllServices(caching: boolean) {
    this.servicesApiService.getSouthServices(caching)
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

  stepsFormGroup() {
    return this.control.form.controls['steps'] as FormGroup;
  }

  stepControlGroup(): FormGroup {
    return this.stepsFormGroup().controls[`step-${this.controlIndex}`] as FormGroup;
  }

  writeControlGroup() {
    return this.stepControlGroup().controls['write'] as FormGroup;
  }

  setService(service: string) {
    this.config.service = service;
    this.writeControlGroup().controls['service'].setValue(service);
  }

  setOrder() {
    this.writeControlGroup().controls['order'].patchValue(this.controlIndex);
  }
}
