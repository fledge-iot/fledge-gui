import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeDropdownComponent } from './time-dropdown.component';

describe('TimeDropdownComponent', () => {
  let component: TimeDropdownComponent;
  let fixture: ComponentFixture<TimeDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TimeDropdownComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
