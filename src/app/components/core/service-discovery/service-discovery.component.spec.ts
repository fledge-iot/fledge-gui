import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ServiceDiscoveryComponent } from './service-discovery.component';
import { withAppTestDefaults } from '../../../testing/app-test-module';

describe('ServiceDiscoveryComponent', () => {
  let component: ServiceDiscoveryComponent;
  let fixture: ComponentFixture<ServiceDiscoveryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ ServiceDiscoveryComponent ]
    }))
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceDiscoveryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
