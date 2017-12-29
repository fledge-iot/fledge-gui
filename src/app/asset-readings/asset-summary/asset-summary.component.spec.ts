import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetSummaryComponent } from './asset-summary.component';

describe('AssetSummaryComponent', () => {
  let component: AssetSummaryComponent;
  let fixture: ComponentFixture<AssetSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AssetSummaryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssetSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
