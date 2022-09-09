import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AddNotificationWizardComponent } from './add-notification-wizard.component';

describe('AddNotificationWizardComponent', () => {
  let component: AddNotificationWizardComponent;
  let fixture: ComponentFixture<AddNotificationWizardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AddNotificationWizardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddNotificationWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
