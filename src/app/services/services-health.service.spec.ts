import { TestBed, inject } from '@angular/core/testing';

import { ServicesAPIService } from './services-api.service';

describe('ServicesAPIService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ServicesAPIService]
    });
  });

  it('should be created', inject([ServicesAPIService], (service: ServicesAPIService) => {
    expect(service).toBeTruthy();
  }));
});
