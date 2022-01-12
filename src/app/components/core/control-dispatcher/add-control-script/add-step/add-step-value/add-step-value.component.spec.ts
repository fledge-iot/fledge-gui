import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddStepValueComponent } from './add-step-value.component';

describe('AddStepValueComponent', () => {
  let component: AddStepValueComponent;
  let fixture: ComponentFixture<AddStepValueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddStepValueComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddStepValueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
