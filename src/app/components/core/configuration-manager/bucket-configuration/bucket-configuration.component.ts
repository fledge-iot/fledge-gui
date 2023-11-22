import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

export interface Model {
  constant: Constant
  key
  properties: []
}

export interface Constant {
  type: string
  name: string
}


export interface Property {
  description: string
  displayName: string
  type: string
  options?: string[]
  default: string
  value?: string
}

@Component({
  selector: 'app-bucket-configuration',
  templateUrl: './bucket-configuration.component.html',
  styleUrls: ['./bucket-configuration.component.css']
})
export class BucketConfigurationComponent implements OnInit {

  key: any;
  properties: Property[];
  @Input() dataModel;
  bucketConfig: Model;
  bucketModelConfiguration: any;


  // To hold the changed configuration values of a plugin
  propertyChangedValues = {};

  @Output() changedConfig = new EventEmitter<any>();
  @Output() formStatusEvent = new EventEmitter<boolean>();

  @Input() group: string = '';
  @Input() from = '';

  constructor() { }

  ngOnInit(): void {
    console.log('on init');

    this.bucketConfig = JSON.parse(this.dataModel.properties);
    this.key = this.bucketConfig.key;
    this.properties = this.bucketConfig.properties;
    this.bucketModelConfiguration = { ...this.properties, ...this.key };
    this.dataModel.value = typeof this.dataModel.value === 'string' ? JSON.parse(this.dataModel.value) : this.dataModel.value;
    for (const key in this.bucketModelConfiguration) {
      if (this.dataModel.value.hasOwnProperty(key)) {
        this.bucketModelConfiguration[key].value = this.dataModel.value[key];
      }
    }
  }



  getChangedConfiguration(propertyChangedValues: any) {
    this.propertyChangedValues = Object.assign({}, this.propertyChangedValues, propertyChangedValues);
    this.propertyChangedValues = Object.assign({}, this.propertyChangedValues, this.bucketConfig.constant);
    for (const key in this.propertyChangedValues) {
      this.dataModel.value[key] = this.propertyChangedValues[key];
    }
    this.changedConfig.emit({ [this.dataModel.key]: JSON.stringify(this.dataModel.value) });
  }

  formStatus(formState: any) {
    this.formStatusEvent.emit(formState);
  }
}
