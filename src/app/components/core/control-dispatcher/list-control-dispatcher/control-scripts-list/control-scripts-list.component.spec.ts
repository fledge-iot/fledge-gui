import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlScriptsListComponent } from './control-scripts-list.component';

describe('ControlScriptsListComponent', () => {
  let component: ControlScriptsListComponent;
  let fixture: ComponentFixture<ControlScriptsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ControlScriptsListComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ControlScriptsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
