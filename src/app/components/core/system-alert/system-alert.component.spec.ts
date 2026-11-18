import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SystemAlertComponent } from './system-alert.component';
import { withAppTestDefaults } from '../../../testing/app-test-module';

describe('SystemAlertComponent', () => {
  let component: SystemAlertComponent;
  let fixture: ComponentFixture<SystemAlertComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [SystemAlertComponent]
    }));
    fixture = TestBed.createComponent(SystemAlertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
