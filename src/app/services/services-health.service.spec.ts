import { TestBed, inject } from '@angular/core/testing';

import { ServicesHealthService } from './services-health.service';

describe('ServicesHealthService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ServicesHealthService]
    });
  });

  it('should be created', inject([ServicesHealthService], (service: ServicesHealthService) => {
    expect(service).toBeTruthy();
  }));
});
