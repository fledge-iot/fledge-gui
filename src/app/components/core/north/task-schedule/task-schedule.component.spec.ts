import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskScheduleComponent } from './task-schedule.component';
import { withAppTestDefaults } from '../../../../testing/app-test-module';

describe('TaskScheduleComponent', () => {
  let component: TaskScheduleComponent;
  let fixture: ComponentFixture<TaskScheduleComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [TaskScheduleComponent]
    }))
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
