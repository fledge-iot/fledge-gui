import { Component, Input, OnInit, SimpleChanges } from '@angular/core';


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
  options: string[]
  default: string
  value?: string
}





@Component({
  selector: 'app-bucket-configuration',
  templateUrl: './bucket-configuration.component.html',
  styleUrls: ['./bucket-configuration.component.css']
})
export class BucketConfigurationComponent implements OnInit {

  constant: Constant;
  key
  properties: Property[];
  data


  @Input() dataModal: Model;
  constructor() {

  }

  ngOnInit(): void {
    console.log('hello', this.dataModal);

    this.constant = this.dataModal.constant;
    this.key = this.dataModal.key;
    this.properties = this.dataModal.properties;
    console.log(this.properties);

    this.data = Object.assign([this.key, this.properties], {})
    console.log('data', this.data);







  }

  ngAfterViewInit() {

    if (this.key) {
      console.log(this.key);

    }

  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('bucket ', changes);

  }

}
