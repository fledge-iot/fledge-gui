import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServicesHealthComponent } from './services-health.component';

describe('ServiceStatusComponent', () => {
  let component: ServicesHealthComponent;
  let fixture: ComponentFixture<ServicesHealthComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ServicesHealthComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServicesHealthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
