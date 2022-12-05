import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNotificationChannelComponent } from './add-notification-channel.component';

describe('AddNotificationChannelComponent', () => {
  let component: AddNotificationChannelComponent;
  let fixture: ComponentFixture<AddNotificationChannelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddNotificationChannelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddNotificationChannelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
