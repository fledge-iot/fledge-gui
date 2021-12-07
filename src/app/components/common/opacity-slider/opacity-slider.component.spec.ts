import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpacitySliderComponent } from './opacity-slider.component';

describe('OpacitySliderComponent', () => {
  let component: OpacitySliderComponent;
  let fixture: ComponentFixture<OpacitySliderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OpacitySliderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OpacitySliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
