import { TestBed } from '@angular/core/testing';

import { RangeSliderService } from './range-slider.service';

describe('RangeSliderService', () => {
  let service: RangeSliderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RangeSliderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
