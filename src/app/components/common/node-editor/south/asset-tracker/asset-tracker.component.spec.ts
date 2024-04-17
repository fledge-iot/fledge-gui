import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetTrackerComponent } from './asset-tracker.component';

describe('AssetTrackerComponent', () => {
  let component: AssetTrackerComponent;
  let fixture: ComponentFixture<AssetTrackerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AssetTrackerComponent]
    });
    fixture = TestBed.createComponent(AssetTrackerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
