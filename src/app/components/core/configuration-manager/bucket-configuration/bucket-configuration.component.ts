import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { ConfigurationControlService } from '../../../../services';

export interface Model {
  constant: Constant
  key: {}
  properties: Property[]
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
    styleUrls: ['./bucket-configuration.component.css'],
    standalone: false
})
export class BucketConfigurationComponent implements OnInit, OnChanges {
  @Input() dataModel: any;
  @Input() fullConfiguration: any;
  bucketConfig: Model;
  bucketModelConfiguration: any;
  public isBucketDisabled = false;

  @Output() changedConfig = new EventEmitter<any>();
  @Output() formStatusEvent = new EventEmitter<boolean>();

  @Input() group: string = '';
  @Input() from = '';

  constructor(private configControlService: ConfigurationControlService) { }

  ngOnInit(): void {
    this.bucketConfig = this.dataModel.properties;
    this.bucketModelConfiguration = { ...this.bucketConfig?.key, ...this.bucketConfig?.properties };
    this.dataModel.value = typeof this.dataModel.value === 'string' ? JSON.parse(this.dataModel.value) : this.dataModel.value;
    for (const key in this.bucketModelConfiguration) {
      if (this.dataModel.value.hasOwnProperty(key)) {
        if (this.dataModel?.permissions) {
          this.bucketModelConfiguration[key].permissions = this.dataModel.permissions;
        }
        this.bucketModelConfiguration[key].value = this.dataModel.value[key];
      }
    }
    this.updateBucketValidityState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.fullConfiguration || changes.dataModel) {
      this.updateBucketValidityState();
    }
  }

  private updateBucketValidityState(): void {
    if (this.fullConfiguration && this.dataModel?.validity) {
      const tempConfig = { ...this.dataModel, key: this.dataModel.key };
      this.isBucketDisabled = !!this.configControlService.validateConfigItem(this.fullConfiguration, tempConfig);
    } else {
      this.isBucketDisabled = false;
    }
  }

  getChangedConfiguration(propertyChangedValues: any) {
    for (const key in this.dataModel.value) {
      if (Object.prototype.hasOwnProperty.call(propertyChangedValues, key)) {
        this.dataModel.value[key] = propertyChangedValues[key];
      }
    }
    this.changedConfig.emit({ [this.dataModel.key]: JSON.stringify(this.dataModel.value) });
  }

  formStatus(formState: any) {
    this.formStatusEvent.emit(formState);
  }
}
