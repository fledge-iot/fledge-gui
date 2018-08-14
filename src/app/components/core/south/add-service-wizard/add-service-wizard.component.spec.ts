import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddServiceWizardComponent } from './add-service-wizard.component';

describe('AddServiceWizardComponent', () => {
  let component: AddServiceWizardComponent;
  let fixture: ComponentFixture<AddServiceWizardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddServiceWizardComponent ]
    })
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
