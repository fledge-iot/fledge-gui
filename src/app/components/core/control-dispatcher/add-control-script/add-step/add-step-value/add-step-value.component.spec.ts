import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddStepValueComponent } from './add-step-value.component';
import { withAppTestDefaults } from '../../../../../../testing/app-test-module';

describe('AddStepValueComponent', () => {
  let component: AddStepValueComponent;
  let fixture: ComponentFixture<AddStepValueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ AddStepValueComponent ]
    }))
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddStepValueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
