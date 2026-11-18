import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigurationGroupComponent } from './configuration-group.component';
import { withAppTestDefaults } from '../../../../testing/app-test-module';

describe('ConfigurationGroupComponent', () => {
  let component: ConfigurationGroupComponent;
  let fixture: ComponentFixture<ConfigurationGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ ConfigurationGroupComponent ]
    }))
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigurationGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
