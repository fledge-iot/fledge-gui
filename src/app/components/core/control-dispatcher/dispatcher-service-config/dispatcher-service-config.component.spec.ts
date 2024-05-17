import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DispatcherServiceConfigComponent } from './dispatcher-service-config.component';

describe('DispatcherServiceConfigComponent', () => {
  let component: DispatcherServiceConfigComponent;
  let fixture: ComponentFixture<DispatcherServiceConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DispatcherServiceConfigComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DispatcherServiceConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
