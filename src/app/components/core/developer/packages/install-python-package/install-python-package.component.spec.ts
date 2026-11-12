import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstallPythonPackageComponent } from './install-python-package.component';
import { withAppTestDefaults } from '../../../../../testing/app-test-module';

describe('InstallPythonPackageComponent', () => {
  let component: InstallPythonPackageComponent;
  let fixture: ComponentFixture<InstallPythonPackageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [InstallPythonPackageComponent]
    }))
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InstallPythonPackageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
