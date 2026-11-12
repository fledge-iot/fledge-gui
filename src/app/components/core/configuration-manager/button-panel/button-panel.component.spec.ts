import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ButtonPanelComponent } from './button-panel.component';
import { withAppTestDefaults } from '../../../../testing/app-test-module';

describe('ButtonPanelComponent', () => {
  let component: ButtonPanelComponent;
  let fixture: ComponentFixture<ButtonPanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ButtonPanelComponent]
    }));
    fixture = TestBed.createComponent(ButtonPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
