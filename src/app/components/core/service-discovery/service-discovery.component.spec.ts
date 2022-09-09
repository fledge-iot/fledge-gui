import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ServiceDiscoveryComponent } from './service-discovery.component';

describe('ServiceDiscoveryComponent', () => {
  let component: ServiceDiscoveryComponent;
  let fixture: ComponentFixture<ServiceDiscoveryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ServiceDiscoveryComponent ]
    })
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
