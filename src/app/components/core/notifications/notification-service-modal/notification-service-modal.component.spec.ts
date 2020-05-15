import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationServiceModalComponent } from './notification-service-modal.component';

describe('NotificationServiceModalComponent', () => {
  let component: NotificationServiceModalComponent;
  let fixture: ComponentFixture<NotificationServiceModalComponent>;

  beforeEach(async(() => {
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
