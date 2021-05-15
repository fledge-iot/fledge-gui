import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ViewConfigItemComponent } from './view-config-item.component';

describe('ViewConfigItemComponent', () => {
  let component: ViewConfigItemComponent;
  let fixture: ComponentFixture<ViewConfigItemComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewConfigItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewConfigItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
