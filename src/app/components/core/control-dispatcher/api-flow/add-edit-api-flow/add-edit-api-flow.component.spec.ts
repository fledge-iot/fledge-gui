import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditAPIFlowComponent } from './add-edit-api-flow.component';
import { withAppTestDefaults } from '../../../../../testing/app-test-module';

describe('AddEditAPIFlowComponent', () => {
  let component: AddEditAPIFlowComponent;
  let fixture: ComponentFixture<AddEditAPIFlowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ AddEditAPIFlowComponent ]
    }))
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEditAPIFlowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
