import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-add-step-condition',
  templateUrl: './add-step-condition.component.html',
  styleUrls: ['./add-step-condition.component.css']
})
export class AddStepConditionComponent implements OnInit {

  conditions = ['==', '!=', '<', '>', '<=', '>='] // supported conditions
  condition = '==';

  showConditionControl = false;
  constructor() { }

  ngOnInit(): void {
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
    this.condition = condition;
    // this.writePayload.condition.condition = condition;
  }

  addConditionControl() {
    this.showConditionControl = true;
  }

  deleteControl() {
    this.showConditionControl = false;
  }


}
