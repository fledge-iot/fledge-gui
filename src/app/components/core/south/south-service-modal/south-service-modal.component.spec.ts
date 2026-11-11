import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SouthServiceModalComponent } from './south-service-modal.component';
import { withAppTestDefaults } from '../../../../testing/app-test-module';

describe('SouthServiceModalComponent', () => {
  let component: SouthServiceModalComponent;
  let fixture: ComponentFixture<SouthServiceModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ SouthServiceModalComponent ]
    }))
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SouthServiceModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
