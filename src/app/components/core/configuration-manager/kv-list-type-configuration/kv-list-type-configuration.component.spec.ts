/* tslint:disable:no-unused-variable */
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { KvListTypeConfigurationComponent } from './kv-list-type-configuration.component';
import { withAppTestDefaults } from '../../../../testing/app-test-module';
import { KVLIST_CONFIGURATION } from '../../../../testing/fixtures';

describe('KvListTypeConfigurationComponent', () => {
  let component: KvListTypeConfigurationComponent;
  let fixture: ComponentFixture<KvListTypeConfigurationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ KvListTypeConfigurationComponent ]
    }))
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KvListTypeConfigurationComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('configuration', KVLIST_CONFIGURATION);
    fixture.componentRef.setInput('categoryName', 'South');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
