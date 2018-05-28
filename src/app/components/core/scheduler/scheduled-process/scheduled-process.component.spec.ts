import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduledProcessComponent } from './scheduled-process.component';

describe('ScheduledProcessComponent', () => {
  let component: ScheduledProcessComponent;
  let fixture: ComponentFixture<ScheduledProcessComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ScheduledProcessComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScheduledProcessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
