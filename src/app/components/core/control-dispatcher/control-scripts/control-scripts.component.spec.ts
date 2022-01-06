import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlScriptsComponent } from './control-scripts.component';

describe('ControlScriptsComponent', () => {
  let component: ControlScriptsComponent;
  let fixture: ComponentFixture<ControlScriptsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ControlScriptsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ControlScriptsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
