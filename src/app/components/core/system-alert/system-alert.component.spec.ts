import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SystemAlertComponent } from './system-alert.component';

describe('SystemAlertComponent', () => {
  let component: SystemAlertComponent;
  let fixture: ComponentFixture<SystemAlertComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SystemAlertComponent]
    });
    fixture = TestBed.createComponent(SystemAlertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
