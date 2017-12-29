import { TestBed, inject } from '@angular/core/testing';

import { SchedulesService } from './schedules.service';

describe('SchedulesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SchedulesService]
    });
  });

  it('should be created', inject([SchedulesService], (service: SchedulesService) => {
    expect(service).toBeTruthy();
  }));
});
