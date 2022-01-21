import { Component, Input, OnInit, SimpleChange } from '@angular/core';
import { FormGroup, NgForm, FormControl } from '@angular/forms';
import { ServicesApiService, AlertService, SharedService } from '../../../../../../services';

@Component({
  selector: 'app-add-operation',
  templateUrl: './add-operation.component.html',
  styleUrls: ['./add-operation.component.css'],
})
export class AddOperationComponent implements OnInit {

  services = [];  // list of south services
  selectedService = ''; // selected list in the dropdown

  @Input() controlIndex; // position of the control in the dom
  @Input() step; // type of step
  @Input() config;
  @Input() update = false;

  values = [];
  operationName = '';

  constructor(
    private servicesApiService: ServicesApiService,
    private alertService: AlertService,
    public sharedService: SharedService,
    private control: NgForm) { }

  ngOnChanges(simpleChange: SimpleChange) {
    if (!simpleChange['config'].firstChange && this.config) {
      this.config = simpleChange['config'].currentValue;
      this.setService(this.config.value.service);
      this.setName(this.config.value.name);
    }
  }

  ngOnInit(): void {
    this.getAllServices(false);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.stepControlGroup().addControl('operation', new FormGroup({
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

  stepControlGroup(): FormGroup {
    return this.control.controls[`step-${this.controlIndex}`] as FormGroup;
  }

  operationControlGroup(): FormGroup {
    return this.stepControlGroup().controls['operation'] as FormGroup;
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
    this.operationControlGroup().controls['name'].setValue(name);
  }

  setService(service: any) {
    this.selectedService = service;
    this.operationControlGroup().controls['service'].setValue(service)
  }

}
