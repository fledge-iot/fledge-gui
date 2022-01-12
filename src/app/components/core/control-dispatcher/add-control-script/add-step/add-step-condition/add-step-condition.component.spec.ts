import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddStepConditionComponent } from './add-step-condition.component';

describe('AddStepConditionComponent', () => {
  let component: AddStepConditionComponent;
  let fixture: ComponentFixture<AddStepConditionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddStepConditionComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddStepConditionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
