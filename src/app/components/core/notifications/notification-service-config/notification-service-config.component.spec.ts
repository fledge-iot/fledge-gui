import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationServiceConfigComponent } from './notification-service-config.component';

describe('NotificationServiceConfigComponent', () => {
  let component: NotificationServiceConfigComponent;
  let fixture: ComponentFixture<NotificationServiceConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NotificationServiceConfigComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationServiceConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
