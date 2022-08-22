import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPythonPackageComponent } from './add-python-package.component';

describe('AddPythonPackageComponent', () => {
  let component: AddPythonPackageComponent;
  let fixture: ComponentFixture<AddPythonPackageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddPythonPackageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddPythonPackageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
