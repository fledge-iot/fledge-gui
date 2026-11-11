import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ListSchedulesComponent } from './list-schedules.component';
import { withAppTestDefaults } from '../../../../testing/app-test-module';

describe('ListSchedulesComponent', () => {
  let component: ListSchedulesComponent;
  let fixture: ComponentFixture<ListSchedulesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ ListSchedulesComponent ]
    }))
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListSchedulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
