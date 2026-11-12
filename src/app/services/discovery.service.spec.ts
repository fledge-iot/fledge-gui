import { TestBed, inject } from '@angular/core/testing';

import { DiscoveryService } from './discovery.service';
import { withAppTestDefaults } from '../testing/app-test-module';

describe('DiscoveryService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      providers: [DiscoveryService]
    }));
  });

  it('should be created', inject([DiscoveryService], (service: DiscoveryService) => {
    expect(service).toBeTruthy();
  }));
});
