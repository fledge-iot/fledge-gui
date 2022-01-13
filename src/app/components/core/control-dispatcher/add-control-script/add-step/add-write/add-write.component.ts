import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { ControlContainer, FormControl, FormGroup, NgForm, NgModelGroup } from '@angular/forms';
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
  services = [];
  selectedService;
  writePayload: any = {
    key: 'write',
    order: 1,
    service: "",
    values: {},
    condition: {
      key: "",
      condition: "",
      value: ""
    }
  };

  @Input() controlIndex;

  @Output() writeEvent = new EventEmitter<any>();
  writeGroup: FormGroup;
  stepsGroup: FormGroup;

  @ViewChild('valuesCtrl', { static: true }) valuesCtrl: NgModelGroup;
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
      this.writeGroup = this.control.controls['write'] as FormGroup;
      this.stepsGroup = this.control.controls['steps'] as FormGroup;
      this.writeGroup.addControl('service', new FormControl(''))
      this.writeGroup.addControl('values', this.valuesCtrl.control);
      this.writeGroup.addControl('condition', this.conditionCtrl.control);
      console.log('write group ', this.writeGroup);
      this.stepsGroup.addControl('writes', this.writeGroup);
      console.log('step group ', this.stepsGroup);
      this.valuesCtrl.control.valueChanges
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
            console.log(this.writeGroup.value);
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
    this.writePayload.service = service.name;
    this.writeGroup.controls['service'].setValue(service.name)
  }

  getWriteValues() {
    console.log(this.writePayload);
    this.writeEvent.emit(this.writePayload);
  }

}
