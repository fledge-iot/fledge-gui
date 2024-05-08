import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceConfigComponent } from './service-config.component';

describe('ServiceConfigComponent', () => {
  let component: ServiceConfigComponent;
  let fixture: ComponentFixture<ServiceConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ServiceConfigComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
