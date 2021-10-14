import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FilterAlertComponent } from './filter-alert.component';

describe('FilterAlertComponent', () => {
  let component: FilterAlertComponent;
  let fixture: ComponentFixture<FilterAlertComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FilterAlertComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterAlertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
