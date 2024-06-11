import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationServiceWarningComponent } from './notification-service-warning.component';

describe('NotificationServiceWarningComponent', () => {
  let component: NotificationServiceWarningComponent;
  let fixture: ComponentFixture<NotificationServiceWarningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NotificationServiceWarningComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationServiceWarningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
