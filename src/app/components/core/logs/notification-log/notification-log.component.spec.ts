import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NotificationLogComponent } from './notification-log.component';

describe('NotificationLogComponent', () => {
  let component: NotificationLogComponent;
  let fixture: ComponentFixture<NotificationLogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NotificationLogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
