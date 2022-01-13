import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormGroup, NgModelGroup, NgForm, FormControl, ControlContainer } from '@angular/forms';
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

  services = [];
  selectedService;

  @Input() controlIndex;
  @Input() step;

  @Output() writeEvent = new EventEmitter<any>();
  operationGroup: FormGroup;
  stepsGroup: FormGroup;

  @ViewChild('parameterCtrl', { static: true }) parameterCtrl: NgModelGroup;
  @ViewChild('conditionCtrl', { static: true }) conditionCtrl: NgModelGroup;
  values = [];
  constructor(
    private servicesApiService: ServicesApiService,
    private alertService: AlertService,
    private control: NgForm) {

  }

  ngOnInit(): void {
    // console.log('ng control write', this.valuesCtrl);
    this.getAllServices(false);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      console.log('controlIndex', this.controlIndex);
      console.log('control group ', this.control);
      this.operationGroup = this.control.controls['operation'] as FormGroup;
      this.stepsGroup = this.control.controls[`step-${this.controlIndex}`] as FormGroup;
      console.log('step group ', this.stepsGroup);

      this.operationGroup.addControl('service', new FormControl(''))
      this.operationGroup.addControl('parameters', this.parameterCtrl.control);
      this.operationGroup.addControl('condition', this.conditionCtrl.control);
      console.log('write group ', this.operationGroup);
      this.stepsGroup.addControl('operation', this.operationGroup);
      console.log('step group ', this.stepsGroup);
      this.parameterCtrl.control.valueChanges
        .pipe(debounceTime(300))
        .subscribe(
          (value: any) => {
            let vl = Object.keys(value).map(k => value[k]);
            let merged = cloneDeep(uniqWith(vl, (pre, cur) => {
              if (pre.index == cur.index) {
                cur.value = pre.value ? pre.value : cur.value;
                cur.key = cur.key ? cur.key : pre.key;
                return true;
              }
              return false;
            }));
            console.log('merged', merged);
            console.log(this.operationGroup.value);
          });
    }, 0);
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
    console.log(service);
    this.selectedService = service.name;
    this.operationGroup.controls['service'].setValue(service.name)
  }

  getWriteValues() {
    // console.log(this.writePayload);
    // this.writeEvent.emit(this.writePayload);
  }
}
