import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { RolesService } from '../../../../services';

@Component({
  selector: 'app-kvlist-card',
  templateUrl: './kvlist-card.component.html',
  styleUrls: ['./kvlist-card.component.css']
})
export class KvlistCardComponent {
  @Input() configuration: any;
  @Input() initialProperties: any[];
  @Input() from: string;
  @Input() group = '';
  @Input() items: any[];
  @Input() item: FormGroup;
  @Input('index') i;
  @Input() listItemsForm: FormGroup;

  @Output() changedConfig = new EventEmitter<any>();
  @Output() formStatusEvent = new EventEmitter<any>();
  @Output() removeItem = new EventEmitter<any>();

  constructor(
    public rolesService: RolesService) {
  }

  toggleCard(i) {
    let cardHeader = document.getElementById('card-header-' + this.configuration.key + '-' + i + '-' + this.from);
    let cardBody = document.getElementById('card-content-' + this.configuration.key + '-' + i + '-' + this.from);
    if (cardBody.classList.contains('is-hidden')) {
      cardBody.classList.remove('is-hidden');
      cardHeader.classList.add('is-hidden');
    }
    else {
      cardBody.classList.add('is-hidden');
      cardHeader.classList.remove('is-hidden');
    }
  }

  get kvListItems() {
    return this.listItemsForm.get('kvListItems') as FormArray;
  }

  removeListItem(index) {
    this.removeItem.emit(index);
  }

  getChangedConfiguration(event) {
    this.changedConfig.emit(event);
  }

  formStatus(formState) {
    this.formStatusEvent.emit(formState);
  }

  extractItemValue(value) {
    let itemValue = {};
    for (let [key, val] of Object.entries(value)) {
      let itemKey = this.configuration.properties[key]?.displayName || key;
      itemValue[itemKey] = val;
    }
    let jsonString = JSON.stringify(itemValue, null, 2) // Format with indentation and newlines
      .replace(/[{}"]/g, '')  // Remove {, }, and "
      .replace(/:/g, ': ')     // Add space after :
      .replace(/,/g, ', ');    // Add space after ,
    return jsonString;
  }
}
