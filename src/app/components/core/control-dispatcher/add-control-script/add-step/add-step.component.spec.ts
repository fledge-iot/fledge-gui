import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddStepComponent } from './add-step.component';
import { withAppTestDefaults } from '../../../../../testing/app-test-module';

describe('AddStepComponent', () => {
  let component: AddStepComponent;
  let fixture: ComponentFixture<AddStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ AddStepComponent ]
    }))
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
