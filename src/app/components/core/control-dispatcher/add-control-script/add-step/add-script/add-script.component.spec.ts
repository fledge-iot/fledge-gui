import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddScriptComponent } from './add-script.component';
import { withAppTestDefaults } from '../../../../../../testing/app-test-module';
import { NgForm } from '@angular/forms';
import { createStepForm } from '../../../../../../testing/fixtures';

describe('AddScriptComponent', () => {
  let component: AddScriptComponent;
  let fixture: ComponentFixture<AddScriptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ AddScriptComponent ],
      providers: [{ provide: NgForm, useValue: createStepForm('script') }]
    }))
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddScriptComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('controlIndex', 0);
    fixture.componentRef.setInput('step', 'script');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
