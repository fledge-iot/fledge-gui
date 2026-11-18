import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddOperationComponent } from './add-operation.component';
import { withAppTestDefaults } from '../../../../../../testing/app-test-module';
import { NgForm } from '@angular/forms';
import { createStepForm } from '../../../../../../testing/fixtures';

describe('AddOperationComponent', () => {
  let component: AddOperationComponent;
  let fixture: ComponentFixture<AddOperationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ AddOperationComponent ],
      providers: [{ provide: NgForm, useValue: createStepForm('operation') }]
    }))
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddOperationComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('controlIndex', 0);
    fixture.componentRef.setInput('step', 'operation');
    fixture.detectChanges(false);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
