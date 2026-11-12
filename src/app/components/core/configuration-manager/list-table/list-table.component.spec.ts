import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListTableComponent } from './list-table.component';
import { withAppTestDefaults } from '../../../../testing/app-test-module';
import { FormArray, FormGroup } from '@angular/forms';
import { LIST_CONFIGURATION } from '../../../../testing/fixtures';

describe('ListTableComponent', () => {
  let component: ListTableComponent;
  let fixture: ComponentFixture<ListTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ListTableComponent]
    }));
    fixture = TestBed.createComponent(ListTableComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('configuration', LIST_CONFIGURATION);
    fixture.componentRef.setInput('listType', 'list');
    fixture.componentRef.setInput('listItemsForm', new FormGroup({ listItems: new FormArray([]) }));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
