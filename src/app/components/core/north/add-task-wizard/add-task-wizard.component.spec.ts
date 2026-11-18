import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AddTaskWizardComponent } from './add-task-wizard.component';
import { withAppTestDefaults } from '../../../../testing/app-test-module';

describe('AddTaskWizardComponent', () => {
  let component: AddTaskWizardComponent;
  let fixture: ComponentFixture<AddTaskWizardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ AddTaskWizardComponent ]
    }))
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddTaskWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
