import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyConfigurationComponent } from './property-configuration.component';
import { withAppTestDefaults } from '../../../../testing/app-test-module';
import { FormControl, FormGroup } from '@angular/forms';
import { PROPERTY_CONFIGURATION } from '../../../../testing/fixtures';

describe('PropertyConfigurationComponent', () => {
  let component: PropertyConfigurationComponent;
  let fixture: ComponentFixture<PropertyConfigurationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [PropertyConfigurationComponent]
    }));
    fixture = TestBed.createComponent(PropertyConfigurationComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('configuration', PROPERTY_CONFIGURATION);
    fixture.componentRef.setInput('control', new FormControl('localhost'));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
