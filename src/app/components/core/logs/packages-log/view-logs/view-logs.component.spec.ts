import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ViewLogsComponent } from './view-logs.component';

describe('ViewLogsComponent', () => {
  let component: ViewLogsComponent;
  let fixture: ComponentFixture<ViewLogsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewLogsComponent ]
    })
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
