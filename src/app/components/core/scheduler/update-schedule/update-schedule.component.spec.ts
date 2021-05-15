import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UpdateScheduleComponent } from './update-schedule.component';

describe('UpdateScheduleComponent', () => {
  let component: UpdateScheduleComponent;
  let fixture: ComponentFixture<UpdateScheduleComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ UpdateScheduleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
