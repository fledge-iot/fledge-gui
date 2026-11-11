import { TestBed } from '@angular/core/testing';

import { RangeSliderService } from './range-slider.service';
import { withAppTestDefaults } from '../../../testing/app-test-module';

describe('RangeSliderService', () => {
  let service: RangeSliderService;

  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({}));
    service = TestBed.inject(RangeSliderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
