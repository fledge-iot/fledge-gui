import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomNotificationNodeComponent } from './custom-notification-node.component';

describe('CustomNodeComponent', () => {
  let component: CustomNotificationNodeComponent;
  let fixture: ComponentFixture<CustomNotificationNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomNotificationNodeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomNotificationNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
