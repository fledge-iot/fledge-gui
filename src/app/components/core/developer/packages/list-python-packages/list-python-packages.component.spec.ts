import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListPythonPackagesComponent } from './list-python-packages.component';
import { withAppTestDefaults } from '../../../../../testing/app-test-module';

describe('ListPythonPackagesComponent', () => {
  let component: ListPythonPackagesComponent;
  let fixture: ComponentFixture<ListPythonPackagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ ListPythonPackagesComponent ]
    }))
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListPythonPackagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
