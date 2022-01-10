import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-write',
  templateUrl: './write.component.html',
  styleUrls: ['./write.component.css']
})
export class WriteComponent implements OnInit {
  @Input() config: any;
  conditions = ['==', '!=', '<', '>', '<=', '>='] // supported conditions

  @Output() update = new EventEmitter<any>();
  constructor() { }

  ngOnInit(): void { }


  /**
   * To maintain default key-value order for condition object
   * @returns 0;
   */
  returnZero() {
    return 0
  }

  public toggleDropDown() {
    const dropDown = document.querySelector('#condition-dropdown');
    dropDown.classList.toggle('is-active');
  }

  setCondition(condition: string) {
    this.config.value.condition['condition'] = condition;
    this.toggleDropDown();
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

}
