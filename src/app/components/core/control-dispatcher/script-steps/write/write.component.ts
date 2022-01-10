import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-write',
  templateUrl: './write.component.html',
  styleUrls: ['./write.component.css']
})
export class WriteComponent implements OnInit {
  @Input() config: any;
  conditions = ['==', '!=', '<', '>', '<=', '>='] // supported conditions
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
    this.config.condition['condition'] = condition;
    this.toggleDropDown();
    console.log('conf', this.config);
  }

}
