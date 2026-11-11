import { TestBed, inject } from '@angular/core/testing';

import { PingService } from './ping.service';
import { withAppTestDefaults } from '../testing/app-test-module';

describe('PingService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      providers: [PingService]
    }));
  });

  it('should be created', inject([PingService], (service: PingService) => {
    expect(service).toBeTruthy();
  }));
});
