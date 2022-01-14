import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormGroup, NgModelGroup, NgForm, FormControl, ControlContainer, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { ServicesApiService, AlertService } from '../../../../../../services';
import { uniqWith, cloneDeep } from 'lodash';

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

  operationGroup: FormGroup;
  stepsGroup: FormGroup;

  // @ViewChild('parameterCtrl', { static: true }) parameterCtrl: NgModelGroup;
  // @ViewChild('conditionCtrl', { static: true }) conditionCtrl: NgModelGroup;
  values = [];
  constructor(
    private servicesApiService: ServicesApiService,
    private alertService: AlertService,
    private control: NgForm) {

  }

  ngOnInit(): void {
    this.getAllServices(false);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.operationGroup = this.control.controls['operation'] as FormGroup;
      this.stepsGroup = this.control.controls[`step-${this.controlIndex}`] as FormGroup;
      this.stepsGroup.addControl('operation', new FormGroup({
        service: new FormControl('', Validators.required),
        parameters: new FormGroup({}),
        condition: new FormGroup({}),
      }));
      // this.operationGroup.addControl('service', new FormControl('', Validators.required))
      // this.operationGroup.addControl('parameters', this.parameterCtrl.control);
      // this.operationGroup.addControl('condition', this.conditionCtrl.control);
      // this.stepsGroup.addControl('operation', this.operationGroup);
      // this.parameterCtrl.control.valueChanges
      //   .pipe(debounceTime(300))
      //   .subscribe(
      //     (value: any) => {
      //       let vl = Object.keys(value).map(k => value[k]);
      //       let merged = cloneDeep(uniqWith(vl, (pre, cur) => {
      //         if (pre.index == cur.index) {
      //           cur.value = pre.value ? pre.value : cur.value;
      //           cur.key = cur.key ? cur.key : pre.key;
      //           return true;
      //         }
      //         return false;
      //       }));
      //     });
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

  setService(service: any) {
    this.selectedService = service.name;
    this.operationControlGroup().controls['service'].setValue(service.name)
  }

}
