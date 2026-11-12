import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddWriteComponent } from './add-write.component';
import { withAppTestDefaults } from '../../../../../../testing/app-test-module';
import { NgForm } from '@angular/forms';
import { createStepForm } from '../../../../../../testing/fixtures';

describe('AddWriteComponent', () => {
  let component: AddWriteComponent;
  let fixture: ComponentFixture<AddWriteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ AddWriteComponent ],
      providers: [{ provide: NgForm, useValue: createStepForm('write') }]
    }))
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddWriteComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('controlIndex', 0);
    fixture.componentRef.setInput('step', 'write');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
