import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AlertService, ServicesApiService } from '../../../../../services';

@Component({
  selector: 'app-write',
  templateUrl: './write.component.html',
  styleUrls: ['./write.component.css']
})
export class WriteComponent implements OnInit {
  @Input() config: any;
  conditions = ['==', '!=', '<', '>', '<=', '>='] // supported conditions

  @Output() update = new EventEmitter<any>();

  services = [];
  constructor(
    private servicesApiService: ServicesApiService,
    private alertService: AlertService) { }

  ngOnInit(): void {
    console.log('write config', this.config);

    this.getAllServices();
  }


  /**
   * To maintain default key-value order for condition object
   * @returns 0;
   */
  returnZero() {
    return 0
  }

  public getAllServices() {
    this.servicesApiService.getAllServices()
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

  setCondition(condition: string) {
    this.config.value.condition['condition'] = condition;
  }

  updateKey(old: any, newKey: any) {
    this.config.value.values[newKey] = this.config.value.values[old]
    delete this.config.value.values[old];
    this.update.emit(this.config);
  }

  updateValue(key: any, value: any) {
    this.config.value.values[key] = value;
    this.update.emit(this.config);
  }

  getValue(value: any) {
    console.log('event', value);
    this.update.emit(this.config);
  }

  updateCondition(key: any, value: any) {
    this.config.value.condition[key] = value;
    this.update.emit(this.config);
  }

  setService(service: any) {
    console.log(service);
    this.config.value.service = service.name;
  }

}
