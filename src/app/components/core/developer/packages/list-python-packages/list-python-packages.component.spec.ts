import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListPythonPackagesComponent } from './list-python-packages.component';

describe('ListPythonPackagesComponent', () => {
  let component: ListPythonPackagesComponent;
  let fixture: ComponentFixture<ListPythonPackagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListPythonPackagesComponent ]
    })
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
