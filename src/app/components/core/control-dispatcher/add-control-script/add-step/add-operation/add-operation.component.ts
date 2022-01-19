import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, NgForm, FormControl, ControlContainer, Validators } from '@angular/forms';
import { ServicesApiService, AlertService } from '../../../../../../services';

@Component({
  selector: 'app-add-operation',
  templateUrl: './add-operation.component.html',
  styleUrls: ['./add-operation.component.css'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class AddOperationComponent implements OnInit {

  services = [];  // list of south services
  selectedService = ''; // selected list in the dropdown

  @Input() controlIndex; // position of the control in the dom
  @Input() step; // type of step
  @Input() config;

  stepsGroup: FormGroup;

  values = [];
  operationName = '';
  constructor(
    private servicesApiService: ServicesApiService,
    private alertService: AlertService,
    private control: NgForm) { }

  ngOnInit(): void {
    this.getAllServices(false);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.stepsGroup = this.control.controls[`step-${this.controlIndex}`] as FormGroup;
      this.stepsGroup.addControl('operation', new FormGroup({
        name: new FormControl(''),
        service: new FormControl(''),
        parameters: new FormGroup({}),
        condition: new FormGroup({}),
      }));
      if (this.config && this.config.key === this.step) {
        this.setService(this.config.value.service);
        this.setName(this.config.value.name);
      }
    }, 0);
  }

  operationControlGroup(): FormGroup {
    return this.stepsGroup.controls['operation'] as FormGroup;
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

  setName(name: string) {
    this.operationName = name;
    this.operationControlGroup().controls['name'].setValue(name)
  }

  setService(service: any) {
    this.selectedService = service;
    this.operationControlGroup().controls['service'].setValue(service)
  }

}
