import { TestBed } from '@angular/core/testing';

import { FilterService } from './filter.service';
import { withAppTestDefaults } from '../testing/app-test-module';

describe('FilterService', () => {
  beforeEach(() => TestBed.configureTestingModule(withAppTestDefaults({})));

  it('should be created', () => {
    const service: FilterService = TestBed.inject(FilterService);
    expect(service).toBeTruthy();
  });
});
