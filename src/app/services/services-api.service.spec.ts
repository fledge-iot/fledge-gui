import { TestBed, inject } from '@angular/core/testing';

import { ServicesApiService } from './services-api.service';
import { withAppTestDefaults } from '../testing/app-test-module';

describe('ServicesApiService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      providers: [ServicesApiService]
    }));
  });

  it('should be created', inject([ServicesApiService], (service: ServicesApiService) => {
    expect(service).toBeTruthy();
  }));
});
