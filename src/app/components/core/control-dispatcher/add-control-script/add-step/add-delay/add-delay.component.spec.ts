import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddDelayComponent } from './add-delay.component';
import { withAppTestDefaults } from '../../../../../../testing/app-test-module';

describe('AddDelayComponent', () => {
  let component: AddDelayComponent;
  let fixture: ComponentFixture<AddDelayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ AddDelayComponent ]
    }))
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddDelayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
