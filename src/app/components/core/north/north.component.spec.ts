import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NorthComponent } from './north.component';
import { withAppTestDefaults } from '../../../testing/app-test-module';

describe('NorthComponent', () => {
  let component: NorthComponent;
  let fixture: ComponentFixture<NorthComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ NorthComponent ]
    }))
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NorthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
