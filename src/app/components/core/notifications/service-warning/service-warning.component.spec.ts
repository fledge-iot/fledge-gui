import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceWarningComponent } from './service-warning.component';

describe('ServiceWarningComponent', () => {
  let component: ServiceWarningComponent;
  let fixture: ComponentFixture<ServiceWarningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ServiceWarningComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceWarningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
