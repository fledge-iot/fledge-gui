import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddControlScheduleTaskComponent } from './add-control-schedule-task.component';

describe('AddControlScheduleTaskComponent', () => {
  let component: AddControlScheduleTaskComponent;
  let fixture: ComponentFixture<AddControlScheduleTaskComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddControlScheduleTaskComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddControlScheduleTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
