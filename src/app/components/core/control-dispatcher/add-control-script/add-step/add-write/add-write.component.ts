import { Component, Input, OnInit, SimpleChange } from '@angular/core';
import { ControlContainer, FormControl, FormGroup, NgForm } from '@angular/forms';
import { ServicesApiService, AlertService, SharedService } from '../../../../../../services';

@Component({
  selector: 'app-add-write',
  templateUrl: './add-write.component.html',
  styleUrls: ['./add-write.component.css'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class AddWriteComponent implements OnInit {
  services = []; // south services list
  selectedService = ''; // selected service

  @Input() config;
  @Input() controlIndex; // position
  @Input() step; // step type

  stepsGroup: FormGroup;
  serviceControl: FormControl;
  @Input() update = false;
  values = [];

  constructor(
    private servicesApiService: ServicesApiService,
    private alertService: AlertService,
    public sharedService: SharedService,
    private control: NgForm) { }

  ngOnChanges(simpleChange: SimpleChange) {
    if (!simpleChange['config'].firstChange && this.config) {
      this.config = simpleChange['config'].currentValue;
      this.setService(this.config.value.service);
    }
  }

  ngOnInit(): void {
    this.getAllServices(false);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.stepsGroup = this.control.controls[`step-${this.controlIndex}`] as FormGroup;
      this.stepsGroup.addControl('write', new FormGroup({
        service: new FormControl(''),
        values: new FormGroup({}),
        condition: new FormGroup({}),
      }));

      if (this.config) {
        this.setService(this.config.value.service);
      }
    }, 0);
  }

  writeControlGroup(): FormGroup {
    return this.stepsGroup.controls['write'] as FormGroup;
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

  setService(service: string) {
    this.selectedService = service;
    this.writeControlGroup().controls['service'].setValue(service);
  }
}
