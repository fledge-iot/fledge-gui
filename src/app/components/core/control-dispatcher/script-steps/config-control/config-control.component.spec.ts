import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigControlComponent } from './config-control.component';

describe('ConfigControlComponent', () => {
  let component: ConfigControlComponent;
  let fixture: ComponentFixture<ConfigControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfigControlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
