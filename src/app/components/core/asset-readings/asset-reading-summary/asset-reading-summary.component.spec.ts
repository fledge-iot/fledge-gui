import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetReadingSummaryComponent } from './asset-reading-summary.component';
import { withAppTestDefaults } from '../../../../testing/app-test-module';

describe('AssetReadingSummaryComponent', () => {
  let component: AssetReadingSummaryComponent;
  let fixture: ComponentFixture<AssetReadingSummaryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [AssetReadingSummaryComponent]
    }))
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssetReadingSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
