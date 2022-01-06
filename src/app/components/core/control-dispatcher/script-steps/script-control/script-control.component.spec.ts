import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScriptControlComponent } from './script-control.component';

describe('ScriptControlComponent', () => {
  let component: ScriptControlComponent;
  let fixture: ComponentFixture<ScriptControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScriptControlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScriptControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
