import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, NgForm } from '@angular/forms';
import { AlertService, ServicesApiService, SharedService, RolesService } from '../../../../../../services';

@Component({
  selector: 'app-add-operation',
  templateUrl: './add-operation.component.html',
  styleUrls: ['./add-operation.component.css'],
})
export class AddOperationComponent implements OnInit {

  services = [];  // list of south services
  config;

  @Input() controlIndex; // position of the control in the dom
  @Input() step; // type of step
  @Input() update = false;

  constructor(
    private servicesApiService: ServicesApiService,
    private alertService: AlertService,
    public sharedService: SharedService,
    public rolesService: RolesService,
    private control: NgForm) { }

  ngOnChanges() {
    this.config = this.control.value['steps'][`step-${this.controlIndex}`]['operation'];
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

  operationControlGroup() {
    return this.stepControlGroup().controls['operation'] as FormGroup;
  }

  setName(name: string) {
    this.config.name = name;
    this.operationControlGroup().controls['name'].setValue(name);
    this.operationControlGroup().markAsTouched();
    this.operationControlGroup().markAsDirty();
  }

  setService(service: any) {
    this.config.service = service;
    this.operationControlGroup().controls['service'].setValue(service);
    this.operationControlGroup().markAsTouched();
    this.operationControlGroup().markAsDirty();
  }

  setOrder() {
    this.operationControlGroup().controls['order'].patchValue(this.controlIndex);
  }

}
