import { TestBed, inject } from '@angular/core/testing';

import { SchedulesService } from './schedules.service';
import { withAppTestDefaults } from '../testing/app-test-module';

describe('SchedulesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      providers: [SchedulesService]
    }));
  });

  it('should be created', inject([SchedulesService], (service: SchedulesService) => {
    expect(service).toBeTruthy();
  }));
});
