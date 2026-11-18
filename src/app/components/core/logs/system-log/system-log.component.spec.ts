import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SystemLogComponent } from './system-log.component';
import { withAppTestDefaults } from '../../../../testing/app-test-module';

describe('SystemLogComponent', () => {
  let component: SystemLogComponent;
  let fixture: ComponentFixture<SystemLogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ SystemLogComponent ]
    }))
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
