import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AddServiceWizardComponent } from './add-service-wizard.component';
import { withAppTestDefaults } from '../../../../testing/app-test-module';

describe('AddServiceWizardComponent', () => {
  let component: AddServiceWizardComponent;
  let fixture: ComponentFixture<AddServiceWizardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ AddServiceWizardComponent ]
    }))
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddServiceWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
