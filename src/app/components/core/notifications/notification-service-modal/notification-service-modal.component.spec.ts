import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NotificationServiceModalComponent } from './notification-service-modal.component';

describe('NotificationServiceModalComponent', () => {
  let component: NotificationServiceModalComponent;
  let fixture: ComponentFixture<NotificationServiceModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NotificationServiceModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationServiceModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
