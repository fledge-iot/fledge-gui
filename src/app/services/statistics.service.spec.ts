import { TestBed, inject } from '@angular/core/testing';

import { StatisticsService } from './statistics.service';
import { withAppTestDefaults } from '../testing/app-test-module';

describe('StatisticsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      providers: [StatisticsService]
    }));
  });

  it('should be created', inject([StatisticsService], (service: StatisticsService) => {
    expect(service).toBeTruthy();
  }));
});
