import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NorthComponent } from './north.component';

describe('NorthComponent', () => {
  let component: NorthComponent;
  let fixture: ComponentFixture<NorthComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NorthComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NorthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
