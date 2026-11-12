/* tslint:disable:no-unused-variable */
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ListTypeConfigurationComponent } from './list-type-configuration.component';
import { withAppTestDefaults } from '../../../../testing/app-test-module';
import { LIST_CONFIGURATION } from '../../../../testing/fixtures';

describe('ListTypeConfigurationComponent', () => {
  let component: ListTypeConfigurationComponent;
  let fixture: ComponentFixture<ListTypeConfigurationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ ListTypeConfigurationComponent ]
    }))
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListTypeConfigurationComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('configuration', LIST_CONFIGURATION);
    fixture.componentRef.setInput('categoryName', 'South');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
