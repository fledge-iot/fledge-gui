import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomNotificationNodeComponent } from './custom-notification-node.component';
import { withAppTestDefaults } from '../../../../testing/app-test-module';
import { createNodeData, noop } from '../../../../testing/fixtures';

describe('CustomNotificationNodeComponent', () => {
  let component: CustomNotificationNodeComponent;
  let fixture: ComponentFixture<CustomNotificationNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [CustomNotificationNodeComponent]
    }))
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomNotificationNodeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', createNodeData('Notification'));
    fixture.componentRef.setInput('emit', noop);
    fixture.componentRef.setInput('rendered', noop);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
