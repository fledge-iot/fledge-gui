import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NumberInputDebounceComponent } from './number-input-debounce.component';

describe('NumberInputDebounceComponent', () => {
  let component: NumberInputDebounceComponent;
  let fixture: ComponentFixture<NumberInputDebounceComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NumberInputDebounceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NumberInputDebounceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
