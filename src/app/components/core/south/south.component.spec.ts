import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SouthComponent } from './south.component';

describe('SouthComponent', () => {
  let component: SouthComponent;
  let fixture: ComponentFixture<SouthComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SouthComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SouthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
