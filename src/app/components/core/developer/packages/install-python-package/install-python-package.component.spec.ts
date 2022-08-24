import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstallPythonPackageComponent } from './install-python-package.component';

describe('InstallPythonPackageComponent', () => {
  let component: InstallPythonPackageComponent;
  let fixture: ComponentFixture<InstallPythonPackageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InstallPythonPackageComponent]
    })
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
