import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyConfigurationComponent } from './property-configuration.component';

describe('PropertyConfigurationComponent', () => {
  let component: PropertyConfigurationComponent;
  let fixture: ComponentFixture<PropertyConfigurationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PropertyConfigurationComponent]
    });
    fixture = TestBed.createComponent(PropertyConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
