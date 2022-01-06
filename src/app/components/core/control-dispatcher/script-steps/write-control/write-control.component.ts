import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-write-control',
  templateUrl: './write-control.component.html',
  styleUrls: ['./write-control.component.css']
})
export class WriteControlComponent implements OnInit {
  @Input() config: any;
  conditions = ['==', '!=', '<', '>', '<=', '>='] // supported conditions

  constructor() { }

  ngOnInit(): void {
  }

  // to maintain default key-value order for condition object
  returnZero() {
    return 0
  }

  public toggleDropDown() {
    const dropDown = document.querySelector('#condition-dropdown');
    dropDown.classList.toggle('is-active');
  }

  setCondition(condition: string) {
    this.config.condition['condition'] = condition;
    this.toggleDropDown();
    console.log('conf', this.config);
  }

}
