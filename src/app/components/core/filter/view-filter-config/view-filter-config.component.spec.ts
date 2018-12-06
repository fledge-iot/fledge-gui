import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewFilterConfigComponent } from './view-filter-config.component';

describe('ViewFilterConfigComponent', () => {
  let component: ViewFilterConfigComponent;
  let fixture: ComponentFixture<ViewFilterConfigComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewFilterConfigComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewFilterConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
