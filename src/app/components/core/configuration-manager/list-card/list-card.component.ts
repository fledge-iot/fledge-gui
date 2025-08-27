import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { RolesService } from '../../../../services';
import { PopoverComponent } from '../../../common/popover/popover.component';

@Component({
  selector: 'app-list-card',
  templateUrl: './list-card.component.html',
  styleUrls: ['./list-card.component.css']
})
export class ListCardComponent {
  @Input() configuration: any;
  @Input() initialProperties: any[];
  @Input() from: string;
  @Input() group = '';
  @Input() listLabel: string;
  @Input() firstKey: string;
  @Input() items: any[];
  @Input() item: FormControl;
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
    let itemProperties = [];
    for (let [key, val] of Object.entries(value)) {
      let itemKey = this.configuration.properties[key]?.displayName || key;
      itemProperties.push({
        label: itemKey,
        value: val || '' // Handle empty values
      });
    }
    return itemProperties;
  }

  showPopover(triggerElement: HTMLElement, popover: PopoverComponent): void {
    popover.show(triggerElement);
  }

  hidePopoverWithDelay(popover: PopoverComponent): void {
    popover.hideWithDelay();
  }

  onPopoverShown(): void {
    // Handle popover shown event if needed
  }

  onPopoverHidden(): void {
    // Handle popover hidden event if needed
  }
}
