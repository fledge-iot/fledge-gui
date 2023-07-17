import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetReadingSummaryComponent } from './asset-reading-summary.component';

describe('AssetReadingSummaryComponent', () => {
  let component: AssetReadingSummaryComponent;
  let fixture: ComponentFixture<AssetReadingSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AssetReadingSummaryComponent]
    })
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
