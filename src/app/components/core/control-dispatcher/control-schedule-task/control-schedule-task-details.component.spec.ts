import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlScheduleTaskDetailsComponent } from './control-schedule-task-details.component';
import { withAppTestDefaults } from '../../../../testing/app-test-module';

describe('ControlScheduleTaskDetailsComponent', () => {
  let component: ControlScheduleTaskDetailsComponent;
  let fixture: ComponentFixture<ControlScheduleTaskDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ControlScheduleTaskDetailsComponent]
    }))
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ControlScheduleTaskDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
