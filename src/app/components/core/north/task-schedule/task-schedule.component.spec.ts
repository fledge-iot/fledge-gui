import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskScheduleComponent } from './task-schedule.component';

describe('TaskScheduleComponent', () => {
  let component: TaskScheduleComponent;
  let fixture: ComponentFixture<TaskScheduleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TaskScheduleComponent]
    })
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
