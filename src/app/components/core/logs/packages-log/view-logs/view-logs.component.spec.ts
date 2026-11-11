import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ViewLogsComponent } from './view-logs.component';
import { withAppTestDefaults } from '../../../../../testing/app-test-module';

describe('ViewLogsComponent', () => {
  let component: ViewLogsComponent;
  let fixture: ComponentFixture<ViewLogsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ ViewLogsComponent ]
    }))
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
