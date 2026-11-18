import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlScriptsListComponent } from './control-scripts-list.component';
import { withAppTestDefaults } from '../../../../../testing/app-test-module';

describe('ControlScriptsListComponent', () => {
  let component: ControlScriptsListComponent;
  let fixture: ComponentFixture<ControlScriptsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ControlScriptsListComponent]
    }))
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
