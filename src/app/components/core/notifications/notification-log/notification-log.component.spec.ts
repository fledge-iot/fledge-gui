import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationLogComponent } from './notification-log.component';

describe('NotificationLogComponent', () => {
  let component: NotificationLogComponent;
  let fixture: ComponentFixture<NotificationLogComponent>;

  beforeEach(async(() => {
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
