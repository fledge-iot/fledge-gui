import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NumberInputDebounceComponent } from './number-input-debounce.component';
import { withAppTestDefaults } from '../../../testing/app-test-module';

describe('NumberInputDebounceComponent', () => {
  let component: NumberInputDebounceComponent;
  let fixture: ComponentFixture<NumberInputDebounceComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ NumberInputDebounceComponent ]
    }))
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NumberInputDebounceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
