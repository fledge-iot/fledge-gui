import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AdditionalServiceModalComponent } from './additional-service-modal.component';
import { withAppTestDefaults } from '../../../../../testing/app-test-module';

describe('AdditionalServiceModalComponent', () => {
  let component: AdditionalServiceModalComponent;
  let fixture: ComponentFixture<AdditionalServiceModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ AdditionalServiceModalComponent ]
    }))
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdditionalServiceModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
