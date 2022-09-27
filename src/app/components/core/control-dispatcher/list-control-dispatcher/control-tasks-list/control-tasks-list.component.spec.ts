import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlTasksListComponent } from './control-tasks-list.component';

describe('ControlTasksListComponent', () => {
  let component: ControlTasksListComponent;
  let fixture: ComponentFixture<ControlTasksListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ControlTasksListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ControlTasksListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
