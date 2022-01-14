import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ControlContainer, FormControl, FormGroup, NgForm, NgModelGroup, Validators } from '@angular/forms';
import { ServicesApiService, AlertService } from '../../../../../../services';
import { uniqWith, cloneDeep } from 'lodash';
import { debounceTime } from 'rxjs/operators';
@Component({
  selector: 'app-add-write',
  templateUrl: './add-write.component.html',
  styleUrls: ['./add-write.component.css'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class AddWriteComponent implements OnInit {
  services = []; // south services list
  selectedService = ''; // selected service


  @Input() controlIndex; // position
  @Input() step; // step type

  // writeGroup: FormGroup;
  stepsGroup: FormGroup;

  // @ViewChild('valuesCtrl', { static: true }) valuesCtrl: NgModelGroup;
  // @ViewChild('conditionCtrl', { static: true }) conditionCtrl: NgModelGroup;
  serviceControl: FormControl;

  values = [];
  constructor(
    private servicesApiService: ServicesApiService,
    private alertService: AlertService,
    private control: NgForm) { }

  ngOnInit(): void {
    console.log('existing write control', this.control);

    this.getAllServices(false);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      console.log('write page', this.controlIndex, this.control);
      // this.writeGroup = this.control.controls['write'] as FormGroup;
      this.stepsGroup = this.control.controls[`step-${this.controlIndex}`] as FormGroup;
      this.stepsGroup.addControl('write', new FormGroup({
        service: new FormControl('', Validators.required),
        values: new FormGroup({}),
        condition: new FormGroup({}),
      }));
      console.log('this.stepsGroup', this.stepsGroup);

      // this.writeGroup.addControl('service', new FormControl('', Validators.required))
      // this.writeGroup.addControl('values', this.valuesCtrl.control);
      // this.writeGroup.addControl('condition', this.conditionCtrl.control);
      // this.stepsGroup.addControl('write', this.writeGroup);
      // this.valuesCtrl.control.valueChanges
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

  writeControlGroup(): FormGroup {
    return this.stepsGroup.controls['write'] as FormGroup;
  }

  // valuesControlGroup(): FormGroup {
  //   return this.writeControlGroup().controls['values'] as FormGroup;
  // }

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
    this.writeControlGroup().controls['service'].setValue(service.name);
  }
}
