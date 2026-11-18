import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TasksComponent } from './tasks.component';
import { withAppTestDefaults } from '../../../../testing/app-test-module';

describe('TasksComponent', () => {
  let component: TasksComponent;
  let fixture: ComponentFixture<TasksComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [TasksComponent]
    }))
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
