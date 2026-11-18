import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NavbarComponent } from './navbar.component';
import { withAppTestDefaults } from '../../../testing/app-test-module';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ NavbarComponent ]
    }))
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
