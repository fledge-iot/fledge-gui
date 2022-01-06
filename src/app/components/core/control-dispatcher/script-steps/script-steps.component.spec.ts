import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScriptStepsComponent } from './script-steps.component';

describe('ScriptStepsComponent', () => {
  let component: ScriptStepsComponent;
  let fixture: ComponentFixture<ScriptStepsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScriptStepsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScriptStepsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
