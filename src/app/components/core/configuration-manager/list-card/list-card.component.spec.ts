import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListCardComponent } from './list-card.component';
import { withAppTestDefaults } from '../../../../testing/app-test-module';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { LIST_CONFIGURATION, LIST_ITEM_PROPERTIES } from '../../../../testing/fixtures';

describe('ListCardComponent', () => {
  let component: ListCardComponent;
  let fixture: ComponentFixture<ListCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ListCardComponent]
    }));
    fixture = TestBed.createComponent(ListCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('configuration', LIST_CONFIGURATION);
    fixture.componentRef.setInput('initialProperties', LIST_ITEM_PROPERTIES);
    fixture.componentRef.setInput('listLabel', 'Name');
    fixture.componentRef.setInput('firstKey', 'name');
    fixture.componentRef.setInput('items', [{ status: true }]);
    fixture.componentRef.setInput('item', new FormControl({ name: 'temperature', unit: 'C' }));
    fixture.componentRef.setInput('index', 0);
    fixture.componentRef.setInput('listItemsForm', new FormGroup({ listItems: new FormArray([]) }));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
