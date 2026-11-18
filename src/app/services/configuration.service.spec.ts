import { TestBed, inject } from '@angular/core/testing';

import { ConfigurationService } from './configuration.service';
import { withAppTestDefaults } from '../testing/app-test-module';

describe('ConfigurationService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      providers: [ConfigurationService]
    }));
  });

  it('should be created', inject([ConfigurationService], (service: ConfigurationService) => {
    expect(service).toBeTruthy();
  }));
});
