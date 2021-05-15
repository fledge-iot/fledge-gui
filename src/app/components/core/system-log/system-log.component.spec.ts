import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SystemLogComponent } from './system-log.component';

describe('SystemLogComponent', () => {
  let component: SystemLogComponent;
  let fixture: ComponentFixture<SystemLogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SystemLogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SystemLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
