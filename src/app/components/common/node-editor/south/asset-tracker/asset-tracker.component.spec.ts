import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetTrackerComponent } from './asset-tracker.component';
import { withAppTestDefaults } from '../../../../../testing/app-test-module';

describe('AssetTrackerComponent', () => {
  let component: AssetTrackerComponent;
  let fixture: ComponentFixture<AssetTrackerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [AssetTrackerComponent]
    }));
    fixture = TestBed.createComponent(AssetTrackerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
