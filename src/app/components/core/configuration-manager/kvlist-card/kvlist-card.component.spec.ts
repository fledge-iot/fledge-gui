import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KvlistCardComponent } from './kvlist-card.component';
import { withAppTestDefaults } from '../../../../testing/app-test-module';
import { FormControl, FormGroup } from '@angular/forms';
import { KVLIST_CONFIGURATION, LIST_ITEM_PROPERTIES } from '../../../../testing/fixtures';

describe('KvlistCardComponent', () => {
  let component: KvlistCardComponent;
  let fixture: ComponentFixture<KvlistCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [KvlistCardComponent]
    }));
    fixture = TestBed.createComponent(KvlistCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('configuration', KVLIST_CONFIGURATION);
    fixture.componentRef.setInput('initialProperties', LIST_ITEM_PROPERTIES);
    fixture.componentRef.setInput('items', [{ status: true }]);
    fixture.componentRef.setInput('item', new FormGroup({ key: new FormControl('first'), value: new FormControl({ name: 'temperature', unit: 'C' }) }));
    fixture.componentRef.setInput('index', 0);
    fixture.componentRef.setInput('listItemsForm', new FormGroup({}));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
