import { TestBed, inject } from '@angular/core/testing';

import { ServicesApiService } from './services-api.service';

describe('ServicesApiService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ServicesApiService]
    });
  });

  it('should be created', inject([ServicesApiService], (service: ServicesApiService) => {
    expect(service).toBeTruthy();
  }));
});
